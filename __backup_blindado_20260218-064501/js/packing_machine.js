/**
 * PACKING MACHINE - Troca de Cabeça de Impressão | AXIS
 * Dados: localStorage (axis_packing_trocas)
 * Ingresso manual e automático - ambos contam em estatísticas e gráficos
 */
(function() {
    'use strict';

    const STORAGE = 'axis_packing_trocas';
    const THEME_KEY = 'axis_packing_theme';
    const API_TROCAS = '/api/packing/trocas';
    const API_TROCA = '/api/packing/troca';
    const MAX_TECNICO = 100;
    const MAX_IMPRESSOES = 999999999;
    const PM_OPCOES = ['PM 1', 'PM 2', 'PM 3', 'PM 4', 'PM 5', 'PM 6'];

    var chartPorPm = null;
    var chartTempoTroca = null;

    function sanitizeString(val, maxLen) {
        if (val == null || typeof val !== 'string') return '';
        var s = val.trim();
        if (maxLen && s.length > maxLen) s = s.substring(0, maxLen);
        return s;
    }

    function safeInt(val, def, min, max) {
        var n = parseInt(String(val || 0), 10);
        if (isNaN(n)) return def;
        if (min != null && n < min) return min;
        if (max != null && n > max) return max;
        return n;
    }

    function getTrocas() {
        try {
            var raw = localStorage.getItem(STORAGE);
            if (!raw) return [];
            var arr = JSON.parse(raw);
            return Array.isArray(arr) ? arr : [];
        } catch (e) {
            return [];
        }
    }

    function saveTrocas(arr) {
        if (!Array.isArray(arr)) return;
        try {
            localStorage.setItem(STORAGE, JSON.stringify(arr));
        } catch (e) {
            console.error('Erro ao salvar trocas:', e);
        }
    }

    function syncFromApi() {
        fetch(API_TROCAS).then(function(r) { return r.json(); }).then(function(data) {
            if (!data || !data.ok || !Array.isArray(data.trocas)) return;
            var server = data.trocas;
            if (server.length === 0) {
                saveTrocas([]);
                updateStats();
                renderTable();
                renderCharts();
                return;
            }
            var local = getTrocas();
            var ids = {};
            var merged = [];
            server.forEach(function(t) {
                if (!ids[t.id]) {
                    ids[t.id] = true;
                    merged.push(t);
                }
            });
            local.forEach(function(t) {
                if (!ids[t.id]) {
                    ids[t.id] = true;
                    merged.push(t);
                }
            });
            merged.sort(function(a, b) {
                return new Date(b.dataHora || 0) - new Date(a.dataHora || 0);
            });
            saveTrocas(merged);
            updateStats();
            renderTable();
            renderCharts();
        }).catch(function() {});
    }

    function postTrocaToApi(troca, callback) {
        fetch(API_TROCA, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                numeroPm: troca.numeroPm,
                quantidadeImpressoes: troca.quantidadeImpressoes,
                tecnico: troca.tecnico,
                dataHora: troca.dataHora
            })
        }).then(function(r) { return r.json(); }).then(function(data) {
            if (callback) callback(data);
        }).catch(function() {
            if (callback) callback({ ok: false });
        });
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

    function escapeHtml(text) {
        if (text == null) return '';
        if (typeof text !== 'string') text = String(text);
        try {
            var div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        } catch (_) { return ''; }
    }

    function getTheme() {
        try {
            return localStorage.getItem(THEME_KEY) || 'light';
        } catch (e) {
            return 'light';
        }
    }

    function setTheme(theme) {
        theme = theme === 'dark' ? 'dark' : 'light';
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (e) {}
        document.documentElement.setAttribute('data-theme', theme);
        var btn = document.getElementById('pm-theme-toggle');
        if (btn) {
            var icon = btn.querySelector('i');
            if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        if (chartPorPm) chartPorPm.update('none');
        if (chartTempoTroca) chartTempoTroca.update('none');
    }

    function updateStats() {
        var trocas = getTrocas();
        var total = trocas.length;
        var now = new Date();
        var mesAtual = now.getMonth();
        var anoAtual = now.getFullYear();
        var noMes = trocas.filter(function(t) {
            var d = new Date(t.dataHora);
            return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
        }).length;

        var elTotal = document.getElementById('pm-dash-total');
        var elMes = document.getElementById('pm-dash-mes');
        if (elTotal) elTotal.textContent = total;
        if (elMes) elMes.textContent = noMes;
    }

    function dadosParaGraficoPorPm() {
        var trocas = getTrocas();
        var counts = {};
        PM_OPCOES.forEach(function(pm) { counts[pm] = 0; });
        trocas.forEach(function(t) {
            var pm = t.numeroPm || '';
            if (counts[pm] !== undefined) counts[pm]++;
        });
        return PM_OPCOES.map(function(pm) { return counts[pm] || 0; });
    }

    function dadosParaGraficoTempoTroca() {
        var trocas = getTrocas();
        var porPm = {};
        PM_OPCOES.forEach(function(pm) { porPm[pm] = []; });
        trocas.forEach(function(t) {
            var pm = t.numeroPm || '';
            if (porPm[pm]) {
                var d = new Date(t.dataHora);
                if (!isNaN(d.getTime())) porPm[pm].push(d.getTime());
            }
        });
        var labels = [];
        var values = [];
        PM_OPCOES.forEach(function(pm) {
            labels.push(pm);
            var datas = porPm[pm].sort(function(a, b) { return a - b; });
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
        var isDark = getTheme() === 'dark';
        var textColor = isDark ? '#f5f5f7' : '#1d1d1f';
        var gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

        var ctxPm = document.getElementById('pm-chart-por-pm');
        var ctxTempo = document.getElementById('pm-chart-tempo-troca');
        if (!ctxPm || !ctxTempo) return;

        var dadosPm = dadosParaGraficoPorPm();
        var dadosTempoObj = dadosParaGraficoTempoTroca();

        var palette = [
            '#00e5ff', '#00b8d4',
            '#b388ff', '#7c4dff',
            '#ff5252', '#ff1744',
            '#ffd740', '#ffc400',
            '#69f0ae', '#00e676',
            '#ff8a80', '#ff4081'
        ];
        var bgColors = PM_OPCOES.map(function(_, i) {
            var base = palette[i % palette.length];
            return base;
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
        var barColors = PM_OPCOES.map(function(_, i) {
            var hues = ['#00acc1', '#7c4dff', '#e53935', '#f9a825', '#43a047', '#fb8c00'];
            return hues[i % hues.length];
        });
        if (chartTempoTroca) chartTempoTroca.destroy();
        chartTempoTroca = new Chart(ctxTempo.getContext('2d'), {
            type: 'bar',
            data: {
                labels: dadosTempoObj.labels,
                datasets: [{
                    label: 'Dias entre trocas',
                    data: dadosTempoObj.values,
                    backgroundColor: barColors.map(function(c) {
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
                            label: function(ctx) {
                                var v = ctx.raw;
                                if (v === 0) return 'Sem dados suficientes (mín. 2 trocas)';
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
                            callback: function(v) {
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
        var tbody = document.getElementById('pm-tbody');
        var empty = document.getElementById('pm-empty');
        var search = document.getElementById('pm-search');
        var filterPm = (document.getElementById('pm-filter-pm') && document.getElementById('pm-filter-pm').value) || '';

        if (!tbody) return;

        var trocas = getTrocas();
        var q = (search && search.value) ? search.value.trim().toLowerCase() : '';

        var list = trocas.filter(function(t) {
            if (filterPm && t.numeroPm !== filterPm) return false;
            if (q) {
                var s = (t.numeroPm || '') + ' ' + (t.quantidadeImpressoes || '') + ' ' + (t.tecnico || '');
                if (!s.toLowerCase().includes(q)) return false;
            }
            return true;
        });

        list.sort(function(a, b) {
            return new Date(b.dataHora || 0) - new Date(a.dataHora || 0);
        });

        if (list.length === 0) {
            tbody.innerHTML = '';
            if (empty) empty.classList.add('visible');
            return;
        }

        if (empty) empty.classList.remove('visible');

        tbody.innerHTML = list.map(function(t) {
            return '<tr>' +
                '<td>' + escapeHtml(formatarDataHora(t.dataHora)) + '</td>' +
                '<td>' + escapeHtml(t.numeroPm || '—') + '</td>' +
                '<td>' + escapeHtml(String(t.quantidadeImpressoes ?? '')) + '</td>' +
                '<td>' + escapeHtml(t.tecnico || '—') + '</td>' +
                '</tr>';
        }).join('');
    }

    function showFeedback(msg, tipo) {
        tipo = tipo || 'teal';
        var bg = tipo === 'coral' ? 'rgba(255,107,107,0.95)' : 'rgba(0,131,143,0.95)';
        var feedback = document.createElement('div');
        feedback.style.cssText = 'position:fixed;bottom:24px;right:24px;padding:14px 24px;background:' + bg + ';color:white;border-radius:14px;font-size:14px;font-weight:600;z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,0.25);';
        feedback.textContent = msg;
        document.body.appendChild(feedback);
        setTimeout(function() { feedback.remove(); }, 2500);
    }

    function salvarTroca(troca) {
        var trocas = getTrocas();
        trocas.unshift(troca);
        saveTrocas(trocas);
        postTrocaToApi(troca);
        updateStats();
        renderTable();
        renderCharts();
    }

    function initTheme() {
        var theme = getTheme();
        setTheme(theme);
    }

    function initForm() {
        var form = document.getElementById('pm-form');
        if (!form) return;

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var pmInput = form.querySelector('input[name="pm-numero"]:checked');
            var pm = pmInput ? pmInput.value : '';
            var qtd = safeInt(document.getElementById('pm-quantidade').value, 0, 0, MAX_IMPRESSOES);
            var tecnico = sanitizeString(document.getElementById('pm-tecnico').value, MAX_TECNICO);

            if (!pm) {
                alert('Selecione o número da PM.');
                return;
            }
            if (!tecnico) {
                alert('Informe o nome do técnico responsável.');
                return;
            }

            var troca = {
                id: 'pm_' + Date.now(),
                dataHora: new Date().toISOString(),
                numeroPm: pm,
                quantidadeImpressoes: qtd,
                tecnico: tecnico
            };

            salvarTroca(troca);
            form.reset();
            document.getElementById('pm-quantidade').value = '';
            showFeedback('Troca registrada com sucesso!', 'teal');
        });
    }

    function initFlatpickr() {
        var el = document.getElementById('pm-manual-data');
        if (!el || typeof flatpickr === 'undefined') return;
        try {
            flatpickr(el, {
                locale: 'pt',
                dateFormat: 'Y-m-d',
                altInput: true,
                altFormat: 'd/m/Y',
                allowInput: false
            });
        } catch (e) { console.warn('Flatpickr init:', e); }
    }

    function initFormManual() {
        var form = document.getElementById('pm-form-manual');
        if (!form) return;

        initFlatpickr();

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var data = document.getElementById('pm-manual-data').value;
            var h = safeInt(document.getElementById('pm-manual-hora').value, 0, 0, 23);
            var min = safeInt(document.getElementById('pm-manual-min').value, 0, 0, 59);
            var seg = safeInt(document.getElementById('pm-manual-seg').value, 0, 0, 59);
            var pmInput = form.querySelector('input[name="pm-manual-numero"]:checked');
            var pm = pmInput ? pmInput.value : '';
            var qtd = safeInt(document.getElementById('pm-manual-quantidade').value, 0, 0, MAX_IMPRESSOES);
            var tecnico = sanitizeString(document.getElementById('pm-manual-tecnico').value, MAX_TECNICO);

            if (!data) {
                alert('Informe a data.');
                return;
            }
            if (!pm) {
                alert('Selecione o número da PM.');
                return;
            }
            if (!tecnico) {
                alert('Informe o nome do técnico responsável.');
                return;
            }

            var partsData = data.split('-');
            var ano = parseInt(partsData[0], 10);
            var mes = parseInt(partsData[1], 10) - 1;
            var dia = parseInt(partsData[2], 10);
            var d = new Date(ano, mes, dia, h, min, seg, 0);
            if (isNaN(d.getTime())) {
                alert('Data/hora inválida.');
                return;
            }

            var troca = {
                id: 'pm_manual_' + Date.now(),
                dataHora: d.toISOString(),
                numeroPm: pm,
                quantidadeImpressoes: qtd,
                tecnico: tecnico,
                manual: true
            };

            salvarTroca(troca);
            form.reset();
            showFeedback('Troca adicionada manualmente!', 'coral');
        });
    }

    function initFilter() {
        var trigger = document.getElementById('pm-filter-pm-trigger');
        var dropdown = document.getElementById('pm-filter-pm-dropdown');
        var hidden = document.getElementById('pm-filter-pm');
        var label = document.getElementById('pm-filter-pm-label');

        if (!trigger || !dropdown) return;

        trigger.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });

        document.addEventListener('click', function() {
            dropdown.classList.remove('open');
        });

        dropdown.querySelectorAll('.pm-filter-opt').forEach(function(opt) {
            opt.addEventListener('click', function() {
                var pm = opt.getAttribute('data-pm') || '';
                if (hidden) hidden.value = pm;
                if (label) label.textContent = pm ? pm : 'TODAS AS PM';
                dropdown.classList.remove('open');
                renderTable();
            });
        });
    }

    function initSearch() {
        var search = document.getElementById('pm-search');
        if (!search) return;
        search.addEventListener('input', function() {
            renderTable();
        });
    }

    function initThemeToggle() {
        var btn = document.getElementById('pm-theme-toggle');
        if (!btn) return;
        btn.addEventListener('click', function() {
            var theme = getTheme() === 'dark' ? 'light' : 'dark';
            setTheme(theme);
        });
    }

    function init() {
        initTheme();
        initThemeToggle();
        initForm();
        initFormManual();
        initFilter();
        initSearch();
        syncFromApi();
        updateStats();
        renderTable();
        renderCharts();
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'visible') syncFromApi();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
