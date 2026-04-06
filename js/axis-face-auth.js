/**
 * Reconhecimento facial (webcam) — login e cadastro em Configurações.
 * Cadastro em etapas (frente / esquerda / direita / frente) com deteção de pose.
 * A câmara é só no browser (getUserMedia); o servidor Node não recebe vídeo.
 */
(function () {
    /** Erro comum de extensões do Chrome no F12 — não vem do AXIS. */
    window.addEventListener('unhandledrejection', function (ev) {
        try {
            var msg = (ev.reason && (ev.reason.message || String(ev.reason))) || '';
            if (typeof msg === 'string' && msg.indexOf('message channel closed') !== -1) {
                ev.preventDefault();
            }
        } catch (_) {}
    });

    var MODEL_BASE = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';
    var DESC_PREFIX = 'axis_face_descriptor_';
    /** Distância euclidiana face-api: mesmo rosto costuma 0,35–0,50 com webcam; subir facilita login com luz/postura diferentes. */
    var MATCH_THRESHOLD = 0.55;
    /** Só usado no fallback por votação (vários frames). */
    var MATCH_THRESHOLD_VOTE = 0.58;
    var LOGIN_BURST_COUNT = 5;
    var LOGIN_BURST_GAP_MS = 85;

    var modelsLoaded = false;
    var modelsLoadingPromise = null;
    /** Timeout ID do assistente de cadastro (um tick de cada vez — evita travar o site com setInterval). */
    var enrollWizardTimer = null;
    var enrollState = null;
    /** Traços do anel radial (UI tipo assistente). */
    var ENROLL_RADIAL_TICKS = 52;
    var enrollRadialBuilt = false;
    /** Quantos traços acendem de cada vez (±) ao mover a cabeça — “raio de pigmentação”. */
    var ENROLL_ANGLE_BIN_SPREAD = 15;
    /** Cobertura mínima do anel (0–1) para aceitar etapa “frente” pelo movimento circular (mais baixo = mais rápido). */
    var ENROLL_RING_COVER_FOR_FRONT_OK = 0.28;
    /** Pausa entre análises concluídas (ms); o próximo tick só agenda depois do anterior (sem sobreposição). */
    var ENROLL_WIZARD_TICK_MS = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 768px)').matches ? 380 : 320;
    var enrollCloseBusy = false;

    /** SSD MobileNet v1 — evita bug do TinyFaceDetector (Box com top/bottom null no F12). */
    function axisFaceSsdOpts() {
        return new faceapi.SsdMobilenetv1Options({ minConfidence: 0.38 });
    }

    /** Cadastro: deteção mais permissiva para apanhar rosto em mais condições. */
    function axisFaceSsdOptsEnroll() {
        return new faceapi.SsdMobilenetv1Options({ minConfidence: 0.25 });
    }

    function axisFaceSsdOptsEnrollLoose(minC) {
        return new faceapi.SsdMobilenetv1Options({ minConfidence: minC });
    }

    /**
     * Quando os landmarks falham, estima yaw pela posição horizontal da face no frame
     * (vídeo não espelhado no buffer — alinhado ao scaleX(-1) do CSS).
     */
    function axisFaceEnrollYawFromBox(det, vw, vh) {
        if (!det || !det.box || vw < 8 || vh < 8) return null;
        var cx = det.box.x + det.box.width / 2;
        var off = (cx - vw / 2) / Math.max(vw * 0.2, 1);
        var y = -Math.max(-1.1, Math.min(1.1, off));
        return y;
    }

    var enrollAxisCanvas = null;
    var enrollAxisCtx = null;

    function axisFaceEnrollBuildFrameFromResult(r, vw, vh) {
        if (!r || !r.detection || !r.detection.box) return null;
        var yawRaw = axisFaceComputeYawFromLandmarks(r.landmarks);
        var pitchRaw = axisFaceComputePitchFromLandmarks(r.landmarks);
        var yaw = yawRaw == null ? null : -yawRaw;
        var pitch = pitchRaw == null ? null : pitchRaw;
        if (yaw == null) {
            yaw = axisFaceEnrollYawFromBox(r.detection, vw, vh);
        }
        var sc = typeof r.detection.score === 'number' ? r.detection.score : 0.5;
        return {
            yaw: yaw,
            pitch: pitch,
            det: r.detection,
            vw: vw,
            vh: vh,
            score: sc
        };
    }

    function axisFaceEnrollTryDetectVideo(videoEl, vw, vh, minConf) {
        return faceapi
            .detectSingleFace(videoEl, axisFaceSsdOptsEnrollLoose(minConf))
            .withFaceLandmarks()
            .then(function (r) {
                return axisFaceEnrollBuildFrameFromResult(r, vw, vh);
            })
            .catch(function () {
                return null;
            });
    }

    function axisFaceEnrollTryDetectAllVideo(videoEl, vw, vh, minConf) {
        return faceapi
            .detectAllFaces(videoEl, axisFaceSsdOptsEnrollLoose(minConf))
            .withFaceLandmarks()
            .then(function (arr) {
                if (!arr || !arr.length) return null;
                var best = arr[0];
                var bi;
                var sb;
                var ss;
                for (bi = 1; bi < arr.length; bi++) {
                    sb = arr[bi].detection && typeof arr[bi].detection.score === 'number' ? arr[bi].detection.score : 0;
                    ss = best.detection && typeof best.detection.score === 'number' ? best.detection.score : 0;
                    var ab = axisFaceEnrollFaceArea(arr[bi].detection, vw, vh);
                    var asz = axisFaceEnrollFaceArea(best.detection, vw, vh);
                    if (sb > ss || (sb === ss && ab > asz)) {
                        best = arr[bi];
                    }
                }
                return axisFaceEnrollBuildFrameFromResult(best, vw, vh);
            })
            .catch(function () {
                return null;
            });
    }

    function axisFaceEnrollTryDetectCanvasScaled(videoEl, vw, vh, minConf) {
        try {
            if (!enrollAxisCanvas) {
                enrollAxisCanvas = document.createElement('canvas');
                enrollAxisCtx = enrollAxisCanvas.getContext('2d', { willReadFrequently: true });
            }
            var maxSide = 512;
            var scale = Math.min(1, maxSide / Math.max(vw, vh));
            var cw = Math.max(64, Math.round(vw * scale));
            var ch = Math.max(64, Math.round(vh * scale));
            enrollAxisCanvas.width = cw;
            enrollAxisCanvas.height = ch;
            enrollAxisCtx.drawImage(videoEl, 0, 0, cw, ch);
            return faceapi
                .detectSingleFace(enrollAxisCanvas, axisFaceSsdOptsEnrollLoose(minConf))
                .withFaceLandmarks()
                .then(function (r) {
                    if (!r || !r.detection || !r.detection.box) return null;
                    var b = r.detection.box;
                    var sx = vw / cw;
                    var sy = vh / ch;
                    var detLike = {
                        score: r.detection.score,
                        box: {
                            x: b.x * sx,
                            y: b.y * sy,
                            width: b.width * sx,
                            height: b.height * sy
                        }
                    };
                    var yawRaw = axisFaceComputeYawFromLandmarks(r.landmarks);
                    var pitchRaw = axisFaceComputePitchFromLandmarks(r.landmarks);
                    var yaw = yawRaw == null ? null : -yawRaw;
                    var pitch = pitchRaw == null ? null : pitchRaw;
                    if (yaw == null) {
                        yaw = axisFaceEnrollYawFromBox(detLike, vw, vh);
                    }
                    var sc = typeof r.detection.score === 'number' ? r.detection.score : 0.45;
                    return {
                        yaw: yaw,
                        pitch: pitch,
                        det: detLike,
                        vw: vw,
                        vh: vh,
                        score: sc
                    };
                })
                .catch(function () {
                    return null;
                });
        } catch (_) {
            return Promise.resolve(null);
        }
    }

    /** Deteção mais sensível no login (luz difícil / rosto pequeno no frame). */
    function axisFaceSsdOptsLogin() {
        return new faceapi.SsdMobilenetv1Options({ minConfidence: 0.32 });
    }

    function axisFaceEnrollFaceArea(det, vw, vh) {
        if (!det || !det.box || vw < 2 || vh < 2) return 0;
        return (det.box.width * det.box.height) / (vw * vh);
    }

    /** Limiar mínimo de viragem lateral (|yaw|). */
    var ENROLL_LATERAL_ABS = 0.022;
    /** Na 2.ª lateral: diferença mínima em relação à 1.ª (evita ficar preso no “lado oposto”). */
    var ENROLL_LATERAL_DELTA_MIN = 0.028;

    function axisFaceEnrollLateralOkFirst(ctx) {
        var y = ctx.yaw;
        if (y == null) return false;
        return Math.abs(y) >= ENROLL_LATERAL_ABS * 0.85;
    }

    function axisFaceEnrollLateralOkSecond(ctx) {
        var y = ctx.yaw;
        if (y == null) return false;
        var minTurn = ENROLL_LATERAL_ABS * 0.7;
        if (Math.abs(y) < minTurn) return false;
        var refY = ctx.firstLatYawValue;
        if (refY != null && Math.abs(y - refY) >= ENROLL_LATERAL_DELTA_MIN) {
            return true;
        }
        var prev = ctx.firstLatSign;
        if (prev == null || prev === 0) {
            return Math.abs(y) >= ENROLL_LATERAL_ABS + 0.006;
        }
        var s = y >= 0 ? 1 : -1;
        if (s !== prev) return true;
        if (refY != null && Math.abs(refY) < 0.06 && Math.abs(y) >= ENROLL_LATERAL_ABS * 1.15) {
            return true;
        }
        return false;
    }

    /**
     * ctx: { yaw, det, vw, vh } — yaw já corrigido para vídeo espelhado (scaleX -1).
     * Frente: pose neutra OU rosto grande o suficiente na imagem (evita ficar preso na etapa 1).
     */
    var ENROLL_STEPS = [
        {
            id: 'front1',
            motion: 'front',
            title: 'Mova a cabeça lentamente para completar o círculo.',
            hint: 'Boa luz de frente, rosto dentro da moldura. Em telemóvel, segure o aparelho à altura dos olhos. Os traços do anel acendem a verde à medida que percorre cada direção.',
            stableNeed: 2,
            check: function (ctx) {
                return axisFaceEnrollFrontStepOk(ctx);
            }
        },
        {
            id: 'left',
            motion: 'left',
            title: 'Vire a cabeça para um lado',
            hint: 'Gire devagar até o anel reagir. Webcam no topo do ecrã: olhe ligeiramente para o lado, sem cobrir o rosto.',
            stableNeed: 2,
            check: function (ctx) {
                return axisFaceEnrollLateralOkFirst(ctx);
            }
        },
        {
            id: 'right',
            motion: 'right',
            title: 'Agora o lado oposto',
            hint: 'Gire para o outro ombro até o anel ficar verde. Firefox, Chrome, Brave e Safari usam a mesma API; se falhar, verifique permissões da câmara.',
            stableNeed: 1,
            check: function (ctx) {
                return axisFaceEnrollLateralOkSecond(ctx);
            }
        },
        {
            id: 'front2',
            motion: 'front',
            title: 'Última leitura',
            hint: 'Complete o círculo ou fique de frente com o rosto bem visível. Mantenha o dispositivo estável 1–2 segundos.',
            stableNeed: 1,
            check: function (ctx) {
                return axisFaceEnrollFrontStepOk(ctx, true);
            }
        }
    ];

    function axisFaceEnrollRingCoverRatio(st) {
        if (!st || !st.angleCover || !st.angleCover.length) return 0;
        var on = 0;
        var i;
        for (i = 0; i < st.angleCover.length; i++) {
            if (st.angleCover[i]) on += 1;
        }
        return on / st.angleCover.length;
    }

    /** Etapas de frente: pose neutra OU rosto grande OU anel já bem percorrido em círculo. */
    function axisFaceEnrollFrontStepOk(ctx, isLastFront) {
        var y = ctx.yaw;
        var area = axisFaceEnrollFaceArea(ctx.det, ctx.vw, ctx.vh);
        var st = ctx.enrollState;
        var cover = st ? axisFaceEnrollRingCoverRatio(st) : 0;
        var needCover = isLastFront ? ENROLL_RING_COVER_FOR_FRONT_OK * 0.72 : ENROLL_RING_COVER_FOR_FRONT_OK;
        if (cover >= needCover) return true;
        if (y == null) return area >= 0.03;
        if (Math.abs(y) < (isLastFront ? 0.32 : 0.27)) return true;
        return area >= 0.038 && Math.abs(y) < (isLastFront ? 0.48 : 0.42);
    }

    /**
     * Safari (macOS/iOS) ou WebKit no iPhone — políticas Apple: getUserMedia só em contexto seguro (HTTPS).
     * Exclui Chrome/Firefox/Edge no iOS (CriOS, FxiOS, etc.).
     */
    function axisFaceIsLikelySafari() {
        try {
            var ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? String(navigator.userAgent) : '';
            if (/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua)) return false;
            if (/Android/i.test(ua)) return false;
            if (/iP(hone|ad|od)/i.test(ua) && /AppleWebKit/i.test(ua)) return true;
            return /Safari/i.test(ua) && !/Chrome|Chromium|Edg|OPR|Brave/i.test(ua);
        } catch (_) {
            return false;
        }
    }

    function axisFaceToastPermCamera(context) {
        var msg;
        if (axisFaceIsMobileUserAgent()) {
            msg = axisFaceIsLikelySafari()
                ? 'Safari (Apple): se pedir, toque em «Permitir». Com o site em http:// (sem cadeado), a Apple bloqueia a câmara — configure HTTPS no servidor. Chrome no PC e Safari no iPhone não partilham o cadastro facial (cada um guarda só no seu navegador).'
                : 'O browser vai pedir acesso à câmara — toque em «Permitir». No telemóvel, o site precisa de HTTPS (exceto localhost).';
        } else if (axisFaceIsLikelySafari()) {
            msg = 'Safari: permita a câmara se o browser pedir. Em http:// sem SSL a câmara pode estar bloqueada (política Apple/WebKit).';
        } else {
            msg = 'O Chrome vai pedir acesso à câmara — escolha «Permitir» na barra do site (ícone de câmada ou cadeado).';
        }
        if (typeof showToast === 'function') {
            showToast(msg, 'info', axisFaceIsLikelySafari() && axisFaceIsMobileUserAgent() ? 8500 : 5500);
        }
        if (context === 'enroll') {
            axisFaceSetStatus('face-enroll-status', msg);
        } else {
            axisFaceSetStatus('face-login-status', msg);
        }
    }

    function axisFaceIsMobileUserAgent() {
        try {
            if (navigator.userAgentData && typeof navigator.userAgentData.mobile === 'boolean' && navigator.userAgentData.mobile) {
                return true;
            }
        } catch (_) {}
        try {
            var ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? String(navigator.userAgent) : '';
            var uaL = ua.toLowerCase();
            var isIPad = /ipad/i.test(uaL) || (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);
            if (isIPad) return true;
            return /mobi|iphone|ipod|android|webos|blackberry|iemobile|opera mini|wpdesktop/i.test(uaL);
        } catch (_) {
            return false;
        }
    }

    /**
     * Aviso quando o site não está em contexto seguro (ex.: http://IP público).
     * Não bloqueia a tentativa — alguns browsers ainda expõem API; em telemóveis costuma falhar até haver HTTPS.
     */
    function axisFaceWarnIfInsecureCamera(statusId) {
        try {
            if (window.isSecureContext) return;
            var proto = String(window.location.protocol || '');
            if (proto === 'file:') return;
            if (proto !== 'http:') return;
            var msg;
            if (axisFaceIsMobileUserAgent() && axisFaceIsLikelySafari()) {
                msg =
                    'Política Apple (Safari): com http:// o iPhone não permite câmara na Web. Configure SSL (https) no servidor — aí o Safari aceita. O cadastro no Chrome do PC não aparece aqui: dados ficam só dentro de cada navegador.';
            } else if (axisFaceIsMobileUserAgent()) {
                msg =
                    'Sem HTTPS, muitos telemóveis bloqueiam a câmara neste endereço. Com SSL (https://) no servidor, o facial funciona. Pode tentar «Abrir câmera» mesmo assim.';
            } else {
                msg = 'Acesso por HTTP sem SSL: se a câmara falhar, use HTTPS ou localhost.';
            }
            if (typeof showToast === 'function') {
                showToast(msg, 'warning', axisFaceIsMobileUserAgent() ? 9000 : 5000);
            } else if (statusId) {
                axisFaceSetStatus(statusId, msg);
            }
        } catch (_) {}
    }

    function axisFaceTranslateCamError(err) {
        if (!err) return 'Não foi possível abrir a câmara.';
        var n = err.name || '';
        if (n === 'NotAllowedError' || n === 'PermissionDeniedError') {
            if (axisFaceIsLikelySafari()) {
                return 'Permissão de câmara negada. No iPhone: Ajustes → Safari → a página do AXIS → Câmara → Permitir. Se o site for http:// sem SSL, a Apple pode recusar na mesma — use HTTPS.';
            }
            return 'Permissão negada. No Chrome: ícone 🔒 ou ⊕ na barra de endereços → Câmara → Permitir. Recarregue a página se necessário.';
        }
        if (n === 'NotFoundError' || n === 'DevicesNotFoundError') {
            return 'Nenhuma câmara detetada. Ligue a webcam ou escolha outra câmara nas definições do sistema.';
        }
        if (n === 'NotReadableError' || n === 'TrackStartError') {
            return 'A câmara está ocupada (Teams, Zoom, etc.). Feche essas apps e tente de novo.';
        }
        if (n === 'OverconstrainedError') {
            return 'A câmara não aceita o modo pedido (resolução ou câmara frontal). O AXIS tentará outro perfil automaticamente; se persistir, escolha outra câmara nas definições do navegador (Chrome, Firefox, Edge, Brave ou Safari).';
        }
        if (n === 'NO_API' || n === 'SecurityError') {
            if (axisFaceIsMobileUserAgent() && axisFaceIsLikelySafari()) {
                return 'Safari na Apple: a câmara na Web exige site em HTTPS (cadeado) ou localhost — não http:// com IP. Isto cumpre a política de segurança da Apple, não é um erro do AXIS. Com SSL ativo, volte a «Abrir câmera».';
            }
            if (axisFaceIsMobileUserAgent()) {
                return 'No telemóvel, a câmara só é permitida em HTTPS (certificado SSL) ou em localhost. Configure https no servidor ou use o domínio com SSL.';
            }
            return 'Este browser não expõe a câmara nesta página (HTTPS ou localhost).';
        }
        return err.message || 'Erro ao abrir a câmara.';
    }

    function axisFaceGetUserMediaStream() {
        var isMobile = axisFaceIsMobileUserAgent();
        var candidates = [
            {
                video: {
                    facingMode: { ideal: 'user' },
                    width: { ideal: isMobile ? 1280 : 960, max: 1920 },
                    height: { ideal: isMobile ? 720 : 720, max: 1080 },
                    frameRate: { ideal: 30, max: 60 }
                },
                audio: false
            },
            {
                video: {
                    facingMode: 'user',
                    width: { min: 320, ideal: 640 },
                    height: { min: 240, ideal: 480 },
                    frameRate: { ideal: 24, max: 30 }
                },
                audio: false
            },
            { video: { facingMode: 'user' }, audio: false },
            {
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            },
            { video: { facingMode: 'environment' }, audio: false },
            {
                video: {
                    width: { ideal: 640, max: 1280 },
                    height: { ideal: 480, max: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: false
            },
            { video: true, audio: false }
        ];
        function tryModern(i) {
            if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
                return null;
            }
            if (i >= candidates.length) {
                return Promise.reject({ name: 'NO_API' });
            }
            return navigator.mediaDevices.getUserMedia(candidates[i]).catch(function (err) {
                if (i < candidates.length - 1) {
                    return tryModern(i + 1);
                }
                return Promise.reject(err);
            });
        }
        var chain = tryModern(0);
        if (chain) return chain;
        var legacy = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        if (!legacy) {
            return Promise.reject({ name: 'NO_API' });
        }
        return new Promise(function (resolve, reject) {
            try {
                legacy.call(navigator, { video: true, audio: false }, resolve, reject);
            } catch (e) {
                reject(e);
            }
        });
    }

    function axisFaceStopStream(videoEl) {
        if (!videoEl) return;
        var s = videoEl.srcObject;
        if (s && s.getTracks) {
            s.getTracks().forEach(function (t) {
                try { t.stop(); } catch (_) {}
            });
        }
        videoEl.srcObject = null;
    }

    function axisFaceEnsureModels() {
        if (modelsLoaded) return Promise.resolve(true);
        if (typeof faceapi === 'undefined') {
            return Promise.resolve(false);
        }
        if (modelsLoadingPromise) return modelsLoadingPromise;
        function axisFaceYieldMainThread() {
            return new Promise(function (resolve) {
                if (typeof requestAnimationFrame === 'function') {
                    requestAnimationFrame(function () {
                        setTimeout(resolve, 0);
                    });
                } else {
                    setTimeout(resolve, 0);
                }
            });
        }
        modelsLoadingPromise = Promise.resolve()
            .then(function () {
                try {
                    if (faceapi.tf && typeof faceapi.tf.setBackend === 'function') {
                        return faceapi.tf.setBackend('cpu').catch(function () {});
                    }
                } catch (_) {}
            })
            .then(function () {
                return faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_BASE);
            })
            .then(axisFaceYieldMainThread)
            .then(function () { return faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_BASE); })
            .then(axisFaceYieldMainThread)
            .then(function () { return faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_BASE); })
            .then(function () {
                modelsLoaded = true;
                modelsLoadingPromise = null;
                return true;
            })
            .catch(function (e) {
                console.error('AXIS face models:', e);
                modelsLoadingPromise = null;
                return false;
            });
        return modelsLoadingPromise;
    }

    /**
     * @param {HTMLVideoElement} videoEl
     * @param {{ visibleBeforePlay?: boolean }} [opts] — mostrar o vídeo antes de play() (evita feed preto em mobile / Chrome).
     */
    function axisFaceStopHeldStream(stream) {
        if (stream && stream.getTracks) {
            stream.getTracks().forEach(function (t) {
                try {
                    t.stop();
                } catch (_) {}
            });
        }
    }

    /** Liga um stream já obtido ao vídeo (play). Usado após pedir getUserMedia no mesmo clique do utilizador. */
    function axisFaceApplyStreamToVideo(videoEl, stream, opts) {
        opts = opts || {};
        axisFaceStopStream(videoEl);
        try {
            videoEl.setAttribute('playsinline', '');
            videoEl.setAttribute('webkit-playsinline', '');
            videoEl.muted = true;
        } catch (_) {}
        if (opts.visibleBeforePlay) {
            try {
                videoEl.style.display = 'block';
                videoEl.style.visibility = 'visible';
            } catch (_) {}
        }
        videoEl.srcObject = stream;
        return new Promise(function (resolve) {
            function tryPlay() {
                var p = videoEl.play();
                if (p != null && typeof p.then === 'function') {
                    p.then(function () {}).catch(function () {});
                }
            }
            videoEl.onloadedmetadata = function () {
                tryPlay();
            };
            tryPlay();
            setTimeout(resolve, 900);
        });
    }

    function axisFaceStartWebcam(videoEl, opts) {
        return axisFaceGetUserMediaStream().then(function (stream) {
            return axisFaceApplyStreamToVideo(videoEl, stream, opts);
        });
    }

    /** Yaw aproximado: posição do nariz vs. eixo dos olhos (imagem da webcam). */
    function axisFaceComputeYawFromLandmarks(landmarks) {
        if (!landmarks || !landmarks.positions) return null;
        var pts = landmarks.positions;
        if (!pts[30] || !pts[36] || !pts[45]) return null;
        var lx = (pts[36].x + pts[39].x) / 2;
        var rx = (pts[42].x + pts[45].x) / 2;
        var noseX = pts[30].x;
        var eyeMid = (lx + rx) / 2;
        var interocular = Math.max(8, Math.abs(rx - lx));
        return (noseX - eyeMid) / interocular;
    }

    /** Pitch aproximado (cima/baixo) para mapear movimento em círculo no anel. */
    function axisFaceComputePitchFromLandmarks(landmarks) {
        if (!landmarks || !landmarks.positions) return null;
        var pts = landmarks.positions;
        if (!pts[30] || !pts[36] || !pts[45] || !pts[8]) return null;
        var eyeY = (pts[36].y + pts[45].y) / 2;
        var noseY = pts[30].y;
        var chinY = pts[8].y;
        var topY = pts[27] ? pts[27].y : eyeY - 24;
        var faceLen = Math.max(14, chinY - topY);
        return (noseY - eyeY) / faceLen;
    }

    function axisFaceVideoReady(videoEl) {
        return !!(videoEl && videoEl.srcObject && videoEl.readyState >= 2 &&
            videoEl.videoWidth >= 48 && videoEl.videoHeight >= 48);
    }

    function axisFaceExtractDescriptor(videoEl, ssdOpts) {
        if (!axisFaceVideoReady(videoEl)) {
            return Promise.resolve(null);
        }
        var opts = ssdOpts || axisFaceSsdOpts();
        return faceapi
            .detectSingleFace(videoEl, opts)
            .withFaceLandmarks()
            .withFaceDescriptor()
            .then(function (r) {
                return r ? r.descriptor : null;
            })
            .catch(function () {
                return null;
            });
    }

    function axisFaceExtractDescriptorReliable(videoEl) {
        return axisFaceExtractDescriptor(videoEl)
            .then(function (d) {
                if (d) return d;
                return axisFaceExtractDescriptor(videoEl, axisFaceSsdOptsEnroll());
            })
            .then(function (d) {
                if (d) return d;
                return axisFaceExtractDescriptor(videoEl, axisFaceSsdOptsLogin());
            });
    }

    /**
     * Várias leituras seguidas (login): reduz ruído de um único frame.
     * Resolve com array de descriptors (pode ter menos que count se algumas falharem).
     */
    function axisFaceCollectDescriptorBurst(videoEl, count, gapMs, ssdOpts) {
        count = count || LOGIN_BURST_COUNT;
        gapMs = gapMs == null ? LOGIN_BURST_GAP_MS : gapMs;
        var opts = ssdOpts || axisFaceSsdOptsLogin();
        var out = [];
        function step(i) {
            if (i >= count) return Promise.resolve(out);
            return faceapi
                .detectSingleFace(videoEl, opts)
                .withFaceLandmarks()
                .withFaceDescriptor()
                .then(function (r) {
                    if (r && r.descriptor) out.push(r.descriptor);
                })
                .catch(function () {})
                .then(function () {
                    if (i + 1 >= count) return out;
                    return new Promise(function (res) {
                        setTimeout(res, gapMs);
                    }).then(function () {
                        return step(i + 1);
                    });
                });
        }
        return step(0);
    }

    function axisFaceBestMatch(queryDesc, logins, threshold) {
        var thr = threshold != null ? threshold : MATCH_THRESHOLD;
        var bestLogin = null;
        var bestDist = Infinity;
        for (var i = 0; i < logins.length; i++) {
            var ref = axisFaceGetStoredDescriptor(logins[i]);
            if (!ref) continue;
            var d = faceapi.euclideanDistance(queryDesc, ref);
            if (d < bestDist) {
                bestDist = d;
                bestLogin = logins[i];
            }
        }
        if (bestLogin == null || bestDist > thr) return null;
        return { login: bestLogin, distance: bestDist };
    }

    /** Se a média falhar, vota por frame: exige maioria com limiar mais alto. */
    function axisFaceBestMatchVote(samples, logins) {
        if (!samples || samples.length === 0) return null;
        var need = Math.max(2, Math.ceil(samples.length / 2));
        var votes = {};
        var i;
        var j;
        for (i = 0; i < samples.length; i++) {
            var m = axisFaceBestMatch(samples[i], logins, MATCH_THRESHOLD_VOTE);
            if (m) votes[m.login] = (votes[m.login] || 0) + 1;
        }
        var winner = null;
        var maxC = 0;
        for (j in votes) {
            if (votes[j] > maxC) {
                maxC = votes[j];
                winner = j;
            }
        }
        if (!winner || maxC < need) return null;
        var bestDist = Infinity;
        for (i = 0; i < samples.length; i++) {
            var ref = axisFaceGetStoredDescriptor(winner);
            if (!ref) continue;
            var d = faceapi.euclideanDistance(samples[i], ref);
            if (d < bestDist) bestDist = d;
        }
        return { login: winner, distance: bestDist };
    }

    function axisFaceDetectLandmarksOnly(videoEl) {
        if (!axisFaceVideoReady(videoEl)) {
            return Promise.resolve(null);
        }
        return faceapi
            .detectSingleFace(videoEl, axisFaceSsdOpts())
            .withFaceLandmarks()
            .then(function (r) {
                return r ? r.landmarks : null;
            })
            .catch(function () {
                return null;
            });
    }

    /**
     * Várias estratégias por frame: SSD no vídeo (vários limiares), maior rosto se houver vários,
     * e cópia redimensionada para canvas (o modelo costuma estabilizar com ~416 px).
     */
    function axisFaceEnrollDetectFrame(videoEl) {
        if (!axisFaceVideoReady(videoEl)) {
            return Promise.resolve(null);
        }
        var vw = videoEl.videoWidth;
        var vh = videoEl.videoHeight;
        return axisFaceEnrollTryDetectCanvasScaled(videoEl, vw, vh, 0.2)
            .then(function (f) {
                if (f && f.det) return f;
                return axisFaceEnrollTryDetectCanvasScaled(videoEl, vw, vh, 0.12);
            })
            .then(function (f) {
                if (f && f.det) return f;
                return axisFaceEnrollTryDetectCanvasScaled(videoEl, vw, vh, 0.07);
            })
            .then(function (f) {
                if (f && f.det) return f;
                return axisFaceEnrollTryDetectVideo(videoEl, vw, vh, 0.24);
            })
            .then(function (f) {
                if (f && f.det) return f;
                return axisFaceEnrollTryDetectVideo(videoEl, vw, vh, 0.14);
            })
            .then(function (f) {
                if (f && f.det) return f;
                return axisFaceEnrollTryDetectAllVideo(videoEl, vw, vh, 0.11);
            });
    }

    /** Marca segmentos do anel conforme a direção da cabeça (círculo). */
    function axisFaceEnrollMarkPoseCoverage(st, yaw, pitch, det, vw, vh, score) {
        if (!st || !st.angleCover || !st.angleCover.length) return;
        var area = axisFaceEnrollFaceArea(det, vw, vh);
        var sc = score == null ? 0 : score;
        if (area < 0.012 && sc < 0.16) return;
        var y = yaw == null ? axisFaceEnrollYawFromBox(det, vw, vh) : yaw;
        if (y == null) y = 0;
        y = Math.max(-0.75, Math.min(0.75, y));
        var p = pitch == null ? 0 : Math.max(-0.55, Math.min(0.55, pitch));
        if (p === 0 && y === 0 && area >= 0.025) {
            p = 0.08;
        }
        var phi = Math.atan2(p * 1.2, y || 0.001);
        var N = st.angleCover.length;
        var bin = Math.floor(((phi + Math.PI) / (2 * Math.PI)) * N);
        bin = ((bin % N) + N) % N;
        var spread = ENROLL_ANGLE_BIN_SPREAD;
        var b;
        for (b = -spread; b <= spread; b++) {
            var idx = (bin + b + N * 20) % N;
            st.angleCover[idx] = true;
        }
    }

    function axisFaceAverageDescriptors(arrays) {
        if (!arrays || arrays.length === 0) return null;
        var dim = arrays[0].length;
        var out = new Float32Array(dim);
        var j;
        var i;
        for (i = 0; i < dim; i++) {
            var s = 0;
            for (j = 0; j < arrays.length; j++) {
                s += arrays[j][i];
            }
            out[i] = s / arrays.length;
        }
        var norm = 0;
        for (i = 0; i < dim; i++) {
            norm += out[i] * out[i];
        }
        norm = Math.sqrt(norm) || 1;
        for (i = 0; i < dim; i++) {
            out[i] /= norm;
        }
        return out;
    }

    function axisFaceListEnrolledLogins() {
        var out = [];
        try {
            for (var i = 0; i < localStorage.length; i++) {
                var k = localStorage.key(i);
                if (k && k.indexOf(DESC_PREFIX) === 0) {
                    out.push(k.slice(DESC_PREFIX.length));
                }
            }
        } catch (_) {}
        return out;
    }

    function axisFaceGetStoredDescriptor(loginCanon) {
        try {
            var raw = localStorage.getItem(DESC_PREFIX + loginCanon);
            if (!raw) return null;
            var arr = JSON.parse(raw);
            if (!Array.isArray(arr) || arr.length < 64) return null;
            return new Float32Array(arr);
        } catch (_) {
            return null;
        }
    }

    function axisFaceLoadUserDb(loginCanon) {
        var dbKey = 'db_' + loginCanon;
        var dbRaw = localStorage.getItem(dbKey);
        var chaveAntiga = null;
        if (!dbRaw) {
            var allKeys = Object.keys(localStorage).filter(function (k) { return k.indexOf('db_') === 0; });
            for (var i = 0; i < allKeys.length; i++) {
                var k = allKeys[i];
                if (typeof axisLoginCanonico === 'function' && axisLoginCanonico(k.replace('db_', '')) === loginCanon) {
                    chaveAntiga = k;
                    dbRaw = localStorage.getItem(k);
                    break;
                }
            }
        }
        if (!dbRaw) return null;
        try {
            var db = JSON.parse(dbRaw);
            return { db: db, dbKey: dbKey, chaveAntiga: chaveAntiga };
        } catch (_) {
            return null;
        }
    }

    /**
     * Copia descritor do perfil (db_*) para a chave usada pelo login facial.
     * Chamado após pull do servidor e no arranque — permite o mesmo mapa em vários dispositivos quando há API /api/persist/browser-users.
     */
    function axisFaceHydrateDescriptorsFromDbs() {
        try {
            var ki;
            for (ki = 0; ki < localStorage.length; ki++) {
                var k = localStorage.key(ki);
                if (!k || k.indexOf('db_') !== 0) continue;
                var raw = localStorage.getItem(k);
                if (!raw) continue;
                var db;
                try {
                    db = JSON.parse(raw);
                } catch (e1) {
                    continue;
                }
                if (!db || !Array.isArray(db.axisFaceDescriptor) || db.axisFaceDescriptor.length < 64) continue;
                var loginPart = k.slice(3);
                var canon =
                    typeof axisLoginCanonico === 'function' ? axisLoginCanonico(loginPart) : String(loginPart).toLowerCase().replace(/\s+/g, '_');
                if (!canon) continue;
                try {
                    localStorage.setItem(DESC_PREFIX + canon, JSON.stringify(db.axisFaceDescriptor));
                } catch (e2) {}
            }
        } catch (e0) {}
        try {
            if (typeof window.axisFaceRefreshSettingsLabel === 'function') {
                window.axisFaceRefreshSettingsLabel();
            }
        } catch (e3) {}
    }

    function axisFaceMergeDescriptorIntoUserDb(loginCanon, mergedFloat32) {
        if (!loginCanon || !mergedFloat32) return false;
        var pack = axisFaceLoadUserDb(loginCanon);
        if (!pack || !pack.db || typeof pack.db !== 'object') return false;
        var db = Object.assign({}, pack.db);
        db.axisFaceDescriptor = Array.prototype.slice.call(mergedFloat32);
        var storageKey = pack.chaveAntiga || pack.dbKey;
        try {
            localStorage.setItem(storageKey, JSON.stringify(db));
        } catch (e) {
            return false;
        }
        if (typeof window.axisPushUserToServer === 'function') {
            window.axisPushUserToServer(loginCanon, db).catch(function () {});
        }
        return true;
    }

    function axisFaceClearDescriptorFromUserDb(loginCanon) {
        var pack = axisFaceLoadUserDb(loginCanon);
        if (!pack || !pack.db || typeof pack.db !== 'object') return;
        var db = Object.assign({}, pack.db);
        delete db.axisFaceDescriptor;
        var storageKey = pack.chaveAntiga || pack.dbKey;
        try {
            localStorage.setItem(storageKey, JSON.stringify(db));
        } catch (e) {
            return;
        }
        if (typeof window.axisPushUserToServer === 'function') {
            window.axisPushUserToServer(loginCanon, db).catch(function () {});
        }
    }

    function axisFaceSetStatus(id, text) {
        var el = document.getElementById(id);
        if (el) el.textContent = text || '';
    }

    function axisFaceGetLoginCanonico() {
        var login = '';
        try {
            login = localStorage.getItem('current_user_login') || '';
        } catch (_) {}
        if (typeof getTotpLoginNormalized === 'function') {
            login = getTotpLoginNormalized() || login;
        }
        if (typeof axisLoginCanonico === 'function') {
            login = axisLoginCanonico(login);
        }
        return login;
    }

    window.axisFaceRefreshSettingsLabel = function () {
        var login = axisFaceGetLoginCanonico();
        var has = login && axisFaceGetStoredDescriptor(login);
        var el = document.getElementById('face-enroll-status-short');
        if (el) {
            el.textContent = has
                ? 'Rosto associado a esta conta neste navegador.'
                : 'Sem rosto cadastrado neste navegador — use «Abrir câmera» abaixo.';
        }
    };

    /** Fecha câmara de login e repõe botões (evita UI presa após mudar de ecrã). */
    function axisFaceCleanupLoginSession() {
        var lv = document.getElementById('face-login-video');
        axisFaceStopStream(lv);
        if (lv) lv.style.display = 'none';
        var fls = document.getElementById('face-login-start');
        var flc = document.getElementById('face-login-capture');
        if (fls) fls.disabled = false;
        if (flc) flc.disabled = true;
        axisFaceSetStatus('face-login-status', '');
    }

    /** Para assistente, modal e stream de cadastro facial. */
    function axisFaceCleanupEnrollSession() {
        enrollCloseBusy = false;
        axisFaceEnrollStopWizard();
        var ev = document.getElementById('face-enroll-video');
        axisFaceStopStream(ev);
        if (ev) ev.style.display = 'none';
        axisFaceCloseEnrollModal();
        var es = document.getElementById('face-enroll-start');
        if (es) es.disabled = false;
        var ring = document.getElementById('face-enroll-ring');
        if (ring) ring.classList.remove('face-enroll-ring-ok');
        axisFaceEnrollResetAppleUi();
        axisFaceSetStatus('face-enroll-status', '');
    }

    /**
     * Chamado ao navegar para outra página: liberta câmaras e repõe botões.
     * Não substitui o Face ID da Apple; mantém face-api.js (modelos via CDN) estável no SPA.
     */
    function axisFaceCleanupForNavigation() {
        axisFaceCleanupEnrollSession();
        axisFaceCleanupLoginSession();
    }

    window.axisFaceCleanupLoginSession = axisFaceCleanupLoginSession;
    window.axisFaceCleanupEnrollSession = axisFaceCleanupEnrollSession;
    window.axisFaceCleanupForNavigation = axisFaceCleanupForNavigation;

    function axisFaceIsStillOnSettingsPage() {
        var cur = '';
        try {
            cur = document.body.getAttribute('data-current-page') || '';
        } catch (_) {}
        if (cur === 'page-configuracoes') return true;
        var h = (window.location.hash || '').replace(/^#\/?/, '').split('?')[0];
        return h === 'page-configuracoes';
    }

    function axisFaceEnrollResetToIntroPhase() {
        var modal = document.getElementById('modal-face-enroll');
        if (modal) modal.classList.remove('face-enroll-fid--scan');
        var intro = document.getElementById('face-enroll-phase-intro');
        var scan = document.getElementById('face-enroll-phase-scan');
        if (intro) intro.removeAttribute('hidden');
        if (scan) scan.setAttribute('hidden', 'hidden');
        var graphic = document.getElementById('face-enroll-fid-intro-graphic');
        if (graphic) graphic.style.display = '';
        var vid = document.getElementById('face-enroll-video');
        if (vid && !vid.srcObject) vid.style.display = 'none';
        var fidStart = document.getElementById('face-enroll-fid-start');
        if (fidStart) fidStart.disabled = false;
    }

    function axisFaceEnrollRevertToIntroAfterFail() {
        axisFaceEnrollResetToIntroPhase();
        var vid = document.getElementById('face-enroll-video');
        axisFaceStopStream(vid);
        if (vid) vid.style.display = 'none';
    }

    function axisFaceOpenEnrollModal() {
        var m = document.getElementById('modal-face-enroll');
        if (m) m.style.display = 'flex';
        document.body.classList.add('axis-face-enroll-modal-open');
        axisFaceEnrollResetToIntroPhase();
        axisFaceEnrollEnsureRadialSvg();
        axisFaceEnrollResetAppleUi();
    }

    function axisFaceCloseEnrollModal() {
        var m = document.getElementById('modal-face-enroll');
        if (m) m.style.display = 'none';
        document.body.classList.remove('axis-face-enroll-modal-open');
        axisFaceEnrollResetToIntroPhase();
        axisFaceEnrollResetAppleUi();
        var sb = document.getElementById('face-enroll-start');
        if (sb) sb.disabled = false;
    }

    function axisFaceEnrollEnsureRadialSvg() {
        var svg = document.getElementById('face-enroll-radial-svg');
        if (!svg || enrollRadialBuilt) return;
        var ns = 'http://www.w3.org/2000/svg';
        var i;
        var ang;
        var r0 = 0.68;
        var r1 = 0.98;
        for (i = 0; i < ENROLL_RADIAL_TICKS; i++) {
            ang = (i / ENROLL_RADIAL_TICKS) * 2 * Math.PI - Math.PI / 2;
            var x0 = Math.cos(ang) * r0;
            var y0 = Math.sin(ang) * r0;
            var x1 = Math.cos(ang) * r1;
            var y1 = Math.sin(ang) * r1;
            var line = document.createElementNS(ns, 'line');
            line.setAttribute('x1', String(x0));
            line.setAttribute('y1', String(y0));
            line.setAttribute('x2', String(x1));
            line.setAttribute('y2', String(y1));
            line.setAttribute('class', 'face-enroll-radial-tick');
            svg.appendChild(line);
        }
        enrollRadialBuilt = true;
    }

    /** Acende traços por cobertura angular (círculo) e/ou progresso sequencial do assistente. */
    function axisFaceEnrollSyncRadialDisplay(st, stepIndex, poseOk) {
        axisFaceEnrollEnsureRadialSvg();
        var svg = document.getElementById('face-enroll-radial-svg');
        if (!svg) return;
        var ticks = svg.querySelectorAll('.face-enroll-radial-tick');
        var nTicks = ticks.length;
        if (!nTicks) return;
        var seqP = 0;
        if (st && stepIndex != null && ENROLL_STEPS[stepIndex]) {
            var step = ENROLL_STEPS[stepIndex];
            var nSt = ENROLL_STEPS.length;
            seqP = st.stepIndex / nSt;
            if (poseOk && step.stableNeed) {
                seqP += (st.stable / step.stableNeed) / nSt;
            }
            seqP = Math.min(1, seqP);
        }
        var seqLit = Math.floor(seqP * nTicks);
        var cov = st && st.angleCover;
        var j;
        for (j = 0; j < nTicks; j++) {
            var covered = cov && cov[j];
            var seqOn = j < seqLit;
            ticks[j].classList.toggle('face-enroll-radial-tick--on', !!(covered || seqOn));
        }
    }

    function axisFaceEnrollSetRadialPoseOk(on) {
        var svg = document.getElementById('face-enroll-radial-svg');
        if (!svg) return;
        svg.classList.toggle('face-enroll-radial--pose-ok', !!on);
    }

    function axisFaceEnrollResetAppleUi() {
        axisFaceEnrollSetRadialPoseOk(false);
        axisFaceEnrollEnsureRadialSvg();
        var svg = document.getElementById('face-enroll-radial-svg');
        if (!svg) return;
        var ticks = svg.querySelectorAll('.face-enroll-radial-tick');
        var i;
        for (i = 0; i < ticks.length; i++) {
            ticks[i].classList.remove('face-enroll-radial-tick--on');
        }
    }

    function axisFaceEnrollUpdateAppleRadial(st, stepIndex, poseOk) {
        if (!st || stepIndex == null || !ENROLL_STEPS[stepIndex]) {
            axisFaceEnrollSyncRadialDisplay(null, 0, false);
            axisFaceEnrollSetRadialPoseOk(false);
            return;
        }
        axisFaceEnrollSyncRadialDisplay(st, stepIndex, poseOk);
        axisFaceEnrollSetRadialPoseOk(!!poseOk);
    }

    function axisFaceBuildDots(stepIndex) {
        var wrap = document.getElementById('face-enroll-dots');
        if (!wrap) return;
        wrap.innerHTML = '';
        for (var i = 0; i < ENROLL_STEPS.length; i++) {
            var sp = document.createElement('span');
            if (i < stepIndex) sp.className = 'done';
            else if (i === stepIndex) sp.className = 'active';
            wrap.appendChild(sp);
        }
        wrap.setAttribute('aria-valuenow', String(stepIndex + 1));
    }

    function axisFaceUpdateStepUi(stepIndex, submsg, poseOk) {
        var step = ENROLL_STEPS[stepIndex];
        var t = document.getElementById('face-enroll-step-title');
        var h = document.getElementById('face-enroll-step-hint');
        var p = document.getElementById('face-enroll-progress-label');
        var ov = document.getElementById('face-enroll-overlay');
        if (ov && step && step.motion) ov.setAttribute('data-motion', step.motion);
        if (t && step) {
            t.textContent = step.title;
            t.classList.remove('face-enroll-step-title-anim');
            void t.offsetWidth;
            t.classList.add('face-enroll-step-title-anim');
        }
        if (h && step) h.textContent = step.hint;
        if (p) p.textContent = submsg || ('Etapa ' + (stepIndex + 1) + ' de ' + ENROLL_STEPS.length);
        axisFaceBuildDots(stepIndex);
        var pk = poseOk;
        if (typeof pk === 'undefined') {
            pk = false;
        }
        axisFaceEnrollUpdateAppleRadial(enrollState, stepIndex, pk);
    }

    function axisFaceEnrollStopWizard() {
        if (enrollWizardTimer) {
            clearTimeout(enrollWizardTimer);
            enrollWizardTimer = null;
        }
        enrollState = null;
        var ring = document.getElementById('face-enroll-ring');
        if (ring) ring.classList.remove('face-enroll-ring-ok');
    }

    function axisFaceEnrollScheduleNextTick() {
        if (enrollWizardTimer) {
            clearTimeout(enrollWizardTimer);
            enrollWizardTimer = null;
        }
        if (!enrollState) return;
        enrollWizardTimer = setTimeout(function () {
            enrollWizardTimer = null;
            axisFaceEnrollWizardTick();
        }, ENROLL_WIZARD_TICK_MS);
    }

    function axisFaceEnrollWizardTick() {
        if (!enrollState) return;
        if (enrollState.pendingCapture) {
            axisFaceEnrollScheduleNextTick();
            return;
        }
        var videoEl = document.getElementById('face-enroll-video');
        if (!videoEl || !videoEl.srcObject) {
            axisFaceEnrollStopWizard();
            return;
        }
        var st = enrollState;
        var step = ENROLL_STEPS[st.stepIndex];
        if (!step) {
            axisFaceEnrollStopWizard();
            return;
        }

        axisFaceEnrollDetectFrame(videoEl)
            .then(function (frame) {
                if (!frame || !frame.det) {
                    st.noFaceTicks = (st.noFaceTicks || 0) + 1;
                    var ring0 = document.getElementById('face-enroll-ring');
                    if (ring0) ring0.classList.remove('face-enroll-ring-ok');
                    if (st.noFaceTicks > 45) {
                        axisFaceSetStatus(
                            'face-enroll-status',
                            'Rosto não detetado há algum tempo. Melhore a luz ou aproxime-se.'
                        );
                    }
                    axisFaceEnrollUpdateAppleRadial(st, st.stepIndex, false);
                    return;
                }
                st.noFaceTicks = 0;
                axisFaceEnrollMarkPoseCoverage(
                    st,
                    frame.yaw,
                    frame.pitch,
                    frame.det,
                    frame.vw,
                    frame.vh,
                    frame.score
                );
                var ctx = {
                    yaw: frame.yaw,
                    det: frame.det,
                    vw: frame.vw,
                    vh: frame.vh,
                    firstLatSign: st.firstLatSign,
                    firstLatYawValue: st.firstLatYawValue,
                    enrollState: st
                };
                var ok = step.check(ctx);
                var ring = document.getElementById('face-enroll-ring');
                if (ring) {
                    if (ok) ring.classList.add('face-enroll-ring-ok');
                    else ring.classList.remove('face-enroll-ring-ok');
                }
                if (ok) {
                    st.stable += 1;
                    var arBoost = axisFaceEnrollFaceArea(frame.det, frame.vw, frame.vh);
                    var scBoost = frame.score != null ? frame.score : 0;
                    if (
                        step.stableNeed >= 2 &&
                        arBoost >= 0.062 &&
                        scBoost >= 0.4 &&
                        st.stable < step.stableNeed
                    ) {
                        st.stable += 1;
                    }
                } else {
                    st.stable = 0;
                }
                var submsgUi;
                if (ok) {
                    submsgUi = 'Mantenha… ' + st.stable + '/' + step.stableNeed;
                } else if (step.id === 'front1' || step.id === 'front2') {
                    var cr = Math.round(axisFaceEnrollRingCoverRatio(st) * 100);
                    submsgUi =
                        'Gire a cabeça em círculo — anel ~' +
                        cr +
                        '%. Também pode ficar de frente com o rosto bem enquadrado.';
                } else if (step.id === 'right') {
                    submsgUi =
                        'Gire a cabeça para o outro lado do que no passo anterior (ombro contrário) até a moldura ficar verde.';
                } else {
                    submsgUi = 'Ajuste a posição da cabeça.';
                }
                axisFaceUpdateStepUi(st.stepIndex, submsgUi, ok);

                if (st.stable >= step.stableNeed) {
                    st.stable = 0;
                    st.pendingCapture = true;
                    if (step.id === 'left' && frame.yaw != null) {
                        st.firstLatSign = frame.yaw >= 0 ? 1 : -1;
                        st.firstLatYawValue = frame.yaw;
                    }
                    axisFaceExtractDescriptorReliable(videoEl)
                        .then(function (desc) {
                            if (enrollState !== st) {
                                return;
                            }
                            st.pendingCapture = false;
                            if (!desc) {
                                axisFaceUpdateStepUi(st.stepIndex, 'Leitura falhou — mantenha o rosto visível.', false);
                                return;
                            }
                            st.samples.push(desc);
                            st.stepIndex += 1;
                            if (st.stepIndex >= ENROLL_STEPS.length) {
                                axisFaceEnrollFinishWizard(st);
                            } else {
                                axisFaceUpdateStepUi(st.stepIndex, '', false);
                            }
                        })
                        .catch(function () {
                            if (enrollState === st) {
                                st.pendingCapture = false;
                            }
                        });
                }
            })
            .catch(function () {
                return null;
            })
            .finally(function () {
                if (enrollState) {
                    axisFaceEnrollScheduleNextTick();
                }
            });
    }

    function axisFaceEnrollFinishWizard(st) {
        axisFaceEnrollEnsureRadialSvg();
        if (st && st.angleCover) {
            var fi;
            for (fi = 0; fi < st.angleCover.length; fi++) {
                st.angleCover[fi] = true;
            }
            axisFaceEnrollSyncRadialDisplay(st, ENROLL_STEPS.length - 1, true);
        }
        axisFaceEnrollSetRadialPoseOk(true);
        axisFaceEnrollStopWizard();
        var videoEl = document.getElementById('face-enroll-video');
        var merged = axisFaceAverageDescriptors(st.samples);
        if (!merged) {
            axisFaceSetStatus('face-enroll-status', 'Falha ao combinar leituras. Tente de novo.');
            return;
        }
        try {
            localStorage.setItem(DESC_PREFIX + st.login, JSON.stringify(Array.prototype.slice.call(merged)));
        } catch (e) {
            axisFaceSetStatus('face-enroll-status', 'Erro ao guardar (quota do navegador?).');
            return;
        }
        axisFaceMergeDescriptorIntoUserDb(st.login, merged);
        axisFaceStopStream(videoEl);
        if (videoEl) videoEl.style.display = 'none';
        axisFaceCloseEnrollModal();
        axisFaceSetStatus('face-enroll-status', 'Cadastro facial concluído (4 movimentos). Pode fechar a câmara se ainda estiver aberta.');
        window.axisFaceRefreshSettingsLabel();
        if (typeof showToast === 'function') {
            showToast('Rosto cadastrado com sucesso.', 'success');
        }
        var startBtn = document.getElementById('face-enroll-start');
        if (startBtn) startBtn.disabled = false;
    }

    function axisFaceLoginCapture() {
        var videoEl = document.getElementById('face-login-video');
        var capBtn = document.getElementById('face-login-capture');
        var startBtn = document.getElementById('face-login-start');
        if (!videoEl || !videoEl.srcObject) {
            axisFaceSetStatus('face-login-status', 'Abra a câmara primeiro.');
            return;
        }
        var enrolled = axisFaceListEnrolledLogins();
        if (enrolled.length === 0) {
            axisFaceSetStatus('face-login-status', 'Nenhum rosto cadastrado. Entre com utilizador e senha e registe em Configurações.');
            return;
        }
        if (capBtn) capBtn.disabled = true;
        axisFaceSetStatus('face-login-status', 'A capturar várias leituras do rosto (reduz erros)…');
        axisFaceCollectDescriptorBurst(videoEl, LOGIN_BURST_COUNT, LOGIN_BURST_GAP_MS, axisFaceSsdOptsLogin())
            .then(function (samples) {
                if (!samples || samples.length === 0) {
                    axisFaceSetStatus(
                        'face-login-status',
                        'Rosto não detetado. Enquadre o rosto maior, melhore a luz e tente de novo.'
                    );
                    if (capBtn) capBtn.disabled = false;
                    return;
                }
                var merged = axisFaceAverageDescriptors(samples);
                var match = merged ? axisFaceBestMatch(merged, enrolled) : null;
                if (!match && samples.length >= 2) {
                    match = axisFaceBestMatchVote(samples, enrolled);
                }
                if (!match) {
                    axisFaceSetStatus(
                        'face-login-status',
                        'Rosto não reconhecido. Aproxime-se, olhe de frente à câmara ou refaça o cadastro em Configurações.'
                    );
                    if (capBtn) capBtn.disabled = false;
                    return;
                }
                var pack = axisFaceLoadUserDb(match.login);
                if (!pack || !pack.db) {
                    axisFaceSetStatus('face-login-status', 'Utilizador não encontrado na base local.');
                    if (capBtn) capBtn.disabled = false;
                    return;
                }
                axisFaceStopStream(videoEl);
                videoEl.style.display = 'none';
                if (startBtn) startBtn.disabled = false;
                if (capBtn) capBtn.disabled = true;
                axisFaceSetStatus('face-login-status', 'Acesso concedido. A entrar…');
                if (typeof axisExecuteLoginSession === 'function') {
                    axisExecuteLoginSession(match.login, pack.db, pack.dbKey, pack.chaveAntiga, pack.db.name || match.login);
                }
            })
            .catch(function () {
                axisFaceSetStatus('face-login-status', 'Erro ao processar a imagem.');
                if (capBtn) capBtn.disabled = false;
            });
    }

    function axisFaceLoginStart() {
        var videoEl = document.getElementById('face-login-video');
        var startBtn = document.getElementById('face-login-start');
        var capBtn = document.getElementById('face-login-capture');
        if (!videoEl) return;
        axisFaceWarnIfInsecureCamera('face-login-status');
        axisFaceToastPermCamera('login');
        if (startBtn) startBtn.disabled = true;
        axisFaceSetStatus('face-login-status', 'A carregar modelos (primeira vez pode demorar)…');
        var streamInGesture = axisFaceGetUserMediaStream();
        axisFaceEnsureModels()
            .then(function (ok) {
                if (!ok) {
                    streamInGesture.then(axisFaceStopHeldStream).catch(function () {});
                    axisFaceSetStatus('face-login-status', 'Não foi possível carregar os modelos. Verifique a Internet ou bloqueio de CDN.');
                    if (startBtn) startBtn.disabled = false;
                    return Promise.reject(null);
                }
                return streamInGesture;
            })
            .then(function (stream) {
                if (!stream) return Promise.reject(null);
                return axisFaceApplyStreamToVideo(videoEl, stream, { visibleBeforePlay: true });
            })
            .then(function () {
                if (!videoEl.srcObject) return;
                videoEl.style.display = 'block';
                axisFaceSetStatus('face-login-status', 'Câmara ativa. Posicione-se de frente e toque em «Capturar e entrar».');
                if (capBtn) capBtn.disabled = false;
                if (startBtn) startBtn.disabled = false;
            })
            .catch(function (err) {
                if (err !== null) {
                    axisFaceSetStatus('face-login-status', axisFaceTranslateCamError(err));
                }
                if (startBtn) startBtn.disabled = false;
            });
    }

    function axisFaceEnrollStart() {
        var videoEl = document.getElementById('face-enroll-video');
        var startBtn = document.getElementById('face-enroll-start');
        if (!videoEl) return;
        var login = axisFaceGetLoginCanonico();
        if (!login) {
            axisFaceSetStatus('face-enroll-status', 'Inicie sessão para cadastrar o rosto.');
            return;
        }
        if (enrollWizardTimer) {
            axisFaceSetStatus('face-enroll-status', 'O assistente já está em execução.');
            return;
        }
        axisFaceWarnIfInsecureCamera('face-enroll-status');
        axisFaceToastPermCamera('enroll');
        if (startBtn) startBtn.disabled = true;
        axisFaceOpenEnrollModal();
        axisFaceSetStatus('face-enroll-status', 'Toque em «Começar» no ecrã para iniciar a câmara.');

        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'camera' }).then(function (st) {
                if (st.state === 'denied') {
                    axisFaceSetStatus('face-enroll-status', 'O Chrome bloqueou a câmara para este site. Barra de endereços → ícone → Câmara → Permitir.');
                }
            }).catch(function () {});
        }
    }

    function axisFaceEnrollFaceIdBeginScan() {
        var videoEl = document.getElementById('face-enroll-video');
        var startBtn = document.getElementById('face-enroll-start');
        var login = axisFaceGetLoginCanonico();
        if (!videoEl || !login) return;

        var fidBtn = document.getElementById('face-enroll-fid-start');
        if (fidBtn) fidBtn.disabled = true;

        var modal = document.getElementById('modal-face-enroll');
        if (modal) modal.classList.add('face-enroll-fid--scan');
        var intro = document.getElementById('face-enroll-phase-intro');
        var scan = document.getElementById('face-enroll-phase-scan');
        if (intro) intro.setAttribute('hidden', 'hidden');
        if (scan) scan.removeAttribute('hidden');

        var graphic = document.getElementById('face-enroll-fid-intro-graphic');
        if (graphic) graphic.style.display = 'none';

        axisFaceSetStatus('face-enroll-status', 'A preparar modelos e a câmara…');

        var streamInGesture = axisFaceGetUserMediaStream();

        axisFaceEnsureModels()
            .then(function (ok) {
                if (!axisFaceIsStillOnSettingsPage()) {
                    streamInGesture.then(axisFaceStopHeldStream).catch(function () {});
                    axisFaceCleanupEnrollSession();
                    return;
                }
                if (!ok) {
                    streamInGesture.then(axisFaceStopHeldStream).catch(function () {});
                    axisFaceSetStatus('face-enroll-status', 'Falha ao carregar modelos de IA. Verifique a Internet.');
                    axisFaceEnrollRevertToIntroAfterFail();
                    if (fidBtn) fidBtn.disabled = false;
                    if (startBtn) startBtn.disabled = false;
                    return;
                }
                return streamInGesture;
            })
            .then(function (stream) {
                if (!stream) return;
                if (!axisFaceIsStillOnSettingsPage()) {
                    axisFaceStopHeldStream(stream);
                    axisFaceCleanupEnrollSession();
                    return;
                }
                return axisFaceApplyStreamToVideo(videoEl, stream, { visibleBeforePlay: true });
            })
            .then(function () {
                if (!axisFaceIsStillOnSettingsPage()) {
                    axisFaceStopStream(videoEl);
                    if (videoEl) videoEl.style.display = 'none';
                    axisFaceCleanupEnrollSession();
                    return;
                }
                if (!videoEl || !videoEl.srcObject) {
                    axisFaceEnrollRevertToIntroAfterFail();
                    axisFaceCloseEnrollModal();
                    if (startBtn) startBtn.disabled = false;
                    if (fidBtn) fidBtn.disabled = false;
                    return;
                }
                videoEl.style.display = 'block';
                enrollState = {
                    login: login,
                    stepIndex: 0,
                    stable: 0,
                    samples: [],
                    noFaceTicks: 0,
                    pendingCapture: false,
                    angleCover: new Array(ENROLL_RADIAL_TICKS)
                };
                for (var ac = 0; ac < ENROLL_RADIAL_TICKS; ac++) {
                    enrollState.angleCover[ac] = false;
                }
                axisFaceUpdateStepUi(0, '', false);
                axisFaceSetStatus('face-enroll-status', 'Siga as instruções no ecrã.');
                axisFaceEnrollScheduleNextTick();
                if (startBtn) startBtn.disabled = false;
            })
            .catch(function (err) {
                axisFaceSetStatus('face-enroll-status', axisFaceTranslateCamError(err));
                axisFaceEnrollRevertToIntroAfterFail();
                axisFaceCloseEnrollModal();
                if (startBtn) startBtn.disabled = false;
                if (fidBtn) fidBtn.disabled = false;
            });
    }

    function axisFaceEnrollRemove() {
        var login = axisFaceGetLoginCanonico();
        if (!login) return;
        if (!confirm('Remover o cadastro facial desta conta neste navegador?')) return;
        axisFaceEnrollStopWizard();
        try {
            localStorage.removeItem(DESC_PREFIX + login);
        } catch (_) {}
        axisFaceClearDescriptorFromUserDb(login);
        axisFaceStopStream(document.getElementById('face-enroll-video'));
        var v = document.getElementById('face-enroll-video');
        if (v) v.style.display = 'none';
        axisFaceCloseEnrollModal();
        axisFaceSetStatus('face-enroll-status', 'Cadastro facial removido.');
        window.axisFaceRefreshSettingsLabel();
        try {
            if (typeof window.axisAddNotification === 'function') {
                window.axisAddNotification(
                    'Cadastro facial removido para esta conta neste navegador. Pode registar de novo com «Abrir câmera» quando quiser.',
                    'info'
                );
            }
            var drop = document.getElementById('nav-notifications-dropdown');
            if (drop && drop.classList.contains('open') && typeof window.carregarNavNotifications === 'function') {
                window.carregarNavNotifications();
            }
        } catch (_) {}
        var startBtn = document.getElementById('face-enroll-start');
        if (startBtn) startBtn.disabled = false;
    }

    function axisFaceLoginCloseCam() {
        var videoEl = document.getElementById('face-login-video');
        axisFaceStopStream(videoEl);
        if (videoEl) videoEl.style.display = 'none';
        var cap = document.getElementById('face-login-capture');
        if (cap) cap.disabled = true;
        axisFaceSetStatus('face-login-status', '');
    }

    function axisFaceEnrollCloseCam() {
        if (enrollCloseBusy) return;
        var modalEarly = document.getElementById('modal-face-enroll');
        var vEarly = document.getElementById('face-enroll-video');
        var onIntroOnly =
            modalEarly &&
            !modalEarly.classList.contains('face-enroll-fid--scan') &&
            (!vEarly || !vEarly.srcObject);
        if (onIntroOnly) {
            axisFaceCloseEnrollModal();
            axisFaceSetStatus('face-enroll-status', '');
            var sbIntro = document.getElementById('face-enroll-start');
            if (sbIntro) sbIntro.disabled = false;
            return;
        }
        enrollCloseBusy = true;
        try {
            axisFaceEnrollStopWizard();
            var videoEl = document.getElementById('face-enroll-video');
            axisFaceStopStream(videoEl);
            if (videoEl) {
                videoEl.style.display = 'none';
            }
            axisFaceSetStatus('face-enroll-status', 'Câmera fechada. Toque em «Abrir câmera» para recomeçar o cadastro.');
            var startBtn = document.getElementById('face-enroll-start');
            if (startBtn) startBtn.disabled = false;
            var ring = document.getElementById('face-enroll-ring');
            if (ring) ring.classList.remove('face-enroll-ring-ok');
        } catch (closeErr) {
            try {
                console.warn('AXIS fechar câmara (cadastro):', closeErr);
            } catch (_) {}
        }
        var closeModal = function () {
            try {
                axisFaceCloseEnrollModal();
            } finally {
                enrollCloseBusy = false;
            }
        };
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(function () {
                requestAnimationFrame(closeModal);
            });
        } else {
            setTimeout(closeModal, 0);
        }
    }

    function axisFaceAuthInitUi() {
        var ls = document.getElementById('face-login-start');
        var lc = document.getElementById('face-login-capture');
        var lx = document.getElementById('face-login-close');
        var es = document.getElementById('face-enroll-start');
        var er = document.getElementById('face-enroll-remove');
        var ec = document.getElementById('face-enroll-close');
        var emx = document.getElementById('face-enroll-modal-x');
        var fidStart = document.getElementById('face-enroll-fid-start');
        var fidA11y = document.getElementById('face-enroll-fid-a11y');
        if (ls) ls.addEventListener('click', axisFaceLoginStart);
        if (lc) lc.addEventListener('click', axisFaceLoginCapture);
        if (lx) lx.addEventListener('click', axisFaceLoginCloseCam);
        if (es) es.addEventListener('click', axisFaceEnrollStart);
        if (er) er.addEventListener('click', axisFaceEnrollRemove);
        if (ec) ec.addEventListener('click', axisFaceEnrollCloseCam);
        if (emx) emx.addEventListener('click', axisFaceEnrollCloseCam);
        if (fidStart) fidStart.addEventListener('click', axisFaceEnrollFaceIdBeginScan);
        if (fidA11y) {
            fidA11y.addEventListener('click', function (ev) {
                ev.preventDefault();
                if (typeof showToast === 'function') {
                    showToast(
                        'Em Configurações pode aumentar o tamanho da letra, ativar alto contraste e escolher tema claro ou escuro.',
                        'info',
                        5500
                    );
                }
            });
        }
        window.axisFaceRefreshSettingsLabel();
        axisFaceEnrollEnsureRadialSvg();
        try {
            axisFaceHydrateDescriptorsFromDbs();
        } catch (h0) {}
        window.addEventListener('axis-server-users-pulled', function () {
            try {
                axisFaceHydrateDescriptorsFromDbs();
            } catch (h1) {}
        });
        document.querySelectorAll('[data-nav-page="page-configuracoes"]').forEach(function (el) {
            el.addEventListener('click', function () {
                setTimeout(function () {
                    if (typeof window.axisFaceRefreshSettingsLabel === 'function') {
                        window.axisFaceRefreshSettingsLabel();
                    }
                }, 400);
            });
        });
        window.addEventListener('hashchange', function () {
            var h = (window.location.hash || '').replace(/^#\/?/, '').split('?')[0];
            if (h !== 'page-configuracoes') {
                var modal = document.getElementById('modal-face-enroll');
                var vis = false;
                try {
                    if (modal) vis = window.getComputedStyle(modal).display !== 'none';
                } catch (_) {
                    vis = modal && modal.style.display === 'flex';
                }
                if (vis || enrollWizardTimer) {
                    axisFaceCleanupEnrollSession();
                }
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', axisFaceAuthInitUi);
    } else {
        axisFaceAuthInitUi();
    }
})();
