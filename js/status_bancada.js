/**
 * STATUS DE BANCADA - AXIS
 * Substitui Google Forms e planilha: atualização e visualização no próprio AXIS.
 */

(function () {
    'use strict';

    // PACKING MONO: 13 até 99 (87 bancadas) | PTW: 44 | REJEITOS: 100–104 | PACKING MACHINE: PM01–PM06
    const PTW_COUNT = 44;
    const BANCADAS_REJEITOS = ['100', '101', '102', '103', '104'];
    /* REJEITOS: coluna de baixo para cima → 100 em baixo, 104 em cima (ordem DOM: top=104, bottom=100) */
    const REJEITOS_LAYOUT = ['104', '103', '102', '101', '100'];
    const BANCADAS_PM = ['PM01', 'PM02', 'PM03', 'PM04', 'PM05', 'PM06'];
    const PM_LAYOUT = ['PM01', 'PM02', 'PM03', 'PM04', 'PM05', 'PM06', null, null, null];

    function pad2(n) {
        return String(n).padStart(2, '0');
    }

    const BANCADAS_PTW = Array.from({ length: PTW_COUNT }, (_, i) => 'PTW_' + pad2(i + 1));
    /* PACKING PTW: direita para esquerda, de BAIXO para CIMA – 01 no canto inferior direito, 44 no topo esquerdo (11 col x 4 linhas) */
    const PTW_COLS = 11;
    const PTW_LAYOUT = (function () {
        var arr = [];
        for (var row = 0; row < 4; row++) {
            var start = (3 - row) * PTW_COLS;
            var end = start + PTW_COLS;
            for (var i = end - 1; i >= start; i--) {
                arr.push(BANCADAS_PTW[i]);
            }
        }
        return arr;
    })();
    /* Rótulos de exibição do PTW (colunas direita→esquerda): número → A01, D01, A02, … */
    const PTW_DISPLAY_LABELS = {
        'PTW_01': 'A01', 'PTW_12': 'D01', 'PTW_23': 'A02', 'PTW_34': 'D02',
        'PTW_02': 'A03', 'PTW_13': 'D03', 'PTW_24': 'A04', 'PTW_35': 'D04',
        'PTW_03': 'A05', 'PTW_14': 'D05', 'PTW_25': 'A06', 'PTW_36': 'D06',
        'PTW_04': 'A07', 'PTW_15': 'D07', 'PTW_26': 'A08', 'PTW_37': 'D08',
        'PTW_05': 'A09', 'PTW_16': 'D09', 'PTW_27': 'A10', 'PTW_38': 'D10',
        'PTW_06': 'A11', 'PTW_17': 'D11', 'PTW_28': 'A12', 'PTW_39': 'D12',
        'PTW_07': 'A13', 'PTW_18': 'D13', 'PTW_29': 'A14', 'PTW_40': 'D14',
        'PTW_08': 'A15', 'PTW_19': 'D15', 'PTW_30': 'A16', 'PTW_41': 'D16',
        'PTW_09': 'A17', 'PTW_20': 'D17', 'PTW_31': 'A18', 'PTW_42': 'D18',
        'PTW_10': 'A19', 'PTW_21': 'D19', 'PTW_32': 'A20', 'PTW_43': 'D20',
        'PTW_11': 'A21', 'PTW_22': 'D21', 'PTW_33': 'A22', 'PTW_44': 'D22'
    };
    const BANCADAS_MONO = Array.from({ length: 87 }, (_, i) => String(13 + i));  /* 13, 14, ..., 99 */

    /* PACKING MONO: 10 colunas x 9 linhas – contagem de BAIXO para CIMA (13 em baixo, como na planilha); pretos nas posições indicadas */
    const MONO_COLS = 10;
    const MONO_ROWS = 9;
    const MONO_LAYOUT = (function () {
        var B = null;
        var cols = [
            ['13', '14', '15', '16', '17', '18', '19', '20', '21'],
            ['22', '23', '24', '25', '26', '27', '28', '29', '30'],
            ['31', '32', '33', '34', '35', B, '36', '37', '38'],
            ['39', '40', '41', '42', '43', '44', '45', '46', '47'],
            ['48', '49', '50', '51', '52', '53', '54', '55', '56'],
            ['57', '58', '59', '60', '61', '62', '63', '64', '65'],
            ['66', '67', '68', '69', '70', '71', '72', '73', '74'],
            ['75', '76', '77', '78', '79', '80', '81', '82', B],
            ['83', '84', '85', '86', '87', '88', '89', '90', '91'],
            ['92', '93', '94', '95', '96', '97', '98', '99', B]
        ];
        cols.forEach(function (c) { c.reverse(); });
        var arr = [];
        for (var row = 0; row < MONO_ROWS; row++) {
            for (var col = MONO_COLS - 1; col >= 0; col--) {
                arr.push(cols[col][row]);
            }
        }
        return arr;
    })();

    /* RETIROS: R01–R06 em coluna de baixo para cima (R01 em baixo, R06 em cima); pretos nas mesmas posições de baixo para cima */
    const BANCADAS_RETIROS = ['R01', 'R02', 'R03', 'R04', 'R05', 'R06'];
    const RETIROS_LAYOUT = [null, null, 'R06', 'R05', null, 'R04', 'R03', 'R02', 'R01'];

    const BANCADAS_ALL = BANCADAS_MONO.concat(BANCADAS_PTW).concat(BANCADAS_REJEITOS).concat(BANCADAS_PM).concat(BANCADAS_RETIROS);

    /** Setor (value do select) → lista de IDs de bancadas para o dropdown */
    const SETOR_TO_BANCADAS = {
        'PACKING MONO': BANCADAS_MONO,
        'PACKING PTW': BANCADAS_PTW,
        'REJEITOS': BANCADAS_REJEITOS,
        'PACKING MACHINE': BANCADAS_PM,
        'RETIROS': BANCADAS_RETIROS
    };

    const API_STATUS = '/api/bancadas/status';

    function statusToClass(status) {
        const s = (status || 'DISPONIVEL').toUpperCase();
        if (s === 'IMPRESSORA') return 'impressora';
        if (s === 'NOTEBOOK') return 'notebook';
        if (s === 'SEM_IMPRESSORA_IMP') return 'sem-impressora-imp';
        if (s === 'SEM_IMPRESSORA_NB') return 'sem-impressora-nb';
        return 'livre';
    }

    function getBaseUrl() {
        try {
            if (window.location.port && window.location.port !== '80' && window.location.port !== '443') {
                return window.location.origin;
            }
            return window.location.origin;
        } catch (e) {
            return '';
        }
    }

    function fetchStatus() {
        var url = getBaseUrl() + API_STATUS;
        return fetch(url, { method: 'GET', credentials: 'same-origin' })
            .then(function (r) {
                if (r.status === 404) {
                    throw new Error('API não encontrada (404). Inicie o site com o start.bat para o servidor AXIS subir e a atualização nos cards funcionar.');
                }
                if (!r.ok) throw new Error('Falha ao carregar status');
                return r.json();
            })
            .then(function (data) {
                return data.bancadas || {};
            });
    }

    function postStatus(bancada, equipamento) {
        return fetch(getBaseUrl() + API_STATUS, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bancada: bancada, equipamento: equipamento })
        })
            .then(function (r) {
                var contentType = r.headers.get('Content-Type') || '';
                if (contentType.indexOf('application/json') !== -1) {
                    return r.json();
                }
                throw new Error('Resposta inválida');
            })
            .then(function (data) {
                if (data.error) throw new Error(data.error);
                return data;
            });
    }

    function fillSelect(selectEl, options) {
        if (!selectEl) return;
        var first = selectEl.querySelector('option[value=""]');
        selectEl.innerHTML = '';
        if (first) selectEl.appendChild(first);
        options.forEach(function (id) {
            var opt = document.createElement('option');
            opt.value = id;
            opt.textContent = id.indexOf('_') !== -1 ? id.replace('_', ' ') : id;  // "PTW 01", "MONO 92", "100"
            selectEl.appendChild(opt);
        });
    }

    /** Label para exibir no dropdown de bancada (PTW usa A01, D01, etc.) */
    function getBancadaDisplayLabel(id) {
        if (PTW_DISPLAY_LABELS[id]) return PTW_DISPLAY_LABELS[id];
        return id;
    }

    /** Preenche o select e o card de BANCADA conforme o setor selecionado; limpa valor. */
    function fillBancadaBySetor(setorValue) {
        var selectBancada = document.getElementById('sb-bancada');
        var triggerBancada = document.getElementById('sb-bancada-trigger');
        var cardBancada = document.getElementById('sb-bancada-card');
        if (!selectBancada || !triggerBancada || !cardBancada) return;

        var list = setorValue ? (SETOR_TO_BANCADAS[setorValue] || []) : [];
        selectBancada.innerHTML = '<option value="">Escolher...</option>';
        list.forEach(function (id) {
            var opt = document.createElement('option');
            opt.value = id;
            opt.textContent = getBancadaDisplayLabel(id);
            selectBancada.appendChild(opt);
        });

        cardBancada.innerHTML = '';
        var placeholder = document.createElement('button');
        placeholder.setAttribute('type', 'button');
        placeholder.className = 'sb-bancada-opt';
        placeholder.setAttribute('data-value', '');
        placeholder.setAttribute('role', 'option');
        placeholder.textContent = 'Escolher...';
        cardBancada.appendChild(placeholder);
        list.forEach(function (id) {
            var btn = document.createElement('button');
            btn.setAttribute('type', 'button');
            btn.className = 'sb-bancada-opt';
            btn.setAttribute('data-value', id);
            btn.setAttribute('role', 'option');
            btn.textContent = getBancadaDisplayLabel(id);
            cardBancada.appendChild(btn);
        });

        selectBancada.value = '';
        triggerBancada.textContent = list.length ? 'Escolher...' : 'Selecione primeiro o setor';
        if (document.getElementById('sb-bancada-custom')) {
            document.getElementById('sb-bancada-custom').setAttribute('aria-expanded', 'false');
            cardBancada.setAttribute('hidden', '');
        }
    }

    function renderGrid(containerId, ids, statusMap) {
        var container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        ids.forEach(function (id) {
            var status = statusMap[id] || 'DISPONIVEL';
            var cell = document.createElement('div');
            cell.className = 'sb-cell ' + statusToClass(status);
            var labelForTitle = id.indexOf('_') !== -1 ? id.replace('_', ' ') : id;
            cell.setAttribute('title', labelForTitle + ' – ' + status);
            cell.setAttribute('data-bancada', id);
            var num;
            if (containerId === 'sb-grid-ptw' && PTW_DISPLAY_LABELS[id]) {
                num = PTW_DISPLAY_LABELS[id];
            } else {
                num = id.replace(/^(PTW_|MONO_)/, '') || id;
            }
            cell.textContent = num;
            container.appendChild(cell);
        });
    }

    function renderGridMono(containerId, layout, statusMap) {
        var container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        layout.forEach(function (id) {
            var cell = document.createElement('div');
            if (id === null || id === undefined) {
                cell.className = 'sb-cell sb-cell-black';
                cell.setAttribute('title', 'Sem bancada');
            } else {
                var status = statusMap[id] || 'DISPONIVEL';
                cell.className = 'sb-cell ' + statusToClass(status);
                cell.setAttribute('title', id + ' – ' + status);
                cell.setAttribute('data-bancada', id);
                cell.textContent = id;
            }
            container.appendChild(cell);
        });
    }

    function renderGridRetiros(containerId, layout, statusMap) {
        renderGridMono(containerId, layout, statusMap);
    }

    function updateResumos(statusMap) {
        function calc(ids) {
            var cap = ids.length;
            var disp = 0;
            var imp = 0;
            var nb = 0;
            var semImp = 0;
            var semNb = 0;
            ids.forEach(function (id) {
                var s = (statusMap[id] || 'DISPONIVEL').toUpperCase();
                if (s === 'DISPONIVEL') disp++;
                else if (s === 'IMPRESSORA') imp++;
                else if (s === 'NOTEBOOK') nb++;
                else if (s === 'SEM_IMPRESSORA_IMP') semImp++;
                else if (s === 'SEM_IMPRESSORA_NB') semNb++;
            });
            var indisp = imp + nb + semImp + semNb;
            var pct = cap > 0 ? Math.round((disp / cap) * 100) : 0;
            return { cap: cap, disp: disp, indisp: indisp, pct: pct, imp: imp, nb: nb, semImp: semImp, semNb: semNb };
        }

        var mono = calc(BANCADAS_MONO);
        var ptw = calc(BANCADAS_PTW);
        var rejeitos = calc(BANCADAS_REJEITOS);
        var pm = calc(BANCADAS_PM);
        var retiros = calc(BANCADAS_RETIROS);

        var monoCap = document.getElementById('mono-cap');
        var monoDisp = document.getElementById('mono-disp');
        var monoIndisp = document.getElementById('mono-indisp');
        var monoPct = document.getElementById('mono-pct');
        var monoImp = document.getElementById('mono-imp');
        var monoNb = document.getElementById('mono-nb');
        if (monoCap) monoCap.textContent = mono.cap;
        if (monoDisp) monoDisp.textContent = mono.disp;
        if (monoIndisp) monoIndisp.textContent = mono.indisp;
        if (monoPct) monoPct.textContent = mono.pct + '%';
        if (monoImp) monoImp.textContent = mono.imp;
        if (monoNb) monoNb.textContent = mono.nb;
        var monoSemimp = document.getElementById('mono-semimp');
        var monoSemnb = document.getElementById('mono-semnb');
        if (monoSemimp) monoSemimp.textContent = mono.semImp;
        if (monoSemnb) monoSemnb.textContent = mono.semNb;

        var ptwCap = document.getElementById('ptw-cap');
        var ptwDisp = document.getElementById('ptw-disp');
        var ptwIndisp = document.getElementById('ptw-indisp');
        var ptwPct = document.getElementById('ptw-pct');
        var ptwImp = document.getElementById('ptw-imp');
        var ptwNb = document.getElementById('ptw-nb');
        if (ptwCap) ptwCap.textContent = ptw.cap;
        if (ptwDisp) ptwDisp.textContent = ptw.disp;
        if (ptwIndisp) ptwIndisp.textContent = ptw.indisp;
        if (ptwPct) ptwPct.textContent = ptw.pct + '%';
        if (ptwImp) ptwImp.textContent = ptw.imp;
        if (ptwNb) ptwNb.textContent = ptw.nb;
        var ptwSemimp = document.getElementById('ptw-semimp');
        var ptwSemnb = document.getElementById('ptw-semnb');
        if (ptwSemimp) ptwSemimp.textContent = ptw.semImp;
        if (ptwSemnb) ptwSemnb.textContent = ptw.semNb;

        var rejeitosCap = document.getElementById('rejeitos-cap');
        var rejeitosDisp = document.getElementById('rejeitos-disp');
        var rejeitosIndisp = document.getElementById('rejeitos-indisp');
        var rejeitosPct = document.getElementById('rejeitos-pct');
        var rejeitosImp = document.getElementById('rejeitos-imp');
        var rejeitosNb = document.getElementById('rejeitos-nb');
        if (rejeitosCap) rejeitosCap.textContent = rejeitos.cap;
        if (rejeitosDisp) rejeitosDisp.textContent = rejeitos.disp;
        if (rejeitosIndisp) rejeitosIndisp.textContent = rejeitos.indisp;
        if (rejeitosPct) rejeitosPct.textContent = rejeitos.pct + '%';
        if (rejeitosImp) rejeitosImp.textContent = rejeitos.imp;
        if (rejeitosNb) rejeitosNb.textContent = rejeitos.nb;
        var rejeitosSemimp = document.getElementById('rejeitos-semimp');
        var rejeitosSemnb = document.getElementById('rejeitos-semnb');
        if (rejeitosSemimp) rejeitosSemimp.textContent = rejeitos.semImp;
        if (rejeitosSemnb) rejeitosSemnb.textContent = rejeitos.semNb;

        var pmCap = document.getElementById('pm-cap');
        var pmDisp = document.getElementById('pm-disp');
        var pmIndisp = document.getElementById('pm-indisp');
        var pmPct = document.getElementById('pm-pct');
        var pmImp = document.getElementById('pm-imp');
        var pmNb = document.getElementById('pm-nb');
        if (pmCap) pmCap.textContent = pm.cap;
        if (pmDisp) pmDisp.textContent = pm.disp;
        if (pmIndisp) pmIndisp.textContent = pm.indisp;
        if (pmPct) pmPct.textContent = pm.pct + '%';
        if (pmImp) pmImp.textContent = pm.imp;
        if (pmNb) pmNb.textContent = pm.nb;
        var pmSemimp = document.getElementById('pm-semimp');
        var pmSemnb = document.getElementById('pm-semnb');
        if (pmSemimp) pmSemimp.textContent = pm.semImp;
        if (pmSemnb) pmSemnb.textContent = pm.semNb;

        var retirosCap = document.getElementById('retiros-cap');
        var retirosDisp = document.getElementById('retiros-disp');
        var retirosIndisp = document.getElementById('retiros-indisp');
        var retirosPct = document.getElementById('retiros-pct');
        var retirosImp = document.getElementById('retiros-imp');
        var retirosNb = document.getElementById('retiros-nb');
        if (retirosCap) retirosCap.textContent = retiros.cap;
        if (retirosDisp) retirosDisp.textContent = retiros.disp;
        if (retirosIndisp) retirosIndisp.textContent = retiros.indisp;
        if (retirosPct) retirosPct.textContent = retiros.pct + '%';
        if (retirosImp) retirosImp.textContent = retiros.imp;
        if (retirosNb) retirosNb.textContent = retiros.nb;
        var retirosSemimp = document.getElementById('retiros-semimp');
        var retirosSemnb = document.getElementById('retiros-semnb');
        if (retirosSemimp) retirosSemimp.textContent = retiros.semImp;
        if (retirosSemnb) retirosSemnb.textContent = retiros.semNb;
    }

    function showMsg(el, text, isError) {
        if (!el) return;
        el.textContent = text;
        el.className = 'sb-msg ' + (isError ? 'error' : 'success');
        el.style.display = 'block';
        setTimeout(function () {
            el.style.display = 'none';
        }, 4000);
    }

    function refreshAll() {
        var setorEl = document.getElementById('sb-setor');
        fillBancadaBySetor(setorEl ? setorEl.value : '');
        /* Sempre mostrar os cards numerados: primeiro com status vazio (todos verdes) */
        var empty = {};
        renderGridMono('sb-grid-mono', MONO_LAYOUT, empty);
        renderGrid('sb-grid-ptw', PTW_LAYOUT, empty);
        renderGrid('sb-grid-rejeitos', REJEITOS_LAYOUT, empty);
        renderGridMono('sb-grid-pm', PM_LAYOUT, empty);
        renderGridRetiros('sb-grid-retiros', RETIROS_LAYOUT, empty);
        updateResumos(empty);

        fetchStatus()
            .then(function (bancadas) {
                renderGridMono('sb-grid-mono', MONO_LAYOUT, bancadas);
                renderGrid('sb-grid-ptw', PTW_LAYOUT, bancadas);
                renderGrid('sb-grid-rejeitos', REJEITOS_LAYOUT, bancadas);
                renderGridMono('sb-grid-pm', PM_LAYOUT, bancadas);
                renderGridRetiros('sb-grid-retiros', RETIROS_LAYOUT, bancadas);
                updateResumos(bancadas);
            })
            .catch(function (err) {
                try {
                    console.error('Status bancada:', err);
                    var msgEl = document.getElementById('sb-msg');
                    if (msgEl) {
                        msgEl.textContent = err.message || 'Não foi possível carregar os status. Inicie o projeto com start.bat (servidor Node).';
                        msgEl.className = 'sb-msg error';
                        msgEl.style.display = 'block';
                    }
                } catch (e) {}
            });
    }

    /** Atualiza apenas grids e resumos a partir da API (sem flash, sem mexer no formulário). Usado no polling para refletir alterações do bot WhatsApp. */
    function refreshFromApi() {
        fetchStatus()
            .then(function (bancadas) {
                renderGridMono('sb-grid-mono', MONO_LAYOUT, bancadas);
                renderGrid('sb-grid-ptw', PTW_LAYOUT, bancadas);
                renderGrid('sb-grid-rejeitos', REJEITOS_LAYOUT, bancadas);
                renderGridMono('sb-grid-pm', PM_LAYOUT, bancadas);
                renderGridRetiros('sb-grid-retiros', RETIROS_LAYOUT, bancadas);
                updateResumos(bancadas);
            })
            .catch(function () {});
    }

    function initSetorCustom() {
        var custom = document.getElementById('sb-setor-custom');
        var trigger = document.getElementById('sb-setor-trigger');
        var card = document.getElementById('sb-setor-card');
        var select = document.getElementById('sb-setor');
        if (!custom || !trigger || !card || !select) return;

        function close() {
            card.setAttribute('hidden', '');
            custom.setAttribute('aria-expanded', 'false');
        }

        trigger.addEventListener('click', function (e) {
            e.preventDefault();
            var isOpen = custom.getAttribute('aria-expanded') === 'true';
            if (isOpen) {
                close();
            } else {
                card.removeAttribute('hidden');
                custom.setAttribute('aria-expanded', 'true');
            }
        });

        card.querySelectorAll('.sb-setor-opt').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                var val = btn.getAttribute('data-value') || '';
                select.value = val;
                trigger.textContent = btn.textContent.trim();
                close();
                fillBancadaBySetor(val);
            });
        });

        document.addEventListener('click', function (e) {
            if (custom.getAttribute('aria-expanded') === 'true' && !custom.contains(e.target)) {
                close();
            }
        });

        select.addEventListener('change', function () {
            var opt = card.querySelector('.sb-setor-opt[data-value="' + select.value + '"]');
            trigger.textContent = opt ? opt.textContent.trim() : 'Escolher...';
            fillBancadaBySetor(select.value || '');
        });
        var selOpt = card.querySelector('.sb-setor-opt[data-value="' + (select.value || '') + '"]');
        trigger.textContent = selOpt ? selOpt.textContent.trim() : 'Escolher...';
        fillBancadaBySetor(select.value || '');
    }

    function initEquipamentoCustom() {
        var custom = document.getElementById('sb-equipamento-custom');
        var trigger = document.getElementById('sb-equipamento-trigger');
        var card = document.getElementById('sb-equipamento-card');
        var select = document.getElementById('sb-equipamento');
        if (!custom || !trigger || !card || !select) return;

        function getLabel(value) {
            if (value === 'DISPONIVEL') return 'Disponível';
            if (value === 'IMPRESSORA') return 'Impressora';
            if (value === 'NOTEBOOK') return 'Notebook';
            if (value === 'SEM_IMPRESSORA_IMP') return 'Bancada sem impressora';
            if (value === 'SEM_IMPRESSORA_NB') return 'Bancada sem notebook';
            return 'Escolher...';
        }

        function syncTrigger() {
            trigger.textContent = getLabel(select.value);
        }

        function close() {
            card.setAttribute('hidden', '');
            custom.setAttribute('aria-expanded', 'false');
        }

        trigger.addEventListener('click', function (e) {
            e.preventDefault();
            var isOpen = custom.getAttribute('aria-expanded') === 'true';
            if (isOpen) {
                close();
            } else {
                card.removeAttribute('hidden');
                custom.setAttribute('aria-expanded', 'true');
            }
        });

        card.querySelectorAll('.sb-equipamento-opt').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                var val = btn.getAttribute('data-value') || '';
                select.value = val;
                trigger.textContent = btn.textContent.trim();
                close();
            });
        });

        document.addEventListener('click', function (e) {
            if (custom.getAttribute('aria-expanded') === 'true' && !custom.contains(e.target)) {
                close();
            }
        });

        select.addEventListener('change', syncTrigger);
        syncTrigger();
    }

    function initBancadaCustom() {
        var custom = document.getElementById('sb-bancada-custom');
        var trigger = document.getElementById('sb-bancada-trigger');
        var card = document.getElementById('sb-bancada-card');
        var select = document.getElementById('sb-bancada');
        if (!custom || !trigger || !card || !select) return;

        function close() {
            card.setAttribute('hidden', '');
            custom.setAttribute('aria-expanded', 'false');
        }

        trigger.addEventListener('click', function (e) {
            e.preventDefault();
            var isOpen = custom.getAttribute('aria-expanded') === 'true';
            if (isOpen) {
                close();
            } else {
                card.removeAttribute('hidden');
                custom.setAttribute('aria-expanded', 'true');
            }
        });

        card.addEventListener('click', function (e) {
            var btn = e.target && e.target.closest && e.target.closest('.sb-bancada-opt');
            if (!btn) return;
            e.preventDefault();
            var val = btn.getAttribute('data-value') || '';
            select.value = val;
            trigger.textContent = btn.textContent.trim();
            close();
        });

        document.addEventListener('click', function (e) {
            if (custom.getAttribute('aria-expanded') === 'true' && !custom.contains(e.target)) {
                close();
            }
        });
    }

    function initForm() {
        var form = document.getElementById('sb-form');
        var msgEl = document.getElementById('sb-msg');
        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var bancada = document.getElementById('sb-bancada');
            var equipamento = document.getElementById('sb-equipamento');
            var b = bancada && bancada.value ? bancada.value.trim() : '';
            var eq = equipamento && equipamento.value ? equipamento.value.trim() : '';
            if (!b || !eq) {
                showMsg(msgEl, 'Preencha bancada e equipamento.', true);
                return;
            }

            postStatus(b, eq)
                .then(function () {
                    showMsg(msgEl, 'Status atualizado com sucesso.', false);
                    refreshAll();
                })
                .catch(function (err) {
                    showMsg(msgEl, err.message || 'Erro ao atualizar status.', true);
                });
        });
    }

    function initMenuHamburger() {
        var hamburger = document.getElementById('sb-hamburger');
        var overlay = document.getElementById('sb-menu-overlay');
        var panel = document.getElementById('sb-menu-panel');
        var closeBtn = document.getElementById('sb-menu-close');
        if (!hamburger || !overlay || !panel) return;

        function openMenu() {
            panel.classList.add('sb-menu-open');
            overlay.classList.add('sb-menu-open');
            hamburger.setAttribute('aria-expanded', 'true');
            overlay.setAttribute('aria-hidden', 'false');
        }

        function closeMenu() {
            panel.classList.remove('sb-menu-open');
            overlay.classList.remove('sb-menu-open');
            hamburger.setAttribute('aria-expanded', 'false');
            overlay.setAttribute('aria-hidden', 'true');
        }

        hamburger.addEventListener('click', function () {
            if (panel.classList.contains('sb-menu-open')) closeMenu();
            else openMenu();
        });

        if (closeBtn) closeBtn.addEventListener('click', closeMenu);
        overlay.addEventListener('click', closeMenu);

        /* Filtro por secção: aplicar classe no body e fechar menu */
        document.querySelectorAll('.sb-menu-item-secao').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var secao = (btn.getAttribute('data-secao') || '').trim();
                var body = document.body;
                body.classList.remove('sb-filter-rejeitos', 'sb-filter-ptw', 'sb-filter-mono', 'sb-filter-pm', 'sb-filter-retiros');
                if (secao) body.classList.add('sb-filter-' + secao);
                closeMenu();
            });
        });
    }

    function initCardFullscreen() {
        function isFullscreen() {
            return !!(document.fullscreenElement || document.webkitFullscreenElement);
        }

        function updateAllExpandIcons() {
            document.querySelectorAll('.sb-card-expand i').forEach(function (icon) {
                var card = icon.closest && icon.closest('.sb-card');
                var active = card && (card === document.fullscreenElement || card === document.webkitFullscreenElement);
                icon.className = active ? 'fas fa-compress' : 'fas fa-expand';
            });
        }

        document.addEventListener('fullscreenchange', updateAllExpandIcons);
        document.addEventListener('webkitfullscreenchange', updateAllExpandIcons);

        document.querySelectorAll('.sb-cards-row .sb-card-expand').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var card = btn.closest && btn.closest('.sb-card');
                if (!card) return;
                try {
                    if (card === document.fullscreenElement || card === document.webkitFullscreenElement) {
                        if (document.exitFullscreen) document.exitFullscreen();
                        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
                    } else {
                        if (card.requestFullscreen) card.requestFullscreen();
                        else if (card.webkitRequestFullscreen) card.webkitRequestFullscreen();
                    }
                } catch (e) {
                    try { console.warn('Fullscreen:', e); } catch (err) {}
                }
            });
        });
    }

    function init() {
        try {
            fillBancadaBySetor('');
            initSetorCustom();
            initBancadaCustom();
            initEquipamentoCustom();
            initForm();
            refreshAll();
            initMenuHamburger();
            initCardFullscreen();

            /* Atualização automática a cada 1s para refletir alterações do bot WhatsApp sem delay */
            var pollInterval = 1000;
            var pollTimer = null;
            function startPolling() {
                if (pollTimer) return;
                refreshFromApi();
                pollTimer = setInterval(refreshFromApi, pollInterval);
            }
            function stopPolling() {
                if (pollTimer) {
                    clearInterval(pollTimer);
                    pollTimer = null;
                }
            }
            startPolling();
            document.addEventListener('visibilitychange', function () {
                if (document.hidden) stopPolling();
                else {
                    refreshFromApi();
                    startPolling();
                }
            });
        } catch (err) {
            try {
                console.error('status_bancada init:', err);
            } catch (e) {}
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
