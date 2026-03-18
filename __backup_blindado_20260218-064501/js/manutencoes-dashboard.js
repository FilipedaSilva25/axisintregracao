/* ============================================
   BIBLIOTECA DE MANUTENÇÕES PREVENTIVAS
   Fonte única: localStorage axis_manutencoes_biblioteca
   ============================================ */

const BIBLIOTECA_KEY = 'axis_manutencoes_biblioteca';
const FAVORITOS_KEY = 'axis_manutencoes_favoritos';
const MESES_NOMES = {
    '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
    '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
    '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
};
const MESES_ORDEM = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

const MODELOS_FILTRO = ['ZT411', 'ZD421', 'ZQ630 PLUS'];

const SETORES_FILTRO = [
    'Packing Mono',
    'Check-In',
    'Sorter',
    'NT RK',
    'RK',
    'Insumos',
    'Returns',
    'Retiros',
    'Sortig - Returns',
    'MZ0',
    'MZ1',
    'MZ2',
    'MZ3',
    'MHW',
    'MANUTENÇÃO',
    'SAURON',
    'CX',
    'INVENTÁRIO',
    'RECIVING',
    'SHIPPING - LINHA DE PEIXE 1',
    'SHIPPING - LINHA DE PEIXE 2',
    'RR',
    'ER',
    'ÁREA DE MÁQUINAS',
    'HV',
    'DEPÓSITO DE INTERNAL SYSTEMS',
    'ADM',
    'GATE',
    'AMBULATÓRIO EXTERNO',
    'LIDERANÇA',
    'DOCAS DE EXPEDIÇÃO'
];

const SEED = {
    '2024': {
        '01': [
            { id: 1, data: '2024-01-15', serial: '18J194501111', modelo: 'ZT411', tecnico: 'Filipe da Silva', setor: 'Packing Mono', arquivo: 'AXIS_PV_18J194501111_2024_Janeiro_15-01-2024.pdf' },
            { id: 2, data: '2024-01-20', serial: '18J194502222', modelo: 'ZT411', tecnico: 'João Oliveira', setor: 'Packing PTW', arquivo: 'AXIS_PV_18J194502222_2024_Janeiro_20-01-2024.pdf' }
        ],
        '02': [
            { id: 3, data: '2024-02-10', serial: '21D194504444', modelo: 'ZD421', tecnico: 'Carlos Mendes', setor: 'Check-in', arquivo: 'AXIS_PV_21D194504444_2024_Fevereiro_10-02-2024.pdf' }
        ]
    },
    '2025': {
        '01': [{ id: 4, data: '2025-01-05', serial: '18J194501111', modelo: 'ZT411', tecnico: 'Filipe da Silva', setor: 'Packing Mono', arquivo: 'AXIS_PV_18J194501111_2025_Janeiro_05-01-2025.pdf' }],
        '03': [{ id: 5, data: '2025-03-12', serial: '30Q194506666', modelo: 'ZQ630', tecnico: 'Maria Santos', setor: 'Pagamento', arquivo: 'AXIS_PV_30Q194506666_2025_Março_12-03-2025.pdf' }]
    },
    '2026': {
        '01': [
            { id: 6, data: '2026-01-08', serial: '18J194501111', modelo: 'ZT411', tecnico: 'Filipe da Silva', setor: 'Packing Mono', arquivo: 'AXIS_PV_18J194501111_2026_Janeiro_08-01-2026.pdf' },
            { id: 7, data: '2026-01-15', serial: '21D194504444', modelo: 'ZD421', tecnico: 'João Oliveira', setor: 'Check-in', arquivo: 'AXIS_PV_21D194504444_2026_Janeiro_15-01-2026.pdf' }
        ],
        '02': [{ id: 8, data: '2026-02-10', serial: '18J194502222', modelo: 'ZT411', tecnico: 'Carlos Mendes', setor: 'Packing PTW', arquivo: 'AXIS_PV_18J194502222_2026_Fevereiro_10-02-2026.pdf' }]
    }
};

let anoSelecionado = null;
let mesSelecionado = null;
let isListView = false;
let previewTimeout = null;
let ordenarPor = 'data-desc';
let confirmCallback = null;
let anosSortOrder = 'recente';
let anosSearch = '';
let chartAnosInstance = null;
let chartMesesInstance = null;
let chartSetorInstance = null;
let chartTecnicoInstance = null;

function getBiblioteca() {
    try {
        const raw = localStorage.getItem(BIBLIOTECA_KEY);
        const data = raw ? JSON.parse(raw) : null;
        if (data && typeof data === 'object' && Object.keys(data).length) return data;
    } catch (_) {}
    return JSON.parse(JSON.stringify(SEED));
}

function setBiblioteca(data) {
    try {
        localStorage.setItem(BIBLIOTECA_KEY, JSON.stringify(data));
        return true;
    } catch (_) { return false; }
}

function getFavoritos() {
    try {
        const raw = localStorage.getItem(FAVORITOS_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return new Set(Array.isArray(arr) ? arr : []);
    } catch (_) { return new Set(); }
}

function setFavoritos(set) {
    try {
        localStorage.setItem(FAVORITOS_KEY, JSON.stringify([...set]));
        return true;
    } catch (_) { return false; }
}

function toggleFavorito(id, ano, mes) {
    const key = `${id}-${ano}-${mes}`;
    const fav = getFavoritos();
    if (fav.has(key)) fav.delete(key);
    else fav.add(key);
    setFavoritos(fav);
    refiltrar();
}

function isFavorito(id, ano, mes) {
    return getFavoritos().has(`${id}-${ano}-${mes}`);
}

function proximoIdBiblioteca(bib) {
    let max = 0;
    todosRegistros(bib).forEach(m => {
        const n = Number(m.id);
        if (!isNaN(n) && n > max) max = n;
    });
    return max + 1;
}

function todosRegistros(bib) {
    const out = [];
    Object.keys(bib || {}).forEach(ano => {
        Object.keys(bib[ano] || {}).forEach(mes => {
            (bib[ano][mes] || []).forEach(m => out.push({ ...m, _ano: ano, _mes: mes }));
        });
    });
    return out;
}

function atualizarStats() {
    const bib = getBiblioteca();
    const todos = todosRegistros(bib);
    const elTotal = document.getElementById('stat-total');
    const elAno = document.getElementById('stat-ano');
    const elMes = document.getElementById('stat-mes');
    if (elTotal) elTotal.textContent = todos.length;
    let noAno = 0, noMes = 0;
    if (anoSelecionado) {
        noAno = Object.values(bib[anoSelecionado] || {}).reduce((a, arr) => a + arr.length, 0);
        if (mesSelecionado) {
            noMes = (bib[anoSelecionado] || {})[mesSelecionado.numero]?.length || 0;
        }
    }
    if (elAno) elAno.textContent = noAno;
    if (elMes) elMes.textContent = noMes;
    atualizarGraficos();
}

function atualizarGraficos() {
    if (typeof Chart === 'undefined') return;
    const bib = getBiblioteca();
    const anos = Object.keys(bib || {}).filter(a => a).sort((a, b) => Number(b) - Number(a));
    const totaisAnos = anos.map(a => Object.values(bib[a] || {}).reduce((s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0));

    const ctxAnos = document.getElementById('chart-anos');
    if (ctxAnos) {
        if (chartAnosInstance) chartAnosInstance.destroy();
        chartAnosInstance = new Chart(ctxAnos, {
            type: 'bar',
            data: {
                labels: anos.length ? anos : ['Nenhum ano'],
                datasets: [{
                    label: 'Manutenções',
                    data: anos.length ? totaisAnos : [0],
                    backgroundColor: anos.length ? ['#28a745', '#007aff', '#fd7e14', '#5856d6', '#32ade6'] : 'rgba(0,0,0,0.1)',
                    borderColor: ['#1e7e34', '#0066cc', '#e56b00', '#4840b8', '#2596be'],
                    borderWidth: 2,
                    borderRadius: 10,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { color: '#6e6e73', font: { size: 11 } } },
                    x: { grid: { display: false }, ticks: { color: '#6e6e73', font: { size: 11 } } }
                }
            }
        });
    }

    const ctxMeses = document.getElementById('chart-meses');
    const wrapMeses = document.getElementById('chart-meses-wrap');
    const titleMeses = document.getElementById('chart-meses-title');
    if (ctxMeses && wrapMeses) {
        if (anoSelecionado) {
            if (titleMeses) titleMeses.textContent = 'Manutenções por mês · ' + anoSelecionado;
            wrapMeses.style.display = 'block';
            const meses = bib[anoSelecionado] || {};
            const labels = MESES_ORDEM.map(m => MESES_NOMES[m].slice(0, 3));
            const data = MESES_ORDEM.map(m => (Array.isArray(meses[m]) ? meses[m].length : 0));
            if (chartMesesInstance) chartMesesInstance.destroy();
            chartMesesInstance = new Chart(ctxMeses, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Manutenções',
                        data: data,
                        backgroundColor: data.map((v, i) => v > 0 ? ['#28a745', '#2ecc71', '#32ade6', '#007aff', '#fd7e14', '#ff9f43', '#5856d6', '#28a745', '#2ecc71', '#32ade6', '#007aff', '#fd7e14'][i] : 'rgba(0,0,0,0.06)'),
                        borderColor: data.map((v) => v > 0 ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.08)'),
                        borderWidth: 2,
                        borderRadius: 8,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { color: '#6e6e73', font: { size: 10 } } },
                        x: { grid: { display: false }, ticks: { color: '#6e6e73', font: { size: 10 } } }
                    }
                }
            });
        } else {
            if (titleMeses) titleMeses.textContent = 'Manutenções por mês';
            wrapMeses.style.display = 'block';
            if (chartMesesInstance) {
                chartMesesInstance.destroy();
                chartMesesInstance = null;
            }
            if (ctxMeses) {
                chartMesesInstance = new Chart(ctxMeses, {
                    type: 'bar',
                    data: {
                        labels: MESES_ORDEM.map(m => MESES_NOMES[m].slice(0, 3)),
                        datasets: [{ label: 'Manutenções', data: MESES_ORDEM.map(() => 0), backgroundColor: 'rgba(0,0,0,0.05)', borderColor: 'rgba(0,0,0,0.08)', borderWidth: 1, borderRadius: 6 }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true }, x: { grid: { display: false } } }
                    }
                });
            }
        }
    }

    /* Gráfico: Distribuição por setor (pizza) */
    const ctxSetor = document.getElementById('chart-setor');
    const wrapSetor = document.getElementById('chart-setor-wrap');
    if (ctxSetor && wrapSetor) {
        const todos = todosRegistros(bib);
        const bySetor = {};
        todos.forEach(m => {
            const s = (m.setor || 'Sem setor').trim();
            bySetor[s] = (bySetor[s] || 0) + 1;
        });
        const setorLabels = Object.keys(bySetor).sort((a, b) => bySetor[b] - bySetor[a]);
        const setorData = setorLabels.map(s => bySetor[s]);
        const coresSetor = ['#28a745', '#007aff', '#fd7e14', '#5856d6', '#32ade6', '#2ecc71', '#ff9f43', '#e056fd'];
        if (chartSetorInstance) chartSetorInstance.destroy();
        chartSetorInstance = new Chart(ctxSetor, {
            type: 'doughnut',
            data: {
                labels: setorLabels.length ? setorLabels : ['Sem dados'],
                datasets: [{
                    data: setorData.length ? setorData : [1],
                    backgroundColor: setorLabels.map((_, i) => coresSetor[i % coresSetor.length]),
                    borderColor: '#fff',
                    borderWidth: 2,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#6e6e73', font: { size: 11 }, padding: 12 } }
                },
                cutout: '55%'
            }
        });
    }

    /* Gráfico: Manutenções por técnico (barras horizontais) */
    const ctxTec = document.getElementById('chart-tecnico');
    const wrapTec = document.getElementById('chart-tecnico-wrap');
    if (ctxTec && wrapTec) {
        const todos = todosRegistros(bib);
        const byTecnico = {};
        todos.forEach(m => {
            const t = (m.tecnico || 'Sem técnico').trim();
            byTecnico[t] = (byTecnico[t] || 0) + 1;
        });
        const tecEntries = Object.entries(byTecnico).sort((a, b) => b[1] - a[1]).slice(0, 8);
        const tecLabels = tecEntries.map(([k]) => k);
        const tecData = tecEntries.map(([, v]) => v);
        if (chartTecnicoInstance) chartTecnicoInstance.destroy();
        chartTecnicoInstance = new Chart(ctxTec, {
            type: 'bar',
            data: {
                labels: tecLabels.length ? tecLabels : ['—'],
                datasets: [{
                    label: 'Manutenções',
                    data: tecData.length ? tecData : [0],
                    backgroundColor: tecData.map((_, i) => ['#28a745', '#2ecc71', '#32ade6', '#007aff', '#fd7e14', '#ff9f43', '#5856d6', '#e056fd'][i % 8]),
                    borderColor: tecData.map((_, i) => ['#1e7e34', '#27ae60', '#2596be', '#0066cc', '#e56b00', '#e67e22', '#4840b8', '#c0392b'][i % 8]),
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { color: '#6e6e73', font: { size: 10 } } },
                    y: { grid: { display: false }, ticks: { color: '#6e6e73', font: { size: 10 }, maxRotation: 0 } }
                }
            }
        });
    }
}

function formatarData(s) {
    try {
        const d = new Date(s + 'T00:00:00');
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (_) { return s; }
}

function toggleViewMode() {
    isListView = !isListView;
    if (anoSelecionado && mesSelecionado) {
        const manuts = (getBiblioteca()[anoSelecionado] || {})[mesSelecionado.numero] || [];
        aplicarBuscaEFiltro(manuts);
    }
}

function toggleViewModeTo(modo) {
    isListView = (modo === 'tabela');
    const btnCards = document.getElementById('btn-view-cards');
    const btnTabela = document.getElementById('btn-view-tabela');
    if (btnCards) btnCards.classList.toggle('active', !isListView);
    if (btnTabela) btnTabela.classList.toggle('active', isListView);
    if (anoSelecionado && mesSelecionado) {
        const manuts = (getBiblioteca()[anoSelecionado] || {})[mesSelecionado.numero] || [];
        aplicarBuscaEFiltro(manuts);
    }
}

function _norm(s) { return (s || '').trim().toLowerCase(); }

function aplicarFiltroPeriodo(lista) {
    const periodo = (document.getElementById('filter-periodo')?.value || 'todos').trim();
    if (!periodo || periodo === 'todos') return lista;
    const now = new Date();
    const hoje = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return lista.filter(m => {
        if (!m.data) return false;
        const d = new Date(String(m.data).slice(0, 10) + 'T12:00:00').getTime();
        if (periodo === '7') {
            const lim = hoje - 7 * 24 * 60 * 60 * 1000;
            return d >= lim;
        }
        if (periodo === '30') {
            const lim = hoje - 30 * 24 * 60 * 60 * 1000;
            return d >= lim;
        }
        if (periodo === 'ano') {
            const inicioAno = new Date(now.getFullYear(), 0, 1).getTime();
            return d >= inicioAno;
        }
        return true;
    });
}

function aplicarBuscaEFiltro(manutencoes) {
    const q = (document.getElementById('mp-busca')?.value || '').trim().toLowerCase();
    const setor = (document.getElementById('filter-setor')?.value || '').trim();
    const modelo = (document.getElementById('filter-modelo')?.value || '').trim();
    const agrupar = (document.getElementById('filter-agrupar')?.value || '').trim();
    let list = (manutencoes || []).slice();
    if (q) {
        list = list.filter(m => {
            const s = [m.serial, m.modelo, m.setor, m.tecnico, m.arquivo, (m._ano || ''), (m._mes || '')].filter(Boolean).join(' ').toLowerCase();
            return s.includes(q);
        });
    }
    if (setor) list = list.filter(m => _norm(m.setor) === _norm(setor));
    if (modelo) list = list.filter(m => _norm(m.modelo) === _norm(modelo));
    list = aplicarFiltroPeriodo(list);
    const ord = (document.getElementById('filter-ordem')?.value || ordenarPor) || 'data-desc';
    const [campo, dir] = ord.includes('-') ? ord.split('-') : [ord, 'asc'];
    list.sort((a, b) => {
        let va = (campo === 'data' ? (a.data || '') : (a[campo] || '').toString().toLowerCase());
        let vb = (campo === 'data' ? (b.data || '') : (b[campo] || '').toString().toLowerCase());
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return dir === 'desc' ? -cmp : cmp;
    });
    atualizarStatsHistorico(list);
    if (isListView) renderizarLista(list); else renderizarGrid(list, agrupar);
}

function esc(s) {
    if (s == null || s === undefined) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function cardManutencaoHtml(m, ano, mes) {
    const id = m.id != null ? String(m.id) : '';
    const mesNome = (mesSelecionado?.nome ? mesSelecionado.nome : (MESES_NOMES[mes] || '')).slice(0, 3);
    const favorito = isFavorito(id, ano, mes);
    return `
    <div class="mp-manut-card" data-id="${esc(id)}" data-ano="${esc(ano)}" data-mes="${esc(mes)}">
        <div class="mp-manut-header">
            <span class="mp-manut-title">${esc(m.modelo)} – ${esc(m.serial)}</span>
            <div class="mp-manut-header-right">
                <button class="mp-btn-fav" type="button" onclick="event.stopPropagation(); toggleFavorito('${esc(id)}','${esc(ano)}','${esc(mes)}')" title="${favorito ? 'Remover dos favoritos' : 'Marcar favorita'}"><i class="fas fa-star${favorito ? '' : '-o'}"></i></button>
                <span class="mp-manut-date">${formatarData(m.data)}</span>
            </div>
        </div>
        <div class="mp-manut-tags">
            <span class="mp-tag mp-tag-setor"><i class="fas fa-building"></i> ${esc(m.setor) || '-'}</span>
            <span class="mp-tag mp-tag-tecnico"><i class="fas fa-user"></i> ${esc(m.tecnico) || '-'}</span>
            <span class="mp-tag mp-tag-mes"><i class="fas fa-calendar"></i> ${mesNome}</span>
        </div>
        <div class="mp-manut-actions">
            <button class="mp-btn-action" type="button" onclick="event.stopPropagation(); mostrarPreview(this.closest('.mp-manut-card'))"><i class="fas fa-eye"></i> Ver</button>
            <button class="mp-btn-action" type="button" onclick="event.stopPropagation(); baixarManutencao(this.closest('.mp-manut-card'))"><i class="fas fa-download"></i> Baixar</button>
            <button class="mp-btn-action mp-btn-clone" type="button" onclick="event.stopPropagation(); clonarManutencao(this.closest('.mp-manut-card'))" title="Clonar manutenção"><i class="fas fa-copy"></i> Clonar</button>
            <button class="mp-btn-action mp-btn-delete" type="button" data-id="${esc(id)}" data-ano="${esc(ano)}" data-mes="${esc(mes)}" onclick="event.stopPropagation(); confirmarExcluir(this)" title="Excluir"><i class="fas fa-trash-alt"></i></button>
        </div>
    </div>`;
}

function renderizarGrid(manutencoes, agruparPor) {
    const grid = document.getElementById('manutencoes-grid');
    if (!grid) return;
    if (!manutencoes || !manutencoes.length) {
        grid.innerHTML = `
            <div class="mp-empty" style="grid-column:1/-1;">
                <i class="fas fa-clipboard-list"></i>
                <h3>Nenhuma manutenção</h3>
                <p>Não há registros para este período. Tente alterar os filtros.</p>
            </div>`;
        return;
    }
    const ano = anoSelecionado || '';
    const mes = mesSelecionado?.numero || '';
    if (!agruparPor) {
        grid.innerHTML = manutencoes.map(m => cardManutencaoHtml(m, ano, mes)).join('');
        return;
    }
    const grupos = {};
    manutencoes.forEach(m => {
        const key = _norm(m[agruparPor] || 'Sem ' + agruparPor) || '—';
        if (!grupos[key]) grupos[key] = [];
        grupos[key].push(m);
    });
    const labels = { setor: 'Setor', tecnico: 'Técnico', modelo: 'Modelo' };
    grid.innerHTML = Object.entries(grupos).map(([chave, itens]) => `
        <div class="mp-grupo-wrap">
            <h4 class="mp-grupo-title">${labels[agruparPor] || agruparPor}: ${esc(itens[0]?.[agruparPor] || chave)} <span class="mp-grupo-count">(${itens.length})</span></h4>
            <div class="mp-grupo-cards">${itens.map(m => cardManutencaoHtml(m, ano, mes)).join('')}</div>
        </div>
    `).join('');
}

function renderizarLista(manutencoes) {
    const tbody = document.getElementById('manutencoes-table-body');
    if (!tbody) return;
    const list = manutencoes || [];
    const ano = anoSelecionado || '';
    const mes = mesSelecionado?.numero || '';
    tbody.innerHTML = list.map(m => {
        const id = m.id != null ? String(m.id) : '';
        const fav = isFavorito(id, ano, mes);
        return `
        <tr data-id="${esc(id)}" data-ano="${esc(ano)}" data-mes="${esc(mes)}">
            <td><button class="mp-btn-fav mp-btn-fav-inline" type="button" onclick="event.stopPropagation(); toggleFavorito('${esc(id)}','${esc(ano)}','${esc(mes)}')" title="${fav ? 'Remover favorito' : 'Marcar favorita'}"><i class="fas fa-star${fav ? '' : '-o'}"></i></button></td>
            <td>${formatarData(m.data)}</td>
            <td><strong>${esc(m.serial) || '-'}</strong></td>
            <td>${esc(m.modelo) || '-'}</td>
            <td>${esc(m.tecnico) || '-'}</td>
            <td>${esc(m.setor) || '-'}</td>
            <td class="mp-cell-actions">
                <button class="mp-btn-action" type="button" onclick="event.stopPropagation(); mostrarPreview(this.closest('tr'))"><i class="fas fa-eye"></i></button>
                <button class="mp-btn-action" type="button" onclick="event.stopPropagation(); baixarManutencao(this.closest('tr'))"><i class="fas fa-download"></i></button>
                <button class="mp-btn-action mp-btn-clone" type="button" onclick="event.stopPropagation(); clonarManutencao(this.closest('tr'))" title="Clonar"><i class="fas fa-copy"></i></button>
                <button class="mp-btn-action mp-btn-delete" type="button" data-id="${esc(id)}" data-ano="${esc(ano)}" data-mes="${esc(mes)}" onclick="event.stopPropagation(); confirmarExcluir(this)" title="Excluir"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>`;
    }).join('');
}

function getManutencaoFromCard(cardOrRow) {
    if (!cardOrRow) return null;
    const id = cardOrRow.dataset?.id;
    const ano = cardOrRow.dataset?.ano;
    const mes = cardOrRow.dataset?.mes;
    if (!id || !ano || !mes) return null;
    const bib = getBiblioteca();
    const arr = (bib[ano] || {})[mes];
    if (!Array.isArray(arr)) return null;
    return arr.find(function(x) { return String(x.id) === String(id); }) || null;
}

function mostrarPreview(cardOrRow) {
    if (previewTimeout) clearTimeout(previewTimeout);
    const m = getManutencaoFromCard(cardOrRow);
    if (!m) return;
    previewTimeout = setTimeout(() => {
        const modal = document.getElementById('preview-modal');
        const body = document.getElementById('preview-body');
        if (modal && body) {
            body.innerHTML = buildPreviewHtml(m);
            modal.classList.add('show');
        }
        previewTimeout = null;
    }, 100);
}

function buildPreviewHtml(m) {
    var html = '<div class="mp-preview-content">';
    html += '<h4>Identificação do Ativo</h4>';
    html += '<table class="mp-preview-table"><tr><td>Setor</td><td>' + esc(m.setor || '-') + '</td></tr>';
    html += '<tr><td>Unidade</td><td>' + esc(m.unidade || '-') + '</td></tr>';
    html += '<tr><td>Técnico</td><td>' + esc(m.tecnico || '-') + '</td></tr>';
    html += '<tr><td>Data</td><td>' + formatarData(m.data) + '</td></tr>';
    html += '<tr><td>Serial</td><td>' + esc(m.serial || '-') + '</td></tr>';
    html += '<tr><td>Modelo</td><td>' + esc(m.modelo || '-') + '</td></tr>';
    html += '<tr><td>Patrimônio (SELB)</td><td>' + esc(m.selb || '-') + '</td></tr>';
    html += '<tr><td>IP</td><td>' + esc(m.ip || '-') + '</td></tr>';
    html += '<tr><td>MAC Rede</td><td>' + esc(m.macRede || '-') + '</td></tr>';
    html += '<tr><td>MAC Bluetooth</td><td>' + esc(m.macBt || '-') + '</td></tr></table>';
    if (m.checklist && m.checklist.length) {
        html += '<h4>Checklist</h4><ul class="mp-preview-checklist">';
        var grupoAtual = '';
        m.checklist.forEach(function(c) {
            if (c.grupo && c.grupo !== grupoAtual) {
                grupoAtual = c.grupo;
                html += '<li class="mp-preview-grupo">' + esc(c.grupo) + '</li>';
            }
            if (c.checked) html += '<li class="mp-preview-item checked"><i class="fas fa-check"></i> ' + esc(c.item) + '</li>';
        });
        html += '</ul>';
    }
    if (m.observacoes) {
        html += '<h4>Observações</h4><p class="mp-preview-obs">' + esc(m.observacoes) + '</p>';
    }
    html += '</div>';
    return html;
}

function esconderPreview() {
    if (previewTimeout) { clearTimeout(previewTimeout); previewTimeout = null; }
    const modal = document.getElementById('preview-modal');
    if (modal) modal.classList.remove('show');
}

function abrirManutencao(arquivo) {
    if (arquivo) window.open(arquivo, '_blank');
}

function baixarManutencao(cardOrRow) {
    var m = getManutencaoFromCard(cardOrRow);
    if (!m) return;
    if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
        alert('Biblioteca de PDF não carregada. Recarregue a página.');
        return;
    }
    try {
        var blob = gerarPDFManutencaoFromData(m);
        if (!blob) throw new Error('PDF não gerado');
        var nome = m.arquivo || 'AXIS_Manutencao_' + (m.serial || '') + '_' + (formatarData(m.data) || '').replace(/\//g, '-') + '.pdf';
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = nome;
        a.click();
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error(e);
        alert('Erro ao gerar PDF. Tente novamente.');
    }
}

function gerarPDFManutencaoFromData(m) {
    var doc = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    var pageW = doc.internal.pageSize.width;
    var pageH = doc.internal.pageSize.height;
    var margin = 18;
    var sectionGap = 14;
    var COL_GREEN = [40, 167, 69];
    var COL_ORANGE = [253, 126, 20];
    var GLASS_FILL = [255, 255, 255];
    var GLASS_BORDER = [230, 234, 239];
    var y = margin;

    function glassCard(x, y, w, h, accentColor) {
        doc.setFillColor(GLASS_FILL[0], GLASS_FILL[1], GLASS_FILL[2]);
        doc.setDrawColor(accentColor ? accentColor[0] : GLASS_BORDER[0], accentColor ? accentColor[1] : GLASS_BORDER[1], accentColor ? accentColor[2] : GLASS_BORDER[2]);
        doc.setLineWidth(accentColor ? 0.5 : 0.3);
        doc.roundedRect(x, y, w, h, 3, 3, 'FD');
    }
    function checkPageBreak(needed) {
        if (y + needed > pageH - 28) {
            doc.addPage();
            y = margin;
        }
    }

    doc.setFillColor(250, 252, 254);
    doc.roundedRect(0, 0, pageW, 26, 0, 0, 'F');
    doc.setFillColor(COL_GREEN[0], COL_GREEN[1], COL_GREEN[2]);
    doc.roundedRect(0, 0, pageW * 0.4, 26, 0, 0, 'F');
    doc.setFillColor(COL_ORANGE[0], COL_ORANGE[1], COL_ORANGE[2]);
    doc.roundedRect(pageW * 0.38, 0, pageW * 0.62, 26, 0, 0, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text('MANUTENÇÃO', margin + 2, 11);
    doc.text('PREVENTIVA', margin + 2, 18);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text('AXIS • Relatório de Inspeção', pageW - margin - 2, 16, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    y = 34;

    var idItems = [
        ['Setor', m.setor], ['Unidade', m.unidade], ['Técnico', m.tecnico], ['Data', formatarData(m.data)],
        ['Serial Number', m.serial], ['Modelo', m.modelo], ['Patrimônio (SELB)', m.selb],
        ['IP', m.ip], ['MAC Rede', m.macRede], ['MAC Bluetooth', m.macBt]
    ];
    var labelW = 38, colGap = 12, rowH = 8;
    var idPadding = 12;
    var idColW = (pageW - 2 * margin - 2 * idPadding - colGap) / 2;
    var valW = idColW - labelW - 4;
    var idBoxH = 18, col0Y = 0, col1Y = 0;
    idItems.forEach(function(item, i) {
        var val = (item[1] || '—').toString();
        var lines = doc.splitTextToSize(val, valW);
        var lineCount = Math.min(lines.length, 3);
        if (i % 2 === 0) col0Y += lineCount * rowH + 2; else col1Y += lineCount * rowH + 2;
    });
    idBoxH += Math.max(col0Y, col1Y) + 10;
    checkPageBreak(idBoxH + sectionGap);
    glassCard(margin, y, pageW - 2 * margin, idBoxH, COL_GREEN);
    doc.setFontSize(11);
    doc.setTextColor(COL_GREEN[0], COL_GREEN[1], COL_GREEN[2]);
    doc.setFont(undefined, 'bold');
    doc.text('IDENTIFICAÇÃO DO ATIVO', margin + idPadding, y + 6);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    var rowY = y + 14, leftY = rowY, rightY = rowY;
    idItems.forEach(function(item, i) {
        var col = i % 2, isLeft = col === 0;
        var xLabel = margin + idPadding + col * (idColW + colGap);
        var xVal = xLabel + labelW + 4;
        var yy = isLeft ? leftY : rightY;
        doc.setTextColor(100, 116, 139);
        doc.text(item[0] + ':', xLabel, yy);
        doc.setTextColor(30, 41, 59);
        var val = (item[1] || '—').toString();
        var valLines = doc.splitTextToSize(val, valW);
        var useLines = valLines.slice(0, 3);
        if (!useLines.length) useLines = ['—'];
        useLines.forEach(function(line, L) {
            doc.text(line, xVal, yy + L * rowH);
        });
        var advance = useLines.length * rowH + 2;
        if (isLeft) leftY += advance; else rightY += advance;
    });
    y = Math.max(leftY, rightY) + 8 + sectionGap;

    var checklist = m.checklist || [];
    if (checklist.length) {
        var grupos = {};
        checklist.forEach(function(c) {
            var g = c.grupo || 'Outros';
            if (!grupos[g]) grupos[g] = [];
            grupos[g].push(c);
        });
        var titulos = Object.keys(grupos);
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.setFont(undefined, 'bold');
        doc.text('CHECKLIST DE INSPEÇÃO', margin, y + 6);
        doc.setFont(undefined, 'normal');
        y += 10;
        var nCol = 3, gap = 5, cardPad = 10;
        var cardW = (pageW - 2 * margin - (nCol - 1) * gap) / nCol;
        var cardTextW = cardW - cardPad * 2 - 2;
        for (var r = 0; r < Math.ceil(titulos.length / 3); r++) {
            var rowTitulos = titulos.slice(r * 3, r * 3 + 3);
            var rowH = 0;
            rowTitulos.forEach(function(t) {
                var itens = grupos[t];
                var h = 8 + 8 + (itens.length * 5);
                if (h > rowH) rowH = h;
            });
            rowH = Math.max(rowH, 36);
            if (y + rowH + gap > pageH - 28) {
                doc.addPage();
                y = margin;
            }
            rowTitulos.forEach(function(titulo, colIdx) {
                var itens = grupos[titulo];
                var x0 = margin + colIdx * (cardW + gap);
                var isGreen = colIdx % 2 === 0;
                glassCard(x0, y, cardW, rowH, isGreen ? COL_GREEN : COL_ORANGE);
                var cy = y + 9;
                doc.setFontSize(9);
                doc.setTextColor(isGreen ? COL_GREEN[0] : COL_ORANGE[0], isGreen ? COL_GREEN[1] : COL_ORANGE[1], isGreen ? COL_GREEN[2] : COL_ORANGE[2]);
                doc.setFont(undefined, 'bold');
                doc.text((titulo || '').toUpperCase(), x0 + cardPad, cy);
                cy += 8;
                doc.setFont(undefined, 'normal');
                doc.setFontSize(7);
                doc.setTextColor(51, 65, 85);
                itens.forEach(function(c) {
                    if (cy > y + rowH - 4) return;
                    doc.setDrawColor(200, 208, 220);
                    doc.roundedRect(x0 + cardPad, cy - 2.4, 2.8, 2.8, 0.5, 0.5, 'S');
                    if (c.checked) {
                        doc.setTextColor(COL_GREEN[0], COL_GREEN[1], COL_GREEN[2]);
                        doc.setFontSize(9);
                        doc.text('\u2713', x0 + cardPad + 1.2, cy - 0.2);
                        doc.setFontSize(7);
                        doc.setTextColor(51, 65, 85);
                    }
                    var itemText = (c.item || '').toString();
                    var itemLines = doc.splitTextToSize(itemText, cardTextW - 6);
                    itemLines.forEach(function(ln) {
                        if (cy > y + rowH - 4) return;
                        doc.text(ln, x0 + cardPad + 6, cy);
                        cy += 4.5;
                    });
                    cy += 1.5;
                });
            });
            y += rowH + gap;
        }
        y += sectionGap;
    }

    var obs = m.observacoes || '(Nenhuma observação registrada)';
    var obsTextW = pageW - 2 * margin - 24;
    var obsLines = doc.splitTextToSize(obs, obsTextW);
    var obsLineH = 5.5, obsTitleH = 18, obsMaxH = 72;
    var obsMaxLines = Math.floor((obsMaxH - obsTitleH - 8) / obsLineH);
    var obsLinesToShow = obsLines.slice(0, obsMaxLines);
    var obsBoxH = obsTitleH + obsLinesToShow.length * obsLineH + 10;
    checkPageBreak(obsBoxH + sectionGap);
    glassCard(margin, y, pageW - 2 * margin, obsBoxH, COL_GREEN);
    doc.setFontSize(11);
    doc.setTextColor(COL_GREEN[0], COL_GREEN[1], COL_GREEN[2]);
    doc.setFont(undefined, 'bold');
    doc.text('DESCRIÇÃO DOS PROBLEMAS | OBSERVAÇÕES', margin + 12, y + 6);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    obsLinesToShow.forEach(function(line, i) {
        doc.text(line, margin + 12, y + obsTitleH + 4 + i * obsLineH);
    });
    if (obsLines.length > obsMaxLines) {
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text('... (texto truncado)', margin + 12, y + obsBoxH - 5);
    }
    y += obsBoxH + sectionGap;

    var fotoCell = 18, fotoGap = 4;
    var fotoGridW = 3 * fotoCell + 2 * fotoGap;
    var fotoBoxH = 22 + (2 * fotoCell + fotoGap);
    var fotoSep = 8;
    var fotoColW = (pageW - 2 * margin - fotoSep - 24) / 2;
    var fotoGrid1X = margin + 12 + Math.max(0, (fotoColW - fotoGridW) / 2);
    var fotoGrid2X = margin + 12 + fotoColW + fotoSep + Math.max(0, (fotoColW - fotoGridW) / 2);
    var fotoGridY = y + 22;
    checkPageBreak(fotoBoxH + sectionGap);
    glassCard(margin, y, pageW - 2 * margin, fotoBoxH, COL_ORANGE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(COL_ORANGE[0], COL_ORANGE[1], COL_ORANGE[2]);
    doc.text('REGISTRO FOTOGRÁFICO', margin + 10, y + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COL_ORANGE[0], COL_ORANGE[1], COL_ORANGE[2]);
    doc.text('SITUAÇÃO ANTES', fotoGrid1X, y + 18);
    doc.text('SITUAÇÃO DEPOIS', fotoGrid2X, y + 18);
    doc.setFont('helvetica', 'normal');
    doc.setDrawColor(200, 208, 220);
    doc.setLineWidth(0.3);
    for (var fr = 0; fr < 2; fr++) {
        for (var fc = 0; fc < 3; fc++) {
            var fx = fotoGrid1X + fc * (fotoCell + fotoGap);
            var fy = fotoGridY + fr * (fotoCell + fotoGap);
            doc.roundedRect(fx, fy, fotoCell, fotoCell, 2, 2, 'S');
        }
    }
    for (var fr = 0; fr < 2; fr++) {
        for (var fc = 0; fc < 3; fc++) {
            var fx = fotoGrid2X + fc * (fotoCell + fotoGap);
            var fy = fotoGridY + fr * (fotoCell + fotoGap);
            doc.roundedRect(fx, fy, fotoCell, fotoCell, 2, 2, 'S');
        }
    }
    doc.setDrawColor(230, 234, 239);
    doc.line(margin + 12 + fotoColW + fotoSep / 2, y + 4, margin + 12 + fotoColW + fotoSep / 2, y + fotoBoxH - 4);

    var totalPages = doc.internal.getNumberOfPages();
    var footerH = 12, footerY = pageH - footerH;
    for (var i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(248, 250, 254);
        doc.rect(0, footerY - 1, pageW, footerH + 2, 'F');
        doc.setDrawColor(230, 234, 239);
        doc.setLineWidth(0.2);
        doc.line(margin, footerY - 1, pageW - margin, footerY - 1);
        doc.setFillColor(COL_GREEN[0], COL_GREEN[1], COL_GREEN[2]);
        doc.roundedRect(margin, footerY + 1, 52, 6, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text('AXIS', margin + 4, footerY + 5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text('Manutenção Preventiva', margin + 13, footerY + 5);
        doc.setTextColor(71, 85, 105);
        doc.setFont('helvetica', 'bold');
        doc.text('Página ' + i + ' de ' + totalPages, pageW / 2 - 10, footerY + 5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text('Gerado em ' + new Date().toLocaleString('pt-BR'), pageW - margin - 2, footerY + 5, { align: 'right' });
    }
    return doc.output('blob');
}

function buildPdfHtml(m) {
    var html = '<h2 style="margin:0 0 16px 0;font-size:18px;">MANUTENÇÃO PREVENTIVA</h2>';
    html += '<table style="width:100%;border-collapse:collapse;margin-bottom:20px;"><tr style="background:#f5f5f7"><td style="padding:8px;border:1px solid #ddd;font-weight:600">Campo</td><td style="padding:8px;border:1px solid #ddd;font-weight:600">Valor</td></tr>';
    var campos = [
        ['Setor', m.setor], ['Unidade', m.unidade], ['Técnico', m.tecnico], ['Data', formatarData(m.data)],
        ['Serial', m.serial], ['Modelo', m.modelo], ['Patrimônio (SELB)', m.selb],
        ['IP', m.ip], ['MAC Rede', m.macRede], ['MAC Bluetooth', m.macBt]
    ];
    campos.forEach(function(c) {
        html += '<tr><td style="padding:8px;border:1px solid #ddd">' + esc(c[0]) + '</td><td style="padding:8px;border:1px solid #ddd">' + esc(c[1] || '-') + '</td></tr>';
    });
    html += '</table>';
    if (m.checklist && m.checklist.length) {
        var marcados = m.checklist.filter(function(c) { return c.checked; });
        if (marcados.length) {
            html += '<h3 style="margin:16px 0 8px 0;">Checklist - Itens marcados</h3><ul style="margin:0;padding-left:20px;">';
            marcados.forEach(function(c) {
                html += '<li>' + esc(c.item) + (c.grupo ? ' <small>(' + esc(c.grupo) + ')</small>' : '') + '</li>';
            });
            html += '</ul>';
        }
    }
    if (m.observacoes) {
        html += '<h3 style="margin:16px 0 8px 0;">Observações</h3><p style="margin:0;white-space:pre-wrap;">' + esc(m.observacoes) + '</p>';
    }
    html += '<p style="margin-top:24px;font-size:10px;color:#6e6e73">Gerado em ' + new Date().toLocaleString('pt-BR') + ' – AXIS Intelligence</p>';
    return html;
}

function adicionarManutencao() {
    const inPages = (window.location.pathname || '').includes('pages');
    window.location.href = inPages ? 'manutenção_preventiva.html' : 'pages/manutenção_preventiva.html';
}

function animarContador(el, fim, ms) {
    if (!el || typeof fim !== 'number' || !Number.isFinite(fim)) return;
    const start = performance.now();
    const startVal = 0;
    const dur = Math.max(0, Number(ms) || 400);
    function step(now) {
        if (!el.isConnected) return;
        const t = Math.min((now - start) / dur, 1);
        const v = Math.round(startVal + (fim - startVal) * t);
        el.textContent = v;
        if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function buildAnosData(bib) {
    try {
        const now = new Date();
        const currentYear = now.getFullYear().toString();
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - 14);
        const out = [];
        Object.keys(bib || {}).forEach(ano => {
            try {
                const meses = bib[ano] || {};
                const total = Object.values(meses).reduce((a, arr) => a + (Array.isArray(arr) ? arr.length : 0), 0);
                const breakdown = {};
                MESES_ORDEM.forEach(m => { breakdown[m] = (Array.isArray(meses[m]) ? meses[m].length : 0); });
                let hasRecent = false;
                Object.values(meses).forEach(arr => {
                    (Array.isArray(arr) ? arr : []).forEach(m => {
                        if (!m || !m.data) return;
                        try {
                            const d = new Date(String(m.data).slice(0, 10) + 'T12:00:00');
                            if (!isNaN(d.getTime()) && d >= cutoff) hasRecent = true;
                        } catch (_) {}
                    });
                });
                out.push({ ano: String(ano || ''), total, breakdown, isCurrentYear: ano === currentYear, hasRecent });
            } catch (_) {}
        });
        return out;
    } catch (_) { return []; }
}

function carregarAnosMenu() {
    const nav = document.getElementById('anos-menu');
    if (!nav) return;
    try {
        const bib = getBiblioteca();
        let items = buildAnosData(bib);
        if (!Array.isArray(items)) items = [];
        const q = (String(anosSearch || '').trim()).toLowerCase();
        if (q) items = items.filter(it => String(it.ano || '').includes(q));
        if (anosSortOrder === 'antigo') items.sort((a, b) => Number(a.ano) - Number(b.ano));
        else if (anosSortOrder === 'quantidade') items.sort((a, b) => (b.total || 0) - (a.total || 0));
        else items.sort((a, b) => Number(b.ano) - Number(a.ano));
        const maxTotal = Math.max(1, ...items.map(it => (it.total || 0)));
        const currentYear = new Date().getFullYear().toString();
        const parts = [];
        let insertedSep = false;
        items.forEach((it, idx) => {
        const ano = String(it.ano || '').trim();
        if (!ano) return;
        const past = Number(it.ano) < Number(currentYear);
        if (past && !insertedSep && idx > 0) {
            parts.push('<div class="mp-ano-sep" aria-hidden="true"><span>Anos anteriores</span></div>');
            insertedSep = true;
        }
        const pct = maxTotal ? Math.round((it.total / maxTotal) * 100) : 0;
        const tip = MESES_ORDEM.map(m => MESES_NOMES[m].slice(0, 3) + ': ' + (it.breakdown[m] || 0)).join(' | ');
        const icon = it.total >= 2 ? 'fa-calendar-check' : 'fa-calendar-alt';
        const activeClass = anoSelecionado === it.ano ? ' active' : '';
        const chevronIcon = anoSelecionado === it.ano ? 'fa-chevron-down' : 'fa-chevron-right';
        const heatClass = it.isCurrentYear ? ' mp-ano-current' : (Number(it.ano) < Number(currentYear) ? ' mp-ano-past' : ' mp-ano-future');
        if (it.total === 0) {
            parts.push(`<div class="mp-menu-ano-wrap mp-menu-ano-empty" data-ano="${esc(ano)}">
                <button type="button" class="mp-menu-ano" data-ano="${esc(ano)}" title="${esc(ano)} · 0 manutenções">
                    <i class="fas fa-calendar-alt"></i>
                    <span>${esc(ano)}<br><small class="mp-ano-empty-txt">Nenhuma em ${esc(ano)}</small></span>
                    <i class="fas fa-chevron-right mp-chevron"></i>
                </button>
                <button type="button" class="mp-ano-registrar" data-ano="${esc(ano)}">Registrar primeira</button>
            </div>`);
        } else {
            const badges = [];
            if (it.isCurrentYear) badges.push('<span class="mp-ano-badge mp-ano-badge-atual">Atual</span>');
            if (it.hasRecent) badges.push('<span class="mp-ano-badge mp-ano-badge-novo">Novo</span>');
            const suf = it.total !== 1 ? 'ões' : '';
            const tot = Number(it.total) || 0;
            parts.push(`<div class="mp-menu-ano-wrap${heatClass}" data-ano="${esc(ano)}">
                <button type="button" class="mp-menu-ano${activeClass}" data-ano="${esc(ano)}" data-total="${tot}" title="${esc(ano)} · ${tot} manutenção${suf}\n${esc(tip)}">
                    <span class="mp-ano-bar-wrap"><span class="mp-ano-bar" style="height:${Math.min(100, Math.max(0, pct))}%"></span></span>
                    <i class="fas ${icon} mp-ano-icon"></i>
                    <span class="mp-ano-text">${esc(ano)}<br><small class="mp-ano-count"><span class="mp-ano-n">0</span> manutenção${suf}</small></span>
                    ${badges.join('')}
                    <i class="fas ${chevronIcon} mp-chevron"></i>
                </button>
            </div>`);
        }
    });
    if (parts.length === 0) {
        nav.innerHTML = '<div class="mp-ano-none"><span>Nenhum ano encontrado</span></div>';
    } else {
    nav.innerHTML = parts.join('');
    nav.querySelectorAll('.mp-menu-ano').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            selecionarAno(btn.dataset.ano);
        });
    });
    nav.querySelectorAll('.mp-ano-registrar').forEach(btn => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); adicionarManutencao(); });
    });
    nav.querySelectorAll('.mp-ano-n').forEach(el => {
        const wrap = el.closest('.mp-menu-ano');
        const n = parseInt(wrap?.dataset?.total, 10);
        if (!isNaN(n) && n >= 0) animarContador(el, n, 400);
    });
    }
    setupAnosKeyboard();
    } catch (err) {
        nav.innerHTML = '<div class="mp-ano-none"><span>Erro ao carregar anos.</span></div>';
        if (typeof console !== 'undefined' && console.error) console.error('carregarAnosMenu:', err);
    }
}

function setupAnosKeyboard() {
    const nav = document.getElementById('anos-menu');
    if (!nav) return;
    const btns = () => Array.from(nav.querySelectorAll('.mp-menu-ano'));
    nav.setAttribute('tabindex', '0');
    nav.onkeydown = (e) => {
        if (!e || !['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) return;
        const list = btns();
        e.preventDefault();
        const i = list.findIndex(b => b === document.activeElement);
        if (e.key === 'Enter') {
            if (i >= 0 && list[i]) list[i].click();
            return;
        }
        const next = e.key === 'ArrowDown' ? (i < 0 ? 0 : Math.min(i + 1, list.length - 1)) : (i <= 0 ? list.length - 1 : i - 1);
        if (list[next]) list[next].focus();
    };
}

function selecionarAno(ano) {
    if (!ano) return;
    anoSelecionado = String(ano);
    mesSelecionado = null;
    document.querySelectorAll('.mp-menu-ano').forEach(b => {
        b.classList.remove('active');
        const ch = b.querySelector('.mp-chevron');
        if (ch) { ch.classList.remove('fa-chevron-down'); ch.classList.add('fa-chevron-right'); }
    });
    const btn = document.querySelector(`.mp-menu-ano[data-ano="${ano}"]`);
    if (btn) {
        btn.classList.add('active', 'mp-ano-pulse');
        const ch = btn.querySelector('.mp-chevron');
        if (ch) { ch.classList.remove('fa-chevron-right'); ch.classList.add('fa-chevron-down'); }
        setTimeout(() => btn.classList.remove('mp-ano-pulse'), 400);
    }
    const toolbar = document.getElementById('meses-toolbar');
    const gridMeses = document.getElementById('meses-grid');
    const gridManut = document.getElementById('manutencoes-grid');
    const listManut = document.getElementById('manutencoes-list');
    if (toolbar) { toolbar.style.display = 'flex'; }
    if (document.getElementById('ano-selecionado')) document.getElementById('ano-selecionado').textContent = ano;
    if (document.getElementById('current-path')) document.getElementById('current-path').textContent = ano;
    if (document.getElementById('btn-voltar-meses')) document.getElementById('btn-voltar-meses').style.display = 'none';
    if (document.getElementById('btn-voltar-anos')) document.getElementById('btn-voltar-anos').style.display = 'inline-flex';
    if (gridMeses) { gridMeses.style.display = 'grid'; }
    if (gridManut) { gridManut.style.display = 'none'; gridManut.innerHTML = ''; }
    if (listManut) listManut.style.display = 'none';
    carregarMesesAno(ano);
    atualizarStats();
}

function carregarMesesAno(ano) {
    const grid = document.getElementById('meses-grid');
    if (!grid) return;
    const bib = getBiblioteca();
    const meses = bib[ano] || {};
    grid.innerHTML = MESES_ORDEM.map((num, i) => {
        const nome = MESES_NOMES[num];
        const arr = meses[num] || [];
        const n = arr.length;
        return `<div class="mp-mes-card" data-mes="${num}" data-ano="${ano}">
            <div class="mp-mes-icon"><i class="fas fa-calendar-day"></i></div>
            <div class="mp-mes-label">
                <div class="mp-mes-name">${nome} ${ano}</div>
                <div class="mp-mes-count">${n} manutenção${n !== 1 ? 'ões' : ''}</div>
            </div>
            <i class="fas fa-chevron-right mp-chevron"></i>
        </div>`;
    }).join('');
    grid.querySelectorAll('.mp-mes-card').forEach(card => {
        card.addEventListener('click', () => selecionarMes(card.dataset.mes, card.dataset.ano));
    });
}

function popularFiltros() {
    const listSetor = document.getElementById('panel-setores-list');
    const listModelo = document.getElementById('panel-modelos-list');
    const curSetor = (document.getElementById('filter-setor')?.value || '').trim();
    const curModelo = (document.getElementById('filter-modelo')?.value || '').trim();
    if (listSetor) {
        listSetor.innerHTML = '<button type="button" class="mp-panel-item' + (!curSetor ? ' active' : '') + '" data-value="">Todos os setores</button>' +
            SETORES_FILTRO.map(s => '<button type="button" class="mp-panel-item' + (_norm(curSetor) === _norm(s) ? ' active' : '') + '" data-value="' + esc(s) + '">' + esc(s) + '</button>').join('');
        listSetor.querySelectorAll('.mp-panel-item').forEach(btn => btn.addEventListener('click', () => { escolherSetor(btn.dataset.value); }));
    }
    if (listModelo) {
        listModelo.innerHTML = '<button type="button" class="mp-panel-item' + (!curModelo ? ' active' : '') + '" data-value="">Todos os modelos</button>' +
            MODELOS_FILTRO.map(m => '<button type="button" class="mp-panel-item' + (_norm(curModelo) === _norm(m) ? ' active' : '') + '" data-value="' + esc(m) + '">' + esc(m) + '</button>').join('');
        listModelo.querySelectorAll('.mp-panel-item').forEach(btn => btn.addEventListener('click', () => { escolherModelo(btn.dataset.value); }));
    }
    atualizarBadgesFiltros();
}

function atualizarStatsHistorico(lista) {
    const wrap = document.getElementById('mp-stats-historico');
    const elTec = document.getElementById('stat-top-tecnico');
    const elSet = document.getElementById('stat-top-setor');
    if (!wrap || (!elTec && !elSet)) return;
    if (!lista || !lista.length) {
        wrap.style.display = 'none';
        return;
    }
    wrap.style.display = 'flex';
    const byTec = {}, bySet = {};
    lista.forEach(m => {
        const t = _norm(m.tecnico) || '_';
        const s = _norm(m.setor) || '_';
        byTec[t] = (byTec[t] || 0) + 1;
        bySet[s] = (bySet[s] || 0) + 1;
    });
    const topTec = Object.entries(byTec).filter(([k]) => k !== '_').sort((a, b) => b[1] - a[1])[0];
    const topSet = Object.entries(bySet).filter(([k]) => k !== '_').sort((a, b) => b[1] - a[1])[0];
    if (elTec) elTec.textContent = topTec ? lista.find(m => _norm(m.tecnico) === topTec[0])?.tecnico + ' (' + topTec[1] + ')' : '—';
    if (elSet) elSet.textContent = topSet ? lista.find(m => _norm(m.setor) === topSet[0])?.setor + ' (' + topSet[1] + ')' : '—';
}

function fecharDropdowns() {
    document.getElementById('wrap-setor')?.classList.remove('open');
    document.getElementById('wrap-modelo')?.classList.remove('open');
    document.getElementById('wrap-periodo')?.classList.remove('open');
}

function abrirDropdownPeriodo(e) {
    popularFiltros();
    document.getElementById('wrap-setor')?.classList.remove('open');
    document.getElementById('wrap-modelo')?.classList.remove('open');
    document.getElementById('wrap-periodo')?.classList.toggle('open');
    e?.stopPropagation?.();
}

function escolherPeriodo(valor) {
    const el = document.getElementById('filter-periodo');
    if (el) el.value = valor || 'todos';
    fecharDropdowns();
    refiltrar();
    popularFiltros();
    atualizarBadgesFiltros();
}

function abrirDropdownSetores(e) {
    popularFiltros();
    document.getElementById('wrap-modelo')?.classList.remove('open');
    document.getElementById('wrap-periodo')?.classList.remove('open');
    document.getElementById('wrap-setor')?.classList.toggle('open');
    e?.stopPropagation?.();
}

function abrirDropdownModelos(e) {
    popularFiltros();
    document.getElementById('wrap-setor')?.classList.remove('open');
    document.getElementById('wrap-periodo')?.classList.remove('open');
    document.getElementById('wrap-modelo')?.classList.toggle('open');
    e?.stopPropagation?.();
}

function escolherSetor(value) {
    const el = document.getElementById('filter-setor');
    if (el) el.value = value || '';
    fecharDropdowns();
    refiltrar();
    popularFiltros();
    atualizarBadgesFiltros();
}

function escolherModelo(value) {
    const el = document.getElementById('filter-modelo');
    if (el) el.value = value || '';
    fecharDropdowns();
    refiltrar();
    popularFiltros();
    atualizarBadgesFiltros();
}

function atualizarBadgesFiltros() {
    const setor = (document.getElementById('filter-setor')?.value || '').trim();
    const modelo = (document.getElementById('filter-modelo')?.value || '').trim();
    const periodo = (document.getElementById('filter-periodo')?.value || 'todos').trim();
    const bSetor = document.getElementById('badge-setor');
    const bModelo = document.getElementById('badge-modelo');
    const bPeriodo = document.getElementById('badge-periodo');
    const btnLimpar = document.getElementById('btn-limpar-filtros');
    const t1 = document.getElementById('trigger-setor');
    const t2 = document.getElementById('trigger-modelo');
    const t3 = document.getElementById('trigger-periodo');
    const periodoLabel = { '7': '7 dias', '30': '30 dias', 'ano': 'Este ano', 'todos': 'Todos' };
    if (bSetor) { bSetor.textContent = setor || 'Todos'; bSetor.style.display = setor ? 'inline-flex' : 'none'; }
    if (bModelo) { bModelo.textContent = modelo || 'Todos'; bModelo.style.display = modelo ? 'inline-flex' : 'none'; }
    if (bPeriodo) { bPeriodo.textContent = periodoLabel[periodo] || periodo; bPeriodo.style.display = (periodo && periodo !== 'todos') ? 'inline-flex' : 'none'; }
    if (btnLimpar) btnLimpar.style.display = setor || modelo || (periodo && periodo !== 'todos') ? 'inline-flex' : 'none';
    if (t1) t1.classList.toggle('active', !!setor);
    if (t2) t2.classList.toggle('active', !!modelo);
    if (t3) t3.classList.toggle('active', !!(periodo && periodo !== 'todos'));
}

function limparFiltros() {
    const s = document.getElementById('filter-setor');
    const m = document.getElementById('filter-modelo');
    const p = document.getElementById('filter-periodo');
    if (s) s.value = '';
    if (m) m.value = '';
    if (p) p.value = 'todos';
    atualizarBadgesFiltros();
    refiltrar();
    popularFiltros();
}

function copiarResumo() {
    const total = document.getElementById('stat-total')?.textContent || '0';
    const ano = document.getElementById('stat-ano')?.textContent || '0';
    const mes = document.getElementById('stat-mes')?.textContent || '0';
    const ctx = anoSelecionado && mesSelecionado ? ` | ${mesSelecionado.nome} ${anoSelecionado}` : (anoSelecionado ? ` | Ano ${anoSelecionado}` : '');
    const txt = `Manutenções Preventivas – Total: ${total} | No ano: ${ano} | No mês: ${mes}${ctx}`;
    navigator.clipboard.writeText(txt).then(() => {
        const btn = document.getElementById('btn-copiar-resumo');
        if (btn) {
            const prev = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i>';
            btn.classList.add('copied');
            setTimeout(() => { btn.innerHTML = prev; btn.classList.remove('copied'); }, 1500);
        }
    }).catch(() => {});
}

function selecionarMes(mesNum, ano) {
    const nome = MESES_NOMES[mesNum];
    mesSelecionado = { nome, numero: mesNum };
    const gridMeses = document.getElementById('meses-grid');
    const gridManut = document.getElementById('manutencoes-grid');
    const listManut = document.getElementById('manutencoes-list');
    const filters = document.getElementById('mp-filters');
    if (gridMeses) gridMeses.style.display = 'none';
    if (document.getElementById('ano-selecionado')) document.getElementById('ano-selecionado').textContent = `${nome} ${ano}`;
    if (document.getElementById('current-path')) document.getElementById('current-path').textContent = `${ano} › ${nome}`;
    if (document.getElementById('btn-voltar-anos')) document.getElementById('btn-voltar-anos').style.display = 'none';
    if (document.getElementById('btn-voltar-meses')) document.getElementById('btn-voltar-meses').style.display = 'inline-flex';
    if (filters) { filters.style.display = 'flex'; }
    if (isListView) {
        if (listManut) listManut.style.display = 'block';
        if (gridManut) gridManut.style.display = 'none';
    } else {
        if (gridManut) gridManut.style.display = 'grid';
        if (listManut) listManut.style.display = 'none';
    }
    const manutencoes = (getBiblioteca()[ano] || {})[mesNum] || [];
    popularFiltros();
    aplicarBuscaEFiltro(manutencoes);
    atualizarStats();
}

const EMPTY_STATE_HTML = '<div class="mp-empty mp-empty-hologram" id="mp-empty-initial"><div class="mp-empty-icon-wrap"><i class="fas fa-folder-open"></i></div><h3>Selecione um ano</h3><p>Escolha um ano no menu lateral para ver as manutenções por mês.</p></div>';

function voltarParaAnos() {
    mesSelecionado = null;
    anoSelecionado = null;
    const toolbar = document.getElementById('meses-toolbar');
    const gridMeses = document.getElementById('meses-grid');
    const gridManut = document.getElementById('manutencoes-grid');
    const listManut = document.getElementById('manutencoes-list');
    const filters = document.getElementById('mp-filters');
    if (toolbar) toolbar.style.display = 'none';
    if (gridMeses) gridMeses.style.display = 'none';
    if (filters) filters.style.display = 'none';
    if (gridManut) {
        gridManut.style.display = 'grid';
        gridManut.innerHTML = EMPTY_STATE_HTML;
    }
    if (listManut) listManut.style.display = 'none';
    const path = document.getElementById('current-path');
    if (path) path.textContent = 'Todas as manutenções';
    document.querySelectorAll('.mp-menu-ano').forEach(b => {
        b.classList.remove('active');
        const ch = b.querySelector('.mp-chevron');
        if (ch) { ch.classList.remove('fa-chevron-down'); ch.classList.add('fa-chevron-right'); }
    });
    atualizarStats();
}

function voltarParaMeses() {
    if (!anoSelecionado) return;
    mesSelecionado = null;
    const gridMeses = document.getElementById('meses-grid');
    const gridManut = document.getElementById('manutencoes-grid');
    const listManut = document.getElementById('manutencoes-list');
    const filters = document.getElementById('mp-filters');
    if (gridMeses) gridMeses.style.display = 'grid';
    if (gridManut) gridManut.style.display = 'none';
    if (listManut) listManut.style.display = 'none';
    if (filters) filters.style.display = 'none';
    if (document.getElementById('ano-selecionado')) document.getElementById('ano-selecionado').textContent = anoSelecionado;
    if (document.getElementById('current-path')) document.getElementById('current-path').textContent = anoSelecionado;
    if (document.getElementById('btn-voltar-anos')) document.getElementById('btn-voltar-anos').style.display = 'inline-flex';
    if (document.getElementById('btn-voltar-meses')) document.getElementById('btn-voltar-meses').style.display = 'none';
    carregarMesesAno(anoSelecionado);
    atualizarStats();
}

function exportarBiblioteca() {
    document.querySelector('.mp-export-dropdown')?.classList.remove('open');
    const bib = getBiblioteca();
    const todos = todosRegistros(bib);
    const blob = new Blob([JSON.stringify({ biblioteca: bib, total: todos.length, exportado: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `axis-manutencoes-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
}

function confirmarExcluir(btn) {
    const id = btn?.dataset?.id;
    const ano = btn?.dataset?.ano;
    const mes = btn?.dataset?.mes;
    if (id == null || id === '' || !ano || !mes) return;
    const modal = document.getElementById('confirm-modal');
    const msg = document.getElementById('confirm-message');
    if (msg) msg.textContent = 'Esta manutenção será removida da biblioteca.';
    confirmCallback = () => excluirManutencao(id, ano, mes);
    if (modal) modal.classList.add('show');
}

function fecharConfirm() {
    const modal = document.getElementById('confirm-modal');
    if (modal) modal.classList.remove('show');
    confirmCallback = null;
}

function excluirManutencao(id, ano, mes) {
    fecharConfirm();
    const bib = getBiblioteca();
    const arr = bib[ano]?.[mes];
    if (!arr) return;
    const idx = arr.findIndex(m => String(m.id) === String(id));
    if (idx < 0) return;
    arr.splice(idx, 1);
    if (arr.length === 0) delete bib[ano][mes];
    if (Object.keys(bib[ano]).length === 0) delete bib[ano];
    setBiblioteca(bib);
    const manutencoes = (getBiblioteca()[ano] || {})[mes] || [];
    aplicarBuscaEFiltro(manutencoes);
    atualizarStats();
    carregarAnosMenu();
    if (anoSelecionado) carregarMesesAno(anoSelecionado);
}

function clonarManutencao(cardOrRow) {
    const m = getManutencaoFromCard(cardOrRow);
    if (!m) return;
    const ano = m._ano || anoSelecionado;
    const mes = m._mes || mesSelecionado?.numero;
    if (!ano || !mes) return;
    const bib = getBiblioteca();
    const novoId = proximoIdBiblioteca(bib);
    const hoje = new Date().toISOString().slice(0, 10);
    const clone = { ...m, id: novoId };
    delete clone._ano;
    delete clone._mes;
    clone.data = hoje;
    clone.arquivo = 'AXIS_PV_' + (m.serial || '') + '_' + hoje + '.pdf';
    if (!bib[ano]) bib[ano] = {};
    if (!Array.isArray(bib[ano][mes])) bib[ano][mes] = [];
    bib[ano][mes].push(clone);
    setBiblioteca(bib);
    atualizarStats();
    carregarAnosMenu();
    if (anoSelecionado) carregarMesesAno(anoSelecionado);
    if (mesSelecionado && anoSelecionado === ano && mesSelecionado.numero === mes) {
        const manutencoes = (getBiblioteca()[ano] || {})[mes] || [];
        aplicarBuscaEFiltro(manutencoes);
    }
}

function exportarCSV() {
    document.querySelector('.mp-export-dropdown')?.classList.remove('open');
    const bib = getBiblioteca();
    let list = todosRegistros(bib);
    if (anoSelecionado && mesSelecionado) {
        list = (bib[anoSelecionado] || {})[mesSelecionado.numero] || [];
    }
    const headers = ['Data', 'Serial', 'Modelo', 'Técnico', 'Setor', 'Arquivo'];
    const line = (arr) => arr.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(';');
    const rows = [headers.join(';'), ...list.map(m => line([formatarData(m.data), m.serial, m.modelo, m.tecnico, m.setor, m.arquivo]))];
    const blob = new Blob(['\ufeff' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `axis-manutencoes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
}

function gerarRelatorioPDF() {
    const bib = getBiblioteca();
    let list = [];
    let titulo = 'Manutenções Preventivas';
    if (anoSelecionado && mesSelecionado) {
        list = (bib[anoSelecionado] || {})[mesSelecionado.numero] || [];
        titulo = `${mesSelecionado.nome} ${anoSelecionado}`;
    } else if (anoSelecionado) {
        list = todosRegistros(bib).filter(m => m._ano === anoSelecionado);
        titulo = `Ano ${anoSelecionado}`;
    } else {
        list = todosRegistros(bib);
    }
    const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"><title>AXIS | ${titulo.toUpperCase()}</title>
<style>body{font-family:Inter,sans-serif;padding:24px;color:#1d1d1f}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background:#28a745;color:#fff}h1{font-size:20px;margin-bottom:16px}</style></head>
<body><h1>${titulo}</h1>
<table><thead><tr><th>Data</th><th>Serial</th><th>Modelo</th><th>Técnico</th><th>Setor</th></tr></thead><tbody>
${list.map(m => `<tr><td>${formatarData(m.data)}</td><td>${(m.serial || '').replace(/</g, '&lt;')}</td><td>${(m.modelo || '').replace(/</g, '&lt;')}</td><td>${(m.tecnico || '').replace(/</g, '&lt;')}</td><td>${(m.setor || '').replace(/</g, '&lt;')}</td></tr>`).join('')}
</tbody></table>
<p style="margin-top:16px;font-size:12px;color:#6e6e73">Gerado em ${new Date().toLocaleString('pt-BR')} – AXIS Intelligence</p></body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 300);
}

function atualizarDashboard() {
    carregarAnosMenu();
    atualizarStats();
    if (anoSelecionado) {
        carregarMesesAno(anoSelecionado);
        if (mesSelecionado) {
            const manutencoes = (getBiblioteca()[anoSelecionado] || {})[mesSelecionado.numero] || [];
            aplicarBuscaEFiltro(manutencoes);
        }
    } else {
        voltarParaAnos();
    }
}

function toggleHamburgerMenu() {
    const menu = document.getElementById('hamburger-menu');
    const btn = document.getElementById('hamburger-btn');
    if (menu) menu.classList.toggle('show');
    if (btn) btn.classList.toggle('active');
}

function refiltrar() {
    if (!anoSelecionado || !mesSelecionado) return;
    const manutencoes = (getBiblioteca()[anoSelecionado] || {})[mesSelecionado.numero] || [];
    aplicarBuscaEFiltro(manutencoes);
}

document.addEventListener('DOMContentLoaded', () => {
    try {
    carregarAnosMenu();
    atualizarStats();
    atualizarGraficos();
    const busca = document.getElementById('mp-busca');
    if (busca) busca.addEventListener('input', refiltrar);
    const filterOrdem = document.getElementById('filter-ordem');
    if (filterOrdem) filterOrdem.addEventListener('change', refiltrar);
    const filterAgrupar = document.getElementById('filter-agrupar');
    if (filterAgrupar) filterAgrupar.addEventListener('change', refiltrar);

    document.querySelectorAll('#dropdown-periodo .mp-panel-item').forEach(btn => {
        btn.addEventListener('click', () => escolherPeriodo(btn.dataset.periodo));
    });

    const anosBusca = document.getElementById('anos-busca');
    const anosOrdem = document.getElementById('anos-ordem');
    const btnAdicionarAno = document.getElementById('btn-adicionar-ano');
    if (anosBusca) {
        anosBusca.addEventListener('input', () => {
            anosSearch = (anosBusca.value || '').trim();
            carregarAnosMenu();
        });
    }
    if (anosOrdem) {
        anosOrdem.value = anosSortOrder;
        anosOrdem.addEventListener('change', () => {
            anosSortOrder = (anosOrdem.value || 'recente');
            carregarAnosMenu();
        });
    }
    if (btnAdicionarAno) btnAdicionarAno.addEventListener('click', adicionarManutencao);

    const confirmOk = document.getElementById('confirm-ok');
    const confirmCancel = document.getElementById('confirm-cancel');
    if (confirmOk) confirmOk.addEventListener('click', () => { if (typeof confirmCallback === 'function') confirmCallback(); });
    if (confirmCancel) confirmCancel.addEventListener('click', fecharConfirm);

    const exportToggle = document.getElementById('btn-export-toggle');
    const exportMenu = document.getElementById('export-menu');
    if (exportToggle && exportMenu) {
        exportToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelector('.mp-export-dropdown')?.classList.toggle('open');
        });
    }
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('hamburger-menu');
        const btn = document.getElementById('hamburger-btn');
        if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
            menu.classList.remove('show');
            btn.classList.remove('active');
        }
        if (!document.querySelector('.mp-export-dropdown')?.contains(e.target)) {
            document.querySelector('.mp-export-dropdown')?.classList.remove('open');
        }
        const wrapSetor = document.getElementById('wrap-setor');
        const wrapModelo = document.getElementById('wrap-modelo');
        const wrapPeriodo = document.getElementById('wrap-periodo');
        if (wrapSetor?.classList.contains('open') || wrapModelo?.classList.contains('open') || wrapPeriodo?.classList.contains('open')) {
            if (!wrapSetor?.contains(e.target) && !wrapModelo?.contains(e.target) && !wrapPeriodo?.contains(e.target)) fecharDropdowns();
        }
    });
    } catch (err) {
        if (typeof console !== 'undefined' && console.error) console.error('init dashboard:', err);
    }
});

window.selecionarAno = selecionarAno;
window.selecionarMes = selecionarMes;
window.voltarParaAnos = voltarParaAnos;
window.voltarParaMeses = voltarParaMeses;
window.abrirManutencao = abrirManutencao;
window.baixarManutencao = baixarManutencao;
window.atualizarDashboard = atualizarDashboard;
window.toggleHamburgerMenu = toggleHamburgerMenu;
window.toggleViewMode = toggleViewMode;
window.toggleViewModeTo = toggleViewModeTo;
window.adicionarManutencao = adicionarManutencao;
window.clonarManutencao = clonarManutencao;
window.toggleFavorito = toggleFavorito;
window.mostrarPreview = mostrarPreview;
window.esconderPreview = esconderPreview;
window.exportarBiblioteca = exportarBiblioteca;
window.exportarCSV = exportarCSV;
window.getBiblioteca = getBiblioteca;
window.setBiblioteca = setBiblioteca;
window.confirmarExcluir = confirmarExcluir;
window.fecharConfirm = fecharConfirm;
window.gerarRelatorioPDF = gerarRelatorioPDF;
window.abrirDropdownSetores = abrirDropdownSetores;
window.abrirDropdownModelos = abrirDropdownModelos;
window.fecharDropdowns = fecharDropdowns;
window.limparFiltros = limparFiltros;
window.copiarResumo = copiarResumo;
