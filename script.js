/* ============================================
   SISTEMA PRINCIPAL - VARIÁVEIS GLOBAIS
   ============================================ */
let currentUser = null;
let authMode = 'login';

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

/* ============================================
   FUNÇÕES DE INICIALIZAÇÃO E CONTROLE GERAL
   ============================================ */

// ================= 1. INICIALIZAÇÃO DO SISTEMA =================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 AXIS - Sistema iniciando...');
    
    // Inicializa preferências de redução de movimento
    initReducedMotion();
    
    // Garante que o sistema comece na tela de login
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('main-content').style.display = 'none';
    
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
    
    if (!sidebar || !overlay) return;
    
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
    
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
    
    // 1. Oculta todas as seções
    const sections = document.querySelectorAll('.main-section');
    sections.forEach(s => {
        s.classList.remove('active');
    });

    // 2. Ativa a página alvo
    const target = document.getElementById(pageId);
    if (target) {
        target.classList.add('active');
    }

    // 3. Atualiza o estado visual dos botões no menu
    const menuItems = document.querySelectorAll('.side-item');
    menuItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick')?.includes(pageId)) {
            item.classList.add('active');
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
    }

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
    }, 300);
}

// ================= SETTINGS =================
function loadSettings() {
    // Carrega configurações salvas
    const savedTheme = localStorage.getItem('axis-theme') || 'light';
    const highContrast = localStorage.getItem('axis-high-contrast') === 'true';
    const savedItemsPerPage = localStorage.getItem('axis-items-per-page') || '15';
    
    // Atualiza controles
    document.getElementById('theme-toggle-switch').checked = savedTheme === 'dark';
    document.getElementById('high-contrast-toggle').checked = highContrast;
    document.getElementById('items-per-page').value = savedItemsPerPage;
    
    itemsPerPage = parseInt(savedItemsPerPage);
}

function updateItemsPerPage() {
    const select = document.getElementById('items-per-page');
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
        exportDate: new Date().toISOString()
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
function toggleAuth(mode) {
    console.log(`🔐 Alternando modo de autenticação: ${mode}`);
    
    authMode = mode;
    const registerFields = document.getElementById('register-fields');
    const mainBtn = document.getElementById('auth-main-btn');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');

    if (mode === 'login') {
        registerFields.style.display = 'none';
        mainBtn.innerText = 'Acessar AXIS';
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
    } else {
        registerFields.style.display = 'block';
        mainBtn.innerText = 'Finalizar Cadastro';
        tabLogin.classList.remove('active');
        tabRegister.classList.add('active');
    }
}

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

    if (authMode === 'register') {
        const nameField = document.getElementById('reg-fullname');
        const name = nameField.value.trim();
        
        if (!name) {
            showToast('Digite seu nome completo!', 'warning');
            return;
        }
        
        // Verifica se usuário já existe
        if (localStorage.getItem('db_' + userInput)) {
            showToast('Usuário já cadastrado!', 'warning');
            return;
        }
        
        const userData = { 
            name: name.toUpperCase(), 
            pass: pass,
            dataCadastro: new Date().toISOString(),
            perfil: 'tecnico'
        };
        
        localStorage.setItem('db_' + userInput, JSON.stringify(userData));
        showToast('Conta criada com sucesso!', 'success');
        toggleAuth('login');
        
        // Limpa campos
        nameField.value = '';
        userField.value = '';
        passField.value = '';
        
    } else {
        const dbRaw = localStorage.getItem('db_' + userInput);
        if (dbRaw) {
            const db = JSON.parse(dbRaw);
            if (db.pass === pass) {
                // SUCESSO NO LOGIN
                currentUser = db.name || userInput;
                
                // Atualiza saudação
                document.getElementById('user-display-name').innerText = currentUser;

                // Transição de telas com animação
                document.getElementById('auth-screen').style.opacity = '0';
                document.getElementById('auth-screen').style.transform = 'translateY(-20px)';
                
                setTimeout(() => {
                    document.getElementById('auth-screen').style.display = 'none';
                    document.getElementById('main-content').style.display = 'block';
                    document.getElementById('main-content').style.opacity = '0';
                    document.getElementById('main-content').style.transform = 'translateY(20px)';
                    
                    setTimeout(() => {
                        document.getElementById('main-content').style.opacity = '1';
                        document.getElementById('main-content').style.transform = 'translateY(0)';
                    }, 50);
                }, 300);
                
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
    } else {
        input.type = 'password';
        icon.innerText = '👁️';
        icon.title = 'Mostrar senha';
    }
}

function logout() {
    if(confirm("Deseja realmente sair do sistema AXIS?")) {
        console.log('👋 Usuário deslogado');
        
        // Animação de saída
        document.getElementById('main-content').style.opacity = '0';
        document.getElementById('main-content').style.transform = 'translateY(20px)';
        
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
    const query = document.getElementById('global-search').value.toUpperCase();
    if (query.length >= 2) {
        console.log(`🔍 Busca global: "${query}"`);
        
        showToast(`Buscando por "${query}"...`, 'info');
        
        // Navega para inventário com filtro
        if (document.getElementById('page-inventario')) {
            navigate('page-inventario');
            document.getElementById('search-inventory').value = query;
            filtrarInventario();
        }
    }
}

/* ============================================
   SISTEMA DE INVENTÁRIO AVANÇADO - FUNÇÕES PRINCIPAIS
   ============================================ */

// ================= INICIALIZAÇÃO DO INVENTÁRIO =================
function inicializarInventario() {
    console.log('📊 Inicializando inventário...');
    
    // Mostra estado de carregamento
    showSkeletonTable();
    
    // Carrega dados
    inventarioData = [...equipamentosExemplo];
    
    // Atualiza contadores de modelo
    atualizarContadoresModelo();
    
    // Atualiza estatísticas
    atualizarEstatisticas();
    atualizarEstatisticasModelo('todos');
    
    // Aplica filtros
    setTimeout(() => {
        filtrarInventario();
    }, 500);
    
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
    
    document.getElementById('count-todos').textContent = total;
    document.getElementById('count-zt411').textContent = zt411;
    document.getElementById('count-zd421').textContent = zd421;
    document.getElementById('count-zq630').textContent = zq630;
}

// ================= CONTROLE DE MODELOS =================
function filtrarPorModelo(modelo) {
    console.log(`🔍 Filtrando por modelo: ${modelo}`);
    
    modeloAtual = modelo;
    
    // Atualiza tabs ativas
    document.querySelectorAll('.model-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('onclick')?.includes(modelo)) {
            tab.classList.add('active');
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
    
    const modeloFiltro = document.getElementById('filter-modelo').value;
    const statusFiltro = document.getElementById('filter-status').value;
    const setorFiltro = document.getElementById('filter-setor').value;
    const busca = document.getElementById('search-inventory')?.value.toLowerCase() || '';
    
    console.log(`Filtros: Modelo=${modeloFiltro}, Status=${statusFiltro}, Setor=${setorFiltro}, Busca="${busca}"`);
    
    let filtrados = equipamentosExemplo.filter(eqp => {
        // Filtro por modelo (menu de tabs)
        if (modeloAtual !== 'todos' && eqp.modelo !== modeloAtual) return false;
        
        // Filtro por modelo (select)
        if (modeloFiltro !== 'todos' && eqp.modelo !== modeloFiltro) return false;
        
        // Filtro por status
        if (statusFiltro !== 'todos' && eqp.status !== statusFiltro) return false;
        
        // Filtro por setor
        if (setorFiltro !== 'todos' && eqp.setor !== setorFiltro) return false;
        
        // Filtro por busca (em todos os campos relevantes)
        if (busca) {
            const camposBusca = [
                eqp.serial?.toLowerCase(),
                eqp.tag?.toLowerCase(),
                eqp.modelo?.toLowerCase(),
                eqp.ip?.toLowerCase(),
                eqp.macRede?.toLowerCase(),
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
    
    atualizarEstatisticas();
    renderizarTabela();
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
    table.classList.add('sorting');
    setTimeout(() => table.classList.remove('sorting'), 300);
    
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
    
    const tbody = document.getElementById('inventory-data');
    if (!tbody) {
        console.error('❌ Tbody não encontrado');
        return;
    }
    
    // Mostra estado vazio se não houver dados
    if (inventarioData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h4>Nenhum equipamento encontrado</h4>
                    <p>Tente ajustar os filtros ou cadastrar um novo equipamento</p>
                    <button onclick="abrirCadastroRapido()" class="btn-primary">
                        ➕ Cadastrar Nova Impressora
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
        const statusClass = `status-${eqp.status}`;
        const statusText = eqp.status === 'online' ? '● Online' : 
                          eqp.status === 'offline' ? '● Offline' : '● Em Manutenção';
        
        const setorText = formatarSetor(eqp.setor);
        const isNew = Date.now() - new Date(eqp.dataCadastro).getTime() < 24 * 60 * 60 * 1000;
        const rowClass = isNew ? 'new-equipment' : (index % 2 === 0 ? '' : 'table-row-alt');
        
        // Formata MAC Address para exibição
        const macRedeFormatado = formatarMAC(eqp.macRede);
        const macBluetoothFormatado = eqp.macBluetooth ? formatarMAC(eqp.macBluetooth) : 'N/A';
        
        html += `
            <tr class="${rowClass}" data-serial="${eqp.serial}" data-tag="${eqp.tag}">
                <td>
                    <div class="tag-with-actions">
                        <strong>${eqp.serial}</strong>
                        <div class="row-actions">
                            <button onclick="copiarParaClipboard('${eqp.serial}')" title="Copiar Serial" data-tooltip="Copiar Serial">
                                📋
                            </button>
                            <button onclick="verDetalhes('${eqp.tag}')" title="Ver detalhes" data-tooltip="Ver detalhes">
                                👁️
                            </button>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="modelo-badge" data-tooltip="Zebra ${eqp.modelo}">
                        ${eqp.modelo}
                    </span>
                </td>
                <td>
                    <code class="copyable" onclick="copiarParaClipboard('${eqp.ip}')" data-tooltip="Clique para copiar IP">
                        ${eqp.ip}
                    </code>
                </td>
                <td>
                    <code class="copyable" onclick="copiarParaClipboard('${eqp.macRede}')" data-tooltip="Clique para copiar MAC">
                        ${macRedeFormatado}
                    </code>
                </td>
                <td>
                    <code class="copyable" onclick="copiarParaClipboard('${eqp.macBluetooth || ''}')" data-tooltip="Clique para copiar Bluetooth">
                        ${macBluetoothFormatado}
                    </code>
                </td>
                <td>
                    <span class="selb-badge">${eqp.selb}</span>
                </td>
                <td>
                    ${eqp.patrimonio || 'N/A'}
                </td>
                <td>
                    ${setorText}
                </td>
                <td>
                    <span class="${statusClass}" data-tooltip="${eqp.ultimaChecagem}">
                        ${statusText}
                    </span>
                </td>
                <td>
                    ${formatarDataBonita(eqp.ultimaChecagem)}
                </td>
                <td>
                    <div class="action-buttons">
                        <button onclick="verDetalhes('${eqp.tag}')" class="btn-action btn-detalhes" data-tooltip="Ver todos os detalhes">
                            <span class="btn-icon">👁️</span>
                            <span class="btn-text">Detalhes</span>
                        </button>
                        <button onclick="pingEquipamento('${eqp.ip}', '${eqp.tag}')" class="btn-action btn-ping" data-tooltip="Testar conexão">
                            <span class="btn-icon">📶</span>
                            <span class="btn-text">Ping</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    atualizarPaginacao();
    
    // Adiciona animação de entrada nas linhas
    setTimeout(() => {
        document.querySelectorAll('#inventory-data tr').forEach((row, i) => {
            row.style.opacity = '0';
            row.style.transform = 'translateY(10px)';
            setTimeout(() => {
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
                row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            }, i * 50);
        });
    }, 100);
    
    console.log('✅ Tabela renderizada com sucesso');
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
    if (!texto || texto === 'N/A') {
        showToast('Nada para copiar', 'warning');
        return;
    }
    
    if (!navigator.clipboard) {
        // Fallback para navegadores antigos
        const textarea = document.createElement('textarea');
        textarea.value = texto;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast(`"${texto}" copiado!`, 'success');
        return;
    }
    
    navigator.clipboard.writeText(texto).then(() => {
        showToast(`"${texto}" copiado!`, 'success');
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        showToast('Erro ao copiar', 'warning');
    });
}

// ================= TOOLTIPS =================
function initTooltips() {
    // Cria container para tooltips
    const tooltipContainer = document.createElement('div');
    tooltipContainer.id = 'tooltip-container';
    tooltipContainer.className = 'tooltip-container';
    document.body.appendChild(tooltipContainer);
    
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
    
    document.getElementById('total-equipamentos').textContent = total;
    document.getElementById('equipamentos-online').textContent = online;
    document.getElementById('equipamentos-offline').textContent = offline;
    document.getElementById('equipamentos-manutencao').textContent = manutencao;
    
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
    window.statusChartInstance.update();
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
        exportDropdown.classList.remove('show');
    }, 500);
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
    modal.style.display = 'flex';
    
    // Animação de entrada
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.querySelector('.modal-content').style.transform = 'translateY(0) scale(1)';
    }, 10);
    
    cadastroStep = 1;
    
    // Atualiza visual do passo
    document.querySelectorAll('.cadastro-step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById('step-1').classList.add('active');
    
    // Atualiza botões
    document.getElementById('btn-back').style.display = 'none';
    document.getElementById('btn-next').style.display = 'block';
    document.getElementById('btn-submit').style.display = 'none';
    
    // Limpa formulário
    document.getElementById('cadastro-form').reset();
}

function fecharCadastro() {
    const modal = document.getElementById('cadastro-modal');
    modal.style.opacity = '0';
    modal.querySelector('.modal-content').style.transform = 'translateY(20px) scale(0.95)';
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function proximoPassoCadastro() {
    const stepAtual = document.querySelector('.cadastro-step.active');
    const stepNum = parseInt(stepAtual.id.split('-')[1]);
    
    // Validação básica
    if (stepNum === 1) {
        const serial = document.getElementById('cad-serial').value.trim();
        const modeloRadio = document.querySelector('input[name="modelo"]:checked');
        
        if (!serial || !modeloRadio) {
            showToast('Preencha Serial e selecione o Modelo para continuar', 'warning');
            return;
        }
        
        const modelo = modeloRadio.value;
        
        // Verifica se serial já existe
        if (equipamentosExemplo.some(e => e.serial === serial)) {
            showToast('Serial já cadastrado no sistema', 'warning');
            return;
        }
        
        // Atualiza confirmação
        document.getElementById('confirm-modelo').textContent = modelo;
        document.getElementById('confirm-serial').textContent = serial;
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
        document.getElementById('confirm-ip').textContent = ip;
        document.getElementById('confirm-setor').textContent = formatarSetor(setor);
    }
    
    // Animação de transição
    stepAtual.style.opacity = '0';
    stepAtual.style.transform = 'translateX(-20px)';
    
    setTimeout(() => {
        // Avança para próximo passo
        const nextStep = stepNum + 1;
        const nextStepElement = document.getElementById(`step-${nextStep}`);
        const nextStepContent = document.getElementById(`step-${nextStep}-content`);
        
        if (nextStepElement && nextStepContent) {
            stepAtual.classList.remove('active');
            nextStepElement.classList.add('active');
            
            // Atualiza conteúdo
            document.querySelectorAll('.cadastro-step').forEach(step => {
                step.classList.remove('active');
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
            document.getElementById('btn-back').style.display = 'block';
            if (nextStep === 3) {
                document.getElementById('btn-next').style.display = 'none';
                document.getElementById('btn-submit').style.display = 'block';
            }
            
            showToast(`Passo ${nextStep} de 3`, 'info');
        }
    }, 300);
}

function passoAnteriorCadastro() {
    const stepAtualContent = document.querySelector('.cadastro-step.active');
    const stepNum = cadastroStep;
    
    if (stepNum > 1) {
        // Animação de transição
        stepAtualContent.style.opacity = '0';
        stepAtualContent.style.transform = 'translateX(20px)';
        
        setTimeout(() => {
            const prevStep = stepNum - 1;
            const prevStepElement = document.getElementById(`step-${prevStep}`);
            const prevStepContent = document.getElementById(`step-${prevStep}-content`);
            
            if (prevStepElement && prevStepContent) {
                // Atualiza passos
                document.querySelectorAll('.step').forEach(step => {
                    step.classList.remove('active');
                });
                prevStepElement.classList.add('active');
                
                // Atualiza conteúdo
                document.querySelectorAll('.cadastro-step').forEach(step => {
                    step.classList.remove('active');
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
                
                // Atualiza botões
                document.getElementById('btn-next').style.display = 'block';
                document.getElementById('btn-submit').style.display = 'none';
                if (prevStep === 1) {
                    document.getElementById('btn-back').style.display = 'none';
                }
                
                showToast(`Passo ${prevStep} de 3`, 'info');
            }
        }, 300);
    }
}

function finalizarCadastro() {
    console.log('✅ Finalizando cadastro de equipamento');
    
    // Coleta dados do formulário
    const serial = document.getElementById('cad-serial').value.trim();
    const modeloRadio = document.querySelector('input[name="modelo"]:checked');
    const modelo = modeloRadio ? modeloRadio.value : '';
    const ip = document.getElementById('cad-ip').value.trim();
    const macRede = document.getElementById('cad-mac-rede').value.trim();
    const setor = document.getElementById('cad-setor').value;
    const patrimonio = document.getElementById('cad-patrimonio').value.trim();
    const localizacao = document.getElementById('cad-localizacao').value.trim();
    const macBluetooth = document.getElementById('cad-mac-bluetooth').value.trim();
    const observacoes = document.getElementById('cad-observacoes').value.trim();
    
    // Validações finais
    if (!serial || !modelo || !ip || !macRede || !setor) {
        showToast('Preencha todos os campos obrigatórios', 'warning');
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
        selb: `SELB-${new Date().getFullYear()}-${String(equipamentosExemplo.length + 1).padStart(3, '0')}`,
        patrimonio: patrimonio || null,
        setor: setor,
        localizacao: localizacao || 'Localização não especificada',
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
    modalContent.classList.add('success-animation');
    
    setTimeout(() => {
        // Atualiza interface
        atualizarContadoresModelo();
        filtrarInventario();
        atualizarEstatisticas();
        inicializarGrafico();
        
        // Fecha modal
        fecharCadastro();
        modalContent.classList.remove('success-animation');
        
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
    document.getElementById('detail-tag').textContent = equipamento.tag;
    document.getElementById('detail-serial').textContent = equipamento.serial;
    document.getElementById('detail-modelo').textContent = equipamento.modelo;
    document.getElementById('detail-ip').textContent = equipamento.ip;
    document.getElementById('detail-mac-rede').textContent = equipamento.macRede;
    document.getElementById('detail-mac-bluetooth').textContent = equipamento.macBluetooth || 'N/A';
    document.getElementById('detail-selb').textContent = equipamento.selb;
    document.getElementById('detail-patrimonio').textContent = equipamento.patrimonio || 'N/A';
    document.getElementById('detail-setor').textContent = formatarSetor(equipamento.setor);
    document.getElementById('detail-localizacao').textContent = equipamento.localizacao;
    
    const statusElement = document.getElementById('detail-status');
    statusElement.textContent = equipamento.status === 'online' ? '● Online' : 
                                equipamento.status === 'offline' ? '● Offline' : '● Em Manutenção';
    statusElement.className = equipamento.status === 'online' ? 'status-online' : 
                             equipamento.status === 'offline' ? 'status-offline' : 'status-manutencao';
    
    document.getElementById('detail-ultima-checagem').textContent = formatarDataBonita(equipamento.ultimaChecagem);
    document.getElementById('detail-responsavel').textContent = equipamento.responsavel;
    document.getElementById('detail-fabricante').textContent = equipamento.fabricante;
    document.getElementById('detail-firmware').textContent = equipamento.firmware;
    document.getElementById('detail-contador').textContent = equipamento.contador.toLocaleString();
    document.getElementById('detail-garantia').textContent = new Date(equipamento.garantia).toLocaleDateString('pt-BR');
    document.getElementById('detail-observacoes').textContent = equipamento.observacoes;
    
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
    document.getElementById('detail-consumiveis').innerHTML = consumiveisHTML;
    
    // Atualiza botões de ação
    document.getElementById('detail-ping-btn').onclick = () => {
        fecharDetalhes();
        pingEquipamento(equipamento.ip, equipamento.tag);
    };
    
    document.getElementById('detail-edit-btn').onclick = () => {
        showToast('Edição em desenvolvimento', 'info');
    };
    
    document.getElementById('detail-history-btn').onclick = () => {
        showToast('Histórico em desenvolvimento', 'info');
    };
    
    // Mostra modal com animação
    const modal = document.getElementById('detalhes-modal');
    modal.style.display = 'flex';
    
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.querySelector('.modal-content').style.transform = 'translateY(0) scale(1)';
    }, 10);
}

function fecharDetalhes() {
    const modal = document.getElementById('detalhes-modal');
    modal.style.opacity = '0';
    modal.querySelector('.modal-content').style.transform = 'translateY(20px) scale(0.95)';
    
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
    if (document.getElementById('notifications-panel').classList.contains('show')) {
        renderNotifications();
    }
    
    // Mostra toast se não for apenas uma notificação silenciosa
    if (type !== 'info') {
        showToast(title, type);
    }
}

function toggleNotifications() {
    const panel = document.getElementById('notifications-panel');
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
    const unreadCount = notifications.filter(n => !n.read).length;
    
    if (badge) {
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

// ================= FUNÇÕES GLOBAIS EXPORTADAS =================
// Torna funções disponíveis globalmente para eventos onclick
window.toggleSidebar = toggleSidebar;
window.navigate = navigate;
window.toggleAuth = toggleAuth;
window.handleAuth = handleAuth;
window.togglePassword = togglePassword;
window.logout = logout;
window.handleGlobalSearch = handleGlobalSearch;
window.filtrarPorModelo = filtrarPorModelo;
window.filtrarInventario = filtrarInventario;
window.ordenarTabela = ordenarTabela;
window.mudarPagina = mudarPagina;
window.exportarDados = exportarDados;
window.abrirCadastroRapido = abrirCadastroRapido;
window.fecharCadastro = fecharCadastro;
window.proximoPassoCadastro = proximoPassoCadastro;
window.passoAnteriorCadastro = passoAnteriorCadastro;
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

console.log('🚀 AXIS - Sistema JavaScript carregado completamente!');

// ============================================
// FUNÇÃO PARA MOSTRAR/OCULTAR SEÇÕES
// ============================================
function showSection(sectionId) {
    // Esconde todas as seções
    document.querySelectorAll('.main-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostra a seção solicitada
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Fecha o menu lateral se estiver aberto
    const sidebar = document.querySelector('.glass-sidebar');
    const overlay = document.querySelector('.menu-overlay');
    if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
    }
}
