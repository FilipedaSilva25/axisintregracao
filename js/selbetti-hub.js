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
    /** Anexo escolhido no formulário de orçamento manual (antes de guardar). */
    var pendingManualOrcAttachment = null;
    var toastTimer = null;
    var trashCountdownTimer = null;

    /** Cache em memória + IndexedDB para PDFs/imagens grandes (localStorage ~5 MB estoura com base64). */
    var DOCS_IDB_STORE = 'byKey';
    var selbettiDocsIdb = null;
    var selbettiDocsIdbOpenPromise = null;
    var docsCache = {};

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

    function manualOrcamentosStorageKey(year, month) {
        return NS + '_manual_orcamentos_' + year + '_' + month;
    }

    function loadManualOrcamentos(manualKey) {
        var list = loadJson(manualKey, []);
        return Array.isArray(list) ? list.slice() : [];
    }

    function saveManualOrcamentos(manualKey, list) {
        return saveJson(manualKey, Array.isArray(list) ? list : []);
    }

    /** Ano/mês do calendário atual, limitado a 2025–2026 (pastas do hub). */
    function orcamentosDestinoCalendario() {
        var now = new Date();
        var y = String(now.getFullYear());
        if (y !== '2025' && y !== '2026') y = '2026';
        return { year: y, month: pad2(now.getMonth() + 1) };
    }

    function manualOrcEntryInstant(m) {
        if (!m) return 0;
        var t = new Date(m.at || m.addedAt || 0).getTime();
        return isNaN(t) ? 0 : t;
    }

    /** data YYYY-MM-DD + hora/minuto/segundo locais → ISO. */
    function parseManualOrcDateTime(dateStr, h, mi, s) {
        if (!dateStr || typeof dateStr !== 'string') return null;
        var dparts = dateStr.split('-');
        var y = parseInt(dparts[0], 10);
        var mo = parseInt(dparts[1], 10) - 1;
        var d = parseInt(dparts[2], 10);
        var hh = Math.max(0, Math.min(23, parseInt(h, 10) || 0));
        var mm = Math.max(0, Math.min(59, parseInt(mi, 10) || 0));
        var ss = Math.max(0, Math.min(59, parseInt(s, 10) || 0));
        if (isNaN(y) || isNaN(mo) || isNaN(d)) return null;
        var dt = new Date(y, mo, d, hh, mm, ss);
        if (isNaN(dt.getTime())) return null;
        return dt.toISOString();
    }

    function defaultManualOrcDateParts() {
        var now = new Date();
        return {
            dateStr: now.getFullYear() + '-' + pad2(now.getMonth() + 1) + '-' + pad2(now.getDate()),
            h: String(now.getHours()),
            mi: String(now.getMinutes()),
            s: String(now.getSeconds())
        };
    }

    function openSelbettiDocsIdb() {
        if (selbettiDocsIdbOpenPromise) return selbettiDocsIdbOpenPromise;
        selbettiDocsIdbOpenPromise = new Promise(function (resolve) {
            try {
                var req = indexedDB.open(NS + '_docs_idb', 1);
                req.onupgradeneeded = function (ev) {
                    var db = ev.target.result;
                    if (!db.objectStoreNames.contains(DOCS_IDB_STORE)) {
                        db.createObjectStore(DOCS_IDB_STORE, { keyPath: 'storageKey' });
                    }
                };
                req.onerror = function () {
                    selbettiDocsIdb = null;
                    resolve();
                };
                req.onsuccess = function () {
                    selbettiDocsIdb = req.result;
                    resolve();
                };
            } catch (e) {
                selbettiDocsIdb = null;
                resolve();
            }
        });
        return selbettiDocsIdbOpenPromise;
    }

    function idbPutDocsFolder(key, items) {
        return new Promise(function (resolve) {
            if (!selbettiDocsIdb) {
                resolve(false);
                return;
            }
            try {
                var tx = selbettiDocsIdb.transaction(DOCS_IDB_STORE, 'readwrite');
                tx.objectStore(DOCS_IDB_STORE).put({ storageKey: key, items: items });
                tx.oncomplete = function () {
                    resolve(true);
                };
                tx.onerror = function () {
                    resolve(false);
                };
                tx.onabort = function () {
                    resolve(false);
                };
            } catch (e) {
                resolve(false);
            }
        });
    }

    function idbGetAllDocsIntoCache() {
        return new Promise(function (resolve) {
            if (!selbettiDocsIdb) {
                resolve();
                return;
            }
            try {
                var tx = selbettiDocsIdb.transaction(DOCS_IDB_STORE, 'readonly');
                var r = tx.objectStore(DOCS_IDB_STORE).getAll();
                r.onsuccess = function () {
                    var rows = r.result || [];
                    rows.forEach(function (row) {
                        if (row && row.storageKey && Array.isArray(row.items)) {
                            docsCache[row.storageKey] = row.items;
                        }
                    });
                    resolve();
                };
                r.onerror = function () {
                    resolve();
                };
            } catch (e) {
                resolve();
            }
        });
    }

    function migrateLsDocsFoldersToIdb() {
        var keys = [];
        try {
            var ki;
            for (ki = 0; ki < localStorage.length; ki++) {
                var k = localStorage.key(ki);
                if (k && k.indexOf(NS + '_docs_') === 0 && k !== TRASH_KEY) {
                    keys.push(k);
                }
            }
        } catch (e0) {}
        return keys.reduce(function (chain, key) {
            return chain.then(function () {
                if (docsCache[key] && docsCache[key].length) {
                    try {
                        localStorage.removeItem(key);
                    } catch (e1) {}
                    return;
                }
                var raw = null;
                try {
                    raw = localStorage.getItem(key);
                } catch (e2) {}
                if (!raw) return;
                var arr;
                try {
                    arr = JSON.parse(raw);
                } catch (e3) {
                    return;
                }
                if (!Array.isArray(arr) || !arr.length) return;
                docsCache[key] = arr;
                if (!selbettiDocsIdb) return;
                return idbPutDocsFolder(key, arr).then(function (ok) {
                    if (ok) {
                        try {
                            localStorage.removeItem(key);
                        } catch (e4) {}
                    }
                });
            });
        }, Promise.resolve());
    }

    function bootstrapSelbettiDocsStorage() {
        return openSelbettiDocsIdb()
            .then(function () {
                return idbGetAllDocsIntoCache();
            })
            .then(function () {
                return migrateLsDocsFoldersToIdb();
            });
    }

    function loadDocs(key) {
        if (Object.prototype.hasOwnProperty.call(docsCache, key)) {
            return (docsCache[key] || []).slice();
        }
        var list = loadJson(key, []);
        return Array.isArray(list) ? list.slice() : [];
    }

    /** Grava pasta de documentos (IndexedDB se disponível; senão localStorage). Só atualiza cache em memória se gravar com sucesso. */
    function saveDocsAsync(key, list) {
        var arr = Array.isArray(list) ? list.slice() : [];
        if (!selbettiDocsIdb) {
            var okLs = saveJson(key, arr);
            if (okLs) docsCache[key] = arr;
            return Promise.resolve(okLs);
        }
        return idbPutDocsFolder(key, arr).then(function (ok) {
            if (ok) {
                docsCache[key] = arr;
                try {
                    localStorage.removeItem(key);
                } catch (e) {}
                return true;
            }
            var ok2 = saveJson(key, arr);
            if (ok2) docsCache[key] = arr;
            return ok2;
        });
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
            if (p[1] === 'cadastrar') return { type: 'orcamentos_cadastrar' };
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
        if (route.type === 'orcamentos_cadastrar') return 'CADASTRAR ORÇAMENTO';
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
                    count: countAll,
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
        h += '<button type="button" class="selbetti-nav-item" data-route="orcamentos/cadastrar">✨ CADASTRAR ORÇAMENTO</button>';
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
            if (route.type === 'orcamentos_cadastrar' && r === 'orcamentos/cadastrar') active = true;
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

    function bindDocListActions(main, key) {
        main.querySelectorAll('.selbetti-remove-doc').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.getAttribute('data-id');
                var cur = loadDocs(key);
                var found = cur.find(function (x) { return String(x.id) === String(id); });
                if (!found) return;
                var next = cur.filter(function (x) { return String(x.id) !== String(id); });
                saveDocsAsync(key, next).then(function (ok) {
                    if (ok) {
                        pushToTrash(found, key);
                        showToast('Arquivo movido para a lixeira.');
                    } else {
                        showToast('Não foi possível atualizar a pasta (armazenamento). Tente ficheiros mais pequenos ou outro navegador.');
                    }
                    render();
                });
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

    function wireOrcamentosDocSearch(ul) {
        var inp = $('selbetti-doc-search');
        if (!inp || !ul) return;
        function apply() {
            var q = (inp.value || '').trim().toLowerCase();
            ul.querySelectorAll('.selbetti-doc-item').forEach(function (li) {
                var t = (li.getAttribute('data-search') || '').toLowerCase();
                li.hidden = q.length > 0 && t.indexOf(q) === -1;
            });
        }
        inp.addEventListener('input', apply);
        inp.addEventListener('search', apply);
    }

    function renderOrcamentosCadastrar() {
        pendingManualOrcAttachment = null;
        var dest = orcamentosDestinoCalendario();
        var docsKey = docsStorageKey('orcamentos', dest.year, dest.month);
        var monthName = monthLabel(dest.month);
        var main = $('selbetti-main');
        var defDt = defaultManualOrcDateParts();

        pendingUploadTarget = { key: docsKey };

        var yearOpts = ['2025', '2026'].map(function (y) {
            return '<option value="' + escAttr(y) + '"' + (y === dest.year ? ' selected' : '') + '>' + esc(y) + '</option>';
        }).join('');
        var monthOpts = MESES.map(function (m) {
            return '<option value="' + escAttr(m.id) + '"' + (m.id === dest.month ? ' selected' : '') + '>' + esc(m.label) + '</option>';
        }).join('');

        main.innerHTML =
            '<section class="selbetti-panel glass-panel selbetti-cadastro-orc-panel">' +
            '<header class="selbetti-panel-head selbetti-cadastro-orc-head">' +
            '<h2>CADASTRAR ORÇAMENTO</h2>' +
            '</header>' +
            '<div class="selbetti-cadastro-orc-grid">' +
            '<div class="selbetti-cadastro-card selbetti-cadastro-card-upload glass-panel">' +
            '<div class="selbetti-cadastro-card-upload-inner">' +
            '<div class="selbetti-cadastro-upload-glow" aria-hidden="true"></div>' +
            '<span class="selbetti-cadastro-auto-badge">Automático</span>' +
            '<div class="selbetti-cadastro-upload-icon" aria-hidden="true"><i class="fas fa-cloud-arrow-up"></i></div>' +
            '<p class="selbetti-cadastro-auto-title">Envio para o <strong>mês atual</strong> do calendário</p>' +
            '<p class="selbetti-cadastro-destino-label">' + esc(monthName) + ' · ' + esc(dest.year) + '</p>' +
            '<button type="button" class="selbetti-btn selbetti-btn-primary selbetti-btn-text-upper" id="selbetti-cadastro-add-files">ADICIONAR ARQUIVOS</button>' +
            '</div></div>' +
            '<div class="selbetti-cadastro-card selbetti-cadastro-card-manual glass-panel">' +
            '<div class="selbetti-cadastro-manual-inner">' +
            '<header class="selbetti-cadastro-manual-head">' +
            '<h3 class="selbetti-cadastro-manual-h3">Orçamento manual</h3>' +
            '<p class="selbetti-cadastro-manual-sub">O cartão à esquerda envia sempre para o <strong>mês atual</strong>. Aqui você escolhe o mês da pasta.</p>' +
            '</header>' +
            '<div class="selbetti-cadastro-sec selbetti-cadastro-sec-dest">' +
            '<span class="selbetti-cadastro-sec-kicker">Pasta de destino</span>' +
            '<div class="selbetti-manual-select-grid">' +
            '<div class="selbetti-cadastro-field">' +
            '<label class="selbetti-cadastro-field-label" for="selbetti-manual-orc-month">Mês</label>' +
            '<select id="selbetti-manual-orc-month" class="selbetti-input selbetti-select selbetti-input-strong" autocomplete="off">' + monthOpts + '</select>' +
            '</div>' +
            '<div class="selbetti-cadastro-field">' +
            '<label class="selbetti-cadastro-field-label" for="selbetti-manual-orc-year">Ano</label>' +
            '<select id="selbetti-manual-orc-year" class="selbetti-input selbetti-select selbetti-input-strong" autocomplete="off">' + yearOpts + '</select>' +
            '</div></div></div>' +
            '<div class="selbetti-cadastro-sec">' +
            '<span class="selbetti-cadastro-sec-kicker">Dados</span>' +
            '<div class="selbetti-cadastro-manual-form">' +
            '<div class="selbetti-cadastro-field">' +
            '<label class="selbetti-cadastro-field-label" for="selbetti-manual-orc-title">Descrição</label>' +
            '<input type="text" id="selbetti-manual-orc-title" class="selbetti-input selbetti-input-strong" placeholder="Ex.: revisão de equipamento" maxlength="500" />' +
            '</div>' +
            '<div class="selbetti-cadastro-field">' +
            '<label class="selbetti-cadastro-field-label" for="selbetti-manual-orc-val">Valor <span class="selbetti-cadastro-optional">(opcional)</span></label>' +
            '<input type="text" id="selbetti-manual-orc-val" class="selbetti-input selbetti-input-strong" placeholder="Ex.: R$ 0,00" maxlength="80" />' +
            '</div></div></div>' +
            '<div class="selbetti-cadastro-sec">' +
            '<span class="selbetti-cadastro-sec-kicker">Data e hora do registo</span>' +
            '<div class="selbetti-cadastro-dt-block">' +
            '<div class="selbetti-cadastro-field">' +
            '<label class="selbetti-cadastro-field-label" for="selbetti-manual-orc-date">Data</label>' +
            '<input type="date" id="selbetti-manual-orc-date" class="selbetti-input selbetti-input-strong" value="' + escAttr(defDt.dateStr) + '" />' +
            '</div>' +
            '<div class="selbetti-cadastro-hms-row">' +
            '<div class="selbetti-cadastro-hms-field">' +
            '<label class="selbetti-cadastro-field-label" for="selbetti-manual-orc-h">Hora</label>' +
            '<input type="number" id="selbetti-manual-orc-h" class="selbetti-input selbetti-input-hms selbetti-input-strong" min="0" max="23" step="1" value="' + escAttr(defDt.h) + '" />' +
            '</div>' +
            '<div class="selbetti-cadastro-hms-field">' +
            '<label class="selbetti-cadastro-field-label" for="selbetti-manual-orc-m">Minutos</label>' +
            '<input type="number" id="selbetti-manual-orc-m" class="selbetti-input selbetti-input-hms selbetti-input-strong" min="0" max="59" step="1" value="' + escAttr(defDt.mi) + '" />' +
            '</div>' +
            '<div class="selbetti-cadastro-hms-field">' +
            '<label class="selbetti-cadastro-field-label" for="selbetti-manual-orc-s">Segundos</label>' +
            '<input type="number" id="selbetti-manual-orc-s" class="selbetti-input selbetti-input-hms selbetti-input-strong" min="0" max="59" step="1" value="' + escAttr(defDt.s) + '" />' +
            '</div></div></div></div>' +
            '<div class="selbetti-cadastro-sec selbetti-cadastro-sec-file">' +
            '<span class="selbetti-cadastro-sec-kicker">Arquivo anexo</span>' +
            '<div class="selbetti-cadastro-file-row">' +
            '<input type="file" id="selbetti-manual-orc-file-input" hidden />' +
            '<button type="button" class="selbetti-btn selbetti-btn-ghost selbetti-btn-text-upper" id="selbetti-manual-orc-pick-file">Escolher arquivo</button>' +
            '<span class="selbetti-cadastro-file-label" id="selbetti-manual-orc-file-label">Nenhum arquivo</span>' +
            '<button type="button" class="selbetti-btn selbetti-btn-ghost selbetti-cadastro-file-clear" id="selbetti-manual-orc-clear-file" hidden>Limpar</button>' +
            '</div></div>' +
            '<button type="button" class="selbetti-btn selbetti-btn-primary selbetti-btn-text-upper selbetti-cadastro-manual-save" id="selbetti-manual-orc-add">Guardar</button>' +
            '<div class="selbetti-cadastro-manual-preview-section">' +
            '<span class="selbetti-cadastro-sec-kicker selbetti-cadastro-preview-kicker">Registos no mês selecionado</span>' +
            '<div id="selbetti-manual-orc-preview-wrap" class="selbetti-manual-orc-preview-wrap"></div>' +
            '</div></div></div></div></section>';

        function readManualTargetFromForm() {
            var yEl = $('selbetti-manual-orc-year');
            var mEl = $('selbetti-manual-orc-month');
            var y = yEl && yEl.value ? String(yEl.value) : '2026';
            var mo = mEl && mEl.value ? String(mEl.value) : '01';
            return { year: y, month: mo, manualKey: manualOrcamentosStorageKey(y, mo) };
        }

        function refreshManualPreview() {
            var wrap = $('selbetti-manual-orc-preview-wrap');
            if (!wrap) return;
            var r = readManualTargetFromForm();
            var list = loadManualOrcamentos(r.manualKey);
            if (!list.length) {
                wrap.innerHTML = '<p class="selbetti-cadastro-preview-empty">Nenhum registo para <strong>' + esc(monthLabel(r.month)) + ' ' + esc(r.year) + '</strong>.</p>';
                return;
            }
            wrap.innerHTML =
                '<ul class="selbetti-cadastro-manual-preview">' +
                list.slice().reverse().map(function (row) {
                    var when = row.at || row.addedAt;
                    return '<li><span class="selbetti-cadastro-manual-preview-title">' + esc(row.title) + '</span>' +
                        '<span class="selbetti-cadastro-manual-preview-meta">' + esc(formatDate(when)) +
                        (row.attachment && row.attachment.name ? ' · 📎 ' + esc(row.attachment.name) : '') +
                        '</span>' +
                        (row.amount ? '<span class="selbetti-cadastro-manual-preview-amt">' + esc(row.amount) + '</span>' : '') +
                        '</li>';
                }).join('') +
                '</ul>';
        }

        function syncManualFileUi() {
            var lab = $('selbetti-manual-orc-file-label');
            var clr = $('selbetti-manual-orc-clear-file');
            if (!lab) return;
            if (pendingManualOrcAttachment && pendingManualOrcAttachment.name) {
                lab.textContent = pendingManualOrcAttachment.name;
                if (clr) clr.hidden = false;
            } else {
                lab.textContent = 'Nenhum arquivo';
                if (clr) clr.hidden = true;
            }
        }

        var addBtn = $('selbetti-cadastro-add-files');
        if (addBtn) {
            addBtn.addEventListener('click', function () {
                $('selbetti-file-input').click();
            });
        }

        var pickFile = $('selbetti-manual-orc-pick-file');
        var manualFileInp = $('selbetti-manual-orc-file-input');
        if (pickFile && manualFileInp) {
            pickFile.addEventListener('click', function () {
                manualFileInp.click();
            });
            manualFileInp.addEventListener('change', function (e) {
                var f = e.target.files && e.target.files[0];
                e.target.value = '';
                if (!f) return;
                if (f.size > MAX_FILE_BYTES) {
                    showToast('Ficheiro acima do limite (~' + Math.round(MAX_FILE_BYTES / (1024 * 1024)) + ' MB): ' + f.name);
                    return;
                }
                var reader = new FileReader();
                reader.onload = function () {
                    pendingManualOrcAttachment = {
                        name: f.name,
                        mime: f.type || 'application/octet-stream',
                        size: f.size,
                        dataUrl: reader.result
                    };
                    syncManualFileUi();
                };
                reader.onerror = function () {
                    showToast('Erro ao ler o ficheiro.');
                };
                reader.readAsDataURL(f);
            });
        }

        var clrFile = $('selbetti-manual-orc-clear-file');
        if (clrFile) {
            clrFile.addEventListener('click', function () {
                pendingManualOrcAttachment = null;
                syncManualFileUi();
            });
        }

        syncManualFileUi();

        var ySel = $('selbetti-manual-orc-year');
        var moSel = $('selbetti-manual-orc-month');
        if (ySel) ySel.addEventListener('change', refreshManualPreview);
        if (moSel) moSel.addEventListener('change', refreshManualPreview);
        refreshManualPreview();

        $('selbetti-manual-orc-add').addEventListener('click', function () {
            var target = readManualTargetFromForm();
            var titleIn = $('selbetti-manual-orc-title');
            var valIn = $('selbetti-manual-orc-val');
            var dateIn = $('selbetti-manual-orc-date');
            var hIn = $('selbetti-manual-orc-h');
            var mIn = $('selbetti-manual-orc-m');
            var sIn = $('selbetti-manual-orc-s');
            var t = titleIn && (titleIn.value || '').trim();
            if (!t) {
                showToast('Indique uma descrição.');
                return;
            }
            var ds = dateIn && (dateIn.value || '').trim();
            if (!ds) {
                showToast('Indique a data.');
                return;
            }
            var atIso = parseManualOrcDateTime(ds, hIn && hIn.value, mIn && mIn.value, sIn && sIn.value);
            if (!atIso) {
                showToast('Data ou hora inválida.');
                return;
            }
            var amt = valIn ? (valIn.value || '').trim() : '';
            var cur = loadManualOrcamentos(target.manualKey);
            var row = {
                id: String(Date.now()) + '_' + Math.random().toString(36).slice(2, 8),
                title: t,
                amount: amt,
                at: atIso,
                addedAt: new Date().toISOString()
            };
            if (pendingManualOrcAttachment) {
                row.attachment = {
                    name: pendingManualOrcAttachment.name,
                    mime: pendingManualOrcAttachment.mime,
                    size: pendingManualOrcAttachment.size,
                    dataUrl: pendingManualOrcAttachment.dataUrl
                };
            }
            cur.push(row);
            if (saveManualOrcamentos(target.manualKey, cur)) {
                pendingManualOrcAttachment = null;
                if (titleIn) titleIn.value = '';
                if (valIn) valIn.value = '';
                var d2 = defaultManualOrcDateParts();
                if (dateIn) dateIn.value = d2.dateStr;
                if (hIn) hIn.value = d2.h;
                if (mIn) mIn.value = d2.mi;
                if (sIn) sIn.value = d2.s;
                showToast('Guardado em ' + monthLabel(target.month) + ' ' + target.year + '.');
                syncManualFileUi();
                refreshManualPreview();
            }
        });
    }

    function renderDocs(route) {
        var key = getDocsKeyForRoute(route);
        var list = loadDocs(key);
        var main = $('selbetti-main');
        var title = breadcrumb(route);
        var panelMonthClass = (route.category === 'orcamentos' || route.category === 'atas' || route.category === 'ferramentas_estoque')
            ? ' selbetti-panel-month-folder'
            : '';

        var isOrcamentosMes = route.category === 'orcamentos' && route.year && route.month;
        var manualKey = isOrcamentosMes ? manualOrcamentosStorageKey(route.year, route.month) : null;
        var manualList = manualKey ? loadManualOrcamentos(manualKey) : [];

        var merged = [];
        list.forEach(function (item) {
            merged.push({ kind: 'file', item: item });
        });
        manualList.forEach(function (item) {
            merged.push({ kind: 'manual', item: item });
        });
        merged.sort(function (a, b) {
            var ta = a.kind === 'manual' ? manualOrcEntryInstant(a.item) : new Date((a.item && a.item.addedAt) || 0).getTime();
            var tb = b.kind === 'manual' ? manualOrcEntryInstant(b.item) : new Date((b.item && b.item.addedAt) || 0).getTime();
            return tb - ta;
        });

        var itemsHtml;
        var emptyHtml;
        if (isOrcamentosMes) {
            itemsHtml = merged.map(function (row) {
                if (row.kind === 'manual') {
                    var m = row.item;
                    var att = m.attachment;
                    var when = m.at || m.addedAt;
                    var searchBlob = (m.title || '') + ' ' + (m.amount || '') + ' manual ' + (att && att.name ? att.name : '');
                    var attPart = '';
                    if (att && att.dataUrl) {
                        var canPrev = !!(isPdfMime(att.mime, att.name) || isImageMime(att.mime));
                        attPart =
                            (canPrev
                                ? '<button type="button" class="selbetti-btn selbetti-btn-ghost selbetti-btn-icon-only selbetti-manual-att-preview" data-mid="' + escAttr(String(m.id)) + '" title="Visualizar" aria-label="Visualizar"><i class="fas fa-eye"></i></button>'
                                : '') +
                            '<a class="selbetti-btn selbetti-btn-ghost selbetti-btn-download selbetti-btn-text-upper" href="' + esc(att.dataUrl) + '" download="' + escAttr(att.name) + '">BAIXAR</a>' +
                            '<button type="button" class="selbetti-btn selbetti-btn-ghost selbetti-btn-text-upper selbetti-manual-att-open" data-mid="' + escAttr(String(m.id)) + '">ABRIR</button>';
                    }
                    return '<li class="selbetti-doc-item selbetti-doc-item-manual" data-search="' + escAttr(searchBlob) + '">' +
                        '<div><strong>Manual · ' + esc(m.title) + '</strong>' +
                        '<div class="selbetti-doc-meta">' + esc(formatDate(when)) +
                        (m.amount ? ' · ' + esc(m.amount) : '') +
                        (att && att.name ? ' · 📎 ' + esc(att.name) : '') + '</div></div>' +
                        '<div class="selbetti-toolbar selbetti-doc-toolbar">' +
                        attPart +
                        '<button type="button" class="selbetti-btn selbetti-btn-danger selbetti-btn-text-upper selbetti-remove-manual" data-id="' + escAttr(String(m.id)) + '">REMOVER</button>' +
                        '</div></li>';
                }
                var item = row.item;
                var canPreview = !!(item.dataUrl && (isPdfMime(item.mime, item.name) || isImageMime(item.mime)));
                var searchBlob = (item.name || '') + ' ' + (item.mime || '');
                return '<li class="selbetti-doc-item" data-search="' + escAttr(searchBlob) + '">' +
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
            }).join('');
            emptyHtml =
                '<div class="selbetti-empty"><span class="big">📂</span>Nenhum arquivo ou registo manual nesta pasta.<br>Use <strong>CADASTRAR ORÇAMENTO</strong> no menu para enviar ficheiros ou registar valores. PDFs e imagens até ~' +
                Math.round(MAX_FILE_BYTES / (1024 * 1024)) +
                ' MB por arquivo (armazenamento local do navegador).</div>';
        } else {
            itemsHtml = list.map(function (item) {
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
            }).join('');
            emptyHtml =
                '<div class="selbetti-empty"><span class="big">📂</span>Nenhum arquivo nesta pasta.<br>Use <strong>ADICIONAR ARQUIVOS</strong> para guardar PDFs, imagens (HD/4K), vídeos ou outros ficheiros — até ~' +
                Math.round(MAX_FILE_BYTES / (1024 * 1024)) +
                ' MB por arquivo. O limite real é o espaço que <strong>este navegador</strong> permite (armazenamento local, não o servidor).</div>';
        }

        var listSection;
        if (isOrcamentosMes) {
            listSection = merged.length
                ? '<ul class="selbetti-doc-list" id="selbetti-doc-list">' + itemsHtml + '</ul>'
                : '<div id="selbetti-doc-list-wrap">' + emptyHtml + '</div>';
        } else {
            listSection = list.length
                ? '<ul class="selbetti-doc-list" id="selbetti-doc-list">' + itemsHtml + '</ul>'
                : '<div id="selbetti-doc-list-wrap">' + emptyHtml + '</div>';
        }

        var headRow =
            '<div class="selbetti-panel-head">' +
            '<h2>' + esc(title) + '</h2>' +
            (isOrcamentosMes
                ? '<div class="selbetti-panel-head-orc-tools">' +
                  '<label class="selbetti-sr-only" for="selbetti-doc-search">Pesquisar nesta pasta</label>' +
                  '<input type="search" id="selbetti-doc-search" class="selbetti-doc-search" placeholder="Pesquisar por nome ou descrição" autocomplete="off" />' +
                  '</div>'
                : '<div class="selbetti-toolbar">' +
                  '<button type="button" class="selbetti-btn selbetti-btn-primary selbetti-btn-text-upper" id="selbetti-add-files">ADICIONAR ARQUIVOS</button>' +
                  '</div>') +
            '</div>';

        main.innerHTML =
            '<section class="selbetti-panel glass-panel' + panelMonthClass + '">' +
            headRow +
            listSection +
            '</section>';

        if (isOrcamentosMes) {
            pendingUploadTarget = null;
            var ul = $('selbetti-doc-list');
            if (ul && merged.length) wireOrcamentosDocSearch(ul);
            if (manualKey) {
                function findManualRow(mid) {
                    return loadManualOrcamentos(manualKey).find(function (x) { return String(x.id) === String(mid); });
                }
                main.querySelectorAll('.selbetti-remove-manual').forEach(function (btn) {
                    btn.addEventListener('click', function () {
                        var id = btn.getAttribute('data-id');
                        var cur = loadManualOrcamentos(manualKey);
                        var next = cur.filter(function (x) { return String(x.id) !== String(id); });
                        if (saveManualOrcamentos(manualKey, next)) {
                            showToast('Registo manual removido.');
                            render();
                        }
                    });
                });
                main.querySelectorAll('.selbetti-manual-att-preview').forEach(function (btn) {
                    btn.addEventListener('click', function () {
                        var mid = btn.getAttribute('data-mid');
                        var m = findManualRow(mid);
                        var att = m && m.attachment;
                        if (att && att.dataUrl) openDocPreview(att.dataUrl, att.name, att.mime);
                    });
                });
                main.querySelectorAll('.selbetti-manual-att-open').forEach(function (btn) {
                    btn.addEventListener('click', function () {
                        var mid = btn.getAttribute('data-mid');
                        var m = findManualRow(mid);
                        var att = m && m.attachment;
                        if (att && att.dataUrl) window.open(att.dataUrl, '_blank', 'noopener,noreferrer');
                    });
                });
            }
        } else {
            pendingUploadTarget = { key: key };
            var af = $('selbetti-add-files');
            if (af) {
                af.addEventListener('click', function () {
                    $('selbetti-file-input').click();
                });
            }
        }

        bindDocListActions(main, key);
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
                var nextTrash = t.filter(function (x) { return String(x.trashId) !== String(tid); });
                saveDocsAsync(key, list).then(function (ok) {
                    if (ok) {
                        saveTrash(nextTrash);
                        showToast('Arquivo restaurado.');
                    } else {
                        showToast('Não foi possível restaurar (armazenamento cheio ou indisponível).');
                    }
                    render();
                });
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
        } else if (route.type === 'orcamentos_cadastrar') {
            renderOrcamentosCadastrar();
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
                e.target.value = '';
                if (addedCount) {
                    saveDocsAsync(key, list).then(function (ok) {
                        render();
                        if (!ok) {
                            showToast(
                                'Não foi possível guardar no navegador (quota ou erro). Com PDFs grandes o hub usa IndexedDB — atualize a página e tente de novo; se persistir, reduza o tamanho do ficheiro.'
                            );
                        } else {
                            showToast(addedCount + ' arquivo(s) adicionado(s).');
                        }
                    });
                } else {
                    render();
                    if (remaining.length) showToast('Nenhum arquivo foi guardado (tamanho ou erro).');
                }
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

        bootstrapSelbettiDocsStorage().then(function () {
            if (!location.hash || location.hash === '#') location.hash = '#/home';
            render();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
