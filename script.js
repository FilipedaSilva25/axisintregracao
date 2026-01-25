/* ============================================
   SISTEMA PRINCIPAL - VARIÁVEIS GLOBAIS
   ============================================ */
let currentUser = null;
let currentUserProfile = 'operador'; // Perfil do usuário logado
let activePage = 'page-home'; // Para controle de navegação

// ================= INVENTÁRIO AVANÇADO =================
let inventarioData = [];
let currentPage = 1;
let itemsPerPage = 15;
let sortColumn = 'serial';
let sortDirection = 'asc';
let modeloAtual = 'todos';
let cadastroStep = 1;

// ================= DADOS DE EXEMPLO COMPLETOS =================
const equipamentosExemplo = [
    // ZT411 - Impressora Industrial
    {
        serial: "18J194501111",
        tag: "ZT411-IND-001",
        modelo: "ZT411",
        ip: "10.15.20.101",
        macRede: "00:1B:44:11:3A:B7",
        macBluetooth: "00:1B:44:11:3A:B8",
        selb: "SELB-2024-001",
        patrimonio: "123456789",
        setor: "packing-mono",
        localizacao: "Setor A, Posição 1, Corredor Principal",
        status: "online",
        ultimaChecagem: "2024-01-15 14:30",
        dataCadastro: "2024-01-10T08:00:00Z",
        observacoes: "Impressora nova, calibração realizada em 10/01/2024",
        fabricante: "Zebra Technologies",
        firmware: "V72.20.15Z",
        contador: 12543,
        toner: 85,
        ribbon: 60,
        responsavel: "Filipe da Silva",
        garantia: "2025-01-10"
    },
    {
        serial: "18J194502222",
        tag: "ZT411-IND-002",
        modelo: "ZT411",
        ip: "10.15.20.102",
        macRede: "00:1B:44:11:3A:B9",
        macBluetooth: "00:1B:44:11:3A:BA",
        selb: "SELB-2024-002",
        patrimonio: "123456790",
        setor: "packing-ptw",
        localizacao: "Setor B, Posição 2, Área de Expedição",
        status: "online",
        ultimaChecagem: "2024-01-15 14:28",
        dataCadastro: "2024-01-10T09:30:00Z",
        observacoes: "Instalada com rede cabeada, estabilidade excelente",
        fabricante: "Zebra Technologies",
        firmware: "V72.20.15Z",
        contador: 8921,
        toner: 90,
        ribbon: 75,
        responsavel: "João Oliveira",
        garantia: "2025-01-10"
    },
    {
        serial: "18J194503333",
        tag: "ZT411-IND-003",
        modelo: "ZT411",
        ip: "10.15.20.103",
        macRede: "00:1B:44:11:3A:BB",
        macBluetooth: "00:1B:44:11:3A:BC",
        selb: "SELB-2024-003",
        patrimonio: "123456791",
        setor: "rk",
        localizacao: "Setor C, Posição 3, Recebimento",
        status: "offline",
        ultimaChecagem: "2024-01-14 09:15",
        dataCadastro: "2024-01-11T10:15:00Z",
        observacoes: "Apresentando falhas intermitentes na conexão",
        fabricante: "Zebra Technologies",
        firmware: "V72.19.14Z",
        contador: 21567,
        toner: 45,
        ribbon: 30,
        responsavel: "Carlos Mendes",
        garantia: "2025-01-11"
    },
    // ZD421 - Impressora Desktop
    {
        serial: "21D194504444",
        tag: "ZD421-DSK-001",
        modelo: "ZD421",
        ip: "10.15.21.101",
        macRede: "00:1B:44:11:3A:BD",
        macBluetooth: "00:1B:44:11:3A:BE",
        selb: "SELB-2024-004",
        patrimonio: "123456792",
        setor: "check-in",
        localizacao: "Setor D, Posição 4, Balcão Atendimento",
        status: "online",
        ultimaChecagem: "2024-01-15 14:20",
        dataCadastro: "2024-01-12T14:00:00Z",
        observacoes: "Configurada para etiquetas 4x6, funcionamento perfeito",
        fabricante: "Zebra Technologies",
        firmware: "V65.21.10Z",
        contador: 5432,
        toner: 95,
        ribbon: null,
        responsavel: "Ana Paula",
        garantia: "2025-01-12"
    },
    {
        serial: "21D194505555",
        tag: "ZD421-DSK-002",
        modelo: "ZD421",
        ip: "10.15.21.102",
        macRede: "00:1B:44:11:3A:BF",
        macBluetooth: "00:1B:44:11:3A:C0",
        selb: "SELB-2024-005",
        patrimonio: "123456793",
        setor: "retiros",
        localizacao: "Setor E, Posição 5, Área Administrativa",
        status: "online",
        ultimaChecagem: "2024-01-15 14:22",
        dataCadastro: "2024-01-12T15:30:00Z",
        observacoes: "Uso intensivo, requer limpeza semanal",
        fabricante: "Zebra Technologies",
        firmware: "V65.21.10Z",
        contador: 12876,
        toner: 70,
        ribbon: null,
        responsavel: "Mariana Costa",
        garantia: "2025-01-12"
    },
    // ZQ630 - Impressora Pagewide
    {
        serial: "30Q194506666",
        tag: "ZQ630-PAG-001",
        modelo: "ZQ630",
        ip: "10.15.22.101",
        macRede: "00:1B:44:11:3A:C1",
        macBluetooth: "00:1B:44:11:3A:C2",
        selb: "SELB-2024-006",
        patrimonio: "123456794",
        setor: "returns",
        localizacao: "Setor F, Posição 1, Devoluções",
        status: "online",
        ultimaChecagem: "2024-01-15 14:10",
        dataCadastro: "2024-01-13T08:45:00Z",
        observacoes: "Impressora de alta velocidade, ótimo desempenho",
        fabricante: "Zebra Technologies",
        firmware: "V82.15.20Z",
        contador: 8765,
        toner: 80,
        ink: 75,
        responsavel: "Roberto Alves",
        garantia: "2025-01-13"
    },
    {
        serial: "30Q194507777",
        tag: "ZQ630-PAG-002",
        modelo: "ZQ630",
        ip: "10.15.22.102",
        macRede: "00:1B:44:11:3A:C3",
        macBluetooth: "00:1B:44:11:3A:C4",
        selb: "SELB-2024-007",
        patrimonio: "123456795",
        setor: "insumos",
        localizacao: "Setor G, Posição 2, Almoxarifado",
        status: "manutencao",
        ultimaChecagem: "2024-01-12 10:20",
        dataCadastro: "2024-01-13T10:20:00Z",
        observacoes: "Problema no cabeçote de impressão, aguardando peça",
        fabricante: "Zebra Technologies",
        firmware: "V82.15.20Z",
        contador: 15432,
        toner: 50,
        ink: 40,
        responsavel: "Pedro Santos",
        garantia: "2025-01-13"
    }
];

// ================= GERAR MAIS EQUIPAMENTOS =================
for (let i = 8; i <= 50; i++) {
    const modelos = ['ZT411', 'ZD421', 'ZQ630'];
    const setores = [
        'packing-mono', 'packing-ptw', 'rk', 'rk-in', 'check-in', 'retiros', 'returns',
        'insumos', 'docas-expedicao', 'reciving', 'mhw', 'mz1', 'mz2', 'mz3',
        'qualidade', 'rr', 'aquario-adm', 'administracao', 'lideranca', 'ambulatorio-externo',
        'hv', 'gate', 'linha-peixe-1', 'linha-peixe-2', 'sorter', 'deposito-systems'
    ];
    const statuses = ['online', 'online', 'online', 'offline', 'manutencao'];
    const responsaveis = ['Filipe da Silva', 'João Oliveira', 'Carlos Mendes', 'Ana Paula', 'Mariana Costa', 'Roberto Alves', 'Pedro Santos'];
    
    const modelo = modelos[Math.floor(Math.random() * modelos.length)];
    const setor = setores[Math.floor(Math.random() * setores.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const responsavel = responsaveis[Math.floor(Math.random() * responsaveis.length)];
    
    let prefixo = 'IND';
    if (modelo === 'ZD421') prefixo = 'DSK';
    if (modelo === 'ZQ630') prefixo = 'PAG';
    
    const serialBase = modelo === 'ZT411' ? '18J' : modelo === 'ZD421' ? '21D' : '30Q';
    const serialNum = 194500000 + i;
    
    const letraSetor = String.fromCharCode(65 + (i % 26));
    const numeroPosicao = (i % 10) + 1;
    
    const equipamento = {
        serial: `${serialBase}${serialNum}`,
        tag: `${modelo}-${prefixo}-${i.toString().padStart(3, '0')}`,
        modelo: modelo,
        ip: `10.15.${modelo === 'ZT411' ? '20' : modelo === 'ZD421' ? '21' : '22'}.${100 + i}`,
        macRede: `00:1B:44:11:3A:${(0xC0 + i).toString(16).toUpperCase().padStart(2, '0')}`,
        macBluetooth: `00:1B:44:11:3B:${(0xC0 + i).toString(16).toUpperCase().padStart(2, '0')}`,
        selb: `SELB-2024-${i.toString().padStart(3, '0')}`,
        patrimonio: (123456796 + i).toString(),
        setor: setor,
        localizacao: `Setor ${letraSetor}, Posição ${numeroPosicao}, ${['Corredor Principal', 'Área de Expedição', 'Recebimento', 'Balcão Atendimento', 'Área Administrativa', 'Devoluções', 'Almoxarifado'][i % 7]}`,
        status: status,
        ultimaChecagem: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 16),
        dataCadastro: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        observacoes: ['Funcionamento normal', 'Requer calibração', 'Nova instalação', 'Manutenção preventiva agendada', 'Alta performance'][i % 5],
        fabricante: 'Zebra Technologies',
        firmware: modelo === 'ZT411' ? 'V72.20.15Z' : modelo === 'ZD421' ? 'V65.21.10Z' : 'V82.15.20Z',
        contador: Math.floor(Math.random() * 30000) + 1000,
        toner: Math.floor(Math.random() * 100),
        ribbon: modelo === 'ZQ630' ? null : Math.floor(Math.random() * 100),
        ink: modelo === 'ZQ630' ? Math.floor(Math.random() * 100) : null,
        responsavel: responsavel,
        garantia: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    
    equipamentosExemplo.push(equipamento);
}

// ================= NOTIFICAÇÕES INICIAIS =================
let notifications = [
    { 
        id: 1, 
        type: 'warning', 
        title: 'ZT411-IND-003 está offline', 
        message: 'Equipamento não responde há mais de 24 horas',
        time: '2 minutos atrás', 
        read: false,
        equipment: 'ZT411-IND-003'
    },
    { 
        id: 2, 
        type: 'info', 
        title: 'Nova manutenção agendada', 
        message: 'Preventiva para ZD421-DSK-002 agendada para amanhã',
        time: '1 hora atrás', 
        read: false,
        equipment: 'ZD421-DSK-002'
    },
    { 
        id: 3, 
        type: 'success', 
        title: 'ZQ630-PAG-001 voltou ao online', 
        message: 'Conexão restabelecida após manutenção',
        time: '3 horas atrás', 
        read: true,
        equipment: 'ZQ630-PAG-001'
    },
    { 
        id: 4, 
        type: 'info', 
        title: 'Atualização de inventário', 
        message: '3 novos equipamentos cadastrados no sistema',
        time: '5 horas atrás', 
        read: true 
    }
];

// ================= CLASSES CSS DINÂMICAS =================
const CSSClasses = {
    loading: 'loading',
    active: 'active',
    show: 'show',
    hide: 'hide',
    open: 'open',
    error: 'error',
    success: 'success',
    warning: 'warning',
    info: 'info'
};

/* ============================================
   FUNÇÕES DE INICIALIZAÇÃO E CONTROLE GERAL
   ============================================ */

// ================= 1. INICIALIZAÇÃO DO SISTEMA =================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 AXIS - Sistema iniciando...');
    
    // Inicializa preferências de redução de movimento
    initReducedMotion();
    
    // Garante que o sistema comece na tela de login
    const authScreen = document.getElementById('auth-screen');
    const mainContent = document.getElementById('main-content');
    
    if (authScreen) authScreen.style.display = 'flex';
    if (mainContent) mainContent.style.display = 'none';
    
    // Inicializa tema salvo
    initTheme();
    
    // Atualiza badge de notificações
    updateNotificationBadge();
    
    // Adiciona FAB button
    initFAB();
    
    // Adiciona painel de notificações
    initNotificationsPanel();
    
    // Configura listeners de teclado
    initKeyboardShortcuts();
    
    // Inicia simulação de tempo real
    startRealTimeSimulation();
    
    // Inicializa tooltips
    initTooltips();
    
    // Configura eventos de formulário
    initFormEvents();
    
    console.log('✅ AXIS - Sistema inicializado com sucesso!');
});

// ================= PREFERÊNCIAS DE REDUÇÃO DE MOVIMENTO =================
function initReducedMotion() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (mediaQuery.matches) {
        document.body.classList.add('reduce-motion');
    }
    
    mediaQuery.addEventListener('change', (e) => {
        if (e.matches) {
            document.body.classList.add('reduce-motion');
        } else {
            document.body.classList.remove('reduce-motion');
        }
    });
}

// ================= 2. CONTROLE DO MENU LATERAL =================
function toggleSidebar() {
    const sidebar = document.getElementById('side-menu');
    const overlay = document.getElementById('menu-overlay');
    const menuBtn = document.querySelector('.menu-btn');
    
    if (!sidebar || !overlay) return;
    
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
    if (menuBtn) menuBtn.classList.toggle('active');
    
    // Anima overlay com opacidade
    if (sidebar.classList.contains('open')) {
        overlay.style.display = 'block';
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
        showToast('Menu aberto', 'info');
    } else {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
    }
}

// Fecha o menu automaticamente ao clicar em opções
document.addEventListener('click', (e) => {
    if (e.target.closest('.side-item') && !e.target.closest('.side-item').classList.contains('logout')) {
        const sidebar = document.getElementById('side-menu');
        if (sidebar && sidebar.classList.contains('open')) {
            toggleSidebar();
        }
    }
});

// Fecha menu ao clicar no overlay
document.getElementById('menu-overlay')?.addEventListener('click', toggleSidebar);

// ================= 3. NAVEGAÇÃO ENTRE PÁGINAS =================
function navigate(pageId) {
    console.log(`📍 Navegando para: ${pageId}`);
    
    // Atualiza página ativa
    activePage = pageId;
    
    // 1. Oculta todas as seções
    const sections = document.querySelectorAll('.main-section');
    sections.forEach(s => {
        s.classList.remove(CSSClasses.active);
    });

    // 2. Ativa a página alvo
    const target = document.getElementById(pageId);
    if (target) {
        target.classList.add(CSSClasses.active);
    }

    // 3. Atualiza o estado visual dos botões no menu
    const menuItems = document.querySelectorAll('.side-item');
    menuItems.forEach(item => {
        item.classList.remove(CSSClasses.active);
        const onclickAttr = item.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(pageId)) {
            item.classList.add(CSSClasses.active);
        }
    });

    // 4. Fecha o menu após navegar
    const sidebar = document.getElementById('side-menu');
    if (sidebar && sidebar.classList.contains('open')) {
        toggleSidebar();
    }

    // 5. Ações específicas por página
    switch(pageId) {
        case 'page-inventario':
            inicializarInventario();
            showToast('Inventário de impressoras carregado', 'info');
            break;
        case 'page-home':
            loadDashboardData();
            showToast('Página inicial carregada', 'info');
            break;
        case 'page-rondas':
            showToast('Módulo de rondas em desenvolvimento', 'warning');
            break;
        case 'page-suporte':
            showToast('Módulo de suporte em desenvolvimento', 'warning');
            break;
        case 'page-configuracoes':
            loadSettings();
            showToast('Configurações carregadas', 'info');
            break;
        case 'page-administracao':
            if (currentUserProfile !== 'admin') {
                showToast('Acesso negado. Apenas administradores podem acessar esta página.', 'error');
                navigate('page-home');
                return;
            }
            atualizarEstatisticasAdmin();
            showToast('Página de administração carregada', 'info');
            break;
    }

    // Scroll suave para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================= DASHBOARD DATA =================
function loadDashboardData() {
    // Simulação de carregamento de dados do dashboard
    setTimeout(() => {
        // Atualiza cards com animação
        document.querySelectorAll('.stat-card').forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('pop-in');
            }, index * 100);
        });
        
        // Atualiza dados do dashboard
        updateDashboardStats();
    }, 300);
}

function updateDashboardStats() {
    const totalEquipamentos = equipamentosExemplo.length;
    const online = equipamentosExemplo.filter(e => e.status === 'online').length;
    const offline = equipamentosExemplo.filter(e => e.status === 'offline').length;
    const manutencao = equipamentosExemplo.filter(e => e.status === 'manutencao').length;
    
    // Atualiza elementos se existirem
    const elements = {
        'dashboard-total': totalEquipamentos,
        'dashboard-online': online,
        'dashboard-offline': offline,
        'dashboard-manutencao': manutencao
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

// ================= SETTINGS =================
function loadSettings() {
    // Carrega configurações salvas
    const savedTheme = localStorage.getItem('axis-theme') || 'light';
    const highContrast = localStorage.getItem('axis-high-contrast') === 'true';
    const savedItemsPerPage = localStorage.getItem('axis-items-per-page') || '15';
    
    // Atualiza controles
    const themeToggle = document.getElementById('theme-toggle-switch');
    const highContrastToggle = document.getElementById('high-contrast-toggle');
    const itemsPerPageSelect = document.getElementById('items-per-page');
    
    if (themeToggle) themeToggle.checked = savedTheme === 'dark';
    if (highContrastToggle) highContrastToggle.checked = highContrast;
    if (itemsPerPageSelect) itemsPerPageSelect.value = savedItemsPerPage;
    
    itemsPerPage = parseInt(savedItemsPerPage);
}

function updateItemsPerPage() {
    const select = document.getElementById('items-per-page');
    if (!select) return;
    
    itemsPerPage = parseInt(select.value);
    localStorage.setItem('axis-items-per-page', itemsPerPage);
    
    if (document.getElementById('page-inventario').classList.contains('active')) {
        currentPage = 1;
        renderizarTabela();
    }
    
    showToast(`Mostrando ${itemsPerPage} itens por página`, 'info');
}

function clearLocalCache() {
    if (confirm('Tem certeza que deseja limpar o cache local? Isso não afetará os dados do inventário.')) {
        const keysToKeep = ['db_', 'axis-theme', 'axis-high-contrast', 'axis-items-per-page'];
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            let shouldKeep = false;
            
            for (const keepKey of keysToKeep) {
                if (key.startsWith(keepKey)) {
                    shouldKeep = true;
                    break;
                }
            }
            
            if (!shouldKeep) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        showToast('Cache local limpo com sucesso!', 'success');
    }
}

function exportSettings() {
    const settings = {
        theme: localStorage.getItem('axis-theme') || 'light',
        highContrast: localStorage.getItem('axis-high-contrast') === 'true',
        itemsPerPage: localStorage.getItem('axis-items-per-page') || '15',
        exportDate: new Date().toISOString(),
        system: 'AXIS Inventory System',
        version: '1.0.0'
    };
    
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `axis-settings-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast('Configurações exportadas com sucesso!', 'success');
}

// ================= 4. SISTEMA DE AUTENTICAÇÃO =================
// Cria usuário administrador padrão se não existir
function inicializarUsuarioAdmin() {
    const adminKey = 'db_ADMIN';
    if (!localStorage.getItem(adminKey)) {
        const adminData = {
            name: 'ADMINISTRADOR',
            pass: 'admin123',
            dataCadastro: new Date().toISOString(),
            perfil: 'admin',
            ultimoAcesso: new Date().toISOString()
        };
        localStorage.setItem(adminKey, JSON.stringify(adminData));
        console.log('✅ Usuário administrador criado: ADMIN / admin123');
    }
}

// Inicializa admin ao carregar
inicializarUsuarioAdmin();

function handleAuth() {
    console.log('🔐 Processando autenticação...');
    
    const userField = document.getElementById('username');
    const passField = document.getElementById('password');
    const userInput = userField.value.trim().toUpperCase();
    const pass = passField.value;

    if (!userInput || !pass) {
        showToast('Preencha todos os campos!', 'warning');
        return;
    }

    const dbRaw = localStorage.getItem('db_' + userInput);
    if (dbRaw) {
        const db = JSON.parse(dbRaw);
        if (db.pass === pass) {
            // SUCESSO NO LOGIN
            currentUser = db.name || userInput;
            currentUserProfile = db.perfil || 'operador';
            
            // Atualiza saudação
            const userDisplay = document.getElementById('user-display-name');
            if (userDisplay) userDisplay.innerText = currentUser;
            
            // Mostra menu de administração apenas para admins
            const menuAdmin = document.getElementById('menu-admin');
            if (menuAdmin) {
                if (currentUserProfile === 'admin') {
                    menuAdmin.style.display = 'block';
                } else {
                    menuAdmin.style.display = 'none';
                }
            }

            // Transição de telas com animação
            const authScreen = document.getElementById('auth-screen');
            const mainContent = document.getElementById('main-content');
            
            if (authScreen) {
                authScreen.style.opacity = '0';
                authScreen.style.transform = 'translateY(-20px)';
            }
            
            setTimeout(() => {
                if (authScreen) authScreen.style.display = 'none';
                if (mainContent) {
                    mainContent.style.display = 'block';
                    mainContent.style.opacity = '0';
                    mainContent.style.transform = 'translateY(20px)';
                    
                    setTimeout(() => {
                        mainContent.style.opacity = '1';
                        mainContent.style.transform = 'translateY(0)';
                    }, 50);
                }
            }, 300);
            
            // Atualiza último acesso do usuário
            db.ultimoAcesso = new Date().toISOString();
            localStorage.setItem('db_' + userInput, JSON.stringify(db));
            
            // Registra login
            const loginData = {
                usuario: userInput,
                data: new Date().toISOString(),
                ip: '192.168.1.1' // Simulado
            };
            localStorage.setItem('last_login', JSON.stringify(loginData));
            
            showToast(`Bem-vindo, ${currentUser}!`, 'success');
            
            // Inicia na Home
            navigate('page-home');
            
        } else {
            // Animação de erro
            passField.classList.add('shake-animation');
            setTimeout(() => passField.classList.remove('shake-animation'), 500);
            showToast('Senha incorreta.', 'warning');
        }
    } else {
        userField.classList.add('shake-animation');
        setTimeout(() => userField.classList.remove('shake-animation'), 500);
        showToast('Usuário não encontrado.', 'warning');
    }
}

// ================= 5. FUNCIONALIDADES TÉCNICAS BÁSICAS =================
function togglePassword() {
    const input = document.getElementById('password');
    const icon = document.getElementById('eye-icon');
    if (!input || !icon) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.innerText = '🙈';
        icon.title = 'Ocultar senha';
        icon.classList.add('active');
    } else {
        input.type = 'password';
        icon.innerText = '👁️';
        icon.title = 'Mostrar senha';
        icon.classList.remove('active');
    }
}

function logout() {
    if(confirm("Deseja realmente sair do sistema AXIS?")) {
        console.log('👋 Usuário deslogado');
        
        // Animação de saída
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.opacity = '0';
            mainContent.style.transform = 'translateY(20px)';
        }
        
        setTimeout(() => {
            // Registra logout
            const logoutData = {
                usuario: currentUser,
                data: new Date().toISOString()
            };
            localStorage.setItem('last_logout', JSON.stringify(logoutData));
            
            // Limpa campos e recarrega
            currentUser = null;
            location.reload();
        }, 300);
    }
}

function handleGlobalSearch() {
    const searchInput = document.getElementById('global-search');
    if (!searchInput) return;
    
    const query = searchInput.value.toUpperCase();
    if (query.length >= 2) {
        console.log(`🔍 Busca global: "${query}"`);
        
        showToast(`Buscando por "${query}"...`, 'info');
        
        // Navega para inventário com filtro
        const inventoryPage = document.getElementById('page-inventario');
        if (inventoryPage) {
            navigate('page-inventario');
            const inventorySearch = document.getElementById('search-inventory');
            if (inventorySearch) {
                inventorySearch.value = query;
                filtrarInventario();
            }
        }
    } else if (query.length === 0) {
        // Limpa filtro se busca estiver vazia
        filtrarInventario();
    }
}

// ================= FORM EVENTS INITIALIZATION =================
function initFormEvents() {
    // Enter key para login
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleAuth();
            }
        });
    }
    
    // Enter key para busca global
    const globalSearch = document.getElementById('global-search');
    if (globalSearch) {
        globalSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleGlobalSearch();
            }
        });
    }
    
    // Auto-format MAC addresses no cadastro
    const macFields = ['cad-mac-rede', 'cad-mac-bluetooth'];
    macFields.forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            field.addEventListener('input', (e) => {
                let value = e.target.value.replace(/[^a-fA-F0-9]/g, '');
                if (value.length > 12) value = value.substr(0, 12);
                
                // Formata como MAC
                let formatted = '';
                for (let i = 0; i < value.length; i++) {
                    if (i > 0 && i % 2 === 0) formatted += ':';
                    formatted += value[i];
                }
                e.target.value = formatted.toUpperCase();
            });
        }
    });
}

/* ============================================
   SISTEMA DE INVENTÁRIO AVANÇADO - FUNÇÕES PRINCIPAIS
   ============================================ */

// ================= INICIALIZAÇÃO DO INVENTÁRIO =================
function inicializarInventario() {
    console.log('📊 Inicializando inventário...');
    
    // Carrega dados
    inventarioData = [...equipamentosExemplo];
    
    // Renderiza tabela
    renderizarTabela();
    
    // Inicializa export dropdown
    initExportDropdown();
    
    // Inicializa gráfico
    inicializarGrafico();
    
    console.log(`✅ Inventário inicializado com ${equipamentosExemplo.length} equipamentos`);
}

function atualizarContadoresModelo() {
    const total = equipamentosExemplo.length;
    const zt411 = equipamentosExemplo.filter(e => e.modelo === 'ZT411').length;
    const zd421 = equipamentosExemplo.filter(e => e.modelo === 'ZD421').length;
    const zq630 = equipamentosExemplo.filter(e => e.modelo === 'ZQ630').length;
    
    const elements = {
        'count-todos': total,
        'count-zt411': zt411,
        'count-zd421': zd421,
        'count-zq630': zq630
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

// ================= CONTROLE DE MODELOS =================
function filtrarPorModelo(modelo) {
    console.log(`🔍 Filtrando por modelo: ${modelo}`);
    
    modeloAtual = modelo;
    
    // Atualiza tabs ativas
    document.querySelectorAll('.model-tab').forEach(tab => {
        tab.classList.remove(CSSClasses.active);
        const onclickAttr = tab.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(modelo)) {
            tab.classList.add(CSSClasses.active);
        }
    });
    
    // Aplica filtro
    filtrarInventario();
    
    // Atualiza estatísticas do modelo
    atualizarEstatisticasModelo(modelo);
    
    // Feedback
    const modeloNome = modelo === 'todos' ? 'Todos modelos' : modelo;
    showToast(`Mostrando ${modeloNome}`, 'info');
}

// ================= FUNÇÃO PRINCIPAL DE FILTRO =================
function filtrarInventario() {
    console.log('⚙️ Aplicando filtros...');
    
    const paisFiltro = document.getElementById('ucs-filtro-pais')?.value || '';
    const nodoFiltro = document.getElementById('ucs-filtro-nodo')?.value || '';
    const dispositivoFiltro = document.getElementById('ucs-filtro-dispositivo')?.value || '';
    const busca = ''; // Busca será implementada depois se necessário
    
    console.log(`Filtros: País=${paisFiltro}, Nodo=${nodoFiltro}, Dispositivo=${dispositivoFiltro}`);
    
    let filtrados = equipamentosExemplo.filter(eqp => {
        // Filtro por busca (serial, tag, IP, nome)
        if (busca) {
            const camposBusca = [
                eqp.serial?.toLowerCase(),
                eqp.tag?.toLowerCase(),
                eqp.nome?.toLowerCase(),
                eqp.nombre?.toLowerCase(),
                eqp.ip?.toLowerCase(),
                eqp.macBluetooth?.toLowerCase(),
                eqp.selb?.toLowerCase(),
                eqp.patrimonio?.toLowerCase(),
                eqp.setor?.toLowerCase(),
                eqp.localizacao?.toLowerCase(),
                eqp.responsavel?.toLowerCase(),
                eqp.observacoes?.toLowerCase()
            ];
            
            if (!camposBusca.some(campo => campo && campo.includes(busca))) {
                return false;
            }
        }
        
        return true;
    });
    
    console.log(`✅ ${filtrados.length} equipamentos encontrados`);
    
    inventarioData = filtrados;
    currentPage = 1;
    
    renderizarTabela();
}

// Função para resetar filtros
function resetarFiltrosInventario() {
    const paisSelect = document.getElementById('ucs-filtro-pais');
    const nodoSelect = document.getElementById('ucs-filtro-nodo');
    const dispositivoSelect = document.getElementById('ucs-filtro-dispositivo');
    
    if (paisSelect) paisSelect.value = '';
    if (nodoSelect) nodoSelect.value = '';
    if (dispositivoSelect) dispositivoSelect.value = '';
    
    filtrarInventario();
}

// ================= ORDENAÇÃO DA TABELA =================
function ordenarTabela(coluna) {
    console.log(`📊 Ordenando por: ${coluna}`);
    
    // Alterna direção se clicar na mesma coluna
    if (sortColumn === coluna) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = coluna;
        sortDirection = 'asc';
    }
    
    // Animação de ordenação
    const table = document.getElementById('inventory-table');
    if (table) {
        table.classList.add('sorting');
        setTimeout(() => table.classList.remove('sorting'), 300);
    }
    
    // Atualiza indicadores visuais
    document.querySelectorAll('.sort-indicator').forEach(ind => {
        ind.textContent = '▼';
        ind.style.opacity = '0.3';
    });
    
    const currentIndicator = document.getElementById(`sort-${coluna}`);
    if (currentIndicator) {
        currentIndicator.textContent = sortDirection === 'asc' ? '▲' : '▼';
        currentIndicator.style.opacity = '1';
    }
    
    // Ordena os dados
    inventarioData.sort((a, b) => {
        let valA = a[coluna];
        let valB = b[coluna];
        
        // Tratamento para valores nulos/undefined
        if (valA === null || valA === undefined) valA = '';
        if (valB === null || valB === undefined) valB = '';
        
        // Converte para minúsculas para ordenação case-insensitive
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    
    renderizarTabela();
    showToast(`Ordenado por ${coluna} (${sortDirection === 'asc' ? 'crescente' : 'decrescente'})`, 'info');
}

// ================= RENDERIZAÇÃO DA TABELA =================
function renderizarTabela() {
    console.log('🔄 Renderizando tabela...');
    
    // Atualiza contador total
    const totalCount = document.getElementById('ucs-total-count');
    if (totalCount) {
        totalCount.textContent = `${inventarioData.length} EM TOTAL`;
    }
    
    const tbody = document.getElementById('ucs-inventory-data');
    if (!tbody) {
        // Fallback para estrutura antiga
        const oldTbody = document.getElementById('inventory-data');
        if (oldTbody) {
            tbody = oldTbody;
        } else {
            console.error('❌ Tbody não encontrado');
            return;
        }
    }
    
    // Limpa animações anteriores
    tbody.style.opacity = '1';
    tbody.style.transform = 'translateX(0)';
    
    // Mostra estado vazio se não houver dados
    if (inventarioData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📦</div>
                    <h4 style="margin: 0 0 8px 0; color: var(--text-main);">Nenhum equipamento encontrado</h4>
                    <p style="color: var(--text-secondary); margin-bottom: 20px;">Tente ajustar os filtros ou cadastrar um novo equipamento</p>
                    <button onclick="abrirCadastroRapido()" style="padding: 10px 20px; background: #007aff; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        ➕ Criar Dispositivo
                    </button>
                </td>
            </tr>
        `;
        atualizarPaginacao();
        return;
    }
    
    // Calcula itens para a página atual
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = inventarioData.slice(startIndex, endIndex);
    
    console.log(`📄 Mostrando ${pageItems.length} itens (página ${currentPage})`);
    
    let html = '';
    
    pageItems.forEach((eqp, index) => {
        // Formata descrição incluindo bancada
        const descricao = eqp.descricao || eqp.descripcion || 
                         (eqp.bancada ? `${eqp.modelo} - Bancada ${eqp.bancada}` : eqp.modelo);
        
        // Nome do equipamento
        const nome = eqp.nome || eqp.nombre || eqp.tag || eqp.serial;
        
        html += `
            <tr data-serial="${eqp.serial}" data-tag="${eqp.tag}">
                <td>${eqp.serial || eqp.id || '-'}</td>
                <td>${nome}</td>
                <td>${eqp.ip || '-'}</td>
                <td>${eqp.modelo || '-'}</td>
                <td>${descricao}</td>
                <td>
                    <button class="ucs-action-btn" onclick="editarEquipamento('${eqp.tag}')" title="Editar">
                        ✏️ Editar
                    </button>
                </td>
                <td>
                    <div class="ucs-controls-dropdown">
                        <button class="ucs-action-btn">
                            ⚙️ Controles
                            <span class="ucs-dropdown-arrow">▼</span>
                        </button>
                        <div class="ucs-controls-menu">
                            <button class="ucs-controls-option" onclick="editarEquipamento('${eqp.tag}')">
                                ✏️ Editar
                            </button>
                            <button class="ucs-controls-option" onclick="verDetalhes('${eqp.tag}')">
                                👁️ Ver Detalhes
                            </button>
                            <button class="ucs-controls-option" onclick="pingEquipamento('${eqp.ip}', '${eqp.tag}')">
                                📶 Testar Conexão
                            </button>
                            <button class="ucs-controls-option" onclick="excluirEquipamento('${eqp.tag}')" style="color: #ff3b30;">
                                🗑️ Excluir
                            </button>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    atualizarPaginacao();
    
    console.log('✅ Tabela renderizada com sucesso');
}

// Funções auxiliares para ações da tabela
function editarEquipamento(tag) {
    verDetalhes(tag);
}

function excluirEquipamento(tag) {
    if (confirm('Tem certeza que deseja excluir este equipamento?')) {
        inventarioData = inventarioData.filter(eqp => eqp.tag !== tag);
        renderizarTabela();
        showToast('Equipamento excluído com sucesso', 'success');
    }
}

// ================= FUNÇÕES UTILITÁRIAS DO INVENTÁRIO =================
function formatarSetor(setor) {
    const setores = {
        'packing-mono': 'PACKING MONO',
        'packing-ptw': 'PACKING PTW',
        'rk': 'RK',
        'rk-in': 'RK IN',
        'check-in': 'CHECK-IN',
        'retiros': 'RETIROS',
        'returns': 'RETURNS',
        'insumos': 'INSUMOS',
        'docas-expedicao': 'DOCAS DE EXPEDIÇÃO',
        'reciving': 'RECIVING',
        'mhw': 'MHW',
        'mz1': 'MZ1',
        'mz2': 'MZ2',
        'mz3': 'MZ3',
        'qualidade': 'QUALIDADE',
        'rr': 'RR',
        'aquario-adm': 'AQUÁRIO ADMINISTRATIVO',
        'administracao': 'ADMINISTRAÇÃO',
        'lideranca': 'LIDERANÇA',
        'ambulatorio-externo': 'AMBULATÓRIO EXTERNO',
        'hv': 'HV',
        'gate': 'GATE',
        'linha-peixe-1': 'LINHA DE PEIXE 1',
        'linha-peixe-2': 'LINHA DE PEIXE 2',
        'sorter': 'SORTER',
        'deposito-systems': 'DEPÓSITO DE INTERNAL SYSTEMS'
    };
    return setores[setor] || setor;
}

function formatarMAC(mac) {
    if (!mac) return 'N/A';
    return mac.toUpperCase().replace(/(.{2})/g, '$1:').slice(0, -1);
}

function formatarDataBonita(dataString) {
    if (!dataString) return 'N/A';
    
    try {
        const data = new Date(dataString);
        if (isNaN(data.getTime())) return 'Data inválida';
        
        const now = new Date();
        const diffMs = now - data;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        // Formato relativo para menos de 24h
        if (diffMins < 1) {
            return 'Agora mesmo';
        } else if (diffMins < 60) {
            return `Há ${diffMins} min`;
        } else if (diffHours < 24) {
            return `Há ${diffHours}h`;
        } else if (diffDays === 1) {
            return 'Ontem';
        } else if (diffDays < 7) {
            return `Há ${diffDays} dias`;
        }
        
        // Formato completo para mais antigo
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        console.error('Erro formatando data:', e);
        return 'Data inválida';
    }
}

function copiarParaClipboard(texto) {
    if (!texto || texto === 'N/A' || texto === 'undefined') {
        showToast('Nada para copiar', 'warning');
        return;
    }
    
    // Tenta usar Clipboard API moderna
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(texto).then(() => {
            showToast(`"${texto}" copiado!`, 'success');
            // Efeito visual de cópia
            event?.target?.classList?.add('copied');
            setTimeout(() => event?.target?.classList?.remove('copied'), 1000);
        }).catch(err => {
            console.error('Erro ao copiar:', err);
            fallbackCopyTextToClipboard(texto);
        });
    } else {
        // Fallback para navegadores antigos
        fallbackCopyTextToClipboard(texto);
    }
}

function fallbackCopyTextToClipboard(texto) {
    const textarea = document.createElement('textarea');
    textarea.value = texto;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, 99999); // Para dispositivos móveis
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showToast(`"${texto}" copiado!`, 'success');
            event?.target?.classList?.add('copied');
            setTimeout(() => event?.target?.classList?.remove('copied'), 1000);
        } else {
            showToast('Falha ao copiar', 'warning');
        }
    } catch (err) {
        console.error('Erro ao copiar:', err);
        showToast('Erro ao copiar', 'warning');
    }
    
    document.body.removeChild(textarea);
}

// ================= TOOLTIPS =================
function initTooltips() {
    // Cria container para tooltips se não existir
    let tooltipContainer = document.getElementById('tooltip-container');
    if (!tooltipContainer) {
        tooltipContainer = document.createElement('div');
        tooltipContainer.id = 'tooltip-container';
        tooltipContainer.className = 'tooltip-container';
        document.body.appendChild(tooltipContainer);
    }
    
    // Adiciona eventos para tooltips
    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('[data-tooltip]');
        if (target) {
            showTooltip(target, target.getAttribute('data-tooltip'));
        }
    });
    
    document.addEventListener('mouseout', (e) => {
        const target = e.target.closest('[data-tooltip]');
        if (target) {
            hideTooltip();
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        const tooltip = document.getElementById('tooltip-container');
        if (tooltip && tooltip.style.display === 'block') {
            tooltip.style.left = `${e.clientX + 15}px`;
            tooltip.style.top = `${e.clientY + 15}px`;
        }
    });
}

function showTooltip(element, text) {
    const tooltip = document.getElementById('tooltip-container');
    if (!tooltip || !text) return;
    
    tooltip.textContent = text;
    tooltip.style.display = 'block';
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top - 10}px`;
    tooltip.style.transform = 'translate(-50%, -100%)';
}

function hideTooltip() {
    const tooltip = document.getElementById('tooltip-container');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

// ================= PAGINAÇÃO =================
function atualizarPaginacao() {
    const totalPaginas = Math.ceil(inventarioData.length / itemsPerPage);
    const paginacaoContainer = document.getElementById('pagination-controls');
    
    if (!paginacaoContainer) return;
    
    if (totalPaginas <= 1) {
        paginacaoContainer.innerHTML = `
            <div class="pagination-info">
                Mostrando ${inventarioData.length} de ${equipamentosExemplo.length} equipamentos
            </div>
        `;
        return;
    }
    
    let paginacaoHTML = `
        <div class="pagination-info">
            Página ${currentPage} de ${totalPaginas} • 
            Mostrando ${Math.min(itemsPerPage, inventarioData.length - (currentPage - 1) * itemsPerPage)} de ${inventarioData.length} equipamentos
        </div>
        <div class="pagination-buttons">
            <button onclick="mudarPagina(1)" class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} data-tooltip="Primeira página">
                ❮❮
            </button>
            <button onclick="mudarPagina(${currentPage - 1})" class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} data-tooltip="Página anterior">
                ❮
            </button>
    `;
    
    // Calcula faixa de páginas para mostrar
    const maxPaginasVisiveis = 5;
    let inicio = Math.max(1, currentPage - Math.floor(maxPaginasVisiveis / 2));
    let fim = Math.min(totalPaginas, inicio + maxPaginasVisiveis - 1);
    
    // Ajusta se não couber no início
    if (fim - inicio + 1 < maxPaginasVisiveis) {
        inicio = Math.max(1, fim - maxPaginasVisiveis + 1);
    }
    
    // Botões numéricos
    for (let i = inicio; i <= fim; i++) {
        paginacaoHTML += `
            <button onclick="mudarPagina(${i})" class="pagination-btn ${i === currentPage ? 'active' : ''}" data-tooltip="Página ${i}">
                ${i}
            </button>
        `;
    }
    
    paginacaoHTML += `
            <button onclick="mudarPagina(${currentPage + 1})" class="pagination-btn" ${currentPage === totalPaginas ? 'disabled' : ''} data-tooltip="Próxima página">
                ❯
            </button>
            <button onclick="mudarPagina(${totalPaginas})" class="pagination-btn" ${currentPage === totalPaginas ? 'disabled' : ''} data-tooltip="Última página">
                ❯❯
            </button>
        </div>
    `;
    
    paginacaoContainer.innerHTML = paginacaoHTML;
}

function mudarPagina(pagina) {
    const totalPaginas = Math.ceil(inventarioData.length / itemsPerPage);
    
    if (pagina < 1 || pagina > totalPaginas || pagina === currentPage) {
        return;
    }
    
    // Animação de transição de página
    const tbody = document.getElementById('inventory-data');
    tbody.style.opacity = '0.5';
    tbody.style.transform = 'translateX(' + (pagina > currentPage ? '20px' : '-20px') + ')';
    
    setTimeout(() => {
        currentPage = pagina;
        renderizarTabela();
        
        // Scroll suave para o topo da tabela
        const tabela = document.getElementById('inventory-container');
        if (tabela) {
            tabela.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 200);
}

// ================= ESTATÍSTICAS =================
function atualizarEstatisticas() {
    const total = equipamentosExemplo.length;
    const online = equipamentosExemplo.filter(e => e.status === 'online').length;
    const offline = equipamentosExemplo.filter(e => e.status === 'offline').length;
    const manutencao = equipamentosExemplo.filter(e => e.status === 'manutencao').length;
    
    const elements = {
        'total-equipamentos': total,
        'equipamentos-online': online,
        'equipamentos-offline': offline,
        'equipamentos-manutencao': manutencao
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
    
    // Anima contadores
    animateCounter('total-equipamentos', total);
    animateCounter('equipamentos-online', online);
    animateCounter('equipamentos-offline', offline);
    animateCounter('equipamentos-manutencao', manutencao);
    
    // Atualiza gráfico
    atualizarGraficoStatus(online, offline, manutencao);
}

function animateCounter(elementId, finalValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const currentValue = parseInt(element.textContent) || 0;
    if (currentValue === finalValue) return;
    
    const duration = 500; // ms
    const steps = 20;
    const stepValue = (finalValue - currentValue) / steps;
    const stepTime = duration / steps;
    
    let currentStep = 0;
    const timer = setInterval(() => {
        currentStep++;
        const newValue = Math.round(currentValue + (stepValue * currentStep));
        element.textContent = newValue;
        
        if (currentStep >= steps) {
            element.textContent = finalValue;
            clearInterval(timer);
        }
    }, stepTime);
}

function atualizarEstatisticasModelo(modelo) {
    let equipamentosFiltrados;
    
    if (modelo === 'todos') {
        equipamentosFiltrados = equipamentosExemplo;
    } else {
        equipamentosFiltrados = equipamentosExemplo.filter(e => e.modelo === modelo);
    }
    
    const total = equipamentosFiltrados.length;
    const online = equipamentosFiltrados.filter(e => e.status === 'online').length;
    const offline = equipamentosFiltrados.filter(e => e.status === 'offline').length;
    const manutencao = equipamentosFiltrados.filter(e => e.status === 'manutencao').length;
    
    const porcentagemOnline = total > 0 ? Math.round((online / total) * 100) : 0;
    const porcentagemOffline = total > 0 ? Math.round((offline / total) * 100) : 0;
    const porcentagemManutencao = total > 0 ? Math.round((manutencao / total) * 100) : 0;
    
    const container = document.getElementById('model-stats');
    if (container) {
        container.innerHTML = `
            <div class="stat-box">
                <div class="stat-icon">📊</div>
                <div class="stat-content">
                    <div class="stat-value">${total}</div>
                    <div class="stat-label">Total</div>
                </div>
            </div>
            <div class="stat-box">
                <div class="stat-icon" style="color: var(--success-color);">●</div>
                <div class="stat-content">
                    <div class="stat-value">${online} <span class="stat-percent">(${porcentagemOnline}%)</span></div>
                    <div class="stat-label">Online</div>
                </div>
            </div>
            <div class="stat-box">
                <div class="stat-icon" style="color: var(--warning-color);">●</div>
                <div class="stat-content">
                    <div class="stat-value">${offline} <span class="stat-percent">(${porcentagemOffline}%)</span></div>
                    <div class="stat-label">Offline</div>
                </div>
            </div>
            <div class="stat-box">
                <div class="stat-icon" style="color: var(--danger-color);">●</div>
                <div class="stat-content">
                    <div class="stat-value">${manutencao} <span class="stat-percent">(${porcentagemManutencao}%)</span></div>
                    <div class="stat-label">Manutenção</div>
                </div>
            </div>
        `;
        
        // Anima entrada dos stat-boxes
        setTimeout(() => {
            container.querySelectorAll('.stat-box').forEach((box, i) => {
                setTimeout(() => {
                    box.classList.add('pop-in');
                }, i * 100);
            });
        }, 100);
    }
}

// ================= GRÁFICO =================
function inicializarGrafico() {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;
    
    const total = equipamentosExemplo.length;
    const online = equipamentosExemplo.filter(e => e.status === 'online').length;
    const offline = equipamentosExemplo.filter(e => e.status === 'offline').length;
    const manutencao = equipamentosExemplo.filter(e => e.status === 'manutencao').length;
    
    // Destrói gráfico anterior se existir
    if (window.statusChartInstance) {
        window.statusChartInstance.destroy();
    }
    
    window.statusChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Online', 'Offline', 'Manutenção'],
            datasets: [{
                data: [online, offline, manutencao],
                backgroundColor: [
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(241, 196, 15, 0.8)',
                    'rgba(231, 76, 60, 0.8)'
                ],
                borderColor: [
                    'rgba(46, 204, 113, 1)',
                    'rgba(241, 196, 15, 1)',
                    'rgba(231, 76, 60, 1)'
                ],
                borderWidth: 2,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = online + offline + manutencao;
                            const percentage = Math.round((context.raw / total) * 100);
                            return `${context.label}: ${context.raw} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '70%',
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

function atualizarGraficoStatus(online, offline, manutencao) {
    if (!window.statusChartInstance) {
        inicializarGrafico();
        return;
    }
    
    window.statusChartInstance.data.datasets[0].data = [online, offline, manutencao];
    window.statusChartInstance.update('active');
}

// ================= EXPORTAÇÃO DE DADOS =================
function initExportDropdown() {
    const exportBtn = document.getElementById('export-btn');
    const exportDropdown = document.getElementById('export-dropdown');
    
    if (!exportBtn || !exportDropdown) return;
    
    exportBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        exportDropdown.classList.toggle('show');
    });
    
    // Fecha dropdown ao clicar fora
    document.addEventListener('click', (e) => {
        if (!exportBtn.contains(e.target) && !exportDropdown.contains(e.target)) {
            exportDropdown.classList.remove('show');
        }
    });
}

function exportarDados(formato) {
    console.log(`📤 Exportando dados como ${formato}`);
    
    let dadosParaExportar = inventarioData;
    
    if (dadosParaExportar.length === 0) {
        showToast('Nenhum dado para exportar', 'warning');
        return;
    }
    
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        // Mostra loading
        const originalText = exportBtn.innerHTML;
        exportBtn.innerHTML = '⏳ Exportando...';
        exportBtn.classList.add('exporting');
        
        setTimeout(() => {
            switch(formato) {
                case 'csv':
                    exportarCSV(dadosParaExportar);
                    break;
                case 'excel':
                    exportarExcel(dadosParaExportar);
                    break;
                case 'pdf':
                    exportarPDF(dadosParaExportar);
                    break;
            }
            
            // Restaura botão
            exportBtn.innerHTML = originalText;
            exportBtn.classList.remove('exporting');
            
            // Fecha dropdown
            const exportDropdown = document.getElementById('export-dropdown');
            if (exportDropdown) {
                exportDropdown.classList.remove('show');
            }
        }, 500);
    }
}

function exportarCSV(dados) {
    const cabecalhos = ['Serial', 'Tag', 'Modelo', 'IP', 'MAC Rede', 'MAC Bluetooth', 'SELB', 'Patrimônio', 'Setor', 'Status', 'Última Checagem', 'Responsável'];
    
    const linhas = dados.map(eqp => [
        `"${eqp.serial}"`,
        `"${eqp.tag}"`,
        `"${eqp.modelo}"`,
        `"${eqp.ip}"`,
        `"${eqp.macRede}"`,
        `"${eqp.macBluetooth || 'N/A'}"`,
        `"${eqp.selb}"`,
        `"${eqp.patrimonio || 'N/A'}"`,
        `"${formatarSetor(eqp.setor)}"`,
        `"${eqp.status}"`,
        `"${formatarDataBonita(eqp.ultimaChecagem)}"`,
        `"${eqp.responsavel}"`
    ]);
    
    const csvContent = [cabecalhos.join(','), ...linhas.map(linha => linha.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `inventario_impressoras_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('CSV exportado com sucesso!', 'success');
}

function exportarExcel(dados) {
    showToast('Funcionalidade Excel em desenvolvimento', 'info');
    // Implementação futura com SheetJS ou similar
}

function exportarPDF(dados) {
    showToast('Funcionalidade PDF em desenvolvimento', 'info');
    // Implementação futura com jsPDF ou similar
}

function imprimirInventario() {
    console.log('🖨️ Preparando impressão...');
    
    // Abre janela de impressão
    const printWindow = window.open('', '_blank');
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>AXIS - Inventário de Impressoras</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    color: #333;
                }
                h1 {
                    color: #2c3e50;
                    border-bottom: 2px solid #3498db;
                    padding-bottom: 10px;
                }
                .print-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .print-logo {
                    font-size: 24px;
                    font-weight: bold;
                    color: #3498db;
                }
                .print-date {
                    color: #7f8c8d;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                th {
                    background-color: #f8f9fa;
                    padding: 10px;
                    text-align: left;
                    border: 1px solid #ddd;
                }
                td {
                    padding: 8px;
                    border: 1px solid #ddd;
                }
                .status-online { color: #27ae60; }
                .status-offline { color: #e74c3c; }
                .status-manutencao { color: #f39c12; }
                .print-footer {
                    margin-top: 30px;
                    padding-top: 10px;
                    border-top: 1px solid #ddd;
                    font-size: 12px;
                    color: #7f8c8d;
                    text-align: center;
                }
                @media print {
                    .no-print { display: none; }
                    body { margin: 0; padding: 10px; }
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <div class="print-logo">AXIS - Inventário Zebra</div>
                <div class="print-date">${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</div>
            </div>
            <h1>Inventário de Impressoras</h1>
            <div>Total de equipamentos: ${inventarioData.length}</div>
            <table>
                <thead>
                    <tr>
                        <th>Serial</th>
                        <th>Modelo</th>
                        <th>Tag</th>
                        <th>IP</th>
                        <th>Setor</th>
                        <th>Status</th>
                        <th>Última Checagem</th>
                        <th>Responsável</th>
                    </tr>
                </thead>
                <tbody>
                    ${inventarioData.map(eqp => `
                        <tr>
                            <td>${eqp.serial}</td>
                            <td>${eqp.modelo}</td>
                            <td>${eqp.tag}</td>
                            <td>${eqp.ip}</td>
                            <td>${formatarSetor(eqp.setor)}</td>
                            <td class="status-${eqp.status}">${eqp.status}</td>
                            <td>${formatarDataBonita(eqp.ultimaChecagem)}</td>
                            <td>${eqp.responsavel}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="print-footer">
                Gerado por AXIS Inventory System | ${currentUser || 'Sistema'} | Página 1 de 1
            </div>
            <script>
                window.onload = () => {
                    window.print();
                    setTimeout(() => window.close(), 1000);
                };
            </script>
        </body>
        </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
}

// ================= CADASTRO DE EQUIPAMENTOS =================
function abrirCadastroRapido() {
    console.log('➕ Abrindo cadastro rápido');
    
    const modal = document.getElementById('cadastro-modal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    
    // Animação de entrada
    setTimeout(() => {
        modal.style.opacity = '1';
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.transform = 'translateY(0) scale(1)';
        }
    }, 10);
    
    cadastroStep = 1;
    
    // Atualiza visual do passo
    document.querySelectorAll('.cadastro-step').forEach(step => {
        step.classList.remove(CSSClasses.active);
    });
    const step1 = document.getElementById('step-1');
    if (step1) step1.classList.add(CSSClasses.active);
    
    // Atualiza conteúdo dos passos
    document.querySelectorAll('.cadastro-step-content').forEach(content => {
        content.classList.remove(CSSClasses.active);
    });
    const step1Content = document.getElementById('step-1-content');
    if (step1Content) step1Content.classList.add(CSSClasses.active);
    
    // Atualiza botões
    const btnBack = document.getElementById('btn-back');
    const btnNext = document.getElementById('btn-next');
    const btnSubmit = document.getElementById('btn-submit');
    
    if (btnBack) btnBack.style.display = 'none';
    if (btnNext) btnNext.style.display = 'block';
    if (btnSubmit) btnSubmit.style.display = 'none';
    
    // Limpa formulário
    const cadastroForm = document.getElementById('cadastro-form');
    if (cadastroForm) cadastroForm.reset();
    
    // Popula select de bancada (B01 até B200)
    const selectBancada = document.getElementById('cad-bancada');
    if (selectBancada) {
        // Limpa opções existentes (exceto a primeira "Selecione")
        while (selectBancada.options.length > 1) {
            selectBancada.remove(1);
        }
        
        // Adiciona opções B01 até B200
        for (let i = 1; i <= 200; i++) {
            const option = document.createElement('option');
            const valor = `B${String(i).padStart(2, '0')}`;
            option.value = valor;
            option.textContent = valor;
            selectBancada.appendChild(option);
        }
    }
    
    // Foca no primeiro campo
    const serialInput = document.getElementById('cad-serial');
    if (serialInput) serialInput.focus();
}

function fecharCadastro() {
    const modal = document.getElementById('cadastro-modal');
    if (!modal) return;
    
    modal.style.opacity = '0';
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.transform = 'translateY(20px) scale(0.95)';
    }
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function proximoPassoCadastro() {
    const stepNum = cadastroStep;
    const stepAtualContent = document.getElementById(`step-${stepNum}-content`);
    if (!stepAtualContent) return;
    
    // Validação básica
    if (stepNum === 1) {
        const serial = document.getElementById('cad-serial').value.trim();
        const modeloRadio = document.querySelector('input[name="modelo"]:checked');
        
        if (!serial || !modeloRadio) {
            return; // Validação silenciosa - sem avisos
        }
        
        const modelo = modeloRadio.value;
        
        // Verifica se serial já existe
        if (equipamentosExemplo.some(e => e.serial === serial)) {
            return; // Validação silenciosa - sem avisos
        }
        
        // Atualiza confirmação
        const confirmModelo = document.getElementById('confirm-modelo');
        const confirmSerial = document.getElementById('confirm-serial');
        if (confirmModelo) confirmModelo.textContent = modelo;
        if (confirmSerial) confirmSerial.textContent = serial;
    } else if (stepNum === 2) {
        const ip = document.getElementById('cad-ip').value.trim();
        const macRede = document.getElementById('cad-mac-rede').value.trim();
        const setor = document.getElementById('cad-setor').value;
        
        if (!ip || !macRede || !setor) {
            showToast('Preencha todos os campos obrigatórios', 'warning');
            return;
        }
        
        // Validação de IP
        const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (!ipRegex.test(ip)) {
            showToast('IP inválido', 'warning');
            return;
        }
        
        // Validação de MAC
        const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
        if (!macRegex.test(macRede)) {
            showToast('MAC Address inválido', 'warning');
            return;
        }
        
        // Atualiza confirmação
        const confirmIp = document.getElementById('confirm-ip');
        const confirmSetor = document.getElementById('confirm-setor');
        if (confirmIp) confirmIp.textContent = ip;
        if (confirmSetor) confirmSetor.textContent = formatarSetor(setor);
    }
    
    // Animação de transição
    stepAtualContent.style.opacity = '0';
    stepAtualContent.style.transform = 'translateX(-20px)';
    
    setTimeout(() => {
        // Avança para próximo passo
        const nextStep = stepNum + 1;
        const nextStepElement = document.getElementById(`step-${nextStep}`);
        const nextStepContent = document.getElementById(`step-${nextStep}-content`);
        
        if (nextStepElement && nextStepContent) {
            // Atualiza indicadores no topo - apenas os .step dentro de .cadastro-steps
            document.querySelectorAll('.cadastro-steps .step').forEach(step => {
                step.classList.remove('active');
            });
            nextStepElement.classList.add('active');
            
            // Atualiza conteúdo dos steps - apenas os conteúdos com id step-X-content
            document.querySelectorAll('[id^="step-"][id$="-content"]').forEach(step => {
                step.classList.remove('active');
                step.style.opacity = '0';
                step.style.transform = '';
            });
            nextStepContent.classList.add('active');
            
            // Animação de entrada do próximo passo
            nextStepContent.style.opacity = '0';
            nextStepContent.style.transform = 'translateX(20px)';
            
            setTimeout(() => {
                nextStepContent.style.opacity = '1';
                nextStepContent.style.transform = 'translateX(0)';
            }, 50);
            
            cadastroStep = nextStep;
            
            // Atualiza botões
            const btnBack = document.getElementById('btn-back');
            const btnNext = document.getElementById('btn-next');
            const btnSubmit = document.getElementById('btn-submit');
            
            if (btnBack) btnBack.style.display = 'block';
            if (nextStep === 3) {
                if (btnNext) btnNext.style.display = 'none';
                if (btnSubmit) btnSubmit.style.display = 'block';
            }
            
            // Removido aviso de passo
        }
    }, 300);
}

function passoAnteriorCadastro() {
    const stepNum = cadastroStep;
    
    if (stepNum > 1) {
        const stepAtualContent = document.getElementById(`step-${stepNum}-content`);
        
        // Animação de transição
        if (stepAtualContent) {
            stepAtualContent.style.opacity = '0';
            stepAtualContent.style.transform = 'translateX(20px)';
        }
        
        setTimeout(() => {
            const prevStep = stepNum - 1;
            const prevStepElement = document.getElementById(`step-${prevStep}`);
            const prevStepContent = document.getElementById(`step-${prevStep}-content`);
            
            if (prevStepElement && prevStepContent) {
                // Atualiza passos (indicadores no topo) - apenas os .step
                document.querySelectorAll('.cadastro-steps .step').forEach(step => {
                    step.classList.remove('active');
                });
                prevStepElement.classList.add('active');
                
                // Atualiza conteúdo dos steps - apenas os conteúdos com id step-X-content
                document.querySelectorAll('[id^="step-"][id$="-content"]').forEach(step => {
                    step.classList.remove('active');
                    step.style.opacity = '0';
                    step.style.transform = '';
                });
                prevStepContent.classList.add('active');
                
                // Animação de entrada do passo anterior
                prevStepContent.style.opacity = '0';
                prevStepContent.style.transform = 'translateX(-20px)';
                
                setTimeout(() => {
                    prevStepContent.style.opacity = '1';
                    prevStepContent.style.transform = 'translateX(0)';
                }, 50);
                
                cadastroStep = prevStep;
                
                // Atualiza classe de progresso
                const stepsContainer = document.querySelector('.cadastro-steps');
                if (stepsContainer) {
                    stepsContainer.classList.remove('step-1', 'step-2', 'step-3');
                    stepsContainer.classList.add(`step-${prevStep}`);
                }
                
                // Atualiza botões
                const btnBack = document.getElementById('btn-back');
                const btnNext = document.getElementById('btn-next');
                const btnSubmit = document.getElementById('btn-submit');
                
                if (btnNext) btnNext.style.display = 'block';
                if (btnSubmit) btnSubmit.style.display = 'none';
                if (prevStep === 1) {
                    if (btnBack) btnBack.style.display = 'none';
                } else {
                    if (btnBack) btnBack.style.display = 'block';
                }
                
                // Garante que o modal está visível
                const modal = document.getElementById('cadastro-modal');
                if (modal) {
                    modal.style.display = 'flex';
                    modal.style.opacity = '1';
                }
            }
        }, 300);
    } else if (stepNum === 1) {
        // Se já está no passo 1, apenas garante que está visível
        const step1Content = document.getElementById('step-1-content');
        if (step1Content) {
            step1Content.classList.add('active');
            step1Content.style.opacity = '1';
            step1Content.style.transform = 'translateX(0)';
        }
        
        const step1 = document.getElementById('step-1');
        if (step1) step1.classList.add('active');
        
        const btnBack = document.getElementById('btn-back');
        if (btnBack) btnBack.style.display = 'none';
        
        const modal = document.getElementById('cadastro-modal');
        if (modal) {
            modal.style.display = 'flex';
            modal.style.opacity = '1';
        }
    }
}

function finalizarCadastro() {
    console.log('✅ Finalizando cadastro de equipamento');
    
    // Coleta dados do formulário
    const serial = document.getElementById('cad-serial')?.value.trim() || '';
    const modeloRadio = document.querySelector('input[name="modelo"]:checked');
    const modelo = modeloRadio ? modeloRadio.value : '';
    const ip = document.getElementById('cad-ip')?.value.trim() || '';
    const macRede = document.getElementById('cad-mac-rede')?.value.trim() || '';
    const macBluetooth = document.getElementById('cad-mac-bluetooth')?.value.trim() || '';
    const selb = document.getElementById('cad-selb')?.value.trim() || '';
    const setor = document.getElementById('cad-setor')?.value || '';
    const patrimonio = document.getElementById('cad-patrimonio')?.value.trim() || '';
    const bancada = document.getElementById('cad-bancada')?.value || '';
    const observacoes = document.getElementById('cad-observacoes')?.value.trim() || '';
    
    // Validações finais (silenciosas - sem avisos)
    if (!serial || !modelo || !ip || !macRede) {
        return;
    }
    
    // Cria novo equipamento
    const novoEquipamento = {
        serial: serial,
        tag: `${modelo}-${modelo === 'ZD421' ? 'DSK' : modelo === 'ZQ630' ? 'PAG' : 'IND'}-${String(equipamentosExemplo.length + 1).padStart(3, '0')}`,
        modelo: modelo,
        ip: ip,
        macRede: macRede.toUpperCase(),
        macBluetooth: macBluetooth ? macBluetooth.toUpperCase() : null,
        selb: selb || null,
        patrimonio: patrimonio || null,
        setor: setor,
        bancada: bancada || null,
        status: 'online',
        ultimaChecagem: new Date().toISOString().replace('T', ' ').substring(0, 16),
        dataCadastro: new Date().toISOString(),
        observacoes: observacoes || 'Novo equipamento cadastrado',
        fabricante: 'Zebra Technologies',
        firmware: modelo === 'ZT411' ? 'V72.20.15Z' : modelo === 'ZD421' ? 'V65.21.10Z' : 'V82.15.20Z',
        contador: 0,
        toner: 100,
        ribbon: modelo === 'ZQ630' ? null : 100,
        ink: modelo === 'ZQ630' ? 100 : null,
        responsavel: currentUser || 'Sistema',
        garantia: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    
    // Adiciona ao inventário
    equipamentosExemplo.unshift(novoEquipamento);
    
    // Animação de confirmação
    const modalContent = document.querySelector('#cadastro-modal .modal-content');
    if (modalContent) {
        modalContent.classList.add('success-animation');
    }
    
    setTimeout(() => {
        // Atualiza interface
        atualizarContadoresModelo();
        filtrarInventario();
        atualizarEstatisticas();
        inicializarGrafico();
        
        // Fecha modal
        fecharCadastro();
        if (modalContent) {
            modalContent.classList.remove('success-animation');
        }
        
        // Mostra confirmação
        showToast(`${modelo} cadastrado com sucesso!`, 'success');
        
        // Adiciona notificação
        addNotification(
            'success',
            'Novo equipamento cadastrado',
            `${modelo} com serial ${serial} foi adicionado ao inventário`,
            novoEquipamento.tag
        );
    }, 1000);
}

// ================= FUNÇÕES TÉCNICAS =================
function pingEquipamento(ip, tag) {
    console.log(`📡 Pingando ${tag} (${ip})`);
    
    // Animação do botão
    const pingBtn = document.querySelector(`button[onclick*="${tag}"]`);
    if (pingBtn) {
        pingBtn.classList.add('pinging');
        pingBtn.disabled = true;
    }
    
    showToast(`Testando conexão com ${tag}...`, 'info');
    
    // Simulação de ping
    const sucesso = Math.random() > 0.3; // 70% de sucesso
    
    setTimeout(() => {
        if (sucesso) {
            showToast(`${tag} respondeu ao ping!`, 'success');
            
            // Efeito visual de sucesso
            if (pingBtn) {
                pingBtn.classList.remove('pinging');
                pingBtn.classList.add('ping-success');
                setTimeout(() => {
                    pingBtn.classList.remove('ping-success');
                    pingBtn.disabled = false;
                }, 1000);
            }
            
            // Atualiza status e última checagem
            const equipamento = equipamentosExemplo.find(e => e.tag === tag);
            if (equipamento) {
                equipamento.status = 'online';
                equipamento.ultimaChecagem = new Date().toISOString().replace('T', ' ').substring(0, 16);
                
                // Atualiza a linha específica
                const linha = document.querySelector(`tr[data-tag="${tag}"]`);
                if (linha) {
                    const statusCell = linha.querySelector('.status-online, .status-offline, .status-manutencao');
                    if (statusCell) {
                        statusCell.className = 'status-online';
                        statusCell.innerHTML = '● Online';
                    }
                    
                    const ultimaChecagemCell = linha.querySelector('td:nth-child(10)');
                    if (ultimaChecagemCell) {
                        ultimaChecagemCell.textContent = 'Agora mesmo';
                    }
                }
            }
        } else {
            showToast(`${tag} não respondeu ao ping`, 'warning');
            
            // Efeito visual de falha
            if (pingBtn) {
                pingBtn.classList.remove('pinging');
                pingBtn.classList.add('ping-fail');
                setTimeout(() => {
                    pingBtn.classList.remove('ping-fail');
                    pingBtn.disabled = false;
                }, 1000);
            }
            
            // Atualiza status para offline
            const equipamento = equipamentosExemplo.find(e => e.tag === tag);
            if (equipamento) {
                equipamento.status = 'offline';
                equipamento.ultimaChecagem = new Date().toISOString().replace('T', ' ').substring(0, 16);
                
                // Adiciona notificação
                addNotification(
                    'warning',
                    `${tag} offline`,
                    `Equipamento não respondeu ao ping`,
                    tag
                );
            }
        }
        
        // Atualiza estatísticas
        atualizarEstatisticas();
        atualizarGraficoStatus(
            equipamentosExemplo.filter(e => e.status === 'online').length,
            equipamentosExemplo.filter(e => e.status === 'offline').length,
            equipamentosExemplo.filter(e => e.status === 'manutencao').length
        );
        
        if (document.getElementById('page-inventario').classList.contains('active')) {
            filtrarInventario();
        }
        
    }, 1500);
}

function verDetalhes(tag) {
    console.log(`🔍 Exibindo detalhes de ${tag}`);
    
    const equipamento = equipamentosExemplo.find(e => e.tag === tag);
    if (!equipamento) {
        showToast('Equipamento não encontrado', 'warning');
        return;
    }
    
    // Preenche modal de detalhes
    const detailElements = {
        'detail-tag': equipamento.tag,
        'detail-serial': equipamento.serial,
        'detail-modelo': equipamento.modelo,
        'detail-ip': equipamento.ip,
        'detail-mac-rede': equipamento.macRede,
        'detail-mac-bluetooth': equipamento.macBluetooth || 'N/A',
        'detail-selb': equipamento.selb,
        'detail-patrimonio': equipamento.patrimonio || 'N/A',
        'detail-setor': formatarSetor(equipamento.setor),
        'detail-bancada': equipamento.bancada || '-',
        'detail-ultima-checagem': formatarDataBonita(equipamento.ultimaChecagem),
        'detail-responsavel': equipamento.responsavel,
        'detail-fabricante': equipamento.fabricante,
        'detail-firmware': equipamento.firmware,
        'detail-contador': equipamento.contador.toLocaleString(),
        'detail-garantia': new Date(equipamento.garantia).toLocaleDateString('pt-BR'),
        'detail-observacoes': equipamento.observacoes
    };
    
    Object.entries(detailElements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
    
    // Atualiza status
    const statusElement = document.getElementById('detail-status');
    if (statusElement) {
        statusElement.textContent = equipamento.status === 'online' ? '● Online' : 
                                  equipamento.status === 'offline' ? '● Offline' : '● Em Manutenção';
        statusElement.className = equipamento.status === 'online' ? 'status-online' : 
                                 equipamento.status === 'offline' ? 'status-offline' : 'status-manutencao';
    }
    
    // Status de consumíveis
    const consumiveisHTML = `
        <div class="consumivel ${equipamento.toner < 20 ? 'baixo' : ''}">
            <span class="consumivel-label">Toner:</span>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${equipamento.toner}%"></div>
            </div>
            <span class="consumivel-value">${equipamento.toner}%</span>
        </div>
        ${equipamento.ribbon !== null ? `
            <div class="consumivel ${equipamento.ribbon < 15 ? 'baixo' : ''}">
                <span class="consumivel-label">Ribbon:</span>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${equipamento.ribbon}%"></div>
                </div>
                <span class="consumivel-value">${equipamento.ribbon}%</span>
            </div>
        ` : ''}
        ${equipamento.ink !== null ? `
            <div class="consumivel ${equipamento.ink < 25 ? 'baixo' : ''}">
                <span class="consumivel-label">Tinta:</span>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${equipamento.ink}%"></div>
                </div>
                <span class="consumivel-value">${equipamento.ink}%</span>
            </div>
        ` : ''}
    `;
    const consumiveisContainer = document.getElementById('detail-consumiveis');
    if (consumiveisContainer) {
        consumiveisContainer.innerHTML = consumiveisHTML;
    }
    
    // Atualiza botões de ação
    const pingBtn = document.getElementById('detail-ping-btn');
    const editBtn = document.getElementById('detail-edit-btn');
    const historyBtn = document.getElementById('detail-history-btn');
    
    if (pingBtn) pingBtn.onclick = () => {
        fecharDetalhes();
        pingEquipamento(equipamento.ip, equipamento.tag);
    };
    
    if (editBtn) editBtn.onclick = () => {
        showToast('Edição em desenvolvimento', 'info');
    };
    
    if (historyBtn) historyBtn.onclick = () => {
        showToast('Histórico em desenvolvimento', 'info');
    };
    
    // Mostra modal com animação
    const modal = document.getElementById('detalhes-modal');
    if (modal) {
        modal.style.display = 'flex';
        
        setTimeout(() => {
            modal.style.opacity = '1';
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.style.transform = 'translateY(0) scale(1)';
            }
        }, 10);
    }
}

function fecharDetalhes() {
    const modal = document.getElementById('detalhes-modal');
    if (!modal) return;
    
    modal.style.opacity = '0';
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.transform = 'translateY(20px) scale(0.95)';
    }
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// ================= SISTEMA DE NOTIFICAÇÕES =================
function addNotification(type, title, message, equipment = null) {
    const newNotification = {
        id: notifications.length + 1,
        type: type,
        title: title,
        message: message,
        time: 'Agora mesmo',
        read: false,
        equipment: equipment
    };
    
    notifications.unshift(newNotification);
    updateNotificationBadge();
    
    // Atualiza painel se estiver aberto
    const notificationsPanel = document.getElementById('notifications-panel');
    if (notificationsPanel && notificationsPanel.classList.contains('show')) {
        renderNotifications();
    }
    
    // Mostra toast se não for apenas uma notificação silenciosa
    if (type !== 'info') {
        showToast(title, type);
    }
}

function toggleNotifications() {
    const panel = document.getElementById('notifications-panel');
    if (!panel) return;
    
    panel.classList.toggle('show');
    
    if (panel.classList.contains('show')) {
        renderNotifications();
    }
}

function renderNotifications() {
    const container = document.getElementById('notifications-list');
    if (!container) return;
    
    if (notifications.length === 0) {
        container.innerHTML = `
            <div class="notification-empty">
                <div class="notification-icon">📭</div>
                <p>Nenhuma notificação</p>
                <small>Tudo em ordem por aqui!</small>
            </div>
        `;
        return;
    }
    
    let html = '';
    notifications.forEach(notif => {
        const icon = notif.type === 'warning' ? '⚠️' : 
                    notif.type === 'success' ? '✅' : 'ℹ️';
        
        html += `
            <div class="notification-item ${notif.read ? 'read' : 'unread'}" data-id="${notif.id}">
                <div class="notification-icon">${icon}</div>
                <div class="notification-content">
                    <div class="notification-title">${notif.title}</div>
                    <div class="notification-message">${notif.message}</div>
                    <div class="notification-time">${notif.time}</div>
                    ${notif.equipment ? `<div class="notification-equipment">${notif.equipment}</div>` : ''}
                </div>
                <button class="notification-mark-read" onclick="markNotificationAsRead(${notif.id})" title="Marcar como lida">
                    ●
                </button>
            </div>
        `;
    });
    
    container.innerHTML = html;
    updateNotificationBadge();
}

function markNotificationAsRead(id) {
    const notification = notifications.find(n => n.id === id);
    if (notification) {
        notification.read = true;
        updateNotificationBadge();
        
        // Animação de marcação como lida
        const notificationElement = document.querySelector(`.notification-item[data-id="${id}"]`);
        if (notificationElement) {
            notificationElement.classList.add('marked-read');
            setTimeout(() => {
                notificationElement.classList.remove('unread');
                notificationElement.classList.add('read');
            }, 300);
        }
    }
}

function markAllNotificationsAsRead() {
    if (notifications.every(n => n.read)) {
        showToast('Todas notificações já estão lidas', 'info');
        return;
    }
    
    notifications.forEach(n => n.read = true);
    updateNotificationBadge();
    renderNotifications();
    showToast('Todas notificações marcadas como lidas', 'success');
}

function clearAllNotifications() {
    if (notifications.length === 0) return;
    
    if (confirm('Deseja limpar todas as notificações?')) {
        notifications = notifications.filter(n => !n.read);
        updateNotificationBadge();
        renderNotifications();
        showToast('Notificações limpas', 'info');
    }
}

function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    
    const unreadCount = notifications.filter(n => !n.read).length;
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = 'flex';
        
        // Animação de pulso para novas notificações
        if (unreadCount > parseInt(badge.dataset.lastCount || 0)) {
            badge.classList.add('pulse');
            setTimeout(() => badge.classList.remove('pulse'), 1000);
        }
        badge.dataset.lastCount = unreadCount;
    } else {
        badge.style.display = 'none';
    }
}

// ================= TOAST NOTIFICATIONS =================
function showToast(message, type = 'info', duration = 3000) {
    console.log(`🍞 Toast [${type}]: ${message}`);
    
    // Remove toast existente se houver
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Cria novo toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: '✅',
        warning: '⚠️',
        info: 'ℹ️',
        error: '❌'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-message">${message}</div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(toast);
    
    // Anima entrada
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remove após duração
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }
    }, duration);
}

// ================= SKELETON LOADING =================
function showSkeletonTable() {
    const tbody = document.getElementById('inventory-data');
    if (!tbody) return;
    
    let skeletonHTML = '';
    for (let i = 0; i < itemsPerPage; i++) {
        skeletonHTML += `
            <tr class="skeleton-row">
                <td><div class="skeleton skeleton-text"></div></td>
                <td><div class="skeleton skeleton-badge"></div></td>
                <td><div class="skeleton skeleton-code"></div></td>
                <td><div class="skeleton skeleton-code"></div></td>
                <td><div class="skeleton skeleton-code"></div></td>
                <td><div class="skeleton skeleton-badge"></div></td>
                <td><div class="skeleton skeleton-text"></div></td>
                <td><div class="skeleton skeleton-text"></div></td>
                <td><div class="skeleton skeleton-badge"></div></td>
                <td><div class="skeleton skeleton-text"></div></td>
                <td><div class="skeleton skeleton-button"></div></td>
            </tr>
        `;
    }
    
    tbody.innerHTML = skeletonHTML;
    
    // Anima skeleton
    setTimeout(() => {
        tbody.querySelectorAll('.skeleton').forEach((skeleton, i) => {
            setTimeout(() => {
                skeleton.style.animationDelay = `${i * 0.1}s`;
                skeleton.classList.add('shimmer');
            }, 50);
        });
    }, 100);
}

// ================= FLOATING ACTION BUTTON =================
function initFAB() {
    // Verifica se já existe
    if (document.querySelector('.fab-container')) return;
    
    const fab = document.createElement('div');
    fab.className = 'fab-container';
    fab.innerHTML = `
        <button class="fab-main" onclick="toggleFAB()" aria-label="Ações rápidas">
            <span class="fab-icon">⚡</span>
        </button>
        <div class="fab-menu">
            <button class="fab-item" onclick="abrirCadastroRapido()" data-tooltip="Cadastrar equipamento">
                <span class="fab-item-icon">➕</span>
                <span class="fab-item-label">Cadastrar</span>
            </button>
            <button class="fab-item" onclick="navigate('page-inventario')" data-tooltip="Ir para inventário">
                <span class="fab-item-icon">📋</span>
                <span class="fab-item-label">Inventário</span>
            </button>
            <button class="fab-item" onclick="filtrarPorModelo('todos')" data-tooltip="Ver todos">
                <span class="fab-item-icon">🌐</span>
                <span class="fab-item-label">Ver Todos</span>
            </button>
            <button class="fab-item" onclick="toggleNotifications()" data-tooltip="Notificações">
                <span class="fab-item-icon">🔔</span>
                <span class="fab-item-label">Notificações</span>
            </button>
        </div>
    `;
    
    document.body.appendChild(fab);
    
    // Fecha FAB ao clicar fora
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.fab-container')) {
            fab.classList.remove('active');
        }
    });
}

function toggleFAB() {
    const fab = document.querySelector('.fab-container');
    if (fab) {
        fab.classList.toggle('active');
    }
}

// ================= PANEL DE NOTIFICAÇÕES =================
function initNotificationsPanel() {
    // Verifica se já existe
    if (document.getElementById('notifications-panel')) return;
    
    const panel = document.createElement('div');
    panel.id = 'notifications-panel';
    panel.className = 'notifications-panel';
    panel.innerHTML = `
        <div class="notifications-header">
            <h3>🔔 Notificações</h3>
            <div class="notifications-actions">
                <button onclick="markAllNotificationsAsRead()" title="Marcar todas como lidas">
                    👁️
                </button>
                <button onclick="clearAllNotifications()" title="Limpar notificações">
                    🗑️
                </button>
                <button onclick="toggleNotifications()" title="Fechar">
                    ×
                </button>
            </div>
        </div>
        <div class="notifications-body" id="notifications-list">
            <!-- Notificações serão renderizadas aqui -->
        </div>
        <div class="notifications-footer">
            <button onclick="toggleNotifications()" class="btn-secondary">
                Fechar
            </button>
        </div>
    `;
    
    document.body.appendChild(panel);
    
    // Fecha panel ao clicar fora
    document.addEventListener('click', (e) => {
        const panel = document.getElementById('notifications-panel');
        if (!panel) return;
        
        if (!e.target.closest('.notifications-panel') && 
            !e.target.closest('.notifications-bell') &&
            !e.target.closest('.fab-item[onclick*="toggleNotifications"]')) {
            panel.classList.remove('show');
        }
    });
}

// ================= TEMA (DARK/LIGHT) =================
function initTheme() {
    const savedTheme = localStorage.getItem('axis-theme') || 'light';
    const isHighContrast = localStorage.getItem('axis-high-contrast') === 'true';
    
    setTheme(savedTheme);
    if (isHighContrast) {
        document.body.classList.add('high-contrast');
    }
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Animação de transição
    document.body.style.opacity = '0.8';
    
    setTimeout(() => {
        setTheme(newTheme);
        document.body.style.opacity = '1';
        showToast(`Modo ${newTheme === 'dark' ? 'escuro' : 'claro'} ativado`, 'info');
    }, 200);
}

function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('axis-theme', theme);
    
    // Atualiza ícone do botão
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        themeIcon.title = theme === 'dark' ? 'Modo claro' : 'Modo escuro';
    }
    
    // Atualiza checkbox
    const themeSwitch = document.getElementById('theme-toggle-switch');
    if (themeSwitch) {
        themeSwitch.checked = theme === 'dark';
    }
}

function toggleHighContrast() {
    const isHighContrast = document.body.classList.toggle('high-contrast');
    localStorage.setItem('axis-high-contrast', isHighContrast);
    
    // Atualiza checkbox
    const highContrastToggle = document.getElementById('high-contrast-toggle');
    if (highContrastToggle) {
        highContrastToggle.checked = isHighContrast;
    }
    
    showToast(
        isHighContrast ? 'Alto contraste ativado' : 'Alto contraste desativado',
        'info'
    );
}

// ================= ATALHOS DE TECLADO =================
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ignora se estiver em campo de input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Ctrl + K para busca global
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('global-search');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // Ctrl + I para inventário
        if (e.ctrlKey && e.key === 'i') {
            e.preventDefault();
            navigate('page-inventario');
        }
        
        // Ctrl + N para nova impressora
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            abrirCadastroRapido();
        }
        
        // Ctrl + T para alternar tema
        if (e.ctrlKey && e.key === 't') {
            e.preventDefault();
            toggleTheme();
        }
        
        // Ctrl + H para home
        if (e.ctrlKey && e.key === 'h') {
            e.preventDefault();
            navigate('page-home');
        }
        
        // Ctrl + / para ajuda
        if (e.ctrlKey && e.key === '/') {
            e.preventDefault();
            showToast('Atalhos: Ctrl+K (Buscar), Ctrl+I (Inventário), Ctrl+N (Novo), Ctrl+T (Tema), Ctrl+H (Home)', 'info', 5000);
        }
        
        // Esc para fechar modais
        if (e.key === 'Escape') {
            const modais = document.querySelectorAll('.modal-equipamento[style*="display: flex"]');
            modais.forEach(modal => {
                if (modal.id === 'cadastro-modal') fecharCadastro();
                if (modal.id === 'detalhes-modal') fecharDetalhes();
            });
            
            const notificationsPanel = document.getElementById('notifications-panel');
            if (notificationsPanel && notificationsPanel.classList.contains('show')) {
                toggleNotifications();
            }
            
            const fab = document.querySelector('.fab-container');
            if (fab && fab.classList.contains('active')) {
                toggleFAB();
            }
        }
    });
}

// ================= SIMULAÇÃO TEMPO REAL =================
function startRealTimeSimulation() {
    // Simula atualizações periódicas no inventário
    setInterval(() => {
        if (equipamentosExemplo.length > 0 && Math.random() > 0.7) {
            // Escolhe um equipamento aleatório
            const index = Math.floor(Math.random() * equipamentosExemplo.length);
            const equipamento = equipamentosExemplo[index];
            
            // Chance de mudar status
            if (Math.random() > 0.8 && equipamento.status !== 'manutencao') {
                const oldStatus = equipamento.status;
                equipamento.status = oldStatus === 'online' ? 'offline' : 'online';
                equipamento.ultimaChecagem = new Date().toISOString().replace('T', ' ').substring(0, 16);
                
                // Atualiza tabela se estiver na página de inventário
                if (document.getElementById('page-inventario').classList.contains('active')) {
                    const linha = document.querySelector(`tr[data-serial="${equipamento.serial}"]`);
                    if (linha) {
                        const statusCell = linha.querySelector('.status-online, .status-offline, .status-manutencao');
                        if (statusCell) {
                            const statusText = equipamento.status === 'online' ? '● Online' : '● Offline';
                            const statusClass = `status-${equipamento.status}`;
                            statusCell.className = statusClass;
                            statusCell.innerHTML = statusText;
                            
                            // Animação de mudança de status
                            statusCell.classList.add('status-change');
                            setTimeout(() => statusCell.classList.remove('status-change'), 1000);
                        }
                        
                        const ultimaChecagemCell = linha.querySelector('td:nth-child(10)');
                        if (ultimaChecagemCell) {
                            ultimaChecagemCell.textContent = 'Agora mesmo';
                        }
                    }
                }
                
                // Adiciona notificação se ficou offline
                if (oldStatus === 'online' && equipamento.status === 'offline') {
                    addNotification(
                        'warning',
                        `${equipamento.tag} offline`,
                        `Equipamento perdeu conexão`,
                        equipamento.tag
                    );
                }
                
                // Adiciona notificação se voltou online
                if (oldStatus === 'offline' && equipamento.status === 'online') {
                    addNotification(
                        'success',
                        `${equipamento.tag} online`,
                        `Conexão restabelecida`,
                        equipamento.tag
                    );
                }
                
                // Atualiza estatísticas
                atualizarEstatisticas();
                atualizarGraficoStatus(
                    equipamentosExemplo.filter(e => e.status === 'online').length,
                    equipamentosExemplo.filter(e => e.status === 'offline').length,
                    equipamentosExemplo.filter(e => e.status === 'manutencao').length
                );
            }
        }
    }, 30000); // A cada 30 segundos
    
    // Atualiza tempo das notificações
    setInterval(() => {
        notifications.forEach(notif => {
            if (notif.time.includes('minutos')) {
                const mins = parseInt(notif.time.split(' ')[0]);
                notif.time = `Há ${mins + 1} minutos`;
            } else if (notif.time.includes('hora') && !notif.time.includes('horas')) {
                const hours = parseInt(notif.time.split(' ')[0]);
                if (hours < 23) {
                    notif.time = `Há ${hours + 1} horas`;
                } else {
                    notif.time = 'Ontem';
                }
            }
        });
        
        if (document.getElementById('notifications-panel')?.classList.contains('show')) {
            renderNotifications();
        }
    }, 60000); // A cada minuto
}

// ================= ADMINISTRAÇÃO DE USUÁRIOS =================
function atualizarEstatisticasAdmin() {
    // Atualiza estatísticas de usuários
    const usuarios = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('db_')) {
            try {
                const userData = JSON.parse(localStorage.getItem(key));
                usuarios.push({
                    login: key.replace('db_', ''),
                    ...userData
                });
            } catch (e) {
                console.error('Erro ao carregar usuário:', key, e);
            }
        }
    }
    
    const totalUsuarios = usuarios.length;
    const usuariosAtivos = usuarios.filter(u => u.ultimoAcesso).length;
    
    const totalUsuariosEl = document.getElementById('total-usuarios');
    const usuariosAtivosEl = document.getElementById('usuarios-ativos');
    
    if (totalUsuariosEl) totalUsuariosEl.textContent = totalUsuarios;
    if (usuariosAtivosEl) usuariosAtivosEl.textContent = usuariosAtivos;
    
    // Atualiza estatísticas de equipamentos
    const totalEquipamentosEl = document.getElementById('total-equipamentos');
    if (totalEquipamentosEl) {
        totalEquipamentosEl.textContent = equipamentosExemplo.length;
    }
    
    // Atualiza rondas realizadas (simulado - pode ser ajustado depois)
    const rondasRealizadasEl = document.getElementById('rondas-realizadas');
    if (rondasRealizadasEl) {
        const rondas = JSON.parse(localStorage.getItem('rondas') || '[]');
        rondasRealizadasEl.textContent = rondas.length || 0;
    }
}

function abrirGerenciarUsuarios() {
    const modal = document.getElementById('modal-gerenciar-usuarios');
    if (modal) {
        modal.style.display = 'flex';
        carregarUsuarios();
        atualizarEstatisticasAdmin();
        
        // Fecha modal ao clicar fora
        modal.onclick = function(e) {
            if (e.target === modal) {
                fecharModalUsuarios();
            }
        };
    }
}

function fecharModalUsuarios() {
    const modal = document.getElementById('modal-gerenciar-usuarios');
    if (modal) {
        modal.style.display = 'none';
    }
}

function abrirEstatisticasSistema() {
    showToast('Módulo de estatísticas em desenvolvimento', 'info');
    // Aqui pode ser implementado um modal ou navegação para página de estatísticas
}

function abrirConfiguracoesAvancadas() {
    navigate('page-configuracoes');
}

function abrirLogsAuditoria() {
    showToast('Módulo de logs e auditoria em desenvolvimento', 'info');
    // Aqui pode ser implementado um modal ou navegação para página de logs
}

function carregarUsuarios() {
    const tbody = document.getElementById('usuarios-tbody');
    if (!tbody) return;
    
    const usuarios = [];
    
    // Busca todos os usuários no localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('db_') && key !== 'db_ADMIN') {
            try {
                const userData = JSON.parse(localStorage.getItem(key));
                usuarios.push({
                    login: key.replace('db_', ''),
                    ...userData
                });
            } catch (e) {
                console.error('Erro ao carregar usuário:', key, e);
            }
        }
    }
    
    // Adiciona o admin também
    const adminData = JSON.parse(localStorage.getItem('db_ADMIN') || '{}');
    if (adminData.name) {
        usuarios.unshift({
            login: 'ADMIN',
            ...adminData
        });
    }
    
    // Ordena por nome
    usuarios.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    // Renderiza tabela
    tbody.innerHTML = usuarios.map(user => {
        const dataCadastro = user.dataCadastro ? new Date(user.dataCadastro).toLocaleDateString('pt-BR') : '-';
        const ultimoAcesso = user.ultimoAcesso ? new Date(user.ultimoAcesso).toLocaleDateString('pt-BR') : '-';
        const perfilLabel = {
            'admin': '👑 Administrador',
            'tecnico': '🔧 Técnico',
            'operador': '👤 Operador',
            'visualizador': '👁️ Visualizador'
        }[user.perfil] || user.perfil || 'Operador';
        
        return `
            <tr>
                <td>${user.name || '-'}</td>
                <td><strong>${user.login}</strong></td>
                <td>${perfilLabel}</td>
                <td>${dataCadastro}</td>
                <td>${ultimoAcesso}</td>
                <td class="acoes-usuario">
                    ${user.login !== 'ADMIN' ? `
                        <button class="btn-icon-small" onclick="editarUsuario('${user.login}')" title="Editar">
                            ✏️
                        </button>
                        <button class="btn-icon-small btn-danger" onclick="excluirUsuario('${user.login}')" title="Excluir">
                            🗑️
                        </button>
                    ` : '<span class="text-muted">Protegido</span>'}
                </td>
            </tr>
        `;
    }).join('');
    
    // Atualiza estatísticas após carregar
    atualizarEstatisticasAdmin();
}

function filtrarUsuarios() {
    const busca = document.getElementById('buscar-usuario').value.toLowerCase();
    const linhas = document.querySelectorAll('#usuarios-tbody tr');
    
    linhas.forEach(linha => {
        const texto = linha.textContent.toLowerCase();
        linha.style.display = texto.includes(busca) ? '' : 'none';
    });
}

function limparFormularioUsuario() {
    document.getElementById('cadastro-usuario-form').reset();
}

function cadastrarUsuario(event) {
    if (event) event.preventDefault();
    
    if (currentUserProfile !== 'admin') {
        showToast('Apenas administradores podem cadastrar usuários', 'error');
        return;
    }
    
    const nome = document.getElementById('novo-usuario-nome').value.trim();
    const login = document.getElementById('novo-usuario-login').value.trim().toUpperCase();
    const senha = document.getElementById('novo-usuario-senha').value;
    const perfil = document.getElementById('novo-usuario-perfil').value;
    
    if (!nome || !login || !senha || !perfil) {
        showToast('Preencha todos os campos obrigatórios', 'warning');
        return;
    }
    
    if (senha.length < 6) {
        showToast('A senha deve ter no mínimo 6 caracteres', 'warning');
        return;
    }
    
    const userKey = 'db_' + login;
    
    // Verifica se usuário já existe
    if (localStorage.getItem(userKey)) {
        showToast('Usuário já existe! Escolha outro login.', 'warning');
        return;
    }
    
    // Cria novo usuário
    const novoUsuario = {
        name: nome,
        pass: senha,
        perfil: perfil,
        dataCadastro: new Date().toISOString(),
        ultimoAcesso: null
    };
    
    localStorage.setItem(userKey, JSON.stringify(novoUsuario));
    
    showToast(`Usuário ${nome} cadastrado com sucesso!`, 'success');
    limparFormularioUsuario();
    carregarUsuarios();
    atualizarEstatisticasAdmin();
}

function editarUsuario(login) {
    const userKey = 'db_' + login;
    const userData = JSON.parse(localStorage.getItem(userKey) || '{}');
    
    if (!userData.name) {
        showToast('Usuário não encontrado', 'error');
        return;
    }
    
    const novoNome = prompt('Novo nome completo:', userData.name);
    if (!novoNome || novoNome.trim() === '') return;
    
    const novoPerfil = prompt('Novo perfil (admin/tecnico/operador/visualizador):', userData.perfil || 'operador');
    if (!novoPerfil) return;
    
    const perfisValidos = ['admin', 'tecnico', 'operador', 'visualizador'];
    if (!perfisValidos.includes(novoPerfil)) {
        showToast('Perfil inválido', 'error');
        return;
    }
    
    userData.name = novoNome.trim();
    userData.perfil = novoPerfil;
    
    localStorage.setItem(userKey, JSON.stringify(userData));
    showToast('Usuário atualizado com sucesso!', 'success');
    carregarUsuarios();
    atualizarEstatisticasAdmin();
}

function excluirUsuario(login) {
    if (login === 'ADMIN') {
        showToast('Não é possível excluir o usuário administrador padrão', 'error');
        return;
    }
    
    if (!confirm(`Tem certeza que deseja excluir o usuário ${login}?`)) {
        return;
    }
    
    const userKey = 'db_' + login;
    localStorage.removeItem(userKey);
    
    showToast(`Usuário ${login} excluído com sucesso!`, 'success');
    carregarUsuarios();
    atualizarEstatisticasAdmin();
}

// ================= FUNÇÕES GLOBAIS EXPORTADAS =================
// Torna funções disponíveis globalmente para eventos onclick
window.toggleSidebar = toggleSidebar;
window.navigate = navigate;
// Função toggleAuth removida - apenas login disponível
window.handleAuth = handleAuth;
window.togglePassword = togglePassword;
window.logout = logout;
window.handleGlobalSearch = handleGlobalSearch;
window.filtrarPorModelo = filtrarPorModelo;
window.filtrarInventario = filtrarInventario;
window.resetarFiltrosInventario = resetarFiltrosInventario;
window.editarEquipamento = editarEquipamento;
window.excluirEquipamento = excluirEquipamento;
window.ordenarTabela = ordenarTabela;
window.mudarPagina = mudarPagina;
window.exportarDados = exportarDados;
window.abrirCadastroRapido = abrirCadastroRapido;
window.fecharCadastro = fecharCadastro;
window.proximoPassoCadastro = proximoPassoCadastro;
window.passoAnteriorCadastro = passoAnteriorCadastro;
window.cadastrarUsuario = cadastrarUsuario;
window.limparFormularioUsuario = limparFormularioUsuario;
window.filtrarUsuarios = filtrarUsuarios;
window.editarUsuario = editarUsuario;
window.excluirUsuario = excluirUsuario;
window.abrirGerenciarUsuarios = abrirGerenciarUsuarios;
window.fecharModalUsuarios = fecharModalUsuarios;
window.abrirEstatisticasSistema = abrirEstatisticasSistema;
window.abrirConfiguracoesAvancadas = abrirConfiguracoesAvancadas;
window.abrirLogsAuditoria = abrirLogsAuditoria;
window.finalizarCadastro = finalizarCadastro;
window.pingEquipamento = pingEquipamento;
window.verDetalhes = verDetalhes;
window.fecharDetalhes = fecharDetalhes;
window.copiarParaClipboard = copiarParaClipboard;
window.toggleTheme = toggleTheme;
window.toggleHighContrast = toggleHighContrast;
window.imprimirInventario = imprimirInventario;
window.toggleNotifications = toggleNotifications;
window.markNotificationAsRead = markNotificationAsRead;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;
window.clearAllNotifications = clearAllNotifications;
window.toggleFAB = toggleFAB;
window.updateItemsPerPage = updateItemsPerPage;
window.clearLocalCache = clearLocalCache;
window.exportSettings = exportSettings;

// ================= HELPERS PARA CSS INTEGRAÇÃO =================
// Função para adicionar classe CSS dinamicamente se necessário
function addDynamicCSS() {
    const style = document.createElement('style');
    style.id = 'axis-dynamic-styles';
    style.textContent = `
        .loading { opacity: 0.5; pointer-events: none; }
        .hidden { display: none !important; }
        .visible { display: block !important; }
        .active { opacity: 1 !important; }
        .disabled { opacity: 0.5; cursor: not-allowed; }
        .shake { animation: shake 0.5s ease-in-out; }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .fade-in { animation: fadeIn 0.3s ease-in; }
        .fade-out { animation: fadeOut 0.3s ease-out; }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        .slide-in-right { animation: slideInRight 0.3s ease-out; }
        .slide-out-right { animation: slideOutRight 0.3s ease-in; }
        
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .pulse { animation: pulse 1s infinite; }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
    `;
    
    document.head.appendChild(style);
}

// Inicializa estilos dinâmicos
addDynamicCSS();

console.log('🚀 AXIS - Sistema JavaScript carregado completamente!');