/**
 * AXIS Robot Assistant - Robô em holograma
 * Assistente IA flutuante, integrado à API mais inteligente (OpenAI GPT-4o).
 * Conhece todo o site e cada função.
 */

(function() {
    'use strict';

    var ROBOT_SVG = '<svg class="axis-robot-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<defs><linearGradient id="axis-robot-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#00d4ff"/><stop offset="100%" style="stop-color:#2ecc71"/></linearGradient>' +
        '<filter id="axis-robot-glow"><feGaussianBlur stdDeviation="1.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
        '<circle cx="32" cy="34" r="18" fill="url(#axis-robot-grad)" opacity="0.9" filter="url(#axis-robot-glow)"/>' +
        '<circle cx="26" cy="32" r="4" fill="#0a1420"/><circle cx="38" cy="32" r="4" fill="#0a1420"/>' +
        '<rect x="28" y="40" width="8" height="4" rx="1" fill="#0a1420"/>' +
        '<path d="M32 14 L32 22 M28 18 L32 14 L36 18" stroke="url(#axis-robot-grad)" stroke-width="2" stroke-linecap="round" fill="none"/>' +
        '</svg>';

    var HEADER_SVG = '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="34" r="16" fill="rgba(0,212,255,0.4)"/><circle cx="26" cy="32" r="3" fill="#0a1420"/><circle cx="38" cy="32" r="3" fill="#0a1420"/><rect x="29" y="40" width="6" height="3" rx="1" fill="#0a1420"/><path d="M32 18 L32 24 M29 21 L32 18 L35 21" stroke="rgba(255,255,255,0.8)" stroke-width="1.5" fill="none"/></svg>';

    function createRobot() {
        var wrap = document.createElement('div');
        wrap.className = 'axis-robot-wrap';
        wrap.innerHTML =
            '<button type="button" class="axis-robot-trigger" aria-label="Abrir assistente AXIS" title="Assistente AXIS – tire dúvidas sobre o sistema">' +
            '  <div class="axis-robot-avatar">' + ROBOT_SVG + '</div>' +
            '</button>' +
            '<div class="axis-robot-panel" id="axis-robot-panel" role="dialog" aria-label="Chat com assistente AXIS" aria-hidden="true">' +
            '  <div class="axis-robot-panel-header">' +
            '    <div class="axis-robot-panel-avatar">' + HEADER_SVG + '</div>' +
            '    <div class="axis-robot-panel-title-wrap"><div class="axis-robot-panel-title">AXIS Bot</div><div class="axis-robot-panel-subtitle">Assistente em tempo real</div></div>' +
            '    <label class="axis-robot-tts-toggle" title="Falar respostas automaticamente (voz masculina)"><input type="checkbox" id="axis-robot-tts-auto" aria-label="Falar respostas"/><span class="axis-robot-tts-icon" aria-hidden="true">🔊</span></label>' +
            '    <button type="button" class="axis-robot-panel-close" aria-label="Fechar">×</button>' +
            '  </div>' +
            '  <div class="axis-robot-messages" id="axis-robot-messages"></div>' +
            '  <div class="axis-robot-input-wrap">' +
            '    <div class="axis-robot-input-row">' +
            '      <textarea class="axis-robot-input" id="axis-robot-input" placeholder="Pergunte sobre o AXIS..." rows="1"></textarea>' +
            '      <button type="button" class="axis-robot-send" id="axis-robot-send" aria-label="Enviar">' +
            '        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>' +
            '      </button>' +
            '    </div>' +
            '  </div>' +
            '</div>';
        wrap.style.visibility = 'hidden';
        wrap.style.pointerEvents = 'none';
        document.body.appendChild(wrap);
        var navActions = document.querySelector('.nav-actions');
        var themeBtn = document.getElementById('theme-toggle');
        if (navActions && themeBtn) {
            navActions.insertBefore(wrap, themeBtn);
            wrap.classList.add('axis-robot-in-nav');
        }

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
            appendMessage('bot', '', true);
            setSendLoading(true);

            var userName = (typeof currentUser === 'string' && currentUser) ? currentUser : (localStorage.getItem('current_user') || '');
            var base = window.location.origin || '';
            fetch(base + '/api/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history: chatHistory.slice(0, -1), userName: userName })
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
            var welcome = firstName ? 'Olá, ' + firstName + '! Sou o AXIS Bot, seu assistente no sistema. Pergunte como usar um módulo, onde fica uma função ou qualquer dúvida sobre o AXIS. Estou aqui para ajudar.' : 'Olá! Sou o AXIS Bot, seu assistente no sistema. Pergunte como usar um módulo, onde fica uma função ou qualquer dúvida sobre o AXIS. Estou aqui para ajudar.';
            appendMessage('bot', welcome);
            chatHistory.push({ role: 'assistant', content: welcome });
        }
    }

    function maybeShowRobot() {
        var mainContent = document.getElementById('main-content');
        var authScreen = document.getElementById('auth-screen');
        var wrap = document.querySelector('.axis-robot-wrap');
        if (!wrap) return;
        var mainDisplay = mainContent ? getComputedStyle(mainContent).display : 'none';
        var authDisplay = authScreen ? getComputedStyle(authScreen).display : 'none';
        var mainVisible = mainContent && mainDisplay !== 'none';
        var authVisible = authScreen && authDisplay !== 'none';
        var show = mainVisible && !authVisible;
        wrap.style.visibility = show ? 'visible' : 'hidden';
        wrap.style.pointerEvents = show ? 'auto' : 'none';
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            createRobot();
            maybeShowRobot();
            setTimeout(maybeShowRobot, 100);
            setTimeout(maybeShowRobot, 1500);
        });
    } else {
        createRobot();
        maybeShowRobot();
        setTimeout(maybeShowRobot, 100);
        setTimeout(maybeShowRobot, 1500);
    }
})();
