/**
 * Editor dos links dos portais SELBETTI — só a partir de Administração AXIS.
 * Grava no mesmo localStorage que pages/selbetti.html (axis_selbetti_hub_v1_digital_urls).
 */
(function () {
    'use strict';

    var URLS_KEY = 'axis_selbetti_hub_v1_digital_urls';

    var DIGITAL_TOOLS = [
        { id: 'smartshare', label: 'SMARTSHARE', emoji: '☁️' },
        { id: 'uniselbetti', label: 'UNISELBETTI', emoji: '🎓' },
        { id: 'shop', label: 'SHOP SELBETTI', emoji: '🛒' },
        { id: 'portal_cliente', label: 'PORTAL DO CLIENTE', emoji: '🤝' },
        { id: 'wap', label: 'WAP (CANAL DO TÉCNICO)', emoji: '📱' },
        { id: 'patrimonio', label: 'O PATRIMÔNIO TA ON', emoji: '📦' },
        { id: 'satelitti', label: 'SATELITTI', emoji: '🛰️' },
        { id: 'feedz', label: 'FEEDZ', emoji: '📊' },
        { id: 'outlook', label: 'OUTLOOK', emoji: '📧' },
        { id: 'engage', label: 'ENGAGE', emoji: '📣' },
        { id: 'teams', label: 'TEAMS', emoji: '💬' },
        { id: 'selbnews', label: 'SELBNEWS', emoji: '📰' }
    ];

    var BUILTIN_PORTAL_URLS = {
        smartshare: 'https://www.selbetti.com.br/smartshare/home/auth/login',
        uniselbetti: 'https://universidade.selbetti.com.br/?_gl=1*1kcha7i*_gcl_au*MTE1OTQ3NjExOC4xNzc0MjEyMzQz#/login',
        shop: 'https://shop.selbetti.com.br/?_gl=1*y1i5es*_gcl_au*MTE1OTQ3NjExOC4xNzc0MjEyMzQz',
        portal_cliente: 'https://www.selbetti.com.br/canal_cliente_novo/login',
        wap: 'https://www.selbetti.com.br/wap2/index.asp',
        patrimonio: 'https://opatrimoniotaon.com.br/index.php',
        satelitti: 'https://selbetti.satelitti.com.br/suite-new/auth/login',
        feedz: 'https://app.feedz.com.br/',
        outlook: 'https://outlook.office.com/mail/',
        engage: 'https://viva.cloud.microsoft/',
        teams: 'https://teams.microsoft.com/v2',
        selbnews: 'https://selbetti365.sharepoint.com/'
    };

    function esc(s) {
        if (s == null) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/"/g, '&quot;');
    }

    function escAttr(s) {
        if (s == null) return '';
        return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    }

    function loadJson(key, fallback) {
        try {
            var raw = localStorage.getItem(key);
            if (!raw) return fallback;
            return JSON.parse(raw);
        } catch (e) {
            return fallback;
        }
    }

    function saveJson(key, val) {
        try {
            localStorage.setItem(key, JSON.stringify(val));
            return true;
        } catch (e) {
            return false;
        }
    }

    function getDigitalUrls() {
        var o = loadJson(URLS_KEY, {});
        return o && typeof o === 'object' ? o : {};
    }

    function setDigitalUrls(o) {
        return saveJson(URLS_KEY, o);
    }

    function getResolvedUrl(id) {
        var custom = getDigitalUrls();
        if (custom[id] != null && String(custom[id]).trim() !== '') {
            return String(custom[id]).trim();
        }
        return BUILTIN_PORTAL_URLS[id] || '';
    }

    function $(id) {
        return document.getElementById(id);
    }

    function toast(msg) {
        if (typeof window.showToast === 'function') window.showToast(msg, 'success');
        else alert(msg);
    }

    function toastErr(msg) {
        if (typeof window.showToast === 'function') window.showToast(msg, 'error');
        else alert(msg);
    }

    function fecharModalPortaisSelbetti() {
        var m = $('modal-selbetti-portais-links');
        if (m) m.style.display = 'none';
    }

    function popularFormularioPortais() {
        var form = $('axis-portal-links-form');
        if (!form) return;
        form.innerHTML = DIGITAL_TOOLS.map(function (t) {
            var v = getResolvedUrl(t.id);
            return '<div class="input-group axis-portal-links-row">' +
                '<label for="axis-pl-' + esc(t.id) + '">' + t.emoji + ' ' + esc(t.label) + '</label>' +
                '<input type="url" id="axis-pl-' + esc(t.id) + '" data-portal-id="' + escAttr(t.id) + '" placeholder="https://..." value="' + escAttr(v) + '">' +
                '</div>';
        }).join('');
    }

    function salvarPortaisSelbetti() {
        var out = {};
        DIGITAL_TOOLS.forEach(function (t) {
            var inp = $('axis-pl-' + t.id);
            if (inp) out[t.id] = (inp.value || '').trim();
        });
        if (!setDigitalUrls(out)) {
            toastErr('Não foi possível guardar (armazenamento cheio ou bloqueado).');
            return;
        }
        fecharModalPortaisSelbetti();
        toast('Links SELBETTI guardados neste aparelho.');
    }

    function restaurarPadraoPortaisSelbetti() {
        var copy = JSON.parse(JSON.stringify(BUILTIN_PORTAL_URLS));
        if (!setDigitalUrls(copy)) {
            toastErr('Não foi possível restaurar.');
            return;
        }
        popularFormularioPortais();
        toast('Links restaurados para os endereços Selbetti / padrão.');
    }

    function initModalPortaisSelbetti() {
        var m = $('modal-selbetti-portais-links');
        if (!m || m.getAttribute('data-axis-inited') === '1') return;
        m.setAttribute('data-axis-inited', '1');

        var closeBtn = $('modal-selbetti-portais-close');
        if (closeBtn) closeBtn.addEventListener('click', fecharModalPortaisSelbetti);

        m.addEventListener('click', function (e) {
            if (e.target === m) fecharModalPortaisSelbetti();
        });

        var saveBtn = $('axis-portal-links-save');
        if (saveBtn) saveBtn.addEventListener('click', salvarPortaisSelbetti);

        var resetBtn = $('axis-portal-links-reset');
        if (resetBtn) resetBtn.addEventListener('click', restaurarPadraoPortaisSelbetti);
    }

    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        var m = $('modal-selbetti-portais-links');
        if (m && m.style.display === 'flex') fecharModalPortaisSelbetti();
    });

    window.axisSelbettiPortalLinksOpen = function () {
        initModalPortaisSelbetti();
        popularFormularioPortais();
        var m = $('modal-selbetti-portais-links');
        if (m) m.style.display = 'flex';
    };
})();
