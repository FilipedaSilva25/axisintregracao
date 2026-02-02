/**
 * REGISTRO DE CHAMADOS (MERCADO LIVRE) - AXIS
 * Página 100% completa. Código blindado.
 *
 * Funcionalidades: registro/edição/exclusão de chamados, lixeira (30 dias),
 * filtro por período (ano/mês), status (Fechado/Aberto/Em Andamento), tipos múltiplos (tags),
 * gráficos (status + tipo), exportação PDF/Excel/CSV/Google, modo escuro, busca.
 * Dados: localStorage (axis_registro_chamados, axis_registro_chamados_lixeira).
 * Arquivos: pages/registro_chamados.html, css/registro_chamados.css, js/registro_chamados.js
 */

(function () {
    'use strict';

const STORAGE_KEY = 'axis_registro_chamados';
const STORAGE_LIXEIRA = 'axis_registro_chamados_lixeira';
const LIXEIRA_DIAS = 30;

function getChamados() {
    try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw == null) return [];
        var arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch (e) {
        return [];
    }
}

function saveChamados(arr) {
    if (!Array.isArray(arr)) return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {
        console.error('Erro ao salvar chamados:', e);
    }
}

function getLixeira() {
    try {
        var raw = localStorage.getItem(STORAGE_LIXEIRA);
        if (raw == null) return [];
        var arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch (e) {
        return [];
    }
}

function saveLixeira(arr) {
    if (!Array.isArray(arr)) return;
    try {
        localStorage.setItem(STORAGE_LIXEIRA, JSON.stringify(arr));
    } catch (e) {
        console.error('Erro ao salvar lixeira:', e);
    }
}

function purgeLixeiraAntiga() {
    var agora = Date.now();
    var limite = LIXEIRA_DIAS * 24 * 60 * 60 * 1000;
    var arr = getLixeira();
    arr = arr.filter(function (item) {
        if (!item || !item.deletedAt) return false;
        try {
            return (agora - new Date(item.deletedAt).getTime()) < limite;
        } catch (e) {
            return false;
        }
    });
    saveLixeira(arr);
}

function moveParaLixeira(chamado) {
    if (!chamado || typeof chamado !== 'object') return;
    var arr = getLixeira();
    var copy = {};
    try {
        for (var k in chamado) if (Object.prototype.hasOwnProperty.call(chamado, k)) copy[k] = chamado[k];
    } catch (e) { return; }
    copy.deletedAt = new Date().toISOString();
    arr.unshift(copy);
    saveLixeira(arr);
}

function restaurarDaLixeira(id) {
    if (!id) return;
    var lixeira = getLixeira();
    var item = lixeira.filter(function (c) { return c && c.id === id; })[0];
    if (!item) return;
    var chamado = {};
    try {
        for (var k in item) if (Object.prototype.hasOwnProperty.call(item, k) && k !== 'deletedAt') chamado[k] = item[k];
    } catch (e) { return; }
    var chamados = getChamados();
    chamados.unshift(chamado);
    saveChamados(chamados);
    saveLixeira(lixeira.filter(function (c) { return c && c.id !== id; }));
    renderTabela();
    renderLixeira();
}

function apagarDefinitivamente(id) {
    if (!id) return;
    var lixeira = getLixeira().filter(function (c) { return c && c.id !== id; });
    saveLixeira(lixeira);
    renderLixeira();
}

function getAno() {
    const el = document.getElementById('rc-ano');
    return el ? parseInt(el.value, 10) || new Date().getFullYear() : new Date().getFullYear();
}

function getMes() {
    var el = document.getElementById('rc-mes');
    if (!el) return new Date().getMonth() + 1;
    var n = parseInt(el.value, 10);
    return (n >= 1 && n <= 12) ? n : new Date().getMonth() + 1;
}

function getFiltro() {
    const btn = document.querySelector('.rc-filter-btn.active[data-filter]');
    return (btn && btn.dataset.filter) ? btn.dataset.filter : 'todos';
}

function getSearchText() {
    const el = document.getElementById('rc-search');
    return el ? (el.value || '').trim().toLowerCase() : '';
}

function chamadoNoPeriodo(c, ano, mes) {
    if (!c.data) return false;
    const d = new Date(c.data);
    return d.getFullYear() === ano && (d.getMonth() + 1) === mes;
}

function filtrarChamados(chamados) {
    if (!Array.isArray(chamados)) return [];
    var ano = getAno();
    var mes = getMes();
    var filtro = getFiltro();
    var busca = getSearchText();
    var list = chamados.slice();
    list = list.filter(c => chamadoNoPeriodo(c, ano, mes));
    if (filtro !== 'todos') list = list.filter(c => c.status === filtro);
    if (busca) {
        list = list.filter(c => {
            var tiposStr = getChamadoTipos(c).map(tipoLabel).join(' ').toLowerCase();
            return (c.chave || '').toLowerCase().includes(busca) ||
                (c.observacao || '').toLowerCase().includes(busca) ||
                tiposStr.includes(busca);
        });
    }
    list.sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));
    return list;
}

var TIPO_OPCOES = [
    { value: 'manutencao', label: 'Manutenção' },
    { value: 'manutencao-preventiva', label: 'Manutenção Preventiva' },
    { value: 'troca-peca', label: 'Troca de peça' },
    { value: 'limpeza', label: 'Limpeza / Higienização' },
    { value: 'calibracao', label: 'Calibração' },
    { value: 'painel', label: 'Painel / Hardware' },
    { value: 'placa-wireless', label: 'Placa Wireless' },
    { value: 'antena-wireless', label: 'Antena Wireless' },
    { value: 'rebobinador', label: 'Rebobinador' },
    { value: 'peel-off', label: 'Peel Off' },
    { value: 'carcaca', label: 'Carcaça' },
    { value: 'cabeca-impressao', label: 'Cabeça de Impressão' },
    { value: 'rolo-plastico', label: 'Rolo Plástico' },
    { value: 'sensor-midia-peel-off', label: 'Sensor de Mídia (Peel Off)' },
    { value: 'sensor-midia-acessorio', label: 'Sensor de Mídia (Acessório)' },
    { value: 'sensor-midia-painel', label: 'Sensor de Mídia (Painel)' },
    { value: 'placa-mae', label: 'Placa Mãe' },
    { value: 'sistema', label: 'Sistema / Software' }
];

function tipoLabel(tipo) {
    if (!tipo) return '—';
    var opt = TIPO_OPCOES.find(function (o) { return o.value === tipo; });
    return opt ? opt.label : tipo;
}

function getChamadoTipos(chamado) {
    if (chamado.tipos && Array.isArray(chamado.tipos)) return chamado.tipos;
    if (chamado.tipo) return [chamado.tipo];
    return [];
}

function formatarData(iso) {
    if (iso == null || iso === '') return '—';
    try {
        var d = new Date(iso);
        if (isNaN(d.getTime())) return '—';
        var data = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        var hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        return data + ' | ' + hora;
    } catch (e) {
        return '—';
    }
}

function formatarDataDia(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function statusLabel(status) {
    if (status === 'fechado') return 'Fechado';
    if (status === 'aberto') return 'Aberto';
    if (status === 'em-andamento') return 'Em Andamento';
    return status || '—';
}

function renderCharts() {
    var list = filtrarChamados(getChamados());
    var ctxStatus = document.getElementById('rc-chart-status');
    var ctxTipo = document.getElementById('rc-chart-tipo');
    if (!ctxStatus || !ctxTipo || typeof Chart === 'undefined') return;

    try {
        if (window.rcChartStatus) {
            window.rcChartStatus.destroy();
            window.rcChartStatus = null;
        }
        if (window.rcChartTipo) {
            window.rcChartTipo.destroy();
            window.rcChartTipo = null;
        }
    } catch (e) {}

    var fechado = list.filter(function (c) { return c && c.status === 'fechado'; }).length;
    var aberto = list.filter(c => c.status === 'aberto').length;
    var emAndamento = list.filter(c => c.status === 'em-andamento').length;
    try {
        window.rcChartStatus = new Chart(ctxStatus, {
            type: 'doughnut',
            data: {
                labels: ['FECHADO', 'ABERTO', 'EM ANDAMENTO'],
                datasets: [{
                    data: [fechado, aberto, emAndamento],
                    backgroundColor: ['#2ecc71', '#ff3b30', '#ff9500'],
                    borderColor: ['#27ae60', '#e74c3c', '#e67e22'],
                    borderWidth: 2,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '55%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        align: 'center',
                        labels: {
                            padding: 18,
                            boxWidth: 14,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    } catch (e) { console.error('Chart status:', e); }

    var counts = {};
    TIPO_OPCOES.forEach(function (o) { counts[o.value] = 0; });
    list.forEach(function (c) {
        getChamadoTipos(c).forEach(function (t) {
            counts[t] = (counts[t] || 0) + 1;
        });
    });
    var tiposComDados = [];
    var valoresTipo = [];
    TIPO_OPCOES.forEach(function (o) {
        if (counts[o.value] > 0) {
            tiposComDados.push(o.label);
            valoresTipo.push(counts[o.value]);
        }
    });
    Object.keys(counts).forEach(function (k) {
        if (!TIPO_OPCOES.find(function (o) { return o.value === k; }) && counts[k] > 0) {
            tiposComDados.push(tipoLabel(k));
            valoresTipo.push(counts[k]);
        }
    });
    if (tiposComDados.length === 0) {
        tiposComDados = ['Nenhum tipo no período'];
        valoresTipo = [0];
    }
    var coresTipo = ['#007aff', '#34c759', '#ff9500', '#af52de', '#ff2d55', '#5ac8fa', '#8e8e93'];
    var bgTipo = [];
    for (var i = 0; i < tiposComDados.length; i++) bgTipo.push(coresTipo[i % coresTipo.length]);
    try {
    window.rcChartTipo = new Chart(ctxTipo, {
        type: 'doughnut',
        data: {
            labels: tiposComDados,
            datasets: [{
                data: valoresTipo,
                backgroundColor: bgTipo,
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '55%',
            plugins: {
                legend: {
                    position: 'bottom',
                    align: 'center',
                    labels: {
                        padding: 18,
                        boxWidth: 14,
                        usePointStyle: true
                    }
                }
            }
        }
    });
    } catch (e) { console.error('Chart tipo:', e); }
}

function renderTabela() {
    var tbody = document.getElementById('rc-tbody');
    var empty = document.getElementById('rc-empty');
    var countEl = document.getElementById('rc-count');
    if (!tbody) return;

    purgeLixeiraAntiga();

    var todos = getChamados();
    var list = filtrarChamados(todos);
    var ano = getAno();
    var mes = getMes();
    var noPeriodo = todos.filter(function (c) { return chamadoNoPeriodo(c, ano, mes); }).length;

    if (countEl) countEl.textContent = noPeriodo + ' chamado' + (noPeriodo !== 1 ? 's' : '') + ' no mês';

    renderCharts();

    const tableWrap = document.querySelector('.rc-table-wrap');
    if (list.length === 0) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
        if (tableWrap) tableWrap.style.display = 'none';
        renderCharts();
        return;
    }
    if (empty) empty.style.display = 'none';
    if (tableWrap) tableWrap.style.display = 'block';

    var html = '';
    list.forEach(c => {
        var tipoClass = c.status || '';
        var statusLabelText = statusLabel(c.status);
        var tiposArr = getChamadoTipos(c);
        var tipoTagsHtml = tiposArr.length ? tiposArr.map(function (t) {
            return '<span class="rc-tipo-tag">' + escapeHtml(tipoLabel(t)) + '</span>';
        }).join(' ') : '—';
        var obs = (c.observacao != null ? String(c.observacao) : '—').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        var safeStatus = (statusLabelText && statusLabelText.toUpperCase) ? statusLabelText.toUpperCase() : '—';
        html += '<tr data-id="' + escapeHtml(c.id || '') + '">' +
            '<td>' + formatarData(c.data) + '</td>' +
            '<td><strong>' + escapeHtml(c.chave || '—') + '</strong></td>' +
            '<td><span class="rc-pill ' + escapeHtml(tipoClass) + '">' + escapeHtml(safeStatus) + '</span></td>' +
            '<td class="rc-cell-tipos">' + tipoTagsHtml + '</td>' +
            '<td>' + obs + '</td>' +
            '<td class="rc-actions-cell">' +
            '<button type="button" class="rc-btn-edit" data-id="' + c.id + '" title="Editar"><i class="fas fa-edit"></i></button> ' +
            '<button type="button" class="rc-btn-delete" data-id="' + c.id + '" title="Excluir (vai para lixeira)"><i class="fas fa-trash-alt"></i></button>' +
            '</td></tr>';
    });
    tbody.innerHTML = html;

    tbody.querySelectorAll('.rc-btn-delete').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.dataset.id;
            if (!id) return;
            const chamado = getChamados().find(c => c.id === id);
            if (!chamado) return;
            openModalDelete(id, chamado);
        });
    });

    tbody.querySelectorAll('.rc-btn-edit').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.dataset.id;
            if (!id) return;
            openModalEdit(id);
        });
    });
}

function openModalDelete(id, chamado) {
    const overlay = document.getElementById('rc-modal-delete-overlay');
    const cancel = document.getElementById('rc-modal-delete-cancel');
    const confirm = document.getElementById('rc-modal-delete-confirm');
    if (!overlay || !confirm) return;
    overlay.style.display = 'flex';
    confirm.onclick = function () {
        const arr = getChamados().filter(c => c.id !== id);
        moveParaLixeira(chamado);
        saveChamados(arr);
        overlay.style.display = 'none';
        renderTabela();
    };
    cancel.onclick = function () {
        overlay.style.display = 'none';
    };
    overlay.onclick = function (e) {
        if (e.target === overlay) overlay.style.display = 'none';
    };
}

function openModalEdit(id) {
    if (!id) return;
    var chamados = getChamados();
    var chamado = null;
    for (var i = 0; i < chamados.length; i++) { if (chamados[i] && chamados[i].id === id) { chamado = chamados[i]; break; } }
    if (!chamado) return;
    var overlay = document.getElementById('rc-modal-edit-overlay');
    var form = document.getElementById('rc-form-edit');
    var editId = document.getElementById('rc-edit-id');
    var editChave = document.getElementById('rc-edit-chave');
    var editStatus = document.getElementById('rc-edit-status');
    var editObs = document.getElementById('rc-edit-obs');
    var editCancel = document.getElementById('rc-modal-edit-cancel');
    if (!overlay || !form || !editId || !editChave || !editStatus || !editObs) return;
    editId.value = id;
    editChave.value = chamado.chave || '';
    editStatus.value = chamado.status || '';
    editObs.value = chamado.observacao || '';
    setTiposSelecionados('edit', getChamadoTipos(chamado));
    syncGlassSelect('rc-edit-status');
    overlay.style.display = 'flex';
    if (editCancel) editCancel.onclick = function () { overlay.style.display = 'none'; };
    overlay.onclick = function (e) {
        if (e.target === overlay) overlay.style.display = 'none';
    };
    form.onsubmit = function (e) {
        e.preventDefault();
        var chave = (document.getElementById('rc-edit-chave') && document.getElementById('rc-edit-chave').value || '').trim();
        var status = document.getElementById('rc-edit-status') && document.getElementById('rc-edit-status').value;
        var tipos = getTiposSelecionados('edit');
        var observacao = (document.getElementById('rc-edit-obs') && document.getElementById('rc-edit-obs').value || '').trim();
        if (!chave || !status) return;
        var arr = getChamados();
        var idx = -1;
        for (var j = 0; j < arr.length; j++) { if (arr[j] && arr[j].id === id) { idx = j; break; } }
        if (idx === -1) return;
        var prev = arr[idx];
        arr[idx] = { id: prev.id, data: prev.data, chave: chave, status: status, tipos: tipos, observacao: observacao };
        saveChamados(arr);
        overlay.style.display = 'none';
        renderTabela();
    };
}

function openModalLixeira() {
    const overlay = document.getElementById('rc-modal-lixeira-overlay');
    const listEl = document.getElementById('rc-lixeira-list');
    const closeBtn = document.getElementById('rc-modal-lixeira-close');
    if (!overlay || !listEl) return;
    renderLixeira();
    overlay.style.display = 'flex';
    closeBtn.onclick = function () {
        overlay.style.display = 'none';
    };
    overlay.onclick = function (e) {
        if (e.target === overlay) overlay.style.display = 'none';
    };
}

function renderLixeira() {
    const listEl = document.getElementById('rc-lixeira-list');
    if (!listEl) return;
    purgeLixeiraAntiga();
    const lixeira = getLixeira();
    if (lixeira.length === 0) {
        listEl.innerHTML = '<div class="rc-lixeira-empty">Nenhum item na lixeira. Itens excluídos são removidos após 30 dias.</div>';
        return;
    }
    listEl.innerHTML = lixeira.map(item => {
        const deleted = formatarData(item.deletedAt);
        const expira = new Date(item.deletedAt);
        expira.setDate(expira.getDate() + LIXEIRA_DIAS);
        return `
            <div class="rc-lixeira-item" data-id="${item.id}">
                <div class="rc-lixeira-item-info">
                    <strong>${escapeHtml(item.chave || '—')}</strong>
                    <span>${statusLabel(item.status)} · Excluído em ${deleted} · Expira em ${formatarData(expira.toISOString())}</span>
                </div>
                <div class="rc-lixeira-item-actions">
                    <button type="button" class="rc-lixeira-item-btn" data-id="${item.id}" title="Restaurar"><i class="fas fa-undo"></i> Restaurar</button>
                    <button type="button" class="rc-lixeira-item-btn-delete" data-id="${item.id}" title="Apagar definitivamente"><i class="fas fa-trash-alt"></i> Apagar definitivamente</button>
                </div>
            </div>
        `;
    }).join('');
    listEl.querySelectorAll('.rc-lixeira-item-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            restaurarDaLixeira(this.dataset.id);
        });
    });
    listEl.querySelectorAll('.rc-lixeira-item-btn-delete').forEach(btn => {
        btn.addEventListener('click', function () {
            apagarDefinitivamente(this.dataset.id);
        });
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getExportData() {
    var list = filtrarChamados(getChamados());
    if (!Array.isArray(list) || list.length === 0) return null;
    var headers = ['Data', 'IS do chamado', 'Status', 'Tipo de atividade', 'Observação'];
    var rows = list.map(function (c) {
        return [
        formatarData(c.data),
        c.chave || '',
        statusLabel(c.status),
        getChamadoTipos(c).map(tipoLabel).join(', '),
        (c.observacao != null ? String(c.observacao) : '').replace(/"/g, '""')
        ];
    });
    return { headers: headers, rows: rows, list: list };
}

function exportCSV() {
    const data = getExportData();
    if (!data) {
        showInfoModal('Nenhum registro', 'Nenhum registro para exportar.');
        return;
    }
    const csv = [data.headers.join(';'), ...data.rows.map(r => r.map(c => `"${c}"`).join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'registro_chamados_' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
}

function exportExcel() {
    const data = getExportData();
    if (!data) {
        showInfoModal('Nenhum registro', 'Nenhum registro para exportar.');
        return;
    }
    const csv = [data.headers.join(';'), ...data.rows.map(r => r.map(c => `"${c}"`).join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'registro_chamados_' + new Date().toISOString().slice(0, 10) + '.xls';
    a.click();
    URL.revokeObjectURL(url);
}

function showInfoModal(title, text) {
    const overlay = document.getElementById('rc-modal-info-overlay');
    const titleEl = document.getElementById('rc-modal-info-title');
    const textEl = document.getElementById('rc-modal-info-text');
    const okBtn = document.getElementById('rc-modal-info-ok');
    if (!overlay || !titleEl || !textEl || !okBtn) return;
    titleEl.textContent = title;
    textEl.textContent = text;
    overlay.style.display = 'flex';
    okBtn.onclick = function () {
        overlay.style.display = 'none';
    };
    overlay.onclick = function (e) {
        if (e.target === overlay) overlay.style.display = 'none';
    };
}

function exportGooglePlanilhas() {
    const data = getExportData();
    if (!data) {
        showInfoModal('Nenhum registro', 'Nenhum registro para exportar.');
        return;
    }
    const csv = [data.headers.join(';'), ...data.rows.map(r => r.map(c => `"${c}"`).join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'registro_chamados_google_' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(function () {
        showInfoModal(
            'Arquivo baixado',
            'Arquivo CSV baixado. Para importar no Google Planilhas: Arquivo > Importar > Fazer upload do arquivo.'
        );
    }, 300);
}

function exportPDF() {
    const data = getExportData();
    if (!data) {
        showInfoModal('Nenhum registro', 'Nenhum registro para exportar.');
        return;
    }
    if (typeof window.jspdf === 'undefined') {
        showInfoModal('PDF indisponível', 'Biblioteca de PDF não carregada. Recarregue a página.');
        return;
    }
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        doc.setFontSize(14);
        doc.text('Registro de Chamados (Mercado Livre)', 14, 12);
        doc.setFontSize(10);
        doc.autoTable({
            head: [data.headers],
            body: data.rows,
            startY: 18,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [0, 122, 255] }
        });
        doc.save('registro_chamados_' + new Date().toISOString().slice(0, 10) + '.pdf');
    } catch (e) {
        console.error(e);
        showInfoModal('Erro ao gerar PDF', 'Tente exportar em CSV.');
    }
}

function toggleExportDropdown() {
    const dd = document.getElementById('rc-export-dropdown');
    if (!dd) return;
    dd.classList.toggle('open');
}

function closeExportDropdown() {
    const dd = document.getElementById('rc-export-dropdown');
    if (dd) dd.classList.remove('open');
}

function togglePeriodDropdown() {
    const dd = document.getElementById('rc-period-dropdown');
    if (!dd) return;
    dd.classList.toggle('open');
    closeExportDropdown();
}

function closePeriodDropdown() {
    const dd = document.getElementById('rc-period-dropdown');
    if (dd) dd.classList.remove('open');
}

var MESES_NOME = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function setupGlassSelects() {
    document.querySelectorAll('.rc-select-glass').forEach(function (wrap) {
        var select = wrap.querySelector('.rc-select-native');
        var trigger = wrap.querySelector('.rc-select-glass-trigger');
        var dropdown = wrap.querySelector('.rc-select-glass-dropdown');
        var valueSpan = wrap.querySelector('.rc-select-glass-value');
        if (!select || !trigger || !dropdown || !valueSpan) return;

        function getSelectedText() {
            var opt = select.options[select.selectedIndex];
            return opt ? opt.textContent : '';
        }
        function updateTrigger() {
            valueSpan.textContent = getSelectedText();
            valueSpan.classList.toggle('rc-select-glass-placeholder', select.value === '');
            dropdown.querySelectorAll('.rc-select-glass-option').forEach(function (el) {
                el.classList.toggle('selected', el.dataset.value === select.value);
            });
        }
        function closeDropdown() {
            trigger.setAttribute('aria-expanded', 'false');
            dropdown.classList.remove('open');
        }

        dropdown.innerHTML = '';
        for (var i = 0; i < select.options.length; i++) {
            var opt = select.options[i];
            var div = document.createElement('div');
            div.className = 'rc-select-glass-option' + (opt.value === select.value ? ' selected' : '');
            div.setAttribute('role', 'option');
            div.dataset.value = opt.value;
            div.textContent = opt.textContent;
            div.addEventListener('click', function () {
                select.value = this.dataset.value;
                updateTrigger();
                closeDropdown();
                select.dispatchEvent(new Event('change', { bubbles: true }));
            });
            dropdown.appendChild(div);
        }
        updateTrigger();

        trigger.addEventListener('click', function (e) {
            e.stopPropagation();
            var isOpen = dropdown.classList.toggle('open');
            trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            document.querySelectorAll('.rc-select-glass-dropdown.open').forEach(function (d) {
                if (d !== dropdown) {
                    d.classList.remove('open');
                    var t = d.closest('.rc-select-glass').querySelector('.rc-select-glass-trigger');
                    if (t) t.setAttribute('aria-expanded', 'false');
                }
            });
        });
        dropdown.addEventListener('click', function (e) {
            e.stopPropagation();
        });
    });
    document.addEventListener('click', function () {
        document.querySelectorAll('.rc-select-glass-dropdown.open').forEach(function (d) {
            d.classList.remove('open');
            var t = d.closest('.rc-select-glass').querySelector('.rc-select-glass-trigger');
            if (t) t.setAttribute('aria-expanded', 'false');
        });
    });
}

function syncGlassSelect(selectId) {
    var wrap = document.querySelector('.rc-select-glass[data-select-id="' + selectId + '"]');
    if (!wrap) return;
    var select = wrap.querySelector('.rc-select-native');
    var valueSpan = wrap.querySelector('.rc-select-glass-value');
    if (!select || !valueSpan) return;
    var opt = select.options[select.selectedIndex];
    valueSpan.textContent = opt ? opt.textContent : '';
    valueSpan.classList.toggle('rc-select-glass-placeholder', select.value === '');
    wrap.querySelectorAll('.rc-select-glass-option').forEach(function (el) {
        el.classList.toggle('selected', el.dataset.value === select.value);
    });
}

function renderTipoTags(selectedValues, containerId, inputId) {
    var container = document.getElementById(containerId);
    var inputEl = document.getElementById(inputId);
    if (!container || !inputEl) return;
    try {
        var arr = Array.isArray(selectedValues) ? selectedValues : (selectedValues ? [selectedValues] : []);
    } catch (e) {
        arr = [];
    }
    inputEl.value = JSON.stringify(arr);
    var content = container.closest('.rc-tipo-tags-trigger-content');
    if (content) {
        var ph = content.querySelector('.rc-tipo-tags-placeholder');
        if (ph) ph.style.display = arr.length ? 'none' : 'block';
    }
    container.style.display = arr.length ? 'flex' : 'none';
    container.innerHTML = arr.map(function (value) {
        var label = tipoLabel(value);
        return '<span class="rc-tipo-tag" data-value="' + escapeHtml(value) + '">' + escapeHtml(label) + '<i class="fas fa-times rc-tipo-tag-remove" aria-label="Remover"></i></span>';
    }).join('');
    container.querySelectorAll('.rc-tipo-tag-remove').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var tag = this.closest('.rc-tipo-tag');
            var value = tag && tag.dataset.value;
            if (!value) return;
            var arr = JSON.parse(inputEl.value || '[]');
            arr = arr.filter(function (v) { return v !== value; });
            inputEl.value = JSON.stringify(arr);
            renderTipoTags(arr, containerId, inputId);
        });
    });
}

function openTipoTagsDropdown(which, forceClose) {
    var prefix = which === 'edit' ? 'rc-edit' : 'rc';
    var trigger = document.getElementById(prefix + '-tipo-tags-trigger');
    var dropdown = document.getElementById(prefix + '-tipo-tags-dropdown');
    if (!trigger || !dropdown) return;
    var isOpen = dropdown.classList.contains('open');
    if (forceClose) {
        dropdown.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
        return;
    }
    if (isOpen) {
        dropdown.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
    } else {
        dropdown.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
    }
}

function initTipoTags(which) {
    var prefix = which === 'edit' ? 'rc-edit' : 'rc';
    var field = document.getElementById(prefix + '-tipo-tags-field');
    var selectedContainer = document.getElementById(prefix + '-tipo-tags-selected');
    var trigger = document.getElementById(prefix + '-tipo-tags-trigger');
    var dropdown = document.getElementById(prefix + '-tipo-tags-dropdown');
    var inputId = prefix + '-tipos-json';
    var inputEl = document.getElementById(inputId);
    if (!field || !selectedContainer || !trigger || !dropdown || !inputEl) return;

    dropdown.innerHTML = TIPO_OPCOES.map(function (o) {
        return '<div class="rc-tipo-tags-option" data-value="' + escapeHtml(o.value) + '" role="option">' + escapeHtml(o.label) + '</div>';
    }).join('');

    dropdown.querySelectorAll('.rc-tipo-tags-option').forEach(function (opt) {
        opt.addEventListener('click', function () {
            var value = this.dataset.value;
            if (!value) return;
            var arr = [];
            try {
                arr = JSON.parse(inputEl.value || '[]');
            } catch (e) {}
            var idx = arr.indexOf(value);
            if (idx === -1) arr.push(value);
            else arr.splice(idx, 1);
            inputEl.value = JSON.stringify(arr);
            renderTipoTags(arr, prefix + '-tipo-tags-selected', inputId);
            this.classList.toggle('selected', arr.indexOf(value) !== -1);
        });
    });

    trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        openTipoTagsDropdown(which, false);
        var arr = getTiposSelecionados(which);
        dropdown.querySelectorAll('.rc-tipo-tags-option').forEach(function (opt) {
            opt.classList.toggle('selected', arr.indexOf(opt.dataset.value) !== -1);
        });
    });

    dropdown.addEventListener('click', function (e) {
        e.stopPropagation();
    });

    document.addEventListener('click', function closeTipoTags(e) {
        if (!field.contains(e.target)) {
            dropdown.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
        }
    });
}

function getTiposSelecionados(which) {
    var prefix = which === 'edit' ? 'rc-edit' : 'rc';
    var inputEl = document.getElementById(prefix + '-tipos-json');
    if (!inputEl) return [];
    try {
        var arr = JSON.parse(inputEl.value || '[]');
        return Array.isArray(arr) ? arr : [];
    } catch (e) {
        return [];
    }
}

function setTiposSelecionados(which, arr) {
    var prefix = which === 'edit' ? 'rc-edit' : 'rc';
    var containerId = prefix + '-tipo-tags-selected';
    var inputId = prefix + '-tipos-json';
    renderTipoTags(Array.isArray(arr) ? arr : [], containerId, inputId);
    var dropdown = document.getElementById(prefix + '-tipo-tags-dropdown');
    if (dropdown) {
        dropdown.querySelectorAll('.rc-tipo-tags-option').forEach(function (opt) {
            opt.classList.toggle('selected', (arr || []).indexOf(opt.dataset.value) !== -1);
        });
    }
}

function populateAnoMes() {
    var anoEl = document.getElementById('rc-ano');
    var mesEl = document.getElementById('rc-mes');
    if (!anoEl || !mesEl) return;
    var anoAtual = new Date().getFullYear();
    var mesAtual = new Date().getMonth() + 1;
    var anoInicio = Math.min(2026, anoAtual);
    anoEl.innerHTML = '';
    for (var a = anoAtual; a >= anoInicio; a--) {
        var opt = document.createElement('option');
        opt.value = a;
        opt.textContent = a;
        if (a === anoAtual) opt.selected = true;
        anoEl.appendChild(opt);
    }
    mesEl.innerHTML = '';
    for (var m = 1; m <= 12; m++) {
        var opt = document.createElement('option');
        opt.value = m;
        opt.textContent = MESES_NOME[m - 1];
        if (m === mesAtual) opt.selected = true;
        mesEl.appendChild(opt);
    }
}

var RC_THEME_KEY = 'axis_registro_chamados_theme';

function getRcTheme() {
    try {
        return localStorage.getItem(RC_THEME_KEY) || 'light';
    } catch (e) {
        return 'light';
    }
}

function setRcTheme(theme) {
    theme = theme === 'dark' ? 'dark' : 'light';
    try {
        localStorage.setItem(RC_THEME_KEY, theme);
    } catch (e) {}
    document.documentElement.setAttribute('data-theme', theme);
    var btn = document.getElementById('rc-theme-toggle');
    if (btn) {
        var icon = btn.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        btn.setAttribute('title', theme === 'dark' ? 'Modo escuro (clique para claro)' : 'Modo claro (clique para escuro)');
    }
}

function init() {
    setRcTheme(getRcTheme());
    var themeBtn = document.getElementById('rc-theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', function () {
            setRcTheme(getRcTheme() === 'dark' ? 'light' : 'dark');
        });
    }

    purgeLixeiraAntiga();
    populateAnoMes();
    setupGlassSelects();
    initTipoTags('form');
    initTipoTags('edit');

    var anoEl = document.getElementById('rc-ano');
    var mesEl = document.getElementById('rc-mes');
    if (anoEl) anoEl.addEventListener('change', renderTabela);
    if (mesEl) mesEl.addEventListener('change', renderTabela);

    var form = document.getElementById('rc-form');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var chaveEl = document.getElementById('rc-chave');
            var statusEl = document.getElementById('rc-status');
            var obsEl = document.getElementById('rc-obs');
            var chave = (chaveEl && chaveEl.value != null ? chaveEl.value : '').trim();
            var status = statusEl && statusEl.value != null ? statusEl.value : '';
            var tipos = getTiposSelecionados('form');
            var observacao = (obsEl && obsEl.value != null ? obsEl.value : '').trim();
            if (!chave || !status) return;
            var chamados = getChamados();
            var novo = {
                id: 'rc-' + Date.now(),
                data: new Date().toISOString(),
                chave: chave,
                status: status,
                tipos: Array.isArray(tipos) ? tipos : [],
                observacao: observacao
            };
            chamados.unshift(novo);
            saveChamados(chamados);
            if (chaveEl) chaveEl.value = '';
            if (statusEl) statusEl.value = '';
            if (obsEl) obsEl.value = '';
            setTiposSelecionados('form', []);
            syncGlassSelect('rc-status');
            renderTabela();
        });
    }

    document.querySelectorAll('.rc-filter-btn[data-filter]').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.rc-filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderTabela();
        });
    });

    const searchEl = document.getElementById('rc-search');
    if (searchEl) {
        searchEl.addEventListener('input', renderTabela);
        searchEl.addEventListener('keyup', renderTabela);
    }

    const exportBtn = document.getElementById('rc-btn-export');
    const exportDropdown = document.getElementById('rc-export-dropdown');
    if (exportBtn && exportDropdown) {
        exportBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            toggleExportDropdown();
        });
        document.addEventListener('click', function () {
            closeExportDropdown();
            closePeriodDropdown();
        });
        exportDropdown.addEventListener('click', function (e) {
            e.stopPropagation();
        });
        exportDropdown.querySelectorAll('.rc-export-option').forEach(btn => {
            btn.addEventListener('click', function () {
                const format = this.dataset.format;
                closeExportDropdown();
                if (format === 'pdf') exportPDF();
                else if (format === 'excel') exportExcel();
                else if (format === 'csv') exportCSV();
                else if (format === 'google') exportGooglePlanilhas();
            });
        });
    }

    const lixeiraBtn = document.getElementById('rc-btn-lixeira');
    if (lixeiraBtn) lixeiraBtn.addEventListener('click', openModalLixeira);

    const periodBtn = document.getElementById('rc-btn-period');
    const periodDropdown = document.getElementById('rc-period-dropdown');
    if (periodBtn && periodDropdown) {
        periodBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            togglePeriodDropdown();
        });
        periodDropdown.addEventListener('click', function (e) {
            e.stopPropagation();
        });
    }

    renderTabela();
    renderCharts();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

})();
