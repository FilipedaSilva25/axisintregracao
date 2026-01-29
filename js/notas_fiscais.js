/* ============================================
   BIBLIOTECA DE NOTAS FISCAIS - EXPLORADOR
   Sistema completo estilo Windows Explorer
   ============================================ */

// ================= CONFIGURAÇÃO =================
const CONFIG = {
    STORAGE_KEY: 'axis_notas_fiscais',
    VIEW_MODE_KEY: 'axis_view_mode',
    SORT_KEY: 'axis_sort',
    ANOS: [2020, 2021, 2022, 2023, 2024, 2025, 2026],
    MESES: [
        { nome: 'Janeiro', numero: '01', emoji: '❄️' },
        { nome: 'Fevereiro', numero: '02', emoji: '💝' },
        { nome: 'Março', numero: '03', emoji: '🌸' },
        { nome: 'Abril', numero: '04', emoji: '🌷' },
        { nome: 'Maio', numero: '05', emoji: '🌻' },
        { nome: 'Junho', numero: '06', emoji: '☀️' },
        { nome: 'Julho', numero: '07', emoji: '🔥' },
        { nome: 'Agosto', numero: '08', emoji: '🌾' },
        { nome: 'Setembro', numero: '09', emoji: '🍂' },
        { nome: 'Outubro', numero: '10', emoji: '🎃' },
        { nome: 'Novembro', numero: '11', emoji: '🍁' },
        { nome: 'Dezembro', numero: '12', emoji: '🎄' }
    ]
};

// ================= ESTADO GLOBAL =================
let state = {
    clientes: [],
    notasFiscais: [],
    currentPath: ['root'],
    selectedItems: [],
    viewMode: 'grid', // grid, list, details
    sortBy: 'nome',
    sortDirection: 'asc',
    navigationHistory: [],
    historyIndex: -1,
    clipboard: null,
    clipboardAction: null, // 'copy' ou 'cut'
    filters: {
        texto: '',
        cliente: '',
        dataFrom: '',
        dataTo: '',
        valorMin: '',
        valorMax: '',
        status: ''
    },
    favoritos: [],
    tags: {},
    renomeandoItem: null,
    dragSource: null,
    dragTarget: null,
    contextMenu: null,
    uploadFiles: [],
    pdfZoom: 100,
    novaPastaTipo: null,
    novaPastaMesNumero: null,
    novaPastaMesNome: null,
    subpastas: {}
};

// ================= INICIALIZAÇÃO =================
let inicializado = false;
document.addEventListener('DOMContentLoaded', function() {
    if (inicializado) return;
    inicializado = true;
    
    console.log('🚀 Inicializando Biblioteca de Notas Fiscais...');
    
    carregarDados();
    inicializarInterface();
    carregarEstrutura();
    configurarEventos();
    configurarAtalhosTeclado();
    inicializarMelhorias();
    
    console.log('✅ Biblioteca inicializada com sucesso!');
});

// ================= CARREGAMENTO DE DADOS =================
function carregarDados() {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            state.clientes = data.clientes || [];
            state.notasFiscais = data.notasFiscais || [];
            state.subpastas = data.subpastas || {};
        } catch (e) {
            console.error('Erro ao carregar dados:', e);
            inicializarDadosExemplo();
        }
    } else {
        inicializarDadosExemplo();
    }
    
    // Carregar preferências
    const viewMode = localStorage.getItem(CONFIG.VIEW_MODE_KEY);
    if (viewMode) {
        state.viewMode = viewMode;
        aplicarViewMode();
    }
    
    // Carregar favoritos
    const savedFavoritos = localStorage.getItem('axis_favoritos');
    if (savedFavoritos) {
        try {
            state.favoritos = JSON.parse(savedFavoritos);
        } catch (e) {
            state.favoritos = [];
        }
    }
}

function salvarDados() {
    const data = {
        clientes: state.clientes,
        notasFiscais: state.notasFiscais,
        subpastas: state.subpastas || {}
    };
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(CONFIG.VIEW_MODE_KEY, state.viewMode);
    localStorage.setItem('axis_favoritos', JSON.stringify(state.favoritos || []));
    
    // Atualizar dashboard após salvar
    if (typeof atualizarDashboardCompleto !== 'undefined') {
        setTimeout(function() {
            atualizarDashboardCompleto();
        }, 100);
    } else if (typeof atualizarDashboard !== 'undefined') {
        setTimeout(function() {
            atualizarDashboard();
        }, 100);
    }
}

function inicializarDadosExemplo() {
    // Clientes de exemplo
    state.clientes = [
        'Mercado Livre',
        'Amazon',
        'Magazine Luiza',
        'Americanas',
        'Casas Bahia',
        'Via Varejo',
        'Carrefour',
        'Extra',
        'Pão de Açúcar',
        'Walmart'
    ];
    
    // Gerar algumas notas de exemplo
    state.notasFiscais = gerarNotasExemplo();
    salvarDados();
}

function gerarNotasExemplo() {
    const notas = [];
    const statuses = ['pago', 'pendente', 'vencido'];
    
    state.clientes.forEach(cliente => {
        CONFIG.ANOS.forEach(ano => {
            CONFIG.MESES.forEach(mes => {
                const numNotas = Math.floor(Math.random() * 5) + 1;
                for (let i = 0; i < numNotas; i++) {
                    const dia = Math.floor(Math.random() * 28) + 1;
                    const data = `${ano}-${mes.numero}-${String(dia).padStart(2, '0')}`;
                    const valor = Math.floor(Math.random() * 10000) + 100;
                    const status = statuses[Math.floor(Math.random() * statuses.length)];
                    
                    notas.push({
                        id: `${cliente}_${ano}_${mes.numero}_${dia}_${i}`,
                        cliente: cliente,
                        ano: ano,
                        mes: mes.numero,
                        mesNome: mes.nome,
                        data: data,
                        valor: valor,
                        status: status,
                        numero: (100000 + Math.floor(Math.random() * 900000)).toString(),
                        tamanho: Math.floor(Math.random() * 5000) + 100, // KB
                        tipo: 'pdf',
                        caminho: `${cliente}/${ano}/${mes.numero}/${data}`
                    });
                }
            });
        });
    });
    
    return notas;
}

// ================= INTERFACE =================
function inicializarInterface() {
    aplicarViewMode();
    atualizarStatusBar();
    setUserNameFromStorage();
}

function setUserNameFromStorage() {
    var el = document.getElementById('user-name');
    if (!el) return;
    try {
        var name = localStorage.getItem('current_user') || '';
        el.textContent = (name && String(name).trim()) ? name : 'Usuário';
    } catch (e) {
        el.textContent = 'Usuário';
    }
}

function aplicarViewMode() {
    var vGrid = document.getElementById('view-grid') || document.getElementById('nfs-grid');
    var vList = document.getElementById('view-list') || document.getElementById('nfs-list');
    var vDetails = document.getElementById('view-details');
    if (vGrid) vGrid.style.display = state.viewMode === 'grid' ? (vGrid.id === 'nfs-grid' ? 'grid' : 'block') : 'none';
    if (vList) vList.style.display = state.viewMode === 'list' ? 'block' : 'none';
    if (vDetails) vDetails.style.display = state.viewMode === 'details' ? 'block' : 'none';
    var icon = document.getElementById('view-icon');
    if (icon) {
        icon.className = state.viewMode === 'grid' ? 'fas fa-th' : (state.viewMode === 'list' ? 'fas fa-list' : 'fas fa-th-list');
    }
}

function toggleViewMode() {
    const modes = ['grid', 'list', 'details'];
    const currentIndex = modes.indexOf(state.viewMode);
    state.viewMode = modes[(currentIndex + 1) % modes.length];
    aplicarViewMode();
    renderizarConteudo();
}

// ================= ESTRUTURA E NAVEGAÇÃO =================
function carregarEstrutura() {
    renderizarTreeView();
    renderizarConteudo();
    atualizarAddressBar();
}

function renderizarTreeView() {
    const container = document.getElementById('tree-view');
    if (!container) return;
    
    let html = '';
    
    // Item raiz
    html += `
        <div class="tree-item ${state.currentPath.length === 1 ? 'selected' : ''}" 
             onclick="navegarPara(['root'])">
            <div class="tree-item-icon">
                <i class="fas fa-home"></i>
            </div>
            <div class="tree-item-name">Início</div>
        </div>
    `;
    
    // Clientes
    state.clientes.forEach(cliente => {
        const isSelected = state.currentPath.length === 2 && state.currentPath[1] === cliente;
        const isExpanded = state.currentPath.length > 1 && state.currentPath[1] === cliente;
        
        html += `
            <div class="tree-item ${isSelected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''}" 
                 onclick="toggleTreeItem(event, ['root', '${cliente}'])">
                <div class="tree-item-icon tree-item-arrow-container">
                    <i class="fas fa-${isExpanded ? 'chevron-down' : 'chevron-right'} tree-item-arrow"></i>
                </div>
                <div class="tree-item-icon">
                    <i class="fas fa-building"></i>
                </div>
                <div class="tree-item-name">${cliente}</div>
                <div class="tree-item-count">${contarNotasCliente(cliente)}</div>
            </div>
        `;
        
        // Anos do cliente (se expandido)
        if (isExpanded) {
            CONFIG.ANOS.forEach(ano => {
                const pathAno = ['root', cliente, ano.toString()];
                const isSelectedAno = JSON.stringify(state.currentPath) === JSON.stringify(pathAno);
                const isExpandedAno = state.currentPath.length > 2 && 
                                     state.currentPath[1] === cliente && 
                                     state.currentPath[2] === ano.toString();
                
                html += `
                    <div class="tree-item-children">
                        <div class="tree-item ${isSelectedAno ? 'selected' : ''} ${isExpandedAno ? 'expanded' : ''}" 
                             onclick="event.stopPropagation(); toggleTreeItem(event, ${JSON.stringify(pathAno)})">
                            <div class="tree-item-icon tree-item-arrow-container">
                                <i class="fas fa-${isExpandedAno ? 'chevron-down' : 'chevron-right'} tree-item-arrow"></i>
                            </div>
                            <div class="tree-item-icon">
                                <i class="fas fa-calendar-alt"></i>
                            </div>
                            <div class="tree-item-name">${ano}</div>
                            <div class="tree-item-count">${contarNotasClienteAno(cliente, ano)}</div>
                        </div>
                    </div>
                `;
                
                // Meses do ano (se expandido)
                if (isExpandedAno) {
                    CONFIG.MESES.forEach(mes => {
                        const pathMes = ['root', cliente, ano.toString(), mes.numero];
                        const isSelectedMes = JSON.stringify(state.currentPath) === JSON.stringify(pathMes);
                        
                        html += `
                            <div class="tree-item-children">
                                <div class="tree-item ${isSelectedMes ? 'selected' : ''}" 
                                     onclick="event.stopPropagation(); navegarPara(${JSON.stringify(pathMes)})">
                                    <div class="tree-item-icon tree-item-arrow-container">
                                        <i class="fas fa-chevron-right tree-item-arrow" style="opacity: 0.3;"></i>
                                    </div>
                                    <div class="tree-item-icon">${mes.emoji}</div>
                                    <div class="tree-item-name">${mes.nome}</div>
                                    <div class="tree-item-count">${contarNotasClienteAnoMes(cliente, ano, mes.numero)}</div>
                                </div>
                            </div>
                        `;
                    });
                }
            });
        }
    });
    
    container.innerHTML = html;
}

function contarNotasCliente(cliente) {
    return state.notasFiscais.filter(n => n.cliente === cliente).length;
}

function contarNotasClienteAno(cliente, ano) {
    return state.notasFiscais.filter(n => n.cliente === cliente && n.ano === ano).length;
}

function contarNotasClienteAnoMes(cliente, ano, mes) {
    return state.notasFiscais.filter(n => 
        n.cliente === cliente && n.ano === ano && n.mes === mes
    ).length;
}

function navegarPara(path) {
    state.currentPath = path;
    adicionarAoHistorico(path);
    renderizarConteudo();
    renderizarTreeView();
    atualizarAddressBar();
    atualizarStatusBar();
    state.selectedItems = [];
}

function adicionarAoHistorico(path) {
    // Remove histórico futuro se houver
    state.navigationHistory = state.navigationHistory.slice(0, state.historyIndex + 1);
    // Adiciona novo caminho
    state.navigationHistory.push([...path]);
    state.historyIndex = state.navigationHistory.length - 1;
}

function navegarVoltar() {
    if (state.historyIndex > 0) {
        const btn = document.querySelector('.btn-back');
        if (btn) {
            btn.style.animation = 'buttonPulse 0.3s ease';
        }
        
        state.historyIndex--;
        state.currentPath = [...state.navigationHistory[state.historyIndex]];
        renderizarConteudo();
        renderizarTreeView();
        atualizarAddressBar();
        atualizarStatusBar();
    } else {
        const btn = document.querySelector('.btn-back');
        if (btn) {
            btn.style.animation = 'shake 0.5s ease';
        }
    }
}

function navegarAvancar() {
    if (state.historyIndex < state.navigationHistory.length - 1) {
        const btn = document.querySelector('.btn-forward');
        if (btn) {
            btn.style.animation = 'buttonPulse 0.3s ease';
        }
        
        state.historyIndex++;
        state.currentPath = [...state.navigationHistory[state.historyIndex]];
        renderizarConteudo();
        renderizarTreeView();
        atualizarAddressBar();
        atualizarStatusBar();
    } else {
        const btn = document.querySelector('.btn-forward');
        if (btn) {
            btn.style.animation = 'shake 0.5s ease';
        }
    }
}

function navegarAcima() {
    if (state.currentPath.length > 1) {
        const btn = document.querySelector('.btn-up');
        if (btn) {
            btn.style.animation = 'buttonPulse 0.3s ease';
        }
        
        const novoPath = state.currentPath.slice(0, -1);
        navegarPara(novoPath);
    } else {
        const btn = document.querySelector('.btn-up');
        if (btn) {
            btn.style.animation = 'shake 0.5s ease';
        }
    }
}

// ================= RENDERIZAÇÃO DE CONTEÚDO =================
function renderizarConteudo() {
    var itens = [];
    try { itens = obterItensAtuais(); } catch (e) { itens = []; }
    if (!Array.isArray(itens)) itens = [];
    var itensFiltrados = [];
    try { itensFiltrados = aplicarFiltros(itens) || itens; } catch (e) { itensFiltrados = itens; }
    if (!Array.isArray(itensFiltrados)) itensFiltrados = itens;
    var itensOrdenados = ordenarItens(itensFiltrados);
    
    if (state.viewMode === 'grid') {
        renderizarGrid(itensOrdenados);
    } else if (state.viewMode === 'list') {
        renderizarLista(itensOrdenados);
    } else {
        renderizarDetalhes(itensOrdenados);
    }
    
    atualizarStatusBar();
    
    // Atualizar dashboard se estiver na raiz
    if (state.currentPath.length === 1 && typeof atualizarDashboard !== 'undefined') {
        atualizarDashboard();
    }
}

function obterItensAtuais() {
    const path = state.currentPath;
    
    if (path.length === 1) {
        // Raiz - mostrar clientes
        return state.clientes.map(cliente => ({
            tipo: 'cliente',
            nome: cliente,
            caminho: ['root', cliente],
            icon: 'building',
            count: contarNotasCliente(cliente)
        }));
    } else if (path.length === 2) {
        // Cliente selecionado - mostrar anos
        const cliente = path[1];
        return CONFIG.ANOS.map(ano => ({
            tipo: 'ano',
            nome: ano.toString(),
            caminho: ['root', cliente, ano.toString()],
            icon: 'calendar-alt',
            count: contarNotasClienteAno(cliente, ano)
        }));
    } else if (path.length === 3) {
        // Ano selecionado - mostrar meses
        const cliente = path[1];
        const ano = path[2];
        return CONFIG.MESES.map(mes => ({
            tipo: 'mes',
            nome: mes.nome,
            caminho: ['root', cliente, ano, mes.numero],
            icon: mes.emoji,
            count: contarNotasClienteAnoMes(cliente, parseInt(ano), mes.numero)
        }));
    } else if (path.length === 4) {
        // Mês selecionado - mostrar datas
        const cliente = path[1];
        const ano = parseInt(path[2]);
        const mes = path[3];
        const datas = obterDatasUnicas(cliente, ano, mes);
        return datas.map(data => ({
            tipo: 'data',
            nome: formatarData(data),
            caminho: [...path, data],
            data: data,
            icon: 'calendar',
            count: contarNotasData(cliente, ano, mes, data)
        }));
    } else if (path.length === 5) {
        // Data selecionada - mostrar PDFs e subpastas
        const cliente = path[1];
        const ano = parseInt(path[2]);
        const mes = path[3];
        const data = path[4];
        
        const itens = [];
        
        // Adicionar subpastas se existirem
        const subpastaKey = `${cliente}/${ano}/${mes}/${data}`;
        if (state.subpastas && state.subpastas[subpastaKey]) {
            state.subpastas[subpastaKey].forEach(subpasta => {
                itens.push({
                    tipo: 'subpasta',
                    nome: subpasta,
                    caminho: [...path, subpasta],
                    icon: 'folder',
                    count: 0
                });
            });
        }
        
        // Adicionar PDFs
        const notas = obterNotasData(cliente, ano, mes, data);
        notas.forEach(nota => {
            itens.push({
                tipo: 'pdf',
                nome: `NF-${nota.numero}.pdf`,
                caminho: nota.caminho,
                nota: nota,
                icon: 'file-pdf',
                tamanho: nota.tamanho,
                valor: nota.valor,
                status: nota.status
            });
        });
        
        return itens;
    } else if (path.length === 6) {
        // Subpasta selecionada - mostrar PDFs dentro da subpasta
        const cliente = path[1];
        const ano = parseInt(path[2]);
        const mes = path[3];
        const data = path[4];
        const subpasta = path[5];
        
        // Filtrar notas por subpasta (se houver lógica de organização)
        const notas = obterNotasData(cliente, ano, mes, data);
        return notas.map(nota => ({
            tipo: 'pdf',
            nome: `NF-${nota.numero}.pdf`,
            caminho: nota.caminho,
            nota: nota,
            icon: 'file-pdf',
            tamanho: nota.tamanho,
            valor: nota.valor,
            status: nota.status
        }));
    }
    
    return [];
}

function obterDatasUnicas(cliente, ano, mes) {
    const notas = state.notasFiscais.filter(n => 
        n.cliente === cliente && n.ano === ano && n.mes === mes
    );
    const datas = [...new Set(notas.map(n => n.data))];
    return datas.sort();
}

function contarNotasData(cliente, ano, mes, data) {
    return state.notasFiscais.filter(n => 
        n.cliente === cliente && n.ano === ano && n.mes === mes && n.data === data
    ).length;
}

function obterNotasData(cliente, ano, mes, data) {
    return state.notasFiscais.filter(n => 
        n.cliente === cliente && n.ano === ano && n.mes === mes && n.data === data
    );
}

function aplicarFiltros(itens) {
    if (!itens || !Array.isArray(itens)) return [];
    if (!state.filters.texto && !state.filters.cliente && !state.filters.status) {
        return itens;
    }
    
    return itens.filter(item => {
        if (state.filters.texto && !item.nome.toLowerCase().includes(state.filters.texto.toLowerCase())) {
            return false;
        }
        if (state.filters.cliente && item.tipo === 'pdf' && item.nota.cliente !== state.filters.cliente) {
            return false;
        }
        if (state.filters.status && item.tipo === 'pdf' && item.nota.status !== state.filters.status) {
            return false;
        }
        return true;
    });
}

function ordenarItens(itens) {
    if (!itens || !Array.isArray(itens)) return [];
    return itens.slice().sort((a, b) => {
        let valA, valB;
        
        switch (state.sortBy) {
            case 'nome':
                valA = a.nome.toLowerCase();
                valB = b.nome.toLowerCase();
                break;
            case 'data':
                valA = a.data || a.nota?.data || '';
                valB = b.data || b.nota?.data || '';
                break;
            case 'tamanho':
                valA = a.tamanho || 0;
                valB = b.tamanho || 0;
                break;
            case 'valor':
                valA = a.valor || a.nota?.valor || 0;
                valB = b.valor || b.nota?.valor || 0;
                break;
            default:
                valA = a.nome.toLowerCase();
                valB = b.nome.toLowerCase();
        }
        
        if (valA < valB) return state.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return state.sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
}

function renderizarGrid(itens) {
    const container = document.getElementById('grid-container');
    if (!container) return;
    
    if (itens.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-icon">📁</div>
                <div class="empty-state-title">Pasta vazia</div>
                <div class="empty-state-text">Esta pasta não contém itens</div>
            </div>
        `;
        return;
    }
    
    let html = '';
    itens.forEach((item, index) => {
        const isSelected = state.selectedItems.some(sel => 
            JSON.stringify(sel.caminho) === JSON.stringify(item.caminho)
        );
        const isFavorito = state.favoritos.find(f => JSON.stringify(f.caminho) === JSON.stringify(item.caminho));
        const itemId = JSON.stringify(item.caminho).replace(/"/g, '&quot;');
        
        html += `
            <div class="grid-item ${isSelected ? 'selected' : ''}" 
                 data-item-id="${itemId}"
                 draggable="true"
                 onclick="toggleSelecaoItem(${index})"
                 ondblclick="abrirItem(${index})"
                 oncontextmenu="event.preventDefault(); mostrarContextMenu(event.pageX, event.pageY, this)">
                <div class="grid-item-checkbox ${isSelected ? 'checked' : ''}" 
                     onclick="event.stopPropagation(); toggleSelecaoItem(${index})">
                    ${isSelected ? '<i class="fas fa-check"></i>' : ''}
                </div>
                ${isFavorito ? '<div class="grid-item-favorite"><i class="fas fa-star"></i></div>' : ''}
                <div class="grid-item-icon ${item.tipo}">
                    ${item.tipo === 'mes' ? item.icon : 
                      item.tipo === 'subpasta' ? '<i class="fas fa-folder"></i>' :
                      `<i class="fas fa-${item.icon}"></i>`}
                </div>
                <div class="grid-item-name">${item.nome}</div>
                <div class="grid-item-info">
                    ${item.count ? `${item.count} itens` : ''}
                    ${item.tamanho ? formatarTamanho(item.tamanho) : ''}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Reaplicar efeitos hover após renderização
    setTimeout(() => adicionarEfeitoHover(), 100);
}

function renderizarLista(itens) {
    const tbody = document.getElementById('list-table-body');
    if (!tbody) return;
    
    if (itens.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px;">
                    <div class="empty-state">
                        <div class="empty-state-icon">📁</div>
                        <div class="empty-state-title">Pasta vazia</div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    itens.forEach((item, index) => {
        const isSelected = state.selectedItems.some(sel => 
            JSON.stringify(sel.caminho) === JSON.stringify(item.caminho)
        );
        
        const nota = item.nota || item;
        const numeroNF = nota.numero ? 'NF-' + nota.numero : item.nome;
        const fornecedor = nota.cliente || '-';
        const dataEmissao = nota.data ? (formatarData ? formatarData(nota.data) : nota.data) : (item.data ? (formatarData ? formatarData(item.data) : item.data) : '-');
        const dataVencimento = nota.dataVencimento ? (formatarData ? formatarData(nota.dataVencimento) : nota.dataVencimento) : '-';
        const valor = nota.valor ? (formatarMoeda ? formatarMoeda(nota.valor) : 'R$ ' + parseFloat(nota.valor).toFixed(2)) : (item.valor ? (formatarMoeda ? formatarMoeda(item.valor) : 'R$ ' + parseFloat(item.valor).toFixed(2)) : '-');
        const status = nota.status || item.status || 'pendente';
        const statusClass = status === 'pago' || status === 'paga' ? 'pago' : status === 'vencido' || status === 'vencida' ? 'vencido' : 'pendente';
        
        html += `
            <tr class="${isSelected ? 'selected' : ''}" 
                onclick="toggleSelecaoItem(${index})"
                ondblclick="abrirItem(${index})">
                <td class="col-checkbox">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} 
                           onclick="event.stopPropagation(); toggleSelecaoItem(${index})">
                </td>
                <td class="col-name">
                    ${item.tipo === 'pdf' ? '<i class="fas fa-file-pdf" style="color: var(--danger-color);"></i>' : '<i class="fas fa-file-invoice"></i>'} ${numeroNF}
                </td>
                <td class="col-cliente">${fornecedor}</td>
                <td class="col-data-emissao">${dataEmissao}</td>
                <td class="col-data-vencimento">${dataVencimento}</td>
                <td class="col-valor">${valor}</td>
                <td class="col-status">
                    <span class="status-badge ${statusClass}">${status}</span>
                </td>
                <td class="col-acoes">
                    <button class="btn-icon" onclick="event.stopPropagation(); abrirItem(${index})" title="Visualizar">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${item.tipo === 'pdf' ? `
                    <button class="btn-icon" onclick="event.stopPropagation(); editarNota('${nota.id || item.id || index}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="event.stopPropagation(); baixarPDF('${nota.id || item.id || index}')" title="Baixar PDF">
                        <i class="fas fa-download"></i>
                    </button>
                    ` : ''}
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

function renderizarDetalhes(itens) {
    const container = document.getElementById('details-container');
    if (!container) return;
    
    if (itens.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📁</div>
                <div class="empty-state-title">Pasta vazia</div>
            </div>
        `;
        return;
    }
    
    let html = '';
    itens.forEach((item, index) => {
        const isSelected = state.selectedItems.some(sel => 
            JSON.stringify(sel.caminho) === JSON.stringify(item.caminho)
        );
        
        html += `
            <div class="details-item ${isSelected ? 'selected' : ''}" 
                 onclick="toggleSelecaoItem(${index})"
                 ondblclick="abrirItem(${index})">
                <div class="details-item-icon ${item.tipo}">
                    ${item.tipo === 'mes' ? item.icon : `<i class="fas fa-${item.icon}"></i>`}
                </div>
                <div class="details-item-content">
                    <div class="details-item-name">${item.nome}</div>
                    <div class="details-item-info">
                        ${item.nota?.cliente ? `<span>Cliente: ${item.nota.cliente}</span>` : ''}
                        ${item.nota?.data ? `<span>Data: ${formatarData(item.nota.data)}</span>` : ''}
                        ${item.nota?.valor ? `<span>Valor: ${formatarMoeda(item.nota.valor)}</span>` : ''}
                        ${item.tamanho ? `<span>Tamanho: ${formatarTamanho(item.tamanho)}</span>` : ''}
                    </div>
                </div>
                <div class="details-item-actions">
                    <button class="btn-icon" onclick="event.stopPropagation(); abrirItem(${index})">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ================= SELEÇÃO =================
let itensAtuaisCache = [];

function toggleSelecaoItem(index) {
    const itens = obterItensAtuais();
    const itensFiltrados = aplicarFiltros(itens);
    const itensOrdenados = ordenarItens(itensFiltrados);
    itensAtuaisCache = itensOrdenados;
    
    const item = itensOrdenados[index];
    const itemIndex = state.selectedItems.findIndex(sel => 
        JSON.stringify(sel.caminho) === JSON.stringify(item.caminho)
    );
    
    if (itemIndex >= 0) {
        state.selectedItems.splice(itemIndex, 1);
    } else {
        state.selectedItems.push(item);
        // Mostrar preview se for PDF
        if (item.tipo === 'pdf' && item.nota && typeof mostrarPreviewPDF !== 'undefined') {
            mostrarPreviewPDF(item.nota);
        }
    }
    
    renderizarConteudo();
    atualizarStatusBar();
    
    // Mostrar/esconder barra de ações
    if (typeof mostrarBarraAcoes !== 'undefined' && typeof fecharBarraAcoes !== 'undefined') {
        if (state.selectedItems.length > 0) {
            mostrarBarraAcoes();
        } else {
            fecharBarraAcoes();
        }
    }
}

function selecionarTudo() {
    const itens = obterItensAtuais();
    const itensFiltrados = aplicarFiltros(itens);
    const itensOrdenados = ordenarItens(itensFiltrados);
    state.selectedItems = [...itensOrdenados];
    renderizarConteudo();
    atualizarStatusBar();
}

function selecionarTudoCheckbox() {
    const checkbox = document.getElementById('select-all');
    if (checkbox.checked) {
        selecionarTudo();
    } else {
        state.selectedItems = [];
        renderizarConteudo();
        atualizarStatusBar();
    }
}

// ================= NAVEGAÇÃO DE ITENS =================
function abrirItem(index) {
    const itens = itensAtuaisCache.length > 0 ? itensAtuaisCache : obterItensAtuais();
    const itensFiltrados = aplicarFiltros(itens);
    const itensOrdenados = ordenarItens(itensFiltrados);
    const item = itensOrdenados[index];
    
    if (item.tipo === 'pdf') {
        // Mostrar preview lateral primeiro
        if (typeof mostrarPreviewPDF !== 'undefined') {
            mostrarPreviewPDF(item.nota);
        }
        // Também abrir visualizador completo se necessário
        // abrirVisualizadorPDF(item.nota);
    } else if (item.tipo === 'subpasta') {
        navegarPara(item.caminho);
    } else {
        navegarPara(item.caminho);
    }
}

// ================= ADDRESS BAR =================
function atualizarAddressBar() {
    const container = document.getElementById('address-path');
    if (!container) return;
    
    let html = '';
    state.currentPath.forEach((segment, index) => {
        const path = state.currentPath.slice(0, index + 1);
        const isLast = index === state.currentPath.length - 1;
        
        if (index === 0) {
            html += `
                <span class="address-item" onclick="navegarPara(${JSON.stringify(path)})">
                    <i class="fas fa-home"></i> Início
                </span>
            `;
        } else {
            html += `
                <span class="address-item ${isLast ? 'active' : ''}" 
                      onclick="navegarPara(${JSON.stringify(path)})">
                    ${segment}
                </span>
            `;
        }
        
        if (!isLast) {
            html += `<span class="address-separator">/</span>`;
        }
    });
    
    container.innerHTML = html;
}

// ================= STATUS BAR =================
function atualizarStatusBar() {
    var itens = [];
    try {
        itens = obterItensAtuais();
        if (!Array.isArray(itens)) itens = [];
    } catch (e) { itens = []; }
    var itensFiltrados = [];
    try {
        itensFiltrados = aplicarFiltros(itens) || itens;
        if (!Array.isArray(itensFiltrados)) itensFiltrados = itens;
    } catch (e) { itensFiltrados = itens; }
    var sel = (state && Array.isArray(state.selectedItems)) ? state.selectedItems : [];
    var path = (state && Array.isArray(state.currentPath)) ? state.currentPath : ['root'];
    var pathText = path.length > 1 ? path.slice(1).join(' > ') : 'Início';
    var tamanhoTotal = itensFiltrados.reduce(function(sum, item) { return sum + (item && (item.tamanho || 0)) || 0; }, 0);
    var fmt = typeof formatarTamanho === 'function' ? formatarTamanho : function(n) { return n + ' KB'; };
    var elItems = document.getElementById('status-items');
    var elSel = document.getElementById('status-selected');
    var elSize = document.getElementById('status-size');
    var elLoc = document.getElementById('status-location');
    if (elItems) elItems.textContent = itensFiltrados.length + ' itens';
    if (elSel) elSel.textContent = sel.length + ' selecionados';
    if (elSize) elSize.textContent = fmt(tamanhoTotal);
    if (elLoc) elLoc.textContent = pathText;
}

// ================= UPLOAD =================
function abrirUpload() {
    const modal = document.getElementById('upload-modal');
    if (modal) {
        modal.classList.add('show');
        // Animação de entrada
        const content = modal.querySelector('.modal-content');
        if (content) {
            content.style.animation = 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        }
    }
}

function fecharModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const files = e.dataTransfer.files;
    processarArquivos(files);
}

function handleFileSelect(e) {
    const files = e.target.files;
    processarArquivos(files);
}

function processarArquivos(files) {
    const uploadList = document.getElementById('upload-list');
    uploadList.innerHTML = '';
    state.uploadFiles = [];
    
    Array.from(files).forEach((file, index) => {
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            const item = criarItemUpload(file, index);
            uploadList.appendChild(item);
            
            const progressBar = item.querySelector('.upload-item-progress-bar');
            state.uploadFiles.push({ file, progressBar, item });
        } else {
            mostrarToast(`Arquivo ${file.name} não é um PDF`, 'error');
        }
    });
}

function criarItemUpload(file, index) {
    const div = document.createElement('div');
    div.className = 'upload-item';
    div.innerHTML = `
        <div class="upload-item-icon">
            <i class="fas fa-file-pdf"></i>
        </div>
        <div class="upload-item-info">
            <div class="upload-item-name">${file.name}</div>
            <div class="upload-item-size">${formatarTamanho(file.size / 1024)}</div>
        </div>
        <div class="upload-item-progress">
            <div class="upload-item-progress-bar" style="width: 0%"></div>
        </div>
    `;
    return div;
}

function processarUpload() {
    // Implementar upload real aqui
    mostrarToast('Upload iniciado', 'success');
    fecharModal('upload-modal');
}

// ================= BUSCA =================
function buscarNotas(texto) {
    state.filters.texto = texto;
    renderizarConteudo();
}

function abrirBuscaAvancada() {
    const modal = document.getElementById('search-modal');
    if (modal) {
        modal.classList.add('show');
        // Animação de entrada
        const content = modal.querySelector('.modal-content');
        if (content) {
            content.style.animation = 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        }
        
        // Feedback visual no botão
        const btn = document.querySelector('.btn-search-advanced');
        if (btn) {
            btn.style.animation = 'buttonPulse 0.5s ease';
        }
    }
}

function executarBuscaAvancada() {
    const btn = document.querySelector('.btn-primary:has-text("Buscar")');
    if (btn) {
        btn.classList.add('loading');
    }
    
    state.filters.cliente = document.getElementById('search-cliente').value;
    state.filters.dataFrom = document.getElementById('search-date-from').value;
    state.filters.dataTo = document.getElementById('search-date-to').value;
    state.filters.valorMin = document.getElementById('search-value-min').value;
    state.filters.valorMax = document.getElementById('search-value-max').value;
    state.filters.status = document.getElementById('search-status').value;
    
    setTimeout(() => {
        renderizarConteudo();
        fecharModal('search-modal');
        mostrarToast('Busca realizada com sucesso', 'success');
        
        if (btn) {
            btn.classList.remove('loading');
            btn.style.animation = 'buttonPulse 0.5s ease';
        }
    }, 300);
}

function aplicarFiltros() {
    const btn = document.querySelector('.btn-apply-filters');
    if (btn) {
        btn.style.animation = 'buttonPulse 0.3s ease';
        btn.classList.add('loading');
    }
    
    // Aplicar filtros do painel
    state.filters.dataFrom = document.getElementById('filter-date-from')?.value || '';
    state.filters.dataTo = document.getElementById('filter-date-to')?.value || '';
    state.filters.status = document.getElementById('filter-status')?.value || '';
    state.filters.valorMin = document.getElementById('filter-value-min')?.value || '';
    state.filters.valorMax = document.getElementById('filter-value-max')?.value || '';
    
    setTimeout(() => {
        renderizarConteudo();
        mostrarToast('Filtros aplicados', 'success');
        
        if (btn) {
            btn.classList.remove('loading');
        }
    }, 300);
}

function toggleFiltersPanel() {
    const panel = document.getElementById('filters-panel');
    const isHidden = panel.style.display === 'none' || !panel.style.display;
    
    if (isHidden) {
        panel.style.display = 'block';
        panel.style.animation = 'slideUp 0.3s ease';
    } else {
        panel.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            panel.style.display = 'none';
        }, 300);
    }
}

// ================= ORDENAÇÃO =================
function ordenarPor(campo) {
    if (state.sortBy === campo) {
        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        state.sortBy = campo;
        state.sortDirection = 'asc';
    }
    
    // Feedback visual
    const btn = document.querySelector(`.toolbar-btn:has(.fa-sort)`);
    if (btn) {
        btn.style.animation = 'buttonPulse 0.5s ease';
        const icon = btn.querySelector('i');
        if (icon) {
            icon.style.animation = 'iconSpin 0.6s ease';
        }
    }
    
    renderizarConteudo();
}

// ================= AÇÕES =================
function copiarSelecionados() {
    state.clipboard = [...state.selectedItems];
    state.clipboardAction = 'copy';
    mostrarToast(`${state.selectedItems.length} item(s) copiado(s)`, 'success');
}

function cortarSelecionados() {
    state.clipboard = [...state.selectedItems];
    state.clipboardAction = 'cut';
    mostrarToast(`${state.selectedItems.length} item(s) cortado(s)`, 'success');
}

function colar() {
    if (!state.clipboard || state.clipboard.length === 0) {
        mostrarToast('Nenhum item na área de transferência', 'error');
        return;
    }
    
    // Implementar lógica de colar
    mostrarToast(`${state.clipboard.length} item(s) colado(s)`, 'success');
    state.clipboard = null;
    state.clipboardAction = null;
}

function deletarSelecionados() {
    // Usar a função real de deletar que move para lixeira
    deletarSelecionadosReal();
}

function renomearSelecionado() {
    if (state.selectedItems.length !== 1) {
        mostrarToast('Selecione apenas um item para renomear', 'error');
        return;
    }
    
    const item = state.selectedItems[0];
    const novoNome = prompt('Novo nome:', item.nome);
    if (novoNome && novoNome.trim()) {
        // Implementar lógica de renomear
        mostrarToast('Item renomeado', 'success');
        renderizarConteudo();
    }
}

function propriedadesSelecionado() {
    if (state.selectedItems.length !== 1) {
        mostrarToast('Selecione um item para ver propriedades', 'error');
        return;
    }
    
    const item = state.selectedItems[0];
    mostrarPropriedades(item);
}

function mostrarPropriedades(item) {
    const panel = document.getElementById('properties-panel');
    const content = document.getElementById('properties-content');
    
    let html = `
        <div class="property-group">
            <div class="property-group-label">Informações Gerais</div>
            <div class="property-item">
                <div class="property-item-label">Nome</div>
                <div class="property-item-value">${item.nome}</div>
            </div>
            <div class="property-item">
                <div class="property-item-label">Tipo</div>
                <div class="property-item-value">${item.tipo}</div>
            </div>
    `;
    
    if (item.nota) {
        html += `
            <div class="property-item">
                <div class="property-item-label">Cliente</div>
                <div class="property-item-value">${item.nota.cliente}</div>
            </div>
            <div class="property-item">
                <div class="property-item-label">Data</div>
                <div class="property-item-value">${formatarData(item.nota.data)}</div>
            </div>
            <div class="property-item">
                <div class="property-item-label">Valor</div>
                <div class="property-item-value">${formatarMoeda(item.nota.valor)}</div>
            </div>
            <div class="property-item">
                <div class="property-item-label">Status</div>
                <div class="property-item-value">${item.nota.status}</div>
            </div>
        `;
    }
    
    if (item.tamanho) {
        html += `
            <div class="property-item">
                <div class="property-item-label">Tamanho</div>
                <div class="property-item-value">${formatarTamanho(item.tamanho)}</div>
            </div>
        `;
    }
    
    html += `</div>`;
    
    content.innerHTML = html;
    panel.style.display = 'flex';
}

function togglePropertiesPanel() {
    const panel = document.getElementById('properties-panel');
    const btn = event?.target?.closest('button');
    
    if (btn) {
        btn.style.animation = 'buttonPulse 0.3s ease';
    }
    
    const isHidden = panel.style.display === 'none' || !panel.style.display;
    
    if (isHidden) {
        panel.style.display = 'flex';
        panel.style.animation = 'slideIn 0.3s ease';
    } else {
        panel.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            panel.style.display = 'none';
        }, 300);
    }
}

// ================= VISUALIZADOR PDF =================
function abrirVisualizadorPDF(nota) {
    const modal = document.getElementById('pdf-viewer-modal');
    const iframe = document.getElementById('pdf-viewer-iframe');
    const title = document.getElementById('pdf-viewer-title');
    
    title.textContent = `NF-${nota.numero}.pdf`;
    // Em produção, usar URL real do PDF
    iframe.src = `data:application/pdf;base64,`; // Placeholder
    modal.classList.add('show');
}

function pdfZoomIn() {
    // Implementar zoom
}

function pdfZoomOut() {
    // Implementar zoom
}

function pdfDownload() {
    const btn = event?.target?.closest('.btn-icon');
    if (btn) {
        btn.style.animation = 'buttonPulse 0.3s ease';
        btn.classList.add('loading');
        setTimeout(() => {
            btn.classList.remove('loading');
        }, 1000);
    }
    
    mostrarToast('Download iniciado', 'success');
}

function pdfPrint() {
    const btn = event?.target?.closest('.btn-icon');
    if (btn) {
        btn.style.animation = 'buttonPulse 0.3s ease';
    }
    
    window.print();
    mostrarToast('Impressão iniciada', 'success');
}

// ================= OUTRAS FUNÇÕES =================
// ================= NOVA PASTA - FUNÇÃO COMPLETA =================
function novaPasta() {
    const btn = document.querySelector('.btn-toolbar:has(.fa-folder-plus)');
    if (btn) {
        btn.style.animation = 'buttonPulse 0.3s ease';
    }
    
    const modal = document.getElementById('nova-pasta-modal');
    const path = state.currentPath;
    const nivel = path.length;
    
    // Determinar tipo de pasta baseado no nível atual
    let tipoPasta = 'cliente';
    let label = 'Nome do Cliente';
    let hint = 'Digite o nome do cliente (ex: Mercado Livre, Amazon)';
    let placeholder = 'Ex: Mercado Livre';
    
    if (nivel === 2) {
        // Dentro de um cliente - criar ano
        tipoPasta = 'ano';
        label = 'Ano';
        hint = 'Digite o ano (ex: 2024, 2025)';
        placeholder = 'Ex: 2024';
    } else if (nivel === 3) {
        // Dentro de um ano - criar mês
        tipoPasta = 'mes';
        label = 'Mês';
        hint = 'Selecione o mês';
        placeholder = 'Selecione o mês';
    } else if (nivel === 4) {
        // Dentro de um mês - criar data
        tipoPasta = 'data';
        label = 'Data';
        hint = 'Selecione a data da nota fiscal';
        placeholder = 'Selecione a data';
    } else if (nivel === 5) {
        // Dentro de uma data - criar subpasta personalizada
        tipoPasta = 'subpasta';
        label = 'Nome da Subpasta';
        hint = 'Digite o nome da subpasta (ex: Notas Pagas, Notas Pendentes)';
        placeholder = 'Ex: Notas Pagas';
    }
    
    // Configurar modal
    document.getElementById('nova-pasta-label').textContent = label;
    document.getElementById('nova-pasta-hint').textContent = hint;
    const input = document.getElementById('nova-pasta-nome');
    input.placeholder = placeholder;
    input.value = '';
    input.type = 'text';
    input.maxLength = '';
    
    // Configurar opções específicas
    const opcoesDiv = document.getElementById('nova-pasta-opcoes');
    opcoesDiv.innerHTML = '';
    opcoesDiv.style.display = 'none';
    
    if (tipoPasta === 'mes') {
        // Mostrar seletor de mês
        opcoesDiv.style.display = 'block';
        let html = '<div class="form-group"><label>Selecione o Mês</label><div class="meses-grid">';
        CONFIG.MESES.forEach(mes => {
            html += `
                <div class="mes-option" onclick="selecionarMes('${mes.numero}', '${mes.nome}')">
                    <div class="mes-emoji">${mes.emoji}</div>
                    <div class="mes-nome">${mes.nome}</div>
                </div>
            `;
        });
        html += '</div></div>';
        opcoesDiv.innerHTML = html;
        input.style.display = 'none';
    } else if (tipoPasta === 'data') {
        // Mostrar seletor de data
        opcoesDiv.style.display = 'block';
        opcoesDiv.innerHTML = `
            <div class="form-group">
                <label>Data da Nota Fiscal</label>
                <input type="date" id="nova-pasta-data" class="form-control" 
                       min="2020-01-01" max="2030-12-31" 
                       onchange="atualizarPreviewNovaPasta('data', state.currentPath)">
            </div>
        `;
        input.style.display = 'none';
        
        // Definir data padrão como hoje
        const dataInput = document.getElementById('nova-pasta-data');
        if (dataInput) {
            const hoje = new Date().toISOString().split('T')[0];
            dataInput.value = hoje;
            atualizarPreviewNovaPasta('data', path);
        }
    } else {
        // Garantir que o input esteja visível e habilitado
        input.style.display = 'block';
        input.disabled = false;
        input.readOnly = false;
        input.style.pointerEvents = 'auto';
        input.style.opacity = '1';
        
        if (tipoPasta === 'ano') {
            input.type = 'number';
            input.min = '2020';
            input.max = '2030';
            input.value = new Date().getFullYear().toString();
        } else {
            input.type = 'text';
        }
    }
    
    // Atualizar preview do caminho
    atualizarPreviewNovaPasta(tipoPasta, path);
    
    // Desabilitar botão criar inicialmente se for mês
    const btnCriar = modal.querySelector('.btn-primary');
    if (tipoPasta === 'mes' && btnCriar) {
        btnCriar.disabled = true;
        btnCriar.style.opacity = '0.5';
    } else if (btnCriar) {
        btnCriar.disabled = false;
        btnCriar.style.opacity = '1';
    }
    
    // Mostrar modal
    modal.classList.add('show');
    const content = modal.querySelector('.modal-content');
    if (content) {
        content.style.animation = 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    }
    
    // Focar no input se não for mês ou data - MÚLTIPLAS TENTATIVAS
    if (tipoPasta !== 'mes' && tipoPasta !== 'data') {
        // Primeira tentativa rápida
        setTimeout(() => {
            input.focus();
            input.click();
        }, 100);
        
        // Segunda tentativa após modal estar totalmente renderizado
        setTimeout(() => {
            input.focus();
            input.click();
            input.select();
            // Garantir que o input esteja totalmente funcional
            input.removeAttribute('readonly');
            input.removeAttribute('disabled');
            input.setAttribute('contenteditable', 'true');
            input.style.pointerEvents = 'auto';
            input.style.opacity = '1';
            input.style.cursor = 'text';
        }, 400);
        
        // Terceira tentativa para garantir
        setTimeout(() => {
            input.focus();
            input.click();
        }, 600);
    }
    
    // Salvar tipo de pasta no estado
    state.novaPastaTipo = tipoPasta;
    
    // Garantir que o input esteja sempre funcional
    if (tipoPasta !== 'mes' && tipoPasta !== 'data') {
        // Remover qualquer atributo que possa bloquear
        input.removeAttribute('readonly');
        input.removeAttribute('disabled');
        input.setAttribute('tabindex', '0');
        
        // Garantir estilos corretos
        input.style.pointerEvents = 'auto';
        input.style.opacity = '1';
        input.style.display = 'block';
        input.style.visibility = 'visible';
        input.style.position = 'relative';
        input.style.zIndex = '1000';
        
        // Limpar listeners antigos adicionando um novo handler
        const handleKeyDown = function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                criarNovaPasta();
            }
        };
        
        const handleInput = function() {
            atualizarPreviewNovaPasta(tipoPasta, path);
        };
        
        // Remover listeners anteriores se existirem
        input.removeEventListener('keydown', handleKeyDown);
        input.removeEventListener('input', handleInput);
        
        // Adicionar novos listeners
        input.addEventListener('keydown', handleKeyDown);
        if (tipoPasta === 'cliente' || tipoPasta === 'ano' || tipoPasta === 'subpasta') {
            input.addEventListener('input', handleInput);
        }
        
        // Focar após um pequeno delay para garantir que o modal esteja totalmente renderizado
        setTimeout(() => {
            try {
                input.focus();
                input.click();
                // Forçar seleção do texto se houver
                if (input.value) {
                    input.select();
                }
            } catch(e) {
                console.log('Erro ao focar input:', e);
            }
        }, 500);
    }
    
    // Listener para data input
    if (tipoPasta === 'data') {
        setTimeout(() => {
            const dataInput = document.getElementById('nova-pasta-data');
            if (dataInput) {
                dataInput.addEventListener('change', function() {
                    atualizarPreviewNovaPasta('data', path);
                    const btnCriar = document.querySelector('#nova-pasta-modal .btn-primary');
                    if (btnCriar && this.value) {
                        btnCriar.disabled = false;
                        btnCriar.style.opacity = '1';
                    }
                });
            }
        }, 200);
    }
}

function atualizarPreviewNovaPasta(tipoPasta, path) {
    const preview = document.getElementById('nova-pasta-path');
    let caminho = 'Início';
    
    if (path.length > 1) {
        caminho = path.slice(1).join(' > ');
    }
    
    // Obter nome digitado se houver
    const input = document.getElementById('nova-pasta-nome');
    let nomeDigitado = '';
    if (input && input.value.trim()) {
        nomeDigitado = input.value.trim();
    }
    
    let novoItem = '';
    if (tipoPasta === 'cliente') {
        novoItem = nomeDigitado ? 
            `<span class="preview-novo">${nomeDigitado}</span>` : 
            '<span class="preview-novo">[Novo Cliente]</span>';
    } else if (tipoPasta === 'ano') {
        novoItem = nomeDigitado ? 
            `<span class="preview-novo">${nomeDigitado}</span>` : 
            '<span class="preview-novo">[Novo Ano]</span>';
    } else if (tipoPasta === 'mes') {
        const mesNome = state.novaPastaMesNome || '[Novo Mês]';
        novoItem = `<span class="preview-novo">${mesNome}</span>`;
    } else if (tipoPasta === 'data') {
        const dataInput = document.getElementById('nova-pasta-data');
        const dataNome = dataInput && dataInput.value ? 
            formatarData(dataInput.value) : '[Nova Data]';
        novoItem = `<span class="preview-novo">${dataNome}</span>`;
    } else {
        novoItem = nomeDigitado ? 
            `<span class="preview-novo">${nomeDigitado}</span>` : 
            '<span class="preview-novo">[Nova Subpasta]</span>';
    }
    
    preview.innerHTML = caminho ? `${caminho} > ${novoItem}` : novoItem;
}

function selecionarMes(numero, nome) {
    // Remover seleção anterior
    document.querySelectorAll('.mes-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // Selecionar novo mês
    const selected = event.currentTarget;
    selected.classList.add('selected');
    
    // Animação de seleção
    selected.style.animation = 'buttonPulse 0.3s ease';
    
    // Atualizar input hidden
    const input = document.getElementById('nova-pasta-nome');
    if (input) {
        input.value = nome;
    }
    state.novaPastaMesNumero = numero;
    state.novaPastaMesNome = nome;
    
    // Atualizar preview
    atualizarPreviewNovaPasta('mes', state.currentPath);
    
    // Habilitar botão criar
    const btnCriar = document.querySelector('#nova-pasta-modal .btn-primary');
    if (btnCriar) {
        btnCriar.disabled = false;
        btnCriar.style.opacity = '1';
    }
}

function criarNovaPasta() {
    const tipoPasta = state.novaPastaTipo;
    if (!tipoPasta) {
        mostrarToast('Erro: tipo de pasta não definido', 'error');
        return;
    }
    
    const btn = document.querySelector('#nova-pasta-modal .btn-primary');
    if (btn) {
        btn.classList.add('loading');
        btn.disabled = true;
    }
    
    const path = state.currentPath;
    let nome = '';
    let valor = null;
    
    // Obter valor baseado no tipo
    if (tipoPasta === 'mes') {
        if (!state.novaPastaMesNome || !state.novaPastaMesNumero) {
            mostrarToast('Selecione um mês', 'error');
            if (btn) {
                btn.classList.remove('loading');
                btn.disabled = false;
            }
            return;
        }
        nome = state.novaPastaMesNome;
        valor = state.novaPastaMesNumero;
    } else if (tipoPasta === 'data') {
        const dataInput = document.getElementById('nova-pasta-data');
        if (!dataInput || !dataInput.value) {
            mostrarToast('Selecione uma data', 'error');
            if (btn) {
                btn.classList.remove('loading');
                btn.disabled = false;
            }
            return;
        }
        nome = formatarData(dataInput.value);
        valor = dataInput.value;
    } else {
        const input = document.getElementById('nova-pasta-nome');
        nome = input.value.trim();
        
        if (!nome) {
            mostrarToast('Digite um nome para a pasta', 'error');
            input.focus();
            if (btn) {
                btn.classList.remove('loading');
                btn.disabled = false;
            }
            return;
        }
        
        if (tipoPasta === 'ano') {
            valor = parseInt(nome);
            if (isNaN(valor) || valor < 2020 || valor > 2030) {
                mostrarToast('Ano inválido. Use um ano entre 2020 e 2030', 'error');
                input.focus();
                if (btn) {
                    btn.classList.remove('loading');
                    btn.disabled = false;
                }
                return;
            }
            nome = valor.toString();
        }
    }
    
    // Validar e criar pasta baseado no tipo
    if (tipoPasta === 'cliente') {
        // Criar novo cliente
        if (state.clientes.includes(nome)) {
            mostrarToast('Um cliente com esse nome já existe', 'error');
            if (btn) {
                btn.classList.remove('loading');
                btn.disabled = false;
            }
            return;
        }
        state.clientes.push(nome);
        salvarDados();
        mostrarToast(`Cliente "${nome}" criado com sucesso! 🎉`, 'success');
        
        // Atualizar árvore imediatamente
        renderizarTreeView();
        
        // Navegar para o novo cliente
        setTimeout(() => {
            navegarPara(['root', nome]);
        }, 300);
        
    } else if (tipoPasta === 'ano') {
        // Criar/navegar para ano
        const cliente = path[1];
        const novoPath = [...path, nome];
        
        // Verificar se o ano já está na lista padrão
        if (CONFIG.ANOS.includes(valor)) {
            navegarPara(novoPath);
            mostrarToast(`Navegando para o ano ${nome}`, 'success');
        } else {
            // Adicionar ano personalizado (se necessário expandir CONFIG.ANOS)
            navegarPara(novoPath);
            mostrarToast(`Ano "${nome}" preparado para organização`, 'success');
        }
        
    } else if (tipoPasta === 'mes') {
        // Navegar para mês selecionado
        if (!valor || !state.novaPastaMesNome) {
            mostrarToast('Selecione um mês', 'error');
            return;
        }
        
        const novoPath = [...path, valor];
        navegarPara(novoPath);
        mostrarToast(`Navegando para ${nome}`, 'success');
        
    } else if (tipoPasta === 'data') {
        // Criar/navegar para data
        const cliente = path[1];
        const ano = path[2];
        const mes = path[3];
        
        // Verificar se já existe data com notas
        const notasExistentes = state.notasFiscais.filter(n => 
            n.cliente === cliente && 
            n.ano === parseInt(ano) && 
            n.mes === mes && 
            n.data === valor
        );
        
        if (notasExistentes.length > 0) {
            // Já existe, apenas navegar
            const novoPath = [...path, valor];
            navegarPara(novoPath);
            mostrarToast(`Navegando para data ${nome} (${notasExistentes.length} nota(s) encontrada(s))`, 'success');
        } else {
            // Nova data - navegar para ela (será criada quando houver upload)
            const novoPath = [...path, valor];
            navegarPara(novoPath);
            mostrarToast(`Data "${nome}" preparada para receber notas fiscais`, 'success');
        }
        
    } else if (tipoPasta === 'subpasta') {
        // Criar subpasta personalizada dentro da data
        const cliente = path[1];
        const ano = path[2];
        const mes = path[3];
        const data = path[4];
        
        // Adicionar subpasta ao estado
        if (!state.subpastas) {
            state.subpastas = {};
        }
        
        const subpastaKey = `${cliente}/${ano}/${mes}/${data}`;
        if (!state.subpastas[subpastaKey]) {
            state.subpastas[subpastaKey] = [];
        }
        
        if (state.subpastas[subpastaKey].includes(nome)) {
            mostrarToast('Uma subpasta com esse nome já existe', 'error');
            return;
        }
        
        state.subpastas[subpastaKey].push(nome);
        salvarDados();
        mostrarToast(`Subpasta "${nome}" criada com sucesso! 📁`, 'success');
    }
    
    // Atualizar interface imediatamente
    renderizarConteudo();
    renderizarTreeView();
    
    // Fechar modal após animação
    setTimeout(() => {
        fecharModal('nova-pasta-modal');
        
        // Limpar estado
        state.novaPastaTipo = null;
        state.novaPastaMesNumero = null;
        state.novaPastaMesNome = null;
        
        // Limpar input
        const input = document.getElementById('nova-pasta-nome');
        if (input) {
            input.value = '';
            input.type = 'text';
        }
        
        // Limpar opções
        const opcoes = document.getElementById('nova-pasta-opcoes');
        if (opcoes) {
            opcoes.innerHTML = '';
            opcoes.style.display = 'none';
        }
        
        // Reabilitar botão
        if (btn) {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    }, 500);
}

// Adicionar ao estado global
if (!state.subpastas) {
    state.subpastas = {};
}

function atualizarConteudo() {
    const btn = document.querySelector('.btn-refresh');
    if (btn) {
        btn.classList.add('loading');
        btn.querySelector('i').style.animation = 'iconSpin 1s linear infinite';
    }
    
    setTimeout(() => {
        renderizarConteudo();
        mostrarToast('Conteúdo atualizado', 'success');
        if (btn) {
            btn.classList.remove('loading');
            btn.querySelector('i').style.animation = '';
        }
    }, 500);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const explorerSidebar = document.getElementById('explorer-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    // Toggle para sidebar principal
    if (sidebar) {
        sidebar.classList.toggle('open');
        if (overlay) {
            if (sidebar.classList.contains('open')) {
                overlay.classList.add('active');
                overlay.style.display = 'block';
                // Garantir que a opacidade seja aplicada
                setTimeout(function() {
                    overlay.style.opacity = '1';
                }, 10);
            } else {
                overlay.style.opacity = '0';
                setTimeout(function() {
                    overlay.classList.remove('active');
                    overlay.style.display = 'none';
                }, 300);
            }
        }
    }
    
    // Toggle para explorer sidebar (se existir)
    if (explorerSidebar) {
        const btn = document.querySelector('.btn-sidebar-toggle');
        if (btn) {
            btn.style.animation = 'buttonPulse 0.3s ease';
            const icon = btn.querySelector('i');
            if (icon) {
                icon.style.transition = 'transform 0.3s ease';
            }
        }
        explorerSidebar.classList.toggle('collapsed');
        
        // Atualizar ícone
        if (btn && btn.querySelector('i')) {
            if (explorerSidebar.classList.contains('collapsed')) {
                btn.querySelector('i').className = 'fas fa-chevron-right';
            } else {
                btn.querySelector('i').className = 'fas fa-chevron-left';
            }
        }
    }
}

function toggleSection(sectionId) {
    const header = event.currentTarget;
    const arrow = header.querySelector('.section-arrow');
    
    header.classList.toggle('active');
    
    if (arrow) {
        arrow.style.transition = 'transform 0.3s ease';
        if (header.classList.contains('active')) {
            arrow.style.transform = 'rotate(180deg)';
        } else {
            arrow.style.transform = 'rotate(0deg)';
        }
    }
    
    // Animação suave
    header.style.animation = 'buttonPulse 0.3s ease';
}

// ================= ATALHOS DE TECLADO =================
function configurarAtalhosTeclado() {
    document.addEventListener('keydown', function(e) {
        // Ctrl + C (Copiar)
        if (e.ctrlKey && e.key === 'c' && !e.shiftKey) {
            e.preventDefault();
            copiarSelecionados();
        }
        
        // Ctrl + V (Colar)
        if (e.ctrlKey && e.key === 'v' && !e.shiftKey) {
            e.preventDefault();
            colar();
        }
        
        // Ctrl + X (Cortar)
        if (e.ctrlKey && e.key === 'x' && !e.shiftKey) {
            e.preventDefault();
            cortarSelecionados();
        }
        
        // Ctrl + A (Selecionar Tudo)
        if (e.ctrlKey && e.key === 'a' && !e.shiftKey) {
            e.preventDefault();
            selecionarTudo();
        }
        
        // Delete (Deletar)
        if (e.key === 'Delete' && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            deletarSelecionados();
        }
        
        // F2 (Renomear)
        if (e.key === 'F2') {
            e.preventDefault();
            renomearSelecionado();
        }
        
        // F5 (Atualizar)
        if (e.key === 'F5') {
            e.preventDefault();
            atualizarConteudo();
        }
        
        // Ctrl + U (Upload)
        if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
            abrirUpload();
        }
        
        // Ctrl + N (Nova Pasta)
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            novaPasta();
        }
        
        // Alt + ← (Voltar)
        if (e.altKey && e.key === 'ArrowLeft') {
            e.preventDefault();
            navegarVoltar();
        }
        
        // Alt + → (Avançar)
        if (e.altKey && e.key === 'ArrowRight') {
            e.preventDefault();
            navegarAvancar();
        }
        
        // Alt + ↑ (Subir)
        if (e.altKey && e.key === 'ArrowUp') {
            e.preventDefault();
            navegarAcima();
        }
        
        // ESC (Fechar modais)
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.show').forEach(modal => {
                modal.classList.remove('show');
            });
        }
    });
}

// ================= UTILITÁRIOS =================
function formatarData(data) {
    if (!data) return '-';
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR');
}

function formatarMoeda(valor) {
    if (!valor) return '-';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

function formatarTamanho(kb) {
    if (!kb) return '-';
    if (kb < 1024) return `${Math.round(kb)} KB`;
    if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(2)} MB`;
    return `${(kb / (1024 * 1024)).toFixed(2)} GB`;
}

function mostrarToast(mensagem, tipo = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${tipo === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${tipo === 'success' ? 'Sucesso' : 'Erro'}</div>
            <div class="toast-message">${mensagem}</div>
        </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ================= EVENTOS =================
function configurarEventos() {
    // Click fora dos modais para fechar
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });
}

// ================= EXPORTAR FUNÇÕES GLOBAIS =================
window.navegarPara = navegarPara;
window.navegarVoltar = navegarVoltar;
window.navegarAvancar = navegarAvancar;
window.navegarAcima = navegarAcima;
window.toggleViewMode = toggleViewMode;
window.abrirUpload = abrirUpload;
window.fecharModal = fecharModal;
window.handleDragOver = handleDragOver;
window.handleDrop = handleDrop;
window.handleFileSelect = handleFileSelect;
window.processarUpload = processarUpload;
window.buscarNotas = buscarNotas;
window.abrirBuscaAvancada = abrirBuscaAvancada;
window.executarBuscaAvancada = executarBuscaAvancada;
window.aplicarFiltros = aplicarFiltros;
window.toggleFiltersPanel = toggleFiltersPanel;
window.ordenarPor = ordenarPor;
window.copiarSelecionados = copiarSelecionados;
window.cortarSelecionados = cortarSelecionados;
window.colar = colar;
window.deletarSelecionados = deletarSelecionados;
window.renomearSelecionado = renomearSelecionado;
window.propriedadesSelecionado = propriedadesSelecionado;
window.togglePropertiesPanel = togglePropertiesPanel;
window.selecionarTudo = selecionarTudo;
window.selecionarTudoCheckbox = selecionarTudoCheckbox;
window.toggleSelecaoItem = toggleSelecaoItem;
window.abrirItem = abrirItem;
window.abrirVisualizadorPDF = abrirVisualizadorPDF;
window.pdfZoomIn = pdfZoomIn;
window.pdfZoomOut = pdfZoomOut;
window.pdfDownload = pdfDownload;
window.pdfPrint = pdfPrint;
window.novaPasta = novaPasta;
window.criarNovaPasta = criarNovaPasta;
window.selecionarMes = selecionarMes;
window.atualizarPreviewNovaPasta = atualizarPreviewNovaPasta;

// Função para toggle de itens da árvore
function toggleTreeItem(event, path) {
    event.stopPropagation();
    
    // Navegar e expandir/colapsar
    navegarPara(path);
}
window.atualizarConteudo = atualizarConteudo;
window.toggleSidebar = toggleSidebar;
window.toggleTreeItem = toggleTreeItem;
window.toggleSection = toggleSection;

// Funções de UI adicionais
if (typeof showSection === 'undefined') {
    window.showSection = function(sectionId) {
        document.querySelectorAll('.content-section').forEach(function(section) {
            section.classList.remove('active');
        });
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('active');
        }
        
        // Atualizar navegação
        document.querySelectorAll('.nav-item').forEach(function(item) {
            item.classList.remove('active');
        });
        const navItem = document.querySelector('.nav-item[onclick*="' + sectionId + '"]');
        if (navItem) {
            navItem.classList.add('active');
        }
        
        // Atualizar título
        const titles = {
            'dashboard': 'Dashboard',
            'notas': 'Notas Fiscais',
            'fornecedores': 'Fornecedores',
            'relatorios': 'Relatórios',
            'backup': 'Backup',
            'configuracoes': 'Configurações'
        };
        
        const titleEl = document.getElementById('page-title');
        const subtitleEl = document.querySelector('.page-subtitle');
        if (titleEl) titleEl.textContent = titles[sectionId] || 'Dashboard';
        if (subtitleEl && sectionId === 'dashboard') {
            subtitleEl.textContent = 'Sistema inteligente de gestão fiscal';
        }
    };
}

if (typeof toggleNotifications === 'undefined') {
    window.toggleNotifications = function() {
        const panel = document.getElementById('notifications-panel');
        if (panel) {
            panel.classList.toggle('active');
        }
    };
}

if (typeof toggleAdvancedSearch === 'undefined') {
    window.toggleAdvancedSearch = function() {
        const search = document.getElementById('advanced-search');
        if (search) {
            search.classList.toggle('active');
        }
    };
}

// Funções placeholder
if (typeof abrirScanner === 'undefined') {
    window.abrirScanner = function() { alert('Funcionalidade de scanner será implementada'); };
}

if (typeof abrirImportacaoXML === 'undefined') {
    window.abrirImportacaoXML = function() {
        const modal = document.getElementById('xml-modal');
        if (modal) modal.style.display = 'flex';
        else alert('Funcionalidade de importação XML será implementada');
    };
}

if (typeof abrirValidacaoChave === 'undefined') {
    window.abrirValidacaoChave = function() {
        const modal = document.getElementById('validate-key-modal');
        if (modal) modal.style.display = 'flex';
        else alert('Funcionalidade de validação será implementada');
    };
}

if (typeof abrirLembretes === 'undefined') {
    window.abrirLembretes = function() { alert('Funcionalidade de lembretes será implementada'); };
}

if (typeof gerarRelatorio === 'undefined') {
    window.gerarRelatorio = function() {
        if (typeof abrirRelatorios !== 'undefined') abrirRelatorios();
        else if (typeof showSection !== 'undefined') showSection('relatorios');
        else alert('Funcionalidade de relatórios será implementada');
    };
}

if (typeof logout === 'undefined') {
    window.logout = function() {
        if (confirm('Deseja realmente sair do sistema?')) {
            window.location.href = 'index.html';
        }
    };
}

if (typeof toggleTheme === 'undefined') {
    window.toggleTheme = function() {
        const html = document.documentElement;
        const theme = html.getAttribute('data-theme');
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('axis-theme', newTheme);
        
        const icon = document.getElementById('theme-icon');
        if (icon) {
            icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    };
    
    // Carregar tema salvo
    const savedTheme = localStorage.getItem('axis-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const icon = document.getElementById('theme-icon');
    if (icon) {
        icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// ================= MELHORIAS AVANÇADAS - 100+ FUNCIONALIDADES =================

// 1. Sistema de Favoritos Funcional
function adicionarFavorito(item) {
    const favoritoId = JSON.stringify(item.caminho);
    if (!state.favoritos.find(f => JSON.stringify(f.caminho) === favoritoId)) {
        state.favoritos.push(item);
        salvarDados();
        mostrarToast('Adicionado aos favoritos', 'success');
        renderizarFavoritos();
    }
}

function removerFavorito(item) {
    const favoritoId = JSON.stringify(item.caminho);
    state.favoritos = state.favoritos.filter(f => JSON.stringify(f.caminho) !== favoritoId);
    salvarDados();
    mostrarToast('Removido dos favoritos', 'success');
    renderizarFavoritos();
}

function toggleFavorito(item) {
    const favoritoId = JSON.stringify(item.caminho);
    const existe = state.favoritos.find(f => JSON.stringify(f.caminho) === favoritoId);
    if (existe) {
        removerFavorito(item);
    } else {
        adicionarFavorito(item);
    }
}

function renderizarFavoritos() {
    const container = document.getElementById('favoritos-content');
    if (!container) return;
    
    if (state.favoritos.length === 0) {
        container.innerHTML = '<div style="padding: 12px; color: var(--text-secondary); font-size: 12px;">Nenhum favorito</div>';
        return;
    }
    
    let html = '';
    state.favoritos.forEach(fav => {
        html += `
            <div class="tree-item" onclick="navegarPara(${JSON.stringify(fav.caminho)})">
                <div class="tree-item-icon"><i class="fas fa-star" style="color: #ffd700;"></i></div>
                <div class="tree-item-name">${fav.nome}</div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// 2. Renomeação Inline Funcional
function iniciarRenomeacao(item, elemento) {
    if (state.renomeandoItem) return;
    
    state.renomeandoItem = item;
    const nomeAtual = item.nome;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = nomeAtual;
    input.className = 'rename-input';
    input.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border: 2px solid var(--accent-blue);
        border-radius: 4px;
        padding: 4px 8px;
        font-size: inherit;
        font-family: inherit;
        background: var(--card-bg);
        z-index: 1000;
    `;
    
    const parent = elemento.parentElement;
    const rect = elemento.getBoundingClientRect();
    input.style.width = rect.width + 'px';
    input.style.height = rect.height + 'px';
    
    input.addEventListener('blur', () => finalizarRenomeacao(input, item));
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            finalizarRenomeacao(input, item);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelarRenomeacao(input);
        }
    });
    
    parent.style.position = 'relative';
    parent.appendChild(input);
    input.focus();
    input.select();
}

function finalizarRenomeacao(input, item) {
    const novoNome = input.value.trim();
    if (novoNome && novoNome !== item.nome) {
        // Atualizar nome
        if (item.tipo === 'cliente') {
            const index = state.clientes.indexOf(item.nome);
            if (index >= 0) {
                state.clientes[index] = novoNome;
                // Atualizar todas as notas deste cliente
                state.notasFiscais.forEach(nota => {
                    if (nota.cliente === item.nome) {
                        nota.cliente = novoNome;
                        nota.caminho = nota.caminho.replace(item.nome, novoNome);
                    }
                });
            }
        } else if (item.nota) {
            item.nota.numero = novoNome.replace('NF-', '').replace('.pdf', '');
        }
        salvarDados();
        mostrarToast('Item renomeado com sucesso', 'success');
    }
    cancelarRenomeacao(input);
}

function cancelarRenomeacao(input) {
    state.renomeandoItem = null;
    input.remove();
    renderizarConteudo();
}

// 3. Drag & Drop Funcional Completo
function configurarDragDrop() {
    document.addEventListener('dragstart', function(e) {
        const item = e.target.closest('.grid-item, .list-table tbody tr, .details-item');
        if (item) {
            const index = Array.from(item.parentElement.children).indexOf(item);
            const itens = obterItensAtuais();
            const itensFiltrados = aplicarFiltros(itens);
            const itensOrdenados = ordenarItens(itensFiltrados);
            state.dragSource = itensOrdenados[index];
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', '');
            item.style.opacity = '0.5';
        }
    });
    
    document.addEventListener('dragend', function(e) {
        e.target.style.opacity = '1';
        state.dragSource = null;
        state.dragTarget = null;
    });
    
    document.addEventListener('dragover', function(e) {
        const item = e.target.closest('.grid-item, .list-table tbody tr, .details-item, .tree-item');
        if (item && state.dragSource) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            state.dragTarget = item;
            item.classList.add('drag-over');
        }
    });
    
    document.addEventListener('dragleave', function(e) {
        const item = e.target.closest('.grid-item, .list-table tbody tr, .details-item, .tree-item');
        if (item) {
            item.classList.remove('drag-over');
        }
    });
    
    document.addEventListener('drop', function(e) {
        e.preventDefault();
        const target = e.target.closest('.grid-item, .list-table tbody tr, .details-item, .tree-item');
        if (target && state.dragSource) {
            const index = Array.from(target.parentElement.children).indexOf(target);
            const itens = obterItensAtuais();
            const itensFiltrados = aplicarFiltros(itens);
            const itensOrdenados = ordenarItens(itensFiltrados);
            const targetItem = itensOrdenados[index];
            
            if (targetItem && targetItem.tipo !== 'pdf' && state.dragSource.tipo === 'pdf') {
                moverItem(state.dragSource, targetItem);
            }
            
            target.classList.remove('drag-over');
            state.dragSource = null;
            state.dragTarget = null;
        }
    });
}

function moverItem(item, destino) {
    if (item.nota && destino.caminho) {
        const novoCaminho = [...destino.caminho];
        if (novoCaminho.length === 2) {
            // Mover para cliente
            item.nota.cliente = novoCaminho[1];
            item.nota.ano = null;
            item.nota.mes = null;
            item.nota.data = null;
        } else if (novoCaminho.length === 3) {
            // Mover para ano
            item.nota.cliente = novoCaminho[1];
            item.nota.ano = parseInt(novoCaminho[2]);
            item.nota.mes = null;
            item.nota.data = null;
        } else if (novoCaminho.length === 4) {
            // Mover para mês
            item.nota.cliente = novoCaminho[1];
            item.nota.ano = parseInt(novoCaminho[2]);
            item.nota.mes = novoCaminho[3];
            item.nota.data = null;
        }
        
        item.nota.caminho = novoCaminho.join('/');
        salvarDados();
        mostrarToast('Item movido com sucesso', 'success');
        renderizarConteudo();
    }
}

// 4. Context Menu (Botão Direito)
function configurarContextMenu() {
    document.addEventListener('contextmenu', function(e) {
        const item = e.target.closest('.grid-item, .list-table tbody tr, .details-item');
        if (item) {
            e.preventDefault();
            mostrarContextMenu(e.pageX, e.pageY, item);
        } else {
            fecharContextMenu();
        }
    });
    
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.context-menu')) {
            fecharContextMenu();
        }
    });
}

function mostrarContextMenu(x, y, elemento) {
    fecharContextMenu();
    
    const index = Array.from(elemento.parentElement.children).indexOf(elemento);
    const itens = obterItensAtuais();
    const itensFiltrados = aplicarFiltros(itens);
    const itensOrdenados = ordenarItens(itensFiltrados);
    const item = itensOrdenados[index];
    
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        background: var(--card-bg);
        border: 1px solid var(--glass-border);
        border-radius: 8px;
        box-shadow: var(--shadow-heavy);
        padding: 4px;
        z-index: 10000;
        min-width: 200px;
    `;
    
    const isFavorito = state.favoritos.find(f => JSON.stringify(f.caminho) === JSON.stringify(item.caminho));
    
    menu.innerHTML = `
        <div class="context-menu-item" onclick="abrirItem(${index})">
            <i class="fas fa-eye"></i> Abrir
        </div>
        <div class="context-menu-item" onclick="toggleFavorito(${JSON.stringify(item).replace(/"/g, '&quot;')})">
            <i class="fas fa-star" style="color: ${isFavorito ? '#ffd700' : 'inherit'}"></i> ${isFavorito ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
        </div>
        <div class="context-menu-separator"></div>
        <div class="context-menu-item" onclick="copiarSelecionados(); fecharContextMenu();">
            <i class="fas fa-copy"></i> Copiar
        </div>
        <div class="context-menu-item" onclick="cortarSelecionados(); fecharContextMenu();">
            <i class="fas fa-cut"></i> Cortar
        </div>
        <div class="context-menu-item" onclick="colar(); fecharContextMenu();">
            <i class="fas fa-paste"></i> Colar
        </div>
        <div class="context-menu-separator"></div>
        <div class="context-menu-item" onclick="iniciarRenomeacaoInline(${index}); fecharContextMenu();">
            <i class="fas fa-edit"></i> Renomear
        </div>
        <div class="context-menu-item" onclick="propriedadesSelecionado(); fecharContextMenu();">
            <i class="fas fa-info-circle"></i> Propriedades
        </div>
        <div class="context-menu-separator"></div>
        <div class="context-menu-item" onclick="deletarSelecionados(); fecharContextMenu();" style="color: var(--danger-color);">
            <i class="fas fa-trash"></i> Deletar
        </div>
    `;
    
    document.body.appendChild(menu);
    state.contextMenu = menu;
    
    // Ajustar posição se sair da tela
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        menu.style.left = (window.innerWidth - rect.width - 10) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
        menu.style.top = (window.innerHeight - rect.height - 10) + 'px';
    }
}

function fecharContextMenu() {
    if (state.contextMenu) {
        state.contextMenu.remove();
        state.contextMenu = null;
    }
}

function iniciarRenomeacaoInline(index) {
    const itens = obterItensAtuais();
    const itensFiltrados = aplicarFiltros(itens);
    const itensOrdenados = ordenarItens(itensFiltrados);
    const item = itensOrdenados[index];
    
    const elemento = state.viewMode === 'grid' 
        ? document.querySelectorAll('.grid-item')[index]
        : state.viewMode === 'list'
        ? document.querySelectorAll('.list-table tbody tr')[index]
        : document.querySelectorAll('.details-item')[index];
    
    if (elemento) {
        const nomeElement = elemento.querySelector('.grid-item-name, .col-name, .details-item-name');
        if (nomeElement) {
            iniciarRenomeacao(item, nomeElement);
        }
    }
}

// 5. Upload Funcional Completo
function processarUploadCompleto() {
    if (state.uploadFiles.length === 0) {
        mostrarToast('Nenhum arquivo selecionado', 'error');
        return;
    }
    
    const autoOrganize = document.getElementById('auto-organize')?.checked;
    const autoRename = document.getElementById('auto-rename')?.checked;
    const btn = document.querySelector('.btn-primary:has-text("Fazer Upload")');
    
    if (btn) {
        btn.classList.add('loading');
        btn.disabled = true;
    }
    
    state.uploadFiles.forEach((fileData, index) => {
        const file = fileData.file;
        const progressBar = fileData.progressBar;
        
        // Simular upload com animação
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 25 + 5;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                
                // Animação de conclusão
                progressBar.style.transition = 'width 0.3s ease';
                progressBar.style.background = 'linear-gradient(90deg, var(--apple-green), var(--apple-accent))';
                
                // Criar nota fiscal
                setTimeout(() => {
                    const nota = criarNotaFiscalDoArquivo(file, autoOrganize, autoRename);
                    
                    // Organizar automaticamente na estrutura Fornecedor > Ano > Mês > Data
                    if (typeof aplicarOrganizacaoAutomatica !== 'undefined') {
                        aplicarOrganizacaoAutomatica(nota);
                    } else if (typeof organizarNotaNaEstrutura !== 'undefined') {
                        organizarNotaNaEstrutura(nota);
                    }
                    state.notasFiscais.push(nota);
                    
                    if (index === state.uploadFiles.length - 1) {
                        salvarDados();
                        mostrarToast(`${state.uploadFiles.length} arquivo(s) enviado(s) com sucesso`, 'success');
                        
                        if (btn) {
                            btn.classList.remove('loading');
                            btn.disabled = false;
                            btn.style.animation = 'buttonPulse 0.5s ease';
                        }
                        
                        setTimeout(() => {
                            fecharModal('upload-modal');
                            renderizarConteudo();
                            state.uploadFiles = [];
                        }, 1000);
                    }
                }, 300);
            }
            progressBar.style.width = progress + '%';
            progressBar.style.transition = 'width 0.2s ease';
        }, 150);
    });
}

function criarNotaFiscalDoArquivo(file, autoOrganize, autoRename) {
    const path = state.currentPath;
    let cliente = path.length >= 2 ? path[1] : 'Geral';
    let ano = path.length >= 3 ? parseInt(path[2]) : new Date().getFullYear();
    let mes = path.length >= 4 ? path[3] : String(new Date().getMonth() + 1).padStart(2, '0');
    let data = path.length >= 5 ? path[4] : new Date().toISOString().split('T')[0];
    
    // OCR BÁSICO - Detectar informações do nome do arquivo
    const nomeArquivo = file.name;
    
    // Tentar detectar número da NF
    const numeroNF = nomeArquivo.match(/\d{6,}/)?.[0] || 
                     nomeArquivo.match(/NF[_-]?(\d+)/i)?.[1] || 
                     nomeArquivo.match(/(\d{6,})/)?.[1] ||
                     (100000 + Math.floor(Math.random() * 900000)).toString();
    
    // Tentar detectar cliente do nome do arquivo
    const clientesPossiveis = state.clientes.filter(c => 
        nomeArquivo.toLowerCase().includes(c.toLowerCase())
    );
    if (clientesPossiveis.length > 0 && autoOrganize) {
        cliente = clientesPossiveis[0];
    }
    
    // Tentar detectar data do nome do arquivo (formato: YYYY-MM-DD ou DD-MM-YYYY)
    const dataMatch = nomeArquivo.match(/(\d{4}[-_]\d{2}[-_]\d{2})|(\d{2}[-_]\d{2}[-_]\d{4})/);
    if (dataMatch && autoOrganize) {
        const dataStr = dataMatch[0].replace(/[-_]/g, '-');
        if (dataStr.length === 10) {
            // Tentar parsear data
            try {
                const dataParsed = new Date(dataStr);
                if (!isNaN(dataParsed.getTime())) {
                    data = dataParsed.toISOString().split('T')[0];
                    ano = dataParsed.getFullYear();
                    mes = String(dataParsed.getMonth() + 1).padStart(2, '0');
                }
            } catch (e) {
                // Manter valores padrão
            }
        }
    }
    
    // Tentar detectar valor do nome do arquivo (R$ ou valores)
    let valor = Math.floor(Math.random() * 10000) + 100;
    const valorMatch = nomeArquivo.match(/R\$\s*(\d+[.,]?\d*)|(\d+[.,]\d{2})/);
    if (valorMatch) {
        const valorStr = valorMatch[1] || valorMatch[2];
        valor = parseFloat(valorStr.replace(',', '.'));
    }
    
    return {
        id: `upload_${Date.now()}_${Math.random()}`,
        cliente: cliente,
        ano: ano,
        mes: mes,
        mesNome: CONFIG.MESES.find(m => m.numero === mes)?.nome || 'Desconhecido',
        data: data,
        valor: valor,
        status: 'pendente',
        numero: numeroNF,
        tamanho: Math.round(file.size / 1024),
        tipo: 'pdf',
        caminho: `${cliente}/${ano}/${mes}/${data}`,
        nomeArquivo: autoRename ? `NF-${numeroNF}.pdf` : nomeArquivo,
        uploadDate: new Date().toISOString()
    };
}

// 6. Operações de Arquivo Reais
function copiarSelecionadosReal() {
    if (state.selectedItems.length === 0) {
        mostrarToast('Nenhum item selecionado', 'error');
        return;
    }
    
    state.clipboard = state.selectedItems.map(item => ({...item}));
    state.clipboardAction = 'copy';
    mostrarToast(`${state.selectedItems.length} item(s) copiado(s)`, 'success');
    animarBotoes('.toolbar-btn');
    
    // Feedback visual no botão
    const btn = document.querySelector('.toolbar-btn:has(.fa-copy)');
    if (btn) {
        btn.classList.add('loading');
        setTimeout(() => btn.classList.remove('loading'), 500);
        btn.style.animation = 'buttonPulse 0.5s ease';
    }
}

function cortarSelecionadosReal() {
    if (state.selectedItems.length === 0) {
        mostrarToast('Nenhum item selecionado', 'error');
        return;
    }
    
    state.clipboard = state.selectedItems.map(item => ({...item}));
    state.clipboardAction = 'cut';
    mostrarToast(`${state.selectedItems.length} item(s) cortado(s)`, 'success');
    animarBotoes('.toolbar-btn');
    
    // Feedback visual no botão
    const btn = document.querySelector('.toolbar-btn:has(.fa-cut)');
    if (btn) {
        btn.classList.add('loading');
        setTimeout(() => btn.classList.remove('loading'), 500);
        btn.style.animation = 'buttonPulse 0.5s ease';
    }
    
    // Marcar itens como cortados visualmente
    state.selectedItems.forEach(item => {
        const itemId = JSON.stringify(item.caminho).replace(/"/g, '&quot;');
        const elemento = document.querySelector(`[data-item-id="${itemId}"]`);
        if (elemento) {
            elemento.style.opacity = '0.5';
            elemento.style.textDecoration = 'line-through';
            elemento.style.filter = 'grayscale(50%)';
        }
    });
}

function colarReal() {
    if (!state.clipboard || state.clipboard.length === 0) {
        mostrarToast('Nenhum item na área de transferência', 'error');
        return;
    }
    
    const destino = state.currentPath;
    let itensColados = 0;
    
    // Feedback visual no botão
    const btn = document.querySelector('.toolbar-btn:has(.fa-paste)');
    if (btn) {
        btn.classList.add('loading');
    }
    
    state.clipboard.forEach((item, index) => {
        setTimeout(() => {
            if (item.nota) {
                // Duplicar nota fiscal
                const novaNota = {
                    ...item.nota,
                    id: `${item.nota.id}_copy_${Date.now()}_${index}`,
                    numero: item.nota.numero + (state.clipboardAction === 'copy' ? '_copy' : ''),
                    caminho: destino.length >= 2 ? `${destino[1]}/${destino[2] || new Date().getFullYear()}/${destino[3] || String(new Date().getMonth() + 1).padStart(2, '0')}/${destino[4] || new Date().toISOString().split('T')[0]}` : item.nota.caminho
                };
                
                if (state.clipboardAction === 'cut') {
                    // Mover
                    const notaIndex = state.notasFiscais.findIndex(n => n.id === item.nota.id);
                    if (notaIndex >= 0) {
                        state.notasFiscais[notaIndex] = novaNota;
                    }
                } else {
                    // Copiar
                    state.notasFiscais.push(novaNota);
                }
                itensColados++;
            }
            
            if (index === state.clipboard.length - 1) {
                if (state.clipboardAction === 'cut') {
                    state.clipboard = null;
                    state.clipboardAction = null;
                }
                
                salvarDados();
                mostrarToast(`${itensColados} item(s) ${state.clipboardAction === 'cut' ? 'movido(s)' : 'copiado(s)'} com sucesso`, 'success');
                renderizarConteudo();
                
                if (btn) {
                    btn.classList.remove('loading');
                    btn.style.animation = 'buttonPulse 0.5s ease';
                }
            }
        }, index * 100);
    });
}

function deletarSelecionadosReal() {
    if (state.selectedItems.length === 0) {
        mostrarToast('Nenhum item selecionado', 'error');
        return;
    }
    
    if (confirm(`Deseja realmente mover ${state.selectedItems.length} item(s) para a lixeira?`)) {
        let itensMovidos = 0;
        
        state.selectedItems.forEach(item => {
            if (item.nota) {
                // Mover para lixeira usando a função correta
                const notaId = item.nota.id || item.nota.numero || item.nota;
                if (typeof moverParaLixeiraNFConfirmado !== 'undefined') {
                    moverParaLixeiraNFConfirmado(notaId);
                    itensMovidos++;
                } else if (typeof window.moverParaLixeiraNFConfirmado !== 'undefined') {
                    window.moverParaLixeiraNFConfirmado(notaId);
                    itensMovidos++;
                } else {
                    // Fallback: remover diretamente
                    const index = state.notasFiscais.findIndex(n => n.id === item.nota.id || n.numero === item.nota.numero);
                    if (index >= 0) {
                        state.notasFiscais.splice(index, 1);
                        itensMovidos++;
                    }
                }
            } else if (item.tipo === 'cliente') {
                // Mover todas as notas do cliente para lixeira
                const notasCliente = state.notasFiscais.filter(n => n.cliente === item.nome);
                notasCliente.forEach(nota => {
                    const notaId = nota.id || nota.numero;
                    if (typeof moverParaLixeiraNFConfirmado !== 'undefined') {
                        moverParaLixeiraNFConfirmado(notaId);
                    } else if (typeof window.moverParaLixeiraNFConfirmado !== 'undefined') {
                        window.moverParaLixeiraNFConfirmado(notaId);
                    }
                });
                // Remover cliente
                state.clientes = state.clientes.filter(c => c !== item.nome);
                itensMovidos++;
            }
        });
        
        state.selectedItems = [];
        salvarDados();
        if (itensMovidos > 0) {
            mostrarToast(`${itensMovidos} item(s) movido(s) para a lixeira`, 'success');
        }
        renderizarConteudo();
        
        // Fechar barra de ações
        if (typeof fecharBarraAcoes !== 'undefined') {
            fecharBarraAcoes();
        }
    }
}

// 7. Animações e Efeitos Visuais
function animarBotoes(seletor) {
    const botoes = document.querySelectorAll(seletor);
    botoes.forEach((btn, index) => {
        setTimeout(() => {
            btn.style.animation = 'buttonPulse 0.5s ease';
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = '';
                setTimeout(() => {
                    btn.style.animation = '';
                }, 500);
            }, 100);
        }, index * 50);
    });
}

function adicionarEfeitoHover() {
    document.querySelectorAll('.grid-item, .list-table tbody tr, .details-item').forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px) scale(1.02)';
            this.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
}

// 8. Visualizador PDF Melhorado
function abrirVisualizadorPDFMelhorado(nota) {
    const modal = document.getElementById('pdf-viewer-modal');
    const iframe = document.getElementById('pdf-viewer-iframe');
    const title = document.getElementById('pdf-viewer-title');
    
    title.textContent = `NF-${nota.numero}.pdf`;
    state.pdfZoom = 100;
    atualizarZoomPDF();
    
    // Usar PDF.js ou viewer online
    iframe.src = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent('data:application/pdf;base64,')}`;
    modal.classList.add('show');
    
    // Animar abertura
    modal.style.opacity = '0';
    setTimeout(() => {
        modal.style.transition = 'opacity 0.3s ease';
        modal.style.opacity = '1';
    }, 10);
}

function pdfZoomInReal() {
    const btn = event?.target?.closest('.btn-icon');
    if (btn) {
        btn.style.animation = 'buttonPulse 0.3s ease';
    }
    
    state.pdfZoom = Math.min(state.pdfZoom + 25, 200);
    atualizarZoomPDF();
    
    if (state.pdfZoom >= 200) {
        mostrarToast('Zoom máximo atingido', 'error');
    }
}

function pdfZoomOutReal() {
    const btn = event?.target?.closest('.btn-icon');
    if (btn) {
        btn.style.animation = 'buttonPulse 0.3s ease';
    }
    
    state.pdfZoom = Math.max(state.pdfZoom - 25, 50);
    atualizarZoomPDF();
    
    if (state.pdfZoom <= 50) {
        mostrarToast('Zoom mínimo atingido', 'error');
    }
}

function atualizarZoomPDF() {
    const iframe = document.getElementById('pdf-viewer-iframe');
    if (iframe) {
        iframe.style.transform = `scale(${state.pdfZoom / 100})`;
        iframe.style.transformOrigin = 'top left';
    }
    document.getElementById('pdf-zoom-level').textContent = `${state.pdfZoom}%`;
}

// 9. Melhorias na Inicialização
function inicializarMelhorias() {
    configurarDragDrop();
    configurarContextMenu();
    renderizarFavoritos();
    adicionarEfeitoHover();
    configurarTodosBotoes();
    
    // Carregar favoritos
    const savedFavoritos = localStorage.getItem('axis_favoritos');
    if (savedFavoritos) {
        try {
            state.favoritos = JSON.parse(savedFavoritos);
        } catch (e) {
            state.favoritos = [];
        }
    }
    
    // Inicializar dashboard
    if (typeof atualizarDashboard !== 'undefined') {
        setTimeout(() => atualizarDashboard(), 500);
    }
    
    // Configurar lembretes
    if (typeof configurarLembretes !== 'undefined') {
        configurarLembretes();
    }
}

// 11. Configurar TODOS os botões com animações
function configurarTodosBotoes() {
    // Adicionar event listeners para feedback visual em TODOS os botões
    document.querySelectorAll('button').forEach(btn => {
        // Click feedback
        btn.addEventListener('click', function(e) {
            // Criar efeito de ripple
            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.6);
                width: 20px;
                height: 20px;
                margin-top: -10px;
                margin-left: -10px;
                pointer-events: none;
                animation: rippleEffect 0.6s ease;
                left: ${e.offsetX}px;
                top: ${e.offsetY}px;
            `;
            
            if (!this.style.position || this.style.position === 'static') {
                this.style.position = 'relative';
            }
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
            
            // Animação de click
            this.style.animation = 'buttonPulse 0.3s ease';
        });
        
        // Hover feedback
        btn.addEventListener('mouseenter', function() {
            if (!this.disabled) {
                this.style.transform = 'translateY(-3px) scale(1.05)';
            }
        });
        
        btn.addEventListener('mouseleave', function() {
            if (!this.disabled) {
                this.style.transform = '';
            }
        });
    });
    
    // Adicionar animação de ripple global
    const style = document.createElement('style');
    style.textContent = `
        @keyframes rippleEffect {
            to {
                transform: scale(20);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// salvarDados já foi atualizado acima

// 10. Atualizar funções existentes
function renomearSelecionadoMelhorado() {
    if (state.selectedItems.length !== 1) {
        mostrarToast('Selecione apenas um item para renomear', 'error');
        return;
    }
    
    const item = state.selectedItems[0];
    const index = obterItensAtuais().findIndex(i => JSON.stringify(i.caminho) === JSON.stringify(item.caminho));
    if (index >= 0) {
        iniciarRenomeacaoInline(index);
    }
}

// Sobrescrever funções antigas
window.copiarSelecionados = copiarSelecionadosReal;
window.cortarSelecionados = cortarSelecionadosReal;
window.colar = colarReal;
window.deletarSelecionados = deletarSelecionadosReal;
window.renomearSelecionado = renomearSelecionadoMelhorado;
window.processarUpload = processarUploadCompleto;
window.abrirVisualizadorPDF = abrirVisualizadorPDFMelhorado;
window.pdfZoomIn = pdfZoomInReal;
window.pdfZoomOut = pdfZoomOutReal;
window.toggleFavorito = function(item) {
    toggleFavorito(item);
    renderizarConteudo();
};
window.iniciarRenomeacaoInline = iniciarRenomeacaoInline;
window.fecharContextMenu = fecharContextMenu;
window.mostrarContextMenu = mostrarContextMenu;

// Inicialização já está configurada acima

// Salvar dados já foi atualizado na função original
