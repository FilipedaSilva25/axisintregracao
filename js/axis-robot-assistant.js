/**
 * AXIS Bot — assistente flutuante (avatar humano em miniatura + IA).
 * Integra OpenAI / Anthropic / Gemini via servidor; especialista no AXIS e ajuda geral.
 */

(function() {
    'use strict';

    /* Miniatura humana estilizada (SVG neutro); gradientes com IDs únicos por instância no DOM */
    var HUMAN_TRIGGER_SVG = '<svg class="axis-robot-icon axis-human-avatar-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<defs><linearGradient id="axisHumTrig" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#5ac8fa"/><stop offset="100%" stop-color="#34c759"/></linearGradient></defs>' +
        '<ellipse cx="32" cy="55" rx="23" ry="10" fill="url(#axisHumTrig)" opacity="0.42"/>' +
        '<circle cx="32" cy="25" r="17" fill="#3d2c22"/>' +
        '<ellipse cx="32" cy="29" rx="14" ry="15" fill="#e8c4a8"/>' +
        '<ellipse cx="26" cy="27" rx="2.4" ry="3" fill="#1c1c1e"/><ellipse cx="38" cy="27" rx="2.4" ry="3" fill="#1c1c1e"/>' +
        '<ellipse cx="25.5" cy="26" rx="0.9" ry="1.1" fill="#fff" opacity="0.5"/><ellipse cx="37.5" cy="26" rx="0.9" ry="1.1" fill="#fff" opacity="0.5"/>' +
        '<path d="M24 36q8 6 16 0" stroke="#a67c52" stroke-width="1.7" stroke-linecap="round"/>' +
        '</svg>';

    var HUMAN_HEADER_SVG = '<svg class="axis-human-header-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<defs><linearGradient id="axisHumHead" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#34c759"/><stop offset="100%" stop-color="#007aff"/></linearGradient></defs>' +
        '<ellipse cx="32" cy="52" rx="18" ry="8" fill="url(#axisHumHead)" opacity="0.35"/>' +
        '<circle cx="32" cy="26" r="14" fill="#3d2c22"/>' +
        '<ellipse cx="32" cy="29" rx="11" ry="12" fill="#deb896"/>' +
        '<circle cx="27" cy="27" r="2" fill="#1c1c1e"/><circle cx="37" cy="27" r="2" fill="#1c1c1e"/>' +
        '<path d="M26 35q6 4 12 0" stroke="#8b6914" stroke-width="1.4" stroke-linecap="round" opacity="0.85"/>' +
        '</svg>';

    function createRobot() {
        if (document.querySelector('.axis-robot-wrap')) return;
        var wrap = document.createElement('div');
        wrap.className = 'axis-robot-wrap';
        wrap.innerHTML =
            '<button type="button" class="axis-robot-trigger" aria-label="Abrir assistente AXIS" title="Assistente AXIS — sistema e perguntas gerais">' +
            '  <div class="axis-robot-avatar">' + HUMAN_TRIGGER_SVG + '</div>' +
            '</button>' +
            '<div class="axis-robot-panel" id="axis-robot-panel" role="dialog" aria-label="Chat com assistente AXIS" aria-hidden="true">' +
            '  <div class="axis-robot-panel-header">' +
            '    <div class="axis-robot-panel-avatar">' + HUMAN_HEADER_SVG + '</div>' +
            '    <div class="axis-robot-panel-title-wrap"><div class="axis-robot-panel-title">AXIS Bot</div><div class="axis-robot-panel-subtitle">Assistente geral + AXIS • IA no servidor (OpenAI / Anthropic / Gemini)</div></div>' +
            '    <label class="axis-robot-tts-toggle" title="Falar respostas automaticamente (voz masculina)"><input type="checkbox" id="axis-robot-tts-auto" aria-label="Falar respostas"/><span class="axis-robot-tts-icon" aria-hidden="true">🔊</span></label>' +
            '    <button type="button" class="axis-robot-panel-close" aria-label="Fechar">×</button>' +
            '  </div>' +
            '  <div class="axis-robot-messages" id="axis-robot-messages"></div>' +
            '  <div class="axis-robot-input-wrap">' +
            '    <div class="axis-robot-input-row">' +
            '      <textarea class="axis-robot-input" id="axis-robot-input" placeholder="Pergunte sobre o AXIS ou qualquer assunto…" rows="1"></textarea>' +
            '      <button type="button" class="axis-robot-send" id="axis-robot-send" aria-label="Enviar">' +
            '        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>' +
            '      </button>' +
            '    </div>' +
            '  </div>' +
            '</div>';
        wrap.style.visibility = 'hidden';
        wrap.style.pointerEvents = 'none';
        document.body.appendChild(wrap);
        /* FAB fixo no canto (corpo): no header ficava pequeno e às vezes fora da área útil após ajustes de layout. */
        wrap.classList.remove('axis-robot-in-nav');

        var panel = document.getElementById('axis-robot-panel');
        var messagesEl = document.getElementById('axis-robot-messages');
        var inputEl = document.getElementById('axis-robot-input');
        var sendBtn = document.getElementById('axis-robot-send');
        var chatHistory = [];

        function openPanel() {
            panel.classList.add('open');
            panel.setAttribute('aria-hidden', 'false');
            inputEl.focus();
        }
        function closePanel() {
            panel.classList.remove('open');
            panel.setAttribute('aria-hidden', 'true');
        }

        wrap.querySelector('.axis-robot-trigger').addEventListener('click', function(e) {
            e.stopPropagation();
            if (panel.classList.contains('open')) closePanel(); else openPanel();
        });
        wrap.querySelector('.axis-robot-panel-close').addEventListener('click', closePanel);

        document.addEventListener('click', function(e) {
            if (!panel.classList.contains('open')) return;
            if (wrap.contains(e.target)) return;
            closePanel();
        });

        var ttsAutoCheckbox = null;
        function getTtsAutoCheckbox() {
            if (!ttsAutoCheckbox) ttsAutoCheckbox = document.getElementById('axis-robot-tts-auto');
            return ttsAutoCheckbox;
        }
        try {
            var saved = localStorage.getItem('axis-bot-tts-auto');
            if (saved === '1') {
                setTimeout(function() {
                    var cb = getTtsAutoCheckbox();
                    if (cb) cb.checked = true;
                }, 50);
            }
        } catch (_) {}
        function saveTtsAuto() {
            try {
                var cb = getTtsAutoCheckbox();
                localStorage.setItem('axis-bot-tts-auto', cb && cb.checked ? '1' : '0');
            } catch (_) {}
        }

        var axisRobotVoices = [];
        function loadVoices() {
            axisRobotVoices = speechSynthesis.getVoices();
        }
        if (typeof speechSynthesis !== 'undefined') {
            loadVoices();
            speechSynthesis.onvoiceschanged = loadVoices;
        }
        function getMalePtBRVoice() {
            if (!axisRobotVoices.length) axisRobotVoices = speechSynthesis.getVoices();
            var ptBR = axisRobotVoices.filter(function(v) { return v.lang === 'pt-BR' || v.lang === 'pt_BR'; });
            var male = ptBR.filter(function(v) {
                var n = (v.name || '').toLowerCase();
                return n.indexOf('daniel') !== -1 || n.indexOf('ricardo') !== -1 || (n.indexOf('microsoft') !== -1 && n.indexOf('portuguese') !== -1);
            });
            return male[0] || ptBR[0] || null;
        }
        function speakText(text, onEnd) {
            if (typeof speechSynthesis === 'undefined' || !text) return;
            speechSynthesis.cancel();
            var plain = (text || '').replace(/\*+/g, '').trim();
            if (!plain) return;
            var u = new SpeechSynthesisUtterance(plain);
            u.lang = 'pt-BR';
            u.rate = 0.95;
            u.pitch = 1;
            var voice = getMalePtBRVoice();
            if (voice) u.voice = voice;
            if (typeof onEnd === 'function') u.onend = onEnd;
            speechSynthesis.speak(u);
        }

        function appendMessage(role, text, isTyping) {
            if (isTyping) {
                var div = document.createElement('div');
                div.className = 'axis-robot-typing';
                div.id = 'axis-robot-typing';
                div.innerHTML = '<span></span><span></span><span></span>';
                messagesEl.appendChild(div);
                messagesEl.scrollTop = messagesEl.scrollHeight;
                return;
            }
            var el = document.getElementById('axis-robot-typing');
            if (el) el.remove();
            var msg = document.createElement('div');
            msg.className = 'axis-robot-msg ' + role;
            if (role === 'bot') {
                var label = '<div class="axis-robot-msg-label">AXIS Bot</div>';
                var body = '<div class="axis-robot-msg-body">' + escapeHtml(text).replace(/\n/g, '<br>') + '</div>';
                var speakBtn = '<button type="button" class="axis-robot-msg-speak" aria-label="Ouvir resposta" title="Ouvir resposta (voz masculina)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg></button>';
                msg.innerHTML = label + body + speakBtn;
                msg.querySelector('.axis-robot-msg-speak').addEventListener('click', function() {
                    speakText(text);
                });
                msg.setAttribute('data-tts-text', text);
            } else {
                msg.textContent = text;
            }
            messagesEl.appendChild(msg);
            messagesEl.scrollTop = messagesEl.scrollHeight;
            if (role === 'bot' && text) {
                var cb = getTtsAutoCheckbox();
                if (cb && cb.checked) speakText(text);
            }
        }

        function escapeHtml(s) {
            var div = document.createElement('div');
            div.textContent = s;
            return div.innerHTML;
        }

        function setSendLoading(loading) {
            sendBtn.disabled = loading;
        }

        var sendCooldown = false;
        function sendMessage() {
            var text = (inputEl.value || '').trim();
            if (!text) return;
            if (sendCooldown) return;
            sendCooldown = true;
            inputEl.value = '';
            chatHistory.push({ role: 'user', content: text });
            appendMessage('user', text);

            if (document.body && document.body.classList.contains('melihelp-hub-body') && typeof window.axisMelihelpChatDispatch === 'function') {
                var handled = window.axisMelihelpChatDispatch(text, {
                    appendBot: function (msg) {
                        chatHistory.push({ role: 'assistant', content: msg });
                        appendMessage('bot', msg);
                    }
                });
                if (handled) {
                    setSendLoading(false);
                    setTimeout(function () { sendCooldown = false; }, 650);
                    return;
                }
            }

            appendMessage('bot', '', true);
            setSendLoading(true);

            var userName = (typeof currentUser === 'string' && currentUser) ? currentUser : (localStorage.getItem('current_user') || '');
            var base = window.location.origin || '';
            var ctx = {
                currentPage: (window.location.hash || '').replace(/^#/, '').trim() || '(início / sem hash)',
                pathname: (window.location.pathname || '/') + (window.location.search || ''),
                userLogin: (localStorage.getItem('current_user_login') || '').trim()
            };
            fetch(base + '/api/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    history: chatHistory.slice(0, -1),
                    userName: userName,
                    context: ctx
                })
            })
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    var el = document.getElementById('axis-robot-typing');
                    if (el) el.remove();
                    var reply = (data && data.reply) ? data.reply : 'Não foi possível obter resposta. Tente novamente.';
                    chatHistory.push({ role: 'assistant', content: reply });
                    appendMessage('bot', reply);
                    setSendLoading(false);
                    setTimeout(function() { sendCooldown = false; }, 1800);
                })
                .catch(function() {
                    var el = document.getElementById('axis-robot-typing');
                    if (el) el.remove();
                    chatHistory.push({ role: 'assistant', content: 'Erro de conexão. Verifique se o servidor está no ar e se a API do assistente está configurada.' });
                    appendMessage('bot', 'Erro de conexão. Verifique se o servidor está no ar e se a API do assistente está configurada.');
                    setSendLoading(false);
                    setTimeout(function() { sendCooldown = false; }, 1800);
                });
        }

        sendBtn.addEventListener('click', sendMessage);
        inputEl.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        setTimeout(function() {
            var ttsCb = getTtsAutoCheckbox();
            if (ttsCb) {
                ttsCb.addEventListener('change', saveTtsAuto);
            }
        }, 100);

        if (!messagesEl.querySelector('.axis-robot-msg')) {
            var firstName = (typeof currentUser === 'string' && currentUser) ? currentUser.split(/\s+/)[0] : (localStorage.getItem('current_user') || '').split(/\s+/)[0];
            var welcome;
            if (document.body && document.body.classList.contains('melihelp-hub-body')) {
                welcome =
                    (firstName ? 'Olá, ' + firstName + '!\n\n' : 'Olá!\n\n') +
                    'No MeliHelp você pode usar o menu numérico (tipo WhatsApp) ou escrever perguntas livres — sobre o hub ou assuntos gerais — quando a IA do servidor estiver ativa.\n\n' +
                    'Digite o número:\n' +
                    '1 – Retirada de cordão\n' +
                    '2 – Recebimento de cordão\n' +
                    '3 – Links do hub (crachás, cordão, cartão avulso)\n' +
                    '4 – Colar linha (retirada;re;nome ou recebimento;qtd;ano;mês)\n' +
                    '0 – Só modo IA (perguntas sobre o AXIS ou outras)\n\n' +
                    'Envie *menu* para ver estas opções de novo.';
            } else {
                welcome = firstName
                    ? 'Olá, ' + firstName + '! Sou o AXIS Bot — posso ajudar com o sistema AXIS (módulos, menus, fluxos) e também com dúvidas gerais: estudo, redação, ideias, explicações e outras perguntas do dia a dia, quando a IA do servidor estiver ativa. Em que posso ajudar?'
                    : 'Olá! Sou o AXIS Bot — ajudo com o sistema AXIS e com perguntas gerais (estudo, texto, explicações, etc.) via IA no servidor. Como posso ajudar?';
            }
            appendMessage('bot', welcome);
            chatHistory.push({ role: 'assistant', content: welcome });
        }
    }

    function maybeShowRobot() {
        var wrap = document.querySelector('.axis-robot-wrap');
        if (!wrap) return;
        if (document.body && document.body.classList.contains('melihelp-hub-body')) {
            wrap.style.visibility = 'visible';
            wrap.style.pointerEvents = 'auto';
            wrap.style.opacity = '1';
            return;
        }
        var mainContent = document.getElementById('main-content');
        var authScreen = document.getElementById('auth-screen');
        var mainDisplay = mainContent ? getComputedStyle(mainContent).display : 'none';
        var authDisplay = authScreen ? getComputedStyle(authScreen).display : 'none';
        var mainVis = mainContent && mainDisplay !== 'none';
        var mainOpacity = mainContent ? getComputedStyle(mainContent).opacity : '0';
        var authVisible = authScreen && authDisplay !== 'none';
        var show = mainVis && !authVisible && mainOpacity !== '0';
        wrap.style.visibility = show ? 'visible' : 'hidden';
        wrap.style.pointerEvents = show ? 'auto' : 'none';
        wrap.style.opacity = show ? '1' : '0';
    }

    window.axisRobotMaybeShow = maybeShowRobot;

    function scheduleRobotVisibility() {
        maybeShowRobot();
        setTimeout(maybeShowRobot, 50);
        setTimeout(maybeShowRobot, 200);
        setTimeout(maybeShowRobot, 600);
        setTimeout(maybeShowRobot, 1500);
        setTimeout(maybeShowRobot, 3200);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            createRobot();
            scheduleRobotVisibility();
        });
    } else {
        createRobot();
        scheduleRobotVisibility();
    }
    window.addEventListener('load', function() {
        setTimeout(maybeShowRobot, 0);
        setTimeout(maybeShowRobot, 300);
    });
})();
