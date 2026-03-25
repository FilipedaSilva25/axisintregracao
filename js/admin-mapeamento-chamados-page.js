/**
 * Página dedicada: atualizar status dos chamados (IS único) — Administração BRSC02.
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'axis_registro_chamados';

    function ensureIsPrefix(raw) {
        var v = String(raw || '').trim();
        if (!v) return 'IS-';
        var rest = v.replace(/^IS-/i, '').trim();
        if (!rest) return 'IS-';
        return 'IS-' + rest;
    }

    function bindIsPrefixField(id) {
        var el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('blur', function () {
            el.value = ensureIsPrefix(el.value);
        });
        el.addEventListener('focus', function () {
            if (el.value === 'IS-') {
                try { el.setSelectionRange(3, 3); } catch (e) {}
            }
        });
    }

    function dedupeRegistroChamadosPorIsLocal(list) {
        if (!Array.isArray(list)) return [];
        var semChave = [];
        var comChave = [];
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            if (!item || typeof item !== 'object') continue;
            var ch = item.chave != null ? String(item.chave).trim() : '';
            if (!ch) {
                semChave.push(item);
                continue;
            }
            comChave.push(item);
        }
        var grupos = {};
        for (var j = 0; j < comChave.length; j++) {
            var it = comChave[j];
            var k = String(it.chave).trim().toLowerCase();
            if (!grupos[k]) grupos[k] = [];
            grupos[k].push(it);
        }
        var fundidos = [];
        for (var key in grupos) {
            if (!Object.prototype.hasOwnProperty.call(grupos, key)) continue;
            var arr = grupos[key];
            arr.sort(function (a, b) { return new Date(b.data || 0) - new Date(a.data || 0); });
            var novo = {};
            try {
                for (var p in arr[0]) if (Object.prototype.hasOwnProperty.call(arr[0], p)) novo[p] = arr[0][p];
            } catch (e) { novo = arr[0]; }
            for (var x = 1; x < arr.length; x++) {
                var o = arr[x];
                if (!novo.mapeamento && o.mapeamento) novo.mapeamento = o.mapeamento;
                if ((!novo.observacao || !String(novo.observacao).trim()) && o.observacao) novo.observacao = o.observacao;
                if (!novo.tipos || !novo.tipos.length) novo.tipos = o.tipos || [];
            }
            fundidos.push(novo);
        }
        fundidos.sort(function (a, b) { return new Date(b.data || 0) - new Date(a.data || 0); });
        return fundidos.concat(semChave);
    }

    function setFeedback(el, text, ok) {
        if (!el) return;
        el.textContent = text || '';
        el.className = 'admin-rc-feedback rc-map-feedback ' + (ok ? 'admin-rc-ok' : 'admin-rc-err');
    }

    function pillClassForStatus(value) {
        var v = String(value || '').trim();
        if (v === 'aberto' || v === 'em-andamento' || v === 'pendente' || v === 'finalizado') return v;
        return 'aberto';
    }

    function setStatusSelectValue(value, labelText) {
        var hidden = document.getElementById('admin-rc-status');
        var span = document.getElementById('admin-rc-status-trigger-label');
        if (hidden) hidden.value = value || '';
        if (!span) return;
        var v = String(value || '').trim();
        if (!v) {
            span.className = 'admin-rc-status-trigger-text is-placeholder';
            span.textContent = 'Selecione um Status...';
            var listClear = document.getElementById('admin-rc-status-list');
            if (listClear) {
                listClear.querySelectorAll('.admin-rc-status-opt').forEach(function (b) {
                    b.removeAttribute('aria-selected');
                });
            }
            return;
        }
        span.className = 'admin-rc-status-trigger-text';
        span.textContent = '';
        var pill = document.createElement('span');
        pill.className = 'admin-rc-status-trigger-pill admin-rc-status-trigger-pill--' + pillClassForStatus(v);
        pill.textContent = labelText || v;
        span.appendChild(pill);
    }

    function closeStatusDropdown() {
        var list = document.getElementById('admin-rc-status-list');
        var trig = document.getElementById('admin-rc-status-trigger');
        if (list) {
            list.hidden = true;
            list.querySelectorAll('.admin-rc-status-opt').forEach(function (b) {
                b.setAttribute('tabindex', '-1');
            });
        }
        if (trig) {
            trig.classList.remove('is-open');
            trig.setAttribute('aria-expanded', 'false');
        }
    }

    function openStatusDropdown() {
        var list = document.getElementById('admin-rc-status-list');
        var trig = document.getElementById('admin-rc-status-trigger');
        if (!list || !trig) return;
        list.hidden = false;
        trig.classList.add('is-open');
        trig.setAttribute('aria-expanded', 'true');
        var first = list.querySelector('.admin-rc-status-opt');
        if (first) first.focus();
    }

    function setWizardRegStatusValue(value, labelText) {
        var hidden = document.getElementById('admin-rc-map-reg-status');
        var span = document.getElementById('admin-rc-map-reg-status-trigger-label');
        if (hidden) hidden.value = value || '';
        if (!span) return;
        var v = String(value || '').trim();
        if (!v) {
            span.className = 'admin-rc-status-trigger-text is-placeholder';
            span.textContent = 'Selecione um Status...';
            var listClear = document.getElementById('admin-rc-map-reg-status-list');
            if (listClear) {
                listClear.querySelectorAll('.admin-rc-status-opt').forEach(function (b) {
                    b.removeAttribute('aria-selected');
                });
            }
            return;
        }
        span.className = 'admin-rc-status-trigger-text';
        span.textContent = '';
        var pill = document.createElement('span');
        pill.className = 'admin-rc-status-trigger-pill admin-rc-status-trigger-pill--' + pillClassForStatus(v);
        pill.textContent = labelText || v;
        span.appendChild(pill);
    }

    function closeWizardRegStatusDropdown() {
        var list = document.getElementById('admin-rc-map-reg-status-list');
        var trig = document.getElementById('admin-rc-map-reg-status-trigger');
        if (list) {
            list.hidden = true;
            list.querySelectorAll('.admin-rc-status-opt').forEach(function (b) {
                b.setAttribute('tabindex', '-1');
            });
        }
        if (trig) {
            trig.classList.remove('is-open');
            trig.setAttribute('aria-expanded', 'false');
        }
    }

    function openWizardRegStatusDropdown() {
        var list = document.getElementById('admin-rc-map-reg-status-list');
        var trig = document.getElementById('admin-rc-map-reg-status-trigger');
        if (!list || !trig) return;
        list.hidden = false;
        trig.classList.add('is-open');
        trig.setAttribute('aria-expanded', 'true');
        var first = list.querySelector('.admin-rc-status-opt');
        if (first) first.focus();
    }

    function initWizardRegStatusSelect() {
        var wrap = document.getElementById('admin-rc-map-reg-status-wrap');
        var trig = document.getElementById('admin-rc-map-reg-status-trigger');
        var list = document.getElementById('admin-rc-map-reg-status-list');
        if (!wrap || !trig || !list) return;

        setWizardRegStatusValue('', '');

        trig.addEventListener('click', function (e) {
            e.stopPropagation();
            var wasOpen = !list.hidden;
            if (wasOpen) closeWizardRegStatusDropdown();
            else openWizardRegStatusDropdown();
        });

        list.querySelectorAll('.admin-rc-status-opt').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var val = btn.getAttribute('data-value') || '';
                var lab = btn.getAttribute('data-label') || val;
                setWizardRegStatusValue(val, lab);
                list.querySelectorAll('.admin-rc-status-opt').forEach(function (b) {
                    b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
                });
                closeWizardRegStatusDropdown();
                trig.focus();
            });
        });

        wrap.addEventListener('click', function (e) {
            e.stopPropagation();
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !list.hidden) {
                closeWizardRegStatusDropdown();
                trig.focus();
            }
        });
    }

    function initAdminStatusSelect() {
        var wrap = document.getElementById('admin-rc-status-wrap');
        var trig = document.getElementById('admin-rc-status-trigger');
        var list = document.getElementById('admin-rc-status-list');
        if (!wrap || !trig || !list) return;

        setStatusSelectValue('', '');

        trig.addEventListener('click', function (e) {
            e.stopPropagation();
            var wasOpen = !list.hidden;
            if (wasOpen) closeStatusDropdown();
            else openStatusDropdown();
        });

        list.querySelectorAll('.admin-rc-status-opt').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var val = btn.getAttribute('data-value') || '';
                var lab = btn.getAttribute('data-label') || val;
                setStatusSelectValue(val, lab);
                list.querySelectorAll('.admin-rc-status-opt').forEach(function (b) {
                    b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
                });
                closeStatusDropdown();
                trig.focus();
            });
        });

        document.addEventListener('click', function () {
            closeStatusDropdown();
            closeWizardRegStatusDropdown();
        });
        wrap.addEventListener('click', function (e) {
            e.stopPropagation();
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !list.hidden) {
                closeStatusDropdown();
                trig.focus();
            }
        });
    }

    function pad2(n) {
        return (n < 10 ? '0' : '') + n;
    }

    var ADMIN_MESES_NOME = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    function syncHiddenFromDmy() {
        var hidden = document.getElementById('admin-rc-map-data');
        var anoEl = document.getElementById('admin-rc-map-ano');
        var mesEl = document.getElementById('admin-rc-map-mes');
        var diaEl = document.getElementById('admin-rc-map-dia');
        if (!hidden || !anoEl || !mesEl || !diaEl) return;
        var ano = anoEl.value;
        var mes = mesEl.value;
        var dia = diaEl.value;
        if (!ano || !mes || !dia) {
            hidden.value = '';
            return;
        }
        hidden.value = ano + '-' + pad2(parseInt(mes, 10)) + '-' + pad2(parseInt(dia, 10));
    }

    function rebuildAdminDaySelectOptions() {
        var anoEl = document.getElementById('admin-rc-map-ano');
        var mesEl = document.getElementById('admin-rc-map-mes');
        var diaEl = document.getElementById('admin-rc-map-dia');
        if (!anoEl || !mesEl || !diaEl) return;
        var y = parseInt(anoEl.value, 10);
        var mo = parseInt(mesEl.value, 10);
        var cur = diaEl.value;
        var maxD = 31;
        if (y && mo >= 1 && mo <= 12) {
            maxD = new Date(y, mo, 0).getDate();
        }
        diaEl.innerHTML = '';
        var oz = document.createElement('option');
        oz.value = '';
        oz.textContent = 'Dia';
        diaEl.appendChild(oz);
        var d;
        for (d = 1; d <= maxD; d++) {
            var o = document.createElement('option');
            o.value = String(d);
            o.textContent = pad2(d);
            diaEl.appendChild(o);
        }
        var ncur = parseInt(cur, 10);
        if (cur && ncur >= 1 && ncur <= maxD) {
            diaEl.value = String(ncur);
        } else {
            diaEl.value = '';
        }
        syncHiddenFromDmy();
    }

    function rebuildGraphDropdownForSelect(selectId) {
        var wrap = document.querySelector('[data-admin-time-glass="' + selectId + '"]');
        if (!wrap || wrap.getAttribute('data-admin-graph-bound') !== '1') return;
        var select = document.getElementById(selectId);
        var trigger = wrap.querySelector('.rc-select-graph-trigger');
        var dropdown = wrap.querySelector('.rc-select-graph-dropdown');
        var valueSpan = wrap.querySelector('.rc-select-graph-value');
        if (!select || !trigger || !dropdown || !valueSpan) return;

        function closeDd() {
            trigger.setAttribute('aria-expanded', 'false');
            dropdown.classList.remove('open');
        }
        function updateTr() {
            var opt = select.options[select.selectedIndex];
            valueSpan.textContent = opt ? opt.textContent : '';
            dropdown.querySelectorAll('.rc-select-graph-opt').forEach(function (el) {
                el.classList.toggle('selected', el.getAttribute('data-val') === select.value);
            });
        }

        dropdown.innerHTML = '';
        var k;
        for (k = 0; k < select.options.length; k++) {
            var op = select.options[k];
            var div = document.createElement('button');
            div.type = 'button';
            div.className = 'rc-select-graph-opt' + (op.value === select.value ? ' selected' : '');
            div.setAttribute('data-val', op.value);
            div.setAttribute('role', 'option');
            div.textContent = op.textContent;
            div.addEventListener('click', function (e) {
                e.stopPropagation();
                select.value = this.getAttribute('data-val');
                updateTr();
                closeDd();
                select.dispatchEvent(new Event('change', { bubbles: true }));
            });
            dropdown.appendChild(div);
        }
        updateTr();
    }

    function populateAdminDateDmy() {
        var anoEl = document.getElementById('admin-rc-map-ano');
        var mesEl = document.getElementById('admin-rc-map-mes');
        if (!anoEl || !mesEl) return;
        var y0 = new Date().getFullYear();
        anoEl.innerHTML = '';
        var oa = document.createElement('option');
        oa.value = '';
        oa.textContent = 'Ano';
        anoEl.appendChild(oa);
        var y;
        for (y = y0; y >= y0 - 28; y--) {
            var oy = document.createElement('option');
            oy.value = String(y);
            oy.textContent = String(y);
            anoEl.appendChild(oy);
        }
        mesEl.innerHTML = '';
        var ob = document.createElement('option');
        ob.value = '';
        ob.textContent = 'Mês';
        mesEl.appendChild(ob);
        var m;
        for (m = 1; m <= 12; m++) {
            var om = document.createElement('option');
            om.value = String(m);
            om.textContent = ADMIN_MESES_NOME[m - 1];
            mesEl.appendChild(om);
        }
        rebuildAdminDaySelectOptions();

        if (!mesEl._adminDmyBound) {
            mesEl._adminDmyBound = true;
            mesEl.addEventListener('change', function () {
                rebuildAdminDaySelectOptions();
                rebuildGraphDropdownForSelect('admin-rc-map-dia');
            });
        }
        if (!anoEl._adminDmyBound) {
            anoEl._adminDmyBound = true;
            anoEl.addEventListener('change', function () {
                rebuildAdminDaySelectOptions();
                rebuildGraphDropdownForSelect('admin-rc-map-dia');
            });
        }
        var diaEl = document.getElementById('admin-rc-map-dia');
        if (diaEl && !diaEl._adminDmyBound) {
            diaEl._adminDmyBound = true;
            diaEl.addEventListener('change', function () {
                syncHiddenFromDmy();
            });
        }
    }

    function initAdminDateDmyListenersOnWizard() {
        var wiz = document.getElementById('admin-rc-map-wizard');
        if (!wiz || wiz._adminDmyWiz) return;
        wiz._adminDmyWiz = true;
        wiz.addEventListener('rc-map-admin-step6-reset', function () {
            var anoEl = document.getElementById('admin-rc-map-ano');
            var mesEl = document.getElementById('admin-rc-map-mes');
            var diaEl = document.getElementById('admin-rc-map-dia');
            if (anoEl) anoEl.value = '';
            if (mesEl) mesEl.value = '';
            if (diaEl) diaEl.value = '';
            rebuildAdminDaySelectOptions();
            rebuildGraphDropdownForSelect('admin-rc-map-dia');
            rebuildGraphDropdownForSelect('admin-rc-map-mes');
            rebuildGraphDropdownForSelect('admin-rc-map-ano');
            syncHiddenFromDmy();
            setWizardRegStatusValue('', '');
            refreshAdminTimeGraphs();
        });
    }

    function refreshAdminTimeGraphs() {
        ['admin-rc-map-dia', 'admin-rc-map-mes', 'admin-rc-map-ano', 'admin-rc-map-hh', 'admin-rc-map-mm', 'admin-rc-map-ss'].forEach(function (id) {
            var wrap = document.querySelector('[data-admin-time-glass="' + id + '"]');
            if (!wrap) return;
            var select = document.getElementById(id);
            var valueSpan = wrap.querySelector('.rc-select-graph-value');
            var dropdown = wrap.querySelector('.rc-select-graph-dropdown');
            if (!select || !valueSpan || !dropdown) return;
            var opt = select.options[select.selectedIndex];
            valueSpan.textContent = opt ? opt.textContent : '';
            dropdown.querySelectorAll('.rc-select-graph-opt').forEach(function (el) {
                el.classList.toggle('selected', el.getAttribute('data-val') === select.value);
            });
        });
    }

    function initAdminTimeGraphSelects() {
        document.querySelectorAll('[data-admin-time-glass]').forEach(function (wrap) {
            if (wrap.getAttribute('data-admin-graph-bound') === '1') return;
            var select = wrap.querySelector('.rc-select-native');
            var trigger = wrap.querySelector('.rc-select-graph-trigger');
            var dropdown = wrap.querySelector('.rc-select-graph-dropdown');
            var valueSpan = wrap.querySelector('.rc-select-graph-value');
            if (!select || !trigger || !dropdown || !valueSpan) return;
            wrap.setAttribute('data-admin-graph-bound', '1');

            function closeDd() {
                trigger.setAttribute('aria-expanded', 'false');
                dropdown.classList.remove('open');
            }
            function updateTr() {
                var opt = select.options[select.selectedIndex];
                valueSpan.textContent = opt ? opt.textContent : '';
                dropdown.querySelectorAll('.rc-select-graph-opt').forEach(function (el) {
                    el.classList.toggle('selected', el.getAttribute('data-val') === select.value);
                });
            }

            dropdown.innerHTML = '';
            var k;
            for (k = 0; k < select.options.length; k++) {
                var op = select.options[k];
                var div = document.createElement('button');
                div.type = 'button';
                div.className = 'rc-select-graph-opt' + (op.value === select.value ? ' selected' : '');
                div.setAttribute('data-val', op.value);
                div.setAttribute('role', 'option');
                div.textContent = op.textContent;
                div.addEventListener('click', function (e) {
                    e.stopPropagation();
                    select.value = this.getAttribute('data-val');
                    updateTr();
                    closeDd();
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                });
                dropdown.appendChild(div);
            }
            updateTr();

            trigger.addEventListener('click', function (e) {
                e.stopPropagation();
                closeStatusDropdown();
                closeWizardRegStatusDropdown();
                var isOpen = dropdown.classList.toggle('open');
                trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                document.querySelectorAll('.rc-select-graph-dropdown.open').forEach(function (d) {
                    if (d !== dropdown) {
                        d.classList.remove('open');
                        var w = d.closest('[data-admin-time-glass]');
                        var t2 = w && w.querySelector('.rc-select-graph-trigger');
                        if (t2) t2.setAttribute('aria-expanded', 'false');
                    }
                });
            });
            dropdown.addEventListener('click', function (e) {
                e.stopPropagation();
            });
        });

        document.addEventListener('click', function () {
            document.querySelectorAll('.rc-select-graph-dropdown.open').forEach(function (d) {
                d.classList.remove('open');
                var w = d.closest('[data-admin-time-glass]');
                var t2 = w && w.querySelector('.rc-select-graph-trigger');
                if (t2) t2.setAttribute('aria-expanded', 'false');
            });
        });
    }

    function init() {
        bindIsPrefixField('admin-rc-chave');
        bindIsPrefixField('admin-rc-map-is');
        initAdminStatusSelect();
        initWizardRegStatusSelect();
        populateAdminDateDmy();
        initAdminTimeGraphSelects();
        initAdminDateDmyListenersOnWizard();

        var aplicar = document.getElementById('admin-rc-aplicar');
        if (aplicar) aplicar.addEventListener('click', function () {
            var chaveEl = document.getElementById('admin-rc-chave');
            var stEl = document.getElementById('admin-rc-status');
            var msg = document.getElementById('admin-rc-feedback');
            var chave = chaveEl && ensureIsPrefix(chaveEl.value);
            if (chaveEl) chaveEl.value = chave;
            var status = stEl && stEl.value;
            if (!chave || chave === 'IS-') {
                setFeedback(msg, 'Informe o IS do chamado (número após IS-).', false);
                return;
            }
            if (!status) {
                setFeedback(msg, 'Selecione o status.', false);
                return;
            }
            try {
                var raw = localStorage.getItem(STORAGE_KEY);
                var arr = raw ? JSON.parse(raw) : [];
                if (!Array.isArray(arr)) arr = [];
                var ck = chave.toLowerCase();
                var found = false;
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i] && String(arr[i].chave || '').trim().toLowerCase() === ck) {
                        arr[i].status = status;
                        found = true;
                    }
                }
                if (!found) {
                    setFeedback(msg, 'IS não encontrado na base local. Confirme o nº ou abra o mapeamento e sincronize.', false);
                    return;
                }
                arr = dedupeRegistroChamadosPorIsLocal(arr);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
                var base = window.location.origin || '';
                fetch(base + '/api/registro-chamados', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'update-status-by-chave', chave: chave, status: status })
                })
                    .then(function (r) {
                        if (!r.ok) return r.json().then(function (j) { throw new Error((j && j.error) || 'Erro'); });
                        setFeedback(msg, 'Status atualizado (um registo por IS).', true);
                        if (chaveEl) chaveEl.value = 'IS-';
                        setStatusSelectValue('', '');
                    })
                    .catch(function () {
                        setFeedback(msg, 'Gravado neste navegador; não foi possível confirmar no servidor.', true);
                        if (chaveEl) chaveEl.value = 'IS-';
                        setStatusSelectValue('', '');
                    });
            } catch (e) {
                setFeedback(msg, 'Erro ao atualizar.', false);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
