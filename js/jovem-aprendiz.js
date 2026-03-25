/**
 * Jovem Aprendiz — mapeamento de atividades
 * Armazenamento por ano/mês (padrão Selbetti orçamentos): axis_jovem_aprendiz_v1_atividades_YYYY_MM
 */
(function () {
    'use strict';

    var NS = 'axis_jovem_aprendiz_v1';
    var LEGACY_KEY = 'axis_jovem_aprendiz_atividades';
    var THEME_KEY = 'axis_jovem_aprendiz_theme';

    /** Aprendizes fixos no filtro (sempre visíveis, além dos nomes que aparecem nos registos) */
    var APRENDIZES_FILTRO_FIXOS = [
        'Gabriel Melo dos Santos',
        'Kamilly Flores da Silva',
        'Jeniffer Xavier de Jesus Assunção'
    ];

    var MESES = [
        { id: '01', label: 'Janeiro' }, { id: '02', label: 'Fevereiro' }, { id: '03', label: 'Março' },
        { id: '04', label: 'Abril' }, { id: '05', label: 'Maio' }, { id: '06', label: 'Junho' },
        { id: '07', label: 'Julho' }, { id: '08', label: 'Agosto' }, { id: '09', label: 'Setembro' },
        { id: '10', label: 'Outubro' }, { id: '11', label: 'Novembro' }, { id: '12', label: 'Dezembro' }
    ];

    var currentStep = 1;
    var totalSteps = 6;
    var viewingActivityId = null;

    function pad2(n) {
        return n < 10 ? '0' + n : String(n);
    }

    function storageKeyFromYMD(year, month) {
        return NS + '_atividades_' + year + '_' + month;
    }

    function storageKeyFromIso(iso) {
        var d = new Date(iso);
        if (isNaN(d.getTime())) {
            d = new Date();
        }
        return storageKeyFromYMD(String(d.getFullYear()), pad2(d.getMonth() + 1));
    }

    function loadJson(key, fallback) {
        try {
            var raw = localStorage.getItem(key);
            if (!raw) return fallback;
            var v = JSON.parse(raw);
            return v;
        } catch (e) {
            return fallback;
        }
    }

    function saveJson(key, val) {
        try {
            localStorage.setItem(key, JSON.stringify(val));
            return true;
        } catch (e) {
            toast('Armazenamento cheio ou indisponível.');
            return false;
        }
    }

    function migrateLegacyIfNeeded() {
        var leg = loadJson(LEGACY_KEY, null);
        if (!Array.isArray(leg) || leg.length === 0) return;
        leg.forEach(function (a) {
            if (!a || !a.id) return;
            var key = storageKeyFromIso(a.dataRegistro || new Date().toISOString());
            var arr = loadJson(key, []);
            if (!Array.isArray(arr)) arr = [];
            if (!arr.some(function (x) { return x && x.id === a.id; })) {
                if (!a.status) a.status = 'concluida';
                arr.unshift(a);
                saveJson(key, arr);
            }
        });
        try {
            localStorage.removeItem(LEGACY_KEY);
        } catch (e) {}
    }

    function listStorageKeysForActivities() {
        var keys = [];
        try {
            for (var i = 0; i < localStorage.length; i++) {
                var k = localStorage.key(i);
                if (k && k.indexOf(NS + '_atividades_') === 0) keys.push(k);
            }
        } catch (e) {}
        return keys;
    }

    function getAllActivitiesRaw() {
        var keys = listStorageKeysForActivities();
        var all = [];
        keys.forEach(function (k) {
            var arr = loadJson(k, []);
            if (Array.isArray(arr)) all = all.concat(arr);
        });
        var seen = {};
        return all.filter(function (a) {
            if (!a || !a.id) return false;
            if (seen[a.id]) return false;
            seen[a.id] = true;
            return true;
        });
    }

    function getActivitiesForMonth(year, month) {
        var key = storageKeyFromYMD(year, month);
        var arr = loadJson(key, []);
        return Array.isArray(arr) ? arr : [];
    }

    function saveMonthList(year, month, arr) {
        return saveJson(storageKeyFromYMD(year, month), arr);
    }

    function removeActivityById(id) {
        var keys = listStorageKeysForActivities();
        keys.forEach(function (k) {
            var arr = loadJson(k, []);
            if (!Array.isArray(arr)) return;
            var next = arr.filter(function (a) { return a && a.id !== id; });
            if (next.length !== arr.length) saveJson(k, next);
        });
    }

    function upsertActivity(activity) {
        removeActivityById(activity.id);
        var key = storageKeyFromIso(activity.dataRegistro);
        var arr = loadJson(key, []);
        if (!Array.isArray(arr)) arr = [];
        arr.unshift(activity);
        return saveJson(key, arr);
    }

    function getCurrentUser() {
        try {
            return (localStorage.getItem('current_user') || '').trim();
        } catch (e) {
            return '';
        }
    }

    function toast(msg) {
        var el = document.getElementById('ja-toast');
        if (!el) return;
        el.textContent = msg;
        el.hidden = false;
        el.classList.add('is-on');
        clearTimeout(toast._t);
        toast._t = setTimeout(function () {
            el.classList.remove('is-on');
            setTimeout(function () { el.hidden = true; }, 300);
        }, 2800);
    }

    function escapeHtml(str) {
        if (str == null) return '';
        var div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    }

    function formatarData(iso) {
        if (!iso) return '—';
        try {
            var d = new Date(iso);
            if (isNaN(d.getTime())) return '—';
            return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
        } catch (e) {
            return '—';
        }
    }

    function getModelo(tipo, a) {
        if (tipo === 'Notebook') return a.modeloNotebook || '';
        if (tipo === 'Handheld') return a.modeloHandheld || '';
        if (tipo === 'Scanner') return a.modeloScanner || '';
        return '';
    }

    function setModeloOnActivity(tipo, activity, modeloVal) {
        activity.modeloNotebook = '';
        activity.modeloHandheld = '';
        activity.modeloScanner = '';
        if (tipo === 'Notebook') activity.modeloNotebook = modeloVal;
        else if (tipo === 'Handheld') activity.modeloHandheld = modeloVal;
        else if (tipo === 'Scanner') activity.modeloScanner = modeloVal;
    }

    function statusLabel(s) {
        if (s === 'em_andamento') return 'Em andamento';
        if (s === 'pausada') return 'Pausada';
        return 'Concluída';
    }

    function statusClass(s) {
        if (s === 'em_andamento') return 'ja-badge--doing';
        if (s === 'pausada') return 'ja-badge--pause';
        return 'ja-badge--done';
    }

    function collectFilterActivities() {
        var all = getAllActivitiesRaw();
        var y = document.getElementById('ja-filter-year');
        var mo = document.getElementById('ja-filter-month');
        var st = document.getElementById('ja-filter-status');
        var nome = document.getElementById('ja-filter-nome');
        var search = document.getElementById('ja-search');

        var yVal = (y && y.value) ? y.value : '';
        var mVal = (mo && mo.value) ? mo.value : '';
        var stVal = (st && st.value) ? st.value : '';
        var nomeVal = (nome && nome.value) ? nome.value : '';
        var tipoTarefaFiltro = document.getElementById('ja-filter-tipo');
        var tipoTVal = (tipoTarefaFiltro && tipoTarefaFiltro.value) ? tipoTarefaFiltro.value : '';
        var q = (search && search.value) ? search.value.trim().toLowerCase() : '';

        return all.filter(function (a) {
            if (!a) return false;
            var d = new Date(a.dataRegistro);
            if (yVal && String(d.getFullYear()) !== yVal) return false;
            if (mVal && pad2(d.getMonth() + 1) !== mVal) return false;
            if (stVal && (a.status || 'concluida') !== stVal) return false;
            if (tipoTVal && (a.tipoTarefa || '') !== tipoTVal) return false;
            if (nomeVal && (a.nomeAprendiz || '') !== nomeVal) return false;
            if (q) {
                var blob = [
                    a.nomeAprendiz, a.tarefasDoDia, a.tipoEquipamento, getModelo(a.tipoEquipamento, a),
                    a.numeroSerie, a.tipoTarefa, a.resumoTarefa, a.defeito, a.observacao, statusLabel(a.status)
                ].join(' ').toLowerCase();
                if (blob.indexOf(q) < 0) return false;
            }
            return true;
        }).sort(function (a, b) {
            return new Date(b.dataRegistro) - new Date(a.dataRegistro);
        });
    }

    function fillYearMonthFilters() {
        var all = getAllActivitiesRaw();
        var years = {};
        all.forEach(function (a) {
            var d = new Date(a.dataRegistro);
            if (!isNaN(d.getTime())) years[String(d.getFullYear())] = true;
        });
        var yList = Object.keys(years).sort(function (a, b) { return parseInt(b, 10) - parseInt(a, 10); });
        var now = new Date();
        var cy = String(now.getFullYear());
        if (yList.indexOf(cy) < 0) yList.unshift(cy);
        var selY = document.getElementById('ja-filter-year');
        var selM = document.getElementById('ja-filter-month');
        if (!selY || !selM) return;
        var prevY = selY.value;
        selY.innerHTML = yList.map(function (y) {
            return '<option value="' + escapeHtml(y) + '">' + escapeHtml(y) + '</option>';
        }).join('');
        if (prevY && yList.indexOf(prevY) >= 0) selY.value = prevY;
        else selY.value = cy;

        var prevM = selM.value;
        selM.innerHTML = MESES.map(function (m) {
            return '<option value="' + m.id + '">' + escapeHtml(m.label) + '</option>';
        }).join('');
        var cm = pad2(now.getMonth() + 1);
        if (prevM && MESES.some(function (x) { return x.id === prevM; })) selM.value = prevM;
        else selM.value = cm;

        rebuildJaSelectDropdown('ja-filter-year');
        rebuildJaSelectDropdown('ja-filter-month');
    }

    function fillNomeFilter() {
        var sel = document.getElementById('ja-filter-nome');
        if (!sel) return;
        var all = getAllActivitiesRaw();
        var extra = {};
        all.forEach(function (a) {
            var n = (a.nomeAprendiz || '').trim();
            if (n) extra[n] = true;
        });
        var opts = APRENDIZES_FILTRO_FIXOS.slice();
        Object.keys(extra).forEach(function (n) {
            if (opts.indexOf(n) < 0) opts.push(n);
        });
        opts.sort(function (a, b) {
            var ia = APRENDIZES_FILTRO_FIXOS.indexOf(a);
            var ib = APRENDIZES_FILTRO_FIXOS.indexOf(b);
            if (ia >= 0 && ib >= 0) return ia - ib;
            if (ia >= 0) return -1;
            if (ib >= 0) return 1;
            return a.localeCompare(b, 'pt-BR');
        });
        var cur = sel.value;
        sel.innerHTML = '<option value="">Todos</option>' +
            opts.map(function (n) {
                return '<option value="' + escapeHtml(n) + '"' + (n === cur ? ' selected' : '') + '>' + escapeHtml(n) + '</option>';
            }).join('');
        rebuildJaSelectDropdown('ja-filter-nome');
    }

    function updateMonthStat() {
        var now = new Date();
        var y = String(now.getFullYear());
        var m = pad2(now.getMonth() + 1);
        var list = getActivitiesForMonth(y, m);
        var el = document.getElementById('ja-stat-month-count');
        var lb = document.getElementById('ja-stat-month-label');
        if (el) el.textContent = String(list.length);
        if (lb) {
            var label = MESES.find(function (x) { return x.id === m; });
            lb.textContent = (label ? label.label : m) + ' ' + y;
        }
    }

    function renderActivityGrid() {
        var listEl = document.getElementById('ja-activity-list');
        var empty = document.getElementById('ja-empty');
        if (!listEl) return;

        var filtered = collectFilterActivities();
        if (filtered.length === 0) {
            listEl.innerHTML = '';
            if (empty) empty.hidden = false;
            return;
        }
        if (empty) empty.hidden = true;

        listEl.innerHTML = filtered.map(function (a) {
            var modelo = getModelo(a.tipoEquipamento, a);
            var st = a.status || 'concluida';
            var preview = (a.resumoTarefa || a.tarefasDoDia || '').replace(/\s+/g, ' ').trim();
            if (preview.length > 120) preview = preview.slice(0, 117) + '…';
            return (
                '<li class="ja-activity-card glass-ja" data-id="' + escapeHtml(a.id) + '">' +
                '<div class="ja-card-top">' +
                '<span class="ja-badge ' + statusClass(st) + '">' + escapeHtml(statusLabel(st)) + '</span>' +
                '<span class="ja-card-date">' + escapeHtml(formatarData(a.dataRegistro)) + '</span></div>' +
                '<h3 class="ja-card-name">' + escapeHtml(a.nomeAprendiz || '—') + '</h3>' +
                '<p class="ja-card-meta">' + escapeHtml(a.tipoEquipamento || '—') +
                (modelo ? ' · ' + escapeHtml(modelo) : '') +
                ' · ' + escapeHtml(a.tipoTarefa || '—') + '</p>' +
                (preview ? '<p class="ja-card-preview">' + escapeHtml(preview) + '</p>' : '') +
                '<div class="ja-card-actions">' +
                '<button type="button" class="ja-btn ja-btn--mini ja-btn--ghost" data-action="view" data-id="' + escapeHtml(a.id) + '"><i class="fas fa-eye"></i> Ver</button>' +
                '<button type="button" class="ja-btn ja-btn--mini ja-btn--primary" data-action="edit" data-id="' + escapeHtml(a.id) + '"><i class="fas fa-pen"></i> Editar</button>' +
                '</div></li>'
            );
        }).join('');
    }

    function findActivityById(id) {
        var all = getAllActivitiesRaw();
        for (var i = 0; i < all.length; i++) {
            if (all[i] && all[i].id === id) return all[i];
        }
        return null;
    }

    function openModal(name) {
        var id = 'ja-modal-' + name;
        var w = document.getElementById(id);
        if (!w) return;
        w.hidden = false;
        requestAnimationFrame(function () { w.classList.add('is-open'); });
        document.body.style.overflow = 'hidden';
    }

    function closeModal(name) {
        var id = 'ja-modal-' + name;
        var w = document.getElementById(id);
        if (!w) return;
        w.classList.remove('is-open');
        setTimeout(function () {
            w.hidden = true;
            if (!document.querySelector('.ja-modal.is-open')) document.body.style.overflow = '';
        }, 220);
    }

    function renderViewModal(a) {
        viewingActivityId = a.id;
        var title = document.getElementById('ja-modal-view-title');
        var body = document.getElementById('ja-modal-view-body');
        if (title) {
            var rt = (a.resumoTarefa && String(a.resumoTarefa).trim()) ? String(a.resumoTarefa).trim() : 'Atividade';
            title.textContent = rt;
        }
        if (!body) return;
        var modelo = getModelo(a.tipoEquipamento, a);
        var st = a.status || 'concluida';
        body.innerHTML =
            '<dl class="ja-doc-dl">' +
            '<dt>Aprendiz</dt><dd>' + escapeHtml(a.nomeAprendiz) + '</dd>' +
            '<dt>Registado em</dt><dd>' + escapeHtml(formatarData(a.dataRegistro)) + '</dd>' +
            '<dt>Status</dt><dd><span class="ja-badge ' + statusClass(st) + '">' + escapeHtml(statusLabel(st)) + '</span></dd>' +
            '<dt>Equipamento</dt><dd>' + escapeHtml(a.tipoEquipamento) + (modelo ? ' — ' + escapeHtml(modelo) : '') + '</dd>' +
            '<dt>Nº série</dt><dd>' + escapeHtml(a.numeroSerie || '—') + '</dd>' +
            '<dt>Tipo de tarefa</dt><dd>' + escapeHtml(a.tipoTarefa) + '</dd>' +
            '</dl>' +
            '<h4 class="ja-doc-h4">Tarefas do dia a dia</h4>' +
            '<div class="ja-doc-block">' + (a.tarefasDoDia ? escapeHtml(a.tarefasDoDia).replace(/\n/g, '<br>') : '<em class="ja-muted">Sem texto</em>') + '</div>' +
            (a.defeito ? '<h4 class="ja-doc-h4">Defeito / bloqueio</h4><div class="ja-doc-block">' + escapeHtml(a.defeito) + '</div>' : '') +
            '<h4 class="ja-doc-h4">Relato detalhado</h4>' +
            '<div class="ja-doc-block ja-doc-block--long">' + (a.observacao ? escapeHtml(a.observacao).replace(/\n/g, '<br>') : '<em class="ja-muted">Sem relato</em>') + '</div>';
        openModal('view');
    }

    function openEditModal(a) {
        viewingActivityId = a.id;
        document.getElementById('ja-edit-id').value = a.id;
        document.getElementById('ja-edit-data-original').value = a.dataRegistro || '';
        document.getElementById('ja-edit-nome').value = a.nomeAprendiz || '';
        document.getElementById('ja-edit-status').value = a.status || 'concluida';
        document.getElementById('ja-edit-tarefas').value = a.tarefasDoDia || '';
        document.getElementById('ja-edit-tipo-eq').value = a.tipoEquipamento || 'Notebook';
        document.getElementById('ja-edit-modelo').value = getModelo(a.tipoEquipamento, a) || '';
        document.getElementById('ja-edit-serie').value = a.numeroSerie || '';
        document.getElementById('ja-edit-tipo-tarefa').value = a.tipoTarefa || 'Configurar';
        document.getElementById('ja-edit-resumo').value = a.resumoTarefa || '';
        document.getElementById('ja-edit-defeito').value = a.defeito || '';
        document.getElementById('ja-edit-obs').value = a.observacao || '';
        ['ja-edit-status', 'ja-edit-tipo-eq', 'ja-edit-tipo-tarefa'].forEach(function (sid) {
            var g = document.querySelector('.ja-select-glass[data-ja-select="' + sid + '"]');
            if (g) syncJaSelectGlass(g);
        });
        openModal('edit');
    }

    function exportarCSV() {
        var rows = collectFilterActivities();
        if (rows.length === 0) {
            toast('Nada para exportar neste filtro.');
            return;
        }
        var bom = '\uFEFF';
        var header = 'Data;Nome;Status;Tarefas do dia;Equipamento;Modelo;Nº série;Tipo tarefa;Resumo;Defeito;Observação\n';
        var lines = rows.map(function (a) {
            var modelo = getModelo(a.tipoEquipamento, a);
            function cell(x) {
                return String(x == null ? '' : x).replace(/;/g, ',').replace(/\n/g, ' ');
            }
            return [
                formatarData(a.dataRegistro),
                cell(a.nomeAprendiz),
                cell(statusLabel(a.status)),
                cell(a.tarefasDoDia),
                cell(a.tipoEquipamento),
                cell(modelo),
                cell(a.numeroSerie),
                cell(a.tipoTarefa),
                cell(a.resumoTarefa),
                cell(a.defeito),
                cell(a.observacao)
            ].join(';');
        });
        var csv = bom + header + lines.join('\n');
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'jovem-aprendiz-' + new Date().toISOString().slice(0, 10) + '.csv';
        a.click();
        URL.revokeObjectURL(url);
        toast('CSV gerado.');
    }

    function toggleModeloFields(tipo) {
        var nb = document.getElementById('ja-fld-modelo-notebook');
        var hh = document.getElementById('ja-fld-modelo-handheld');
        var sc = document.getElementById('ja-fld-modelo-scanner');
        var hint = document.getElementById('ja-onboarding-hint');
        var showNb = tipo === 'Notebook';
        var showHh = tipo === 'Handheld';
        var showSc = tipo === 'Scanner';
        var showOn = tipo === 'Onboarding';
        if (nb) nb.hidden = !showNb;
        if (hh) hh.hidden = !showHh;
        if (sc) sc.hidden = !showSc;
        if (hint) hint.hidden = !showOn;
    }

    function syncJaSelectGlass(glass) {
        var selectId = glass.getAttribute('data-ja-select');
        var select = document.getElementById(selectId);
        var trigger = glass.querySelector('.ja-select-trigger');
        var valueEl = trigger && trigger.querySelector('.ja-select-value');
        var dropdown = glass.querySelector('.ja-select-dropdown');
        if (!select || !valueEl) return;
        var opt = select.options[select.selectedIndex];
        var text = opt ? opt.textContent : '';
        var val = opt ? opt.value : '';
        valueEl.textContent = text || 'Selecionar';
        valueEl.classList.toggle('placeholder', !(text && String(text).trim()));
        if (dropdown) {
            dropdown.querySelectorAll('.ja-select-option').forEach(function (o) {
                o.classList.toggle('selected', o.getAttribute('data-value') === val);
            });
        }
    }

    function refreshAllJaSelects() {
        document.querySelectorAll('.ja-select-glass').forEach(syncJaSelectGlass);
    }

    function clearModalDropdownLayout(glass) {
        if (!glass || !glass.closest('#ja-modal-edit')) return;
        var dd = glass.querySelector('.ja-select-dropdown');
        if (dd) dd.style.cssText = '';
    }

    function positionModalDropdown(glass) {
        if (!glass || !glass.closest('#ja-modal-edit')) return;
        var dd = glass.querySelector('.ja-select-dropdown');
        var trig = glass.querySelector('.ja-select-trigger');
        if (!dd || !trig) return;
        var r = trig.getBoundingClientRect();
        dd.style.position = 'fixed';
        dd.style.left = Math.round(r.left) + 'px';
        dd.style.top = Math.round(r.bottom + 6) + 'px';
        dd.style.width = Math.round(r.width) + 'px';
        dd.style.zIndex = '10050';
        dd.style.boxSizing = 'border-box';
    }

    function closeAllJaSelectGlass() {
        document.querySelectorAll('.ja-select-glass.open').forEach(function (g) {
            g.classList.remove('open');
            var tr = g.querySelector('.ja-select-trigger');
            var dd = g.querySelector('.ja-select-dropdown');
            if (tr) tr.setAttribute('aria-expanded', 'false');
            if (dd) dd.hidden = true;
            clearModalDropdownLayout(g);
        });
    }

    function rebuildJaSelectDropdown(selectId) {
        var select = document.getElementById(selectId);
        var glass = document.querySelector('.ja-select-glass[data-ja-select="' + selectId + '"]');
        if (!select || !glass) return;
        var dd = glass.querySelector('.ja-select-dropdown');
        if (!dd) return;
        dd.innerHTML = '';
        for (var i = 0; i < select.options.length; i++) {
            var o = select.options[i];
            var div = document.createElement('div');
            div.className = 'ja-select-option';
            div.setAttribute('role', 'option');
            div.setAttribute('data-value', o.value);
            div.textContent = o.textContent;
            dd.appendChild(div);
        }
        syncJaSelectGlass(glass);
    }

    function initJaCustomSelectDelegation() {
        if (initJaCustomSelectDelegation._done) return;
        initJaCustomSelectDelegation._done = true;

        document.addEventListener('click', function (e) {
            var optEl = e.target.closest('.ja-select-glass .ja-select-option');
            if (optEl) {
                e.preventDefault();
                e.stopPropagation();
                var glass = optEl.closest('.ja-select-glass');
                var sid = glass.getAttribute('data-ja-select');
                var sel = document.getElementById(sid);
                if (!sel) return;
                sel.value = optEl.getAttribute('data-value') != null ? String(optEl.getAttribute('data-value')) : '';
                syncJaSelectGlass(glass);
                closeAllJaSelectGlass();
                try {
                    sel.dispatchEvent(new Event('change', { bubbles: true }));
                } catch (err) {}
                return;
            }

            var trig = e.target.closest('.ja-select-glass .ja-select-trigger');
            if (trig) {
                e.stopPropagation();
                var glass = trig.closest('.ja-select-glass');
                var wasOpen = glass.classList.contains('open');
                closeAllJaSelectGlass();
                if (!wasOpen) {
                    glass.classList.add('open');
                    trig.setAttribute('aria-expanded', 'true');
                    var dd = glass.querySelector('.ja-select-dropdown');
                    if (dd) {
                        dd.hidden = false;
                        positionModalDropdown(glass);
                    }
                }
                return;
            }

            closeAllJaSelectGlass();
        });

        window.addEventListener('scroll', function () {
            closeAllJaSelectGlass();
        }, true);
        window.addEventListener('resize', function () {
            closeAllJaSelectGlass();
        });
    }

    function initRegistrationFormSelectReset(form) {
        if (!form) return;
        form.addEventListener('reset', function () {
            setTimeout(function () {
                ['ja-modelo-notebook', 'ja-modelo-handheld', 'ja-modelo-scanner'].forEach(rebuildJaSelectDropdown);
                refreshAllJaSelects();
            }, 0);
        });
    }

    function showStep(n) {
        currentStep = n;
        for (var i = 1; i <= totalSteps; i++) {
            var el = document.getElementById('ja-step-' + i);
            if (el) el.classList.toggle('active', i === n);
        }
        var textEl = document.getElementById('ja-steps-text');
        if (textEl) textEl.textContent = 'Passo ' + n + ' de ' + totalSteps;
        var fillEl = document.getElementById('ja-steps-fill');
        if (fillEl) fillEl.style.width = (n / totalSteps * 100) + '%';

        var btnPrev = document.getElementById('ja-btn-prev');
        var btnNext = document.getElementById('ja-btn-next');
        var btnSubmit = document.getElementById('ja-btn-submit');
        if (btnPrev) btnPrev.hidden = n === 1;
        if (btnNext) btnNext.hidden = n === totalSteps;
        if (btnSubmit) btnSubmit.hidden = n !== totalSteps;

        if (n === 3) {
            var r = document.querySelector('input[name="tipoEquipamento"]:checked');
            toggleModeloFields(r ? r.value : '');
        }
    }

    function validateStep(n) {
        if (n === 1) {
            var nome = document.getElementById('ja-nome');
            if (!nome || !nome.value.trim()) {
                toast('Indica o nome do aprendiz.');
                if (nome) nome.focus();
                return false;
            }
        }
        if (n === 2) {
            var r = document.querySelector('input[name="tipoEquipamento"]:checked');
            if (!r) {
                toast('Escolhe o tipo de equipamento.');
                return false;
            }
            toggleModeloFields(r.value);
        }
        if (n === 3) {
            var r2 = document.querySelector('input[name="tipoEquipamento"]:checked');
            var t = r2 ? r2.value : '';
            if (t === 'Onboarding') return true;
            if (t === 'Notebook') {
                var v = document.getElementById('ja-modelo-notebook').value;
                if (!v) { toast('Seleciona o modelo do notebook.'); return false; }
            }
            if (t === 'Handheld') {
                var vh = document.getElementById('ja-modelo-handheld').value;
                if (!vh) { toast('Seleciona Honeywell ou Zebra (Handheld).'); return false; }
            }
            if (t === 'Scanner') {
                var vs = document.getElementById('ja-modelo-scanner').value;
                if (!vs) { toast('Seleciona Honeywell ou Zebra (Scanner).'); return false; }
            }
        }
        if (n === 5) {
            var tt = document.querySelector('input[name="tipoTarefa"]:checked');
            if (!tt) {
                toast('Escolhe o tipo de tarefa.');
                return false;
            }
        }
        return true;
    }

    function getTheme() {
        try {
            return localStorage.getItem(THEME_KEY) || 'light';
        } catch (e) {
            return 'light';
        }
    }

    function setTheme(v) {
        v = v === 'dark' ? 'dark' : 'light';
        try {
            localStorage.setItem(THEME_KEY, v);
        } catch (e) {}
        document.documentElement.setAttribute('data-theme', v);
        var btn = document.getElementById('ja-theme-toggle');
        if (btn && btn.querySelector('i')) {
            btn.querySelector('i').className = v === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    function switchView(view) {
        var reg = document.getElementById('ja-view-registrar');
        var at = document.getElementById('ja-view-atividades');
        var tReg = document.getElementById('ja-tab-registrar');
        var tAt = document.getElementById('ja-tab-atividades');
        var isReg = view === 'registrar';
        if (reg) {
            reg.classList.toggle('ja-view--active', isReg);
            reg.hidden = !isReg;
        }
        if (at) {
            at.classList.toggle('ja-view--active', !isReg);
            at.hidden = isReg;
        }
        if (tReg) {
            tReg.classList.toggle('ja-main-tab--active', isReg);
            tReg.setAttribute('aria-selected', isReg ? 'true' : 'false');
        }
        if (tAt) {
            tAt.classList.toggle('ja-main-tab--active', !isReg);
            tAt.setAttribute('aria-selected', isReg ? 'false' : 'true');
        }
        if (!isReg) {
            fillYearMonthFilters();
            fillNomeFilter();
            renderActivityGrid();
        }
    }

    function updateMetaDatetime() {
        var el = document.getElementById('ja-meta-datetime-text');
        if (!el) return;
        var d = new Date();
        el.textContent = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) + ' · ' +
            d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    function bindEvents() {
        var form = document.getElementById('ja-form');

        document.querySelectorAll('.ja-main-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                switchView(tab.getAttribute('data-ja-view') || 'registrar');
            });
        });

        var btnPrev = document.getElementById('ja-btn-prev');
        var btnNext = document.getElementById('ja-btn-next');
        if (btnPrev) btnPrev.addEventListener('click', function () {
            if (currentStep > 1) showStep(currentStep - 1);
        });
        if (btnNext) btnNext.addEventListener('click', function () {
            if (validateStep(currentStep) && currentStep < totalSteps) showStep(currentStep + 1);
        });

        if (form) form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!validateStep(currentStep)) return;
            for (var s = 1; s <= totalSteps; s++) {
                if (!validateStep(s)) {
                    showStep(s);
                    return;
                }
            }

            var nome = document.getElementById('ja-nome').value.trim();
            var tipoEquip = (form.querySelector('input[name="tipoEquipamento"]:checked') || {}).value || '';
            var tipoTarefa = (form.querySelector('input[name="tipoTarefa"]:checked') || {}).value || '';
            var status = document.getElementById('ja-status').value || 'concluida';

            var activity = {
                id: 'ja-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9),
                dataRegistro: new Date().toISOString(),
                nomeAprendiz: nome,
                tarefasDoDia: (document.getElementById('ja-tarefas-dia').value || '').trim(),
                tipoEquipamento: tipoEquip,
                modeloNotebook: '',
                modeloHandheld: '',
                modeloScanner: '',
                numeroSerie: (document.getElementById('ja-serie').value || '').trim(),
                tipoTarefa: tipoTarefa,
                status: status,
                resumoTarefa: (document.getElementById('ja-resumo').value || '').trim(),
                defeito: (document.getElementById('ja-defeito').value || '').trim(),
                observacao: (document.getElementById('ja-observacao').value || '').trim()
            };
            setModeloOnActivity(tipoEquip, activity, (function () {
                if (tipoEquip === 'Notebook') return document.getElementById('ja-modelo-notebook').value;
                if (tipoEquip === 'Handheld') return document.getElementById('ja-modelo-handheld').value;
                if (tipoEquip === 'Scanner') return document.getElementById('ja-modelo-scanner').value;
                return '';
            })());

            if (upsertActivity(activity)) {
                form.reset();
                toggleModeloFields('');
                document.querySelectorAll('.ja-select-glass').forEach(function (g) {
                    var id = g.getAttribute('data-ja-select');
                    var sel = document.getElementById(id);
                    if (sel) sel.selectedIndex = 0;
                });
                refreshAllJaSelects();
                closeAllJaSelectGlass();
                showStep(1);
                var nomeEl = document.getElementById('ja-nome');
                var cu = getCurrentUser();
                if (nomeEl && cu) nomeEl.value = cu;
                updateMonthStat();
                fillYearMonthFilters();
                renderActivityGrid();
                openModal('success');
            }
        });

        if (form) form.addEventListener('change', function (ev) {
            if (ev.target && ev.target.name === 'tipoEquipamento') {
                toggleModeloFields(ev.target.value);
            }
        });

        var actList = document.getElementById('ja-activity-list');
        if (actList) actList.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-action]');
            if (!btn) return;
            var id = btn.getAttribute('data-id');
            var act = findActivityById(id);
            if (!act) return;
            if (btn.getAttribute('data-action') === 'view') renderViewModal(act);
            if (btn.getAttribute('data-action') === 'edit') openEditModal(act);
        });

        var btnViewEdit = document.getElementById('ja-modal-view-edit');
        if (btnViewEdit) btnViewEdit.addEventListener('click', function () {
            closeModal('view');
            var a = findActivityById(viewingActivityId);
            if (a) openEditModal(a);
        });

        document.querySelectorAll('[data-ja-close-modal]').forEach(function (el) {
            el.addEventListener('click', function () {
                closeModal(el.getAttribute('data-ja-close-modal'));
            });
        });

        var formEdit = document.getElementById('ja-form-edit');
        if (formEdit) formEdit.addEventListener('submit', function (e) {
            e.preventDefault();
            var id = document.getElementById('ja-edit-id').value;
            var originalIso = document.getElementById('ja-edit-data-original').value;
            var prev = findActivityById(id);
            if (!prev) {
                toast('Atividade não encontrada.');
                return;
            }
            removeActivityById(id);

            var tipo = document.getElementById('ja-edit-tipo-eq').value;
            var updated = {
                id: id,
                dataRegistro: originalIso || prev.dataRegistro,
                nomeAprendiz: document.getElementById('ja-edit-nome').value.trim(),
                tarefasDoDia: document.getElementById('ja-edit-tarefas').value.trim(),
                tipoEquipamento: tipo,
                modeloNotebook: '',
                modeloHandheld: '',
                modeloScanner: '',
                numeroSerie: document.getElementById('ja-edit-serie').value.trim(),
                tipoTarefa: document.getElementById('ja-edit-tipo-tarefa').value,
                status: document.getElementById('ja-edit-status').value,
                resumoTarefa: document.getElementById('ja-edit-resumo').value.trim(),
                defeito: document.getElementById('ja-edit-defeito').value.trim(),
                observacao: document.getElementById('ja-edit-obs').value.trim(),
                atualizadoEm: new Date().toISOString()
            };
            setModeloOnActivity(tipo, updated, document.getElementById('ja-edit-modelo').value.trim());

            if (upsertActivity(updated)) {
                closeModal('edit');
                toast('Alterações guardadas.');
                updateMonthStat();
                fillYearMonthFilters();
                fillNomeFilter();
                renderActivityGrid();
            }
        });

        ['ja-filter-year', 'ja-filter-month', 'ja-filter-status', 'ja-filter-nome', 'ja-filter-tipo', 'ja-search'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', renderActivityGrid);
        });

        var exp = document.getElementById('ja-export-csv');
        if (exp) exp.addEventListener('click', exportarCSV);

        var themeBtn = document.getElementById('ja-theme-toggle');
        if (themeBtn) themeBtn.addEventListener('click', function () {
            setTheme(getTheme() === 'dark' ? 'light' : 'dark');
        });

        var hamburger = document.getElementById('ja-hamburger');
        var dropdown = document.getElementById('ja-dropdown');
        if (hamburger && dropdown) {
            hamburger.addEventListener('click', function (e) {
                e.stopPropagation();
                var show = dropdown.hidden;
                dropdown.hidden = !show;
                hamburger.setAttribute('aria-expanded', show ? 'true' : 'false');
            });
            document.addEventListener('click', function () {
                dropdown.hidden = true;
                hamburger.setAttribute('aria-expanded', 'false');
            });
            dropdown.addEventListener('click', function (e) { e.stopPropagation(); });
        }
    }

    function init() {
        migrateLegacyIfNeeded();
        setTheme(getTheme());
        bindEvents();

        var formEl = document.getElementById('ja-form');
        var nomeInput = document.getElementById('ja-nome');
        var cu = getCurrentUser();
        if (nomeInput && cu) nomeInput.value = cu;
        var metaUser = document.getElementById('ja-meta-user-name');
        if (metaUser) metaUser.textContent = cu || 'Convidado';

        updateMetaDatetime();
        setInterval(updateMetaDatetime, 1000);

        initJaCustomSelectDelegation();

        if (formEl) {
            initRegistrationFormSelectReset(formEl);
            showStep(1);
        }

        updateMonthStat();
        fillYearMonthFilters();
        fillNomeFilter();
        rebuildJaSelectDropdown('ja-filter-status');
        ['ja-modelo-notebook', 'ja-modelo-handheld', 'ja-modelo-scanner', 'ja-edit-status', 'ja-edit-tipo-eq', 'ja-edit-tipo-tarefa'].forEach(rebuildJaSelectDropdown);
        refreshAllJaSelects();

        renderActivityGrid();

        if (location.hash === '#mapa' || location.hash === '#atividades') {
            switchView('atividades');
        }
        window.addEventListener('hashchange', function () {
            if (location.hash === '#mapa' || location.hash === '#atividades') {
                switchView('atividades');
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
