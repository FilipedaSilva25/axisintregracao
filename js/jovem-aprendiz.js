/**
 * JOVEM APRENDIZ - Registro de atividades (substitui Forms → planilha)
 * Dados salvos em localStorage na chave axis_jovem_aprendiz_atividades
 */
(function() {
    'use strict';

    var STORAGE_KEY = 'axis_jovem_aprendiz_atividades';
    var THEME_KEY = 'axis_pecas_theme';

    function getCurrentUser() {
        try {
            return localStorage.getItem('current_user') || '';
        } catch (e) {
            return '';
        }
    }

    function updateMetaDatetime() {
        var el = document.getElementById('ja-meta-datetime-text');
        if (!el) return;
        var d = new Date();
        el.textContent = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' às ' +
            d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    function updateMetaUser() {
        var el = document.getElementById('ja-meta-user-name');
        if (!el) return;
        var name = getCurrentUser().trim();
        el.textContent = name || 'Não identificado';
    }

    function getTheme() {
        try { return localStorage.getItem(THEME_KEY) || 'light'; } catch (e) { return 'light'; }
    }
    function setTheme(v) {
        v = v === 'dark' ? 'dark' : 'light';
        try { localStorage.setItem(THEME_KEY, v); } catch (e) {}
        document.documentElement.setAttribute('data-theme', v);
        var btn = document.getElementById('ja-theme-toggle');
        if (btn && btn.querySelector('i')) btn.querySelector('i').className = v === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    function getActivities() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];
            var arr = JSON.parse(raw);
            return Array.isArray(arr) ? arr : [];
        } catch (e) {
            return [];
        }
    }

    function saveActivities(arr) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
        } catch (e) {
            console.error('Erro ao salvar atividades:', e);
        }
    }

    function escapeHtml(str) {
        if (str == null) return '';
        var s = String(str);
        var div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    function formatarData(iso) {
        if (!iso) return '—';
        try {
            var d = new Date(iso);
            if (isNaN(d.getTime())) return '—';
            return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '—';
        }
    }

    function getModelo(tipo, atividade) {
        if (tipo === 'Notebook') return atividade.modeloNotebook || '';
        if (tipo === 'Handheld') return atividade.modeloHandheld || '';
        if (tipo === 'Scanner') return atividade.modeloScanner || '';
        return atividade.modeloOutro || '';
    }

    function renderLibrary() {
        var list = document.getElementById('ja-activity-list');
        var empty = document.getElementById('ja-empty');
        var search = document.getElementById('ja-search');
        var filterNome = document.getElementById('ja-filter-nome');
        var filterTipo = document.getElementById('ja-filter-tipo');
        if (!list) return;

        var activities = getActivities();
        var q = (search && search.value) ? search.value.trim().toLowerCase() : '';
        var nomeFiltro = (filterNome && filterNome.value) ? filterNome.value : '';
        var tipoFiltro = (filterTipo && filterTipo.value) ? filterTipo.value : '';

        var filtered = activities.filter(function(a) {
            if (nomeFiltro && (a.nomeAprendiz || '') !== nomeFiltro) return false;
            if (tipoFiltro && (a.tipoTarefa || '') !== tipoFiltro) return false;
            if (q) {
                var text = [
                    a.nomeAprendiz,
                    a.tarefasDoDia,
                    a.tipoEquipamento,
                    getModelo(a.tipoEquipamento, a),
                    a.numeroSerie,
                    a.tipoTarefa,
                    a.resumoTarefa,
                    a.defeito,
                    a.observacao
                ].join(' ').toLowerCase();
                if (text.indexOf(q) < 0) return false;
            }
            return true;
        });

        if (filtered.length === 0) {
            list.innerHTML = '';
            if (empty) empty.style.display = 'block';
            return;
        }
        if (empty) empty.style.display = 'none';

        list.innerHTML = filtered.map(function(a) {
            var modelo = getModelo(a.tipoEquipamento, a);
            var meta = [formatarData(a.dataRegistro), a.tipoEquipamento, modelo ? ' · ' + modelo : '', a.tipoTarefa].filter(Boolean).join(' ');
            var detail = [];
            if (a.resumoTarefa) detail.push(escapeHtml(a.resumoTarefa));
            if (a.defeito) detail.push('Defeito: ' + escapeHtml(a.defeito));
            if (a.observacao) detail.push(escapeHtml(a.observacao));
            return '<li class="ja-activity-item" data-id="' + escapeHtml(a.id) + '">' +
                '<h4>' + escapeHtml(a.nomeAprendiz || '—') + '</h4>' +
                '<p class="ja-activity-meta">' + meta + '</p>' +
                (detail.length ? '<div class="ja-activity-detail">' + detail.join(' · ') + '</div>' : '') +
                '</li>';
        }).join('');
    }

    function exportarCSV() {
        var activities = getActivities();
        if (activities.length === 0) {
            alert('Nenhuma atividade para exportar.');
            return;
        }
        var bom = '\uFEFF';
        var header = 'Data;Nome;Tarefas do dia;Equipamento;Modelo;Nº Série;Tipo tarefa;Resumo;Defeito;Observação\n';
        var rows = activities.map(function(a) {
            var modelo = getModelo(a.tipoEquipamento, a);
            var cells = [
                formatarData(a.dataRegistro),
                (a.nomeAprendiz || '').replace(/;/g, ','),
                (a.tarefasDoDia || '').replace(/;/g, ',').replace(/\n/g, ' '),
                (a.tipoEquipamento || '').replace(/;/g, ','),
                (modelo || '').replace(/;/g, ','),
                (a.numeroSerie || '').replace(/;/g, ','),
                (a.tipoTarefa || '').replace(/;/g, ','),
                (a.resumoTarefa || '').replace(/;/g, ',').replace(/\n/g, ' '),
                (a.defeito || '').replace(/;/g, ',').replace(/\n/g, ' '),
                (a.observacao || '').replace(/;/g, ',').replace(/\n/g, ' ')
            ];
            return cells.join(';');
        });
        var csv = bom + header + rows.join('\n');
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'jovem-aprendiz-atividades-' + new Date().toISOString().slice(0, 10) + '.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    function fillNomeFilter() {
        var select = document.getElementById('ja-filter-nome');
        if (!select) return;
        var activities = getActivities();
        var nomes = {};
        activities.forEach(function(a) {
            var n = (a.nomeAprendiz || '').trim();
            if (n) nomes[n] = true;
        });
        var opts = Object.keys(nomes).sort();
        var current = select.value;
        select.innerHTML = '<option value="">Todos os aprendizes</option>' +
            opts.map(function(n) { return '<option value="' + escapeHtml(n) + '"' + (n === current ? ' selected' : '') + '>' + escapeHtml(n) + '</option>'; }).join('');
    }

    function showJaSuccessModal() {
        var wrap = document.getElementById('ja-modal-success');
        if (!wrap) return;
        wrap.classList.add('open');
        wrap.removeAttribute('hidden');
        wrap.setAttribute('aria-hidden', 'false');
    }
    function closeJaSuccessModal() {
        var wrap = document.getElementById('ja-modal-success');
        if (!wrap) return;
        wrap.classList.remove('open');
        wrap.setAttribute('hidden', '');
        wrap.setAttribute('aria-hidden', 'true');
    }

    function toggleModeloFields(tipo) {
        var fldNotebook = document.getElementById('ja-fld-modelo-notebook');
        var fldHandheld = document.getElementById('ja-fld-modelo-handheld');
        var fldScanner = document.getElementById('ja-fld-modelo-scanner');
        if (fldNotebook) fldNotebook.style.display = tipo === 'Notebook' ? 'block' : 'none';
        if (fldHandheld) fldHandheld.style.display = tipo === 'Handheld' ? 'block' : 'none';
        if (fldScanner) fldScanner.style.display = tipo === 'Scanner' ? 'block' : 'none';
    }

    function initJaSelectGlass(form) {
        var wrappers = document.querySelectorAll('.ja-select-glass');
        if (!wrappers.length) return;
        function syncTrigger(glass) {
            var selectId = glass.getAttribute('data-ja-select');
            var select = document.getElementById(selectId);
            var trigger = glass.querySelector('.ja-select-trigger');
            var valueEl = trigger && trigger.querySelector('.ja-select-value');
            var dropdown = glass.querySelector('.ja-select-dropdown');
            if (!select || !valueEl) return;
            var opt = select.options[select.selectedIndex];
            var text = opt ? opt.textContent : '';
            var val = opt ? opt.value : '';
            valueEl.textContent = text || 'Selecione o modelo';
            valueEl.classList.toggle('placeholder', !val);
            if (dropdown) {
                dropdown.querySelectorAll('.ja-select-option').forEach(function(o) {
                    o.classList.toggle('selected', o.getAttribute('data-value') === val);
                });
            }
        }
        function closeAll() {
            wrappers.forEach(function(w) { w.classList.remove('open'); });
            document.querySelectorAll('.ja-select-glass').forEach(function(w) {
                var tr = w.querySelector('.ja-select-trigger');
                var dd = w.querySelector('.ja-select-dropdown');
                if (tr) tr.setAttribute('aria-expanded', 'false');
                if (dd) dd.setAttribute('aria-hidden', 'true');
            });
        }
        wrappers.forEach(function(glass) {
            var selectId = glass.getAttribute('data-ja-select');
            var select = document.getElementById(selectId);
            var trigger = glass.querySelector('.ja-select-trigger');
            var dropdown = glass.querySelector('.ja-select-dropdown');
            if (!select || !trigger || !dropdown) return;
            syncTrigger(glass);
            trigger.addEventListener('click', function(e) {
                e.stopPropagation();
                var isOpen = glass.classList.toggle('open');
                trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                dropdown.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
                if (isOpen) syncTrigger(glass);
            });
            dropdown.querySelectorAll('.ja-select-option').forEach(function(opt) {
                opt.addEventListener('click', function() {
                    var v = opt.getAttribute('data-value');
                    select.value = v;
                    syncTrigger(glass);
                    closeAll();
                });
            });
        });
        document.addEventListener('click', closeAll);
        if (form) form.addEventListener('reset', function() {
            setTimeout(function() {
                wrappers.forEach(syncTrigger);
            }, 0);
        });
    }

    var currentStep = 1;
    var totalSteps = 6;

    function showStep(n) {
        currentStep = n;
        for (var i = 1; i <= totalSteps; i++) {
            var el = document.getElementById('ja-step-' + i);
            if (el) el.classList.toggle('active', i === n);
        }
        var textEl = document.getElementById('ja-steps-text');
        if (textEl) textEl.textContent = 'Etapa ' + n + ' de ' + totalSteps;
        var fillEl = document.getElementById('ja-steps-fill');
        if (fillEl) fillEl.style.width = (n / totalSteps * 100) + '%';
        var btnPrev = document.getElementById('ja-btn-prev');
        var btnNext = document.getElementById('ja-btn-next');
        var btnSubmit = document.getElementById('ja-btn-submit');
        if (btnPrev) btnPrev.style.display = n === 1 ? 'none' : 'inline-flex';
        if (btnNext) btnNext.style.display = n === totalSteps ? 'none' : 'inline-flex';
        if (btnSubmit) btnSubmit.style.display = n === totalSteps ? 'inline-flex' : 'none';
        if (n === 3) {
            var r = document.querySelector('input[name="tipoEquipamento"]:checked');
            toggleModeloFields(r ? r.value : '');
        }
        window.scrollTo(0, document.getElementById('ja-form-card') ? document.getElementById('ja-form-card').getBoundingClientRect().top + window.pageYOffset - 20 : 0);
    }

    function validateStep(n) {
        if (n === 1) {
            var nome = document.getElementById('ja-nome');
            if (!nome || !nome.value.trim()) {
                alert('Preencha o nome do aprendiz.');
                if (nome) nome.focus();
                return false;
            }
        }
        if (n === 2) {
            var r = document.querySelector('input[name="tipoEquipamento"]:checked');
            if (!r) {
                alert('Selecione o tipo de equipamento.');
                return false;
            }
            toggleModeloFields(r.value);
        }
        if (n === 5) {
            var t = document.querySelector('input[name="tipoTarefa"]:checked');
            if (!t) {
                alert('Selecione o tipo de tarefa.');
                return false;
            }
        }
        return true;
    }

    function init() {
        var form = document.getElementById('ja-form');
        if (form) {
            var btnPrev = document.getElementById('ja-btn-prev');
            var btnNext = document.getElementById('ja-btn-next');
            if (btnPrev) btnPrev.addEventListener('click', function() {
                if (currentStep > 1) showStep(currentStep - 1);
            });
            if (btnNext) btnNext.addEventListener('click', function() {
                if (validateStep(currentStep) && currentStep < totalSteps) showStep(currentStep + 1);
            });
            showStep(1);
            initJaSelectGlass(form);
            var nomeInput = document.getElementById('ja-nome');
            if (nomeInput && getCurrentUser()) {
                nomeInput.value = getCurrentUser().trim();
                nomeInput.placeholder = 'Preenchido com o usuário logado';
            }
            updateMetaUser();
            updateMetaDatetime();
            setInterval(updateMetaDatetime, 1000);

            form.addEventListener('submit', function(e) {
                e.preventDefault();
                var nome = (document.getElementById('ja-nome') && document.getElementById('ja-nome').value) ? document.getElementById('ja-nome').value.trim() : '';
                var tarefasDia = (document.getElementById('ja-tarefas-dia') && document.getElementById('ja-tarefas-dia').value) ? document.getElementById('ja-tarefas-dia').value.trim() : '';
                var tipoEquip = (form.querySelector('input[name="tipoEquipamento"]:checked') && form.querySelector('input[name="tipoEquipamento"]:checked').value) || '';
                var modeloNotebook = (document.getElementById('ja-modelo-notebook') && document.getElementById('ja-modelo-notebook').value) || '';
                var modeloHandheld = (document.getElementById('ja-modelo-handheld') && document.getElementById('ja-modelo-handheld').value) || '';
                var modeloScanner = (document.getElementById('ja-modelo-scanner') && document.getElementById('ja-modelo-scanner').value) || '';
                var serie = (document.getElementById('ja-serie') && document.getElementById('ja-serie').value) ? document.getElementById('ja-serie').value.trim() : '';
                var tipoTarefa = (form.querySelector('input[name="tipoTarefa"]:checked') && form.querySelector('input[name="tipoTarefa"]:checked').value) || '';
                var resumo = (document.getElementById('ja-resumo') && document.getElementById('ja-resumo').value) ? document.getElementById('ja-resumo').value.trim() : '';
                var defeito = (document.getElementById('ja-defeito') && document.getElementById('ja-defeito').value) ? document.getElementById('ja-defeito').value.trim() : '';
                var observacao = (document.getElementById('ja-observacao') && document.getElementById('ja-observacao').value) ? document.getElementById('ja-observacao').value.trim() : '';

                if (!nome) {
                    alert('Preencha o nome do aprendiz.');
                    return;
                }
                if (!tipoTarefa) {
                    alert('Selecione o tipo de tarefa.');
                    return;
                }

                var activity = {
                    id: 'ja-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
                    dataRegistro: new Date().toISOString(),
                    nomeAprendiz: nome,
                    tarefasDoDia: tarefasDia,
                    tipoEquipamento: tipoEquip,
                    modeloNotebook: modeloNotebook,
                    modeloHandheld: modeloHandheld,
                    modeloScanner: modeloScanner,
                    numeroSerie: serie,
                    tipoTarefa: tipoTarefa,
                    resumoTarefa: resumo,
                    defeito: defeito,
                    observacao: observacao
                };

                var arr = getActivities();
                arr.unshift(activity);
                saveActivities(arr);
                fillNomeFilter();
                renderLibrary();

                form.reset();
                toggleModeloFields('');
                showStep(1);
                var nomeEl = document.getElementById('ja-nome');
                if (nomeEl && getCurrentUser()) nomeEl.value = getCurrentUser().trim();
                if (nomeEl) nomeEl.focus();
                showJaSuccessModal();
            });
        }

        var modalWrap = document.getElementById('ja-modal-success');
        if (modalWrap) {
            var btnOk = document.getElementById('ja-modal-success-ok');
            var overlay = document.getElementById('ja-modal-success-overlay');
            if (btnOk) btnOk.addEventListener('click', closeJaSuccessModal);
            if (overlay) overlay.addEventListener('click', closeJaSuccessModal);
        }

        var tipoEquip = document.getElementById('ja-tipo-equipamento');
        if (tipoEquip) {
            tipoEquip.addEventListener('change', function() {
                var r = document.querySelector('input[name="tipoEquipamento"]:checked');
                toggleModeloFields(r ? r.value : '');
            });
        }

        var search = document.getElementById('ja-search');
        if (search) {
            search.addEventListener('input', renderLibrary);
            search.addEventListener('keyup', renderLibrary);
        }
        var filterNome = document.getElementById('ja-filter-nome');
        if (filterNome) filterNome.addEventListener('change', renderLibrary);
        var filterTipo = document.getElementById('ja-filter-tipo');
        if (filterTipo) filterTipo.addEventListener('change', renderLibrary);
        var btnExport = document.getElementById('ja-export-csv');
        if (btnExport) btnExport.addEventListener('click', exportarCSV);

        setTheme(getTheme());
        var themeBtn = document.getElementById('ja-theme-toggle');
        if (themeBtn) themeBtn.addEventListener('click', function() { setTheme(getTheme() === 'dark' ? 'light' : 'dark'); });

        var hamburger = document.getElementById('ja-hamburger');
        var dropdown = document.getElementById('ja-dropdown');

        function closeDropdown() {
            if (dropdown) dropdown.classList.remove('open');
            if (hamburger) hamburger.classList.remove('open');
        }
        if (hamburger) hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            if (dropdown) dropdown.classList.toggle('open');
            hamburger.classList.toggle('open');
        });
        document.addEventListener('click', closeDropdown);
        if (dropdown) dropdown.addEventListener('click', function(e) { e.stopPropagation(); });

        fillNomeFilter();
        renderLibrary();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
