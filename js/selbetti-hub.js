/**
 * SELBETTI Hub — menu, rotas, armazenamento local, links digitais
 */
(function () {
    'use strict';

    var NS = 'axis_selbetti_hub_v1';
    var URLS_KEY = NS + '_digital_urls';
    var TRASH_KEY = NS + '_docs_trash';
    /** Limite por ficheiro (imagens HD/4K, PDFs grandes). O armazenamento é no navegador (localStorage), não no servidor. */
    var MAX_FILE_BYTES = 100 * 1024 * 1024;
    /** Prazo na lixeira antes da exclusão automática (30 dias corridos) */
    var TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

    var MESES = [
        { id: '01', label: 'JANEIRO' },
        { id: '02', label: 'FEVEREIRO' },
        { id: '03', label: 'MARÇO' },
        { id: '04', label: 'ABRIL' },
        { id: '05', label: 'MAIO' },
        { id: '06', label: 'JUNHO' },
        { id: '07', label: 'JULHO' },
        { id: '08', label: 'AGOSTO' },
        { id: '09', label: 'SETEMBRO' },
        { id: '10', label: 'OUTUBRO' },
        { id: '11', label: 'NOVEMBRO' },
        { id: '12', label: 'DEZEMBRO' }
    ];

    /** Logos em assets/IMAGENS (caminho relativo a pages/selbetti.html) — fallback emoji se a imagem falhar */
    var DIGITAL_IMG_BASE = '../assets/IMAGENS/';

    /* Ordem e rótulos alinhados ao menu do técnico */
    var DIGITAL_TOOLS = [
        { id: 'smartshare', label: 'SMARTSHARE', emoji: '☁️', hint: 'SmartShare', iconImg: DIGITAL_IMG_BASE + 'Smart_Share.png.png' },
        { id: 'uniselbetti', label: 'UNISELBETTI', emoji: '🎓', hint: 'Universidade' },
        { id: 'shop', label: 'SHOP SELBETTI', emoji: '🛒', hint: 'Loja virtual', iconImg: DIGITAL_IMG_BASE + 'satelitti.png.png' },
        { id: 'portal_cliente', label: 'PORTAL DO CLIENTE', emoji: '🤝', hint: 'Canal cliente', iconImg: DIGITAL_IMG_BASE + 'portal_do_cliente.png.png' },
        { id: 'wap', label: 'WAP (CANAL DO TÉCNICO)', emoji: '📱', hint: 'Canal do técnico', iconImg: DIGITAL_IMG_BASE + 'smart_manager_png.png' },
        { id: 'patrimonio', label: 'O PATRIMÔNIO TA ON', emoji: '📦', hint: 'PTO', iconImg: DIGITAL_IMG_BASE + 'O_Patrimonio_Ta_On.png.png' },
        { id: 'satelitti', label: 'SATELITTI', emoji: '🛰️', hint: 'Suite', iconImg: DIGITAL_IMG_BASE + 'satelitti.png.png' },
        { id: 'feedz', label: 'FEEDZ', emoji: '📊', hint: 'TOTVS RH', iconImg: DIGITAL_IMG_BASE + 'Feedz.png.png' },
        { id: 'outlook', label: 'OUTLOOK', emoji: '📧', hint: 'E-mail', iconImg: DIGITAL_IMG_BASE + 'logo_outlook.png.png.png' },
        { id: 'engage', label: 'ENGAGE', emoji: '📣', hint: 'Viva / Engage', iconImg: DIGITAL_IMG_BASE + 'engaje.png.png.png' },
        { id: 'teams', label: 'TEAMS', emoji: '💬', hint: 'Microsoft Teams', iconImg: DIGITAL_IMG_BASE + 'teams.png.png' },
        { id: 'selbnews', label: 'SELBNEWS', emoji: '📰', hint: 'SharePoint Selbetti', iconImg: DIGITAL_IMG_BASE + 'portal_do_cliente.png.png' }
    ];

    /**
     * URLs oficiais Selbetti / parceiros (Microsoft em entrada estável — login no site).
     * Personalização: administradores editam em AXIS → Administração → Links SELBETTI (portais).
     */
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

    var pendingUploadTarget = null;
    var toastTimer = null;
    var trashCountdownTimer = null;

    function $(id) { return document.getElementById(id); }

    function showToast(msg) {
        var el = $('selbetti-toast');
        if (!el) return;
        el.textContent = msg;
        el.hidden = false;
        el.classList.add('is-on');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            el.classList.remove('is-on');
            setTimeout(function () { el.hidden = true; }, 400);
        }, 3200);
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
            showToast('Armazenamento cheio ou indisponível. Libere espaço ou remova arquivos.');
            return false;
        }
    }

    function getDigitalUrls() {
        var o = loadJson(URLS_KEY, {});
        return o && typeof o === 'object' ? o : {};
    }

    function setDigitalUrls(o) {
        saveJson(URLS_KEY, o);
    }

    function docsStorageKey(category, year, month) {
        if (category === 'certificados') return NS + '_docs_certificados';
        if (category === 'ferramentas_estoque') return NS + '_docs_ferramentas_estoque';
        return NS + '_docs_' + category + '_' + year + '_' + month;
    }

    function loadDocs(key) {
        var list = loadJson(key, []);
        return Array.isArray(list) ? list : [];
    }

    function saveDocs(key, list) {
        return saveJson(key, list);
    }

    function loadTrash() {
        var list = loadJson(TRASH_KEY, []);
        return Array.isArray(list) ? list : [];
    }

    function saveTrash(list) {
        return saveJson(TRASH_KEY, list);
    }

    function trashExpiresAtMs(entry) {
        if (entry && entry.expiresAt) {
            var t = new Date(entry.expiresAt).getTime();
            if (!isNaN(t)) return t;
        }
        var d = entry && entry.deletedAt ? new Date(entry.deletedAt).getTime() : NaN;
        if (!isNaN(d)) return d + TRASH_RETENTION_MS;
        return Date.now() + TRASH_RETENTION_MS;
    }

    function purgeExpiredTrash() {
        var trash = loadTrash();
        var now = Date.now();
        var kept = trash.filter(function (e) { return trashExpiresAtMs(e) > now; });
        if (kept.length !== trash.length) saveTrash(kept);
        return kept;
    }

    function formatTrashRemaining(expiresMs) {
        var rem = Math.max(0, expiresMs - Date.now());
        var d = Math.floor(rem / 86400000);
        var h = Math.floor((rem % 86400000) / 3600000);
        var m = Math.floor((rem % 3600000) / 60000);
        var s = Math.floor((rem % 60000) / 1000);
        if (d > 0) return d + ' dia' + (d !== 1 ? 's' : '') + ', ' + h + ' h';
        if (h > 0) return h + ' h ' + m + ' min';
        if (m > 0) return m + ' min ' + s + ' s';
        return s + ' s';
    }

    function stopTrashCountdownTimer() {
        if (trashCountdownTimer) {
            clearInterval(trashCountdownTimer);
            trashCountdownTimer = null;
        }
    }

    function updateTrashCountdownLabels() {
        var main = $('selbetti-main');
        if (!main) return;
        var nodes = main.querySelectorAll('.selbetti-trash-countdown');
        if (!nodes.length) return;
        var now = Date.now();
        var needRerender = false;
        nodes.forEach(function (el) {
            var exp = parseInt(el.getAttribute('data-expires'), 10);
            var textSpan = el.querySelector('.selbetti-trash-countdown-text');
            if (!textSpan) return;
            if (!exp || isNaN(exp)) {
                textSpan.textContent = '';
                return;
            }
            if (now >= exp) {
                textSpan.textContent = 'Removendo automaticamente…';
                needRerender = true;
                return;
            }
            textSpan.textContent = 'Exclusão automática em ' + formatTrashRemaining(exp);
        });
        if (needRerender) {
            purgeExpiredTrash();
            render();
        }
    }

    function startTrashCountdownTimer() {
        stopTrashCountdownTimer();
        updateTrashCountdownLabels();
        trashCountdownTimer = setInterval(updateTrashCountdownLabels, 1000);
    }

    function pushToTrash(docItem, sourceKey) {
        var now = Date.now();
        var trash = loadTrash();
        trash.push({
            trashId: String(now) + '_' + Math.random().toString(36).slice(2, 10),
            deletedAt: new Date(now).toISOString(),
            expiresAt: new Date(now + TRASH_RETENTION_MS).toISOString(),
            sourceKey: sourceKey,
            doc: {
                id: docItem.id,
                name: docItem.name,
                mime: docItem.mime,
                size: docItem.size,
                addedAt: docItem.addedAt,
                dataUrl: docItem.dataUrl
            }
        });
        saveTrash(trash);
    }

    function labelForSourceKey(key) {
        if (!key) return 'Documentos';
        if (key.indexOf('_docs_certificados') !== -1) return 'Certificados';
        if (key.indexOf('_docs_ferramentas_estoque') !== -1) return 'FERRAMENTAS DE TRABALHO';
        var m = key.match(/_docs_orcamentos_(\d{4})_(\d{2})$/);
        if (m) return 'Orçamentos · ' + monthLabel(m[2]) + ' | ' + m[1];
        m = key.match(/_docs_atas_(\d{4})_(\d{2})$/);
        if (m) return 'Atas e reuniões · ' + monthLabel(m[2]) + ' | ' + m[1];
        return 'Documentos';
    }

    function parseRoute() {
        var h = (location.hash || '#/home').replace(/^#\/?/, '').trim();
        if (!h || h === 'home') return { type: 'home' };
        var p = h.split('/').filter(Boolean);
        var a = p[0];
        if (a === 'lixeira') return { type: 'docs_trash' };
        if (a === 'certificados') return { type: 'docs', category: 'certificados' };
        if (a === 'digital') return { type: 'digital' };
        if (a === 'orcamentos') {
            if (p[1] && p[2]) return { type: 'docs', category: 'orcamentos', year: p[1], month: p[2] };
            return { type: 'dash_orcamentos' };
        }
        if (a === 'atas') {
            if (p[1] && p[2]) return { type: 'docs', category: 'atas', year: p[1], month: p[2] };
            return { type: 'dash_atas' };
        }
        if (a === 'ferramentas' && p[1] === 'estoque') {
            return { type: 'docs', category: 'ferramentas_estoque' };
        }
        return { type: 'home' };
    }

    function setRoute(routeStr) {
        location.hash = '#/' + routeStr;
    }

    function monthLabel(id) {
        var m = MESES.find(function (x) { return x.id === id; });
        return m ? m.label : id;
    }

    function breadcrumb(route) {
        if (route.type === 'home') return 'Início';
        if (route.type === 'digital') return 'FERRAMENTAS DIGITAIS SELBETTI';
        if (route.type === 'dash_orcamentos') return 'ORÇAMENTOS';
        if (route.type === 'dash_atas') return 'ATAS E REUNIÕES';
        if (route.type === 'docs') {
            if (route.category === 'certificados') return 'Certificados';
            if (route.category === 'ferramentas_estoque') return 'FERRAMENTAS DE TRABALHO';
            if (route.category === 'orcamentos') {
                return monthLabel(route.month) + ' | ' + route.year;
            }
            if (route.category === 'atas') {
                return monthLabel(route.month) + ' | ' + route.year;
            }
        }
        if (route.type === 'docs_trash') return 'Lixeira';
        return 'SELBETTI';
    }

    function esc(s) {
        if (s == null) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/"/g, '&quot;');
    }

    function escAttr(s) {
        if (s == null) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;');
    }

    function getResolvedUrl(id) {
        var custom = getDigitalUrls();
        if (custom[id] != null && String(custom[id]).trim() !== '') {
            return String(custom[id]).trim();
        }
        return BUILTIN_PORTAL_URLS[id] || '';
    }

    function formatDate(iso) {
        try {
            var d = new Date(iso);
            return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
        } catch (e) {
            return iso;
        }
    }

    function formatBytes(n) {
        if (n < 1024) return n + ' B';
        if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
        return (n / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function pad2(n) {
        return n < 10 ? '0' + n : String(n);
    }

    /** Agrega contagem por mês para painel (dados só no localStorage deste navegador). */
    function aggregateCategoryByMonths(category, years) {
        var totalFiles = 0;
        var totalBytes = 0;
        var monthsWithFiles = 0;
        var entries = [];
        years.forEach(function (y) {
            MESES.forEach(function (m) {
                var key = docsStorageKey(category, y, m.id);
                var list = loadDocs(key);
                var bytes = 0;
                for (var i = 0; i < list.length; i++) bytes += list[i].size || 0;
                if (list.length) monthsWithFiles++;
                totalFiles += list.length;
                totalBytes += bytes;
                entries.push({
                    year: y,
                    monthId: m.id,
                    monthLabel: m.label,
                    count: list.length,
                    bytes: bytes,
                    route: category + '/' + y + '/' + m.id
                });
            });
        });
        entries.sort(function (a, b) {
            if (a.year !== b.year) return parseInt(b.year, 10) - parseInt(a.year, 10);
            return parseInt(b.monthId, 10) - parseInt(a.monthId, 10);
        });
        return { totalFiles: totalFiles, totalBytes: totalBytes, monthsWithFiles: monthsWithFiles, entries: entries };
    }

    /** Anima os três valores do painel em paralelo (mesma duração). */
    function runDashStatAnimations(panelEl, agg) {
        if (!panelEl) return;
        var vals = panelEl.querySelectorAll('.selbetti-dash-stat-val');
        if (vals.length !== 3) return;
        var tf = agg.totalFiles;
        var tm = agg.monthsWithFiles;
        var tb = agg.totalBytes;
        if (tf === 0 && tm === 0 && tb === 0) {
            vals[0].textContent = '0';
            vals[1].textContent = '0';
            vals[2].textContent = formatBytes(0);
            return;
        }
        var duration = 520;
        var t0 = null;
        function ease(p) {
            return 0.5 - Math.cos(Math.min(1, p) * Math.PI) / 2;
        }
        function frame(ts) {
            if (t0 == null) t0 = ts;
            var p = Math.min(1, (ts - t0) / duration);
            var e = ease(p);
            vals[0].textContent = String(Math.round(tf * e));
            vals[1].textContent = String(Math.round(tm * e));
            vals[2].textContent = formatBytes(Math.max(0, Math.round(tb * e)));
            if (p < 1) {
                requestAnimationFrame(frame);
            } else {
                vals[0].textContent = String(tf);
                vals[1].textContent = String(tm);
                vals[2].textContent = formatBytes(tb);
            }
        }
        vals[0].textContent = '0';
        vals[1].textContent = '0';
        vals[2].textContent = formatBytes(0);
        requestAnimationFrame(frame);
    }

    function renderDocsCategoryDashboard(category, years, heading) {
        var agg = aggregateCategoryByMonths(category, years);
        var withFiles = agg.entries.filter(function (e) { return e.count > 0; });

        var statsHtml =
            '<div class="selbetti-dash-stats">' +
            '<div class="selbetti-dash-stat glass-panel"><span class="selbetti-dash-stat-val">0</span><span class="selbetti-dash-stat-label">Arquivos guardados</span></div>' +
            '<div class="selbetti-dash-stat glass-panel"><span class="selbetti-dash-stat-val">0</span><span class="selbetti-dash-stat-label">Meses com conteúdo</span></div>' +
            '<div class="selbetti-dash-stat glass-panel"><span class="selbetti-dash-stat-val">' + esc(formatBytes(0)) + '</span><span class="selbetti-dash-stat-label">Tamanho total (aproximadamente)</span></div>' +
            '</div>';

        var gridHtml;
        if (withFiles.length) {
            gridHtml =
                '<div class="selbetti-dash-section">' +
                '<h3 class="selbetti-dash-h3">Pastas com arquivos</h3>' +
                '<div class="selbetti-dash-month-grid">' +
                withFiles.map(function (e) {
                    return '<button type="button" class="selbetti-dash-month-chip glass-panel" data-go="' + escAttr(e.route) + '">' +
                        '<span class="selbetti-dash-month-chip-label">' + esc(e.monthLabel) + ' ' + esc(e.year) + '</span>' +
                        '<span class="selbetti-dash-month-chip-badge">' + e.count + '</span></button>';
                }).join('') +
                '</div></div>';
        } else {
            gridHtml =
                '<div class="selbetti-dash-section">' +
                '<div class="selbetti-dash-inventario-card glass-panel" role="status">' +
                '<div class="selbetti-dash-inventario-icon" aria-hidden="true">📦</div>' +
                '<h3 class="selbetti-dash-inventario-title txt-axis-gradient-selb">SEM ARQUIVOS</h3>' +
                '</div></div>';
        }

        var main = $('selbetti-main');
        main.innerHTML =
            '<section class="selbetti-panel glass-panel selbetti-dash-panel">' +
            '<header class="selbetti-dash-head">' +
            '<h2 class="selbetti-dash-title">' + esc(heading) + '</h2>' +
            '</header>' +
            statsHtml +
            gridHtml +
            '</section>';

        var panel = main.querySelector('.selbetti-dash-panel');
        runDashStatAnimations(panel, agg);

        main.querySelectorAll('[data-go]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                setRoute(btn.getAttribute('data-go'));
            });
        });
    }

    function buildNavHtml() {
        var h = '';
        h += '<button type="button" class="selbetti-nav-item" data-route="home">🏠 INÍCIO</button>';
        h += '<button type="button" class="selbetti-nav-item" data-route="certificados">📜 CERTIFICADOS</button>';

        h += '<details class="selbetti-nav-group selbetti-nav-hub-root" open><summary class="selbetti-nav-summary selbetti-nav-summary-root">💰 ORÇAMENTOS</summary><div class="selbetti-nav-nested">';
        h += '<button type="button" class="selbetti-nav-item" data-route="orcamentos">🖥️ PAINEL</button>';
        h += '<details class="selbetti-nav-group selbetti-nav-months-wrap" open><summary class="selbetti-nav-summary">MESES POR ANO</summary><div class="selbetti-nav-nested">';
        ['2025', '2026'].forEach(function (y) {
            h += '<details class="selbetti-nav-group"><summary class="selbetti-nav-summary">' + esc(y) + '</summary><div class="selbetti-nav-nested">';
            MESES.forEach(function (m) {
                h += '<button type="button" class="selbetti-nav-item" data-route="orcamentos/' + y + '/' + m.id + '">' + esc(m.label) + '</button>';
            });
            h += '</div></details>';
        });
        h += '</div></details>';
        h += '</div></details>';

        h += '<details class="selbetti-nav-group selbetti-nav-hub-root" open><summary class="selbetti-nav-summary selbetti-nav-summary-root">📝 ATAS E REUNIÕES</summary><div class="selbetti-nav-nested">';
        h += '<button type="button" class="selbetti-nav-item" data-route="atas">🖥️ PAINEL</button>';
        h += '<details class="selbetti-nav-group selbetti-nav-months-wrap" open><summary class="selbetti-nav-summary">MESES POR ANO</summary><div class="selbetti-nav-nested">';
        h += '<details class="selbetti-nav-group"><summary class="selbetti-nav-summary">2026</summary><div class="selbetti-nav-nested">';
        MESES.forEach(function (m) {
            h += '<button type="button" class="selbetti-nav-item" data-route="atas/2026/' + m.id + '">' + esc(m.label) + '</button>';
        });
        h += '</div></details>';
        h += '</div></details>';
        h += '</div></details>';

        h += '<details class="selbetti-nav-group"><summary class="selbetti-nav-summary">🛠️ FERRAMENTAS</summary><div class="selbetti-nav-nested">';
        h += '<button type="button" class="selbetti-nav-item" data-route="ferramentas/estoque">🔧 ESTOQUE DE FERRAMENTAS DE TRABALHO</button>';
        h += '</div></details>';

        h += '<button type="button" class="selbetti-nav-item" data-route="digital">🌐 FERRAMENTAS DIGITAIS SELBETTI</button>';
        h += '<button type="button" class="selbetti-nav-item" data-route="lixeira">🗑️ LIXEIRA</button>';
        h += '<a href="../index.html?axis_voltar=1#page-home" class="selbetti-nav-item selbetti-nav-back-home" id="selbetti-nav-back-home">VOLTAR AO INÍCIO</a>';

        return h;
    }

    /** Nome em exibição do utilizador AXIS (mesma origem que a home principal). */
    function getAxisSelbettiUserDisplayName() {
        try {
            var raw = (localStorage.getItem('current_user') || '').trim();
            if (raw) return raw;
            return 'técnico';
        } catch (e) {
            return 'técnico';
        }
    }

    function highlightNav(route) {
        var root = $('selbetti-nav-root');
        if (!root) return;
        root.querySelectorAll('.selbetti-nav-item').forEach(function (btn) {
            var r = btn.getAttribute('data-route') || '';
            var active = false;
            if (route.type === 'home' && r === 'home') active = true;
            if (route.type === 'digital' && r === 'digital') active = true;
            if (route.type === 'docs' && route.category === 'certificados' && r === 'certificados') active = true;
            if (route.type === 'docs' && route.category === 'ferramentas_estoque' && r === 'ferramentas/estoque') active = true;
            if (route.type === 'dash_orcamentos' && r === 'orcamentos') active = true;
            if (route.type === 'dash_atas' && r === 'atas') active = true;
            if (route.type === 'docs' && route.category === 'orcamentos' && r === 'orcamentos/' + route.year + '/' + route.month) active = true;
            if (route.type === 'docs' && route.category === 'atas' && r === 'atas/' + route.year + '/' + route.month) active = true;
            if (route.type === 'docs_trash' && r === 'lixeira') active = true;
            btn.classList.toggle('is-active', active);
        });
    }

    function renderHome() {
        var main = $('selbetti-main');
        var userName = esc(getAxisSelbettiUserDisplayName());
        main.innerHTML =
            '<section class="selbetti-hero glass-panel">' +
            '<h2>Olá, ' + userName + ' 👋</h2>' +
            '<p class="selbetti-hero-lead">Certificados, orçamentos, atas, estoque e portais, organizados para você não perder tempo procurando.</p>' +
            '<div class="selbetti-quick-grid">' +
            '<button type="button" class="selbetti-quick-card glass-panel" data-go="certificados"><span class="emoji">📜</span>CERTIFICADOS</button>' +
            '<button type="button" class="selbetti-quick-card glass-panel" data-go="orcamentos"><span class="emoji">💰</span>ORÇAMENTOS</button>' +
            '<button type="button" class="selbetti-quick-card glass-panel" data-go="atas"><span class="emoji">📝</span>ATAS</button>' +
            '<button type="button" class="selbetti-quick-card glass-panel" data-go="ferramentas/estoque"><span class="emoji">🔧</span>ESTOQUE</button>' +
            '<button type="button" class="selbetti-quick-card glass-panel" data-go="digital"><span class="emoji">🌐</span>PORTAIS</button>' +
            '</div></section>';

        main.querySelectorAll('[data-go]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                setRoute(btn.getAttribute('data-go'));
            });
        });
    }

    function getDocsKeyForRoute(route) {
        if (route.category === 'certificados') return docsStorageKey('certificados');
        if (route.category === 'ferramentas_estoque') return docsStorageKey('ferramentas_estoque');
        if (route.category === 'orcamentos') return docsStorageKey('orcamentos', route.year, route.month);
        if (route.category === 'atas') return docsStorageKey('atas', route.year, route.month);
        return null;
    }

    function isPdfMime(mime, name) {
        var m = (mime || '').toLowerCase();
        if (m.indexOf('pdf') !== -1) return true;
        return /\.pdf$/i.test(name || '');
    }

    function isImageMime(mime) {
        return (mime || '').toLowerCase().indexOf('image/') === 0;
    }

    /**
     * Igual à ideia da Documentação AXIS: PDF no iframe sem sandbox e com URL blob:
     * (data: no iframe é bloqueado pelo Chrome — "Esta página foi bloqueada").
     */
    function revokeSelbettiPreviewBlob() {
        if (window._selbettiPreviewBlobUrl) {
            try { URL.revokeObjectURL(window._selbettiPreviewBlobUrl); } catch (e) {}
            window._selbettiPreviewBlobUrl = null;
        }
    }

    function dataUrlToBlob(dataUrl) {
        if (!dataUrl || typeof dataUrl !== 'string' || dataUrl.indexOf('data:') !== 0) return null;
        var comma = dataUrl.indexOf(',');
        if (comma < 0) return null;
        var header = dataUrl.slice(0, comma);
        var body = dataUrl.slice(comma + 1);
        var mime = 'application/octet-stream';
        var mh = header.match(/^data:([^;,]+)/);
        if (mh) mime = mh[1];
        var base64 = /;base64/i.test(header);
        try {
            if (base64) {
                var binary = atob(body.replace(/\s/g, ''));
                var len = binary.length;
                var arr = new Uint8Array(len);
                for (var i = 0; i < len; i++) arr[i] = binary.charCodeAt(i);
                return new Blob([arr], { type: mime.split(';')[0] });
            }
            return new Blob([decodeURIComponent(body)], { type: mime.split(';')[0] });
        } catch (e) {
            return null;
        }
    }

    function openDocPreview(dataUrl, fileName, mime) {
        var backdrop = $('selbetti-doc-preview');
        var iframe = $('selbetti-doc-preview-iframe');
        var img = $('selbetti-doc-preview-img');
        var fallback = $('selbetti-doc-preview-fallback');
        if (!backdrop || !iframe || !img || !fallback) return;
        revokeSelbettiPreviewBlob();
        $('selbetti-doc-preview-title').textContent = fileName || 'Documento';
        iframe.hidden = true;
        img.hidden = true;
        fallback.hidden = true;
        iframe.removeAttribute('src');
        iframe.removeAttribute('sandbox');
        img.removeAttribute('src');
        if (dataUrl && isPdfMime(mime, fileName)) {
            var blob = dataUrlToBlob(dataUrl);
            if (blob && blob.size > 0) {
                window._selbettiPreviewBlobUrl = URL.createObjectURL(blob);
                iframe.src = window._selbettiPreviewBlobUrl;
            } else {
                iframe.src = dataUrl;
            }
            iframe.style.minHeight = '420px';
            iframe.hidden = false;
        } else if (dataUrl && isImageMime(mime)) {
            img.hidden = false;
            img.src = dataUrl;
            img.alt = fileName || '';
        } else {
            fallback.hidden = false;
            fallback.textContent = 'Pré-visualização disponível para PDF e imagens. Use ABRIR ou BAIXAR.';
        }
        backdrop.hidden = false;
    }

    function closeDocPreview() {
        var backdrop = $('selbetti-doc-preview');
        var iframe = $('selbetti-doc-preview-iframe');
        var img = $('selbetti-doc-preview-img');
        revokeSelbettiPreviewBlob();
        if (iframe) {
            iframe.src = 'about:blank';
            iframe.hidden = true;
        }
        if (img) {
            img.removeAttribute('src');
            img.hidden = true;
        }
        if (backdrop) backdrop.hidden = true;
    }

    function renderDocs(route) {
        var key = getDocsKeyForRoute(route);
        var list = loadDocs(key);
        var main = $('selbetti-main');
        var title = breadcrumb(route);
        var panelMonthClass = (route.category === 'orcamentos' || route.category === 'atas' || route.category === 'ferramentas_estoque')
            ? ' selbetti-panel-month-folder'
            : '';

        var itemsHtml = list.length
            ? list.map(function (item) {
                var canPreview = !!(item.dataUrl && (isPdfMime(item.mime, item.name) || isImageMime(item.mime)));
                return '<li class="selbetti-doc-item">' +
                    '<div><strong>' + esc(item.name) + '</strong>' +
                    '<div class="selbetti-doc-meta">' + esc(formatDate(item.addedAt)) + ' · ' + esc(formatBytes(item.size || 0)) +
                    (item.mime ? ' · ' + esc(item.mime) : '') + '</div></div>' +
                    '<div class="selbetti-toolbar selbetti-doc-toolbar">' +
                    (item.dataUrl
                        ? (canPreview
                            ? '<button type="button" class="selbetti-btn selbetti-btn-ghost selbetti-btn-icon-only selbetti-preview-doc" data-id="' + esc(item.id) + '" title="Visualizar" aria-label="Visualizar"><i class="fas fa-eye"></i></button>'
                            : '') +
                          '<a class="selbetti-btn selbetti-btn-ghost selbetti-btn-download selbetti-btn-text-upper" href="' + esc(item.dataUrl) + '" download="' + escAttr(item.name) + '">BAIXAR</a>' +
                          '<button type="button" class="selbetti-btn selbetti-btn-ghost selbetti-btn-text-upper selbetti-open-data" data-id="' + esc(item.id) + '">ABRIR</button>'
                        : '') +
                    '<button type="button" class="selbetti-btn selbetti-btn-danger selbetti-btn-text-upper selbetti-remove-doc" data-id="' + esc(item.id) + '">REMOVER</button>' +
                    '</div></li>';
            }).join('')
            : '<div class="selbetti-empty"><span class="big">📂</span>Nenhum arquivo nesta pasta.<br>Use <strong>ADICIONAR ARQUIVOS</strong> para guardar PDFs, imagens (HD/4K), vídeos ou outros ficheiros — até ~' +
                Math.round(MAX_FILE_BYTES / (1024 * 1024)) +
                ' MB por arquivo. O limite real é o espaço que <strong>este navegador</strong> permite (armazenamento local, não o servidor).</div>';

        main.innerHTML =
            '<section class="selbetti-panel glass-panel' + panelMonthClass + '">' +
            '<div class="selbetti-panel-head">' +
            '<h2>' + esc(title) + '</h2>' +
            '<div class="selbetti-toolbar">' +
            '<button type="button" class="selbetti-btn selbetti-btn-primary selbetti-btn-text-upper" id="selbetti-add-files">ADICIONAR ARQUIVOS</button>' +
            '</div></div>' +
            '<ul class="selbetti-doc-list" id="selbetti-doc-list">' + itemsHtml + '</ul></section>';

        pendingUploadTarget = { key: key };

        $('selbetti-add-files').addEventListener('click', function () {
            $('selbetti-file-input').click();
        });

        main.querySelectorAll('.selbetti-remove-doc').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.getAttribute('data-id');
                var cur = loadDocs(key);
                var found = cur.find(function (x) { return String(x.id) === String(id); });
                if (found) pushToTrash(found, key);
                var next = cur.filter(function (x) { return String(x.id) !== String(id); });
                saveDocs(key, next);
                showToast('Arquivo movido para a lixeira.');
                render();
            });
        });

        main.querySelectorAll('.selbetti-open-data').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.getAttribute('data-id');
                var item = loadDocs(key).find(function (x) { return String(x.id) === String(id); });
                if (item && item.dataUrl) window.open(item.dataUrl, '_blank', 'noopener,noreferrer');
            });
        });

        main.querySelectorAll('.selbetti-preview-doc').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.getAttribute('data-id');
                var item = loadDocs(key).find(function (x) { return String(x.id) === String(id); });
                if (item && item.dataUrl) openDocPreview(item.dataUrl, item.name, item.mime);
            });
        });
    }

    function renderTrash() {
        stopTrashCountdownTimer();
        var main = $('selbetti-main');
        var trash = purgeExpiredTrash();

        var itemsHtml = trash.length
            ? trash.map(function (entry) {
                var d = entry.doc || {};
                var expMs = trashExpiresAtMs(entry);
                var countText = 'Exclusão automática em ' + formatTrashRemaining(expMs);
                return '<li class="selbetti-doc-item selbetti-trash-item">' +
                    '<div class="selbetti-trash-item-body">' +
                    '<strong>' + esc(d.name) + '</strong>' +
                    '<div class="selbetti-doc-meta">' + esc(formatDate(entry.deletedAt)) + ' · ' + esc(labelForSourceKey(entry.sourceKey)) +
                    (d.size != null ? ' · ' + esc(formatBytes(d.size)) : '') + '</div>' +
                    '<div class="selbetti-trash-countdown" data-expires="' + expMs + '">' +
                    '<i class="fas fa-clock" aria-hidden="true"></i> ' +
                    '<span class="selbetti-trash-countdown-text">' + esc(countText) + '</span></div></div>' +
                    '<div class="selbetti-toolbar selbetti-trash-actions">' +
                    '<button type="button" class="selbetti-btn selbetti-btn-ghost selbetti-btn-text-upper selbetti-restore-trash" data-tid="' + esc(entry.trashId) + '">RESTAURAR</button>' +
                    '<button type="button" class="selbetti-btn selbetti-btn-danger selbetti-btn-text-upper selbetti-purge-trash" data-tid="' + esc(entry.trashId) + '">EXCLUIR DEFINITIVAMENTE</button>' +
                    '</div></li>';
            }).join('')
            : '<div class="selbetti-empty selbetti-trash-empty"><span class="big">🗑️</span>A lixeira está vazia.<br>Não há arquivos aguardando exclusão ou restauração.</div>';

        main.innerHTML =
            '<section class="selbetti-panel glass-panel selbetti-trash-panel">' +
            '<header class="selbetti-trash-hero">' +
            '<h2 class="selbetti-trash-title">LIXEIRA</h2>' +
            '<div class="selbetti-trash-desc">' +
            '<p>Arquivos que você remove nas pastas do hub — <strong>Certificados</strong>, <strong>Orçamentos</strong>, <strong>Atas e reuniões</strong> ou <strong>Ferramentas de trabalho</strong> — são guardados aqui por <strong>30 dias corridos</strong>, a contar da data em que foram enviados para a lixeira.</p>' +
            '<p>Nesse período pode <strong>restaurar</strong> o ficheiro à pasta de onde veio ou <strong>excluir definitivamente</strong> quando quiser, sem esperar o fim dos 30 dias.</p>' +
            '<p>Decorridos os <strong>30 dias</strong>, o sistema <strong>remove permanentemente</strong> o arquivo do armazenamento local deste navegador. Essa exclusão automática <strong>não pode ser desfeita</strong>. Em cada item abaixo, o <strong>contador</strong> indica o tempo restante até essa remoção definitiva.</p>' +
            '</div>' +
            '</header>' +
            '<div class="selbetti-trash-list-wrap">' +
            '<ul class="selbetti-doc-list selbetti-trash-list" id="selbetti-trash-list">' + itemsHtml + '</ul>' +
            '</div>' +
            '</section>';

        main.querySelectorAll('.selbetti-restore-trash').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var tid = btn.getAttribute('data-tid');
                var t = loadTrash();
                var entry = t.find(function (x) { return String(x.trashId) === String(tid); });
                if (!entry || !entry.doc) return;
                var key = entry.sourceKey;
                var list = loadDocs(key);
                list.push(entry.doc);
                saveDocs(key, list);
                saveTrash(t.filter(function (x) { return String(x.trashId) !== String(tid); }));
                showToast('Arquivo restaurado.');
                render();
            });
        });

        main.querySelectorAll('.selbetti-purge-trash').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var tid = btn.getAttribute('data-tid');
                saveTrash(loadTrash().filter(function (x) { return String(x.trashId) !== String(tid); }));
                showToast('Removido definitivamente.');
                render();
            });
        });

        if (trash.length) startTrashCountdownTimer();
    }

    function renderDigitalCardIcon(t) {
        if (t.iconImg) {
            return '<span class="selbetti-mod-icon-wrap" aria-hidden="true">' +
                '<img class="selbetti-mod-card-img" src="' + escAttr(t.iconImg) + '" alt="" loading="lazy" ' +
                'onerror="this.style.display=\'none\';var f=this.nextElementSibling;if(f)f.style.display=\'\';">' +
                '<span class="selbetti-mod-emoji selbetti-mod-emoji-fallback" style="display:none">' + t.emoji + '</span></span>';
        }
        return '<span class="selbetti-mod-emoji" aria-hidden="true">' + t.emoji + '</span>';
    }

    function renderDigital() {
        var main = $('selbetti-main');
        var cards = DIGITAL_TOOLS.map(function (t) {
            var u = getResolvedUrl(t.id);
            var ok = u && /^https?:\/\//i.test(u);
            var href = ok ? u : '#';
            var a11yLabel = t.label + ' — abre numa nova aba';
            return '<a class="selbetti-mod-card glass-panel" href="' + escAttr(href) + '"' +
                (ok ? ' target="_blank" rel="noopener noreferrer"' : '') +
                (ok ? ' aria-label="' + escAttr(a11yLabel) + '"' : ' aria-disabled="true"') + '>' +
                '<span class="selbetti-mod-card-inner">' +
                renderDigitalCardIcon(t) +
                '<h3 class="selbetti-mod-title txt-axis-gradient-selb">' + esc(t.label) + '</h3>' +
                '</span></a>';
        }).join('');

        main.innerHTML =
            '<header class="selbetti-digital-head">' +
            '<h1 class="selbetti-logo-title selbetti-digital-page-title">FERRAMENTAS DIGITAIS SELBETTI</h1>' +
            '</header>' +
            '<div class="selbetti-digital-grid">' + cards + '</div>';

        main.querySelectorAll('.selbetti-mod-card[aria-disabled="true"]').forEach(function (a) {
            a.addEventListener('click', function (e) {
                e.preventDefault();
                showToast('Este portal não está disponível no momento. Contacte o suporte se precisar de acesso.');
            });
        });
    }

    function render() {
        purgeExpiredTrash();
        var route = parseRoute();
        document.documentElement.classList.toggle('selbetti-digital-no-scroll', route.type === 'digital');
        document.body.classList.toggle('selbetti-route-home', route.type === 'home');
        if (route.type !== 'docs_trash') stopTrashCountdownTimer();
        highlightNav(route);
        if (route.type === 'home') renderHome();
        else if (route.type === 'digital') renderDigital();
        else if (route.type === 'dash_orcamentos') {
            renderDocsCategoryDashboard('orcamentos', ['2025', '2026'], 'ORÇAMENTOS');
        } else if (route.type === 'dash_atas') {
            renderDocsCategoryDashboard('atas', ['2026'], 'ATAS E REUNIÕES');
        } else if (route.type === 'docs_trash') renderTrash();
        else if (route.type === 'docs') renderDocs(route);
        else renderHome();
    }

    function onFilesSelected(e) {
        var files = e.target.files;
        if (!files || !files.length || !pendingUploadTarget) {
            e.target.value = '';
            return;
        }
        var key = pendingUploadTarget.key;
        var list = loadDocs(key);
        var remaining = Array.prototype.slice.call(files);
        var i = 0;
        var addedCount = 0;

        function next() {
            if (i >= remaining.length) {
                if (addedCount) saveDocs(key, list);
                e.target.value = '';
                render();
                if (addedCount) showToast(addedCount + ' arquivo(s) adicionado(s).');
                else if (remaining.length) showToast('Nenhum arquivo foi guardado (tamanho ou erro).');
                return;
            }
            var file = remaining[i];
            i++;
            if (file.size > MAX_FILE_BYTES) {
                showToast('Ignorado (acima de ~' + Math.round(MAX_FILE_BYTES / (1024 * 1024)) + ' MB): ' + file.name);
                next();
                return;
            }
            var reader = new FileReader();
            reader.onload = function () {
                list.push({
                    id: String(Date.now()) + '_' + Math.random().toString(36).slice(2, 8),
                    name: file.name,
                    mime: file.type || 'application/octet-stream',
                    size: file.size,
                    addedAt: new Date().toISOString(),
                    dataUrl: reader.result
                });
                addedCount++;
                next();
            };
            reader.onerror = function () {
                showToast('Erro ao ler: ' + file.name);
                next();
            };
            reader.readAsDataURL(file);
        }
        next();
    }

    function openDrawer() {
        $('selbetti-drawer').hidden = false;
        $('selbetti-overlay').hidden = false;
        requestAnimationFrame(function () {
            $('selbetti-drawer').classList.add('is-open');
            $('selbetti-overlay').classList.add('is-visible');
        });
        $('selbetti-menu-open').setAttribute('aria-expanded', 'true');
    }

    function closeDrawer() {
        $('selbetti-drawer').classList.remove('is-open');
        $('selbetti-overlay').classList.remove('is-visible');
        $('selbetti-menu-open').setAttribute('aria-expanded', 'false');
        setTimeout(function () {
            if (!$('selbetti-drawer').classList.contains('is-open')) {
                $('selbetti-drawer').hidden = true;
                $('selbetti-overlay').hidden = true;
            }
        }, 400);
    }

    function initTheme() {
        var t = localStorage.getItem(NS + '_theme') || 'light';
        document.documentElement.setAttribute('data-selbetti-theme', t === 'dark' ? 'dark' : 'light');
        updateThemeIcon();
    }

    function toggleTheme() {
        var cur = document.documentElement.getAttribute('data-selbetti-theme') === 'dark' ? 'dark' : 'light';
        var next = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-selbetti-theme', next);
        localStorage.setItem(NS + '_theme', next);
        updateThemeIcon();
    }

    function updateThemeIcon() {
        var icon = $('selbetti-theme-icon');
        if (!icon) return;
        var dark = document.documentElement.getAttribute('data-selbetti-theme') === 'dark';
        icon.className = dark ? 'fas fa-sun' : 'fas fa-moon';
    }

    function init() {
        initTheme();

        var nav = $('selbetti-nav-root');
        if (nav) {
            nav.innerHTML = buildNavHtml();
            var backHome = $('selbetti-nav-back-home');
            if (backHome) {
                backHome.addEventListener('click', function () {
                    try { sessionStorage.setItem('axis_voltar_force_main', '1'); } catch (e) {}
                    closeDrawer();
                });
            }
        }

        if (nav) {
            nav.addEventListener('click', function (e) {
                var btn = e.target.closest('[data-route]');
                if (!btn) return;
                var r = btn.getAttribute('data-route');
                if (r === 'home') setRoute('home');
                else setRoute(r);
                closeDrawer();
            });
        }

        $('selbetti-menu-open').addEventListener('click', openDrawer);
        $('selbetti-drawer-close').addEventListener('click', closeDrawer);
        $('selbetti-overlay').addEventListener('click', closeDrawer);

        $('selbetti-theme-toggle').addEventListener('click', toggleTheme);

        $('selbetti-file-input').addEventListener('change', onFilesSelected);

        window.addEventListener('hashchange', render);

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                closeDocPreview();
                closeDrawer();
            }
        });

        var prevBackdrop = $('selbetti-doc-preview');
        var prevDialog = $('selbetti-doc-preview-dialog');
        if (prevBackdrop) {
            prevBackdrop.addEventListener('click', function (e) {
                if (e.target === prevBackdrop) closeDocPreview();
            });
        }
        if (prevDialog) {
            prevDialog.addEventListener('click', function (e) {
                e.stopPropagation();
            });
        }
        var prevClose = $('selbetti-doc-preview-close');
        if (prevClose) prevClose.addEventListener('click', closeDocPreview);

        if (!location.hash || location.hash === '#') location.hash = '#/home';
        render();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
