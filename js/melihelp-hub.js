/**
 * MeliHelp Hub — menu, rotas e armazenamento local (crachás / cordão / cartão avulso + lixeira).
 * BLINDADO (27/03/2026): página concluída; não alterar rotas, storage, lixeira ou modais sem autorização.
 * Ver .cursor/rules/BLINDAGEM_MELIHELP_HUB.mdc e BLINDAGEM.md
 * Storage: axis_melihelp_hub_v1_* (independente do SELBETTI).
 */
(function () {
    'use strict';

    var NS = 'axis_melihelp_hub_v1';
    var TRASH_KEY = NS + '_docs_trash';
    /** Retiradas de cordão: RE, nome, data/hora (site / manual / futuro bot WhatsApp). */
    var CORDAO_RETIRADAS_KEY = NS + '_cordao_retiradas_v1';
    /** Recebimento de cordões (estoque): quantidade + data/hora por lançamento; separado das retiradas. */
    var CORDAO_RECEBIMENTOS_KEY = NS + '_cordao_recebimentos_v1';
    /** Limite por ficheiro (imagens HD/4K, PDFs grandes). Os PDFs ficam em IndexedDB (quota muito maior); localStorage só para metadados/legado. */
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

    /** Anos em HISTÓRICO (submenu de CADASTRAR CRACHÁ no drawer). Rotas `#/certificados/ANO/MM`. */
    var CRACHA_ANOS_MENU = ['2026', '2025', '2024'];

    /** Unidades sob CADASTRAR CRACHÁ: clique → `#/certificados/unidade/ID` (página em construção). */
    var CRACHA_UNIDADES_CADASTRO = [
        { id: 'BRSC02', label: 'BRSC02' },
        { id: 'PR01', label: 'PR01' }
    ];

    function isCrachaNavYear(y) {
        return CRACHA_ANOS_MENU.indexOf(String(y)) !== -1;
    }

    function isCertificadosUnidadeWip(id) {
        return CRACHA_UNIDADES_CADASTRO.some(function (u) {
            return u.id === id;
        });
    }

    function certificadosUnidadeWipLabel(id) {
        var i;
        for (i = 0; i < CRACHA_UNIDADES_CADASTRO.length; i++) {
            if (CRACHA_UNIDADES_CADASTRO[i].id === id) return CRACHA_UNIDADES_CADASTRO[i].label;
        }
        return id;
    }

    /**
     * Ficheiros de banner por unidade em assets/IMAGENS/ (primeiro nome = tentativa principal).
     * Inclui variantes .ext.ext (Windows com “ocultar extensões”).
     */
    var CERTIFICADOS_UNIDADE_WIP_BANNER_FILES = {
        BRSC02: ['BRSC02.png', 'BRSC02.png.png'],
        PR01: ['PR01.jpg', 'PR01.jpeg', 'PR01.png', 'PR01.jpg.jpg', 'PR01.jpeg.jpeg', 'PR01.png.png']
    };

    function certificadosUnidadeWipBannerUrlCandidates(id) {
        var files = CERTIFICADOS_UNIDADE_WIP_BANNER_FILES[id];
        if (!files || !files.length) return [];
        var list = [];
        var base = '';
        try {
            base = (global.location.href || '').split('#')[0];
        } catch (e) {
            /* ignorar */
        }
        var fi;
        for (fi = 0; fi < files.length; fi++) {
            var name = files[fi];
            try {
                if (base) list.push(new global.URL('../assets/IMAGENS/' + name, base).href);
            } catch (e2) {
                /* ignorar */
            }
            list.push('/assets/IMAGENS/' + name);
            list.push('../assets/IMAGENS/' + name);
        }
        var seen = {};
        return list.filter(function (x) {
            if (!x || seen[x]) return false;
            seen[x] = true;
            return true;
        });
    }

    var pendingUploadTarget = null;
    /** Data/hora (ISO) para o lote após o modal; limpo ao processar ou cancelar o seletor. */
    var pendingUploadStampIso = null;
    var toastTimer = null;
    var trashCountdownTimer = null;
    var melihelpUploadBusy = false;
    /** Estado do modal de renomear arquivo: { key: storageKey, docId: string } | null */
    var renameDocModalState = null;
    /** { folderKey: string, docId: string } | null — modal mover ficheiro para lixeira */
    var docDeletePending = null;
    var folderDataCache = {};
    var folderMetaCache = {};
    var melihelpIdbDb = null;
    var melihelpDocsReadyPromise = null;
    /** Atualização da linha DESTINO ATUAL em CADASTRAR CRACHÁ (mês/ano do calendário). */
    var cadastroDestinoTickerId = null;
    /** Idem para CADASTRAR CARTÃO (cartão avulso · números W). */
    var avulsoCadastroDestinoTickerId = null;

    function $(id) { return document.getElementById(id); }

    /** Toast vidro no canto superior direito. variant: success | warning | error | remove | info | neutral */
    function showToast(msg, variant) {
        var el = $('melihelp-toast');
        if (!el) return;
        var v = variant || 'info';
        if (['success', 'warning', 'error', 'remove', 'info', 'neutral'].indexOf(v) < 0) v = 'info';
        var icons = {
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            error: 'fa-times-circle',
            remove: 'fa-trash-alt',
            info: 'fa-info-circle',
            neutral: 'fa-bell'
        };
        var textEl = el.querySelector('.melihelp-toast__text');
        var iconWrap = el.querySelector('.melihelp-toast__icon i');
        if (textEl) textEl.textContent = msg;
        else el.textContent = msg;
        if (iconWrap) iconWrap.className = 'fas ' + icons[v];
        el.className = 'melihelp-toast melihelp-toast--' + v;
        el.hidden = false;
        requestAnimationFrame(function () {
            el.classList.add('is-on');
        });
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            el.classList.remove('is-on');
            setTimeout(function () {
                el.hidden = true;
            }, 420);
        }, 3400);
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

    function blobToDataUrl(blob) {
        return new Promise(function (resolve, reject) {
            if (!blob || !blob.size) {
                resolve('');
                return;
            }
            var r = new FileReader();
            r.onload = function () { resolve(r.result || ''); };
            r.onerror = function () { reject(r.error); };
            r.readAsDataURL(blob);
        });
    }

    function docsStorageKey(category, year, month) {
        if (category === 'certificados') {
            if (year != null && month != null) {
                return NS + '_docs_certificados_' + year + '_' + month;
            }
            return NS + '_docs_certificados';
        }
        return NS + '_docs_' + category + '_' + year + '_' + month;
    }

    var DOCS_IDB_NAME = NS + '_docs_idb';

    function isDocsStorageKey(key) {
        return !!(key && key !== TRASH_KEY && key.indexOf(NS + '_docs_') === 0);
    }

    function blobStoreId(folderKey, docId) {
        return folderKey + '::' + docId;
    }

    function syncMetaFromDataCache(folderKey) {
        var arr = folderDataCache[folderKey] || [];
        folderMetaCache[folderKey] = arr.map(function (it) {
            return {
                id: it.id,
                name: it.name,
                mime: it.mime,
                size: it.size,
                addedAt: it.addedAt,
                disabled: !!it.disabled
            };
        });
    }

    function persistFolderToIdbPromise(folderKey, list) {
        return new Promise(function (resolve) {
            if (!melihelpIdbDb) {
                resolve(saveJson(folderKey, list));
                return;
            }
            var db = melihelpIdbDb;
            var tx = db.transaction(['folderMeta', 'folderBlobs'], 'readwrite');
            var metaStore = tx.objectStore('folderMeta');
            var blobStore = tx.objectStore('folderBlobs');
            var getOld = metaStore.get(folderKey);
            getOld.onsuccess = function () {
                var oldRow = getOld.result;
                var newIds = {};
                list.forEach(function (it) { newIds[String(it.id)] = true; });
                if (oldRow && oldRow.items) {
                    oldRow.items.forEach(function (o) {
                        if (!newIds[String(o.id)]) {
                            blobStore.delete(blobStoreId(folderKey, o.id));
                        }
                    });
                }
                var metas = list.map(function (it) {
                    return {
                        id: it.id,
                        name: it.name,
                        mime: it.mime,
                        size: it.size,
                        addedAt: it.addedAt,
                        disabled: !!it.disabled
                    };
                });
                metaStore.put({ folderKey: folderKey, items: metas });
                list.forEach(function (it) {
                    var blob = dataUrlToBlob(it.dataUrl);
                    if (blob && blob.size > 0) {
                        blobStore.put(blob, blobStoreId(folderKey, it.id));
                    }
                });
            };
            getOld.onerror = function () { resolve(false); };
            tx.oncomplete = function () { resolve(true); };
            tx.onerror = function () { resolve(false); };
            tx.onabort = function () { resolve(false); };
        });
    }

    function loadFolderFromIdbPromise(folderKey) {
        return new Promise(function (resolve) {
            if (!melihelpIdbDb) {
                resolve([]);
                return;
            }
            var db = melihelpIdbDb;
            var tx = db.transaction(['folderMeta', 'folderBlobs'], 'readonly');
            var metaStore = tx.objectStore('folderMeta');
            var blobStore = tx.objectStore('folderBlobs');
            var req = metaStore.get(folderKey);
            req.onsuccess = function () {
                var row = req.result;
                if (!row || !row.items || !row.items.length) {
                    resolve([]);
                    return;
                }
                var metas = row.items;
                var pending = metas.length;
                var pairs = new Array(metas.length);
                if (pending === 0) {
                    resolve([]);
                    return;
                }
                metas.forEach(function (meta, idx) {
                    var gr = blobStore.get(blobStoreId(folderKey, meta.id));
                    gr.onsuccess = function () {
                        pairs[idx] = { meta: meta, blob: gr.result };
                        pending--;
                        if (pending === 0) {
                            Promise.all(pairs.map(function (p) {
                                if (!p.blob) {
                                    return Promise.resolve(Object.assign({}, p.meta, { dataUrl: '' }));
                                }
                                return blobToDataUrl(p.blob).then(function (du) {
                                    return Object.assign({}, p.meta, { dataUrl: du });
                                });
                            })).then(resolve).catch(function () { resolve([]); });
                        }
                    };
                    gr.onerror = function () {
                        pairs[idx] = { meta: meta, blob: null };
                        pending--;
                        if (pending === 0) {
                            Promise.all(pairs.map(function (p) {
                                if (!p.blob) {
                                    return Promise.resolve(Object.assign({}, p.meta, { dataUrl: '' }));
                                }
                                return blobToDataUrl(p.blob).then(function (du) {
                                    return Object.assign({}, p.meta, { dataUrl: du });
                                });
                            })).then(resolve).catch(function () { resolve([]); });
                        }
                    };
                });
            };
            req.onerror = function () { resolve([]); };
        });
    }

    function migrateLegacyDocsToIdb(db) {
        return new Promise(function (resolve) {
            var keys = [];
            var ki;
            for (ki = 0; ki < localStorage.length; ki++) {
                var k = localStorage.key(ki);
                if (!k || k.indexOf(NS + '_docs_') !== 0) continue;
                if (k === TRASH_KEY) continue;
                keys.push(k);
            }
            var ix = 0;
            function step() {
                if (ix >= keys.length) {
                    resolve();
                    return;
                }
                var key = keys[ix];
                ix++;
                var raw;
                try {
                    raw = localStorage.getItem(key);
                } catch (e1) {
                    step();
                    return;
                }
                if (!raw) {
                    try { localStorage.removeItem(key); } catch (e2) {}
                    step();
                    return;
                }
                var arr;
                try {
                    arr = JSON.parse(raw);
                } catch (e3) {
                    try { localStorage.removeItem(key); } catch (e4) {}
                    step();
                    return;
                }
                if (!Array.isArray(arr) || !arr.length) {
                    try { localStorage.removeItem(key); } catch (e5) {}
                    step();
                    return;
                }
                melihelpIdbDb = db;
                persistFolderToIdbPromise(key, arr).then(function (ok) {
                    if (ok) {
                        try { localStorage.removeItem(key); } catch (e6) {}
                    }
                    step();
                });
            }
            step();
        });
    }

    function initMelihelpDocsStorage() {
        if (melihelpDocsReadyPromise) return melihelpDocsReadyPromise;
        melihelpDocsReadyPromise = new Promise(function (resolve) {
            var req = indexedDB.open(DOCS_IDB_NAME, 2);
            req.onerror = function () {
                showToast('IndexedDB indisponível neste navegador — limite pequeno (localStorage).');
                resolve();
            };
            req.onupgradeneeded = function (ev) {
                var idb = ev.target.result;
                if (!idb.objectStoreNames.contains('folderMeta')) {
                    idb.createObjectStore('folderMeta', { keyPath: 'folderKey' });
                }
                if (!idb.objectStoreNames.contains('folderBlobs')) {
                    idb.createObjectStore('folderBlobs');
                }
                if (!idb.objectStoreNames.contains('trashBlobs')) {
                    idb.createObjectStore('trashBlobs');
                }
            };
            req.onsuccess = function () {
                melihelpIdbDb = req.result;
                migrateLegacyDocsToIdb(melihelpIdbDb).then(function () { resolve(); });
            };
        });
        return melihelpDocsReadyPromise;
    }

    function ensureFolderMetaLoaded(key) {
        return initMelihelpDocsStorage().then(function () {
            if (folderMetaCache.hasOwnProperty(key)) return;
            if (folderDataCache.hasOwnProperty(key)) {
                syncMetaFromDataCache(key);
                return;
            }
            if (!melihelpIdbDb) {
                var leg = loadJson(key, []);
                folderMetaCache[key] = Array.isArray(leg)
                    ? leg.map(function (it) {
                        return {
                            id: it.id,
                            name: it.name,
                            mime: it.mime,
                            size: it.size,
                            addedAt: it.addedAt,
                            disabled: !!it.disabled
                        };
                    })
                    : [];
                return;
            }
            return new Promise(function (resolve) {
                var tx = melihelpIdbDb.transaction('folderMeta', 'readonly');
                var r = tx.objectStore('folderMeta').get(key);
                r.onsuccess = function () {
                    var row = r.result;
                    var items = row && row.items ? row.items : [];
                    if (!items.length) {
                        var legM = loadJson(key, []);
                        if (Array.isArray(legM) && legM.length) {
                            items = legM.map(function (it) {
                                return {
                                    id: it.id,
                                    name: it.name,
                                    mime: it.mime,
                                    size: it.size,
                                    addedAt: it.addedAt,
                                    disabled: !!it.disabled
                                };
                            });
                        }
                    }
                    folderMetaCache[key] = items;
                    resolve();
                };
                r.onerror = function () {
                    folderMetaCache[key] = [];
                    resolve();
                };
            });
        });
    }

    function ensureFolderFullLoaded(key) {
        return initMelihelpDocsStorage().then(function () {
            if (folderDataCache.hasOwnProperty(key)) {
                var cached = folderDataCache[key];
                if (cached.length > 0) {
                    var allHaveDataUrl = cached.every(function (x) { return x && x.dataUrl; });
                    if (allHaveDataUrl) return;
                }
            }
            if (!melihelpIdbDb) {
                if (!folderDataCache.hasOwnProperty(key)) {
                    var leg = loadJson(key, []);
                    folderDataCache[key] = Array.isArray(leg) ? leg : [];
                    syncMetaFromDataCache(key);
                }
                return;
            }
            return loadFolderFromIdbPromise(key).then(function (items) {
                var use = items;
                if (!use.length) {
                    var legF = loadJson(key, []);
                    if (Array.isArray(legF) && legF.length) use = legF;
                }
                folderDataCache[key] = use;
                syncMetaFromDataCache(key);
            });
        });
    }

    function docKeysMetaOnlyForRoute(route) {
        var keys = [];
        if (route.type === 'dash_certificados') {
            CRACHA_ANOS_MENU.forEach(function (y) {
                MESES.forEach(function (m) {
                    keys.push(docsStorageKey('certificados', y, m.id));
                });
            });
        } else if (route.type === 'dash_orcamentos') {
            ['2025', '2026'].forEach(function (y) {
                MESES.forEach(function (m) {
                    keys.push(docsStorageKey('orcamentos', y, m.id));
                });
            });
        } else if (route.type === 'dash_atas') {
            MESES.forEach(function (m) {
                keys.push(docsStorageKey('atas', '2026', m.id));
            });
        }
        return keys;
    }

    function allCertificadosMenuStorageKeys() {
        var keys = [];
        CRACHA_ANOS_MENU.forEach(function (y) {
            MESES.forEach(function (m) {
                keys.push(docsStorageKey('certificados', y, m.id));
            });
        });
        return keys;
    }

    function docKeysFullLoadForRoute(route) {
        if (route.type === 'certificados_month') {
            return [docsStorageKey('certificados', route.year, route.month)];
        }
        if (route.type === 'certificados_all_desativados') {
            return allCertificadosMenuStorageKeys();
        }
        if (route.type === 'docs') {
            return [docsStorageKey(route.category, route.year, route.month)];
        }
        return [];
    }

    function loadDocs(key) {
        if (!isDocsStorageKey(key)) {
            var raw = loadJson(key, []);
            return Array.isArray(raw) ? raw : [];
        }
        if (folderDataCache.hasOwnProperty(key)) {
            return folderDataCache[key];
        }
        if (folderMetaCache.hasOwnProperty(key)) {
            return folderMetaCache[key].map(function (m) {
                return {
                    id: m.id,
                    name: m.name,
                    mime: m.mime || '',
                    size: m.size || 0,
                    addedAt: m.addedAt,
                    disabled: !!m.disabled,
                    dataUrl: ''
                };
            });
        }
        var leg = loadJson(key, []);
        if (Array.isArray(leg) && leg.length) return leg;
        if (!melihelpIdbDb) return [];
        return [];
    }

    function saveDocsAsync(key, list) {
        if (!isDocsStorageKey(key)) {
            return Promise.resolve(saveJson(key, list));
        }
        var arr = Array.isArray(list) ? list : [];
        folderDataCache[key] = arr;
        syncMetaFromDataCache(key);
        if (!melihelpIdbDb) {
            return Promise.resolve(saveJson(key, arr));
        }
        return persistFolderToIdbPromise(key, arr);
    }

    function loadTrash() {
        var list = loadJson(TRASH_KEY, []);
        return Array.isArray(list) ? list : [];
    }

    function saveTrash(list) {
        return saveJson(TRASH_KEY, list);
    }

    function putTrashBlobPromise(trashId, blob) {
        return new Promise(function (resolve) {
            if (!melihelpIdbDb || !trashId || !blob || !blob.size) {
                resolve(false);
                return;
            }
            try {
                var tx = melihelpIdbDb.transaction('trashBlobs', 'readwrite');
                tx.objectStore('trashBlobs').put(blob, trashId);
                tx.oncomplete = function () { resolve(true); };
                tx.onerror = tx.onabort = function () { resolve(false); };
            } catch (e) {
                resolve(false);
            }
        });
    }

    function deleteTrashBlobPromise(trashId) {
        return new Promise(function (resolve) {
            if (!melihelpIdbDb || !trashId) {
                resolve();
                return;
            }
            try {
                var tx = melihelpIdbDb.transaction('trashBlobs', 'readwrite');
                tx.objectStore('trashBlobs').delete(trashId);
                tx.oncomplete = function () { resolve(); };
                tx.onerror = tx.onabort = function () { resolve(); };
            } catch (e) {
                resolve();
            }
        });
    }

    function getTrashBlobPromise(trashId) {
        return new Promise(function (resolve) {
            if (!melihelpIdbDb || !trashId) {
                resolve(null);
                return;
            }
            try {
                var tx = melihelpIdbDb.transaction('trashBlobs', 'readonly');
                var r = tx.objectStore('trashBlobs').get(trashId);
                r.onsuccess = function () { resolve(r.result || null); };
                r.onerror = function () { resolve(null); };
            } catch (e) {
                resolve(null);
            }
        });
    }

    function rollbackTrashEntry(trashId, docBlobInIdb) {
        if (!trashId) return;
        var t = loadTrash().filter(function (x) { return String(x.trashId) !== String(trashId); });
        saveTrash(t);
        if (docBlobInIdb) deleteTrashBlobPromise(trashId);
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
        if (kept.length !== trash.length) {
            trash.forEach(function (e) {
                if (trashExpiresAtMs(e) <= now && e.docBlobInIdb && e.trashId) {
                    deleteTrashBlobPromise(e.trashId);
                }
            });
            saveTrash(kept);
        }
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
        var main = $('melihelp-main');
        if (!main) return;
        var nodes = main.querySelectorAll('.melihelp-trash-countdown');
        if (!nodes.length) return;
        var now = Date.now();
        var needRerender = false;
        nodes.forEach(function (el) {
            var exp = parseInt(el.getAttribute('data-expires'), 10);
            var textSpan = el.querySelector('.melihelp-trash-countdown-text');
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

    /**
     * Blob do ficheiro para enviar à lixeira: data URL em memória ou, se vazio, leitura em folderBlobs (IndexedDB).
     * Sem isto, REMOVER com lista só-metadados não copiava o conteúdo e a lixeira ficava vazia ou inútil.
     */
    function getDocBlobForTrashAsync(docItem, sourceKey) {
        var b = dataUrlToBlob(docItem.dataUrl);
        if (b && b.size) return Promise.resolve(b);
        if (!melihelpIdbDb || !sourceKey || docItem.id == null || docItem.id === '') {
            return Promise.resolve(null);
        }
        return new Promise(function (resolve) {
            try {
                var tx = melihelpIdbDb.transaction('folderBlobs', 'readonly');
                var r = tx.objectStore('folderBlobs').get(blobStoreId(sourceKey, docItem.id));
                r.onsuccess = function () {
                    var blob = r.result;
                    resolve(blob && blob.size ? blob : null);
                };
                r.onerror = function () { resolve(null); };
            } catch (e) {
                resolve(null);
            }
        });
    }

    /**
     * Metadados na lixeira (localStorage); ficheiro grande em trashBlobs (IndexedDB) para não estourar a quota.
     * Resolve { ok, trashId?, docBlobInIdb? }.
     */
    function pushToTrashAsync(docItem, sourceKey) {
        return initMelihelpDocsStorage().then(function () {
            return getDocBlobForTrashAsync(docItem, sourceKey).then(function (blob) {
                var now = Date.now();
                var trashId = String(now) + '_' + Math.random().toString(36).slice(2, 10);
                var trash = loadTrash();
                var baseDoc = {
                    id: docItem.id,
                    name: docItem.name,
                    mime: docItem.mime,
                    size: docItem.size,
                    addedAt: docItem.addedAt,
                    disabled: !!docItem.disabled
                };
                var entry = {
                    trashId: trashId,
                    deletedAt: new Date(now).toISOString(),
                    expiresAt: new Date(now + TRASH_RETENTION_MS).toISOString(),
                    sourceKey: sourceKey,
                    doc: baseDoc
                };

                function pushTrashMetaAndSave() {
                    trash.push(entry);
                    var saved = saveTrash(trash);
                    if (!saved) {
                        trash.pop();
                        if (entry.docBlobInIdb) deleteTrashBlobPromise(trashId);
                        return { ok: false };
                    }
                    return { ok: true, trashId: trashId, docBlobInIdb: !!entry.docBlobInIdb };
                }

                if (melihelpIdbDb && blob && blob.size > 0) {
                    entry.docBlobInIdb = true;
                    return putTrashBlobPromise(trashId, blob).then(function (idbOk) {
                        if (!idbOk) {
                            delete entry.docBlobInIdb;
                            return blobToDataUrl(blob).then(function (du) {
                                entry.doc = Object.assign({}, baseDoc, { dataUrl: du || '' });
                                return pushTrashMetaAndSave();
                            });
                        }
                        return pushTrashMetaAndSave();
                    });
                }

                if (blob && blob.size > 0) {
                    return blobToDataUrl(blob).then(function (du) {
                        entry.doc = Object.assign({}, baseDoc, { dataUrl: du || '' });
                        return pushTrashMetaAndSave();
                    });
                }

                entry.doc = Object.assign({}, baseDoc, { dataUrl: docItem.dataUrl || '' });
                return pushTrashMetaAndSave();
            });
        });
    }

    function labelForSourceKey(key) {
        if (!key) return 'Documentos';
        if (key === CORDAO_RETIRADAS_KEY) return 'Retirada / entrada de cordão';
        if (key === CORDAO_RECEBIMENTOS_KEY) return 'Recebimento de cordão (estoque)';
        var m = key.match(/_docs_certificados_(\d{4})_(\d{2})$/);
        if (m) return 'Crachás · ' + monthLabel(m[2]) + ' | ' + m[1];
        if (key.indexOf('_docs_certificados') !== -1 && key.indexOf('_docs_certificados_') === -1) return 'Certificados (pasta antiga)';
        m = key.match(/_docs_orcamentos_(\d{4})_(\d{2})$/);
        if (m) return 'Cordão · ' + monthLabel(m[2]) + ' | ' + m[1];
        m = key.match(/_docs_atas_(\d{4})_(\d{2})$/);
        if (m) return 'Cartão avulso · ' + monthLabel(m[2]) + ' | ' + m[1];
        return 'Documentos';
    }

    function closeDocDeleteConfirm() {
        docDeletePending = null;
        var bd = $('melihelp-doc-delete-backdrop');
        if (bd) bd.hidden = true;
    }

    function openDocDeleteConfirm(folderKey, docId) {
        if (!folderKey || docId == null || String(docId) === '') return;
        docDeletePending = { folderKey: folderKey, docId: String(docId) };
        var bd = $('melihelp-doc-delete-backdrop');
        if (bd) bd.hidden = false;
    }

    function executeRemoveDocToTrash(folderKey, docId) {
        var cur = loadDocs(folderKey);
        var found = cur.find(function (x) { return String(x.id) === String(docId); });
        if (!found) return;
        pushToTrashAsync(found, folderKey).then(function (res) {
            if (!res || !res.ok) {
                showToast('Não foi possível mover para a lixeira (armazenamento cheio). O arquivo não foi removido.');
                return;
            }
            var next = cur.filter(function (x) { return String(x.id) !== String(docId); });
            saveDocsAsync(folderKey, next).then(function (ok) {
                if (!ok) {
                    rollbackTrashEntry(res.trashId, res.docBlobInIdb);
                    showToast('Não foi possível atualizar a pasta. O arquivo não foi removido.');
                    render();
                    return;
                }
                showToast('Arquivo movido para a lixeira.');
                render();
            });
        });
    }

    function submitDocDeleteConfirm() {
        var p = docDeletePending;
        closeDocDeleteConfirm();
        if (!p || !p.folderKey || p.docId == null) return;
        executeRemoveDocToTrash(p.folderKey, p.docId);
    }

    function initMelihelpDocDeleteModal() {
        var bd = $('melihelp-doc-delete-backdrop');
        var dlg = bd ? bd.querySelector('.melihelp-upload-modal-dialog') : null;
        var closeB = $('melihelp-doc-delete-close');
        var cancel = $('melihelp-doc-delete-cancel');
        var confirmB = $('melihelp-doc-delete-confirm');
        if (!bd) return;
        bd.addEventListener('click', function (e) {
            if (e.target === bd) closeDocDeleteConfirm();
        });
        if (closeB) closeB.addEventListener('click', closeDocDeleteConfirm);
        if (cancel) cancel.addEventListener('click', closeDocDeleteConfirm);
        if (confirmB) confirmB.addEventListener('click', submitDocDeleteConfirm);
        if (dlg) dlg.addEventListener('click', function (e) { e.stopPropagation(); });
    }

    function parseRoute() {
        var h = (location.hash || '#/home').replace(/^#\/?/, '').trim();
        if (!h || h === 'home') return { type: 'home' };
        var p = h.split('/').filter(Boolean);
        var a = p[0];
        if (a === 'assistente') return { type: 'home' };
        if (a === 'emissao-cracha') return { type: 'emissao_cracha' };
        if (a === 'lixeira') return { type: 'docs_trash' };
        if (a === 'cordao') {
            if (p[1] === 'recebimento' && p[2] && p[3] && /^\d{4}$/.test(p[2]) && /^\d{2}$/.test(p[3])) {
                return { type: 'cordao_recebimento', year: p[2], month: p[3] };
            }
            if (p[1] && p[2] && /^\d{4}$/.test(p[1]) && /^\d{2}$/.test(p[2])) {
                return { type: 'cordao_retiradas', year: p[1], month: p[2] };
            }
            return { type: 'dash_cordao' };
        }
        if (a === 'certificados') {
            if (p[1] === 'cadastrar') {
                return { type: 'certificados_cadastrar' };
            }
            if (p[1] === 'desativados') {
                return { type: 'certificados_all_desativados' };
            }
            if (p[1] === 'unidade' && p[2] && isCertificadosUnidadeWip(p[2])) {
                return { type: 'certificados_unidade_wip', unidade: p[2] };
            }
            if (p[1] && p[2] && isCrachaNavYear(p[1]) && /^\d{2}$/.test(p[2])) {
                if (p[3] === 'desativados') {
                    return { type: 'certificados_all_desativados' };
                }
                if (p[3]) return { type: 'dash_certificados' };
                return { type: 'certificados_month', year: p[1], month: p[2] };
            }
            return { type: 'dash_certificados' };
        }
        if (a === 'orcamentos') {
            if (p[1] && p[2]) return { type: 'docs', category: 'orcamentos', year: p[1], month: p[2] };
            return { type: 'dash_orcamentos' };
        }
        if (a === 'atas') {
            if (p[1] === 'cadastrar') {
                return { type: 'atas_cadastrar_cartao' };
            }
            if (p[1] && p[2] && /^\d{4}$/.test(p[1])) {
                var miAtas = parseInt(String(p[2]).replace(/\D/g, ''), 10);
                if (!isNaN(miAtas) && miAtas >= 1 && miAtas <= 12) {
                    return { type: 'docs', category: 'atas', year: p[1], month: pad2(miAtas) };
                }
                return { type: 'docs', category: 'atas', year: p[1], month: p[2] };
            }
            return { type: 'dash_atas' };
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
        if (route.type === 'dash_cordao') return 'CORDÃO';
        if (route.type === 'cordao_retiradas') {
            return 'RETIRADAS DE CORDÕES · ' + monthLabel(route.month) + ' DE ' + route.year;
        }
        if (route.type === 'cordao_recebimento') {
            return 'RECEBIMENTO DE CORDÕES · ' + monthLabel(route.month) + ' DE ' + route.year;
        }
        if (route.type === 'dash_orcamentos') return 'CORDÃO · ARQUIVOS';
        if (route.type === 'dash_atas') return 'CARTÃO AVULSO';
        if (route.type === 'atas_cadastrar_cartao') return 'CARTÃO AVULSO · CADASTRAR CARTÃO';
        if (route.type === 'dash_certificados') return 'CRACHÁS';
        if (route.type === 'certificados_cadastrar') return 'CRACHÁS · CADASTRAR';
        if (route.type === 'certificados_unidade_wip') {
            return 'UNIDADE ' + certificadosUnidadeWipLabel(route.unidade);
        }
        if (route.type === 'emissao_cracha') return 'CRACHÁS · EMISSÃO DE CRACHÁ';
        if (route.type === 'certificados_month') {
            return 'CRACHÁS · ' + monthLabel(route.month) + ' | ' + route.year;
        }
        if (route.type === 'certificados_all_desativados') {
            return 'CRACHÁS DESATIVADOS';
        }
        if (route.type === 'docs') {
            if (route.category === 'orcamentos') {
                return 'CORDÃO · ' + monthLabel(route.month) + ' | ' + route.year;
            }
            if (route.category === 'atas') {
                return 'CARTÃO AVULSO · ' + monthLabel(route.month) + ' | ' + route.year;
            }
        }
        if (route.type === 'docs_trash') return 'Lixeira';
        return 'MeliHelp';
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

    function cordasStatsForEntries(entries) {
        var now = new Date();
        var startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        var dow = startOfDay.getDay();
        var mondayDiff = (dow + 6) % 7;
        var startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfWeek.getDate() - mondayDiff);
        startOfWeek.setHours(0, 0, 0, 0);
        var startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        var startOfYear = new Date(now.getFullYear(), 0, 1);

        function rowTs(iso) {
            var t = new Date(iso).getTime();
            return isNaN(t) ? 0 : t;
        }
        var today = 0;
        var week = 0;
        var month = 0;
        var year = 0;
        entries.forEach(function (e) {
            var t = rowTs(e.createdAt);
            if (!t) return;
            if (t >= startOfDay.getTime()) today++;
            if (t >= startOfWeek.getTime()) week++;
            if (t >= startOfMonth.getTime()) month++;
            if (t >= startOfYear.getTime()) year++;
        });
        return { today: today, week: week, month: month, year: year };
    }

    /** Entradas { createdAt } para KPIs — PDFs ativos em todos os meses de um ano. */
    function collectStatsEntriesFromActiveCertificadoPdfs(year) {
        var out = [];
        MESES.forEach(function (m) {
            loadDocs(docsStorageKey('certificados', year, m.id)).forEach(function (doc) {
                if (!doc.disabled) out.push({ createdAt: doc.addedAt });
            });
        });
        return out;
    }

    function collectStatsEntriesFromActiveCertificadoPdfsAllMenuYears() {
        var out = [];
        CRACHA_ANOS_MENU.forEach(function (y) {
            out = out.concat(collectStatsEntriesFromActiveCertificadoPdfs(y));
        });
        return out;
    }

    /** Total de PDFs de crachá desativados (flag disabled) em todos os meses do ano. */
    function countDisabledCertificadoPdfs(year) {
        var n = 0;
        MESES.forEach(function (m) {
            loadDocs(docsStorageKey('certificados', year, m.id)).forEach(function (doc) {
                if (doc.disabled) n++;
            });
        });
        return n;
    }

    function countDisabledCertificadoPdfsAllMenuYears() {
        var n = 0;
        CRACHA_ANOS_MENU.forEach(function (y) {
            n += countDisabledCertificadoPdfs(y);
        });
        return n;
    }

    function sortCertificadosDocsByName(items) {
        return items.slice().sort(function (a, b) {
            return String(a.name || '').localeCompare(String(b.name || ''), 'pt', { numeric: true, sensitivity: 'base' });
        });
    }

    /** folderKey opcional: lista agregada (desativados globais). extraMetaSuffix: texto extra na linha de meta (ex. mês/ano). addFilterAttr: data-melihelp-filter na linha (pesquisa na vista mensal). */
    function buildCertificadosPdfDocRowsHtml(items, isInactive, folderKey, extraMetaSuffix, addFilterAttr) {
        if (!items.length) return '';
        var dk = folderKey ? ' data-doc-key="' + escAttr(folderKey) + '"' : '';
        var metaExtra = extraMetaSuffix ? ' · ' + esc(extraMetaSuffix) : '';
        return items.map(function (item) {
            var canPreview = !!(item.dataUrl && (isPdfMime(item.mime, item.name) || isImageMime(item.mime)));
            var statusMeta = isInactive ? ' <span class="melihelp-doc-tag-inactive">DESATIVADO</span>' : '';
            var extraBtns = isInactive
                ? '<button type="button" class="selbetti-btn selbetti-btn-ghost selbetti-btn-text-upper melihelp-cracha-pdf-enable" data-id="' + esc(item.id) + '"' + dk + '>REATIVAR</button>'
                : '<button type="button" class="selbetti-btn selbetti-btn-ghost selbetti-btn-text-upper melihelp-cracha-pdf-disable" data-id="' + esc(item.id) + '"' + dk + '>DESATIVAR</button>';
            var previewBtn = (item.dataUrl && canPreview)
                ? '<button type="button" class="selbetti-btn selbetti-btn-ghost selbetti-btn-icon-only melihelp-preview-doc" data-id="' + esc(item.id) + '"' + dk + ' title="Visualizar" aria-label="Visualizar"><i class="fas fa-eye"></i></button>'
                : '';
            var baixarLink = item.dataUrl
                ? '<a class="selbetti-btn selbetti-btn-ghost selbetti-btn-download selbetti-btn-text-upper" href="' + esc(item.dataUrl) + '" download="' + escAttr(item.name) + '">BAIXAR</a>'
                : '';
            var editarBtn = '<button type="button" class="selbetti-btn selbetti-btn-ghost selbetti-btn-text-upper melihelp-cracha-pdf-edit" data-id="' + esc(item.id) + '"' + dk + ' title="Editar nome do arquivo">EDITAR</button>';
            var filterAttr = addFilterAttr ? ' data-melihelp-filter="' + escAttr(String(item.name || '').toLowerCase()) + '"' : '';
            return '<li class="selbetti-doc-item' + (isInactive ? ' melihelp-doc-item--inactive' : '') + '"' + filterAttr + '>' +
                '<div><strong>' + esc(item.name) + '</strong>' + statusMeta +
                '<div class="selbetti-doc-meta">' + esc(formatDate(item.addedAt)) + ' · ' + esc(formatBytes(item.size || 0)) +
                (item.mime ? ' · ' + esc(item.mime) : '') + metaExtra + '</div></div>' +
                '<div class="selbetti-toolbar selbetti-doc-toolbar">' +
                previewBtn +
                baixarLink +
                editarBtn +
                extraBtns +
                '<button type="button" class="selbetti-btn selbetti-btn-danger selbetti-btn-text-upper melihelp-remove-doc" data-id="' + esc(item.id) + '"' + dk + '>REMOVER</button>' +
                '</div></li>';
        }).join('');
    }

    function resolveCertificadoDocKeyFromBtn(btn, fallbackKey) {
        var dk = btn.getAttribute('data-doc-key');
        if (dk) return dk;
        return fallbackKey;
    }

    function bindCertificadosPdfSection(main, key) {
        var addBtn = main.querySelector('#melihelp-cracha-pdf-add');
        if (addBtn) {
            addBtn.addEventListener('click', function () {
                openMelihelpUploadModal();
            });
        }
        main.querySelectorAll('.melihelp-remove-doc').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var docKey = resolveCertificadoDocKeyFromBtn(btn, key);
                if (!docKey) return;
                var id = btn.getAttribute('data-id');
                var cur = loadDocs(docKey);
                var found = cur.find(function (x) { return String(x.id) === String(id); });
                if (!found) return;
                openDocDeleteConfirm(docKey, id);
            });
        });
        main.querySelectorAll('.melihelp-cracha-pdf-edit').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var docKey = resolveCertificadoDocKeyFromBtn(btn, key);
                if (!docKey) return;
                var id = btn.getAttribute('data-id');
                var cur = loadDocs(docKey);
                var item = cur.find(function (x) { return String(x.id) === String(id); });
                if (!item) return;
                openRenameDocModal(docKey, id, item.name || '');
            });
        });
        main.querySelectorAll('.melihelp-preview-doc').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var docKey = resolveCertificadoDocKeyFromBtn(btn, key);
                if (!docKey) return;
                var id = btn.getAttribute('data-id');
                var item = loadDocs(docKey).find(function (x) { return String(x.id) === String(id); });
                if (item && item.dataUrl) openDocPreview(item.dataUrl, item.name, item.mime);
            });
        });
        main.querySelectorAll('.melihelp-cracha-pdf-disable').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var docKey = resolveCertificadoDocKeyFromBtn(btn, key);
                if (!docKey) return;
                var id = btn.getAttribute('data-id');
                var cur = loadDocs(docKey);
                var item = cur.find(function (x) { return String(x.id) === String(id); });
                if (!item) return;
                item.disabled = true;
                saveDocsAsync(docKey, cur).then(function (ok) {
                    if (!ok) showToast('Não foi possível guardar (armazenamento cheio ou indisponível).');
                    else showToast('Crachá desativado.');
                    render();
                });
            });
        });
        main.querySelectorAll('.melihelp-cracha-pdf-enable').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var docKey = resolveCertificadoDocKeyFromBtn(btn, key);
                if (!docKey) return;
                var id = btn.getAttribute('data-id');
                var cur = loadDocs(docKey);
                var item = cur.find(function (x) { return String(x.id) === String(id); });
                if (!item) return;
                item.disabled = false;
                saveDocsAsync(docKey, cur).then(function (ok) {
                    if (!ok) showToast('Não foi possível guardar (armazenamento cheio ou indisponível).');
                    else showToast('Crachá reativado.');
                    render();
                });
            });
        });
    }

    function renderCertificadosDashboard() {
        var statsEntries = collectStatsEntriesFromActiveCertificadoPdfsAllMenuYears();
        var stats = cordasStatsForEntries(statsEntries);
        var disabledTotal = countDisabledCertificadoPdfsAllMenuYears();
        var main = $('melihelp-main');

        main.innerHTML =
            '<section class="melihelp-panel glass-panel melihelp-cracha-dashboard">' +
            '<header class="melihelp-dash-head melihelp-cracha-dash-head--minimal">' +
            '<h2 class="melihelp-dash-title">CRACHÁS</h2>' +
            '</header>' +
            '<div class="melihelp-axis-dashboard-grid melihelp-cracha-kpi-axis-grid" role="list">' +
            '<div class="melihelp-axis-mod melihelp-axis-mod--cyan melihelp-axis-stat" role="listitem">' +
            '<div class="melihelp-axis-mod-content">' +
            '<p class="melihelp-axis-stat-hero-val" aria-label="' +
            escAttr(String(stats.week) + ' crachás na semana') +
            '">' +
            esc(String(stats.week)) +
            '</p>' +
            '<p class="melihelp-axis-stat-caption">CRACHÁS NA SEMANA</p>' +
            '</div></div>' +
            '<div class="melihelp-axis-mod melihelp-axis-mod--green melihelp-axis-stat" role="listitem">' +
            '<div class="melihelp-axis-mod-content">' +
            '<p class="melihelp-axis-stat-hero-val" aria-label="' +
            escAttr(String(stats.month) + ' crachás no mês') +
            '">' +
            esc(String(stats.month)) +
            '</p>' +
            '<p class="melihelp-axis-stat-caption">CRACHÁS NO MÊS</p>' +
            '</div></div>' +
            '<div class="melihelp-axis-mod melihelp-axis-mod--indigo melihelp-axis-stat" role="listitem">' +
            '<div class="melihelp-axis-mod-content">' +
            '<p class="melihelp-axis-stat-hero-val" aria-label="' +
            escAttr(String(stats.year) + ' crachás no ano') +
            '">' +
            esc(String(stats.year)) +
            '</p>' +
            '<p class="melihelp-axis-stat-caption">CRACHÁS NO ANO</p>' +
            '</div></div>' +
            '<div class="melihelp-axis-mod melihelp-axis-mod--amber melihelp-axis-stat" role="listitem">' +
            '<div class="melihelp-axis-mod-content">' +
            '<p class="melihelp-axis-stat-hero-val" aria-label="' +
            escAttr(String(disabledTotal) + ' crachás desativados') +
            '">' +
            esc(String(disabledTotal)) +
            '</p>' +
            '<p class="melihelp-axis-stat-caption">CRACHÁS DESATIVADOS</p>' +
            '</div></div>' +
            '</div>' +
            '</section>' +
            '<section class="melihelp-unidade-wip-axis-section glass-panel melihelp-cracha-dash-quick" aria-label="Acesso rápido crachás">' +
            '<h3 class="melihelp-unidade-wip-axis-section-title">ACESSO RÁPIDO</h3>' +
            '<div class="melihelp-axis-dashboard-grid melihelp-axis-dashboard-grid--cols-3">' +
            '<button type="button" class="melihelp-axis-mod melihelp-axis-mod--indigo" data-mh-route="certificados/cadastrar">' +
            '<div class="melihelp-axis-mod-icon" aria-hidden="true">➕</div>' +
            '<div class="melihelp-axis-mod-content">' +
            '<h3 class="melihelp-axis-mod-title">CADASTRAR CRACHÁ</h3>' +
            '<p class="melihelp-axis-mod-desc">PDF ou imagem no mês e ano em destaque</p>' +
            '</div></button>' +
            '<button type="button" class="melihelp-axis-mod melihelp-axis-mod--amber" data-mh-route="certificados/desativados">' +
            '<div class="melihelp-axis-mod-icon" aria-hidden="true">📂</div>' +
            '<div class="melihelp-axis-mod-content">' +
            '<h3 class="melihelp-axis-mod-title">CRACHÁS DESATIVADOS</h3>' +
            '<p class="melihelp-axis-mod-desc">Lista única e reativação por mês</p>' +
            '</div></button>' +
            '<button type="button" class="melihelp-axis-mod melihelp-axis-mod--cyan" data-mh-route="emissao-cracha">' +
            '<div class="melihelp-axis-mod-icon" aria-hidden="true">✏️</div>' +
            '<div class="melihelp-axis-mod-content">' +
            '<h3 class="melihelp-axis-mod-title">EMISSÃO DE CRACHÁ</h3>' +
            '<p class="melihelp-axis-mod-desc">Fluxo de emissão do crachá</p>' +
            '</div></button>' +
            '</div></section>';

        pendingUploadTarget = null;
        main.querySelectorAll('.melihelp-cracha-dash-quick [data-mh-route]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var r = btn.getAttribute('data-mh-route');
                if (r) setRoute(r);
            });
        });
    }

    /** Pasta de crachá para cadastro sem escolha manual: mês/ano do calendário; ano fora do menu → primeiro ano listado. */
    function cadastroCrachaDestinoYmHoje() {
        var now = new Date();
        var cy = String(now.getFullYear());
        var y = isCrachaNavYear(cy) ? cy : CRACHA_ANOS_MENU[0];
        var mo = pad2(now.getMonth() + 1);
        return { y: y, mo: mo };
    }

    function clearCadastroDestinoTicker() {
        if (cadastroDestinoTickerId != null) {
            clearInterval(cadastroDestinoTickerId);
            cadastroDestinoTickerId = null;
        }
    }

    function refreshCadastroDestinoSubtitle() {
        var el = $('melihelp-cadastro-destino-subtitle');
        if (!el) return;
        var d = cadastroCrachaDestinoYmHoje();
        el.textContent = 'DESTINO ATUAL · ' + monthLabel(d.mo) + ' DE ' + d.y;
    }

    function startCadastroDestinoTicker() {
        clearCadastroDestinoTicker();
        refreshCadastroDestinoSubtitle();
        cadastroDestinoTickerId = setInterval(refreshCadastroDestinoSubtitle, 30000);
    }

    function renderCertificadosCadastrar() {
        var main = $('melihelp-main');

        main.innerHTML =
            '<section class="melihelp-panel glass-panel melihelp-cracha-month-only melihelp-cracha-cadastro-panel">' +
            '<header class="melihelp-dash-head melihelp-cracha-dash-head--stacked">' +
            '<h2 class="melihelp-dash-title">CADASTRAR CRACHÁ</h2>' +
            '<p id="melihelp-cadastro-destino-subtitle" class="melihelp-cracha-month-subtitle" aria-live="polite"></p>' +
            '<p class="melihelp-cracha-lead melihelp-cracha-lead--allcaps">ÁREA PARA REGISTAR CRACHÁS: ENVIE PDF OU IMAGEM COM FOTO DO COLABORADOR. CADA FICHEIRO FICA NA PASTA DO MÊS E ANO MOSTRADOS EM DESTINO ATUAL (ATUALIZAM AUTOMATICAMENTE QUANDO O CALENDÁRIO MUDA DE MÊS). USE ADICIONAR ARQUIVOS; NO MODAL, AJUSTE A DATA E HORA DO DOCUMENTO ANTES DE ESCOLHER OS FICHEIROS.</p>' +
            '</header>' +
            '<div class="melihelp-dash-section melihelp-cracha-pdf-section">' +
            '<div class="melihelp-cracha-selb" data-selbetti-cert-clone="1">' +
            '<section class="selbetti-panel glass-panel melihelp-cracha-selb-panel" aria-label="CADASTRAR CRACHÁ">' +
            '<div class="selbetti-panel-head">' +
            '<h2 class="melihelp-cracha-inner-panel-title">CRACHÁS</h2>' +
            '<div class="selbetti-toolbar melihelp-cracha-selb-head-toolbar">' +
            '<button type="button" class="selbetti-btn selbetti-btn-primary selbetti-btn-text-upper" id="melihelp-cadastro-cracha-add" title="DATA/HORA NO MODAL; DEPOIS ESCOLHA OS FICHEIROS.">ADICIONAR ARQUIVOS</button>' +
            '<button type="button" class="selbetti-btn selbetti-btn-ghost selbetti-btn-text-upper" id="melihelp-cadastro-cracha-goto">VER MÊS ATUAL</button>' +
            '</div></div>' +
            '</section></div></div>' +
            '</section>';

        pendingUploadTarget = null;

        main.querySelector('#melihelp-cadastro-cracha-add').addEventListener('click', function () {
            var ym = cadastroCrachaDestinoYmHoje();
            pendingUploadTarget = { key: docsStorageKey('certificados', ym.y, ym.mo) };
            openMelihelpUploadModal();
        });
        main.querySelector('#melihelp-cadastro-cracha-goto').addEventListener('click', function () {
            var ym = cadastroCrachaDestinoYmHoje();
            setRoute('certificados/' + ym.y + '/' + ym.mo);
        });

        startCadastroDestinoTicker();
    }

    /** Mês/ano de destino para números W (cartão avulso): ano fixo 2026 no menu atual; mês = calendário. */
    function cadastroCartaoAvulsoDestinoYmHoje() {
        var now = new Date();
        return { y: '2026', mo: pad2(now.getMonth() + 1) };
    }

    function clearAtasAvulsoCadastroTicker() {
        if (avulsoCadastroDestinoTickerId != null) {
            clearInterval(avulsoCadastroDestinoTickerId);
            avulsoCadastroDestinoTickerId = null;
        }
    }

    function refreshAtasAvulsoCadastroSubtitle() {
        var el = $('melihelp-atas-cadastro-destino-subtitle');
        if (!el) return;
        var d = cadastroCartaoAvulsoDestinoYmHoje();
        el.textContent = 'DESTINO ATUAL · ' + monthLabel(d.mo) + ' DE ' + d.y;
    }

    function startAtasAvulsoCadastroTicker() {
        clearAtasAvulsoCadastroTicker();
        refreshAtasAvulsoCadastroSubtitle();
        avulsoCadastroDestinoTickerId = setInterval(refreshAtasAvulsoCadastroSubtitle, 30000);
    }

    function renderAtasCadastrarCartao() {
        pendingUploadTarget = null;
        var main = $('melihelp-main');

        main.innerHTML =
            '<section class="melihelp-panel glass-panel melihelp-cracha-month-only melihelp-cracha-cadastro-panel">' +
            '<header class="melihelp-dash-head melihelp-cracha-dash-head--stacked">' +
            '<h2 class="melihelp-dash-title">CADASTRAR CARTÃO</h2>' +
            '<p id="melihelp-atas-cadastro-destino-subtitle" class="melihelp-cracha-month-subtitle" aria-live="polite"></p>' +
            '<p class="melihelp-cracha-lead melihelp-cracha-lead--allcaps">REGISTE O NÚMERO <strong>W</strong> IMPRESSO NO CARTÃO (A: E S: NÃO SÃO USADOS). ' +
            'CADA INCLUSÃO VAI PARA O MÊS E ANO DO <strong>DESTINO ATUAL</strong>, COMO NO CADASTRAR CRACHÁ — ATUALIZA QUANDO O CALENDÁRIO MUDA DE MÊS. ' +
            'USE <strong>VER MÊS ATUAL</strong> PARA ABRIR A TABELA DESSE MÊS (PESQUISA E FILTRO).</p>' +
            '</header>' +
            '<div class="melihelp-dash-section">' +
            '<section class="melihelp-avulso-w-cadastro-card melihelp-avulso-w-cadastro-card--standalone" aria-labelledby="melihelp-atas-cadastro-inner-title">' +
            '<div class="melihelp-avulso-w-cadastro-card-head">' +
            '<h3 id="melihelp-atas-cadastro-inner-title" class="melihelp-avulso-w-cadastro-title">CADASTRO DE CARTÃO</h3>' +
            '<p class="melihelp-avulso-w-cadastro-sub">Incluir número W no destino atual</p></div>' +
            '<div class="melihelp-avulso-w-toolbar melihelp-avulso-w-toolbar--cadastro-only">' +
            '<div class="melihelp-avulso-w-toolbar-add melihelp-avulso-w-toolbar-add--cadastro">' +
            '<input type="text" id="melihelp-atas-cadastro-w-input" class="melihelp-avulso-w-inline-add melihelp-avulso-w-inline-add--wide" ' +
            'placeholder="Ex.: 078,58979 ou W: 078,58979" maxlength="64" autocomplete="off" aria-label="Número W" inputmode="numeric" />' +
            '<button type="button" class="melihelp-btn melihelp-btn-primary melihelp-btn-text-upper" id="melihelp-atas-cadastro-w-btn">INCLUIR</button>' +
            '</div></div>' +
            '<div class="melihelp-avulso-w-cadastro-actions">' +
            '<button type="button" class="melihelp-btn melihelp-btn-ghost melihelp-btn-text-upper" id="melihelp-atas-cadastro-goto-mes">VER MÊS ATUAL</button>' +
            '</div></section></div></section>';

        var addInp = $('melihelp-atas-cadastro-w-input');
        var addBtn = $('melihelp-atas-cadastro-w-btn');
        var gotoMes = $('melihelp-atas-cadastro-goto-mes');

        function doAdd() {
            var ym = cadastroCartaoAvulsoDestinoYmHoje();
            var raw = String(addInp && addInp.value || '').trim();
            var norm = normalizeAtasAvulsoW(raw);
            if (!norm) {
                showToast('Informe o número W.', 'warning');
                return;
            }
            var cur = loadAtasAvulsoWList(ym.y, ym.mo);
            var entry = {
                id: String(Date.now()) + '_' + Math.random().toString(36).slice(2, 9),
                wNorm: norm,
                wDisplay: raw.replace(/^\s*W\s*:\s*/i, '').trim() || norm,
                addedAt: cordaoStampForViewedMonth(ym.y, ym.mo)
            };
            cur.push(entry);
            if (!saveAtasAvulsoWList(ym.y, ym.mo, cur)) return;
            pushAtasAvulsoWPutToServer(ym.y, ym.mo, entry);
            if (addInp) addInp.value = '';
            var sorted = sortAtasAvulsoWList(cur);
            var idx = sorted.findIndex(function (r) { return r.id === entry.id; });
            var st = idx >= 0 ? wStatusForRowIndex(sorted, idx) : 'Único';
            showToast(
                st === 'Repetido' ? 'Cartão repetido — já consta neste mês.' : 'Cartão cadastrado com sucesso.',
                st === 'Repetido' ? 'warning' : 'success'
            );
        }

        if (addBtn) addBtn.addEventListener('click', doAdd);
        if (addInp) {
            addInp.addEventListener('input', function () {
                applyMelihelpCadastroWInputMask(addInp);
            });
            addInp.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    doAdd();
                }
            });
        }
        if (gotoMes) {
            gotoMes.addEventListener('click', function () {
                var ym = cadastroCartaoAvulsoDestinoYmHoje();
                setRoute('atas/' + ym.y + '/' + ym.mo);
            });
        }

        startAtasAvulsoCadastroTicker();
        if (addInp) setTimeout(function () { addInp.focus(); }, 50);
    }

    function renderCertificadosUnidadeWip(unidadeId) {
        if (!isCertificadosUnidadeWip(unidadeId)) {
            setRoute('certificados/cadastrar');
            return;
        }
        var main = $('melihelp-main');
        var label = certificadosUnidadeWipLabel(unidadeId);
        var bannerUrls = certificadosUnidadeWipBannerUrlCandidates(unidadeId);
        var bannerHtml = '';
        if (bannerUrls.length) {
            bannerHtml =
                '<div class="melihelp-unidade-wip-banner-wrap">' +
                '<img class="melihelp-unidade-wip-banner" src="' +
                escAttr(bannerUrls[0]) +
                '" alt="' +
                escAttr('Unidade ' + label) +
                '" width="1200" height="400" loading="eager" decoding="async">' +
                '</div>';
        }
        main.innerHTML =
            '<section class="melihelp-panel glass-panel melihelp-unidade-wip-panel' +
            (bannerUrls.length ? ' melihelp-unidade-wip-panel--has-banner' : '') +
            '">' +
            bannerHtml +
            '<div class="melihelp-unidade-wip-inner' +
            (bannerUrls.length ? ' melihelp-unidade-wip-inner--below-banner' : '') +
            '">' +
            '<header class="melihelp-dash-head melihelp-cracha-dash-head--stacked melihelp-unidade-wip-head">' +
            '<h2 class="melihelp-dash-title">UNIDADE ' + esc(label) + '</h2>' +
            '<p class="melihelp-cracha-lead melihelp-cracha-lead--allcaps melihelp-unidade-wip-lead">CRACHÁS DA UNIDADE <strong>' +
            esc(label) +
            '</strong> — ESPAÇO DEDICADO À <strong>EMISSÃO</strong> E AO <strong>ARQUIVO</strong> DE CRACHÁS (PDF E IMAGEM), ORGANIZADOS POR UNIDADE E POR PERÍODO. CADA REGISTO REFLETE O PESSOAL AUTORIZADO, O LAYOUT DO SELO E O MOMENTO DA <strong>EMISSÃO</strong>, PERMITINDO <strong>CONSULTA</strong>, CONTROLE DOCUMENTAL E <strong>REEMISSÃO</strong> QUANDO O CONTEXTO DA UNIDADE O EXIGE.</p>' +
            '</header></div></section>' +
            '<section class="melihelp-unidade-wip-axis-section glass-panel" aria-label="Atalhos da unidade">' +
            '<h3 class="melihelp-unidade-wip-axis-section-title">ACESSO RÁPIDO</h3>' +
            '<div class="melihelp-axis-dashboard-grid">' +
            '<button type="button" class="melihelp-axis-mod melihelp-axis-mod--indigo" data-mh-route="certificados">' +
            '<div class="melihelp-axis-mod-icon" aria-hidden="true">🪪</div>' +
            '<div class="melihelp-axis-mod-content">' +
            '<h3 class="melihelp-axis-mod-title">HISTÓRICO</h3>' +
            '<p class="melihelp-axis-mod-desc">Painel e PDFs por mês (2026, 2025 e 2024)</p>' +
            '</div></button>' +
            CRACHA_ANOS_MENU.map(function (y, idx) {
                var tone = idx === 0 ? 'cyan' : idx === 1 ? 'green' : 'amber';
                return (
                    '<button type="button" class="melihelp-axis-mod melihelp-axis-mod--' +
                    tone +
                    '" data-mh-route="certificados/' +
                    escAttr(y) +
                    '/01">' +
                    '<div class="melihelp-axis-mod-icon" aria-hidden="true">📅</div>' +
                    '<div class="melihelp-axis-mod-content">' +
                    '<h3 class="melihelp-axis-mod-title">' +
                    esc(y) +
                    '</h3>' +
                    '<p class="melihelp-axis-mod-desc">Crachás por mês em ' +
                    esc(y) +
                    '</p>' +
                    '</div></button>'
                );
            }).join('') +
            '</div></section>';
        main.querySelectorAll('[data-mh-route]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var r = btn.getAttribute('data-mh-route');
                if (r) setRoute(r);
            });
        });

        if (bannerUrls.length) {
            var imgEl = main.querySelector('.melihelp-unidade-wip-banner');
            if (imgEl) {
                var tryIdx = 0;
                imgEl.addEventListener('error', function onBannerImgErr() {
                    tryIdx += 1;
                    if (tryIdx < bannerUrls.length) {
                        imgEl.src = bannerUrls[tryIdx];
                        return;
                    }
                    imgEl.removeEventListener('error', onBannerImgErr);
                    imgEl.style.display = 'none';
                    var wrap = main.querySelector('.melihelp-unidade-wip-banner-wrap');
                    if (wrap && !wrap.querySelector('.melihelp-unidade-wip-banner-missing')) {
                        var p = document.createElement('p');
                        p.className = 'melihelp-unidade-wip-banner-missing';
                        p.setAttribute('role', 'alert');
                        p.textContent =
                            'Não foi possível carregar o banner da unidade ' +
                            label +
                            '. Coloque o ficheiro em assets/IMAGENS/ (ex.: ' +
                            unidadeId +
                            '.jpg ou ' +
                            unidadeId +
                            '.png; no Windows evite extensão duplicada tipo ' +
                            unidadeId +
                            '.jpg.jpg). Recarregue com Ctrl+F5.';
                        wrap.appendChild(p);
                        wrap.classList.add('melihelp-unidade-wip-banner-wrap--failed');
                    }
                });
            }
        }
    }

    function renderCertificadosMonth(year, month) {
        if (!isCrachaNavYear(year) || !MESES.some(function (m) { return m.id === month; })) {
            setRoute('certificados');
            return;
        }
        var pdfKey = docsStorageKey('certificados', year, month);
        var pdfList = loadDocs(pdfKey);
        var activePdf = pdfList.filter(function (x) { return !x.disabled; });
        var activePdfSorted = sortCertificadosDocsByName(activePdf);
        var main = $('melihelp-main');
        var mlabel = monthLabel(month);

        var activePdfHtml = activePdfSorted.length
            ? buildCertificadosPdfDocRowsHtml(activePdfSorted, false, null, null, true)
            : '<li class="melihelp-cracha-selb-empty-li"><div class="selbetti-empty melihelp-cracha-text-allcaps"><span class="big">📂</span>NÃO HÁ <strong>CRACHÁS ATIVOS</strong> EM <strong>' + esc(mlabel) + ' DE ' + esc(year) + '</strong>. PARA REGISTAR NOVOS, USE O MENU <strong>CRACHÁS → CADASTRAR CRACHÁ</strong> (O DESTINO NO CALENDÁRIO É SEMPRE O <strong>MÊS ATUAL</strong>).</div></li>';

        var monthHeadToolsHtml =
            '<div class="selbetti-toolbar melihelp-cracha-month-head-tools">' +
            '<div class="melihelp-cracha-month-count-chip glass-panel" role="status" aria-live="polite">' +
            '<span class="melihelp-cracha-month-count-val" id="melihelp-cracha-month-count-val" aria-label="' + escAttr(String(activePdfSorted.length) + ' CRACHÁS ATIVOS EM ' + mlabel + ' DE ' + year) + '">' + activePdfSorted.length + '</span>' +
            '<span class="melihelp-cracha-month-count-label-inline">CRACHÁS</span>' +
            '</div>' +
            '<div class="melihelp-cracha-month-search-glass glass-panel" id="melihelp-cracha-month-search-shell" role="search">' +
            '<span class="melihelp-cracha-month-search-icon" aria-hidden="true"><i class="fas fa-search"></i></span>' +
            '<input type="search" id="melihelp-cracha-month-search" class="melihelp-cracha-month-search-input" placeholder="PESQUISAR POR NOME…" autocomplete="off" aria-label="PESQUISAR CRACHÁS POR NOME" />' +
            '</div>' +
            '</div>';

        var monthPanelHeadClass = 'selbetti-panel-head melihelp-cracha-month-panel-head--with-toolbar';

        var pageDesc =
            'AQUI VÊ SÓ OS <strong>CRACHÁS ATIVOS</strong> DE <strong>' + esc(mlabel) + ' DE ' + esc(year) + '</strong>, GUARDADOS NESTE NAVEGADOR (PDF OU IMAGEM). ' +
            'A LISTA ESTÁ EM <strong>ORDEM ALFABÉTICA</strong>; USE A PESQUISA PARA FILTRAR PELO NOME. ' +
            'NOVOS REGISTOS: MENU <strong>CRACHÁS → CADASTRAR CRACHÁ</strong> (SEM ADICIONAR FICHEIROS NESTA PÁGINA). ' +
            'CRACHÁS EM PAUSA FICAM EM <strong>CRACHÁS DESATIVADOS</strong>; EM CADA LINHA PODE <strong>DESATIVAR</strong>, EDITAR O NOME, TRANSFERIR OU REMOVER.';

        main.innerHTML =
            '<section class="melihelp-panel glass-panel melihelp-cracha-month-only">' +
            '<header class="melihelp-dash-head melihelp-cracha-dash-head--stacked">' +
            '<h2 class="melihelp-dash-title">CRACHÁS</h2>' +
            '<p class="melihelp-cracha-month-subtitle">ATIVOS EM <span class="melihelp-cracha-month-subtitle-strong">' + esc(mlabel) + ' DE ' + esc(year) + '</span></p>' +
            '<p class="melihelp-cracha-lead melihelp-cracha-lead--allcaps melihelp-cracha-month-page-desc">' + pageDesc + '</p>' +
            '</header>' +
            '<div class="melihelp-dash-section melihelp-cracha-pdf-section">' +
            '<div class="melihelp-cracha-selb" data-selbetti-cert-clone="1">' +
            '<section class="selbetti-panel glass-panel melihelp-cracha-selb-panel" aria-label="' + escAttr('CRACHÁS ATIVOS EM ' + mlabel + ' DE ' + year) + '">' +
            '<div class="' + monthPanelHeadClass + '">' +
            '<h2 class="melihelp-cracha-inner-panel-title">CRACHÁS</h2>' +
            monthHeadToolsHtml +
            '</div>' +
            '<div class="melihelp-cracha-doc-list-scroll" aria-label="LISTA DE CRACHÁS DESTE MÊS">' +
            '<ul class="selbetti-doc-list" id="melihelp-cracha-pdf-list-active">' + activePdfHtml + '</ul>' +
            '</div>' +
            '</section></div></div>' +
            '</section>';

        pendingUploadTarget = null;

        main.querySelectorAll('[data-go]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                setRoute(btn.getAttribute('data-go'));
            });
        });

        bindCertificadosPdfSection(main, pdfKey);
        bindCertificadosMonthSearchFilter(main);
    }

    function bindCertificadosMonthSearchFilter(main) {
        var searchEl = main.querySelector('#melihelp-cracha-month-search');
        var listUl = main.querySelector('#melihelp-cracha-pdf-list-active');
        var countVal = main.querySelector('#melihelp-cracha-month-count-val');
        if (!searchEl || !listUl || !countVal) return;

        function applyFilter() {
            var q = (searchEl.value || '').trim().toLowerCase();
            var rows = listUl.querySelectorAll('li.selbetti-doc-item');
            var total = rows.length;
            var vis = 0;
            for (var i = 0; i < rows.length; i++) {
                var li = rows[i];
                var fn = li.getAttribute('data-melihelp-filter') || '';
                var show = !q || fn.indexOf(q) !== -1;
                li.hidden = !show;
                if (show) vis++;
            }
            if (q) {
                countVal.textContent = vis + ' / ' + total;
                countVal.setAttribute('aria-label', vis + ' DE ' + total + ' CRACHÁS CORRESPONDEM À PESQUISA');
            } else {
                countVal.textContent = String(total);
                countVal.setAttribute('aria-label', total + ' CRACHÁS NESTE MÊS');
            }
        }

        searchEl.addEventListener('input', applyFilter);
        searchEl.addEventListener('search', applyFilter);
        applyFilter();
    }

    function collectAllDisabledCertificadoEntries() {
        var rows = [];
        CRACHA_ANOS_MENU.forEach(function (y) {
            MESES.forEach(function (m) {
                var k = docsStorageKey('certificados', y, m.id);
                loadDocs(k).forEach(function (doc) {
                    if (doc.disabled) {
                        rows.push({
                            item: doc,
                            folderKey: k,
                            year: y,
                            month: m.id,
                            periodLabel: monthLabel(m.id) + ' · ' + y
                        });
                    }
                });
            });
        });
        rows.sort(function (a, b) {
            var ta = new Date(a.item.addedAt || 0).getTime();
            var tb = new Date(b.item.addedAt || 0).getTime();
            return (isNaN(tb) ? 0 : tb) - (isNaN(ta) ? 0 : ta);
        });
        return rows;
    }

    function renderCertificadosAllDesativados() {
        var main = $('melihelp-main');
        var entries = collectAllDisabledCertificadoEntries();
        var listHtml = entries.length
            ? entries.map(function (ent) {
                return buildCertificadosPdfDocRowsHtml([ent.item], true, ent.folderKey, ent.periodLabel);
            }).join('')
            : '<li class="melihelp-cracha-selb-empty-li"><div class="selbetti-empty melihelp-cracha-text-allcaps"><span class="big">📂</span>NENHUM CRACHÁ DESATIVADO.<br>USE <strong>DESATIVAR</strong> NA LISTA DE UM MÊS OU REATIVE AQUI. OS DESATIVADOS NÃO ENTRAM NOS TOTAIS DO PAINEL.</div></li>';

        main.innerHTML =
            '<section class="melihelp-panel glass-panel melihelp-cracha-month-only">' +
            '<header class="melihelp-dash-head melihelp-cracha-dash-head--stacked">' +
            '<h2 class="melihelp-dash-title">CRACHÁS DESATIVADOS</h2>' +
            '<p class="melihelp-cracha-month-subtitle">TODOS OS MESES (2026, 2025 E 2024)</p>' +
            '<p class="melihelp-cracha-lead melihelp-cracha-lead--allcaps">LISTA ÚNICA DE TODOS OS ARQUIVOS PAUSADOS. CADA LINHA MOSTRA O MÊS E ANO DE ORIGEM. REATIVAR DEVOLVE O FICHEIRO À LISTA ATIVA DESSE MÊS. NÃO ENTRAM NOS TOTAIS DO PAINEL CRACHÁS.</p>' +
            '</header>' +
            '<div class="melihelp-dash-section melihelp-cracha-pdf-section">' +
            '<div class="melihelp-cracha-selb" data-selbetti-cert-clone="1">' +
            '<section class="selbetti-panel glass-panel melihelp-cracha-selb-panel" aria-label="CRACHÁS DESATIVADOS">' +
            '<div class="selbetti-panel-head">' +
            '<h2 class="melihelp-cracha-inner-panel-title">DESATIVADOS</h2>' +
            '<div class="selbetti-toolbar melihelp-cracha-selb-head-toolbar">' +
            '<button type="button" class="selbetti-btn selbetti-btn-primary selbetti-btn-text-upper" id="melihelp-cracha-desativados-back" data-route-back="certificados">VOLTAR AO PAINEL</button>' +
            '</div></div>' +
            '<div class="melihelp-cracha-doc-list-scroll" aria-label="LISTA DE CRACHÁS DESATIVADOS">' +
            '<ul class="selbetti-doc-list" id="melihelp-cracha-pdf-list-inactive">' + listHtml + '</ul>' +
            '</div>' +
            '</section></div></div>' +
            '</section>';

        pendingUploadTarget = null;

        var backBtn = main.querySelector('#melihelp-cracha-desativados-back');
        if (backBtn) {
            backBtn.addEventListener('click', function () {
                setRoute(backBtn.getAttribute('data-route-back') || 'certificados');
            });
        }

        main.querySelectorAll('[data-go]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                setRoute(btn.getAttribute('data-go'));
            });
        });

        bindCertificadosPdfSection(main, null);
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

    var DASH_DEFAULT_LABELS = ['Arquivos guardados', 'Meses com conteúdo', 'Tamanho total (aproximadamente)'];
    var DASH_DEFAULT_FORMATS = ['count', 'count', 'bytes'];

    /** Normaliza 4º argumento de renderDocsCategoryDashboard: array só de rótulos ou { statLabels, statFormats }. */
    function parseDashOptions(fourth) {
        var labels = DASH_DEFAULT_LABELS.slice();
        var formats = DASH_DEFAULT_FORMATS.slice();
        if (!fourth) return { labels: labels, formats: formats };
        if (Array.isArray(fourth)) {
            if (fourth.length === 3) labels = fourth;
            return { labels: labels, formats: formats };
        }
        if (fourth.statLabels && fourth.statLabels.length === 3) labels = fourth.statLabels;
        if (fourth.statFormats && fourth.statFormats.length === 3) formats = fourth.statFormats;
        return { labels: labels, formats: formats };
    }

    /** Anima os três valores do painel em paralelo (mesma duração). statFormats: count = inteiro; bytes = tamanho (KB/MB…). Terceiro count = total de envios (arquivos). */
    function runDashStatAnimations(panelEl, agg, statFormats) {
        if (!panelEl) return;
        var fmt = statFormats && statFormats.length === 3 ? statFormats : DASH_DEFAULT_FORMATS;
        var vals = panelEl.querySelectorAll('.melihelp-dash-stat-val');
        if (vals.length !== 3) return;
        var tf = agg.totalFiles;
        var tm = agg.monthsWithFiles;
        var tb = agg.totalBytes;
        var thirdIsBytes = fmt[2] === 'bytes';
        var idle = tf === 0 && tm === 0 && (thirdIsBytes ? tb === 0 : true);
        if (idle) {
            vals[0].textContent = '0';
            vals[1].textContent = '0';
            vals[2].textContent = thirdIsBytes ? formatBytes(0) : '0';
            return;
        }
        var duration = 520;
        var t0 = null;
        function ease(p) {
            return 0.5 - Math.cos(Math.min(1, p) * Math.PI) / 2;
        }
        function textThird(e) {
            if (thirdIsBytes) return formatBytes(Math.max(0, Math.round(tb * e)));
            return String(Math.round(tf * e));
        }
        function finalThird() {
            return thirdIsBytes ? formatBytes(tb) : String(tf);
        }
        function frame(ts) {
            if (t0 == null) t0 = ts;
            var p = Math.min(1, (ts - t0) / duration);
            var e = ease(p);
            vals[0].textContent = String(Math.round(tf * e));
            vals[1].textContent = String(Math.round(tm * e));
            vals[2].textContent = textThird(e);
            if (p < 1) {
                requestAnimationFrame(frame);
            } else {
                vals[0].textContent = String(tf);
                vals[1].textContent = String(tm);
                vals[2].textContent = finalThird();
            }
        }
        vals[0].textContent = '0';
        vals[1].textContent = '0';
        vals[2].textContent = thirdIsBytes ? formatBytes(0) : '0';
        requestAnimationFrame(frame);
    }

    function renderDocsCategoryDashboard(category, years, heading, fourth) {
        var agg = aggregateCategoryByMonths(category, years);
        var withFiles = agg.entries.filter(function (e) { return e.count > 0; });
        var dash = parseDashOptions(fourth);
        var labels = dash.labels;
        var formats = dash.formats;
        var thirdIsBytes = formats[2] === 'bytes';
        var thirdInitial = thirdIsBytes ? esc(formatBytes(0)) : '0';

        var statsHtml =
            '<div class="melihelp-dash-stats">' +
            '<div class="melihelp-dash-stat glass-panel"><span class="melihelp-dash-stat-val">0</span><span class="melihelp-dash-stat-label">' + esc(labels[0]) + '</span></div>' +
            '<div class="melihelp-dash-stat glass-panel"><span class="melihelp-dash-stat-val">0</span><span class="melihelp-dash-stat-label">' + esc(labels[1]) + '</span></div>' +
            '<div class="melihelp-dash-stat glass-panel"><span class="melihelp-dash-stat-val">' + thirdInitial + '</span><span class="melihelp-dash-stat-label">' + esc(labels[2]) + '</span></div>' +
            '</div>';

        var gridHtml;
        if (withFiles.length) {
            gridHtml =
                '<div class="melihelp-dash-section">' +
                '<h3 class="melihelp-dash-h3">Pastas com arquivos</h3>' +
                '<div class="melihelp-dash-month-grid">' +
                withFiles.map(function (e) {
                    return '<button type="button" class="melihelp-dash-month-chip glass-panel" data-go="' + escAttr(e.route) + '">' +
                        '<span class="melihelp-dash-month-chip-label">' + esc(e.monthLabel) + ' ' + esc(e.year) + '</span>' +
                        '<span class="melihelp-dash-month-chip-badge">' + e.count + '</span></button>';
                }).join('') +
                '</div></div>';
        } else {
            gridHtml =
                '<div class="melihelp-dash-section">' +
                '<div class="melihelp-dash-inventario-card glass-panel" role="status">' +
                '<div class="melihelp-dash-inventario-icon" aria-hidden="true">📦</div>' +
                '<h3 class="melihelp-dash-inventario-title txt-axis-gradient-selb">SEM ARQUIVOS</h3>' +
                '</div></div>';
        }

        var main = $('melihelp-main');
        main.innerHTML =
            '<section class="melihelp-panel glass-panel melihelp-dash-panel">' +
            '<header class="melihelp-dash-head">' +
            '<h2 class="melihelp-dash-title">' + esc(heading) + '</h2>' +
            '</header>' +
            statsHtml +
            gridHtml +
            '</section>';

        var panel = main.querySelector('.melihelp-dash-panel');
        runDashStatAnimations(panel, agg, formats);

        main.querySelectorAll('[data-go]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                setRoute(btn.getAttribute('data-go'));
            });
        });
    }

    function buildNavHtml() {
        var h = '';
        h += '<button type="button" class="melihelp-nav-item" data-route="home">🏠 INÍCIO</button>';
        h += '<details class="melihelp-nav-group melihelp-nav-hub-root" id="melihelp-nav-cracha-root"><summary class="melihelp-nav-summary melihelp-nav-summary-root"><span class="melihelp-nav-summary-inner"><span class="melihelp-nav-emoji" aria-hidden="true">🪪</span>CRACHÁS</span></summary><div class="melihelp-nav-nested">';
        h += '<button type="button" class="melihelp-nav-item" data-route="certificados">🖥️ PAINEL</button>';
        h +=
            '<div class="melihelp-nav-cadastro-row">' +
            '<button type="button" class="melihelp-nav-item melihelp-nav-item--cadastro-main" data-route="certificados/cadastrar">➕ CADASTRAR CRACHÁ</button>' +
            '<button type="button" class="melihelp-nav-branch-toggle" id="melihelp-nav-toggle-cadastro-historico" aria-expanded="false" aria-controls="melihelp-nav-cadastro-historico" title="Mostrar ou ocultar histórico por mês" aria-label="Mostrar ou ocultar histórico por mês"></button>' +
            '</div>' +
            '<div class="melihelp-nav-cracha-historico-block melihelp-nav-historico-panel--collapsed" id="melihelp-nav-cadastro-historico" role="group" aria-label="Unidades e histórico por mês">';
        CRACHA_UNIDADES_CADASTRO.forEach(function (u) {
            var uid = escAttr(u.id);
            h += '<div class="melihelp-nav-cracha-unidade-block">';
            h +=
                '<div class="melihelp-nav-cadastro-row melihelp-nav-unidade-cadastro-row">' +
                '<button type="button" class="melihelp-nav-item melihelp-nav-item--unidade-main" data-route="certificados/unidade/' +
                uid +
                '">' +
                esc(u.label) +
                '</button>' +
                '<button type="button" class="melihelp-nav-branch-toggle melihelp-nav-branch-toggle--unidade" id="melihelp-nav-toggle-unidade-' +
                uid +
                '" aria-expanded="false" aria-controls="melihelp-nav-panel-unidade-' +
                uid +
                '" title="Mostrar ou ocultar histórico da unidade" aria-label="Mostrar ou ocultar histórico da unidade ' +
                escAttr(u.label) +
                '"></button>' +
                '</div>';
            h +=
                '<div class="melihelp-nav-unidade-historico-panel melihelp-nav-historico-panel--collapsed" id="melihelp-nav-panel-unidade-' +
                uid +
                '" role="group" aria-label="Histórico ' +
                escAttr(u.label) +
                '">' +
                '<details class="melihelp-nav-group melihelp-nav-months-wrap melihelp-nav-historico-under-unidade">' +
                '<summary class="melihelp-nav-summary">HISTÓRICO</summary>' +
                '<div class="melihelp-nav-nested">';
            CRACHA_ANOS_MENU.forEach(function (y) {
                h += '<details class="melihelp-nav-group"><summary class="melihelp-nav-summary">' + esc(y) + '</summary><div class="melihelp-nav-nested">';
                MESES.forEach(function (m) {
                    h += '<button type="button" class="melihelp-nav-item" data-route="certificados/' + y + '/' + m.id + '">' + esc(m.label) + '</button>';
                });
                h += '</div></details>';
            });
            h += '</div></details></div></div>';
        });
        h += '</div>';
        h += '<button type="button" class="melihelp-nav-item" data-route="certificados/desativados">📂 CRACHÁS DESATIVADOS</button>';
        h += '<button type="button" class="melihelp-nav-item" data-route="emissao-cracha">✏️ EMISSÃO DE CRACHÁ</button>';
        h += '</div></details>';

        h += '<details class="melihelp-nav-group melihelp-nav-hub-root" id="melihelp-nav-cordao-root"><summary class="melihelp-nav-summary melihelp-nav-summary-root" id="melihelp-nav-summary-cordao" role="button" tabindex="0"><span class="melihelp-nav-summary-inner"><span class="melihelp-nav-emoji" aria-hidden="true">🎗️</span>CORDÃO</span></summary><div class="melihelp-nav-nested">';
        h += '<button type="button" class="melihelp-nav-item" data-route="cordao">🖥️ PAINEL</button>';
        h += '<details class="melihelp-nav-group melihelp-nav-months-wrap"><summary class="melihelp-nav-summary">RETIRADAS</summary><div class="melihelp-nav-nested">';
        ['2026', '2025'].forEach(function (y) {
            h += '<details class="melihelp-nav-group"><summary class="melihelp-nav-summary">' + esc(y) + '</summary><div class="melihelp-nav-nested">';
            MESES.forEach(function (m) {
                h += '<button type="button" class="melihelp-nav-item" data-route="cordao/' + y + '/' + m.id + '">' + esc(m.label) + '</button>';
            });
            h += '</div></details>';
        });
        h += '</div></details>';
        h += '<details class="melihelp-nav-group melihelp-nav-months-wrap"><summary class="melihelp-nav-summary">RECEBIMENTO</summary><div class="melihelp-nav-nested">';
        ['2026', '2025'].forEach(function (y) {
            h += '<details class="melihelp-nav-group"><summary class="melihelp-nav-summary">' + esc(y) + '</summary><div class="melihelp-nav-nested">';
            MESES.forEach(function (m) {
                h += '<button type="button" class="melihelp-nav-item" data-route="cordao/recebimento/' + y + '/' + m.id + '">' + esc(m.label) + '</button>';
            });
            h += '</div></details>';
        });
        h += '</div></details>';
        h += '</div></details>';

        h += '<details class="melihelp-nav-group melihelp-nav-hub-root" id="melihelp-nav-atas-root"><summary class="melihelp-nav-summary melihelp-nav-summary-root"><span class="melihelp-nav-summary-inner"><span class="melihelp-nav-emoji" aria-hidden="true">💳</span>CARTÃO AVULSO</span></summary><div class="melihelp-nav-nested">';
        h += '<button type="button" class="melihelp-nav-item" data-route="atas">🖥️ PAINEL</button>';
        h +=
            '<div class="melihelp-nav-cadastro-row">' +
            '<button type="button" class="melihelp-nav-item melihelp-nav-item--cadastro-main" data-route="atas/cadastrar">➕ CADASTRAR CARTÃO</button>' +
            '</div>';
        h += '<details class="melihelp-nav-group melihelp-nav-months-wrap"><summary class="melihelp-nav-summary">MESES POR ANO</summary><div class="melihelp-nav-nested">';
        h += '<details class="melihelp-nav-group"><summary class="melihelp-nav-summary">2026</summary><div class="melihelp-nav-nested">';
        MESES.forEach(function (m) {
            h += '<button type="button" class="melihelp-nav-item" data-route="atas/2026/' + m.id + '">' + esc(m.label) + '</button>';
        });
        h += '</div></details>';
        h += '</div></details>';
        h += '</div></details>';

        h += '<button type="button" class="melihelp-nav-item" data-route="lixeira">🗑️ LIXEIRA</button>';
        h += '<a href="../index.html?axis_voltar=1#page-home" class="melihelp-nav-item melihelp-nav-back-home" id="melihelp-nav-back-home">VOLTAR AO INÍCIO</a>';

        return h;
    }

    /** Nome em exibição do utilizador AXIS (mesma origem que a home principal). */
    function getAxisMelihelpUserDisplayName() {
        try {
            var raw = (localStorage.getItem('current_user') || '').trim();
            if (raw) return raw;
            return 'técnico';
        } catch (e) {
            return 'técnico';
        }
    }

    function highlightNav(route) {
        var root = $('melihelp-nav-root');
        if (!root) return;
        root.querySelectorAll('.melihelp-nav-item').forEach(function (btn) {
            var r = btn.getAttribute('data-route') || '';
            var active = false;
            if (route.type === 'home' && r === 'home') active = true;
            if (route.type === 'dash_certificados' && r === 'certificados') active = true;
            if (route.type === 'certificados_cadastrar' && r === 'certificados/cadastrar') active = true;
            if (route.type === 'certificados_unidade_wip' && r === 'certificados/unidade/' + route.unidade) active = true;
            if (route.type === 'certificados_all_desativados' && r === 'certificados/desativados') active = true;
            if (route.type === 'emissao_cracha' && r === 'emissao-cracha') active = true;
            if (route.type === 'certificados_month' && r === 'certificados/' + route.year + '/' + route.month) active = true;
            if (route.type === 'dash_cordao' && r === 'cordao') active = true;
            if (route.type === 'cordao_retiradas' && r === 'cordao/' + route.year + '/' + route.month) active = true;
            if (route.type === 'cordao_recebimento' && r === 'cordao/recebimento/' + route.year + '/' + route.month) active = true;
            if (route.type === 'dash_orcamentos' && r === 'orcamentos') active = true;
            if (route.type === 'dash_atas' && r === 'atas') active = true;
            if (route.type === 'atas_cadastrar_cartao' && r === 'atas/cadastrar') active = true;
            if (route.type === 'docs' && route.category === 'orcamentos' && r === 'orcamentos/' + route.year + '/' + route.month) active = true;
            if (route.type === 'docs' && route.category === 'atas' && r === 'atas/' + route.year + '/' + route.month) active = true;
            if (route.type === 'docs_trash' && r === 'lixeira') active = true;
            btn.classList.toggle('is-active', active);
        });
        var cordRoot = $('melihelp-nav-cordao-root');
        if (cordRoot) {
            cordRoot.classList.toggle(
                'melihelp-nav-hub--route-active',
                route.type === 'dash_cordao' || route.type === 'cordao_retiradas' || route.type === 'cordao_recebimento'
            );
        }
        var crachaRoot = $('melihelp-nav-cracha-root');
        if (crachaRoot) {
            crachaRoot.classList.toggle(
                'melihelp-nav-hub--route-active',
                route.type === 'dash_certificados' ||
                    route.type === 'certificados_cadastrar' ||
                    route.type === 'certificados_unidade_wip' ||
                    route.type === 'certificados_all_desativados' ||
                    route.type === 'emissao_cracha' ||
                    route.type === 'certificados_month'
            );
        }
        var atasRoot = $('melihelp-nav-atas-root');
        if (atasRoot) {
            atasRoot.classList.toggle(
                'melihelp-nav-hub--route-active',
                route.type === 'dash_atas' ||
                    route.type === 'atas_cadastrar_cartao' ||
                    (route.type === 'docs' && route.category === 'atas')
            );
        }
    }

    function renderHome() {
        var main = $('melihelp-main');
        var userName = esc(getAxisMelihelpUserDisplayName());

        main.innerHTML =
            '<section class="melihelp-hero glass-panel">' +
            '<h2>Olá, ' + userName + ' 👋</h2>' +
            '<p class="melihelp-hero-lead">Crachás, cordões e cartões avulsos, organizados para você não perder tempo procurando.</p>' +
            '</section>' +

            '<section class="melihelp-home-shortcuts glass-panel" aria-label="Acesso rápido">' +
            '<h3 class="melihelp-home-section-title">ACESSO RÁPIDO</h3>' +
            '<div class="melihelp-quick-grid melihelp-home-quick-grid">' +
            '<button type="button" class="melihelp-quick-card melihelp-home-card" data-route="certificados">' +
            '<span class="emoji" aria-hidden="true">🪪</span>' +
            '<span class="melihelp-home-card-title">CRACHÁS</span>' +
            '<span class="melihelp-home-card-desc">Painel e PDFs por mês (2026, 2025 e 2024)</span></button>' +
            '<button type="button" class="melihelp-quick-card melihelp-home-card" data-route="emissao-cracha">' +
            '<span class="emoji" aria-hidden="true">✏️</span>' +
            '<span class="melihelp-home-card-title">EMISSÃO DE CRACHÁ</span>' +
            '<span class="melihelp-home-card-desc">Editor frente e verso, impressão</span></button>' +
            '<button type="button" class="melihelp-quick-card melihelp-home-card" data-route="cordao">' +
            '<span class="emoji" aria-hidden="true">🎗️</span>' +
            '<span class="melihelp-home-card-title">CORDÃO</span>' +
            '<span class="melihelp-home-card-desc">Retiradas, recebimento e totais</span></button>' +
            '<button type="button" class="melihelp-quick-card melihelp-home-card" data-route="atas">' +
            '<span class="emoji" aria-hidden="true">💳</span>' +
            '<span class="melihelp-home-card-title">CARTÃO AVULSO</span>' +
            '<span class="melihelp-home-card-desc">Arquivos por mês</span></button>' +
            '<button type="button" class="melihelp-quick-card melihelp-home-card" data-route="lixeira">' +
            '<span class="emoji" aria-hidden="true">🗑️</span>' +
            '<span class="melihelp-home-card-title">LIXEIRA</span>' +
            '<span class="melihelp-home-card-desc">Restaurar ou apagar ficheiros</span></button>' +
            '</div></section>';

        main.querySelectorAll('.melihelp-home-card[data-route]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var r = btn.getAttribute('data-route');
                if (r) setRoute(r);
            });
        });
    }

    function getDocsKeyForRoute(route) {
        if (route.category === 'certificados') return docsStorageKey('certificados');
        if (route.category === 'orcamentos') return docsStorageKey('orcamentos', route.year, route.month);
        if (route.category === 'atas') return docsStorageKey('atas', route.year, route.month);
        return null;
    }

    /** Cartão avulso: registo por número W (2026, todos os meses do menu). */
    var ATAS_AVULSO_W_NAV_YEAR = '2026';
    /** Evita voltar a injetar as 25 linhas de amostra (só janeiro). */
    var ATAS_AVULSO_W_SAMPLE_SEED_FLAG = NS + '_atas_avulso_w_2026_01_sample_seeded_v1';

    function atasAvulsoWStorageKey(year, month) {
        var mi = parseInt(String(month == null ? '' : month).replace(/\D/g, ''), 10);
        var mo =
            !isNaN(mi) && mi >= 1 && mi <= 12
                ? pad2(mi)
                : String(month == null ? '' : month);
        return NS + '_atas_avulso_w_' + String(year) + '_' + mo;
    }

    /** Junta chaves antigas ..._2026_1 .. _9 para ..._01 .. _09 (evita W do servidor “invisível”). */
    function migrateAvulsoWLegacyMonthKeys(year) {
        var y = String(year);
        var d;
        for (d = 1; d <= 9; d++) {
            var badKey = NS + '_atas_avulso_w_' + y + '_' + d;
            var goodKey = atasAvulsoWStorageKey(y, d);
            if (badKey === goodKey) continue;
            try {
                var raw = localStorage.getItem(badKey);
                if (!raw) continue;
                var oldArr = JSON.parse(raw);
                if (!Array.isArray(oldArr) || !oldArr.length) {
                    localStorage.removeItem(badKey);
                    continue;
                }
                var cur = loadJson(goodKey, []);
                if (!Array.isArray(cur)) cur = [];
                var ids = {};
                var i;
                for (i = 0; i < cur.length; i++) {
                    if (cur[i] && cur[i].id) ids[cur[i].id] = true;
                }
                for (i = 0; i < oldArr.length; i++) {
                    var e = oldArr[i];
                    if (e && e.id && !ids[e.id]) {
                        cur.push(e);
                        ids[e.id] = true;
                    }
                }
                saveJson(goodKey, cur);
                localStorage.removeItem(badKey);
            } catch (eM) { /* ignorar */ }
        }
    }
    /** 25 números W de demonstração (mesmo critério de normalização que entradas reais). */
    var ATAS_AVULSO_W_SAMPLE_DISPLAYS = [
        '07306165', '075.22421', '067.63443', '072.88102', '070.44591', '068.90233', '071.55604', '069.77812',
        '074.30198', '076.11245', '073.88901', '075.66734', '067.22390', '072.01456', '070.99821', '068.44500',
        '071.12388', '069.55677', '074.88765', '076.33441', '073.22109', '075.00987', '067.76543', '072.43210',
        '07306165'
    ];

    function isAtasAvulsoWTableRoute(route) {
        if (route.type !== 'docs' || route.category !== 'atas') return false;
        if (String(route.year) !== ATAS_AVULSO_W_NAV_YEAR) return false;
        return MESES.some(function (m) {
            return m.id === String(route.month);
        });
    }

    /** Formata só o número do cartão: após 3 dígitos insere vírgula (ex.: 000 → 000, ao digitar o 4.º). Opcional prefixo W:. */
    function melihelpFormatCadastroWDisplay(raw) {
        var s = String(raw || '');
        var prefix = '';
        var m = s.match(/^(\s*W\s*:\s*)/i);
        if (m) {
            prefix = m[1];
            s = s.slice(m[0].length);
        }
        var digits = s.replace(/[^\d]/g, '');
        if (digits.length > 20) digits = digits.slice(0, 20);
        var body = digits.length <= 3 ? digits : digits.slice(0, 3) + ',' + digits.slice(3);
        return prefix + body;
    }

    function melihelpWInputDigitCountBefore(val, cursor) {
        var n = 0;
        var i;
        var lim = typeof cursor === 'number' ? cursor : val.length;
        for (i = 0; i < lim && i < val.length; i++) {
            if (/\d/.test(val.charAt(i))) n++;
        }
        return n;
    }

    function melihelpWInputCursorAfterFormat(formatted, digitCount) {
        if (digitCount <= 0) return 0;
        var n = 0;
        var i;
        for (i = 0; i < formatted.length; i++) {
            if (/\d/.test(formatted.charAt(i))) {
                n++;
                if (n >= digitCount) return i + 1;
            }
        }
        return formatted.length;
    }

    function applyMelihelpCadastroWInputMask(el) {
        if (!el) return;
        var old = el.value;
        var sel = typeof el.selectionStart === 'number' ? el.selectionStart : old.length;
        var digitBefore = melihelpWInputDigitCountBefore(old, sel);
        var formatted = melihelpFormatCadastroWDisplay(old);
        if (formatted === old) return;
        el.value = formatted;
        var pos = melihelpWInputCursorAfterFormat(formatted, digitBefore);
        try {
            el.setSelectionRange(pos, pos);
        } catch (eIgnore) {}
    }

    function normalizeAtasAvulsoW(raw) {
        var s = String(raw || '').trim();
        s = s.replace(/^\s*W\s*:\s*/i, '');
        s = s.replace(/\s+/g, '');
        s = s.replace(/,/g, '.');
        return s;
    }

    function ensureAtasAvulsoWSampleSeeded() {
        try {
            if (localStorage.getItem(ATAS_AVULSO_W_SAMPLE_SEED_FLAG)) return;
            var sk = atasAvulsoWStorageKey('2026', '01');
            var cur = loadJson(sk, []);
            if (Array.isArray(cur) && cur.length > 0) {
                localStorage.setItem(ATAS_AVULSO_W_SAMPLE_SEED_FLAG, '1');
                return;
            }
            /* Datas dentro de *janeiro* 2026 — a coluna “REGISTADO EM” reflete o mês da pasta (como cordão / Packing). */
            var baseMs = Date.parse('2026-01-15T14:00:00');
            if (isNaN(baseMs)) baseMs = Date.now();
            var seeded = [];
            var i;
            for (i = 0; i < ATAS_AVULSO_W_SAMPLE_DISPLAYS.length; i++) {
                var disp = ATAS_AVULSO_W_SAMPLE_DISPLAYS[i];
                seeded.push({
                    id: 'sample_avulso_w_' + (i < 9 ? '0' : '') + (i + 1),
                    wNorm: normalizeAtasAvulsoW(disp),
                    wDisplay: disp,
                    addedAt: new Date(baseMs - (ATAS_AVULSO_W_SAMPLE_DISPLAYS.length - 1 - i) * 60000).toISOString(),
                    sample: true
                });
            }
            saveJson(sk, seeded);
            localStorage.setItem(ATAS_AVULSO_W_SAMPLE_SEED_FLAG, '1');
        } catch (e) { /* ignorar */ }
    }

    function loadAtasAvulsoWList(year, month) {
        var arr = loadJson(atasAvulsoWStorageKey(year, month), []);
        return Array.isArray(arr) ? arr : [];
    }

    function saveAtasAvulsoWList(year, month, arr) {
        return saveJson(atasAvulsoWStorageKey(year, month), Array.isArray(arr) ? arr : []);
    }

    function melihelpPersistApiBase() {
        var b = '';
        try {
            if (typeof global.getAxisApiBase === 'function') {
                b = global.getAxisApiBase();
            }
        } catch (e0) { /* ignorar */ }
        try {
            if (!b || !/^https?:\/\//i.test(b)) {
                var loc = global.location;
                if (loc && loc.origin && loc.protocol !== 'file:') {
                    b = loc.origin;
                }
            }
            if ((!b || !/^https?:\/\//i.test(b)) && global.location) {
                var h = global.location.hostname || '';
                if (h === 'localhost' || h === '127.0.0.1') {
                    b = 'http://localhost:3006';
                }
            }
        } catch (e1) { /* ignorar */ }
        return String(b || '').replace(/\/+$/, '');
    }

    /** Junta entradas do servidor (ex.: WhatsApp) no localStorage por id. */
    function mergeAtasAvulsoWFromServer(byYearMonth) {
        if (!byYearMonth || typeof byYearMonth !== 'object') return false;
        var any = false;
        var y;
        for (y in byYearMonth) {
            if (!Object.prototype.hasOwnProperty.call(byYearMonth, y)) continue;
            var months = byYearMonth[y];
            if (!months || typeof months !== 'object') continue;
            var moKey;
            for (moKey in months) {
                if (!Object.prototype.hasOwnProperty.call(months, moKey)) continue;
                var remote = months[moKey];
                if (!Array.isArray(remote) || !remote.length) continue;
                var mi = parseInt(String(moKey).replace(/\D/g, ''), 10);
                if (isNaN(mi) || mi < 1 || mi > 12) continue;
                var mo = pad2(mi);
                var local = loadAtasAvulsoWList(y, mo);
                var ids = {};
                var i;
                for (i = 0; i < local.length; i++) {
                    if (local[i] && local[i].id) ids[local[i].id] = true;
                }
                var alt = false;
                for (i = 0; i < remote.length; i++) {
                    var en = remote[i];
                    if (!en || typeof en !== 'object' || !en.id || ids[en.id]) continue;
                    local.push(en);
                    ids[en.id] = true;
                    alt = true;
                }
                if (alt) {
                    saveAtasAvulsoWList(y, mo, local);
                    any = true;
                }
            }
        }
        return any;
    }

    function pullAtasAvulsoWFromServerPromise() {
        var base = melihelpPersistApiBase();
        if (!base) return Promise.resolve({ merged: false });
        return fetch(base + '/api/persist/melihelp-atas-avulso-w', {
            method: 'GET',
            cache: 'no-store',
            credentials: 'same-origin'
        })
            .then(function (r) {
                if (!r || !r.ok) return null;
                return r.json().catch(function () { return null; });
            })
            .catch(function () { return null; })
            .then(function (data) {
                try {
                    if (typeof window !== 'undefined') {
                        window._mhAvulsoWSyncRecent = data && Array.isArray(data.recent) ? data.recent : [];
                    }
                } catch (eRec) { /* ignorar */ }
                if (!data || !data.ok || !data.byYearMonth) return { merged: false };
                var m = mergeAtasAvulsoWFromServer(data.byYearMonth);
                return { merged: Boolean(m) };
            });
    }

    /**
     * Igual Packing Machine (preventivas): GET só do mês visível, junta ao localStorage por id.
     * Garante que o WhatsApp aparece na “planilha” mesmo se o merge global falhar.
     */
    function syncAvulsoWMonthFromServerPromise(viewYear, viewMonth) {
        var base = melihelpPersistApiBase();
        if (!base) return Promise.resolve(0);
        var y = String(viewYear);
        var mi = parseInt(String(viewMonth).replace(/\D/g, ''), 10);
        if (isNaN(mi) || mi < 1 || mi > 12) return Promise.resolve(0);
        var mo = pad2(mi);
        var url =
            base +
            '/api/melihelp/atas-avulso-w/list?year=' +
            encodeURIComponent(y) +
            '&month=' +
            encodeURIComponent(mo);
        return fetch(url, { method: 'GET', cache: 'no-store', credentials: 'same-origin' })
            .then(function (r) {
                if (!r || !r.ok) return null;
                return r.json().catch(function () { return null; });
            })
            .catch(function () { return null; })
            .then(function (data) {
                if (!data || !data.ok || !Array.isArray(data.entries)) return 0;
                var entries = data.entries;
                if (!entries.length) return 0;
                var local = loadAtasAvulsoWList(y, mo);
                var ids = {};
                var i;
                for (i = 0; i < local.length; i++) {
                    if (local[i] && local[i].id) ids[local[i].id] = true;
                }
                var added = 0;
                for (i = 0; i < entries.length; i++) {
                    var en = entries[i];
                    if (!en || typeof en !== 'object' || !en.id || ids[en.id]) continue;
                    local.push(en);
                    ids[en.id] = true;
                    added++;
                }
                if (added > 0 && !saveAtasAvulsoWList(y, mo, local)) return 0;
                return added;
            });
    }

    /** Aviso: último W no servidor está noutro mês que o ecrã atual (ex.: WhatsApp em fev., vista em jan.). */
    function buildAvulsoMismatchBannerHtml(viewY, viewMo, viewMonthPt) {
        var rec = [];
        try {
            if (typeof window !== 'undefined' && Array.isArray(window._mhAvulsoWSyncRecent)) {
                rec = window._mhAvulsoWSyncRecent;
            }
        } catch (e0) { rec = []; }
        if (!rec.length) return '';
        var top = rec[0];
        if (!top || !top.year) return '';
        var vy = String(viewY);
        var vm = pad2(parseInt(String(viewMo).replace(/\D/g, ''), 10));
        if (isNaN(parseInt(String(viewMo).replace(/\D/g, ''), 10))) vm = String(viewMo);
        var ry = String(top.year);
        var rm = pad2(parseInt(String(top.month).replace(/\D/g, ''), 10));
        if (ry === vy && rm === vm) return '';
        var ml = monthLabel(rm);
        var route = 'atas/' + ry + '/' + rm;
        return (
            '<div class="melihelp-avulso-w-sync-alert glass-panel" role="status">' +
            '<p class="melihelp-avulso-w-sync-alert-title">Último W no servidor está em outro mês</p>' +
            '<p class="melihelp-avulso-w-sync-alert-body">O registo mais recente (ex.: WhatsApp) é <strong>' +
            esc(String(top.wDisplay || top.wNorm || '')) +
            '</strong> em <strong>' +
            esc(ml) +
            ' de ' +
            esc(ry) +
            '</strong>. Neste ecrã está <strong>' +
            esc(viewMonthPt) +
            '</strong> — por isso esse número <strong>não aparece aqui</strong>.</p>' +
            '<button type="button" class="melihelp-btn melihelp-btn-primary melihelp-btn-text-upper melihelp-avulso-w-sync-open" data-mh-route="' +
            escAttr(route) +
            '">Abrir ' +
            esc(ml) +
            ' de ' +
            esc(ry) +
            '</button></div>'
        );
    }

    function pushAtasAvulsoWPutToServer(y, mo, entry) {
        var base = melihelpPersistApiBase();
        if (!base || !entry || !entry.id) return;
        fetch(base + '/api/persist/melihelp-atas-avulso-w', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                op: 'put',
                year: String(y),
                month: String(mo),
                entry: {
                    id: entry.id,
                    wNorm: entry.wNorm,
                    wDisplay: entry.wDisplay,
                    addedAt: entry.addedAt,
                    source: entry.source || 'melihelp_site'
                }
            })
        }).catch(function () {});
    }

    /** Inclui um W no mês indicado (mesmo critério que CADASTRAR CARTÃO). */
    function addAtasAvulsoWEntry(yearStr, monthStr, rawW) {
        var norm = normalizeAtasAvulsoW(rawW);
        if (!norm) return false;
        var y = String(yearStr || '').trim();
        if (!/^\d{4}$/.test(y)) return false;
        var mi = parseInt(String(monthStr).replace(/\D/g, ''), 10);
        if (isNaN(mi) || mi < 1 || mi > 12) return false;
        var mo = pad2(mi);
        var cur = loadAtasAvulsoWList(y, mo);
        var disp = String(rawW || '').replace(/^\s*W\s*:\s*/i, '').trim() || norm;
        var entry = {
            id: String(Date.now()) + '_' + Math.random().toString(36).slice(2, 9),
            wNorm: norm,
            wDisplay: disp,
            addedAt: cordaoStampForViewedMonth(y, mo)
        };
        cur.push(entry);
        if (!saveAtasAvulsoWList(y, mo, cur)) return false;
        pushAtasAvulsoWPutToServer(y, mo, entry);
        return true;
    }

    function sortAtasAvulsoWList(list) {
        return list.slice().sort(function (a, b) {
            var ta = String(a.addedAt || '');
            var tb = String(b.addedAt || '');
            if (ta !== tb) return ta.localeCompare(tb);
            return String(a.id || '').localeCompare(String(b.id || ''));
        });
    }

    function wStatusForRowIndex(sortedList, index) {
        var w = sortedList[index] && sortedList[index].wNorm;
        if (!w) return '—';
        var i;
        for (i = 0; i < index; i++) {
            if (sortedList[i].wNorm === w) return 'Repetido';
        }
        return 'Único';
    }

    function atasAvulsoWFilterRows(sortedAll, mode, queryLower) {
        var q = (queryLower || '').trim();
        var out = [];
        var idx;
        for (idx = 0; idx < sortedAll.length; idx++) {
            var row = sortedAll[idx];
            var st = wStatusForRowIndex(sortedAll, idx);
            if (mode === 'unico' && st !== 'Único') continue;
            if (mode === 'repetido' && st !== 'Repetido') continue;
            if (q) {
                var disp = String(row.wDisplay || row.wNorm || '').toLowerCase();
                var norm = String(row.wNorm || '').toLowerCase();
                if (disp.indexOf(q) === -1 && norm.indexOf(q) === -1) continue;
            }
            out.push({ row: row, status: st });
        }
        return out;
    }

    function atasAvulsoWRowsHtmlFromFiltered(filtered) {
        if (!filtered.length) {
            return '<tr class="melihelp-avulso-w-empty-row"><td colspan="5">' +
                '<div class="melihelp-empty melihelp-avulso-w-empty"><span class="big">📇</span>' +
                'Nenhum registo corresponde ao filtro ou à pesquisa.</div></td></tr>';
        }
        return filtered.map(function (item, n) {
            var row = item.row;
            var st = item.status;
            var stClass = st === 'Repetido' ? ' melihelp-avulso-w-status--dup' : ' melihelp-avulso-w-status--ok';
            return '<tr data-id="' + escAttr(String(row.id)) + '">' +
                '<td class="melihelp-avulso-w-col-num">' + (n + 1) + '</td>' +
                '<td><strong>' + esc(row.wDisplay || row.wNorm || '—') + '</strong></td>' +
                '<td class="melihelp-avulso-w-col-status' + stClass + '">' + esc(st) + '</td>' +
                '<td class="melihelp-avulso-w-col-date">' + esc(formatDate(row.addedAt)) + '</td>' +
                '<td class="melihelp-avulso-w-col-actions">' +
                '<button type="button" class="melihelp-btn melihelp-btn-danger melihelp-btn-text-upper melihelp-avulso-w-remove" data-id="' + escAttr(String(row.id)) + '">REMOVER</button>' +
                '</td></tr>';
        }).join('');
    }

    function renderDocsAtasAvulsoW(route) {
        var y = String(route.year);
        var mo = String(route.month);
        migrateAvulsoWLegacyMonthKeys(y);
        if (y === '2026' && mo === '01') {
            ensureAtasAvulsoWSampleSeeded();
        }
        repairAvulsoWSampleRowsCalendarMonth(y, mo);
        pendingUploadTarget = null;
        var main = $('melihelp-main');
        var title = breadcrumb(route);
        var monthPt = monthLabel(mo);
        var syncBannerHtml = buildAvulsoMismatchBannerHtml(y, mo, monthPt);

        main.innerHTML =
            '<section class="melihelp-panel glass-panel melihelp-panel-month-folder melihelp-avulso-w-panel">' +
            '<div class="melihelp-panel-head">' +
            '<h2>' + esc(title) + '</h2></div>' +
            syncBannerHtml +
            '<p class="melihelp-avulso-w-lead">Números <strong>W</strong> de <strong>' + esc(monthPt) + '</strong> · ' + esc(y) +
            '. Para <strong>incluir</strong> novos W, use <strong>➕ CADASTRAR CARTÃO</strong> no menu ou o <strong>WhatsApp</strong> (MeliHelp → 5). ' +
            'Como na *Packing Machine* (preventivas), esta tabela *puxa o mês do servidor* ao abrir e a cada poucos segundos — incluindo registos do *WhatsApp*. Rolagem invisível (como em CRACHÁS).</p>' +
            '<div class="melihelp-avulso-w-toolbar melihelp-avulso-w-toolbar--monthly">' +
            '<input type="search" id="melihelp-avulso-w-search" class="melihelp-avulso-w-search" ' +
            'placeholder="Pesquisar…" maxlength="80" autocomplete="off" aria-label="Pesquisar número W" />' +
            '<div class="mh-ucs-filter-dropdown" id="melihelp-avulso-w-filtro-wrap">' +
            '<button type="button" class="mh-ucs-btn-filter" id="melihelp-avulso-w-filtro-trigger" ' +
            'aria-expanded="false" aria-haspopup="dialog" aria-controls="melihelp-avulso-w-filtro-panel">' +
            'Filtrar' +
            '<span class="mh-ucs-filter-arrow" aria-hidden="true">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>' +
            '</span></button>' +
            '<div class="mh-ucs-filter-panel" id="melihelp-avulso-w-filtro-panel" role="dialog" aria-label="Filtros">' +
            '<div class="mh-ucs-filter-panel-header">' +
            '<span class="mh-ucs-filter-panel-title">Filtros</span>' +
            '<button type="button" class="mh-ucs-filter-panel-close" id="melihelp-avulso-w-filtro-close" aria-label="Fechar">&times;</button>' +
            '</div>' +
            '<div class="mh-ucs-filter-panel-body">' +
            '<label class="mh-ucs-filter-label" for="melihelp-avulso-w-filtro-status">STATUS</label>' +
            '<select id="melihelp-avulso-w-filtro-status" class="mh-ucs-filter-select" aria-label="Filtrar por STATUS">' +
            '<option value="all">Todos</option>' +
            '<option value="unico">Único</option>' +
            '<option value="repetido">Repetido</option>' +
            '</select>' +
            '<div class="mh-ucs-filter-panel-actions">' +
            '<button type="button" class="mh-ucs-filter-btn-aplicar" id="melihelp-avulso-w-filtro-aplicar">Aplicar</button>' +
            '<button type="button" class="mh-ucs-filter-btn-limpar" id="melihelp-avulso-w-filtro-limpar">Limpar</button>' +
            '</div></div></div></div></div>' +
            '<div class="melihelp-avulso-w-table-wrap melihelp-avulso-w-table-scroll" aria-label="Lista de números W">' +
            '<table class="melihelp-avulso-w-table">' +
            '<thead><tr>' +
            '<th scope="col">#</th>' +
            '<th scope="col">NÚMERO W</th>' +
            '<th scope="col">STATUS</th>' +
            '<th scope="col" title="Data alinhada ao mês desta pasta (1–12), como no cordão e no servidor WhatsApp">REGISTADO EM</th>' +
            '<th scope="col">AÇÕES</th>' +
            '</tr></thead><tbody id="melihelp-avulso-w-tbody"></tbody></table></div>' +
            '</section>';

        var tbody = main.querySelector('#melihelp-avulso-w-tbody');
        var searchEl = main.querySelector('#melihelp-avulso-w-search');
        var filtroWrap = main.querySelector('#melihelp-avulso-w-filtro-wrap');
        var filtroTrigger = main.querySelector('#melihelp-avulso-w-filtro-trigger');
        var filtroPanel = main.querySelector('#melihelp-avulso-w-filtro-panel');
        var filtroStatus = main.querySelector('#melihelp-avulso-w-filtro-status');
        var filtroAplicar = main.querySelector('#melihelp-avulso-w-filtro-aplicar');
        var filtroLimpar = main.querySelector('#melihelp-avulso-w-filtro-limpar');
        var filtroClose = main.querySelector('#melihelp-avulso-w-filtro-close');
        var filterMode = 'all';
        var filtroDocDown = null;
        var filtroDocKey = null;

        function closeFiltroPanel() {
            if (!filtroTrigger || !filtroWrap) return;
            filtroTrigger.setAttribute('aria-expanded', 'false');
            filtroWrap.classList.remove('is-open');
            if (filtroDocDown) {
                document.removeEventListener('mousedown', filtroDocDown, true);
                filtroDocDown = null;
            }
            if (filtroDocKey) {
                document.removeEventListener('keydown', filtroDocKey, true);
                filtroDocKey = null;
            }
        }

        function openFiltroPanel() {
            if (!filtroPanel || !filtroTrigger || !filtroWrap) return;
            if (filtroStatus) filtroStatus.value = filterMode || 'all';
            filtroTrigger.setAttribute('aria-expanded', 'true');
            filtroWrap.classList.add('is-open');
            filtroDocDown = function (ev) {
                var t = ev.target;
                if (filtroWrap.contains(t)) return;
                closeFiltroPanel();
            };
            filtroDocKey = function (ev) {
                if (ev.key === 'Escape') {
                    closeFiltroPanel();
                    try { filtroTrigger.focus(); } catch (e2) { /* ignorar */ }
                }
            };
            document.addEventListener('mousedown', filtroDocDown, true);
            document.addEventListener('keydown', filtroDocKey, true);
        }

        function toggleFiltroPanel() {
            if (!filtroWrap) return;
            if (filtroWrap.classList.contains('is-open')) closeFiltroPanel();
            else openFiltroPanel();
        }

        function rebuildTbody() {
            if (!tbody) return;
            var sorted = sortAtasAvulsoWList(loadAtasAvulsoWList(y, mo));
            var mode = filterMode || 'all';
            var q = searchEl ? String(searchEl.value || '').toLowerCase() : '';
            var filtered = atasAvulsoWFilterRows(sorted, mode, q);
            tbody.innerHTML = sorted.length
                ? atasAvulsoWRowsHtmlFromFiltered(filtered)
                : '<tr class="melihelp-avulso-w-empty-row"><td colspan="5">' +
                    '<div class="melihelp-empty melihelp-avulso-w-empty"><span class="big">📇</span>' +
                    'Nenhum número W neste mês. Use <strong>CADASTRAR CARTÃO</strong> no menu.</div></td></tr>';
        }

        var btnSyncOpen = main.querySelector('.melihelp-avulso-w-sync-open');
        if (btnSyncOpen) {
            btnSyncOpen.addEventListener('click', function () {
                var rt = btnSyncOpen.getAttribute('data-mh-route');
                if (rt) setRoute(rt);
            });
        }

        if (searchEl) searchEl.addEventListener('input', rebuildTbody);
        if (filtroTrigger) {
            filtroTrigger.addEventListener('click', function (e) {
                e.stopPropagation();
                toggleFiltroPanel();
            });
        }
        if (filtroClose) {
            filtroClose.addEventListener('click', function (e) {
                e.stopPropagation();
                closeFiltroPanel();
                try { filtroTrigger.focus(); } catch (e4) { /* ignorar */ }
            });
        }
        if (filtroAplicar) {
            filtroAplicar.addEventListener('click', function (e) {
                e.stopPropagation();
                filterMode = (filtroStatus && filtroStatus.value) || 'all';
                rebuildTbody();
                closeFiltroPanel();
                try { filtroTrigger.focus(); } catch (e5) { /* ignorar */ }
            });
        }
        if (filtroLimpar) {
            filtroLimpar.addEventListener('click', function (e) {
                e.stopPropagation();
                filterMode = 'all';
                if (filtroStatus) filtroStatus.value = 'all';
                rebuildTbody();
                closeFiltroPanel();
                try { filtroTrigger.focus(); } catch (e6) { /* ignorar */ }
            });
        }

        if (tbody) {
            tbody.addEventListener('click', function (e) {
                var btn = e.target && e.target.closest && e.target.closest('.melihelp-avulso-w-remove');
                if (!btn) return;
                var id = btn.getAttribute('data-id');
                if (!id) return;
                var cur = loadAtasAvulsoWList(y, mo).filter(function (r) { return String(r.id) !== String(id); });
                if (!saveAtasAvulsoWList(y, mo, cur)) return;
                showToast('Cartão removido.', 'remove');
                rebuildTbody();
            });
        }

        rebuildTbody();

        Promise.all([
            syncAvulsoWMonthFromServerPromise(y, mo),
            pullAtasAvulsoWFromServerPromise()
        ]).then(function (rets) {
            var nMonth = rets[0] || 0;
            var res = rets[1];
            if (y === '2026' && mo === '01') {
                ensureAtasAvulsoWSampleSeeded();
            }
            rebuildTbody();
            try {
                if ((nMonth > 0 || (res && res.merged)) && typeof showToast === 'function') {
                    showToast('Sincronizado com o servidor (WhatsApp / outro PC).');
                }
            } catch (eT) { /* ignorar */ }
        });

        try {
            if (typeof window !== 'undefined') {
                window._mhAvulsoWPollId = setInterval(function () {
                    Promise.all([
                        syncAvulsoWMonthFromServerPromise(y, mo),
                        pullAtasAvulsoWFromServerPromise()
                    ]).then(function (rets) {
                        var nMonth = rets[0] || 0;
                        var res = rets[1];
                        if (nMonth > 0 || (res && res.merged)) rebuildTbody();
                    });
                }, 15000);
            }
        } catch (ePoll) { /* ignorar */ }
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
    function revokeMelihelpPreviewBlob() {
        if (window._melihelpPreviewBlobUrl) {
            try { URL.revokeObjectURL(window._melihelpPreviewBlobUrl); } catch (e) {}
            window._melihelpPreviewBlobUrl = null;
        }
    }

    function openDocPreview(dataUrl, fileName, mime) {
        var backdrop = $('melihelp-doc-preview');
        var iframe = $('melihelp-doc-preview-iframe');
        var img = $('melihelp-doc-preview-img');
        var fallback = $('melihelp-doc-preview-fallback');
        if (!backdrop || !iframe || !img || !fallback) return;
        revokeMelihelpPreviewBlob();
        $('melihelp-doc-preview-title').textContent = fileName || 'Documento';
        iframe.hidden = true;
        img.hidden = true;
        fallback.hidden = true;
        iframe.removeAttribute('src');
        iframe.removeAttribute('sandbox');
        img.removeAttribute('src');
        if (dataUrl && isPdfMime(mime, fileName)) {
            var blob = dataUrlToBlob(dataUrl);
            if (blob && blob.size > 0) {
                window._melihelpPreviewBlobUrl = URL.createObjectURL(blob);
                iframe.src = window._melihelpPreviewBlobUrl;
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
            fallback.textContent = 'Pré-visualização disponível para PDF e imagens. Use BAIXAR ou EDITAR o nome na lista.';
        }
        backdrop.hidden = false;
    }

    function closeDocPreview() {
        var backdrop = $('melihelp-doc-preview');
        var iframe = $('melihelp-doc-preview-iframe');
        var img = $('melihelp-doc-preview-img');
        revokeMelihelpPreviewBlob();
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

    function isRenameDocModalOpen() {
        var bd = $('melihelp-rename-doc-backdrop');
        return !!(bd && !bd.hidden);
    }

    function closeRenameDocModal() {
        var bd = $('melihelp-rename-doc-backdrop');
        var inp = $('melihelp-rename-doc-input');
        renameDocModalState = null;
        if (inp) inp.value = '';
        if (bd) bd.hidden = true;
    }

    function renameDocModalHintForRoute(route) {
        if (route.type === 'certificados_all_desativados') {
            return 'NESTA PÁGINA VOCÊ VÊ TODOS OS CRACHÁS DESATIVADOS (TODOS OS MESES). O NOME ABAIXO É O TÍTULO NA LISTA; AO REATIVAR, O MESMO NOME VOLTA NA LISTA ATIVA DO MÊS DE ORIGEM. MANTENHA A EXTENSÃO (.PDF, .PNG, ETC.).';
        }
        if (route.type === 'certificados_month') {
            return 'NESTA PÁGINA VOCÊ VÊ OS CRACHÁS ATIVOS DO MÊS. O NOME ABAIXO É O QUE APARECE NESTA LISTA, AO LADO DE CADA ARQUIVO; USE UM TEXTO CLARO PARA ACHAR O PDF CERTO. MANTENHA A EXTENSÃO (.PDF, .PNG, ETC.) PARA O DOWNLOAD CONTINUAR CORRETO.';
        }
        return 'O NOME ABAIXO É O TÍTULO DO ARQUIVO NA LISTA DE CRACHÁS DESTA ÁREA DO MELIHELP. EDITE PARA SUA ORGANIZAÇÃO. MANTENHA A EXTENSÃO DO FICHEIRO.';
    }

    function openRenameDocModal(storageKey, docId, currentName) {
        var bd = $('melihelp-rename-doc-backdrop');
        var inp = $('melihelp-rename-doc-input');
        var hintEl = $('melihelp-rename-doc-hint');
        if (!bd || !inp) return;
        if (hintEl) hintEl.textContent = renameDocModalHintForRoute(parseRoute());
        renameDocModalState = { key: storageKey, docId: String(docId) };
        inp.value = currentName || '';
        bd.hidden = false;
        setTimeout(function () {
            inp.focus();
            try { inp.select(); } catch (e) {}
        }, 10);
    }

    function submitRenameDocModal() {
        if (!renameDocModalState) return;
        var inp = $('melihelp-rename-doc-input');
        var nn = (inp && inp.value || '').trim();
        if (!nn) {
            showToast('Nome inválido.');
            return;
        }
        var cur = loadDocs(renameDocModalState.key);
        var item = cur.find(function (x) { return String(x.id) === String(renameDocModalState.docId); });
        if (!item) {
            closeRenameDocModal();
            return;
        }
        item.name = nn;
        var rk = renameDocModalState.key;
        saveDocsAsync(rk, cur).then(function (ok) {
            if (!ok) {
                showToast('Não foi possível guardar (armazenamento cheio ou indisponível).');
            } else {
                showToast('Nome atualizado.');
            }
            closeRenameDocModal();
            render();
        });
    }

    function renderDocs(route) {
        if (isAtasAvulsoWTableRoute(route)) {
            renderDocsAtasAvulsoW(route);
            return;
        }
        var key = getDocsKeyForRoute(route);
        var list = loadDocs(key);
        var main = $('melihelp-main');
        var title = breadcrumb(route);
        var panelMonthClass = (route.category === 'orcamentos' || route.category === 'atas')
            ? ' melihelp-panel-month-folder'
            : '';

        var itemsHtml = list.length
            ? list.map(function (item) {
                var canPreview = !!(item.dataUrl && (isPdfMime(item.mime, item.name) || isImageMime(item.mime)));
                return '<li class="melihelp-doc-item">' +
                    '<div><strong>' + esc(item.name) + '</strong>' +
                    '<div class="melihelp-doc-meta">' + esc(formatDate(item.addedAt)) + ' · ' + esc(formatBytes(item.size || 0)) +
                    (item.mime ? ' · ' + esc(item.mime) : '') + '</div></div>' +
                    '<div class="melihelp-toolbar melihelp-doc-toolbar">' +
                    (item.dataUrl
                        ? (canPreview
                            ? '<button type="button" class="melihelp-btn melihelp-btn-ghost melihelp-btn-icon-only melihelp-preview-doc" data-id="' + esc(item.id) + '" title="Visualizar" aria-label="Visualizar"><i class="fas fa-eye"></i></button>'
                            : '') +
                          '<a class="melihelp-btn melihelp-btn-ghost melihelp-btn-download melihelp-btn-text-upper" href="' + esc(item.dataUrl) + '" download="' + escAttr(item.name) + '">BAIXAR</a>' +
                          '<button type="button" class="melihelp-btn melihelp-btn-ghost melihelp-btn-text-upper melihelp-open-data" data-id="' + esc(item.id) + '">ABRIR</button>'
                        : '') +
                    '<button type="button" class="melihelp-btn melihelp-btn-danger melihelp-btn-text-upper melihelp-remove-doc" data-id="' + esc(item.id) + '">REMOVER</button>' +
                    '</div></li>';
            }).join('')
            : '<div class="melihelp-empty"><span class="big">📂</span>Nenhum arquivo nesta pasta.<br>Use <strong>ADICIONAR ARQUIVOS</strong> para guardar PDFs, imagens (HD/4K), vídeos ou outros ficheiros — até ~' +
                Math.round(MAX_FILE_BYTES / (1024 * 1024)) +
                ' MB por arquivo. O limite real é o espaço que <strong>este navegador</strong> permite (armazenamento local, não o servidor).</div>';

        main.innerHTML =
            '<section class="melihelp-panel glass-panel' + panelMonthClass + '">' +
            '<div class="melihelp-panel-head">' +
            '<h2>' + esc(title) + '</h2>' +
            '<div class="melihelp-toolbar">' +
            '<button type="button" class="melihelp-btn melihelp-btn-primary melihelp-btn-text-upper" id="melihelp-add-files">ADICIONAR ARQUIVOS</button>' +
            '</div></div>' +
            '<ul class="melihelp-doc-list" id="melihelp-doc-list">' + itemsHtml + '</ul></section>';

        pendingUploadTarget = { key: key };

        $('melihelp-add-files').addEventListener('click', function () {
            openMelihelpUploadModal();
        });

        main.querySelectorAll('.melihelp-remove-doc').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.getAttribute('data-id');
                var cur = loadDocs(key);
                var found = cur.find(function (x) { return String(x.id) === String(id); });
                if (!found) return;
                openDocDeleteConfirm(key, id);
            });
        });

        main.querySelectorAll('.melihelp-open-data').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.getAttribute('data-id');
                var item = loadDocs(key).find(function (x) { return String(x.id) === String(id); });
                if (item && item.dataUrl) window.open(item.dataUrl, '_blank', 'noopener,noreferrer');
            });
        });

        main.querySelectorAll('.melihelp-preview-doc').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.getAttribute('data-id');
                var item = loadDocs(key).find(function (x) { return String(x.id) === String(id); });
                if (item && item.dataUrl) openDocPreview(item.dataUrl, item.name, item.mime);
            });
        });
    }

    function closeTrashPurgeConfirm() {
        trashPurgePendingTid = null;
        var bd = $('melihelp-trash-purge-backdrop');
        if (bd) bd.hidden = true;
    }

    function openTrashPurgeConfirm(tid) {
        if (tid == null || String(tid) === '') return;
        trashPurgePendingTid = String(tid);
        var bd = $('melihelp-trash-purge-backdrop');
        if (bd) bd.hidden = false;
    }

    function submitTrashPurgeConfirm() {
        var tid = trashPurgePendingTid;
        closeTrashPurgeConfirm();
        if (!tid) return;
        var t = loadTrash();
        var entry = t.find(function (x) { return String(x.trashId) === String(tid); });
        if (!entry) return;
        saveTrash(t.filter(function (x) { return String(x.trashId) !== String(tid); }));
        if (entry.docBlobInIdb) deleteTrashBlobPromise(tid);
        showToast('Removido definitivamente.');
        render();
    }

    function initMelihelpTrashPurgeModal() {
        var bd = $('melihelp-trash-purge-backdrop');
        var dlg = bd ? bd.querySelector('.melihelp-upload-modal-dialog') : null;
        var closeB = $('melihelp-trash-purge-close');
        var cancel = $('melihelp-trash-purge-cancel');
        var confirmB = $('melihelp-trash-purge-confirm');
        if (!bd) return;
        bd.addEventListener('click', function (e) {
            if (e.target === bd) closeTrashPurgeConfirm();
        });
        if (closeB) closeB.addEventListener('click', closeTrashPurgeConfirm);
        if (cancel) cancel.addEventListener('click', closeTrashPurgeConfirm);
        if (confirmB) confirmB.addEventListener('click', submitTrashPurgeConfirm);
        if (dlg) dlg.addEventListener('click', function (e) { e.stopPropagation(); });
    }

    function renderTrash() {
        stopTrashCountdownTimer();
        var main = $('melihelp-main');
        var trash = purgeExpiredTrash();

        var itemsHtml = trash.length
            ? trash.map(function (entry) {
                var d = entry.doc || {};
                var expMs = trashExpiresAtMs(entry);
                var countText = 'Exclusão automática em ' + formatTrashRemaining(expMs);
                var isCordaoReg = entry.kind === 'cordao_retirada' || entry.kind === 'cordao_entrada' ||
                    entry.kind === 'cordao_recebimento';
                var sizePart = (!isCordaoReg && d.size != null) ? ' · ' + esc(formatBytes(d.size)) : '';
                return '<li class="melihelp-doc-item melihelp-trash-item">' +
                    '<div class="melihelp-trash-item-body">' +
                    '<strong>' + esc(d.name) + '</strong>' +
                    '<div class="melihelp-doc-meta">' + esc(formatDate(entry.deletedAt)) + ' · ' + esc(labelForSourceKey(entry.sourceKey)) +
                    sizePart + '</div>' +
                    '<div class="melihelp-trash-countdown" data-expires="' + expMs + '">' +
                    '<i class="fas fa-clock" aria-hidden="true"></i> ' +
                    '<span class="melihelp-trash-countdown-text">' + esc(countText) + '</span></div></div>' +
                    '<div class="melihelp-toolbar melihelp-trash-actions">' +
                    '<button type="button" class="melihelp-btn melihelp-btn-ghost melihelp-btn-text-upper melihelp-restore-trash" data-tid="' + esc(entry.trashId) + '">RESTAURAR</button>' +
                    '<button type="button" class="melihelp-btn melihelp-btn-danger melihelp-btn-text-upper melihelp-purge-trash" data-tid="' + esc(entry.trashId) + '">APAGAR DEFINITIVAMENTE</button>' +
                    '</div></li>';
            }).join('')
            : '<div class="melihelp-empty melihelp-trash-empty melihelp-trash-empty--upper"><span class="big">🗑️</span>A lixeira está vazia.<br>Não há itens a aguardar restauração ou eliminação definitiva.</div>';

        main.innerHTML =
            '<section class="melihelp-panel glass-panel melihelp-trash-panel">' +
            '<header class="melihelp-trash-hero">' +
            '<h2 class="melihelp-trash-title">LIXEIRA</h2>' +
            '<div class="melihelp-trash-desc melihelp-trash-desc--single">' +
            '<p>Ficheiros de <strong>crachás</strong>, pastas de <strong>cordão</strong> e <strong>cartão avulso</strong>, e <strong>registos</strong> de retirada/entrada de cordão e de recebimento de estoque, ao remover, vêm para aqui neste navegador por <strong>30 dias corridos</strong>; até lá pode <strong>restaurar</strong> ou <strong>apagar definitivamente</strong>. Findos os 30 dias a eliminação é <strong>automática</strong>. O <strong>contador</strong> em cada item mostra o tempo restante.</p>' +
            '</div>' +
            '</header>' +
            '<div class="melihelp-trash-list-wrap">' +
            '<ul class="melihelp-doc-list melihelp-trash-list" id="melihelp-trash-list">' + itemsHtml + '</ul>' +
            '</div>' +
            '</section>';

        main.querySelectorAll('.melihelp-restore-trash').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var tid = btn.getAttribute('data-tid');
                var t = loadTrash();
                var entry = t.find(function (x) { return String(x.trashId) === String(tid); });
                if (!entry || !entry.doc) return;

                if (entry.kind === 'cordao_retirada' || entry.kind === 'cordao_entrada') {
                    var cr = entry.cordaoRow;
                    if (!cr) {
                        showToast('Registo inválido na lixeira.');
                        return;
                    }
                    var listR = loadCordaoRetiradas();
                    if (listR.some(function (x) { return String(x.id) === String(cr.id); })) {
                        saveTrash(t.filter(function (x) { return String(x.trashId) !== String(tid); }));
                        showToast('Este registo já está na lista.');
                        render();
                        return;
                    }
                    listR.push(cr);
                    if (!saveCordaoRetiradas(listR)) {
                        showToast('Não foi possível restaurar.');
                        return;
                    }
                    saveTrash(t.filter(function (x) { return String(x.trashId) !== String(tid); }));
                    showToast('Registo restaurado.');
                    render();
                    return;
                }

                if (entry.kind === 'cordao_recebimento') {
                    var crRec = entry.cordaoRow;
                    if (!crRec) {
                        showToast('Registo inválido na lixeira.');
                        return;
                    }
                    var listRec = loadCordaoRecebimentos();
                    if (listRec.some(function (x) { return String(x.id) === String(crRec.id); })) {
                        saveTrash(t.filter(function (x) { return String(x.trashId) !== String(tid); }));
                        showToast('Este registo já está na lista.');
                        render();
                        return;
                    }
                    listRec.push(crRec);
                    if (!saveCordaoRecebimentos(listRec)) {
                        showToast('Não foi possível restaurar.');
                        return;
                    }
                    saveTrash(t.filter(function (x) { return String(x.trashId) !== String(tid); }));
                    showToast('Registo restaurado.');
                    render();
                    return;
                }

                var key = entry.sourceKey;

                function doRestore(fullDoc) {
                    ensureFolderFullLoaded(key).then(function () {
                        var list = loadDocs(key).slice();
                        list.push(fullDoc);
                        saveDocsAsync(key, list).then(function (ok) {
                            if (!ok) {
                                showToast('Não foi possível restaurar (armazenamento cheio ou indisponível).');
                                return;
                            }
                            saveTrash(t.filter(function (x) { return String(x.trashId) !== String(tid); }));
                            if (entry.docBlobInIdb) deleteTrashBlobPromise(tid);
                            showToast('Arquivo restaurado.');
                            render();
                        });
                    });
                }

                if (entry.docBlobInIdb) {
                    getTrashBlobPromise(tid).then(function (blob) {
                        if (!blob) {
                            showToast('O ficheiro na lixeira já não está disponível.');
                            return;
                        }
                        blobToDataUrl(blob).then(function (du) {
                            doRestore(Object.assign({}, entry.doc, { dataUrl: du }));
                        }).catch(function () {
                            showToast('Não foi possível ler o ficheiro da lixeira.');
                        });
                    });
                } else {
                    doRestore(entry.doc);
                }
            });
        });

        main.querySelectorAll('.melihelp-purge-trash').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var tid = btn.getAttribute('data-tid');
                if (tid) openTrashPurgeConfirm(tid);
            });
        });

        if (trash.length) startTrashCountdownTimer();
    }

    function loadCordaoRetiradas() {
        var arr = loadJson(CORDAO_RETIRADAS_KEY, []);
        return Array.isArray(arr) ? arr : [];
    }

    function saveCordaoRetiradas(arr) {
        return saveJson(CORDAO_RETIRADAS_KEY, Array.isArray(arr) ? arr : []);
    }

    function loadCordaoRecebimentos() {
        var arr = loadJson(CORDAO_RECEBIMENTOS_KEY, []);
        return Array.isArray(arr) ? arr : [];
    }

    function saveCordaoRecebimentos(arr) {
        return saveJson(CORDAO_RECEBIMENTOS_KEY, Array.isArray(arr) ? arr : []);
    }

    function parseCordaoQuantidade(val) {
        var n = parseInt(String(val).replace(/[^\d]/g, ''), 10);
        if (isNaN(n) || n < 1 || n > 999999) return null;
        return n;
    }

    function addCordaoRecebimento(qty, recebidoIso, source) {
        var q = typeof qty === 'number' ? qty : parseCordaoQuantidade(qty);
        if (q == null) {
            showToast('Informe uma quantidade válida (número inteiro a partir de 1).');
            return false;
        }
        var iso = recebidoIso || new Date().toISOString();
        var test = new Date(iso);
        if (isNaN(test.getTime())) {
            showToast('Data/hora inválida.');
            return false;
        }
        var list = loadCordaoRecebimentos();
        list.push({
            id: String(Date.now()) + '_' + Math.random().toString(36).slice(2, 10),
            quantidade: q,
            recebidoAt: iso,
            source: source === 'manual' ? 'manual' : 'auto'
        });
        if (!saveCordaoRecebimentos(list)) return false;
        showToast('Recebimento registrado.');
        return true;
    }

    function moveCordaoRecebimentoToTrashById(id) {
        if (id == null || String(id) === '') return false;
        var sid = String(id);
        var list = loadCordaoRecebimentos();
        var row = null;
        var i;
        for (i = 0; i < list.length; i++) {
            if (String(list[i] && list[i].id) === sid) {
                row = list[i];
                break;
            }
        }
        if (!row) return false;
        var now = Date.now();
        var trashId = String(now) + '_' + Math.random().toString(36).slice(2, 10);
        var entry = {
            trashId: trashId,
            kind: 'cordao_recebimento',
            deletedAt: new Date(now).toISOString(),
            expiresAt: new Date(now + TRASH_RETENTION_MS).toISOString(),
            sourceKey: CORDAO_RECEBIMENTOS_KEY,
            cordaoRow: JSON.parse(JSON.stringify(row)),
            doc: {
                id: row.id,
                name: 'Recebimento · ' + row.quantidade + ' un.',
                mime: 'application/vnd.melihelp.cordao-recebimento',
                size: 0,
                addedAt: row.recebidoAt,
                disabled: false
            }
        };
        var t = loadTrash();
        t.push(entry);
        if (!saveTrash(t)) return false;
        var next = list.filter(function (r) { return String(r && r.id) !== sid; });
        if (!saveCordaoRecebimentos(next)) {
            saveTrash(t.filter(function (x) { return String(x.trashId) !== String(trashId); }));
            return false;
        }
        showToast('Registo enviado para a lixeira.');
        return true;
    }

    function removeCordaoRecebimentoById(id) {
        return moveCordaoRecebimentoToTrashById(id);
    }

    /** { dateStr, timeStr HH:mm:ss } em fuso local */
    function formatCordaoDateParts(iso) {
        try {
            var d = new Date(iso);
            if (isNaN(d.getTime())) return { dateStr: '—', timeStr: '—' };
            var dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            var timeStr = pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
            return { dateStr: dateStr, timeStr: timeStr };
        } catch (e) {
            return { dateStr: '—', timeStr: '—' };
        }
    }

    /** 'saida' = retirada; 'entrada' = recebimento/devolução */
    function cordaoMovimento(row) {
        if (!row) return 'saida';
        var m = row.movimento;
        if (m === 'recebimento' || m === 'entrada') return 'entrada';
        return 'saida';
    }

    function cordaoStatsFromList(all) {
        var now = new Date();
        var startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        var dow = startOfDay.getDay();
        var mondayDiff = (dow + 6) % 7;
        var startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfWeek.getDate() - mondayDiff);
        startOfWeek.setHours(0, 0, 0, 0);
        var startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        var startOfYear = new Date(now.getFullYear(), 0, 1);

        function ts(iso) {
            var t = new Date(iso).getTime();
            return isNaN(t) ? 0 : t;
        }
        var saidaWeek = 0;
        var saidaMonth = 0;
        var saidaYear = 0;
        (all || []).forEach(function (row) {
            var t = ts(row.retiradaAt);
            if (!t || cordaoMovimento(row) !== 'saida') return;
            if (t >= startOfWeek.getTime()) saidaWeek++;
            if (t >= startOfMonth.getTime()) saidaMonth++;
            if (t >= startOfYear.getTime()) saidaYear++;
        });
        return { saidaWeek: saidaWeek, saidaMonth: saidaMonth, saidaYear: saidaYear };
    }

    function renderCordaoDashboard() {
        var all = loadCordaoRetiradas();
        var st = cordaoStatsFromList(all);
        var main = $('melihelp-main');
        main.innerHTML =
            '<section class="melihelp-panel glass-panel melihelp-cracha-dashboard melihelp-cordao-dashboard">' +
            '<header class="melihelp-dash-head melihelp-cracha-dash-head--minimal">' +
            '<h2 class="melihelp-dash-title">CORDÃO</h2>' +
            '</header>' +
            '<div class="melihelp-dash-stats melihelp-cracha-kpis melihelp-cracha-kpis--three">' +
            '<div class="melihelp-dash-stat glass-panel"><span class="melihelp-dash-stat-val">' + st.saidaWeek + '</span><span class="melihelp-dash-stat-label">SAÍDA NA SEMANA</span></div>' +
            '<div class="melihelp-dash-stat glass-panel"><span class="melihelp-dash-stat-val">' + st.saidaMonth + '</span><span class="melihelp-dash-stat-label">SAÍDA NO MÊS</span></div>' +
            '<div class="melihelp-dash-stat glass-panel"><span class="melihelp-dash-stat-val">' + st.saidaYear + '</span><span class="melihelp-dash-stat-label">SAÍDA NO ANO</span></div>' +
            '</div>' +
            '<p class="melihelp-cordao-dash-hint">USE <strong>RETIRADAS</strong> NO MENU PARA AS SAÍDAS (2025 E 2026). USE <strong>RECEBIMENTO</strong> PARA ANOTAR QUANTOS CORDÕES CHEGARAM EM CADA MÊS (MESMO HISTÓRICO DA PLANILHA). EM CADA MÊS DE RETIRADA VOCÊ REGISTRA PELO RE OU CPF E NOME. AQUI VOCÊ VÊ SÓ OS NÚMEROS DE RETIRADAS: SEMANA, MÊS E ANO.</p>' +
            '</section>';
        pendingUploadTarget = null;
    }

    function addCordaoRetirada(re, nome, retiradaIso, source, movimento) {
        var r = (re || '').trim();
        var n = (nome || '').trim();
        if (!r || !n) {
            showToast('Preencha RE ou CPF e nome do colaborador(a).');
            return false;
        }
        var iso = retiradaIso || new Date().toISOString();
        var test = new Date(iso);
        if (isNaN(test.getTime())) {
            showToast('Data/hora inválida.');
            return false;
        }
        var mov = movimento === 'entrada' || movimento === 'recebimento' ? 'entrada' : 'saida';
        var list = loadCordaoRetiradas();
        list.push({
            id: String(Date.now()) + '_' + Math.random().toString(36).slice(2, 10),
            re: r,
            nome: n,
            retiradaAt: iso,
            source: source === 'manual' ? 'manual' : 'auto',
            movimento: mov
        });
        if (!saveCordaoRetiradas(list)) return false;
        showToast(mov === 'entrada' ? 'Recebimento registrado.' : 'Saída registrada.');
        return true;
    }

    function moveCordaoRetiradaToTrashById(id) {
        if (id == null || String(id) === '') return false;
        var sid = String(id);
        var list = loadCordaoRetiradas();
        var row = null;
        var i;
        for (i = 0; i < list.length; i++) {
            if (String(list[i] && list[i].id) === sid) {
                row = list[i];
                break;
            }
        }
        if (!row) return false;
        var now = Date.now();
        var trashId = String(now) + '_' + Math.random().toString(36).slice(2, 10);
        var isEntrada = cordaoMovimento(row) === 'entrada';
        var titlePrefix = isEntrada ? 'Entrada · ' : 'Retirada · ';
        var entry = {
            trashId: trashId,
            kind: isEntrada ? 'cordao_entrada' : 'cordao_retirada',
            deletedAt: new Date(now).toISOString(),
            expiresAt: new Date(now + TRASH_RETENTION_MS).toISOString(),
            sourceKey: CORDAO_RETIRADAS_KEY,
            cordaoRow: JSON.parse(JSON.stringify(row)),
            doc: {
                id: row.id,
                name: titlePrefix + row.re + ' — ' + row.nome,
                mime: 'application/vnd.melihelp.cordao-registo',
                size: 0,
                addedAt: row.retiradaAt,
                disabled: false
            }
        };
        var t = loadTrash();
        t.push(entry);
        if (!saveTrash(t)) return false;
        var next = list.filter(function (r) { return String(r && r.id) !== sid; });
        if (!saveCordaoRetiradas(next)) {
            saveTrash(t.filter(function (x) { return String(x.trashId) !== String(trashId); }));
            return false;
        }
        showToast('Registo enviado para a lixeira.');
        return true;
    }

    function removeCordaoRetiradaById(id) {
        return moveCordaoRetiradaToTrashById(id);
    }

    function isCordaoModalOpen() {
        var bd = $('melihelp-cordao-modal-backdrop');
        return !!(bd && !bd.hidden);
    }

    function closeCordaoModal() {
        var bd = $('melihelp-cordao-modal-backdrop');
        if (bd) bd.hidden = true;
    }

    function openCordaoModal(prefillRe, prefillNome, lockYear, lockMonth) {
        if (lockYear != null && lockMonth != null) {
            var y = parseInt(String(lockYear), 10);
            var mo = parseInt(String(lockMonth), 10);
            if (!isNaN(y) && !isNaN(mo) && mo >= 1 && mo <= 12) {
                var now = new Date();
                var lastDay = new Date(y, mo, 0).getDate();
                var day = Math.min(now.getDate(), lastDay);
                fillCordaoModalFromDate(new Date(y, mo - 1, day, now.getHours(), now.getMinutes(), now.getSeconds()));
            } else {
                fillCordaoModalFromDate(new Date());
            }
        } else {
            fillCordaoModalFromDate(new Date());
        }
        var reEl = $('melihelp-cordao-re');
        var noEl = $('melihelp-cordao-nome');
        if (reEl) reEl.value = prefillRe != null ? String(prefillRe) : '';
        if (noEl) noEl.value = prefillNome != null ? String(prefillNome) : '';
        var bd = $('melihelp-cordao-modal-backdrop');
        if (bd) bd.hidden = false;
        setTimeout(function () {
            if (reEl && !(prefillRe && String(prefillRe).trim())) reEl.focus();
            else if (noEl) noEl.focus();
        }, 30);
    }

    function fillCordaoModalFromDate(d) {
        var h = $('melihelp-cordao-hour');
        var mi = $('melihelp-cordao-min');
        var s = $('melihelp-cordao-sec');
        var day = $('melihelp-cordao-day');
        var mo = $('melihelp-cordao-month');
        var y = $('melihelp-cordao-year');
        if (!h || !mi || !s || !day || !mo || !y) return;
        h.value = pad2(d.getHours());
        mi.value = pad2(d.getMinutes());
        s.value = pad2(d.getSeconds());
        day.value = pad2(d.getDate());
        mo.value = pad2(d.getMonth() + 1);
        y.value = String(d.getFullYear());
    }

    function spinCordaoField(inputId, delta) {
        var el = $(inputId);
        if (!el) return;
        var min = parseInt(el.getAttribute('min'), 10);
        var max = parseInt(el.getAttribute('max'), 10);
        if (isNaN(min)) min = 0;
        if (isNaN(max)) max = 9999;
        var cur = clampIntUpload(el.value, min, max);
        var next = cur + delta;
        if (next < min) next = min;
        if (next > max) next = max;
        if (el.id === 'melihelp-cordao-year') el.value = String(next);
        else el.value = pad2(next);
    }

    function normalizeCordaoInput(el) {
        if (!el) return;
        var min = parseInt(el.getAttribute('min'), 10);
        var max = parseInt(el.getAttribute('max'), 10);
        var v = clampIntUpload(el.value, min, max);
        if (el.id === 'melihelp-cordao-year') el.value = String(v);
        else el.value = pad2(v);
    }

    function parseCordaoModalToIso() {
        var hEl = $('melihelp-cordao-hour');
        var miEl = $('melihelp-cordao-min');
        var sEl = $('melihelp-cordao-sec');
        var dEl = $('melihelp-cordao-day');
        var moEl = $('melihelp-cordao-month');
        var yEl = $('melihelp-cordao-year');
        if (!hEl || !miEl || !sEl || !dEl || !moEl || !yEl) return null;
        var h = clampIntUpload(hEl.value, 0, 23);
        var mi = clampIntUpload(miEl.value, 0, 59);
        var s = clampIntUpload(sEl.value, 0, 59);
        var d = clampIntUpload(dEl.value, 1, 31);
        var mo = clampIntUpload(moEl.value, 1, 12);
        var y = clampIntUpload(yEl.value, 1900, 2100);
        hEl.value = pad2(h);
        miEl.value = pad2(mi);
        sEl.value = pad2(s);
        dEl.value = pad2(d);
        moEl.value = pad2(mo);
        yEl.value = String(y);
        var dt = new Date(y, mo - 1, d, h, mi, s, 0);
        if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) {
            return null;
        }
        return dt.toISOString();
    }

    function submitCordaoModal() {
        var reEl = $('melihelp-cordao-re');
        var noEl = $('melihelp-cordao-nome');
        var iso = parseCordaoModalToIso();
        if (!iso) {
            showToast('Data inválida para o mês (ex.: 31 em fevereiro). Ajuste dia ou mês.');
            return;
        }
        if (addCordaoRetirada(reEl && reEl.value, noEl && noEl.value, iso, 'manual', 'saida')) {
            closeCordaoModal();
            render();
        }
    }

    function initMelihelpCordaoModal() {
        var bd = $('melihelp-cordao-modal-backdrop');
        var dlg = $('melihelp-cordao-modal-dialog');
        var cancel = $('melihelp-cordao-modal-cancel');
        var nowBtn = $('melihelp-cordao-modal-now');
        var closeB = $('melihelp-cordao-modal-close');
        var saveBtn = $('melihelp-cordao-modal-save');
        if (!bd || !dlg) return;
        bd.addEventListener('click', function (e) {
            if (e.target === bd) closeCordaoModal();
        });
        dlg.addEventListener('click', function (e) {
            var spin = e.target.closest('[data-melihelp-cordao-spin]');
            if (spin) {
                var sid = spin.getAttribute('data-melihelp-cordao-spin');
                var d = parseInt(spin.getAttribute('data-melihelp-cordao-spin-delta'), 10);
                if (sid && !isNaN(d)) spinCordaoField(sid, d);
            }
            e.stopPropagation();
        });
        if (closeB) closeB.addEventListener('click', closeCordaoModal);
        if (cancel) cancel.addEventListener('click', closeCordaoModal);
        if (nowBtn) nowBtn.addEventListener('click', function () { fillCordaoModalFromDate(new Date()); });
        if (saveBtn) saveBtn.addEventListener('click', submitCordaoModal);
        dlg.addEventListener('wheel', function (e) {
            var card = e.target.closest('.melihelp-upload-dt-card');
            if (!card || !dlg.contains(card)) return;
            var inp = card.querySelector('.melihelp-upload-dt-input');
            if (!inp) return;
            e.preventDefault();
            var step = e.deltaY > 0 ? -1 : 1;
            spinCordaoField(inp.id, step);
        }, { passive: false });
        dlg.querySelectorAll('.melihelp-upload-dt-input').forEach(function (inp) {
            if (dlg.contains(inp)) inp.addEventListener('blur', function () { normalizeCordaoInput(inp); });
        });
    }

    var cordaoEditRecordId = null;
    var cordaoRecLockYear = null;
    var cordaoRecLockMonth = null;
    var cordaoRecEditRecordId = null;
    var cordaoRecDeletePendingId = null;
    var cordaoRetiradaDeletePendingId = null;
    var trashPurgePendingTid = null;

    function isCordaoEditModalOpen() {
        var bd = $('melihelp-cordao-edit-backdrop');
        return !!(bd && !bd.hidden);
    }

    function closeCordaoEditModal() {
        var bd = $('melihelp-cordao-edit-backdrop');
        if (bd) bd.hidden = true;
        cordaoEditRecordId = null;
    }

    function openCordaoEditModal(id) {
        var list = loadCordaoRetiradas();
        var row = null;
        var i;
        for (i = 0; i < list.length; i++) {
            if (String(list[i].id) === String(id)) {
                row = list[i];
                break;
            }
        }
        if (!row) return;
        cordaoEditRecordId = String(id);
        var reEl = $('melihelp-cordao-edit-re');
        var noEl = $('melihelp-cordao-edit-nome');
        if (reEl) reEl.value = row.re != null ? String(row.re) : '';
        if (noEl) noEl.value = row.nome != null ? String(row.nome) : '';
        var bd = $('melihelp-cordao-edit-backdrop');
        if (bd) bd.hidden = false;
        setTimeout(function () {
            if (reEl) reEl.focus();
        }, 30);
    }

    function submitCordaoEditModal() {
        if (!cordaoEditRecordId) return;
        var reEl = $('melihelp-cordao-edit-re');
        var noEl = $('melihelp-cordao-edit-nome');
        var r = (reEl && reEl.value ? String(reEl.value) : '').trim();
        var n = (noEl && noEl.value ? String(noEl.value) : '').trim();
        if (!r || !n) {
            showToast('Preencha RE ou CPF e nome do colaborador(a).');
            return;
        }
        var list = loadCordaoRetiradas();
        var changed = false;
        for (var j = 0; j < list.length; j++) {
            if (String(list[j].id) === String(cordaoEditRecordId)) {
                list[j].re = r;
                list[j].nome = n;
                changed = true;
                break;
            }
        }
        if (!changed) return;
        if (!saveCordaoRetiradas(list)) return;
        showToast('Registro atualizado.');
        closeCordaoEditModal();
        render();
    }

    function initMelihelpCordaoEditModal() {
        var bd = $('melihelp-cordao-edit-backdrop');
        var dlg = $('melihelp-cordao-edit-dialog');
        var closeB = $('melihelp-cordao-edit-close');
        var cancel = $('melihelp-cordao-edit-cancel');
        var saveBtn = $('melihelp-cordao-edit-save');
        var reInp = $('melihelp-cordao-edit-re');
        var noInp = $('melihelp-cordao-edit-nome');
        if (!bd || !dlg) return;
        bd.addEventListener('click', function (e) {
            if (e.target === bd) closeCordaoEditModal();
        });
        dlg.addEventListener('click', function (e) {
            e.stopPropagation();
        });
        if (closeB) closeB.addEventListener('click', closeCordaoEditModal);
        if (cancel) cancel.addEventListener('click', closeCordaoEditModal);
        if (saveBtn) saveBtn.addEventListener('click', submitCordaoEditModal);
        function onEnter(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitCordaoEditModal();
            }
        }
        if (reInp) reInp.addEventListener('keydown', onEnter);
        if (noInp) noInp.addEventListener('keydown', onEnter);
    }

    function cordaoRowInMonth(iso, yearStr, monthStr) {
        if (!yearStr || !monthStr) return true;
        var d = new Date(iso);
        if (isNaN(d.getTime())) return false;
        var m = pad2(d.getMonth() + 1);
        var mi = parseInt(String(monthStr), 10);
        var want = isNaN(mi) ? String(monthStr) : pad2(mi);
        return String(d.getFullYear()) === String(yearStr) && m === want;
    }

    /**
     * Na página de um mês, "AGORA" deve cair nesse mês/ano da rota; senão o registo
     * some da tabela (ex.: URL janeiro/2026 com relógio real em março/2026).
     */
    function cordaoStampForViewedMonth(yearStr, monthStr) {
        var y = parseInt(String(yearStr), 10);
        var m = parseInt(String(monthStr), 10);
        if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
            return new Date().toISOString();
        }
        var now = new Date();
        if (now.getFullYear() === y && now.getMonth() + 1 === m) {
            return now.toISOString();
        }
        var lastDay = new Date(y, m, 0).getDate();
        var day = Math.min(now.getDate(), lastDay);
        return new Date(y, m - 1, day, now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds()).toISOString();
    }

    /**
     * Corrige linhas de *demonstração* antigas (addedAt em abril na pasta janeiro, etc.).
     * Novos registos já usam cordaoStampForViewedMonth no mês destino.
     */
    function repairAvulsoWSampleRowsCalendarMonth(year, month) {
        var y = String(year);
        var mi = parseInt(String(month).replace(/\D/g, ''), 10);
        if (isNaN(mi) || mi < 1 || mi > 12) return;
        var mo = pad2(mi);
        var list = loadAtasAvulsoWList(y, mo);
        if (!list.length) return;
        var baseIso = cordaoStampForViewedMonth(y, mo);
        var baseMs = new Date(baseIso).getTime();
        if (isNaN(baseMs)) return;
        var n = list.length;
        var alt = false;
        var out = list.map(function (row, i) {
            if (!row || !row.id) return row;
            var isSample = row.sample === true || String(row.id).indexOf('sample_avulso_w_') === 0;
            if (!isSample) return row;
            var d = new Date(row.addedAt);
            if (
                isNaN(d.getTime()) ||
                d.getMonth() + 1 !== mi ||
                String(d.getFullYear()) !== y
            ) {
                alt = true;
                return Object.assign({}, row, {
                    addedAt: new Date(baseMs - (n - 1 - i) * 60000).toISOString()
                });
            }
            return row;
        });
        if (alt) saveAtasAvulsoWList(y, mo, out);
    }

    /** Uma linha (WhatsApp / AXIS Bot): retirada;re;nome | recebimento;qtd;ano;mês | cartaoavulso;ano;mês;W — grava e atualiza o hub. */
    function interpretarLinhaCordao(raw) {
        var line = String(raw || '').trim().split(/\r?\n/)[0].trim();
        if (!line) return { ok: false, reason: 'vazio' };
        var parts = line.split(/[;|]/).map(function (s) { return s.trim(); }).filter(Boolean);
        var cmd = (parts[0] || '').toLowerCase().replace(/\s+/g, '');
        if (cmd === 'cartaoavulso' && parts.length >= 4) {
            var y = String(parts[1] || '').trim();
            if (!/^\d{4}$/.test(y)) return { ok: false, reason: 'ano' };
            var mi = parseInt(String(parts[2]).replace(/\D/g, ''), 10);
            if (isNaN(mi) || mi < 1 || mi > 12) return { ok: false, reason: 'mes' };
            var mm = pad2(mi);
            var wPart = parts.slice(3).join(';').trim();
            if (addAtasAvulsoWEntry(y, mm, wPart)) {
                render();
                return { ok: true };
            }
            return { ok: false, reason: 'avulso_w' };
        }
        if (cmd === 'retirada' && parts.length >= 3) {
            if (addCordaoRetirada(parts[1], parts[2], new Date().toISOString(), 'auto', 'saida')) {
                render();
                return { ok: true };
            }
            return { ok: false, reason: 'retirada' };
        }
        if ((cmd === 'recebimento' || cmd === 'rec') && parts.length >= 4) {
            var q = parseCordaoQuantidade(parts[1]);
            if (q == null) return { ok: false, reason: 'qty' };
            var iso = cordaoStampForViewedMonth(parts[2], parts[3]);
            if (addCordaoRecebimento(q, iso, 'auto')) {
                render();
                return { ok: true };
            }
            return { ok: false, reason: 'recebimento' };
        }
        return { ok: false, reason: 'formato' };
    }

    function renderCordaoMonth(route) {
        if (!route || !route.year || !route.month) {
            setRoute('cordao');
            return;
        }
        var filterYear = route.year;
        var filterMonth = route.month;
        var mlabel = monthLabel(filterMonth);
        var main = $('melihelp-main');
        var list = loadCordaoRetiradas()
            .filter(function (row) {
                return cordaoMovimento(row) === 'saida' && cordaoRowInMonth(row.retiradaAt, filterYear, filterMonth);
            })
            .sort(function (a, b) {
                return String(b.retiradaAt || '').localeCompare(String(a.retiradaAt || ''));
            });

        var tbody = list.length
            ? list.map(function (row) {
                var p = formatCordaoDateParts(row.retiradaAt);
                var orig = row.source === 'manual' ? 'Manual' : 'Automático';
                return '<tr>' +
                    '<td>' + esc(row.re) + '</td>' +
                    '<td>' + esc(row.nome) + '</td>' +
                    '<td>' + esc(p.dateStr) + '</td>' +
                    '<td>' + esc(p.timeStr) + '</td>' +
                    '<td><span class="melihelp-cordao-origem">' + esc(orig) + '</span></td>' +
                    '<td><div class="melihelp-cordao-ret-row-actions">' +
                    '<button type="button" class="melihelp-btn melihelp-btn-ghost melihelp-btn-text-upper melihelp-cordao-edit-open" data-id="' + escAttr(row.id) + '">EDITAR</button>' +
                    '<button type="button" class="melihelp-btn melihelp-btn-danger melihelp-btn-icon-only melihelp-cordao-ret-delete" data-id="' + escAttr(row.id) + '" title="Excluir registo" aria-label="Excluir esta retirada"><i class="fas fa-trash-alt" aria-hidden="true"></i></button>' +
                    '</div></td>' +
                    '</tr>';
            }).join('')
            : '';

        var scrollExtraClass = list.length ? '' : ' melihelp-cordao-table-scroll--empty';
        var tableBlock =
            '<div class="melihelp-cordao-table-wrap">' +
            '<div class="melihelp-cordao-table-scroll' + scrollExtraClass + '">' +
            '<table class="melihelp-cordao-table">' +
            '<thead><tr>' +
            '<th>RE | CPF</th><th>NOME DO COLABORADOR(A)</th><th>DATA</th><th>HORA</th><th>ORIGEM</th><th>CONTROLES</th>' +
            '</tr></thead><tbody>' + tbody + '</tbody></table></div></div>';

        main.innerHTML =
            '<section class="melihelp-panel glass-panel melihelp-cordao-panel melihelp-cordao-month-panel">' +
            '<div class="melihelp-cordao-month-head">' +
            '<h2 class="melihelp-cordao-month-h2">RETIRADAS DE CORDÕES</h2>' +
            '<p class="melihelp-cordao-month-subline">' + esc(mlabel) + ' DE ' + esc(filterYear) + '</p>' +
            '<p class="melihelp-cordao-lead melihelp-cordao-lead--tight">USE ESTA PÁGINA PARA ANOTAR QUEM RETIROU O CORDÃO NO MÊS QUE ESTÁ NO TÍTULO. INFORME O RE OU CPF E O NOME DO COLABORADOR. EM REGISTRAR SAÍDA A DATA E A HORA FICAM COM O MOMENTO ATUAL (AJUSTADAS PARA ESTE MÊS QUANDO PRECISAR). EM DATA E HORA VOCÊ ESCOLHE MANUALMENTE DIA E HORÁRIO COMPLETO. NA TABELA APARECEM DATA, HORA COM SEGUNDOS E SE O LANÇAMENTO FOI AUTOMÁTICO OU MANUAL; USE EDITAR SE PRECISAR CORRIGIR RE OU NOME.</p>' +
            '<div class="melihelp-cordao-quick glass-panel">' +
            '<div class="melihelp-cordao-quick-title">REGISTRO RÁPIDO</div>' +
            '<div class="melihelp-cordao-quick-grid">' +
            '<div><label class="melihelp-cordao-field-label" for="melihelp-cordao-quick-re">RE | CPF</label>' +
            '<input type="text" id="melihelp-cordao-quick-re" class="melihelp-cordao-text-input melihelp-cordao-quick-input" maxlength="80" autocomplete="off"></div>' +
            '<div><label class="melihelp-cordao-field-label" for="melihelp-cordao-quick-nome">NOME DO COLABORADOR(A)</label>' +
            '<input type="text" id="melihelp-cordao-quick-nome" class="melihelp-cordao-text-input melihelp-cordao-quick-input" maxlength="200" autocomplete="off"></div>' +
            '</div>' +
            '<div class="melihelp-cordao-quick-actions">' +
            '<button type="button" class="melihelp-btn melihelp-btn-primary melihelp-btn-text-upper" id="melihelp-cordao-quick-saida">REGISTRAR SAÍDA</button>' +
            '<button type="button" class="melihelp-btn melihelp-btn-ghost melihelp-btn-text-upper" id="melihelp-cordao-open-modal">DATA E HORA</button>' +
            '</div></div>' +
            tableBlock +
            '</section>';

        var qRe = $('melihelp-cordao-quick-re');
        var qNo = $('melihelp-cordao-quick-nome');
        $('melihelp-cordao-quick-saida').addEventListener('click', function () {
            if (addCordaoRetirada(qRe && qRe.value, qNo && qNo.value, cordaoStampForViewedMonth(filterYear, filterMonth), 'auto', 'saida')) {
                if (qRe) qRe.value = '';
                if (qNo) qNo.value = '';
                render();
            }
        });
        $('melihelp-cordao-open-modal').addEventListener('click', function () {
            openCordaoModal(qRe && qRe.value, qNo && qNo.value, filterYear, filterMonth);
        });
        main.querySelectorAll('.melihelp-cordao-edit-open').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.getAttribute('data-id');
                if (id) openCordaoEditModal(id);
            });
        });
        main.querySelectorAll('.melihelp-cordao-ret-delete').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.getAttribute('data-id');
                if (!id) return;
                openCordaoRetiradaDeleteConfirm(id);
            });
        });
    }

    function isCordaoRecModalOpen() {
        var bd = $('melihelp-cordao-rec-modal-backdrop');
        return !!(bd && !bd.hidden);
    }

    function closeCordaoRecModal() {
        var bd = $('melihelp-cordao-rec-modal-backdrop');
        if (bd) bd.hidden = true;
        cordaoRecLockYear = null;
        cordaoRecLockMonth = null;
    }

    function fillCordaoRecModalFromDate(d) {
        var h = $('melihelp-cordao-rec-hour');
        var mi = $('melihelp-cordao-rec-min');
        var s = $('melihelp-cordao-rec-sec');
        var day = $('melihelp-cordao-rec-day');
        var mo = $('melihelp-cordao-rec-month');
        var y = $('melihelp-cordao-rec-year');
        if (!h || !mi || !s || !day || !mo || !y) return;
        h.value = pad2(d.getHours());
        mi.value = pad2(d.getMinutes());
        s.value = pad2(d.getSeconds());
        day.value = pad2(d.getDate());
        mo.value = pad2(d.getMonth() + 1);
        y.value = String(d.getFullYear());
    }

    function spinCordaoRecField(inputId, delta) {
        var el = $(inputId);
        if (!el) return;
        var min = parseInt(el.getAttribute('min'), 10);
        var max = parseInt(el.getAttribute('max'), 10);
        if (isNaN(min)) min = 0;
        if (isNaN(max)) max = 9999;
        var cur = clampIntUpload(el.value, min, max);
        var next = cur + delta;
        if (next < min) next = min;
        if (next > max) next = max;
        if (el.id === 'melihelp-cordao-rec-year') el.value = String(next);
        else el.value = pad2(next);
    }

    function normalizeCordaoRecModalInput(el) {
        if (!el) return;
        var min = parseInt(el.getAttribute('min'), 10);
        var max = parseInt(el.getAttribute('max'), 10);
        var v = clampIntUpload(el.value, min, max);
        if (el.id === 'melihelp-cordao-rec-year') el.value = String(v);
        else el.value = pad2(v);
    }

    function parseCordaoRecModalToIso() {
        var hEl = $('melihelp-cordao-rec-hour');
        var miEl = $('melihelp-cordao-rec-min');
        var sEl = $('melihelp-cordao-rec-sec');
        var dEl = $('melihelp-cordao-rec-day');
        var moEl = $('melihelp-cordao-rec-month');
        var yEl = $('melihelp-cordao-rec-year');
        if (!hEl || !miEl || !sEl || !dEl || !moEl || !yEl) return null;
        var hh = clampIntUpload(hEl.value, 0, 23);
        var mi = clampIntUpload(miEl.value, 0, 59);
        var s = clampIntUpload(sEl.value, 0, 59);
        var d = clampIntUpload(dEl.value, 1, 31);
        var mo = clampIntUpload(moEl.value, 1, 12);
        var y = clampIntUpload(yEl.value, 1900, 2100);
        hEl.value = pad2(hh);
        miEl.value = pad2(mi);
        sEl.value = pad2(s);
        dEl.value = pad2(d);
        moEl.value = pad2(mo);
        yEl.value = String(y);
        var dt = new Date(y, mo - 1, d, hh, mi, s, 0);
        if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
        return dt.toISOString();
    }

    function openCordaoRecModal(lockYear, lockMonth, prefillQty) {
        cordaoRecLockYear = lockYear != null ? String(lockYear) : null;
        cordaoRecLockMonth = lockMonth != null ? String(lockMonth) : null;
        if (cordaoRecLockYear != null && cordaoRecLockMonth != null) {
            var y = parseInt(cordaoRecLockYear, 10);
            var mo = parseInt(cordaoRecLockMonth, 10);
            if (!isNaN(y) && !isNaN(mo) && mo >= 1 && mo <= 12) {
                var now = new Date();
                var lastDay = new Date(y, mo, 0).getDate();
                var day = Math.min(now.getDate(), lastDay);
                fillCordaoRecModalFromDate(new Date(y, mo - 1, day, now.getHours(), now.getMinutes(), now.getSeconds()));
            } else {
                fillCordaoRecModalFromDate(new Date());
            }
        } else {
            fillCordaoRecModalFromDate(new Date());
        }
        var qEl = $('melihelp-cordao-rec-qty');
        if (qEl) qEl.value = prefillQty != null && prefillQty !== '' ? String(prefillQty) : '';
        var bd = $('melihelp-cordao-rec-modal-backdrop');
        if (bd) bd.hidden = false;
        setTimeout(function () {
            if (qEl) qEl.focus();
        }, 30);
    }

    function submitCordaoRecModal() {
        var qEl = $('melihelp-cordao-rec-qty');
        var q = parseCordaoQuantidade(qEl && qEl.value);
        if (q == null) {
            showToast('Informe uma quantidade válida (número inteiro a partir de 1).');
            return;
        }
        var iso = parseCordaoRecModalToIso();
        if (!iso) {
            showToast('Data inválida para o mês (ex.: 31 em fevereiro). Ajuste dia ou mês.');
            return;
        }
        if (addCordaoRecebimento(q, iso, 'manual')) {
            closeCordaoRecModal();
            render();
        }
    }

    function initMelihelpCordaoRecModal() {
        var bd = $('melihelp-cordao-rec-modal-backdrop');
        var dlg = $('melihelp-cordao-rec-modal-dialog');
        var cancel = $('melihelp-cordao-rec-modal-cancel');
        var nowBtn = $('melihelp-cordao-rec-modal-now');
        var closeB = $('melihelp-cordao-rec-modal-close');
        var saveBtn = $('melihelp-cordao-rec-modal-save');
        if (!bd || !dlg) return;
        bd.addEventListener('click', function (e) {
            if (e.target === bd) closeCordaoRecModal();
        });
        dlg.addEventListener('click', function (e) {
            var spin = e.target.closest('[data-melihelp-cordao-rec-spin]');
            if (spin) {
                var sid = spin.getAttribute('data-melihelp-cordao-rec-spin');
                var d = parseInt(spin.getAttribute('data-melihelp-cordao-rec-spin-delta'), 10);
                if (sid && !isNaN(d)) spinCordaoRecField(sid, d);
            }
            e.stopPropagation();
        });
        if (closeB) closeB.addEventListener('click', closeCordaoRecModal);
        if (cancel) cancel.addEventListener('click', closeCordaoRecModal);
        if (nowBtn) nowBtn.addEventListener('click', function () {
            if (cordaoRecLockYear != null && cordaoRecLockMonth != null) {
                var y = parseInt(cordaoRecLockYear, 10);
                var mo = parseInt(cordaoRecLockMonth, 10);
                if (!isNaN(y) && !isNaN(mo) && mo >= 1 && mo <= 12) {
                    var now = new Date();
                    var lastDay = new Date(y, mo, 0).getDate();
                    var day = Math.min(now.getDate(), lastDay);
                    fillCordaoRecModalFromDate(new Date(y, mo - 1, day, now.getHours(), now.getMinutes(), now.getSeconds()));
                    return;
                }
            }
            fillCordaoRecModalFromDate(new Date());
        });
        if (saveBtn) saveBtn.addEventListener('click', submitCordaoRecModal);
        dlg.addEventListener('wheel', function (e) {
            var card = e.target.closest('.melihelp-upload-dt-card');
            if (!card || !dlg.contains(card)) return;
            var inp = card.querySelector('.melihelp-upload-dt-input');
            if (!inp) return;
            e.preventDefault();
            var step = e.deltaY > 0 ? -1 : 1;
            spinCordaoRecField(inp.id, step);
        }, { passive: false });
        dlg.querySelectorAll('.melihelp-upload-dt-input').forEach(function (inp) {
            if (dlg.contains(inp)) inp.addEventListener('blur', function () { normalizeCordaoRecModalInput(inp); });
        });
    }

    function isCordaoRecEditModalOpen() {
        var bd = $('melihelp-cordao-rec-edit-backdrop');
        return !!(bd && !bd.hidden);
    }

    function closeCordaoRecEditModal() {
        var bd = $('melihelp-cordao-rec-edit-backdrop');
        if (bd) bd.hidden = true;
        cordaoRecEditRecordId = null;
    }

    function closeCordaoRecDeleteConfirm() {
        cordaoRecDeletePendingId = null;
        var bd = $('melihelp-cordao-rec-delete-backdrop');
        if (bd) bd.hidden = true;
    }

    function openCordaoRecDeleteConfirm(id) {
        if (id == null || String(id) === '') return;
        cordaoRecDeletePendingId = String(id);
        var bd = $('melihelp-cordao-rec-delete-backdrop');
        if (!bd) return;
        bd.hidden = false;
    }

    function submitCordaoRecDeleteConfirm() {
        var id = cordaoRecDeletePendingId;
        closeCordaoRecDeleteConfirm();
        if (id && removeCordaoRecebimentoById(id)) render();
    }

    function initMelihelpCordaoRecDeleteConfirm() {
        var bd = $('melihelp-cordao-rec-delete-backdrop');
        var dlg = bd ? bd.querySelector('.melihelp-upload-modal-dialog') : null;
        var closeB = $('melihelp-cordao-rec-delete-close');
        var cancel = $('melihelp-cordao-rec-delete-cancel');
        var confirmB = $('melihelp-cordao-rec-delete-confirm');
        if (!bd) return;
        bd.addEventListener('click', function (e) {
            if (e.target === bd) closeCordaoRecDeleteConfirm();
        });
        if (closeB) closeB.addEventListener('click', closeCordaoRecDeleteConfirm);
        if (cancel) cancel.addEventListener('click', closeCordaoRecDeleteConfirm);
        if (confirmB) confirmB.addEventListener('click', submitCordaoRecDeleteConfirm);
        if (dlg) dlg.addEventListener('click', function (e) { e.stopPropagation(); });
    }

    function closeCordaoRetiradaDeleteConfirm() {
        cordaoRetiradaDeletePendingId = null;
        var bd = $('melihelp-cordao-ret-delete-backdrop');
        if (bd) bd.hidden = true;
    }

    function openCordaoRetiradaDeleteConfirm(id) {
        if (id == null || String(id) === '') return;
        cordaoRetiradaDeletePendingId = String(id);
        var bd = $('melihelp-cordao-ret-delete-backdrop');
        if (!bd) return;
        bd.hidden = false;
    }

    function submitCordaoRetiradaDeleteConfirm() {
        var id = cordaoRetiradaDeletePendingId;
        closeCordaoRetiradaDeleteConfirm();
        if (id && removeCordaoRetiradaById(id)) render();
    }

    function initMelihelpCordaoRetiradaDeleteConfirm() {
        var bd = $('melihelp-cordao-ret-delete-backdrop');
        var dlg = bd ? bd.querySelector('.melihelp-upload-modal-dialog') : null;
        var closeB = $('melihelp-cordao-ret-delete-close');
        var cancel = $('melihelp-cordao-ret-delete-cancel');
        var confirmB = $('melihelp-cordao-ret-delete-confirm');
        if (!bd) return;
        bd.addEventListener('click', function (e) {
            if (e.target === bd) closeCordaoRetiradaDeleteConfirm();
        });
        if (closeB) closeB.addEventListener('click', closeCordaoRetiradaDeleteConfirm);
        if (cancel) cancel.addEventListener('click', closeCordaoRetiradaDeleteConfirm);
        if (confirmB) confirmB.addEventListener('click', submitCordaoRetiradaDeleteConfirm);
        if (dlg) dlg.addEventListener('click', function (e) { e.stopPropagation(); });
    }

    function fillCordaoRecEditModalFromDate(d) {
        var h = $('melihelp-cordao-rec-edit-hour');
        var mi = $('melihelp-cordao-rec-edit-min');
        var s = $('melihelp-cordao-rec-edit-sec');
        var day = $('melihelp-cordao-rec-edit-day');
        var mo = $('melihelp-cordao-rec-edit-month');
        var y = $('melihelp-cordao-rec-edit-year');
        if (!h || !mi || !s || !day || !mo || !y) return;
        h.value = pad2(d.getHours());
        mi.value = pad2(d.getMinutes());
        s.value = pad2(d.getSeconds());
        day.value = pad2(d.getDate());
        mo.value = pad2(d.getMonth() + 1);
        y.value = String(d.getFullYear());
    }

    function spinCordaoRecEditField(inputId, delta) {
        var el = $(inputId);
        if (!el) return;
        var min = parseInt(el.getAttribute('min'), 10);
        var max = parseInt(el.getAttribute('max'), 10);
        if (isNaN(min)) min = 0;
        if (isNaN(max)) max = 9999;
        var cur = clampIntUpload(el.value, min, max);
        var next = cur + delta;
        if (next < min) next = min;
        if (next > max) next = max;
        if (el.id === 'melihelp-cordao-rec-edit-year') el.value = String(next);
        else el.value = pad2(next);
    }

    function normalizeCordaoRecEditInput(el) {
        if (!el) return;
        var min = parseInt(el.getAttribute('min'), 10);
        var max = parseInt(el.getAttribute('max'), 10);
        var v = clampIntUpload(el.value, min, max);
        if (el.id === 'melihelp-cordao-rec-edit-year') el.value = String(v);
        else el.value = pad2(v);
    }

    function parseCordaoRecEditModalToIso() {
        var hEl = $('melihelp-cordao-rec-edit-hour');
        var miEl = $('melihelp-cordao-rec-edit-min');
        var sEl = $('melihelp-cordao-rec-edit-sec');
        var dEl = $('melihelp-cordao-rec-edit-day');
        var moEl = $('melihelp-cordao-rec-edit-month');
        var yEl = $('melihelp-cordao-rec-edit-year');
        if (!hEl || !miEl || !sEl || !dEl || !moEl || !yEl) return null;
        var hh = clampIntUpload(hEl.value, 0, 23);
        var mi = clampIntUpload(miEl.value, 0, 59);
        var s = clampIntUpload(sEl.value, 0, 59);
        var d = clampIntUpload(dEl.value, 1, 31);
        var mo = clampIntUpload(moEl.value, 1, 12);
        var y = clampIntUpload(yEl.value, 1900, 2100);
        hEl.value = pad2(hh);
        miEl.value = pad2(mi);
        sEl.value = pad2(s);
        dEl.value = pad2(d);
        moEl.value = pad2(mo);
        yEl.value = String(y);
        var dt = new Date(y, mo - 1, d, hh, mi, s, 0);
        if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
        return dt.toISOString();
    }

    function openCordaoRecEditModal(id) {
        var list = loadCordaoRecebimentos();
        var row = null;
        var i;
        for (i = 0; i < list.length; i++) {
            if (String(list[i].id) === String(id)) {
                row = list[i];
                break;
            }
        }
        if (!row) return;
        cordaoRecEditRecordId = String(id);
        var d = new Date(row.recebidoAt);
        if (isNaN(d.getTime())) d = new Date();
        fillCordaoRecEditModalFromDate(d);
        var qEl = $('melihelp-cordao-rec-edit-qty');
        if (qEl) qEl.value = row.quantidade != null ? String(row.quantidade) : '1';
        var bd = $('melihelp-cordao-rec-edit-backdrop');
        if (bd) bd.hidden = false;
        setTimeout(function () {
            if (qEl) qEl.focus();
        }, 30);
    }

    function submitCordaoRecEditModal() {
        if (!cordaoRecEditRecordId) return;
        var qEl = $('melihelp-cordao-rec-edit-qty');
        var q = parseCordaoQuantidade(qEl && qEl.value);
        if (q == null) {
            showToast('Informe uma quantidade válida (número inteiro a partir de 1).');
            return;
        }
        var iso = parseCordaoRecEditModalToIso();
        if (!iso) {
            showToast('Data inválida para o mês (ex.: 31 em fevereiro). Ajuste dia ou mês.');
            return;
        }
        var list = loadCordaoRecebimentos();
        var changed = false;
        for (var j = 0; j < list.length; j++) {
            if (String(list[j].id) === String(cordaoRecEditRecordId)) {
                list[j].quantidade = q;
                list[j].recebidoAt = iso;
                changed = true;
                break;
            }
        }
        if (!changed) return;
        if (!saveCordaoRecebimentos(list)) return;
        showToast('Registro atualizado.');
        closeCordaoRecEditModal();
        render();
    }

    function initMelihelpCordaoRecEditModal() {
        var bd = $('melihelp-cordao-rec-edit-backdrop');
        var dlg = $('melihelp-cordao-rec-edit-dialog');
        var closeB = $('melihelp-cordao-rec-edit-close');
        var cancel = $('melihelp-cordao-rec-edit-cancel');
        var saveBtn = $('melihelp-cordao-rec-edit-save');
        if (!bd || !dlg) return;
        bd.addEventListener('click', function (e) {
            if (e.target === bd) closeCordaoRecEditModal();
        });
        dlg.addEventListener('click', function (e) {
            var spin = e.target.closest('[data-melihelp-cordao-rec-edit-spin]');
            if (spin) {
                var sid = spin.getAttribute('data-melihelp-cordao-rec-edit-spin');
                var d = parseInt(spin.getAttribute('data-melihelp-cordao-rec-edit-spin-delta'), 10);
                if (sid && !isNaN(d)) spinCordaoRecEditField(sid, d);
            }
            e.stopPropagation();
        });
        if (closeB) closeB.addEventListener('click', closeCordaoRecEditModal);
        if (cancel) cancel.addEventListener('click', closeCordaoRecEditModal);
        if (saveBtn) saveBtn.addEventListener('click', submitCordaoRecEditModal);
        dlg.addEventListener('wheel', function (e) {
            var card = e.target.closest('.melihelp-upload-dt-card');
            if (!card || !dlg.contains(card)) return;
            var inp = card.querySelector('.melihelp-upload-dt-input');
            if (!inp) return;
            e.preventDefault();
            var step = e.deltaY > 0 ? -1 : 1;
            spinCordaoRecEditField(inp.id, step);
        }, { passive: false });
        dlg.querySelectorAll('.melihelp-upload-dt-input').forEach(function (inp) {
            if (dlg.contains(inp)) inp.addEventListener('blur', function () { normalizeCordaoRecEditInput(inp); });
        });
    }

    function renderCordaoRecebimentoMonth(route) {
        if (!route || !route.year || !route.month) {
            setRoute('cordao');
            return;
        }
        var filterYear = route.year;
        var filterMonth = route.month;
        var mlabel = monthLabel(filterMonth);
        var main = $('melihelp-main');
        var list = loadCordaoRecebimentos()
            .filter(function (row) {
                return cordaoRowInMonth(row.recebidoAt, filterYear, filterMonth);
            })
            .sort(function (a, b) {
                return String(b.recebidoAt || '').localeCompare(String(a.recebidoAt || ''));
            });
        var totalMes = 0;
        list.forEach(function (r) {
            var n = parseInt(r.quantidade, 10);
            if (!isNaN(n) && n > 0) totalMes += n;
        });

        var tbody = list.length
            ? list.map(function (row) {
                var p = formatCordaoDateParts(row.recebidoAt);
                var orig = row.source === 'manual' ? 'Manual' : 'Automático';
                var qtd = row.quantidade != null ? row.quantidade : '—';
                return '<tr>' +
                    '<td>' + esc(p.dateStr) + '</td>' +
                    '<td>' + esc(p.timeStr) + '</td>' +
                    '<td><strong>' + esc(String(qtd)) + '</strong></td>' +
                    '<td><span class="melihelp-cordao-origem">' + esc(orig) + '</span></td>' +
                    '<td><div class="melihelp-cordao-rec-row-actions">' +
                    '<button type="button" class="melihelp-btn melihelp-btn-ghost melihelp-btn-text-upper melihelp-cordao-rec-edit-open" data-id="' + escAttr(row.id) + '">EDITAR</button>' +
                    '<button type="button" class="melihelp-btn melihelp-btn-danger melihelp-btn-icon-only melihelp-cordao-rec-delete" data-id="' + escAttr(row.id) + '" title="Excluir registo" aria-label="Excluir este registo de recebimento"><i class="fas fa-trash-alt" aria-hidden="true"></i></button>' +
                    '</div></td>' +
                    '</tr>';
            }).join('')
            : '';

        var statCard =
            '<div class="melihelp-cordao-rec-stat-card glass-panel" role="status" aria-live="polite">' +
            '<span class="melihelp-cordao-rec-stat-val" id="melihelp-cordao-rec-stat-val">' + esc(String(totalMes)) + '</span>' +
            '<span class="melihelp-cordao-rec-stat-label">Total recebido</span>' +
            '</div>';

        var scrollExtraClassRec = list.length ? '' : ' melihelp-cordao-table-scroll--empty';
        var tableBlock =
            '<div class="melihelp-cordao-table-wrap">' +
            '<div class="melihelp-cordao-table-scroll' + scrollExtraClassRec + '">' +
            '<table class="melihelp-cordao-table">' +
            '<thead><tr>' +
            '<th>DATA</th><th>HORA</th><th>QUANTIDADE</th><th>ORIGEM</th><th>CONTROLES</th>' +
            '</tr></thead><tbody>' + tbody + '</tbody></table></div></div>';

        main.innerHTML =
            '<section class="melihelp-panel glass-panel melihelp-cordao-panel melihelp-cordao-month-panel">' +
            '<div class="melihelp-cordao-month-head">' +
            '<h2 class="melihelp-cordao-month-h2">RECEBIMENTO DE CORDÕES</h2>' +
            '<p class="melihelp-cordao-month-subline">' + esc(mlabel) + ' DE ' + esc(filterYear) + '</p>' +
            '<p class="melihelp-cordao-lead melihelp-cordao-lead--prosa melihelp-cordao-lead--tight melihelp-cordao-lead--upper">Esta página mostra os recebimentos do mês e ano que aparecem no título. O campo <strong>quantidade recebida</strong> é onde você indica quantos cordões entraram naquele lançamento. <strong>Registar agora</strong> grava com a data e hora atuais (mantendo o mês desta página quando o calendário for outro). <strong>Data e hora</strong> abre o ajuste manual do instante, útil para repor valores da planilha (2025, 2026 ou outro período). A tabela lista cada entrada; <strong>Editar</strong> corrige quantidade ou data; o ícone de lixeira envia o registo para a <strong>lixeira</strong> (30 dias, com restauração). As saídas de colaboradores continuam na área de retiradas.</p>' +
            '<div class="melihelp-cordao-quick glass-panel melihelp-cordao-quick--recebimento">' +
            '<div class="melihelp-cordao-quick-title melihelp-cordao-rec-quick-heading">REGISTO DE ENTRADA</div>' +
            '<div class="melihelp-cordao-rec-form-row">' +
            '<div class="melihelp-cordao-rec-entry-stack">' +
            '<div class="melihelp-cordao-rec-qty-block">' +
            '<label class="melihelp-cordao-field-label melihelp-cordao-rec-qty-label" for="melihelp-cordao-rec-quick-qty">QUANTIDADE RECEBIDA</label>' +
            '<input type="number" id="melihelp-cordao-rec-quick-qty" class="melihelp-cordao-text-input melihelp-cordao-quick-input melihelp-cordao-rec-qty-input-full" inputmode="numeric" min="1" max="999999" step="1" placeholder="Ex.: 50">' +
            '</div>' +
            '<div class="melihelp-cordao-quick-actions melihelp-cordao-rec-actions-btns">' +
            '<button type="button" class="melihelp-btn melihelp-btn-primary melihelp-btn-text-upper melihelp-cordao-rec-btn-now" id="melihelp-cordao-rec-quick-now">REGISTRAR AGORA</button>' +
            '<button type="button" class="melihelp-btn melihelp-btn-ghost melihelp-btn-text-upper" id="melihelp-cordao-rec-open-modal">DATA E HORA</button>' +
            '</div>' +
            '</div>' +
            statCard +
            '</div></div>' +
            tableBlock +
            '</section>';

        var qIn = $('melihelp-cordao-rec-quick-qty');
        $('melihelp-cordao-rec-quick-now').addEventListener('click', function () {
            var q = parseCordaoQuantidade(qIn && qIn.value);
            if (q == null) {
                showToast('Informe uma quantidade válida (número inteiro a partir de 1).');
                return;
            }
            if (addCordaoRecebimento(q, cordaoStampForViewedMonth(filterYear, filterMonth), 'auto')) {
                if (qIn) qIn.value = '';
                render();
            }
        });
        $('melihelp-cordao-rec-open-modal').addEventListener('click', function () {
            openCordaoRecModal(filterYear, filterMonth, qIn && qIn.value);
        });
        main.querySelectorAll('.melihelp-cordao-rec-edit-open').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.getAttribute('data-id');
                if (id) openCordaoRecEditModal(id);
            });
        });
        main.querySelectorAll('.melihelp-cordao-rec-delete').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.getAttribute('data-id');
                if (!id) return;
                openCordaoRecDeleteConfirm(id);
            });
        });
    }

    function render() {
        try {
            if (typeof window !== 'undefined' && window._mhAvulsoWPollId != null) {
                clearInterval(window._mhAvulsoWPollId);
                window._mhAvulsoWPollId = null;
            }
        } catch (ePollClear) { /* ignorar */ }
        clearCadastroDestinoTicker();
        clearAtasAvulsoCadastroTicker();
        purgeExpiredTrash();
        var route = parseRoute();
        document.body.classList.toggle('melihelp-route-home', route.type === 'home');
        if (route.type !== 'docs_trash') stopTrashCountdownTimer();
        highlightNav(route);

        var metaKeys = docKeysMetaOnlyForRoute(route);
        var fullKeys = docKeysFullLoadForRoute(route);
        var wait = [];
        var wi;
        for (wi = 0; wi < metaKeys.length; wi++) wait.push(ensureFolderMetaLoaded(metaKeys[wi]));
        for (wi = 0; wi < fullKeys.length; wi++) wait.push(ensureFolderFullLoaded(fullKeys[wi]));
        var needAvulsoPull =
            route.type === 'atas_cadastrar_cartao' ||
            route.type === 'dash_atas' ||
            (route.type === 'docs' && isAtasAvulsoWTableRoute(route));
        if (needAvulsoPull) wait.push(pullAtasAvulsoWFromServerPromise());

        function paint() {
            if (route.type === 'home') renderHome();
            else if (route.type === 'emissao_cracha') {
                var mainEm = $('melihelp-main');
                if (window.melihelpCrachaEditor && typeof window.melihelpCrachaEditor.render === 'function') {
                    window.melihelpCrachaEditor.render(mainEm);
                } else if (mainEm) {
                    mainEm.innerHTML =
                        '<section class="melihelp-panel glass-panel"><p class="melihelp-upload-modal-hint">Editor de crachá indisponível. Confirme que os scripts carregaram e recarregue a página.</p></section>';
                }
            } else if (route.type === 'dash_certificados') renderCertificadosDashboard();
            else if (route.type === 'certificados_cadastrar') renderCertificadosCadastrar();
            else if (route.type === 'certificados_unidade_wip') renderCertificadosUnidadeWip(route.unidade);
            else if (route.type === 'certificados_month') renderCertificadosMonth(route.year, route.month);
            else if (route.type === 'certificados_all_desativados') renderCertificadosAllDesativados();
            else if (route.type === 'dash_cordao') renderCordaoDashboard();
            else if (route.type === 'cordao_retiradas') renderCordaoMonth(route);
            else if (route.type === 'cordao_recebimento') renderCordaoRecebimentoMonth(route);
            else if (route.type === 'dash_orcamentos') {
                renderDocsCategoryDashboard('orcamentos', ['2025', '2026'], 'CORDÃO · ARQUIVOS', [
                    'CORDÕES GUARDADOS',
                    'SAÍDA DE CORDÕES',
                    'ENTRADA DE CORDÕES'
                ]);
            } else if (route.type === 'atas_cadastrar_cartao') renderAtasCadastrarCartao();
            else if (route.type === 'dash_atas') {
                renderDocsCategoryDashboard('atas', ['2026'], 'CARTÃO AVULSO', {
                    statLabels: ['Arquivos guardados', 'Meses com conteúdo', 'ENTRADA DE CARTÃO'],
                    statFormats: ['count', 'count', 'count']
                });
            } else if (route.type === 'docs_trash') renderTrash();
            else if (route.type === 'docs') renderDocs(route);
            else renderHome();
        }

        if (!wait.length) paint();
        else Promise.all(wait).then(paint, paint);
    }

    function clampIntUpload(val, min, max) {
        var n = parseInt(String(val).replace(/\D/g, ''), 10);
        if (isNaN(n)) n = min;
        if (n < min) n = min;
        if (n > max) n = max;
        return n;
    }

    function fillMelihelpUploadModalFromDate(d) {
        var h = $('melihelp-upload-hour');
        var mi = $('melihelp-upload-min');
        var s = $('melihelp-upload-sec');
        var day = $('melihelp-upload-day');
        var mo = $('melihelp-upload-month');
        var y = $('melihelp-upload-year');
        if (!h || !mi || !s || !day || !mo || !y) return;
        h.value = pad2(d.getHours());
        mi.value = pad2(d.getMinutes());
        s.value = pad2(d.getSeconds());
        day.value = pad2(d.getDate());
        mo.value = pad2(d.getMonth() + 1);
        y.value = String(d.getFullYear());
    }

    function spinMelihelpUploadField(inputId, delta) {
        var el = $(inputId);
        if (!el) return;
        var min = parseInt(el.getAttribute('min'), 10);
        var max = parseInt(el.getAttribute('max'), 10);
        if (isNaN(min)) min = 0;
        if (isNaN(max)) max = 9999;
        var cur = clampIntUpload(el.value, min, max);
        var next = cur + delta;
        if (next < min) next = min;
        if (next > max) next = max;
        if (el.id === 'melihelp-upload-year') el.value = String(next);
        else el.value = pad2(next);
    }

    function normalizeMelihelpUploadInput(el) {
        if (!el) return;
        var min = parseInt(el.getAttribute('min'), 10);
        var max = parseInt(el.getAttribute('max'), 10);
        var v = clampIntUpload(el.value, min, max);
        if (el.id === 'melihelp-upload-year') el.value = String(v);
        else el.value = pad2(v);
    }

    function parseMelihelpUploadModalToIso() {
        var hEl = $('melihelp-upload-hour');
        var miEl = $('melihelp-upload-min');
        var sEl = $('melihelp-upload-sec');
        var dEl = $('melihelp-upload-day');
        var moEl = $('melihelp-upload-month');
        var yEl = $('melihelp-upload-year');
        if (!hEl || !miEl || !sEl || !dEl || !moEl || !yEl) return null;
        var h = clampIntUpload(hEl.value, 0, 23);
        var mi = clampIntUpload(miEl.value, 0, 59);
        var s = clampIntUpload(sEl.value, 0, 59);
        var d = clampIntUpload(dEl.value, 1, 31);
        var mo = clampIntUpload(moEl.value, 1, 12);
        var y = clampIntUpload(yEl.value, 1900, 2100);
        hEl.value = pad2(h);
        miEl.value = pad2(mi);
        sEl.value = pad2(s);
        dEl.value = pad2(d);
        moEl.value = pad2(mo);
        yEl.value = String(y);
        var dt = new Date(y, mo - 1, d, h, mi, s, 0);
        if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) {
            return null;
        }
        return dt.toISOString();
    }

    function isMelihelpUploadModalOpen() {
        var bd = $('melihelp-upload-modal-backdrop');
        return !!(bd && !bd.hidden);
    }

    function closeMelihelpUploadModal(clearPending) {
        var bd = $('melihelp-upload-modal-backdrop');
        if (bd) bd.hidden = true;
        if (clearPending !== false) pendingUploadStampIso = null;
    }

    function openMelihelpUploadModal() {
        if (!pendingUploadTarget || !pendingUploadTarget.key) {
            showToast('Abra uma pasta com arquivos antes de adicionar.');
            return;
        }
        pendingUploadStampIso = null;
        fillMelihelpUploadModalFromDate(new Date());
        var bd = $('melihelp-upload-modal-backdrop');
        if (bd) bd.hidden = false;
    }

    function initMelihelpUploadModal() {
        var bd = $('melihelp-upload-modal-backdrop');
        var dlg = $('melihelp-upload-modal-dialog');
        var pick = $('melihelp-upload-modal-pick');
        var cancel = $('melihelp-upload-modal-cancel');
        var nowBtn = $('melihelp-upload-modal-now');
        var closeB = $('melihelp-upload-modal-close');
        if (!bd || !dlg) return;
        bd.addEventListener('click', function (e) {
            if (e.target === bd) closeMelihelpUploadModal();
        });
        dlg.addEventListener('click', function (e) {
            var spin = e.target.closest('[data-melihelp-spin]');
            if (spin) {
                var sid = spin.getAttribute('data-melihelp-spin');
                var d = parseInt(spin.getAttribute('data-melihelp-spin-delta'), 10);
                if (sid && !isNaN(d)) spinMelihelpUploadField(sid, d);
            }
            e.stopPropagation();
        });
        if (closeB) closeB.addEventListener('click', function () { closeMelihelpUploadModal(); });
        if (cancel) cancel.addEventListener('click', function () { closeMelihelpUploadModal(); });
        if (nowBtn) nowBtn.addEventListener('click', function () {
            fillMelihelpUploadModalFromDate(new Date());
        });
        dlg.addEventListener('wheel', function (e) {
            var card = e.target.closest('.melihelp-upload-dt-card');
            if (!card || !dlg.contains(card)) return;
            var inp = card.querySelector('.melihelp-upload-dt-input');
            if (!inp) return;
            e.preventDefault();
            var step = e.deltaY > 0 ? -1 : 1;
            spinMelihelpUploadField(inp.id, step);
        }, { passive: false });
        dlg.querySelectorAll('.melihelp-upload-dt-input').forEach(function (inp) {
            inp.addEventListener('blur', function () { normalizeMelihelpUploadInput(inp); });
        });
        if (pick) pick.addEventListener('click', function () {
            var iso = parseMelihelpUploadModalToIso();
            if (!iso) {
                showToast('Data inválida para o mês (ex.: 31 em fevereiro). Ajuste dia ou mês.');
                return;
            }
            pendingUploadStampIso = iso;
            bd.hidden = true;
            var fi = $('melihelp-file-input');
            if (fi) fi.click();
        });
    }

    function onFilesSelected(e) {
        var input = e.target;
        var files = input.files;
        if (!files || !files.length || !pendingUploadTarget) {
            pendingUploadStampIso = null;
            input.value = '';
            return;
        }
        if (melihelpUploadBusy) {
            pendingUploadStampIso = null;
            showToast('Aguarde o envio do lote anterior terminar.');
            input.value = '';
            return;
        }
        var batchStampIso = pendingUploadStampIso;
        pendingUploadStampIso = null;
        melihelpUploadBusy = true;
        var key = pendingUploadTarget.key;
        var remaining = Array.prototype.slice.call(files);
        var totalPicked = remaining.length;
        var i = 0;
        var addedCount = 0;
        var skippedBig = 0;
        var list = null;

        function finishBatch() {
            melihelpUploadBusy = false;
            input.value = '';
            render();
            if (addedCount > 0) {
                var msg = addedCount + ' arquivo(s) adicionado(s).';
                if (totalPicked > addedCount + skippedBig) {
                    msg += ' (' + totalPicked + ' selecionados no total — alguns falharam leitura ou armazenamento.)';
                } else if (skippedBig > 0) {
                    msg += ' ' + skippedBig + ' ignorado(s) por tamanho.';
                }
                showToast(msg);
            } else if (totalPicked > 0 && skippedBig === totalPicked) {
                showToast('Nenhum arquivo guardado: todos acima do limite de tamanho.');
            } else if (totalPicked > 0) {
                showToast('Nenhum arquivo foi guardado (erro de leitura ou armazenamento).');
            }
        }

        function next() {
            if (i >= remaining.length) {
                finishBatch();
                return;
            }
            var file = remaining[i];
            i++;
            if (file.size > MAX_FILE_BYTES) {
                skippedBig++;
                showToast('Ignorado (acima de ~' + Math.round(MAX_FILE_BYTES / (1024 * 1024)) + ' MB): ' + file.name);
                next();
                return;
            }
            var reader = new FileReader();
            reader.onload = function () {
                var doc = {
                    id: String(Date.now()) + '_' + Math.random().toString(36).slice(2, 10),
                    name: file.name,
                    mime: file.type || 'application/octet-stream',
                    size: file.size,
                    addedAt: batchStampIso || new Date().toISOString(),
                    dataUrl: reader.result
                };
                var nextList = list.concat([doc]);
                saveDocsAsync(key, nextList).then(function (ok) {
                    if (!ok) {
                        melihelpUploadBusy = false;
                        input.value = '';
                        render();
                        showToast('Armazenamento cheio ao guardar "' + file.name + '". Os ficheiros anteriores deste lote já ficaram guardados; liberte espaço no navegador ou apague arquivos.');
                        return;
                    }
                    list = nextList;
                    addedCount++;
                    next();
                });
            };
            reader.onerror = function () {
                showToast('Erro ao ler: ' + file.name);
                next();
            };
            reader.readAsDataURL(file);
        }

        initMelihelpDocsStorage().then(function () {
            list = loadDocs(key).slice();
            next();
        });
    }

    function openDrawer() {
        $('melihelp-drawer').hidden = false;
        $('melihelp-overlay').hidden = false;
        requestAnimationFrame(function () {
            $('melihelp-drawer').classList.add('is-open');
            $('melihelp-overlay').classList.add('is-visible');
        });
        $('melihelp-menu-open').setAttribute('aria-expanded', 'true');
    }

    function closeDrawer() {
        $('melihelp-drawer').classList.remove('is-open');
        $('melihelp-overlay').classList.remove('is-visible');
        $('melihelp-menu-open').setAttribute('aria-expanded', 'false');
        setTimeout(function () {
            if (!$('melihelp-drawer').classList.contains('is-open')) {
                $('melihelp-drawer').hidden = true;
                $('melihelp-overlay').hidden = true;
            }
        }, 400);
    }

    function initTheme() {
        var t = localStorage.getItem(NS + '_theme') || 'light';
        document.documentElement.setAttribute('data-melihelp-theme', t === 'dark' ? 'dark' : 'light');
        updateThemeIcon();
    }

    function toggleTheme() {
        var cur = document.documentElement.getAttribute('data-melihelp-theme') === 'dark' ? 'dark' : 'light';
        var next = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-melihelp-theme', next);
        localStorage.setItem(NS + '_theme', next);
        updateThemeIcon();
    }

    function updateThemeIcon() {
        var icon = $('melihelp-theme-icon');
        if (!icon) return;
        var dark = document.documentElement.getAttribute('data-melihelp-theme') === 'dark';
        icon.className = dark ? 'fas fa-sun' : 'fas fa-moon';
    }

    function init() {
        initTheme();

        var nav = $('melihelp-nav-root');
        if (nav) {
            nav.innerHTML = buildNavHtml();
            var backHome = $('melihelp-nav-back-home');
            if (backHome) {
                backHome.addEventListener('click', function () {
                    try { sessionStorage.setItem('axis_voltar_force_main', '1'); } catch (e) {}
                    closeDrawer();
                });
            }
            var cordSum = $('melihelp-nav-summary-cordao');
            if (cordSum) {
                cordSum.addEventListener('click', function () {
                    setTimeout(function () { setRoute('cordao'); }, 0);
                });
                cordSum.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setRoute('cordao');
                    }
                });
            }
            var cadHistToggle = $('melihelp-nav-toggle-cadastro-historico');
            var cadHistPanel = $('melihelp-nav-cadastro-historico');
            if (cadHistToggle && cadHistPanel) {
                cadHistToggle.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var nowCollapsed = cadHistPanel.classList.toggle('melihelp-nav-historico-panel--collapsed');
                    cadHistToggle.setAttribute('aria-expanded', nowCollapsed ? 'false' : 'true');
                });
            }
            CRACHA_UNIDADES_CADASTRO.forEach(function (u) {
                var tid = 'melihelp-nav-toggle-unidade-' + u.id;
                var pid = 'melihelp-nav-panel-unidade-' + u.id;
                var tgl = document.getElementById(tid);
                var pnl = document.getElementById(pid);
                if (tgl && pnl) {
                    tgl.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        var nowCollapsed = pnl.classList.toggle('melihelp-nav-historico-panel--collapsed');
                        tgl.setAttribute('aria-expanded', nowCollapsed ? 'false' : 'true');
                    });
                }
            });
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

        $('melihelp-menu-open').addEventListener('click', openDrawer);
        $('melihelp-drawer-close').addEventListener('click', closeDrawer);
        $('melihelp-overlay').addEventListener('click', closeDrawer);

        $('melihelp-theme-toggle').addEventListener('click', toggleTheme);

        $('melihelp-file-input').addEventListener('change', onFilesSelected);

        window.addEventListener('hashchange', render);

        document.addEventListener('visibilitychange', function () {
            try {
                if (document.visibilityState !== 'visible') return;
                if (parseRoute().type !== 'certificados_cadastrar') return;
                refreshCadastroDestinoSubtitle();
            } catch (err) {
                /* ignorar */
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                if (isMelihelpUploadModalOpen()) {
                    closeMelihelpUploadModal();
                    return;
                }
                if (isCordaoModalOpen()) {
                    closeCordaoModal();
                    return;
                }
                if (isCordaoEditModalOpen()) {
                    closeCordaoEditModal();
                    return;
                }
                if (isCordaoRecModalOpen()) {
                    closeCordaoRecModal();
                    return;
                }
                if (isCordaoRecEditModalOpen()) {
                    closeCordaoRecEditModal();
                    return;
                }
                if (isRenameDocModalOpen()) {
                    closeRenameDocModal();
                    return;
                }
                closeDocPreview();
                closeDrawer();
            }
        });

        var prevBackdrop = $('melihelp-doc-preview');
        var prevDialog = $('melihelp-doc-preview-dialog');
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
        var prevClose = $('melihelp-doc-preview-close');
        if (prevClose) prevClose.addEventListener('click', closeDocPreview);

        var renBd = $('melihelp-rename-doc-backdrop');
        var renDlg = $('melihelp-rename-doc-dialog');
        if (renBd) {
            renBd.addEventListener('click', function (e) {
                if (e.target === renBd) closeRenameDocModal();
            });
        }
        if (renDlg) {
            renDlg.addEventListener('click', function (e) {
                e.stopPropagation();
            });
        }
        var renClose = $('melihelp-rename-doc-close');
        var renCancel = $('melihelp-rename-doc-cancel');
        var renSave = $('melihelp-rename-doc-save');
        var renInput = $('melihelp-rename-doc-input');
        if (renClose) renClose.addEventListener('click', closeRenameDocModal);
        if (renCancel) renCancel.addEventListener('click', closeRenameDocModal);
        if (renSave) renSave.addEventListener('click', submitRenameDocModal);
        if (renInput) {
            renInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    submitRenameDocModal();
                }
            });
        }

        initMelihelpUploadModal();
        initMelihelpCordaoModal();
        initMelihelpCordaoEditModal();
        initMelihelpCordaoRecModal();
        initMelihelpCordaoRecEditModal();
        initMelihelpCordaoRecDeleteConfirm();
        initMelihelpCordaoRetiradaDeleteConfirm();
        initMelihelpTrashPurgeModal();
        initMelihelpDocDeleteModal();

        var hash0 = location.hash || '';
        if (/^#\/assistente(\/|$)/i.test(hash0)) location.hash = '#/home';
        if (!location.hash || location.hash === '#') location.hash = '#/home';
        render();
    }

    /** API para integração futura (ex.: bot WhatsApp) — mesma chave em localStorage. */
    window.melihelpCordao = {
        storageKey: CORDAO_RETIRADAS_KEY,
        recebimentosStorageKey: CORDAO_RECEBIMENTOS_KEY,
        listar: loadCordaoRetiradas,
        listarRecebimentos: loadCordaoRecebimentos,
        stampIsoParaMesAno: function (yearStr, monthStr) {
            return cordaoStampForViewedMonth(yearStr, monthStr);
        },
        interpretarLinha: function (raw) {
            return interpretarLinhaCordao(raw);
        },
        registrar: function (re, nome, isoOptional, isManual, movimento) {
            var ok = addCordaoRetirada(re, nome, isoOptional, isManual ? 'manual' : 'auto', movimento || 'saida');
            if (ok) render();
            return ok;
        },
        registrarRecebimento: function (quantidade, isoOptional, isManual) {
            var ok = addCordaoRecebimento(quantidade, isoOptional, isManual ? 'manual' : 'auto');
            if (ok) render();
            return ok;
        },
        excluirRecebimentoPorId: function (id) {
            var ok = removeCordaoRecebimentoById(id);
            if (ok) {
                var rt = parseRoute();
                if (rt.type === 'dash_cordao' || rt.type === 'cordao_recebimento') render();
            }
            return ok;
        },
        excluirRetiradaPorId: function (id) {
            var ok = removeCordaoRetiradaById(id);
            if (ok) {
                var rt = parseRoute();
                if (rt.type === 'dash_cordao' || rt.type === 'cordao_retiradas') render();
            }
            return ok;
        }
    };

    window.melihelpHubMeta = {
        meses: MESES,
        crachaAnos: CRACHA_ANOS_MENU,
        cordAnos: ['2026', '2025']
    };

    window.melihelpHubUi = {
        openDocsUpload: function (category, year, month) {
            initMelihelpDocsStorage().then(function () {
                pendingUploadTarget = { key: docsStorageKey(category, year, month) };
                openMelihelpUploadModal();
            });
        },
        toast: showToast
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
