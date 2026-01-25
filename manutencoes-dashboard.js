// ============================================
// DASHBOARD DE MANUTENÇÕES PREVENTIVAS
// ============================================

// Dados de exemplo (temporários)
const manutencoesExemplo = {
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
        '01': [
            { id: 4, data: '2025-01-05', serial: '18J194501111', modelo: 'ZT411', tecnico: 'Filipe da Silva', setor: 'Packing Mono', arquivo: 'AXIS_PV_18J194501111_2025_Janeiro_05-01-2025.pdf' }
        ],
        '03': [
            { id: 5, data: '2025-03-12', serial: '30Q194506666', modelo: 'ZQ630', tecnico: 'Maria Santos', setor: 'Pagamento', arquivo: 'AXIS_PV_30Q194506666_2025_Março_12-03-2025.pdf' }
        ]
    },
    '2026': {
        '01': [
            { id: 6, data: '2026-01-08', serial: '18J194501111', modelo: 'ZT411', tecnico: 'Filipe da Silva', setor: 'Packing Mono', arquivo: 'AXIS_PV_18J194501111_2026_Janeiro_08-01-2026.pdf' },
            { id: 7, data: '2026-01-15', serial: '21D194504444', modelo: 'ZD421', tecnico: 'João Oliveira', setor: 'Check-in', arquivo: 'AXIS_PV_21D194504444_2026_Janeiro_15-01-2026.pdf' }
        ],
        '02': [
            { id: 8, data: '2026-02-10', serial: '18J194502222', modelo: 'ZT411', tecnico: 'Carlos Mendes', setor: 'Packing PTW', arquivo: 'AXIS_PV_18J194502222_2026_Fevereiro_10-02-2026.pdf' }
        ]
    }
};

let anoSelecionado = null;
let mesSelecionado = null;
let isListView = false;

// Função para alternar entre grid e lista
function toggleViewMode() {
    isListView = !isListView;
    const icon = document.getElementById('view-mode-icon');
    
    if (icon) {
        if (isListView) {
            icon.textContent = '📋';
        } else {
            icon.textContent = '📊';
        }
    }
    
    // Se houver mês selecionado, recarregar visualização
    if (mesSelecionado && anoSelecionado) {
        const manutencoes = manutencoesExemplo[anoSelecionado]?.[mesSelecionado.numero] || [];
        if (isListView) {
            renderizarListaManutencoes(manutencoes);
        } else {
            renderizarGridManutencoes(manutencoes);
        }
    }
}

// Função para mostrar preview (tipo WhatsApp)
let previewTimeout;
function mostrarPreview(arquivo, event) {
    clearTimeout(previewTimeout);
    previewTimeout = setTimeout(() => {
        const modal = document.getElementById('preview-modal');
        const body = document.getElementById('preview-body');
        
        // Criar iframe para visualizar PDF
        body.innerHTML = `<iframe src="${arquivo}" style="width: 100%; height: 600px; border: none; border-radius: 12px;"></iframe>`;
        
        modal.classList.add('show');
    }, 500); // Delay de 500ms (como WhatsApp)
}

function esconderPreview() {
    clearTimeout(previewTimeout);
    const modal = document.getElementById('preview-modal');
    modal.classList.remove('show');
}

// Função para adicionar nova manutenção
function adicionarManutencao() {
    window.location.href = 'manutenção_preventiva.html';
}

const mesesNomes = {
    '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
    '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
    '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
};

// Ordem cronológica dos meses
const mesesOrdem = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

// Setores disponíveis
const setores = [
    'Packing Mono', 'Packing PTW', 'RK', 'Returns', 'Inventário', 
    'Insumos', 'Check-in', 'GATE', 'Ambulatório Externo', 
    'Ambulatório Interno', 'Liderança', 'MZ0', 'MZ1', 'MZ2', 'MZ3', 'HV'
];

// Emojis para setores
const setoresEmojis = {
    'Packing Mono': '📦',
    'Packing PTW': '📋',
    'RK': '🔧',
    'Returns': '↩️',
    'Inventário': '📊',
    'Insumos': '📦',
    'Check-in': '✅',
    'GATE': '🚪',
    'Ambulatório Externo': '🏥',
    'Ambulatório Interno': '🏥',
    'Liderança': '👔',
    'MZ0': '📍',
    'MZ1': '📍',
    'MZ2': '📍',
    'MZ3': '📍',
    'HV': '🚚'
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    inicializarDashboard();
});

function inicializarDashboard() {
    carregarAnosMenu();
}

function carregarAnosMenu() {
    const container = document.getElementById('anos-menu');
    if (!container) return;
    
    // Obter todos os anos disponíveis
    const anos = Object.keys(manutencoesExemplo).sort((a, b) => b - a);
    
    let html = '';
    anos.forEach(ano => {
        const totalManutencoes = Object.values(manutencoesExemplo[ano])
            .reduce((acc, mes) => acc + mes.length, 0);
        
        html += `
            <button class="apple-menu-item" onclick="selecionarAno('${ano}')">
                <i class="fas fa-calendar-alt"></i>
                <div class="apple-menu-text" style="flex: 1;">
                    <div class="apple-menu-title">${ano}</div>
                    <div class="apple-menu-subtitle">${totalManutencoes} manutenção${totalManutencoes !== 1 ? 'ões' : ''}</div>
                </div>
                <div class="apple-menu-arrow">
                    <i class="fas fa-chevron-right"></i>
                </div>
            </button>
        `;
    });
    
    container.innerHTML = html;
}

function selecionarAno(ano) {
    anoSelecionado = ano;
    mesSelecionado = null;
    
    // Atualizar menu
    document.querySelectorAll('.apple-menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Encontrar e ativar o botão correto
    const botoes = document.querySelectorAll('.apple-menu-item');
    botoes.forEach(btn => {
        if (btn.textContent.includes(ano)) {
            btn.classList.add('active');
        }
    });
    
    // Mostrar toolbar
    document.getElementById('meses-toolbar').style.display = 'flex';
    document.getElementById('ano-selecionado').textContent = ano;
    
    // Mostrar grid de meses
    document.getElementById('meses-grid').style.display = 'grid';
    document.getElementById('manutencoes-grid').style.display = 'none';
    document.getElementById('manutencoes-list').style.display = 'none';
    
    // Carregar meses
    carregarMesesAno(ano);
    
    // Atualizar path
    document.getElementById('current-path').textContent = ano;
}

function carregarMesesAno(ano) {
    const container = document.getElementById('meses-grid');
    if (!container) return;
    
    const mesesDoAno = manutencoesExemplo[ano] || {};
    let html = '';
    
    // Ordem cronológica: Janeiro a Dezembro
    mesesOrdem.forEach((mesNum, index) => {
        const mesNome = mesesNomes[mesNum];
        const manutencoes = mesesDoAno[mesNum] || [];
        const count = manutencoes.length;
        
        // Emojis para cada mês
        const mesEmojis = ['❄️', '💝', '🌸', '🌷', '🌻', '☀️', '🔥', '🌾', '🍂', '🎃', '🍁', '🎄'];
        
        html += `
            <div class="apple-mes-card" onclick="selecionarMes('${mesNome}', '${mesNum}', '${ano}')" style="--delay: ${index};">
                <div class="apple-mes-icon">${mesEmojis[index]}</div>
                <div class="apple-mes-content">
                    <div class="apple-mes-title">${mesNome} ${ano}</div>
                    <div class="apple-mes-count">${count} manutenção${count !== 1 ? 'ões' : ''}</div>
                </div>
                <div class="apple-mes-arrow">
                    <i class="fas fa-chevron-right"></i>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function selecionarMes(mesNome, mesNumero, ano) {
    mesSelecionado = { nome: mesNome, numero: mesNumero };
    
    // Esconder grid de meses
    document.getElementById('meses-grid').style.display = 'none';
    
    // Atualizar toolbar para mostrar o mês selecionado
    document.getElementById('meses-toolbar').style.display = 'flex';
    document.getElementById('ano-selecionado').textContent = `${mesNome} ${ano}`;
    
    // Mostrar grid de manutenções
    if (isListView) {
        document.getElementById('manutencoes-list').style.display = 'block';
        document.getElementById('manutencoes-grid').style.display = 'none';
    } else {
        document.getElementById('manutencoes-grid').style.display = 'grid';
        document.getElementById('manutencoes-list').style.display = 'none';
    }
    
    // Atualizar path
    document.getElementById('current-path').textContent = `${ano} > ${mesNome}`;
    
    // Carregar manutenções do mês
    carregarManutencoesMes(ano, mesNumero);
}

function carregarManutencoesMes(ano, mesNumero) {
    const manutencoes = manutencoesExemplo[ano]?.[mesNumero] || [];
    
    if (isListView) {
        renderizarListaManutencoes(manutencoes);
    } else {
        renderizarGridManutencoes(manutencoes);
    }
}

function renderizarGridManutencoes(manutencoes) {
    const container = document.getElementById('manutencoes-grid');
    if (!container) return;
    
    if (manutencoes.length === 0) {
        container.innerHTML = `
            <div class="apple-empty-state" style="grid-column: 1 / -1;">
                <div class="apple-empty-icon">
                    <i class="fas fa-clipboard-list"></i>
                </div>
                <h3 class="apple-empty-title">Nenhuma manutenção encontrada</h3>
                <p class="apple-empty-text">Não há manutenções preventivas para este período.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    manutencoes.forEach((manut, index) => {
        const dataFormatada = formatarData(manut.data);
        
        html += `
            <div class="apple-manutencao-card" onclick="abrirManutencao('${manut.arquivo}')" style="--delay: ${index};">
                <div class="apple-manutencao-header">
                    <div class="apple-manutencao-title">${manut.modelo} - ${manut.serial}</div>
                    <div class="apple-manutencao-date">${dataFormatada}</div>
                </div>
                <div class="apple-manutencao-body">
                    <div class="apple-manutencao-info">
                        <i class="fas fa-user"></i>
                        <span>${manut.tecnico}</span>
                    </div>
                    <div class="apple-manutencao-info">
                        <i class="fas fa-building"></i>
                        <span>${manut.setor}</span>
                    </div>
                </div>
                <div class="apple-manutencao-footer">
                    <button class="apple-btn-action" 
                            onmousedown="event.stopPropagation(); mostrarPreview('${manut.arquivo}', event)" 
                            onmouseup="event.stopPropagation(); esconderPreview()"
                            onmouseleave="esconderPreview()"
                            onclick="event.stopPropagation(); abrirManutencao('${manut.arquivo}')"
                            style="--delay: ${index * 2};">
                        👁️ Ver
                    </button>
                    <button class="apple-btn-action" onclick="event.stopPropagation(); baixarManutencao('${manut.arquivo}')" style="--delay: ${index * 2 + 1};">
                        ⬇️ Baixar
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderizarListaManutencoes(manutencoes) {
    const container = document.getElementById('manutencoes-table-body');
    if (!container) return;
    
    let html = '';
    manutencoes.forEach(manut => {
        const dataFormatada = formatarData(manut.data);
        
        html += `
            <tr onclick="abrirManutencao('${manut.arquivo}')" style="cursor: pointer;">
                <td>${dataFormatada}</td>
                <td><strong>${manut.serial}</strong></td>
                <td>${manut.modelo}</td>
                <td>${manut.tecnico}</td>
                <td>${manut.setor}</td>
                <td>
                    <button class="apple-btn-action" 
                            onmousedown="event.stopPropagation(); mostrarPreview('${manut.arquivo}', event)" 
                            onmouseup="event.stopPropagation(); esconderPreview()"
                            onmouseleave="esconderPreview()"
                            onclick="event.stopPropagation(); abrirManutencao('${manut.arquivo}')">
                        👁️
                    </button>
                    <button class="apple-btn-action" onclick="event.stopPropagation(); baixarManutencao('${manut.arquivo}')">
                        ⬇️
                    </button>
                </td>
            </tr>
        `;
    });
    
    container.innerHTML = html;
}

function voltarParaAnos() {
    // Voltar apenas para a visualização de meses (não para o início)
    mesSelecionado = null;
    
    // Esconder toolbar de meses
    document.getElementById('meses-toolbar').style.display = 'none';
    
    // Mostrar grid de meses novamente
    document.getElementById('meses-grid').style.display = 'grid';
    document.getElementById('setores-grid').style.display = 'none';
    document.getElementById('manutencoes-grid').style.display = 'none';
    document.getElementById('manutencoes-list').style.display = 'none';
    
    // Atualizar path para mostrar apenas o ano
    if (anoSelecionado) {
        document.getElementById('current-path').textContent = anoSelecionado;
    }
}

function voltarParaMeses() {
    // Voltar para a visualização de setores do mês selecionado
    if (anoSelecionado && mesSelecionado) {
        document.getElementById('meses-grid').style.display = 'none';
        document.getElementById('setores-grid').style.display = 'grid';
        document.getElementById('manutencoes-grid').style.display = 'none';
        document.getElementById('manutencoes-list').style.display = 'none';
        
        const mesNome = mesSelecionado.nome;
        document.getElementById('ano-selecionado').textContent = `${mesNome} ${anoSelecionado}`;
        document.getElementById('current-path').textContent = `${anoSelecionado} > ${mesNome}`;
        document.getElementById('btn-voltar-anos').style.display = 'inline-flex';
        document.getElementById('btn-voltar-meses').style.display = 'none';
        
        // Recarregar setores
        carregarSetoresMes(anoSelecionado, mesSelecionado.numero);
    }
}

function abrirManutencao(arquivo) {
    // Abrir PDF em nova aba
    window.open(arquivo, '_blank');
}

function baixarManutencao(arquivo) {
    // Criar link de download
    const link = document.createElement('a');
    link.href = arquivo;
    link.download = arquivo;
    link.click();
}

function atualizarDashboard() {
    // Recarregar dados
    inicializarDashboard();
    if (anoSelecionado) {
        carregarMesesAno(anoSelecionado);
        if (mesSelecionado) {
            carregarManutencoesMes(anoSelecionado, mesSelecionado.numero);
        }
    }
}

function formatarData(data) {
    const date = new Date(data + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Menu Hambúrguer
function toggleHamburgerMenu() {
    const menu = document.getElementById('hamburger-menu');
    const btn = document.getElementById('hamburger-btn');
    
    menu.classList.toggle('show');
    btn.classList.toggle('active');
}

// Fechar menu ao clicar fora
document.addEventListener('click', function(e) {
    const menu = document.getElementById('hamburger-menu');
    const btn = document.getElementById('hamburger-btn');
    
    if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
        menu.classList.remove('show');
        btn.classList.remove('active');
    }
});

// Tornar funções globais
window.selecionarAno = selecionarAno;
window.selecionarMes = selecionarMes;
window.selecionarSetor = selecionarSetor;
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
