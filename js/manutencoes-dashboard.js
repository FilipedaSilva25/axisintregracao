/* ============================================
   BIBLIOTECA DE MANUTENÇÕES PREVENTIVAS
   Fonte única: localStorage axis_manutencoes_biblioteca
   ============================================ */

const BIBLIOTECA_KEY = 'axis_manutencoes_biblioteca';
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
let ordenarPor = 'data';
let confirmCallback = null;
let anosSortOrder = 'recente';
let anosSearch = '';

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
}

function formatarData(s) {
    try {
        const d = new Date(s + 'T00:00:00');
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (_) { return s; }
}

function toggleViewMode() {
    isListView = !isListView;
    const g = document.getElementById('view-mode-icon-grid');
    const l = document.getElementById('view-mode-icon-list');
    const sortWrap = document.getElementById('filter-sort-wrap');
    if (g) g.style.display = isListView ? 'none' : '';
    if (l) l.style.display = isListView ? '' : 'none';
    if (sortWrap) sortWrap.style.display = isListView && mesSelecionado ? 'flex' : 'none';
    if (anoSelecionado && mesSelecionado) {
        const manuts = (getBiblioteca()[anoSelecionado] || {})[mesSelecionado.numero] || [];
        aplicarBuscaEFiltro(manuts);
    }
}

function _norm(s) { return (s || '').trim().toLowerCase(); }

function aplicarBuscaEFiltro(manutencoes) {
    const q = (document.getElementById('mp-busca')?.value || '').trim().toLowerCase();
    const setor = (document.getElementById('filter-setor')?.value || '').trim();
    const modelo = (document.getElementById('filter-modelo')?.value || '').trim();
    let list = (manutencoes || []).slice();
    if (q) {
        list = list.filter(m => {
            const s = [m.serial, m.modelo, m.setor, m.tecnico, m.arquivo].filter(Boolean).join(' ').toLowerCase();
            return s.includes(q);
        });
    }
    if (setor) list = list.filter(m => _norm(m.setor) === _norm(setor));
    if (modelo) list = list.filter(m => _norm(m.modelo) === _norm(modelo));
    const ord = (document.getElementById('filter-ordem')?.value || ordenarPor) || 'data';
    list.sort((a, b) => {
        let va = (a[ord] || '').toString().toLowerCase();
        let vb = (b[ord] || '').toString().toLowerCase();
        if (ord === 'data') {
            va = a.data || '';
            vb = b.data || '';
        }
        return va < vb ? -1 : va > vb ? 1 : 0;
    });
    if (isListView) renderizarLista(list); else renderizarGrid(list);
}

function esc(s) {
    if (s == null || s === undefined) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function renderizarGrid(manutencoes) {
    const grid = document.getElementById('manutencoes-grid');
    if (!grid) return;
    if (!manutencoes || !manutencoes.length) {
        grid.innerHTML = `
            <div class="mp-empty" style="grid-column:1/-1;">
                <i class="fas fa-clipboard-list"></i>
                <h3>Nenhuma manutenção</h3>
                <p>Não há registros para este período.</p>
            </div>`;
        return;
    }
    const ano = anoSelecionado || '';
    const mes = mesSelecionado?.numero || '';
    grid.innerHTML = manutencoes.map((m) => {
        const arq = (m.arquivo || '').replace(/'/g, "\\'");
        const id = m.id != null ? String(m.id) : '';
        return `
        <div class="mp-manut-card" onclick="abrirManutencao('${arq}')" data-id="${esc(id)}" data-ano="${esc(ano)}" data-mes="${esc(mes)}">
            <div class="mp-manut-header">
                <span class="mp-manut-title">${esc(m.modelo)} – ${esc(m.serial)}</span>
                <span class="mp-manut-date">${formatarData(m.data)}</span>
            </div>
            <div class="mp-manut-info"><i class="fas fa-user"></i> ${esc(m.tecnico) || '-'}</div>
            <div class="mp-manut-info"><i class="fas fa-building"></i> ${esc(m.setor) || '-'}</div>
            <div class="mp-manut-actions">
                <button class="mp-btn-action" type="button" onclick="event.stopPropagation(); mostrarPreview('${arq}')"><i class="fas fa-eye"></i> Ver</button>
                <button class="mp-btn-action" type="button" onclick="event.stopPropagation(); baixarManutencao('${arq}')"><i class="fas fa-download"></i> Baixar</button>
                <button class="mp-btn-action mp-btn-delete" type="button" data-id="${esc(id)}" data-ano="${esc(ano)}" data-mes="${esc(mes)}" onclick="event.stopPropagation(); confirmarExcluir(this)" title="Excluir"><i class="fas fa-trash-alt"></i></button>
            </div>
        </div>`;
    }).join('');
}

function renderizarLista(manutencoes) {
    const tbody = document.getElementById('manutencoes-table-body');
    if (!tbody) return;
    const list = manutencoes || [];
    const ano = anoSelecionado || '';
    const mes = mesSelecionado?.numero || '';
    tbody.innerHTML = list.map(m => {
        const arq = (m.arquivo || '').replace(/'/g, "\\'");
        const id = m.id != null ? String(m.id) : '';
        return `
        <tr onclick="abrirManutencao('${arq}')" data-id="${esc(id)}" data-ano="${esc(ano)}" data-mes="${esc(mes)}">
            <td>${formatarData(m.data)}</td>
            <td><strong>${esc(m.serial) || '-'}</strong></td>
            <td>${esc(m.modelo) || '-'}</td>
            <td>${esc(m.tecnico) || '-'}</td>
            <td>${esc(m.setor) || '-'}</td>
            <td class="mp-cell-actions">
                <button class="mp-btn-action" type="button" onclick="event.stopPropagation(); mostrarPreview('${arq}')"><i class="fas fa-eye"></i></button>
                <button class="mp-btn-action" type="button" onclick="event.stopPropagation(); baixarManutencao('${arq}')"><i class="fas fa-download"></i></button>
                <button class="mp-btn-action mp-btn-delete" type="button" data-id="${esc(id)}" data-ano="${esc(ano)}" data-mes="${esc(mes)}" onclick="event.stopPropagation(); confirmarExcluir(this)" title="Excluir"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>`;
    }).join('');
}

function mostrarPreview(arquivo, e) {
    if (previewTimeout) clearTimeout(previewTimeout);
    previewTimeout = setTimeout(() => {
        const modal = document.getElementById('preview-modal');
        const body = document.getElementById('preview-body');
        if (modal && body) {
            body.innerHTML = arquivo ? `<iframe src="${arquivo.replace(/"/g, '&quot;')}" style="width:100%;height:560px;border:none;border-radius:10px;"></iframe>` : '<p>Arquivo não disponível.</p>';
            modal.classList.add('show');
        }
        previewTimeout = null;
    }, 400);
}

function esconderPreview() {
    if (previewTimeout) { clearTimeout(previewTimeout); previewTimeout = null; }
    const modal = document.getElementById('preview-modal');
    if (modal) modal.classList.remove('show');
}

function abrirManutencao(arquivo) {
    if (arquivo) window.open(arquivo, '_blank');
}

function baixarManutencao(arquivo) {
    if (!arquivo) return;
    const a = document.createElement('a');
    a.href = arquivo;
    a.download = arquivo.split('/').pop() || 'manutencao.pdf';
    a.click();
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

function fecharDropdowns() {
    document.getElementById('wrap-setor')?.classList.remove('open');
    document.getElementById('wrap-modelo')?.classList.remove('open');
}

function abrirDropdownSetores(e) {
    popularFiltros();
    const wrapModelo = document.getElementById('wrap-modelo');
    const wrapSetor = document.getElementById('wrap-setor');
    if (wrapModelo) wrapModelo.classList.remove('open');
    if (wrapSetor) wrapSetor.classList.toggle('open');
    e?.stopPropagation?.();
}

function abrirDropdownModelos(e) {
    popularFiltros();
    const wrapSetor = document.getElementById('wrap-setor');
    const wrapModelo = document.getElementById('wrap-modelo');
    if (wrapSetor) wrapSetor.classList.remove('open');
    if (wrapModelo) wrapModelo.classList.toggle('open');
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
    const bSetor = document.getElementById('badge-setor');
    const bModelo = document.getElementById('badge-modelo');
    const btnLimpar = document.getElementById('btn-limpar-filtros');
    const t1 = document.getElementById('trigger-setor');
    const t2 = document.getElementById('trigger-modelo');
    if (bSetor) { bSetor.textContent = setor || 'Todos'; bSetor.style.display = setor ? 'inline-flex' : 'none'; }
    if (bModelo) { bModelo.textContent = modelo || 'Todos'; bModelo.style.display = modelo ? 'inline-flex' : 'none'; }
    if (btnLimpar) btnLimpar.style.display = setor || modelo ? 'inline-flex' : 'none';
    if (t1) t1.classList.toggle('active', !!setor);
    if (t2) t2.classList.toggle('active', !!modelo);
}

function limparFiltros() {
    const s = document.getElementById('filter-setor');
    const m = document.getElementById('filter-modelo');
    if (s) s.value = '';
    if (m) m.value = '';
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
    const sortWrap = document.getElementById('filter-sort-wrap');
    if (gridMeses) gridMeses.style.display = 'none';
    if (document.getElementById('ano-selecionado')) document.getElementById('ano-selecionado').textContent = `${nome} ${ano}`;
    if (document.getElementById('current-path')) document.getElementById('current-path').textContent = `${ano} › ${nome}`;
    if (document.getElementById('btn-voltar-anos')) document.getElementById('btn-voltar-anos').style.display = 'none';
    if (document.getElementById('btn-voltar-meses')) document.getElementById('btn-voltar-meses').style.display = 'inline-flex';
    if (filters) { filters.style.display = 'flex'; }
    if (sortWrap) sortWrap.style.display = isListView ? 'flex' : 'none';
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

const EMPTY_STATE_HTML = '<div class="mp-empty" id="mp-empty-initial"><i class="fas fa-folder-open"></i><h3>Selecione um ano</h3><p>Escolha um ano no menu lateral para ver as manutenções por mês.</p></div>';

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
<!DOCTYPE html><html><head><meta charset="utf-8"><title>${titulo}</title>
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
    const busca = document.getElementById('mp-busca');
    if (busca) busca.addEventListener('input', refiltrar);
    const filterOrdem = document.getElementById('filter-ordem');
    if (filterOrdem) filterOrdem.addEventListener('change', refiltrar);

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
        if (wrapSetor?.classList.contains('open') || wrapModelo?.classList.contains('open')) {
            if (!wrapSetor?.contains(e.target) && !wrapModelo?.contains(e.target)) fecharDropdowns();
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
window.adicionarManutencao = adicionarManutencao;
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
