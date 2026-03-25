/**
 * PACKING MACHINE — Preventivas (PREVENTIVAS DE PACKING MACHINE)
 * Painel alinhado ao layout de CABEÇA DE IMPRESSÃO (resumo + 2 gráficos + histórico).
 */
(function () {
    'use strict';

    const STORAGE = 'axis_packing_preventivas';
    const STORAGE_MAIN_TAB = 'axis_packing_machine_main_tab';
    const API_LIST = '/api/packing/preventivas';
    const API_POST = '/api/packing/preventiva';
    const PM_OPCOES = ['PM 1', 'PM 2', 'PM 3', 'PM 4', 'PM 5', 'PM 6'];

    var chartPorPm = null;
    var chartTempo = null;

    function getList() {
        try {
            var raw = localStorage.getItem(STORAGE);
            if (!raw) return [];
            var arr = JSON.parse(raw);
            return Array.isArray(arr) ? arr : [];
        } catch (e) {
            return [];
        }
    }

    function saveList(arr) {
        if (!Array.isArray(arr)) return;
        try {
            localStorage.setItem(STORAGE, JSON.stringify(arr));
        } catch (e) {
            console.error('Erro ao salvar preventivas:', e);
        }
    }

    function getTheme() {
        return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }

    function escapeHtml(text) {
        if (text == null) return '';
        if (typeof text !== 'string') text = String(text);
        try {
            var div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        } catch (_) {
            return '';
        }
    }

    function formatarDataHora(iso) {
        if (!iso) return '—';
        try {
            var d = new Date(iso);
            if (isNaN(d.getTime())) return '—';
            var opts = { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' };
            var data = d.toLocaleDateString('pt-BR', opts);
            var hora = d.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
            return data + ' ' + hora;
        } catch (e) {
            return '—';
        }
    }

    function tarefasDoReg(reg) {
        if (reg && Array.isArray(reg.tarefas) && reg.tarefas.length) return reg.tarefas;
        if (reg && reg.preventivaRealizada) {
            return String(reg.preventivaRealizada).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        }
        return [];
    }

    function syncFromApi() {
        fetch(API_LIST).then(function (r) { return r.json(); }).then(function (data) {
            if (!data || !data.ok || !Array.isArray(data.preventivas)) return;
            var server = data.preventivas;
            if (server.length === 0) {
                saveList([]);
                updateStats();
                renderCharts();
                renderTable();
                return;
            }
            var local = getList();
            var ids = {};
            var merged = [];
            server.forEach(function (p) {
                if (p && p.id && !ids[p.id]) {
                    ids[p.id] = true;
                    merged.push(p);
                }
            });
            local.forEach(function (p) {
                if (p && p.id && !ids[p.id]) {
                    ids[p.id] = true;
                    merged.push(p);
                }
            });
            merged.sort(function (a, b) {
                return new Date(b.dataHora || 0) - new Date(a.dataHora || 0);
            });
            saveList(merged);
            updateStats();
            renderCharts();
            renderTable();
        }).catch(function () {});
    }

    function postPreventivaToApi(payload, callback) {
        fetch(API_POST, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(function (r) { return r.json(); }).then(function (data) {
            if (callback) callback(data);
        }).catch(function () {
            if (callback) callback({ ok: false });
        });
    }

    function showFeedback(msg) {
        var feedback = document.createElement('div');
        feedback.style.cssText = 'position:fixed;bottom:24px;right:24px;padding:14px 24px;background:rgba(0,131,143,0.95);color:white;border-radius:14px;font-size:14px;font-weight:600;z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,0.25);';
        feedback.textContent = msg;
        document.body.appendChild(feedback);
        setTimeout(function () { feedback.remove(); }, 2500);
    }

    function updateStats() {
        var list = getList();
        var total = list.length;
        var now = new Date();
        var mesAtual = now.getMonth();
        var anoAtual = now.getFullYear();
        var noMes = list.filter(function (p) {
            var d = new Date(p.dataHora);
            return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
        }).length;
        var elTotal = document.getElementById('pm-prev-dash-total');
        var elMes = document.getElementById('pm-prev-dash-mes');
        if (elTotal) elTotal.textContent = total;
        if (elMes) elMes.textContent = noMes;
    }

    function dadosParaGraficoPorPm() {
        var list = getList();
        var counts = {};
        PM_OPCOES.forEach(function (pm) { counts[pm] = 0; });
        list.forEach(function (p) {
            var pm = p.numeroPm || '';
            if (counts[pm] !== undefined) counts[pm]++;
        });
        return PM_OPCOES.map(function (pm) { return counts[pm] || 0; });
    }

    function dadosParaGraficoTempo() {
        var list = getList();
        var porPm = {};
        PM_OPCOES.forEach(function (pm) { porPm[pm] = []; });
        list.forEach(function (p) {
            var pm = p.numeroPm || '';
            if (porPm[pm]) {
                var d = new Date(p.dataHora);
                if (!isNaN(d.getTime())) porPm[pm].push(d.getTime());
            }
        });
        var labels = [];
        var values = [];
        PM_OPCOES.forEach(function (pm) {
            labels.push(pm);
            var datas = porPm[pm].sort(function (a, b) { return a - b; });
            if (datas.length < 2) {
                values.push(0);
            } else {
                var totalDias = 0;
                var count = 0;
                for (var i = 1; i < datas.length; i++) {
                    var diffMs = datas[i] - datas[i - 1];
                    totalDias += diffMs / (1000 * 60 * 60 * 24);
                    count++;
                }
                values.push(count > 0 ? Math.round(totalDias / count * 10) / 10 : 0);
            }
        });
        return { labels: labels, values: values };
    }

    function renderCharts() {
        if (typeof Chart === 'undefined') return;
        var ctxPm = document.getElementById('pm-prev-chart-por-pm');
        var ctxTempo = document.getElementById('pm-prev-chart-tempo');
        if (!ctxPm || !ctxTempo) return;

        var isDark = getTheme() === 'dark';
        var textColor = isDark ? '#f5f5f7' : '#1d1d1f';
        var gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

        var dadosPm = dadosParaGraficoPorPm();
        var dadosTempoObj = dadosParaGraficoTempo();

        var palette = [
            '#00e5ff', '#00b8d4',
            '#b388ff', '#7c4dff',
            '#ff5252', '#ff1744',
            '#ffd740', '#ffc400',
            '#69f0ae', '#00e676',
            '#ff8a80', '#ff4081'
        ];
        var bgColors = PM_OPCOES.map(function (_, i) {
            return palette[i % palette.length];
        });

        if (chartPorPm) chartPorPm.destroy();
        chartPorPm = new Chart(ctxPm.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: PM_OPCOES,
                datasets: [{
                    data: dadosPm,
                    backgroundColor: bgColors,
                    borderWidth: 3,
                    borderColor: isDark ? 'rgba(20,20,25,0.95)' : 'rgba(255,255,255,0.95)',
                    hoverBorderWidth: 5,
                    hoverOffset: 12
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '55%',
                circumference: 360,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: textColor, padding: 16 }
                    }
                }
            }
        });

        var maxVal = Math.max.apply(null, dadosTempoObj.values);
        var barColors = PM_OPCOES.map(function (_, i) {
            var hues = ['#00acc1', '#7c4dff', '#e53935', '#f9a825', '#43a047', '#fb8c00'];
            return hues[i % hues.length];
        });
        if (chartTempo) chartTempo.destroy();
        chartTempo = new Chart(ctxTempo.getContext('2d'), {
            type: 'bar',
            data: {
                labels: dadosTempoObj.labels,
                datasets: [{
                    label: 'Dias entre preventivas',
                    data: dadosTempoObj.values,
                    backgroundColor: barColors.map(function (c) {
                        return isDark ? c + 'cc' : c;
                    }),
                    borderColor: barColors,
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { left: 8, right: 8 } },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: isDark ? 'rgba(30,30,35,0.95)' : 'rgba(255,255,255,0.98)',
                        titleColor: textColor,
                        bodyColor: textColor,
                        borderColor: gridColor,
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                            label: function (ctx) {
                                var v = ctx.raw;
                                if (v === 0) return 'Sem dados suficientes (mín. 2 registros)';
                                if (v < 1) return (Math.round(v * 24 * 10) / 10) + ' horas em média';
                                return (Math.round(v * 10) / 10) + ' dias em média';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        suggestedMax: maxVal > 0 ? Math.ceil(maxVal * 1.2 * 2) / 2 : 1,
                        grid: { color: gridColor },
                        ticks: {
                            color: textColor,
                            callback: function (v) {
                                if (v === 0) return '0';
                                if (v < 1) return (Math.round(v * 24)) + 'h';
                                return v === 1 ? '1 dia' : v + ' dias';
                            }
                        }
                    },
                    y: {
                        grid: { display: false },
                        ticks: {
                            color: textColor,
                            font: { size: 12, weight: '500' }
                        }
                    }
                }
            }
        });
    }

    function renderTable() {
        var tbody = document.getElementById('pm-prev-tbody');
        var empty = document.getElementById('pm-prev-empty');
        var searchEl = document.getElementById('pm-prev-search');
        var filterHidden = document.getElementById('pm-prev-filter-pm');
        var filterPm = (filterHidden && filterHidden.value) ? filterHidden.value : '';
        if (!tbody) return;

        var q = (searchEl && searchEl.value) ? searchEl.value.trim().toLowerCase() : '';
        var list = getList().filter(function (reg) {
            if (filterPm && reg.numeroPm !== filterPm) return false;
            if (q) {
                var nomeEx = (reg.nomeCompleto || reg.usuario || '');
                var s = (reg.numeroPm || '') + ' ' + nomeEx + ' ' + (reg.matriculaAxis || '') + ' ' + (reg.localidade || '') + ' ' + (reg.preventivaRealizada || '');
                if (s.toLowerCase().indexOf(q) < 0) return false;
            }
            return true;
        });
        list.sort(function (a, b) {
            return new Date(b.dataHora || 0) - new Date(a.dataHora || 0);
        });

        if (list.length === 0) {
            tbody.innerHTML = '';
            if (empty) empty.classList.add('visible');
            return;
        }
        if (empty) empty.classList.remove('visible');

        tbody.innerHTML = list.map(function (reg) {
            var prevText = escapeHtml(reg.preventivaRealizada || tarefasDoReg(reg).join(', '));
            var nomeLinha = reg.nomeCompleto || reg.usuario || '—';
            var mat = reg.matriculaAxis ? String(reg.matriculaAxis) : '—';
            var loc = reg.localidade ? String(reg.localidade) : '—';
            return '<tr>' +
                '<td>' + escapeHtml(formatarDataHora(reg.dataHora)) + '</td>' +
                '<td>' + escapeHtml(nomeLinha) + '</td>' +
                '<td>' + escapeHtml(mat) + '</td>' +
                '<td>' + escapeHtml(loc) + '</td>' +
                '<td>' + escapeHtml(reg.numeroPm || '—') + '</td>' +
                '<td>' + prevText + '</td>' +
                '<td>' + escapeHtml(reg.observacao || '—') + '</td>' +
                '</tr>';
        }).join('');
    }

    function setMainTab(name) {
        var viewT = document.getElementById('pm-view-trocas');
        var viewP = document.getElementById('pm-view-preventivas');
        var tabs = document.querySelectorAll('.pm-main-tab');
        tabs.forEach(function (t) {
            var on = t.getAttribute('data-pm-tab') === name;
            t.classList.toggle('pm-main-tab--active', on);
            t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        if (viewT) {
            viewT.hidden = name !== 'trocas';
            viewT.classList.toggle('pm-view--active', name === 'trocas');
        }
        if (viewP) {
            viewP.hidden = name !== 'preventivas';
            viewP.classList.toggle('pm-view--active', name === 'preventivas');
        }
        if (name === 'preventivas') {
            syncFromApi();
            updateStats();
            renderCharts();
            renderTable();
        }
        try {
            if (name === 'trocas' || name === 'preventivas') {
                localStorage.setItem(STORAGE_MAIN_TAB, name);
            }
        } catch (e) { /* ignore */ }
    }

    function restoreMainTab() {
        try {
            var saved = localStorage.getItem(STORAGE_MAIN_TAB);
            if (saved === 'trocas' || saved === 'preventivas') {
                setMainTab(saved);
            }
        } catch (e) { /* ignore */ }
    }

    function initMainTabs() {
        document.querySelectorAll('.pm-main-tab').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var tab = btn.getAttribute('data-pm-tab');
                if (tab) setMainTab(tab);
            });
        });
    }

    function initCustomSelects() {
        var containers = document.querySelectorAll('.pm-custom-select');
        containers.forEach(function (container) {
            var trigger = container.querySelector('.pm-custom-select-trigger');
            var valueEl = container.querySelector('.pm-custom-select-value');
            var dropdown = container.querySelector('.pm-custom-select-dropdown');
            var options = container.querySelectorAll('.pm-custom-select-option');
            var hidden = container.querySelector('input[type="hidden"]');
            if (!trigger || !dropdown || !hidden) return;

            function close() {
                container.classList.remove('is-open');
                trigger.setAttribute('aria-expanded', 'false');
                dropdown.setAttribute('aria-hidden', 'true');
            }

            function open() {
                document.querySelectorAll('.pm-custom-select.is-open').forEach(function (c) {
                    if (c !== container) c.classList.remove('is-open');
                });
                container.classList.add('is-open');
                trigger.setAttribute('aria-expanded', 'true');
                dropdown.setAttribute('aria-hidden', 'false');
            }

            function selectOption(opt) {
                var val = opt.getAttribute('data-value') || '';
                var label = opt.getAttribute('data-label');
                if (label === null) label = opt.textContent.trim();
                hidden.value = val;
                valueEl.textContent = label || val || valueEl.getAttribute('data-placeholder') || 'Selecione…';
                valueEl.classList.toggle('is-placeholder', !val);
                options.forEach(function (o) { o.classList.remove('is-selected'); });
                opt.classList.add('is-selected');
                close();
            }

            trigger.addEventListener('click', function (e) {
                e.stopPropagation();
                if (container.classList.contains('is-open')) close(); else open();
            });

            dropdown.addEventListener('click', function (e) { e.stopPropagation(); });
            options.forEach(function (opt) {
                opt.addEventListener('click', function (e) {
                    e.stopPropagation();
                    selectOption(opt);
                });
            });

            trigger.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (container.classList.contains('is-open')) close(); else open();
                }
                if (e.key === 'Escape') close();
            });

            dropdown.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') { close(); return; }
                var idx = -1;
                options.forEach(function (o, i) { if (o.classList.contains('is-selected')) idx = i; });
                if (idx < 0) idx = 0;
                if (e.key === 'ArrowDown' && idx < options.length - 1) {
                    e.preventDefault();
                    selectOption(options[idx + 1]);
                }
                if (e.key === 'ArrowUp' && idx > 0) {
                    e.preventDefault();
                    selectOption(options[idx - 1]);
                }
            });

            if (!hidden.value) valueEl.classList.add('is-placeholder');
        });

        document.addEventListener('click', function () {
            document.querySelectorAll('.pm-custom-select.is-open').forEach(function (c) {
                c.classList.remove('is-open');
                c.querySelector('.pm-custom-select-trigger').setAttribute('aria-expanded', 'false');
                c.querySelector('.pm-custom-select-dropdown').setAttribute('aria-hidden', 'true');
            });
        });
    }

    function resetCustomSelects() {
        document.querySelectorAll('.pm-custom-select').forEach(function (container) {
            var valueEl = container.querySelector('.pm-custom-select-value');
            var options = container.querySelectorAll('.pm-custom-select-option');
            var hidden = container.querySelector('input[type="hidden"]');
            var first = options[0];
            if (first && hidden) {
                var placeHolder = first.getAttribute('data-label') || first.textContent.trim();
                hidden.value = first.getAttribute('data-value') || '';
                valueEl.textContent = placeHolder;
                valueEl.classList.add('is-placeholder');
                options.forEach(function (o) { o.classList.remove('is-selected'); });
            }
        });
    }

    function initFilter() {
        var trigger = document.getElementById('pm-prev-filter-pm-trigger');
        var dropdown = document.getElementById('pm-prev-filter-pm-dropdown');
        var hidden = document.getElementById('pm-prev-filter-pm');
        var label = document.getElementById('pm-prev-filter-pm-label');
        if (!trigger || !dropdown) return;

        trigger.addEventListener('click', function (e) {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });

        document.addEventListener('click', function () {
            dropdown.classList.remove('open');
        });

        dropdown.querySelectorAll('.pm-filter-opt').forEach(function (opt) {
            opt.addEventListener('click', function () {
                var pm = opt.getAttribute('data-pm') || '';
                if (hidden) hidden.value = pm;
                if (label) label.textContent = pm ? pm : 'TODAS AS PM';
                dropdown.classList.remove('open');
                renderTable();
            });
        });
    }

    function initForm() {
        var form = document.getElementById('pm-prev-form');
        if (!form) return;
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var sel = document.getElementById('pm-prev-usuario');
            var usuario = sel && sel.value ? sel.value.trim() : '';
            var pmSel = document.getElementById('pm-prev-pm');
            var pm = pmSel && pmSel.value ? pmSel.value.trim() : '';
            var tipoSel = document.getElementById('pm-prev-tipo');
            var tipoVal = tipoSel && tipoSel.value ? tipoSel.value : '';
            var tarefas = [];
            if (tipoVal === '__both__') {
                tarefas = ['CABEÇA DE IMPRESSÃO', 'ROLOS TRACIONADORES'];
            } else if (tipoVal) {
                tarefas = [tipoVal];
            }
            var obs = document.getElementById('pm-prev-obs');
            var observacao = obs && obs.value ? obs.value.trim().substring(0, 500) : '';
            if (!usuario) {
                alert('Selecione o usuário.');
                return;
            }
            if (!pm) {
                alert('Selecione a Packing Machine.');
                return;
            }
            if (tarefas.length === 0) {
                alert('Selecione o tipo de preventiva realizada.');
                return;
            }
            var reg = {
                id: 'prev_' + Date.now(),
                dataHora: new Date().toISOString(),
                usuario: usuario,
                numeroPm: pm,
                tarefas: tarefas,
                preventivaRealizada: tarefas.join(', '),
                observacao: observacao,
                origem: 'site'
            };
            var arr = getList();
            arr.unshift(reg);
            saveList(arr);
            postPreventivaToApi({
                usuario: usuario,
                numeroPm: pm,
                tarefas: tarefas,
                observacao: observacao,
                dataHora: reg.dataHora,
                origem: 'site',
                id: reg.id
            }, function () {});
            form.reset();
            resetCustomSelects();
            showFeedback('Preventiva registrada!');
            updateStats();
            renderCharts();
            renderTable();
        });
    }

    function initSearch() {
        var s = document.getElementById('pm-prev-search');
        if (!s) return;
        s.addEventListener('input', function () {
            renderTable();
        });
    }

    function init() {
        initMainTabs();
        initCustomSelects();
        initForm();
        initSearch();
        initFilter();
        restoreMainTab();
        syncFromApi();
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'visible') syncFromApi();
        });
        window.addEventListener('pm-theme-changed', function () {
            renderCharts();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
