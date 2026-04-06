/**
 * MeliHelp — Editor de emissão de crachá (frente/verso, impressão).
 * Depende de QRCode global (qrcodejs) quando disponível.
 */
(function (global) {
    'use strict';

    var DRAFT_KEY = 'axis_melihelp_hub_v1_cracha_editor_draft';

    /** PDF de referência. Ordem do ficheiro: pág. 1 = frente (foto/nome), pág. 2 = verso (RE, QR, texto legal). */
    var PDF_REF_URL = '/assets/cracha-template/design-referencia.pdf';

    var editorToastTimer = null;

    function editorToast(msg) {
        var el = document.getElementById('melihelp-toast');
        if (!el || !msg) return;
        var textEl = el.querySelector('.melihelp-toast__text');
        var iconI = el.querySelector('.melihelp-toast__icon i');
        if (textEl) textEl.textContent = msg;
        else el.textContent = msg;
        if (iconI) iconI.className = 'fas fa-info-circle';
        el.className = 'melihelp-toast melihelp-toast--info';
        el.hidden = false;
        global.requestAnimationFrame(function () {
            el.classList.add('is-on');
        });
        clearTimeout(editorToastTimer);
        editorToastTimer = global.setTimeout(function () {
            el.classList.remove('is-on');
            global.setTimeout(function () {
                el.hidden = true;
            }, 420);
        }, 4500);
    }

    var DEFAULT_LEGAL =
        'Este crachá é sua identificação no Mercado Livre. Por favor, utilize durante o expediente de trabalho e para acesso às dependências da MeliCidade.';

    function escAttr(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    }

    /** Logo PNG em assets/IMAGENS/ (ex.: assets minúsculo + IMAGENS maiúsculo). Fallback: images/melihelp/ml-logo-horizontal.svg */
    function melihelpImg(file) {
        try {
            if (global.location && global.location.protocol === 'file:') {
                return new URL('../images/melihelp/' + file, global.location.href).href;
            }
        } catch (e) {}
        return '/images/melihelp/' + file;
    }

    function getLogoCandidates() {
        var list = [];
        list.push('/assets/IMAGENS/Logo_Mercado_Livre.png');
        list.push('../assets/IMAGENS/Logo_Mercado_Livre.png');
        list.push('/ASSETS/IMAGENS/Logo_Mercado_Livre.png');
        list.push('../ASSETS/IMAGENS/Logo_Mercado_Livre.png');
        list.push('/assets/imagens/Logo_Mercado_Livre.png');
        list.push(melihelpImg('ml-logo-horizontal.svg'));
        var seen = {};
        return list.filter(function (u) {
            if (!u || seen[u]) return false;
            seen[u] = true;
            return true;
        });
    }

    function logoImgHtml(cssExtra) {
        var candidates = getLogoCandidates();
        var primary = candidates.length ? candidates[0] : melihelpImg('ml-logo-horizontal.svg');
        var rest = candidates.length > 1 ? candidates.slice(1) : [];
        var c = 'ml-cracha-logo-img' + (cssExtra ? ' ' + cssExtra : '');
        return (
            '<img class="' +
            c +
            '" src="' +
            escAttr(primary) +
            '" data-logo-fallbacks="' +
            escAttr(JSON.stringify(rest)) +
            '" alt="Mercado Livre" draggable="false">'
        );
    }

    function wireLogoImages(container) {
        if (!container || !container.querySelectorAll) return;
        container.querySelectorAll('img.ml-cracha-logo-img').forEach(function (img) {
            var raw = img.getAttribute('data-logo-fallbacks');
            var fallbacks = [];
            try {
                fallbacks = JSON.parse(raw || '[]');
                if (!Array.isArray(fallbacks)) fallbacks = [];
            } catch (e) {
                fallbacks = [];
            }
            var idx = 0;
            function onErr() {
                if (idx < fallbacks.length) {
                    img.src = fallbacks[idx];
                    idx++;
                } else {
                    img.removeEventListener('error', onErr);
                    img.alt =
                        'Logo: coloque Logo_Mercado_Livre.png em assets/IMAGENS (na raiz do site) ou use o SVG em images/melihelp.';
                }
            }
            img.addEventListener('error', onErr);
        });
    }

    function mosaicFrontHtml() {
        return (
            '<img class="ml-cracha-mosaic-bg" src="' +
            escAttr(melihelpImg('ml-mosaic-front.svg')) +
            '" alt="" draggable="false" decoding="async">'
        );
    }

    function pdfLayerHtml() {
        return '<div class="ml-cracha-pdf-layer" aria-hidden="true"><canvas class="ml-cracha-pdf-canvas"></canvas></div>';
    }

    function getPdfJs() {
        return global.pdfjsLib || global.pdfjs || null;
    }

    function renderPdfPageIntoCanvas(pdf, pageNum, canvas, cssW, cssH) {
        if (!canvas) return Promise.resolve();
        return pdf.getPage(pageNum).then(function (page) {
            var dpr = Math.min(global.window.devicePixelRatio || 1, 2);
            var base = page.getViewport({ scale: 1 });
            var fitScale = Math.min(cssW / base.width, cssH / base.height) * dpr;
            var viewport = page.getViewport({ scale: fitScale });
            canvas.width = Math.max(1, Math.floor(viewport.width));
            canvas.height = Math.max(1, Math.floor(viewport.height));
            canvas.style.width = cssW + 'px';
            canvas.style.height = cssH + 'px';
            var ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            var renderTask = page.render({ canvasContext: ctx, viewport: viewport });
            return renderTask.promise;
        });
    }

    function getPdfRefUrlCandidates() {
        var list = [];
        try {
            if (global.location && global.location.origin && global.location.protocol !== 'file:') {
                list.push(global.location.origin + PDF_REF_URL);
            }
        } catch (e) {}
        list.push(PDF_REF_URL);
        try {
            if (global.location && global.location.protocol === 'file:') {
                list.push(
                    new URL('../assets/cracha-template/design-referencia.pdf', global.location.href).href
                );
            } else {
                list.push('../assets/cracha-template/design-referencia.pdf');
            }
        } catch (e) {
            list.push('../assets/cracha-template/design-referencia.pdf');
        }
        var seen = {};
        return list.filter(function (u) {
            if (!u || seen[u]) return false;
            seen[u] = true;
            return true;
        });
    }

    function renderPdfToCards(mainEl, pdf) {
        var w = 204;
        var h = 324;
        var n = pdf.numPages || 1;
        var pForFront = 1;
        var pBack = n >= 2 ? 2 : 1;
        var jobs = [
            ['#ml-cracha-front-preview .ml-cracha-pdf-canvas', pForFront],
            ['#ml-cracha-back-preview .ml-cracha-pdf-canvas', pBack],
            ['#ml-cracha-front-print .ml-cracha-pdf-canvas', pForFront],
            ['#ml-cracha-back-print .ml-cracha-pdf-canvas', pBack]
        ];
        return Promise.all(
            jobs.map(function (j) {
                var canvas = mainEl.querySelector(j[0]);
                return renderPdfPageIntoCanvas(pdf, j[1], canvas, w, h);
            })
        ).then(function () {
            mainEl.querySelectorAll('.ml-cracha').forEach(function (el) {
                el.classList.add('has-pdf-bg');
            });
        });
    }

    /**
     * Carrega o PDF com fetch + ArrayBuffer (mais fiável que url direto) e tenta vários caminhos.
     * Extensão de browser não é necessária nem instalável a partir do Cursor.
     */
    /**
     * @param {HTMLElement} mainEl
     * @param {function(): void} [onReady] chamado após o PDF aplicar (ex.: redesenhar QR nas novas coordenadas)
     */
    function hydratePdfReference(mainEl, onReady) {
        var lib = getPdfJs();
        if (!lib || typeof lib.getDocument !== 'function') {
            editorToast('PDF.js não carregou. Verifique internet, bloqueio de CDN ou recarregue com Ctrl+F5.');
            return;
        }
        try {
            lib.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        } catch (e) {}
        var urls = getPdfRefUrlCandidates();

        function tryUrl(index) {
            if (index >= urls.length) {
                editorToast(
                    'PDF do crachá não abriu. Coloque design-referencia.pdf em assets/cracha-template/ na pasta do servidor e use Ctrl+F5.'
                );
                return Promise.resolve();
            }
            var u = urls[index];
            return fetch(u, { credentials: 'same-origin', cache: 'no-cache' })
                .then(function (res) {
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    return res.arrayBuffer();
                })
                .then(function (buf) {
                    if (!buf || !buf.byteLength) throw new Error('vazio');
                    var data = new Uint8Array(buf);
                    return lib.getDocument({ data: data }).promise;
                })
                .then(function (pdf) {
                    return renderPdfToCards(mainEl, pdf).then(function () {
                        if (typeof onReady === 'function') {
                            try {
                                onReady();
                            } catch (e) {}
                        }
                    });
                })
                .catch(function (err) {
                    try {
                        console.warn('Crachá PDF tentativa ' + (index + 1) + ' (' + u + '):', err);
                    } catch (e) {}
                    return tryUrl(index + 1);
                });
        }

        tryUrl(0);
    }

    function loadDraft() {
        try {
            var raw = localStorage.getItem(DRAFT_KEY);
            if (!raw) return null;
            var o = JSON.parse(raw);
            return o && typeof o === 'object' ? o : null;
        } catch (e) {
            return null;
        }
    }

    function saveDraft(data) {
        try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
        } catch (e) {}
    }

    function esc(s) {
        if (s == null) return '';
        var d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function faceHtml(suffix) {
        return (
            '<div class="ml-cracha ml-cracha--front" id="ml-cracha-front-' +
            suffix +
            '">' +
            pdfLayerHtml() +
            mosaicFrontHtml() +
            '<div class="ml-cracha-photo-wrap">' +
            '<img class="ml-cracha-photo" id="ml-photo-' +
            suffix +
            '" alt="" src=""/>' +
            '</div>' +
            '<div class="ml-cracha-name-band">' +
            '<div class="ml-cracha-name1" id="ml-n1-' +
            suffix +
            '"></div>' +
            '<div class="ml-cracha-name2" id="ml-n2-' +
            suffix +
            '"></div>' +
            '</div>' +
            '<div class="ml-cracha-footer-yellow">' +
            '<div class="ml-cracha-logo-wrap">' +
            logoImgHtml('ml-cracha-logo-img--front') +
            '</div></div>' +
            '</div>'
        );
    }

    function backHtml(suffix) {
        return (
            '<div class="ml-cracha ml-cracha--back" id="ml-cracha-back-' +
            suffix +
            '">' +
            pdfLayerHtml() +
            '<div class="ml-cracha-back-header" aria-hidden="true">' +
            '<img class="ml-cracha-back-header-img" src="' +
            escAttr(melihelpImg('ml-back-header.svg')) +
            '" alt="" width="204" height="22" draggable="false">' +
            '</div>' +
            '<div class="ml-cracha-back-fields">' +
            '<div class="ml-cracha-row">' +
            '<div class="ml-cracha-row-label">RE:</div>' +
            '<div class="ml-cracha-row-box"><span class="accent accent--g"></span><span class="ml-cracha-row-val" id="ml-re-' +
            suffix +
            '"></span></div></div>' +
            '<div class="ml-cracha-row">' +
            '<div class="ml-cracha-row-label">Área:</div>' +
            '<div class="ml-cracha-row-box"><span class="accent accent--p"></span><span class="ml-cracha-row-val" id="ml-area-' +
            suffix +
            '"></span></div></div>' +
            '<div class="ml-cracha-row">' +
            '<div class="ml-cracha-row-label">Empresa:</div>' +
            '<div class="ml-cracha-row-box"><span class="accent accent--lg"></span><span class="ml-cracha-row-val" id="ml-emp-' +
            suffix +
            '"></span></div></div>' +
            '</div>' +
            '<div class="ml-cracha-qr-block">' +
            '<div class="ml-cracha-qr-host" id="ml-qr-' +
            suffix +
            '"></div>' +
            '<p class="ml-cracha-legal" id="ml-legal-' +
            suffix +
            '"></p>' +
            '</div>' +
            '<div class="ml-cracha-back-footer">' +
            '<div class="ml-cracha-back-logo-row">' +
            logoImgHtml('ml-cracha-logo-img--back') +
            '</div>' +
            '<div class="ml-cracha-back-strip" aria-hidden="true">' +
            '<span class="s1"></span><span class="s2"></span><span class="s3"></span><span class="s4"></span>' +
            '</div></div>' +
            '</div>'
        );
    }

    function resizePhotoDataUrl(dataUrl, maxSide, cb) {
        if (!dataUrl || dataUrl.indexOf('data:image') !== 0) {
            cb(dataUrl);
            return;
        }
        var img = new Image();
        img.onload = function () {
            try {
                var w = img.naturalWidth;
                var h = img.naturalHeight;
                if (!w || !h || (w <= maxSide && h <= maxSide)) {
                    cb(dataUrl);
                    return;
                }
                var scale = maxSide / Math.max(w, h);
                var nw = Math.round(w * scale);
                var nh = Math.round(h * scale);
                var c = document.createElement('canvas');
                c.width = nw;
                c.height = nh;
                var ctx = c.getContext('2d');
                if (!ctx) {
                    cb(dataUrl);
                    return;
                }
                ctx.drawImage(img, 0, 0, nw, nh);
                cb(c.toDataURL('image/jpeg', 0.88));
            } catch (e) {
                cb(dataUrl);
            }
        };
        img.onerror = function () {
            cb(dataUrl);
        };
        img.src = dataUrl;
    }

    function buildQr(el, text) {
        if (!el) return;
        el.innerHTML = '';
        var t = (text || '').trim();
        if (!t) {
            el.innerHTML = '<span style="font-size:8px;color:#2D3277;padding:4px;">Texto vazio</span>';
            return;
        }
        function cleanQrHost(host) {
            if (!host) return;
            var keep = host.querySelector('canvas, img, table');
            Array.prototype.slice.call(host.childNodes || []).forEach(function (n) {
                if (n === keep) return;
                if (n.nodeType === 3) {
                    n.remove();
                    return;
                }
                if (n.nodeType === 1) {
                    var tag = (n.tagName || '').toLowerCase();
                    if (tag !== 'canvas' && tag !== 'img' && tag !== 'table') n.remove();
                }
            });
        }
        try {
            if (global.QRCode) {
                var opts = {
                    text: t,
                    width: 256,
                    height: 256,
                    colorDark: '#000000',
                    colorLight: '#ffffff'
                };
                if (global.QRCode.CorrectLevel) {
                    opts.correctLevel = global.QRCode.CorrectLevel.M;
                }
                // eslint-disable-next-line no-new
                new global.QRCode(el, opts);
                global.setTimeout(function () {
                    cleanQrHost(el);
                }, 0);
            } else {
                el.innerHTML =
                    '<span style="font-size:7px;color:#2D3277;line-height:1.2;display:block;max-width:100px;">Instale/rede: QRCode (qrcodejs) indisponível. Texto: ' +
                    esc(t).slice(0, 80) +
                    '</span>';
            }
        } catch (e) {
            el.innerHTML = '<span style="font-size:8px;color:#c00;">QR inválido</span>';
        }
    }

    function render(mainEl) {
        if (!mainEl) return;

        var d = loadDraft() || {};

        mainEl.innerHTML =
            '<section class="melihelp-panel glass-panel melihelp-cracha-editor-panel melihelp-cracha-editor">' +
            '<header class="melihelp-dash-head">' +
            '<h2 class="melihelp-dash-title">EMISSÃO DE CRACHÁ</h2>' +
            '</header>' +
            '<p class="melihelp-cracha-editor-lead">O desenho base é o PDF em <code>assets/cracha-template/design-referencia.pdf</code> (pág. 1 = frente, pág. 2 = verso), alinhado aos cartões. Por cima: foto e nomes na frente; RE, área, empresa, QR e texto legal no verso. Se o PDF não existir, usa-se o mosaico SVG. Logo PNG opcional: <code>assets/IMAGENS/Logo_Mercado_Livre.png</code>.</p>' +
            '<div class="melihelp-cracha-editor-grid">' +
            '<div class="melihelp-cracha-controls">' +
            '<fieldset class="melihelp-cracha-fieldset">' +
            '<legend>FRENTE</legend>' +
            '<label class="melihelp-cracha-label" for="melihelp-cracha-nome1">Nome (linha principal)</label>' +
            '<input type="text" id="melihelp-cracha-nome1" class="melihelp-cracha-input" maxlength="80" placeholder="Ex.: ADAILTON" autocomplete="off">' +
            '<label class="melihelp-cracha-label" for="melihelp-cracha-nome2">Sobrenome (linha secundária)</label>' +
            '<input type="text" id="melihelp-cracha-nome2" class="melihelp-cracha-input" maxlength="80" placeholder="Ex.: SANTOS" autocomplete="off">' +
            '<span class="melihelp-cracha-label">Foto</span>' +
            '<div class="melihelp-cracha-photo-row">' +
            '<label class="melihelp-cracha-file-btn"><input type="file" id="melihelp-cracha-file" accept="image/*" hidden> Escolher imagem</label>' +
            '<button type="button" class="melihelp-btn melihelp-btn-ghost melihelp-btn-text-upper" id="melihelp-cracha-clear-photo">Remover foto</button>' +
            '</div>' +
            '<p class="melihelp-cracha-photo-hint">Use rosto centralizado; a imagem aparece em círculo no crachá.</p>' +
            '</fieldset>' +
            '<fieldset class="melihelp-cracha-fieldset">' +
            '<legend>VERSO</legend>' +
            '<label class="melihelp-cracha-label" for="melihelp-cracha-re">RE</label>' +
            '<input type="text" id="melihelp-cracha-re" class="melihelp-cracha-input" maxlength="40" placeholder="Ex.: 412352" autocomplete="off">' +
            '<label class="melihelp-cracha-label" for="melihelp-cracha-area">Área</label>' +
            '<input type="text" id="melihelp-cracha-area" class="melihelp-cracha-input" maxlength="60" placeholder="Ex.: SHIPPING" autocomplete="off">' +
            '<label class="melihelp-cracha-label" for="melihelp-cracha-empresa">Empresa</label>' +
            '<input type="text" id="melihelp-cracha-empresa" class="melihelp-cracha-input" maxlength="60" placeholder="Ex.: EBAZAR" autocomplete="off">' +
            '<label class="melihelp-cracha-label" for="melihelp-cracha-qr">Texto ou URL do QR Code</label>' +
            '<input type="text" id="melihelp-cracha-qr" class="melihelp-cracha-input" maxlength="500" placeholder="URL ou texto codificado no QR" autocomplete="off">' +
            '<label class="melihelp-cracha-label" for="melihelp-cracha-legal">Texto legal (vertical ao lado do QR)</label>' +
            '<textarea id="melihelp-cracha-legal" class="melihelp-cracha-textarea" maxlength="600" rows="4"></textarea>' +
            '</fieldset>' +
            '</div>' +
            '<div class="melihelp-cracha-dual-wrap">' +
            '<div class="melihelp-cracha-dual-labels"><span>FRENTE</span><span>VERSO</span></div>' +
            '<div class="melihelp-cracha-dual">' +
            faceHtml('preview') +
            backHtml('preview') +
            '</div></div></div>' +
            '<div class="melihelp-cracha-print-actions">' +
            '<button type="button" class="melihelp-btn melihelp-btn-primary melihelp-btn-text-upper" id="melihelp-cracha-print-btn"><i class="fas fa-print" aria-hidden="true"></i> Imprimir frente e verso</button>' +
            '<p class="melihelp-cracha-print-hint">Na janela de impressão, confira margens e escala (100%). Papel sugerido: A4 paisagem ou cartão conforme a impressora.</p>' +
            '</div>' +
            '<div class="melihelp-cracha-print-root" aria-hidden="true">' +
            faceHtml('print') +
            backHtml('print') +
            '</div>' +
            '</section>';

        wireLogoImages(mainEl);
        global.setTimeout(function () {
            hydratePdfReference(mainEl, function () {
                syncTexts();
            });
        }, 120);

        var nome1 = mainEl.querySelector('#melihelp-cracha-nome1');
        var nome2 = mainEl.querySelector('#melihelp-cracha-nome2');
        var re = mainEl.querySelector('#melihelp-cracha-re');
        var area = mainEl.querySelector('#melihelp-cracha-area');
        var emp = mainEl.querySelector('#melihelp-cracha-empresa');
        var qrIn = mainEl.querySelector('#melihelp-cracha-qr');
        var legalIn = mainEl.querySelector('#melihelp-cracha-legal');
        var fileIn = mainEl.querySelector('#melihelp-cracha-file');
        var btnClear = mainEl.querySelector('#melihelp-cracha-clear-photo');
        var btnPrint = mainEl.querySelector('#melihelp-cracha-print-btn');

        /* Sem restaurar foto do rascunho; remove fotos antigas guardadas para não voltarem a aparecer. */
        var photoData = '';
        try {
            if (d.photoDataUrl) {
                var pruned = Object.assign({}, d);
                delete pruned.photoDataUrl;
                saveDraft(pruned);
            }
        } catch (e) {}

        nome1.value = d.nome1 != null ? String(d.nome1) : '';
        nome2.value = d.nome2 != null ? String(d.nome2) : '';
        re.value = d.re != null ? String(d.re) : '';
        area.value = d.area != null ? String(d.area) : '';
        emp.value = d.empresa != null ? String(d.empresa) : '';
        qrIn.value = d.qrText != null ? String(d.qrText) : '';
        legalIn.value = d.legalText != null ? String(d.legalText) : DEFAULT_LEGAL;
        if (!legalIn.value.trim()) legalIn.value = DEFAULT_LEGAL;

        function syncTexts() {
            var n1 = (nome1.value || '').trim() || 'NOME';
            var n2 = (nome2.value || '').trim() || 'SOBRENOME';
            var r = (re.value || '').trim() || '—';
            var a = (area.value || '').trim() || '—';
            var e = (emp.value || '').trim() || '—';
            var leg = (legalIn.value || '').trim() || DEFAULT_LEGAL;

            ['preview', 'print'].forEach(function (suf) {
                var e1 = mainEl.querySelector('#ml-n1-' + suf);
                var e2 = mainEl.querySelector('#ml-n2-' + suf);
                var er = mainEl.querySelector('#ml-re-' + suf);
                var ea = mainEl.querySelector('#ml-area-' + suf);
                var ee = mainEl.querySelector('#ml-emp-' + suf);
                var elg = mainEl.querySelector('#ml-legal-' + suf);
                if (e1) e1.textContent = n1;
                if (e2) e2.textContent = n2;
                if (er) er.textContent = r;
                if (ea) ea.textContent = a;
                if (ee) ee.textContent = e;
                if (elg) elg.textContent = leg;
            });

            var qrText = (qrIn.value || '').trim();
            buildQr(mainEl.querySelector('#ml-qr-preview'), qrText);
            buildQr(mainEl.querySelector('#ml-qr-print'), qrText);
        }

        function syncPhotos() {
            ['preview', 'print'].forEach(function (suf) {
                var card = mainEl.querySelector('#ml-cracha-front-' + suf);
                var wrap = card ? card.querySelector('.ml-cracha-photo-wrap') : null;
                var im = mainEl.querySelector('#ml-photo-' + suf);
                if (!im) return;
                if (photoData) {
                    im.src = photoData;
                    im.removeAttribute('hidden');
                    if (wrap) wrap.classList.remove('is-empty');
                } else {
                    im.removeAttribute('src');
                    im.removeAttribute('hidden');
                    im.alt = '';
                    if (wrap) wrap.classList.add('is-empty');
                }
            });
        }

        function persist() {
            saveDraft({
                nome1: nome1.value,
                nome2: nome2.value,
                re: re.value,
                area: area.value,
                empresa: emp.value,
                qrText: qrIn.value,
                legalText: legalIn.value,
                photoDataUrl: photoData
            });
        }

        var debounceTimer = null;
        function scheduleSync() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function () {
                syncTexts();
                persist();
            }, 120);
        }

        nome1.addEventListener('input', scheduleSync);
        nome2.addEventListener('input', scheduleSync);
        re.addEventListener('input', scheduleSync);
        area.addEventListener('input', scheduleSync);
        emp.addEventListener('input', scheduleSync);
        qrIn.addEventListener('input', scheduleSync);
        qrIn.addEventListener('change', scheduleSync);
        qrIn.addEventListener('paste', function () {
            global.setTimeout(scheduleSync, 0);
        });
        legalIn.addEventListener('input', scheduleSync);

        fileIn.addEventListener('change', function () {
            var f = fileIn.files && fileIn.files[0];
            if (!f) return;
            if (!/^image\//.test(f.type)) {
                fileIn.value = '';
                return;
            }
            var r = new FileReader();
            r.onload = function () {
                var du = r.result;
                resizePhotoDataUrl(du, 720, function (out) {
                    photoData = out || '';
                    syncPhotos();
                    persist();
                });
            };
            r.onerror = function () {};
            try {
                r.readAsDataURL(f);
            } catch (e) {}
            fileIn.value = '';
        });

        btnClear.addEventListener('click', function () {
            photoData = '';
            syncPhotos();
            persist();
        });

        btnPrint.addEventListener('click', function () {
            syncTexts();
            syncPhotos();
            persist();
            try {
                global.print();
            } catch (e) {}
        });

        syncPhotos();
        syncTexts();
    }

    global.melihelpCrachaEditor = { render: render };
})(typeof window !== 'undefined' ? window : this);
