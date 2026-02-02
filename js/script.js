/* ============================================
   SISTEMA PRINCIPAL - VARIÁVEIS GLOBAIS
   ============================================ */
let currentUser = null;
let currentUserProfile = 'operador'; // Perfil do usuário logado
let activePage = 'page-home'; // Para controle de navegação

// ============================================
// 🔒 EXPORTAÇÃO IMEDIATA DE VARIÁVEIS GLOBAIS
// ============================================
if (typeof window.activePage === 'undefined') {
    window.activePage = activePage;
}
if (typeof window.currentUser === 'undefined') {
    window.currentUser = currentUser;
}
if (typeof window.currentUserProfile === 'undefined') {
    window.currentUserProfile = currentUserProfile;
}

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
        setor: "cx",
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
    // ZQ630 PLUS - Impressora Pagewide
    {
        serial: "30Q194506666",
        tag: "ZQ630-PAG-001",
        modelo: "ZQ630 PLUS",
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
        modelo: "ZQ630 PLUS",
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
    const modelos = ['ZT411', 'ZD421', 'ZQ630 PLUS'];
    const setores = [
        'internal-systems', 'lideranca', 'mhw', 'p2m', 'check-in', 'reciving', 'mz1', 'mz2', 'mz3',
        'inventario', 'cx', 'returns', 'packing-mono', 'packing-ptw', 'sauron', 'insumos',
        'docas-de-expedicao', 'linha-de-peixe-1', 'sorter', 'linha-de-peixe-2', 'rk', 'nt-rk',
        'qualidade', 'aquario-outbound', 'adm', 'gate', 'ambulatorio-interno', 'ambulatorio-externo',
        'sala-de-epi', 'er', 'rr', 'deposito-de-treinamento', 'hv'
    ];
    const statuses = ['online', 'online', 'online', 'offline', 'manutencao'];
    const responsaveis = ['Filipe da Silva', 'João Oliveira', 'Carlos Mendes', 'Ana Paula', 'Mariana Costa', 'Roberto Alves', 'Pedro Santos'];
    
    const modelo = modelos[Math.floor(Math.random() * modelos.length)];
    const setor = setores[Math.floor(Math.random() * setores.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const responsavel = responsaveis[Math.floor(Math.random() * responsaveis.length)];
    
    let prefixo = 'IND';
    if (modelo === 'ZD421') prefixo = 'DSK';
    if (modelo === 'ZQ630 PLUS') prefixo = 'PAG';
    
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
        ribbon: modelo === 'ZQ630 PLUS' ? null : Math.floor(Math.random() * 100),
        ink: modelo === 'ZQ630 PLUS' ? Math.floor(Math.random() * 100) : null,
        responsavel: responsavel,
        garantia: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    
    equipamentosExemplo.push(equipamento);
}

// ================= NOTIFICAÇÕES INICIAIS =================
// Notificações desabilitadas
let notifications = [];

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
    // Previne navegação acidental para fora do site
    window.addEventListener('beforeunload', (e) => {
        // Salva estado antes de sair
        const currentPage = activePage || localStorage.getItem('axis-current-page') || 'page-home';
        localStorage.setItem('axis-current-page', currentPage);
    });
    
    // Hash #page-* tem prioridade (ex.: "Voltar para Dashboard" em Manutenções → index.html#page-home)
    const savedPage = localStorage.getItem('axis-current-page');
    const hashPage = (window.location.hash || '').replace('#', '').trim();
    let pageToUse = savedPage && savedPage.startsWith('page-') ? savedPage : 'page-home';
    if (hashPage && hashPage.startsWith('page-')) {
        pageToUse = hashPage;
        localStorage.setItem('axis-current-page', hashPage);
    } else if (pageToUse && pageToUse.startsWith('page-')) {
        try {
            window.history.replaceState({ page: pageToUse }, '', (window.location.pathname || '/') + '#' + pageToUse);
        } catch (_) {}
    } else {
        localStorage.setItem('axis-current-page', 'page-home');
    }
    
    // Inicializa preferências de redução de movimento
    initReducedMotion();
    
    // Garante que o sistema comece na tela de login
    const authScreen = document.getElementById('auth-screen');
    const mainContent = document.getElementById('main-content');
    
    // Verifica se há usuário logado no localStorage
    // Verifica tanto 'true' quanto 'True' (case insensitive)
    const savedUser = localStorage.getItem('current_user');
    const isLoggedInRaw = localStorage.getItem('user_logged_in');
    const isLoggedIn = isLoggedInRaw === 'true' || isLoggedInRaw === 'True' || isLoggedInRaw === 'TRUE' || isLoggedInRaw === true;
    
    // Verificação adicional: se há usuário salvo mas não há flag de login, assume que está logado
    // (para casos onde a flag pode ter sido perdida mas o usuário ainda existe)
    const hasUserButNoFlag = savedUser && !isLoggedInRaw;
    if (hasUserButNoFlag) {
        localStorage.setItem('user_logged_in', 'true');
    }
    
    const finalIsLoggedIn = isLoggedIn || hasUserButNoFlag;
    
    if (savedUser && finalIsLoggedIn) {
        // Restaura usuário logado
        currentUser = savedUser;
        
        // Restaura perfil do usuário
        // Tenta obter o login salvo, senão tenta normalizar o nome
        const savedLogin = localStorage.getItem('current_user_login');
        let userLoginNormalizado = savedLogin;
        
        if (!userLoginNormalizado) {
            // Fallback: tenta normalizar o nome salvo
            userLoginNormalizado = savedUser.toLowerCase().replace(/\s+/g, '_');
        }
        const userKey = 'db_' + userLoginNormalizado;
        const userDataRaw = localStorage.getItem(userKey);
        if (userDataRaw) {
            try {
                const userData = JSON.parse(userDataRaw);
                currentUserProfile = userData.perfil || 'operador';
            } catch (e) {
                currentUserProfile = 'operador';
            }
        } else {
            currentUserProfile = 'operador';
        }
        
        // Usuário já está logado, mostra conteúdo principal
        if (authScreen) {
            authScreen.style.display = 'none';
            authScreen.style.opacity = '0';
        }
        if (mainContent) {
            mainContent.style.display = 'block';
            mainContent.style.opacity = '1';
        }
        
        // Atualiza display do nome
        const userDisplay = document.getElementById('user-display-name');
        if (userDisplay) {
            userDisplay.innerText = currentUser;
        }
        
        // Mostra menu de administração se for admin
        const menuAdmin = document.getElementById('menu-admin');
        if (menuAdmin) {
            if (currentUserProfile === 'admin') {
                menuAdmin.style.display = 'block';
            } else {
                menuAdmin.style.display = 'none';
            }
        }
        
        // Restaura a página onde o usuário estava antes de recarregar
        // Verifica se é um recarregamento (não primeiro login)
        const wasJustLoggedIn = sessionStorage.getItem('just_logged_in') === 'true';
        
        if (!wasJustLoggedIn) {
            const savedPage = localStorage.getItem('axis-current-page');
            if (savedPage && savedPage.startsWith('page-')) {
                // Aguarda um pouco para garantir que o DOM está pronto
                activePage = savedPage;
                // Força a navegação mesmo se a função não estiver pronta
                const navigateToPage = function(pageId) {
                    const targetSection = document.getElementById(pageId);
                    if (targetSection) {
                        document.querySelectorAll('.main-section').forEach(s => {
                            s.classList.remove('active');
                            s.style.display = 'none';
                        });
                        targetSection.classList.add('active');
                        targetSection.style.display = 'block';
                    }
                };
                
                setTimeout(() => {
                    if (typeof navigate === 'function') {
                        try {
                            navigate(savedPage);
                        } catch (e) {
                            navigateToPage(savedPage);
                        }
                    } else {
                        navigateToPage(savedPage);
                    }
                }, 300);
            } else {
                // Sem página salva: sempre Home (nunca Inventário)
                activePage = 'page-home';
                localStorage.setItem('axis-current-page', 'page-home');
                const goHome = function() {
                    const homeSection = document.getElementById('page-home');
                    if (homeSection) {
                        document.querySelectorAll('.main-section').forEach(s => {
                            s.classList.remove('active');
                            s.style.display = 'none';
                        });
                        homeSection.classList.add('active');
                        homeSection.style.display = 'block';
                    }
                };
                setTimeout(() => {
                    if (typeof navigate === 'function') {
                        try { navigate('page-home'); } catch (e) { goHome(); }
                    } else { goHome(); }
                }, 300);
            }
        } else {
            // Primeiro login, remove a flag e vai para home
            sessionStorage.removeItem('just_logged_in');
            activePage = 'page-home';
            localStorage.setItem('axis-current-page', 'page-home');
            setTimeout(() => {
                if (typeof navigate === 'function') {
                    navigate('page-home');
                } else {
                    // Fallback direto
                    const homeSection = document.getElementById('page-home');
                    if (homeSection) {
                        document.querySelectorAll('.main-section').forEach(s => {
                            s.classList.remove('active');
                            s.style.display = 'none';
                        });
                        homeSection.classList.add('active');
                        homeSection.style.display = 'block';
                    }
                }
            }, 300);
        }
    } else {
        // Não há usuário logado, mostra tela de login
        if (authScreen) {
            authScreen.style.display = 'flex';
            authScreen.style.opacity = '1';
        }
        if (mainContent) {
            mainContent.style.display = 'none';
            mainContent.style.opacity = '0';
        }
        currentUser = null;
        currentUserProfile = 'operador';
    }

    // Garantir que, ao recarregar, usuário permaneça logado (verificação tardia + pageshow)
    function persistLoginCheck() {
        var raw = localStorage.getItem('user_logged_in');
        var ok = (raw === 'true' || raw === 'True' || raw === 'TRUE');
        if (!ok || !localStorage.getItem('current_user')) return;
        var au = document.getElementById('auth-screen');
        var mn = document.getElementById('main-content');
        if (!au || !mn) return;
        au.style.display = 'none';
        au.style.opacity = '0';
        mn.style.display = 'block';
        mn.style.opacity = '1';
        currentUser = localStorage.getItem('current_user');
        var ud = document.getElementById('user-display-name');
        if (ud) ud.innerText = currentUser;
        var ma = document.getElementById('menu-admin');
        if (ma) {
            var login = localStorage.getItem('current_user_login');
            var key = 'db_' + (login || (currentUser || '').toLowerCase().replace(/\s+/g, '_'));
            try {
                var d = JSON.parse(localStorage.getItem(key) || '{}');
                if (d.perfil === 'admin') ma.style.display = 'block';
                else ma.style.display = 'none';
            } catch (_) { ma.style.display = 'none'; }
        }
        var sp = localStorage.getItem('axis-current-page') || 'page-home';
        if (typeof navigate === 'function') { try { navigate(sp); } catch (_) {} }
    }
    window.addEventListener('load', persistLoginCheck);
    window.addEventListener('pageshow', function (e) {
        if (e.persisted) persistLoginCheck();
    });
    
    // Inicializa tema salvo
    initTheme();
    
    // Adiciona FAB button
    initFAB();
    
    // Garante que FAB esteja escondido inicialmente (só aparece na home)
    const fabContainer = document.getElementById('fab-container');
    if (fabContainer) {
        fabContainer.style.display = 'none';
    }
    
    // Configura listeners de teclado
    initKeyboardShortcuts();
    
    // Inicia simulação de tempo real
    startRealTimeSimulation();
    
    // Inicializa tooltips
    initTooltips();
    
    // Configura eventos de formulário
    initFormEvents();
    
    // Garante que o botão de login funcione
    setupAuthButton();
    
    // Configura listeners para os cards da home
    setupHomeCards();
    
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
    console.log('🔄 toggleSidebar chamado');
    const sidebar = document.getElementById('side-menu');
    const overlay = document.getElementById('menu-overlay');
    const menuBtn = document.querySelector('.menu-trigger-ios');
    
    if (!sidebar) {
        console.error('❌ Menu lateral não encontrado!');
        return;
    }
    
    if (!overlay) {
        console.error('❌ Overlay do menu não encontrado!');
        return;
    }
    
    const isOpen = sidebar.classList.contains('open');
    
    if (isOpen) {
        // Fecha o menu
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        document.body.classList.remove('menu-open');
        if (menuBtn) menuBtn.classList.remove('active');
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
        console.log('✅ Menu fechado');
    } else {
        // Abre o menu (classe no body remove linha em L)
        document.body.classList.add('menu-open');
        overlay.style.opacity = '1';
        overlay.style.display = 'block';
        overlay.classList.add('active');
        sidebar.classList.add('open');
        if (menuBtn) menuBtn.classList.add('active');
        sidebar.style.display = 'flex';
        sidebar.style.visibility = 'visible';
        sidebar.style.opacity = '1';
        console.log('✅ Menu aberto');
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

// Overlay do menu: fechado via setupMenuOverlay (index) para evitar double-toggle

// ================= CONFIGURAÇÃO DOS CARDS DA HOME =================
function setupHomeCards() {
    console.log('🔧 Configurando cards da home...');
    
    // Mapeamento de cards para páginas
    const cardMappings = {
        'page-inventario': 'Inventário',
        'page-rondas': 'Rondas',
        'page-suporte': 'Suporte',
        'page-configuracoes': 'Configurações'
    };
    
    // Adiciona listeners a todos os cards que usam navigate
    Object.keys(cardMappings).forEach(pageId => {
        const cards = document.querySelectorAll(`.mod-card[onclick*="${pageId}"]`);
        cards.forEach(card => {
            // Remove listeners antigos
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
            
            // Adiciona listener direto
            newCard.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log(`🖱️ Card clicado: ${cardMappings[pageId]}`);
                
                if (typeof navigate === 'function') {
                    navigate(pageId);
                } else {
                    console.error('❌ Função navigate não encontrada!');
                    // Fallback: mostra a seção diretamente
                    const targetSection = document.getElementById(pageId);
                    if (targetSection) {
                        document.querySelectorAll('.main-section').forEach(s => s.classList.remove('active'));
                        targetSection.classList.add('active');
                    }
                }
            });
            
            // Adiciona estilo de cursor
            newCard.style.cursor = 'pointer';
        });
    });
    
    console.log('✅ Cards da home configurados');
}

// ================= 3. NAVEGAÇÃO ENTRE PÁGINAS =================
function navigate(pageId) {
    // Exporta IMEDIATAMENTE para garantir disponibilidade
    window.navigate = navigate;
    
    console.log(`📍 Navegando para: ${pageId}`);
    
    // Atualiza página ativa
    activePage = pageId;
    // Marca página atual no body (para regras de CSS, ex: WhatsApp apenas na home)
    if (document && document.body) {
        document.body.setAttribute('data-current-page', pageId || '');
    }
    
    // Salva a página atual no localStorage para restaurar após recarregar
    // Apenas salva se for uma página interna (não página externa)
    if (pageId && typeof pageId === 'string' && pageId.startsWith('page-')) {
        localStorage.setItem('axis-current-page', pageId);
        activePage = pageId; // Atualiza variável global
        console.log(`💾 Página salva no localStorage: ${pageId}`);
        
        // Atualiza a hash da URL sem recarregar a página
        if (window.history && window.history.pushState) {
            try {
                const currentPath = window.location.pathname || '/';
                const newUrl = currentPath + '#' + pageId;
                window.history.pushState({ page: pageId }, '', newUrl);
                console.log(`🔗 URL atualizada: ${newUrl}`);
            } catch (e) {
                console.warn('⚠️ Erro ao atualizar URL:', e);
                // Fallback: apenas atualiza hash sem pushState
                window.location.hash = pageId;
            }
        } else {
            // Fallback: usa hash diretamente
            window.location.hash = pageId;
        }
    } else {
        console.log(`⚠️ Página não salva (não é página interna): ${pageId}`);
    }
    
    // 1. Oculta todas as seções
    const sections = document.querySelectorAll('.main-section');
    sections.forEach(s => {
        s.classList.remove(CSSClasses.active);
        s.style.display = 'none'; // Garante que todas sejam ocultadas
    });
    console.log(`🔒 ${sections.length} seções ocultadas`);

    // 2. Ativa a página alvo
    const target = document.getElementById(pageId);
    if (target) {
        target.classList.add(CSSClasses.active);
        target.style.display = 'block'; // Garante que a seção seja exibida
        console.log(`✅ Seção ${pageId} ativada e exibida`);
        
        // Força reflow para garantir que a mudança seja aplicada
        target.offsetHeight;
    } else {
        console.error(`❌ Seção ${pageId} não encontrada no DOM!`);
        // Lista todas as seções disponíveis para debug
        const allSections = document.querySelectorAll('.main-section');
        const sectionIds = Array.from(allSections).map(s => s.id).filter(id => id);
        console.log('📋 Seções disponíveis:', sectionIds);
        
        // Tenta encontrar a seção home como fallback
        const homeSection = document.getElementById('page-home');
        if (homeSection) {
            console.log('⚠️ Usando home como fallback');
            homeSection.classList.add(CSSClasses.active);
            homeSection.style.display = 'block';
        }
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

    // 5. Mostrar/esconder elementos apenas na home
    const navWelcomeText = document.getElementById('nav-welcome-text');
    const fabContainer = document.getElementById('fab-container');
    const whatsappButton = document.getElementById('whatsapp-float-button');
    
    if (pageId === 'page-home') {
        // Mostra "BEM-VINDO AO AXIS" e bola do WhatsApp apenas na home
        if (navWelcomeText) {
            navWelcomeText.style.display = 'block';
        }
        if (fabContainer) {
            fabContainer.style.display = 'block';
        }
        if (whatsappButton) {
            whatsappButton.style.display = 'block';
        }
    } else {
        // Esconde em outras páginas
        if (navWelcomeText) {
            navWelcomeText.style.display = 'none';
        }
        if (fabContainer) {
            fabContainer.style.display = 'none';
        }
        if (whatsappButton) {
            whatsappButton.style.display = 'none';
        }
    }

    // 6. Ações específicas por página
    switch(pageId) {
        case 'page-inventario':
            inicializarInventario();
            break;
        case 'page-home':
            loadDashboardData();
            break;
        case 'page-rondas':
            carregarRondas();
            break;
        case 'page-suporte':
            carregarTickets();
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
// ================= CONFIGURAÇÃO DO BOTÃO DE AUTENTICAÇÃO =================
function setupAuthButton() {
    const authButton = document.getElementById('auth-main-btn');
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    
    // Adiciona listener ao botão
    if (authButton) {
        authButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔘 Botão de login clicado via addEventListener');
            if (typeof handleAuth === 'function') {
                handleAuth();
            } else {
                console.error('❌ Função handleAuth não encontrada!');
                alert('Erro: Função de autenticação não encontrada. Recarregue a página.');
            }
        });
        console.log('✅ Listener do botão de login configurado');
    } else {
        console.warn('⚠️ Botão de login não encontrado');
    }
    
    // Adiciona listener para Enter no campo de senha
    if (passwordField) {
        passwordField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                e.preventDefault();
                console.log('⌨️ Enter pressionado no campo de senha');
                if (typeof handleAuth === 'function') {
                    handleAuth();
                }
            }
        });
    }
    
    // Adiciona listener para Enter no campo de usuário
    if (usernameField) {
        usernameField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                e.preventDefault();
                // Foca no campo de senha
                if (passwordField) {
                    passwordField.focus();
                }
            }
        });
    }
}

// Cria usuário administrador padrão se não existir
function inicializarUsuarioAdmin() {
    const adminKey = 'db_admin_filipe_silva';
    const existingUser = localStorage.getItem(adminKey);
    
    if (!existingUser) {
        const adminData = {
            name: 'Filipe da Silva',
            pass: '123456',
            dataCadastro: new Date().toISOString(),
            perfil: 'admin',
            ultimoAcesso: new Date().toISOString()
        };
        localStorage.setItem(adminKey, JSON.stringify(adminData));
        console.log('✅ Usuário administrador criado: admin_filipe_silva / 123456');
    } else {
        console.log('✅ Usuário administrador já existe no localStorage');
        try {
            const userData = JSON.parse(existingUser);
            console.log('📋 Dados do admin:', { name: userData.name, perfil: userData.perfil });
        } catch (e) {
            console.error('❌ Erro ao ler dados do admin:', e);
        }
    }
}

// Inicializa admin ao carregar (garante que seja executado imediatamente)
if (typeof window !== 'undefined') {
    // Executa imediatamente se já estiver no DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarUsuarioAdmin);
    } else {
        inicializarUsuarioAdmin();
    }
} else {
    inicializarUsuarioAdmin();
}

function handleAuth() {
    console.log('🔐 ========== INICIANDO AUTENTICAÇÃO ==========');
    console.log('🔐 Processando autenticação...');
    
    // Garante que o usuário admin existe
    inicializarUsuarioAdmin();
    
    const userField = document.getElementById('username');
    const passField = document.getElementById('password');
    
    if (!userField || !passField) {
        console.error('❌ Campos de login não encontrados!');
        alert('Erro: Campos de login não encontrados. Recarregue a página.');
        return;
    }
    
    const userInput = userField.value.trim();
    const pass = passField.value;

    if (!userInput || !pass) {
        console.log('⚠️ Campos vazios');
        if (typeof showToast === 'function') {
            showToast('Preencha todos os campos!', 'warning');
        } else {
            alert('Preencha todos os campos!');
        }
        return;
    }
    
    console.log('✅ Campos preenchidos, validando usuário...');
    console.log('📝 Usuário digitado:', userInput);
    console.log('🔑 Senha digitada:', pass ? '***' : '(vazia)');

    // Normaliza o login (remove espaços, converte para minúsculas)
    const loginNormalizado = userInput.toLowerCase().replace(/\s+/g, '_');
    const dbKey = 'db_' + loginNormalizado;
    console.log('🔍 Procurando usuário com chave:', dbKey);
    
    // Lista todas as chaves do localStorage para debug
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith('db_'));
    console.log('📋 Todas as chaves db_ no localStorage:', allKeys);
    
    const dbRaw = localStorage.getItem(dbKey);
    console.log('📦 Dados encontrados no localStorage:', dbRaw ? 'Sim' : 'Não');
    
    if (dbRaw) {
        console.log('📦 Conteúdo bruto:', dbRaw.substring(0, 100) + '...');
    }
    
    if (dbRaw) {
        try {
            const db = JSON.parse(dbRaw);
            console.log('✅ Dados do usuário carregados:', { name: db.name, perfil: db.perfil, pass: db.pass ? '***' : '(vazia)' });
            
            if (db.pass === pass) {
                console.log('✅ SENHA CORRETA - INICIANDO LOGIN');
                // SUCESSO NO LOGIN
                currentUser = db.name || userInput;
                currentUserProfile = db.perfil || 'operador';
                console.log('👤 Usuário logado:', currentUser);
                console.log('👑 Perfil:', currentUserProfile);
                
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
            
                // Salva estado de login
                localStorage.setItem('current_user', currentUser);
                localStorage.setItem('current_user_login', loginNormalizado); // Salva o login também
                localStorage.setItem('user_logged_in', 'true');
                // Marca que acabou de fazer login (para não restaurar página antiga)
                sessionStorage.setItem('just_logged_in', 'true');
                console.log('✅ Estado de login salvo no localStorage');
                console.log('   Nome:', currentUser);
                console.log('   Login:', loginNormalizado);
                
                setTimeout(() => {
                    if (authScreen) {
                        authScreen.style.display = 'none';
                        console.log('✅ Tela de login ocultada');
                    }
                    if (mainContent) {
                        mainContent.style.display = 'block';
                        mainContent.style.opacity = '0';
                        mainContent.style.transform = 'translateY(20px)';
                        console.log('✅ Conteúdo principal exibido');
                        
                        setTimeout(() => {
                            mainContent.style.opacity = '1';
                            mainContent.style.transform = 'translateY(0)';
                            console.log('✅ Animação de entrada concluída');
                        }, 50);
                    } else {
                        console.error('❌ mainContent não encontrado!');
                    }
                }, 300);
            
            // Atualiza último acesso do usuário
            db.ultimoAcesso = new Date().toISOString();
            localStorage.setItem('db_' + loginNormalizado, JSON.stringify(db));
            
            // Registra login
            const loginData = {
                usuario: loginNormalizado,
                data: new Date().toISOString(),
                ip: '192.168.1.1' // Simulado
            };
            localStorage.setItem('last_login', JSON.stringify(loginData));
            try {
                const audit = JSON.parse(localStorage.getItem('axis_audit_log') || '[]');
                audit.push({ type: 'login', user: loginNormalizado, date: loginData.data });
                localStorage.setItem('axis_audit_log', JSON.stringify(audit.slice(-100)));
            } catch (_) {}
            
                if (typeof showBemVindoModal === 'function') {
                    showBemVindoModal(currentUser);
                }
                
                // Ao fazer login: sempre vai para Início (Home)
                localStorage.setItem('axis-current-page', 'page-home');
                if (typeof navigate === 'function') {
                    navigate('page-home');
                }
                
            } else {
                console.log('❌ Senha incorreta');
                // Animação de erro
                passField.classList.add('shake-animation');
                setTimeout(() => passField.classList.remove('shake-animation'), 500);
                if (typeof showToast === 'function') {
                    showToast('Senha incorreta.', 'warning');
                } else {
                    alert('Senha incorreta.');
                }
            }
        } catch (error) {
            console.error('❌ Erro ao processar dados do usuário:', error);
            if (typeof showToast === 'function') {
                showToast('Erro ao processar dados do usuário.', 'error');
            } else {
                alert('Erro ao processar dados do usuário.');
            }
        }
    } else {
        console.log('❌ Usuário não encontrado no localStorage');
        console.log('🔍 Chaves disponíveis no localStorage:', Object.keys(localStorage).filter(k => k.startsWith('db_')));
        userField.classList.add('shake-animation');
        setTimeout(() => userField.classList.remove('shake-animation'), 500);
        if (typeof showToast === 'function') {
            showToast('Usuário não encontrado.', 'warning');
        } else {
            alert('Usuário não encontrado. Verifique se o usuário foi criado corretamente.');
        }
    }
}

// ================= 5. FUNCIONALIDADES TÉCNICAS BÁSICAS =================
function togglePassword() {
    console.log('👁️ togglePassword chamado');
    const input = document.getElementById('password');
    const icon = document.getElementById('eye-icon');
    
    if (!input) {
        console.error('❌ Campo de senha não encontrado!');
        return;
    }
    if (!icon) {
        console.error('❌ Ícone do olho não encontrado!');
        return;
    }
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.innerText = '🙈';
        icon.title = 'Ocultar senha';
        icon.classList.add('active');
        console.log('✅ Senha visível');
    } else {
        input.type = 'password';
        icon.innerText = '👁️';
        icon.title = 'Mostrar senha';
        icon.classList.remove('active');
        console.log('✅ Senha oculta');
    }
}

function fecharModalSair() {
    const wrap = document.getElementById('modal-sair');
    if (wrap) {
        wrap.style.display = 'none';
    }
    document.body.classList.remove('modal-sair-open');
}

function execLogout() {
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
        try {
            const audit = JSON.parse(localStorage.getItem('axis_audit_log') || '[]');
            audit.push({ type: 'logout', user: currentUser || '-', date: logoutData.data });
            localStorage.setItem('axis_audit_log', JSON.stringify(audit.slice(-100)));
        } catch (_) {}
        
        // Limpa dados do usuário
        currentUser = null;
        currentUserProfile = 'operador';
        localStorage.removeItem('current_user');
        localStorage.removeItem('current_user_login');
        localStorage.removeItem('user_logged_in');
        localStorage.removeItem('axis-current-page'); // Limpa também a página salva
        sessionStorage.removeItem('just_logged_in');
        
        // Mostra tela de login e esconde conteúdo principal
        const authScreen = document.getElementById('auth-screen');
        const mainContentEl = document.getElementById('main-content');
        
        if (authScreen) {
            authScreen.style.display = 'flex';
        }
        if (mainContentEl) {
            mainContentEl.style.display = 'none';
        }
        
        // Limpa campos do formulário
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        if (usernameInput) usernameInput.value = '';
        if (passwordInput) passwordInput.value = '';
        
        // Foca no campo de usuário
        if (usernameInput) {
            setTimeout(() => {
                usernameInput.focus();
            }, 100);
        }
    }, 300);
}

function logout() {
    const wrap = document.getElementById('modal-sair');
    if (!wrap) {
        if (typeof confirm !== 'undefined' && confirm('Deseja realmente sair do sistema AXIS?')) {
            execLogout();
        }
        return;
    }
    wrap.style.display = 'flex';
    document.body.classList.add('modal-sair-open');
}

function setupModalSair() {
    const wrap = document.getElementById('modal-sair');
    if (!wrap) return;
    const overlay = wrap.querySelector('.modal-sair-overlay');
    const btnOk = document.getElementById('modal-sair-ok');
    const btnCancel = document.getElementById('modal-sair-cancel');
    const glass = wrap.querySelector('.modal-sair-glass');
    if (overlay) overlay.addEventListener('click', fecharModalSair);
    if (btnOk) btnOk.addEventListener('click', function () {
        fecharModalSair();
        execLogout();
    });
    if (btnCancel) btnCancel.addEventListener('click', fecharModalSair);
    if (glass) glass.addEventListener('click', function (e) { e.stopPropagation(); });
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupModalSair);
} else {
    setupModalSair();
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
    console.log('📦 Inicializando inventário...');
    window.inicializarInventario = inicializarInventario;

    // Carrega dados da lista completa (quando tiver dados reais, virão da API/backend)
    const base = Array.isArray(equipamentosExemplo) && equipamentosExemplo.length > 0
        ? equipamentosExemplo
        : [];
    inventarioData = [...base];

    // Reseta os filtros do painel para "Todos", para não deixar filtro ativo de outra sessão
    const panelModelo = document.getElementById('ucs-filtro-panel-modelo');
    const panelSetor = document.getElementById('ucs-filtro-panel-setor');
    if (panelModelo) panelModelo.value = '';
    if (panelSetor) panelSetor.value = '';
    if (typeof syncSetorSelectorFromSelect === 'function') {
        syncSetorSelectorFromSelect('ucs-filtro-panel-modelo', 'ucs-filtro-panel-modelo-trigger', 'ucs-filtro-panel-modelo-dropdown', 'Todos');
        syncSetorSelectorFromSelect('ucs-filtro-panel-setor', 'ucs-filtro-panel-setor-trigger', 'ucs-filtro-panel-setor-dropdown');
    }

    renderizarTabela();
    initExportDropdown();
    inicializarGrafico();

    console.log(`✅ Inventário inicializado com ${inventarioData.length} equipamentos`);
}

function atualizarContadoresModelo() {
    const total = equipamentosExemplo.length;
    const zt411 = equipamentosExemplo.filter(e => e.modelo === 'ZT411').length;
    const zd421 = equipamentosExemplo.filter(e => e.modelo === 'ZD421').length;
    const zq630 = equipamentosExemplo.filter(e => e.modelo === 'ZQ630 PLUS').length;
    
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
    window.filtrarInventario = filtrarInventario;

    const paisFiltro = document.getElementById('ucs-filtro-pais')?.value || '';
    const nodoFiltro = document.getElementById('ucs-filtro-nodo')?.value || '';
    const dispositivoFiltro = document.getElementById('ucs-filtro-dispositivo')?.value || '';
    const modeloPanel = document.getElementById('ucs-filtro-panel-modelo')?.value || '';
    const setorPanel = document.getElementById('ucs-filtro-panel-setor')?.value || '';
    const busca = '';

    let filtrados = equipamentosExemplo.filter(eqp => {
        if (busca) {
            const camposBusca = [
                eqp.serial?.toLowerCase(),
                eqp.tag?.toLowerCase(),
                eqp.nome?.toLowerCase(),
                eqp.nombre?.toLowerCase(),
                eqp.ip?.toLowerCase(),
                eqp.setor?.toLowerCase(),
                eqp.localizacao?.toLowerCase()
            ];
            if (!camposBusca.some(campo => campo && campo.includes(busca))) return false;
        }
        if (modeloPanel && (eqp.modelo || '').toLowerCase() !== modeloPanel.toLowerCase()) return false;
        if (setorPanel && (eqp.setor || '').toLowerCase() !== setorPanel.toLowerCase()) return false;
        return true;
    });

    console.log(`✅ ${filtrados.length} equipamentos (modelo=${modeloPanel || 'todos'}, setor=${setorPanel || 'todos'})`);
    inventarioData = filtrados;
    currentPage = 1;
    renderizarTabela();
}

// Função para resetar filtros
function resetarFiltrosInventario() {
    console.log('🔄 Resetando filtros...');
    
    // Exporta IMEDIATAMENTE (sempre)
    window.resetarFiltrosInventario = resetarFiltrosInventario;
    
    const paisSelect = document.getElementById('ucs-filtro-pais');
    const nodoSelect = document.getElementById('ucs-filtro-nodo');
    const dispositivoSelect = document.getElementById('ucs-filtro-dispositivo');
    
    if (paisSelect) paisSelect.value = '';
    if (nodoSelect) nodoSelect.value = '';
    if (dispositivoSelect) dispositivoSelect.value = '';
    
    // Aplica filtro vazio para mostrar todos
    if (typeof filtrarInventario === 'function') {
        filtrarInventario();
    } else {
        console.error('❌ filtrarInventario não está disponível');
    }
    
    console.log('✅ Filtros resetados');
}

// ================= PAINEL FILTRAR (abre para baixo, acima do conteúdo) =================
function toggleFiltroPanel() {
    const wrap = document.getElementById('ucs-filter-dropdown');
    if (!wrap) return;
    const isOpen = wrap.classList.toggle('is-open');
    wrap.querySelector('#ucs-btn-filter')?.setAttribute('aria-expanded', isOpen);
    if (isOpen) {
        setTimeout(() => document.addEventListener('click', fecharFiltroPanelAoClicarFora), 0);
    } else {
        document.removeEventListener('click', fecharFiltroPanelAoClicarFora);
    }
}

function fecharFiltroPanel() {
    const wrap = document.getElementById('ucs-filter-dropdown');
    if (wrap) {
        wrap.classList.remove('is-open');
        wrap.querySelector('#ucs-btn-filter')?.setAttribute('aria-expanded', 'false');
    }
    document.removeEventListener('click', fecharFiltroPanelAoClicarFora);
}

function fecharFiltroPanelAoClicarFora(e) {
    const wrap = document.getElementById('ucs-filter-dropdown');
    if (!wrap || wrap.contains(e.target)) return;
    fecharFiltroPanel();
}

function initFiltroPanel() {
    const btnFiltrar = document.getElementById('ucs-btn-filter');
    const btnClose = document.getElementById('ucs-filter-close');
    const btnAplicar = document.getElementById('ucs-filter-aplicar');
    const btnLimpar = document.getElementById('ucs-filter-limpar');
    if (!btnFiltrar) return;

    btnFiltrar.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFiltroPanel();
    });
    if (btnClose) btnClose.addEventListener('click', () => fecharFiltroPanel());
    if (btnAplicar) {
        btnAplicar.addEventListener('click', () => {
            if (typeof filtrarInventario === 'function') filtrarInventario();
            fecharFiltroPanel();
        });
    }
    if (btnLimpar) {
        btnLimpar.addEventListener('click', () => {
            if (typeof resetarFiltrosInventario === 'function') resetarFiltrosInventario();
            const modelo = document.getElementById('ucs-filtro-panel-modelo');
            const setor = document.getElementById('ucs-filtro-panel-setor');
            if (modelo) modelo.value = '';
            if (setor) setor.value = '';
            syncSetorSelectorFromSelect('ucs-filtro-panel-modelo', 'ucs-filtro-panel-modelo-trigger', 'ucs-filtro-panel-modelo-dropdown', 'Todos');
            syncSetorSelectorFromSelect('ucs-filtro-panel-setor', 'ucs-filtro-panel-setor-trigger', 'ucs-filtro-panel-setor-dropdown');
            fecharFiltroPanel();
        });
    }
}

// ================= SELETORES CUSTOMIZADOS (Setor e Modelo - mesmo design) =================
function syncSetorSelectorFromSelect(selectId, triggerId, dropdownId, defaultLabel) {
    const select = document.getElementById(selectId);
    const trigger = document.getElementById(triggerId);
    const dropdown = document.getElementById(dropdownId);
    if (!select || !trigger || !dropdown) return;
    const val = select.value || '';
    const opt = select.querySelector(`option[value="${val}"]`);
    const fallback = defaultLabel !== undefined ? defaultLabel : (selectId === 'cad-setor' ? 'Selecione um setor' : 'Todos');
    trigger.textContent = opt ? opt.textContent.trim() : fallback;
    trigger.setAttribute('aria-expanded', 'false');
    dropdown.classList.remove('is-open');
    dropdown.setAttribute('aria-hidden', 'true');
    dropdown.querySelectorAll('.setor-selector-option').forEach(function (o) {
        o.classList.toggle('selected', (o.getAttribute('data-value') || '') === val);
    });
}

function closeOtherFilterDropdowns(exceptDropdown) {
    const panel = exceptDropdown.closest('#ucs-filter-panel');
    if (!panel) return;
    panel.querySelectorAll('.setor-selector-dropdown.is-open').forEach(function (d) {
        if (d === exceptDropdown) return;
        d.classList.remove('is-open');
        d.setAttribute('aria-hidden', 'true');
        const triggerId = d.id.replace('-dropdown', '-trigger');
        const t = document.getElementById(triggerId);
        if (t) t.setAttribute('aria-expanded', 'false');
    });
}

function initSetorSelector(selectId, triggerId, dropdownId, placeholderTodos) {
    const select = document.getElementById(selectId);
    const trigger = document.getElementById(triggerId);
    const dropdown = document.getElementById(dropdownId);
    if (!select || !trigger || !dropdown) return;

    function open() {
        closeOtherFilterDropdowns(dropdown);
        dropdown.classList.add('is-open');
        dropdown.setAttribute('aria-hidden', 'false');
        trigger.setAttribute('aria-expanded', 'true');
        const val = select.value || '';
        dropdown.querySelectorAll('.setor-selector-option').forEach(function (o) {
            o.classList.toggle('selected', (o.getAttribute('data-value') || '') === val);
        });
    }
    function close() {
        dropdown.classList.remove('is-open');
        dropdown.setAttribute('aria-hidden', 'true');
        trigger.setAttribute('aria-expanded', 'false');
    }

    trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        if (dropdown.classList.contains('is-open')) close(); else open();
    });

    dropdown.querySelectorAll('.setor-selector-option').forEach(function (opt) {
        opt.addEventListener('click', function () {
            const value = opt.getAttribute('data-value') || '';
            select.value = value;
            trigger.textContent = opt.textContent.trim();
            dropdown.querySelectorAll('.setor-selector-option').forEach(function (o) { o.classList.remove('selected'); });
            opt.classList.add('selected');
            close();
            select.dispatchEvent(new Event('change', { bubbles: true }));
        });
    });

    document.addEventListener('click', function closeOnOutside(e) {
        if (!dropdown.contains(e.target) && e.target !== trigger) close();
    });

    syncSetorSelectorFromSelect(selectId, triggerId, dropdownId, placeholderTodos);
}

function initSetorSelectors() {
    initSetorSelector('ucs-filtro-panel-setor', 'ucs-filtro-panel-setor-trigger', 'ucs-filtro-panel-setor-dropdown', 'Todos');
    initSetorSelector('cad-setor', 'cad-setor-trigger', 'cad-setor-dropdown', 'Selecione um setor');
    initSetorSelector('ucs-filtro-panel-modelo', 'ucs-filtro-panel-modelo-trigger', 'ucs-filtro-panel-modelo-dropdown', 'Todos');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        initFiltroPanel();
        initSetorSelectors();
    });
} else {
    initFiltroPanel();
    initSetorSelectors();
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
    
    // Exporta IMEDIATAMENTE (sempre)
    window.renderizarTabela = renderizarTabela;
    
    // Atualiza contador total
    const totalCount = document.getElementById('ucs-total-count');
    if (totalCount) {
        totalCount.textContent = `${inventarioData.length} EM TOTAL`;
    }
    
    let tbody = document.getElementById('ucs-inventory-data');
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
        const setorExibido = eqp.setor ? (typeof formatarSetor === 'function' ? formatarSetor(eqp.setor) : eqp.setor) : '-';
        const alocacao = eqp.localizacao || eqp.local || eqp.descricao || eqp.descripcion || (eqp.bancada ? `Bancada ${eqp.bancada}` : '-');
        
        html += `
            <tr data-serial="${eqp.serial}" data-tag="${eqp.tag}">
                <td>${eqp.serial || eqp.id || '-'}</td>
                <td>${eqp.ip || '-'}</td>
                <td>${eqp.modelo || '-'}</td>
                <td>${setorExibido}</td>
                <td>${alocacao}</td>
                <td>
                    <div class="ucs-controls-inline">
                        <button type="button" class="ucs-btn-inline ucs-btn-editar" onclick="editarEquipamento('${(eqp.tag || '').replace(/'/g, "\\'")}')" title="Editar">✏️ Editar</button>
                        <button type="button" class="ucs-btn-inline ucs-btn-detalhes" onclick="verDetalhes('${(eqp.tag || '').replace(/'/g, "\\'")}')" title="Ver Detalhes">👁️ Ver Detalhes</button>
                        <button type="button" class="ucs-btn-inline ucs-btn-excluir" onclick="excluirEquipamento('${(eqp.tag || '').replace(/'/g, "\\'")}')" title="Excluir">🗑️ Excluir</button>
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
    abrirModalEditar(tag);
}

function excluirEquipamento(tag) {
    const overlay = document.getElementById('confirm-excluir-overlay');
    const msg = document.getElementById('confirm-excluir-message');
    const btnCancelar = document.getElementById('confirm-excluir-cancelar');
    const btnExcluir = document.getElementById('confirm-excluir-ok');
    if (!overlay || !btnExcluir || !btnCancelar) return;

    msg.textContent = 'Tem certeza que deseja excluir este equipamento?';
    overlay.style.display = 'flex';

    const fecharConfirm = () => {
        overlay.style.display = 'none';
        btnCancelar.onclick = null;
        btnExcluir.onclick = null;
        overlay.onclick = null;
    };

    overlay.onclick = (e) => { if (e.target === overlay) fecharConfirm(); };
    btnCancelar.onclick = () => fecharConfirm();
    btnExcluir.onclick = () => {
        inventarioData = inventarioData.filter(eqp => eqp.tag !== tag);
        renderizarTabela();
        fecharConfirm();
        if (typeof showToast === 'function') showToast('Equipamento excluído com sucesso', 'success');
    };
}

// ================= FUNÇÕES UTILITÁRIAS DO INVENTÁRIO =================
function formatarSetor(setor) {
    const setores = {
        'internal-systems': 'INTERNAL SYSTEMS',
        'lideranca': 'LIDERANÇA',
        'mhw': 'MHW',
        'p2m': 'P2M',
        'check-in': 'CHECK-IN',
        'reciving': 'RECIVING',
        'mz1': 'MZ1',
        'mz2': 'MZ2',
        'mz3': 'MZ3',
        'inventario': 'INVENTÁRIO',
        'cx': 'CX',
        'returns': 'RETURNS',
        'packing-mono': 'PACKING MONO',
        'packing-ptw': 'PACKING PTW',
        'sauron': 'SAURON',
        'insumos': 'INSUMOS',
        'docas-de-expedicao': 'DOCAS DE EXPEDIÇÃO',
        'linha-de-peixe-1': 'LINHA DE PEIXE 1',
        'sorter': 'SORTER',
        'linha-de-peixe-2': 'LINHA DE PEIXE 2',
        'rk': 'RK',
        'nt-rk': 'NT RK',
        'qualidade': 'QUALIDADE',
        'aquario-outbound': 'AQUÁRIO OUTBOUND',
        'adm': 'ADM',
        'gate': 'GATE',
        'ambulatorio-interno': 'AMBULATÓRIO INTERNO',
        'ambulatorio-externo': 'AMBULATÓRIO EXTERNO',
        'sala-de-epi': 'SALA DE EPI',
        'er': 'ER',
        'rr': 'RR',
        'deposito-de-treinamento': 'DEPÓSITO DE TREINAMENTO',
        'hv': 'HV'
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
// Total de páginas dinâmico: aumenta conforme mais equipamentos são adicionados
function atualizarPaginacao() {
    const totalItens = inventarioData.length;
    const totalPaginas = Math.max(1, Math.ceil(totalItens / itemsPerPage));
    if (currentPage > totalPaginas) currentPage = totalPaginas;
    const mostrandoNestaPagina = totalItens === 0 ? 0 : Math.min(itemsPerPage, totalItens - (currentPage - 1) * itemsPerPage);

    let paginacaoContainer = document.getElementById('ucs-pagination');
    if (!paginacaoContainer) {
        paginacaoContainer = document.getElementById('pagination-controls');
    }
    if (!paginacaoContainer) return;

    // Texto: PÁGINA 1 DE 4 | MOSTRANDO 15 DE 47 EQUIPAMENTOS (adaptável ao adicionar equipamentos)
    let paginacaoHTML = `
        <div class="pagination-info">
            PÁGINA ${currentPage} DE ${totalPaginas} | MOSTRANDO ${mostrandoNestaPagina} DE ${totalItens} EQUIPAMENTOS
        </div>
        <div class="pagination-buttons">
            <button type="button" onclick="mudarPagina(1)" class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} data-tooltip="Primeira página" title="Primeira">&#10094;&#10094;</button>
            <button type="button" onclick="mudarPagina(${Math.max(1, currentPage - 1)})" class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} data-tooltip="Anterior" title="Anterior">&#10094;</button>
    `;

    // Botões numéricos: todas as páginas (ou até 9 visíveis para não quebrar layout)
    const maxBotoes = 9;
    let inicio = 1;
    let fim = totalPaginas;
    if (totalPaginas > maxBotoes) {
        inicio = Math.max(1, currentPage - Math.floor(maxBotoes / 2));
        fim = Math.min(totalPaginas, inicio + maxBotoes - 1);
        if (fim - inicio + 1 < maxBotoes) inicio = Math.max(1, fim - maxBotoes + 1);
    }
    for (let i = inicio; i <= fim; i++) {
        paginacaoHTML += `
            <button type="button" onclick="mudarPagina(${i})" class="pagination-btn ${i === currentPage ? 'active' : ''}" data-tooltip="Página ${i}" title="Página ${i}">${i}</button>
        `;
    }

    paginacaoHTML += `
            <button type="button" onclick="mudarPagina(${Math.min(totalPaginas, currentPage + 1)})" class="pagination-btn" ${currentPage === totalPaginas ? 'disabled' : ''} data-tooltip="Próxima" title="Próxima">&#10095;</button>
            <button type="button" onclick="mudarPagina(${totalPaginas})" class="pagination-btn" ${currentPage === totalPaginas ? 'disabled' : ''} data-tooltip="Última página" title="Última">&#10095;&#10095;</button>
        </div>
    `;

    paginacaoContainer.innerHTML = paginacaoHTML;
}

function mudarPagina(pagina) {
    const totalPaginas = Math.max(1, Math.ceil(inventarioData.length / itemsPerPage));
    const paginaValida = Math.max(1, Math.min(pagina, totalPaginas));

    if (paginaValida === currentPage) return;

    // Animação de transição de página
    const tbody = document.getElementById('ucs-inventory-data') || document.getElementById('inventory-data');
    tbody.style.opacity = '0.5';
    tbody.style.transform = 'translateX(' + (pagina > currentPage ? '20px' : '-20px') + ')';
    
    setTimeout(() => {
        currentPage = paginaValida;
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
    // Tenta encontrar o botão e dropdown usando os IDs do HTML atual
    const exportBtn = document.querySelector('.ucs-btn-download');
    const exportDropdown = document.querySelector('.ucs-download-menu');
    
    if (!exportBtn || !exportDropdown) {
        // Fallback para IDs antigos
        const oldBtn = document.getElementById('export-btn');
        const oldDropdown = document.getElementById('export-dropdown');
        if (oldBtn && oldDropdown) {
            oldBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                oldDropdown.classList.toggle('show');
            });
            
            document.addEventListener('click', (e) => {
                if (!oldBtn.contains(e.target) && !oldDropdown.contains(e.target)) {
                    oldDropdown.classList.remove('show');
                }
            });
        }
        return;
    }
    
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
    
    // Tenta encontrar o botão usando classe ou ID
    const exportBtn = document.querySelector('.ucs-btn-download') || document.getElementById('export-btn');
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
            const exportDropdown = document.querySelector('.ucs-download-menu') || document.getElementById('export-dropdown');
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
    URL.revokeObjectURL(url);
    if (typeof showToast === 'function') showToast('CSV exportado com sucesso!', 'success');
}

function exportarExcel(dados) {
    const cabecalhos = ['Serial', 'Tag', 'Modelo', 'IP', 'MAC Rede', 'MAC Bluetooth', 'SELB', 'Patrimônio', 'Setor', 'Status', 'Última Checagem', 'Responsável'];
    const linhas = dados.map(eqp => [
        `"${(eqp.serial || '').replace(/"/g, '""')}"`,
        `"${(eqp.tag || '').replace(/"/g, '""')}"`,
        `"${(eqp.modelo || '').replace(/"/g, '""')}"`,
        `"${(eqp.ip || '').replace(/"/g, '""')}"`,
        `"${(eqp.macRede || '').replace(/"/g, '""')}"`,
        `"${(eqp.macBluetooth || 'N/A').replace(/"/g, '""')}"`,
        `"${(eqp.selb || '').replace(/"/g, '""')}"`,
        `"${(eqp.patrimonio || 'N/A').replace(/"/g, '""')}"`,
        `"${(formatarSetor(eqp.setor) || '').replace(/"/g, '""')}"`,
        `"${(eqp.status || '').replace(/"/g, '""')}"`,
        `"${(formatarDataBonita(eqp.ultimaChecagem) || '').replace(/"/g, '""')}"`,
        `"${(eqp.responsavel || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [cabecalhos.join(','), ...linhas.map(linha => linha.join(','))].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `inventario_impressoras_${timestamp}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (typeof showToast === 'function') showToast('Excel exportado com sucesso!', 'success');
}

function exportarPDF(dados) {
    try {
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            if (typeof showToast === 'function') showToast('Biblioteca de PDF não carregada. Recarregue a página.', 'error');
            return;
        }
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const cabecalhos = ['Serial', 'Tag', 'Modelo', 'IP', 'MAC Rede', 'SELB', 'Setor', 'Status', 'Última Checagem', 'Responsável'];
        const linhas = dados.map(eqp => [
            eqp.serial || '',
            eqp.tag || '',
            eqp.modelo || '',
            eqp.ip || '',
            eqp.macRede || '',
            eqp.selb || '',
            formatarSetor(eqp.setor) || '',
            eqp.status || '',
            formatarDataBonita(eqp.ultimaChecagem) || '',
            eqp.responsavel || ''
        ]);
        doc.setFontSize(14);
        doc.text('AXIS - Inventário de Impressoras', 14, 15);
        doc.setFontSize(10);
        doc.text('Gerado em ' + new Date().toLocaleString('pt-BR') + ' | Total: ' + dados.length + ' equipamento(s)', 14, 22);
        doc.autoTable({
            head: [cabecalhos],
            body: linhas,
            startY: 28,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [52, 152, 219] },
            margin: { left: 14 }
        });
        const timestamp = new Date().toISOString().split('T')[0];
        doc.save('inventario_impressoras_' + timestamp + '.pdf');
        if (typeof showToast === 'function') showToast('PDF exportado com sucesso!', 'success');
    } catch (e) {
        console.error('Erro ao exportar PDF:', e);
        if (typeof showToast === 'function') showToast('Erro ao gerar PDF. Tente novamente.', 'error');
    }
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
    
    // Exporta IMEDIATAMENTE para garantir disponibilidade (ANTES de qualquer coisa)
    window.abrirCadastroRapido = abrirCadastroRapido;
    
    // Garante que a variável global esteja disponível
    if (typeof window.cadastroStep === 'undefined') {
        window.cadastroStep = 1;
    }
    
    const modal = document.getElementById('cadastro-modal');
    if (!modal) {
        console.error('❌ Modal de cadastro não encontrado!');
        alert('Erro: Modal de cadastro não encontrado. Recarregue a página.');
        return;
    }
    
    console.log('✅ Modal encontrado, abrindo...');
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    
    // Animação de entrada
    setTimeout(() => {
        modal.style.opacity = '1';
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.transform = 'translateY(0) scale(1)';
        }
    }, 10);
    
    cadastroStep = 1;
    if (window.cadastroStep !== undefined) {
        window.cadastroStep = 1;
    }
    
    // Atualiza visual do passo
    document.querySelectorAll('.cadastro-steps .step').forEach(step => {
        step.classList.remove('active');
    });
    const step1 = document.getElementById('step-1');
    if (step1) step1.classList.add('active');
    
    // Atualiza conteúdo dos passos
    document.querySelectorAll('[id^="step-"][id$="-content"]').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
        content.style.opacity = '0';
    });
    const step1Content = document.getElementById('step-1-content');
    if (step1Content) {
        step1Content.classList.add('active');
        step1Content.style.display = 'block';
        step1Content.style.opacity = '1';
    }
    
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
    if (typeof clearSerialPrefixSuffix === 'function') clearSerialPrefixSuffix();

    if (typeof initSerialSugestoes === 'function') initSerialSugestoes();
    if (typeof initIpMask === 'function') initIpMask();
    if (typeof initSelbMask === 'function') initSelbMask();

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
    
    // Foca no primeiro campo (serial)
    const serialInput = document.getElementById('cad-serial');
    if (serialInput) serialInput.focus();
}

/** Abre o modal de cadastro em modo EDIÇÃO: formulário preenchido com os dados do equipamento.
 *  Ao salvar (finalizarCadastro), o item é atualizado em vez de criar novo; Ver Detalhes mostrará os dados atualizados. */
function abrirCadastroParaEditar(tag) {
    const equipamento = (typeof inventarioData !== 'undefined' && inventarioData.length > 0)
        ? inventarioData.find(e => e.tag === tag)
        : null;
    const eq = equipamento || (typeof equipamentosExemplo !== 'undefined' && equipamentosExemplo.find(e => e.tag === tag));
    if (!eq) {
        if (typeof showToast === 'function') showToast('Equipamento não encontrado', 'warning');
        return;
    }

    window.cadastroEditandoTag = tag;

    const modal = document.getElementById('cadastro-modal');
    if (!modal) {
        if (typeof showToast === 'function') showToast('Modal de cadastro não encontrado', 'error');
        return;
    }

    const headerTitle = modal.querySelector('.modal-header h3');
    if (headerTitle) headerTitle.textContent = '✏️ Editar Impressora';

    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    setTimeout(() => {
        modal.style.opacity = '1';
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) modalContent.style.transform = 'translateY(0) scale(1)';
    }, 10);

    if (typeof window.cadastroStep === 'undefined') window.cadastroStep = 1;
    cadastroStep = 1;
    window.cadastroStep = 1;

    document.querySelectorAll('.cadastro-steps .step').forEach(step => step.classList.remove('active'));
    const step1 = document.getElementById('step-1');
    if (step1) step1.classList.add('active');
    document.querySelectorAll('[id^="step-"][id$="-content"]').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
        content.style.opacity = '0';
    });
    const step1Content = document.getElementById('step-1-content');
    if (step1Content) {
        step1Content.classList.add('active');
        step1Content.style.display = 'block';
        step1Content.style.opacity = '1';
    }

    const btnBack = document.getElementById('btn-back');
    const btnNext = document.getElementById('btn-next');
    const btnSubmit = document.getElementById('btn-submit');
    if (btnBack) btnBack.style.display = 'none';
    if (btnNext) btnNext.style.display = 'block';
    if (btnSubmit) btnSubmit.style.display = 'none';

    const modelo = eq.modelo || 'ZT411';
    const modeloId = modelo === 'ZT411' ? 'cad-modelo-zt411' : modelo === 'ZD421' ? 'cad-modelo-zd421' : 'cad-modelo-zq630';
    const modeloRadio = document.getElementById(modeloId);
    if (modeloRadio) {
        modeloRadio.checked = true;
    }
    const prefixo = SERIAL_PREFIXOS_MODELO[modelo] || '';
    const serialFull = eq.serial || eq.id || '';
    const serialSuffix = prefixo && serialFull.startsWith(prefixo) ? serialFull.slice(prefixo.length) : serialFull;
    const prefixSpan = document.getElementById('cad-serial-prefix');
    const suffixInput = document.getElementById('cad-serial');
    if (prefixSpan) prefixSpan.textContent = prefixo;
    if (suffixInput) suffixInput.value = serialSuffix;

    const ipFull = eq.ip || '';
    const ipSuffix = ipFull.startsWith('10.201.') ? ipFull.slice(7) : ipFull.replace(/^\d{1,3}\.\d{1,3}\./, '');
    const ipInput = document.getElementById('cad-ip');
    if (ipInput) ipInput.value = ipSuffix;

    const macRede = document.getElementById('cad-mac-rede');
    if (macRede) macRede.value = eq.macRede || '';
    const macBluetooth = document.getElementById('cad-mac-bluetooth');
    if (macBluetooth) macBluetooth.value = eq.macBluetooth || '';
    const selb = document.getElementById('cad-selb');
    if (selb) selb.value = eq.selb || '';
    const setorSelect = document.getElementById('cad-setor');
    if (setorSelect) setorSelect.value = eq.setor || '';
    const setorTrigger = document.getElementById('cad-setor-trigger');
    if (setorTrigger && eq.setor) {
        const opt = setorSelect.querySelector('option[value="' + eq.setor + '"]');
        setorTrigger.textContent = opt ? opt.textContent : eq.setor;
    }
    const patrimonio = document.getElementById('cad-patrimonio');
    if (patrimonio) patrimonio.value = eq.patrimonio || '';

    const selectBancada = document.getElementById('cad-bancada');
    if (selectBancada) {
        while (selectBancada.options.length > 1) selectBancada.remove(1);
        for (let i = 1; i <= 200; i++) {
            const option = document.createElement('option');
            const valor = 'B' + String(i).padStart(2, '0');
            option.value = valor;
            option.textContent = valor;
            selectBancada.appendChild(option);
        }
        selectBancada.value = eq.bancada || '';
    }

    const obsEl = document.getElementById('cad-observacoes');
    if (obsEl) obsEl.value = eq.observacoes || '';

    if (typeof initSerialSugestoes === 'function') initSerialSugestoes();
    if (typeof initIpMask === 'function') initIpMask();
    if (typeof initSelbMask === 'function') initSelbMask();

    const serialInput = document.getElementById('cad-serial');
    if (serialInput) serialInput.focus();
}

// Prefixos fixos para números de série por modelo (só aparecem ao clicar no campo)
const SERIAL_PREFIXOS_MODELO = {
    'ZT411': '99J',
    'ZD421': 'D6J',
    'ZQ630 PLUS': 'XXV'
};

function getSerialCompleto() {
    const prefixSpan = document.getElementById('cad-serial-prefix');
    const suffixInput = document.getElementById('cad-serial');
    const prefix = (prefixSpan && prefixSpan.textContent) ? prefixSpan.textContent.trim() : '';
    const suffix = (suffixInput && suffixInput.value) ? suffixInput.value.trim() : '';
    return prefix + suffix;
}

function clearSerialPrefixSuffix() {
    const prefixSpan = document.getElementById('cad-serial-prefix');
    const suffixInput = document.getElementById('cad-serial');
    if (prefixSpan) prefixSpan.textContent = '';
    if (suffixInput) suffixInput.value = '';
    if (typeof hideSerialSuggestionsPortal === 'function') hideSerialSuggestionsPortal();
}

function getSerialSuggestionsPortal() {
    var p = document.getElementById('cad-serial-suggestions-portal');
    if (p) return p;
    p = document.createElement('div');
    p.id = 'cad-serial-suggestions-portal';
    p.className = 'serial-suggestions serial-suggestions-portal';
    p.style.display = 'none';
    document.body.appendChild(p);
    return p;
}

function hideSerialSuggestionsPortal() {
    var p = document.getElementById('cad-serial-suggestions-portal');
    if (p) { p.innerHTML = ''; p.style.display = 'none'; }
}

function mostrarSugestoesSerial() {
    const modeloRadio = document.querySelector('input[name="modelo"]:checked');
    const wrapper = document.getElementById('cad-serial-wrapper');
    if (!wrapper) return;

    hideSerialSuggestionsPortal();

    if (!modeloRadio) return;

    const modelo = modeloRadio.value;
    const prefixo = SERIAL_PREFIXOS_MODELO[modelo];
    if (!prefixo) return;

    const portal = getSerialSuggestionsPortal();
    const item = document.createElement('div');
    item.className = 'serial-suggestions-item';
    item.innerHTML = '<strong>' + prefixo + '</strong> &ndash; ' + modelo;
    item.dataset.prefixo = prefixo;
    item.addEventListener('click', function () {
        aplicarPrefixoEscolhido(this.dataset.prefixo);
    });
    portal.appendChild(item);

    var rect = wrapper.getBoundingClientRect();
    portal.style.display = 'block';
    portal.style.position = 'fixed';
    portal.style.left = rect.left + 'px';
    portal.style.top = (rect.bottom + 4) + 'px';
    portal.style.width = Math.max(rect.width, 200) + 'px';
    portal.style.zIndex = '9999';
}

function aplicarPrefixoEscolhido(prefixo) {
    const prefixSpan = document.getElementById('cad-serial-prefix');
    const suffixInput = document.getElementById('cad-serial');
    const eraMesmo = (prefixSpan && prefixSpan.textContent.trim() === prefixo);
    if (prefixSpan) prefixSpan.textContent = prefixo;
    if (suffixInput) {
        if (!eraMesmo) suffixInput.value = '';
        suffixInput.focus();
    }
    hideSerialSuggestionsPortal();
}

function initSerialSugestoes() {
    const wrapper = document.getElementById('cad-serial-wrapper');
    const suffixInput = document.getElementById('cad-serial');

    function onSerialClick() {
        mostrarSugestoesSerial();
    }

    function closeSuggestions(e) {
        if (!wrapper) return;
        if (wrapper.contains(e.target)) return;
        var p = document.getElementById('cad-serial-suggestions-portal');
        if (p && p.contains(e.target)) return;
        hideSerialSuggestionsPortal();
    }

    if (wrapper) {
        wrapper.removeEventListener('click', onSerialClick);
        wrapper.addEventListener('click', onSerialClick);
    }
    if (suffixInput) {
        suffixInput.removeEventListener('focus', onSerialClick);
        suffixInput.addEventListener('focus', onSerialClick);
    }
    document.removeEventListener('click', closeSuggestions);
    document.addEventListener('click', closeSuggestions);

    ['cad-modelo-zt411', 'cad-modelo-zd421', 'cad-modelo-zq630'].forEach(function (id) {
        const radio = document.getElementById(id);
        if (!radio) return;
        radio.removeEventListener('change', onModeloChange);
        radio.addEventListener('change', onModeloChange);
    });

    function onModeloChange() {
        const r = document.querySelector('input[name="modelo"]:checked');
        if (!r) return;
        const prefixo = SERIAL_PREFIXOS_MODELO[r.value];
        if (prefixo) aplicarPrefixoEscolhido(prefixo);
    }
}

var IP_PREFIXO = '10.201.';

function getIpCompleto() {
    var el = document.getElementById('cad-ip');
    if (!el) return IP_PREFIXO;
    var s = (el.value || '').trim();
    return IP_PREFIXO + s;
}

function formatarIpSuffix(val) {
    var d = (val || '').replace(/\D/g, '').slice(0, 6);
    if (d.length <= 3) return d;
    return d.slice(0, 3) + '.' + d.slice(3);
}

function initIpMask() {
    var el = document.getElementById('cad-ip');
    if (!el) return;
    function onIpInput() {
        var v = formatarIpSuffix(el.value);
        if (v !== el.value) {
            el.value = v;
        }
    }
    el.removeEventListener('input', onIpInput);
    el.addEventListener('input', onIpInput);
}

function initSelbMask() {
    var el = document.getElementById('cad-selb');
    if (!el) return;
    function onSelbInput() {
        var v = (el.value || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 4);
        if (v !== el.value) el.value = v;
    }
    el.removeEventListener('input', onSelbInput);
    el.addEventListener('input', onSelbInput);
}

function fecharCadastro() {
    // Exporta IMEDIATAMENTE (sempre)
    window.fecharCadastro = fecharCadastro;

    window.cadastroEditandoTag = null;
    const modal = document.getElementById('cadastro-modal');
    if (modal) {
        const headerTitle = modal.querySelector('.modal-header h3');
        if (headerTitle) headerTitle.textContent = '➕ Cadastrar Nova Impressora';
    }

    if (typeof hideSerialSuggestionsPortal === 'function') hideSerialSuggestionsPortal();
    
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
    // Exporta IMEDIATAMENTE (sempre)
    window.proximoPassoCadastro = proximoPassoCadastro;
    
    console.log('➡️ Avançando para próximo passo...', cadastroStep);
    
    const stepNum = cadastroStep || 1;
    const stepAtualContent = document.getElementById(`step-${stepNum}-content`);
    
    if (!stepAtualContent) {
        console.error('❌ Conteúdo do passo atual não encontrado:', `step-${stepNum}-content`);
        return;
    }
    
    // Validação básica
    if (stepNum === 1) {
        const modeloRadio = document.querySelector('input[name="modelo"]:checked');
        if (!modeloRadio) return;

        const serial = typeof getSerialCompleto === 'function' ? getSerialCompleto() : '';
        const modelo = modeloRadio.value;
        const prefixoEsperado = SERIAL_PREFIXOS_MODELO[modelo];

        if (!serial) return;
        if (!prefixoEsperado || !serial.startsWith(prefixoEsperado)) return;
        var editandoTag = window.cadastroEditandoTag;
        if (equipamentosExemplo && equipamentosExemplo.some(function (e) { return e.serial === serial && e.tag !== editandoTag; })) return;

        const confirmModelo = document.getElementById('confirm-modelo');
        const confirmSerial = document.getElementById('confirm-serial');
        if (confirmModelo) confirmModelo.textContent = modelo;
        if (confirmSerial) confirmSerial.textContent = serial;

        console.log('✅ Passo 1 validado:', { modelo, serial });
        
    } else if (stepNum === 2) {
        const ipInput = document.getElementById('cad-ip');
        const macRedeInput = document.getElementById('cad-mac-rede');
        const setorSelect = document.getElementById('cad-setor');
        const selbInput = document.getElementById('cad-selb');
        
        if (!ipInput || !macRedeInput || !setorSelect) {
            return;
        }
        
        const ip = typeof getIpCompleto === 'function' ? getIpCompleto() : (ipInput.value.trim() || '');
        const macRede = macRedeInput.value.trim();
        const setor = setorSelect.value;
        
        if (!ip || ip === IP_PREFIXO || !macRede || !setor) {
            return;
        }
        
        var ipRegex = /^10\.201\.(\d{1,3})\.(\d{1,3})$/;
        var m = ip.match(ipRegex);
        if (!m || parseInt(m[1], 10) > 255 || parseInt(m[2], 10) > 255) {
            return;
        }
        
        var macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
        if (!macRegex.test(macRede)) {
            return;
        }
        
        var selb = (selbInput && selbInput.value) ? selbInput.value.trim() : '';
        if (selb && (!/^[A-Za-z0-9]{4}$/.test(selb) || selb.length !== 4)) {
            return;
        }
        
        var confirmIp = document.getElementById('confirm-ip');
        var confirmSetor = document.getElementById('confirm-setor');
        if (confirmIp) confirmIp.textContent = ip;
        if (confirmSetor) {
            const setorText = setorSelect.options[setorSelect.selectedIndex]?.text || setor;
            confirmSetor.textContent = setorText;
        }
        
        console.log('✅ Passo 2 validado:', { ip, macRede, setor });
    }
    
    // Animação de transição
    stepAtualContent.style.opacity = '0';
    stepAtualContent.style.transform = 'translateX(-20px)';
    
    setTimeout(() => {
        // Avança para próximo passo
        const nextStep = stepNum + 1;
        const nextStepElement = document.getElementById(`step-${nextStep}`);
        const nextStepContent = document.getElementById(`step-${nextStep}-content`);
        
        console.log('📍 Tentando avançar para passo:', nextStep);
        console.log('📍 Elemento do passo:', nextStepElement);
        console.log('📍 Conteúdo do passo:', nextStepContent);
        
        if (!nextStepElement || !nextStepContent) {
            console.error('❌ Próximo passo não encontrado:', nextStep);
            return;
        }
        
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
            step.style.display = 'none';
        });
        
        nextStepContent.style.display = 'block';
        nextStepContent.classList.add('active');
        
        // Animação de entrada do próximo passo
        nextStepContent.style.opacity = '0';
        nextStepContent.style.transform = 'translateX(20px)';
        
        setTimeout(() => {
            nextStepContent.style.opacity = '1';
            nextStepContent.style.transform = 'translateX(0)';
        }, 50);
        
        // Atualiza variável global
        cadastroStep = nextStep;
        if (window.cadastroStep !== undefined) {
            window.cadastroStep = nextStep;
        }
        
        console.log('✅ Passo atualizado para:', cadastroStep);
        
        // Atualiza botões
        const btnBack = document.getElementById('btn-back');
        const btnNext = document.getElementById('btn-next');
        const btnSubmit = document.getElementById('btn-submit');
        
        if (btnBack) {
            if (nextStep > 1) {
                btnBack.style.display = 'block';
            } else {
                btnBack.style.display = 'none';
            }
        }
        
        if (nextStep === 3) {
            if (btnNext) btnNext.style.display = 'none';
            if (btnSubmit) btnSubmit.style.display = 'block';
        } else {
            if (btnNext) btnNext.style.display = 'block';
            if (btnSubmit) btnSubmit.style.display = 'none';
        }
        
        console.log('✅ Navegação concluída para passo', nextStep);
    }, 300);
}

function passoAnteriorCadastro() {
    // Exporta IMEDIATAMENTE (sempre)
    window.passoAnteriorCadastro = passoAnteriorCadastro;
    
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
    
    // Exporta IMEDIATAMENTE (sempre)
    window.finalizarCadastro = finalizarCadastro;
    
    // Coleta dados do formulário
    const serial = (typeof getSerialCompleto === 'function' ? getSerialCompleto() : (document.getElementById('cad-serial')?.value.trim() || ''));
    const modeloRadio = document.querySelector('input[name="modelo"]:checked');
    const modelo = modeloRadio ? modeloRadio.value : '';
    const ip = (typeof getIpCompleto === 'function' ? getIpCompleto() : (document.getElementById('cad-ip')?.value.trim() || ''));
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

    const editandoTag = window.cadastroEditandoTag;
    const dataCadastroIso = editandoTag ? (equipamentosExemplo.find(e => e.tag === editandoTag) || {}).dataCadastro || new Date().toISOString() : new Date().toISOString();
    const nomeResponsavel = (typeof currentUser === 'object' && currentUser && (currentUser.name || (currentUser && currentUser.data && currentUser.data.name))) ? (currentUser.name || (currentUser.data && currentUser.data.name)) : (currentUser || 'Sistema');
    const equipamentoAtualizado = {
        serial: serial,
        tag: editandoTag || `${modelo}-${modelo === 'ZD421' ? 'DSK' : (modelo || '').indexOf('ZQ630 PLUS') >= 0 ? 'PAG' : 'IND'}-${String(equipamentosExemplo.length + 1).padStart(3, '0')}`,
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
        dataCadastro: dataCadastroIso,
        observacoes: observacoes || (editandoTag ? 'Equipamento atualizado' : 'Novo equipamento cadastrado'),
        fabricante: 'Zebra Technologies',
        firmware: modelo === 'ZT411' ? 'V72.20.15Z' : modelo === 'ZD421' ? 'V65.21.10Z' : 'V82.15.20Z',
        contador: editandoTag ? (equipamentosExemplo.find(e => e.tag === editandoTag) || {}).contador : 0,
        toner: editandoTag ? (equipamentosExemplo.find(e => e.tag === editandoTag) || {}).toner : 100,
        ribbon: (modelo || '').indexOf('ZQ630 PLUS') >= 0 ? null : (editandoTag ? (equipamentosExemplo.find(e => e.tag === editandoTag) || {}).ribbon : 100),
        ink: (modelo || '').indexOf('ZQ630 PLUS') >= 0 ? (editandoTag ? (equipamentosExemplo.find(e => e.tag === editandoTag) || {}).ink : 100) : null,
        responsavel: currentUser || 'Sistema',
        garantia: editandoTag ? (equipamentosExemplo.find(e => e.tag === editandoTag) || {}).garantia : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    // Histórico: ao CRIAR (não editar pelo cadastro), registra "Cadastro"
    if (!editandoTag) {
        equipamentoAtualizado.historicoEdicoes = [{ acao: 'Cadastro', por: nomeResponsavel, em: dataCadastroIso }];
    } else {
        const antigo = equipamentosExemplo.find(e => e.tag === editandoTag);
        if (antigo && Array.isArray(antigo.historicoEdicoes) && antigo.historicoEdicoes.length > 0) {
            equipamentoAtualizado.historicoEdicoes = antigo.historicoEdicoes.slice();
        }
    }

    if (editandoTag) {
        const idx = equipamentosExemplo.findIndex(e => e.tag === editandoTag);
        if (idx !== -1) {
            equipamentosExemplo[idx] = equipamentoAtualizado;
        }
        window.cadastroEditandoTag = null;
    } else {
        equipamentosExemplo.unshift(equipamentoAtualizado);
    }
    
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
        
        // Equipamento cadastrado com sucesso
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
    
    const equipamento = (typeof inventarioData !== 'undefined' && inventarioData.length > 0)
        ? inventarioData.find(e => e.tag === tag)
        : null;
    const eq = equipamento || equipamentosExemplo.find(e => e.tag === tag);
    if (!eq) {
        showToast('Equipamento não encontrado', 'warning');
        return;
    }
    
    // Última Checagem: automático em horário do Brasil (data/hora atual ou armazenada, sempre em pt-BR)
    const opcoesBR = { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    const ultimaChecagemBR = eq.ultimaChecagem
        ? new Date(eq.ultimaChecagem).toLocaleString('pt-BR', opcoesBR)
        : new Date().toLocaleString('pt-BR', opcoesBR);
    
    // Responsável: usuário logado no momento (fixo, não editável)
    const usuarioLogado = (typeof currentUser !== 'undefined' && currentUser !== null)
        ? (typeof currentUser === 'object' ? (currentUser.name || currentUser.data?.name) : currentUser)
        : (window.currentUser || null);
    const responsavelExibir = usuarioLogado || eq.responsavel || '—';
    
    // Fabricante e Modelo: fixos (não editáveis) – modelo vem do cadastro
    const fabricanteExibir = eq.fabricante || 'Zebra Technologies';
    const modeloExibir = eq.modelo || '—';
    
    // Título do modal = Serial Number da impressora (automático ao abrir Ver Dados)
    const tituloSerial = document.getElementById('detail-titulo-serial');
    if (tituloSerial) tituloSerial.textContent = eq.serial || eq.id || '—';
    
    const detailElements = {
        'detail-modelo': modeloExibir,
        'detail-ip': eq.ip || '—',
        'detail-mac-rede': eq.macRede || 'N/A',
        'detail-mac-bluetooth': eq.macBluetooth || 'N/A',
        'detail-selb': eq.selb || 'N/A',
        'detail-patrimonio': eq.patrimonio || 'N/A',
        'detail-setor': eq.setor ? (typeof formatarSetor === 'function' ? formatarSetor(eq.setor) : eq.setor) : '—',
        'detail-bancada': eq.bancada || '—',
        'detail-ultima-checagem': ultimaChecagemBR,
        'detail-responsavel': responsavelExibir,
        'detail-fabricante': fabricanteExibir,
        'detail-firmware': eq.firmware || '—',
        'detail-contador': (eq.contador != null && eq.contador !== '') ? Number(eq.contador).toLocaleString() : '—'
    };
    
    Object.entries(detailElements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
    
    // Botão Histórico: ver quem foi o último que alterou algo
    const historyBtn = document.getElementById('detail-history-btn');
    if (historyBtn) {
        historyBtn.onclick = () => mostrarHistóricoEquipamento(eq);
    }
    
    // Mostra modal com animação (sem rolamento: conteúdo fixo, único)
    const modal = document.getElementById('detalhes-modal');
    if (modal) {
        document.body.style.overflow = 'hidden';
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
    
    document.body.style.overflow = '';
    modal.style.opacity = '0';
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.transform = 'translateY(20px) scale(0.95)';
    }
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

/** Lista de setores para o select do modal Editar (mesmo do cadastro). */
var SETORES_EDIT = [
    { v: 'internal-systems', l: 'INTERNAL SYSTEMS' }, { v: 'lideranca', l: 'LIDERANÇA' }, { v: 'mhw', l: 'MHW' }, { v: 'p2m', l: 'P2M' },
    { v: 'check-in', l: 'CHECK-IN' }, { v: 'reciving', l: 'RECIVING' }, { v: 'mz1', l: 'MZ1' }, { v: 'mz2', l: 'MZ2' }, { v: 'mz3', l: 'MZ3' },
    { v: 'inventario', l: 'INVENTÁRIO' }, { v: 'cx', l: 'CX' }, { v: 'returns', l: 'RETURNS' }, { v: 'packing-mono', l: 'PACKING MONO' },
    { v: 'packing-ptw', l: 'PACKING PTW' }, { v: 'sauron', l: 'SAURON' }, { v: 'insumos', l: 'INSUMOS' }, { v: 'docas-de-expedicao', l: 'DOCAS DE EXPEDIÇÃO' },
    { v: 'linha-de-peixe-1', l: 'LINHA DE PEIXE 1' }, { v: 'sorter', l: 'SORTER' }, { v: 'linha-de-peixe-2', l: 'LINHA DE PEIXE 2' },
    { v: 'rk', l: 'RK' }, { v: 'nt-rk', l: 'NT RK' }, { v: 'qualidade', l: 'QUALIDADE' }, { v: 'aquario-outbound', l: 'AQUÁRIO OUTBOUND' },
    { v: 'adm', l: 'ADM' }, { v: 'gate', l: 'GATE' }, { v: 'ambulatorio-interno', l: 'AMBULATÓRIO INTERNO' }, { v: 'ambulatorio-externo', l: 'AMBULATÓRIO EXTERNO' },
    { v: 'sala-de-epi', l: 'SALA DE EPI' }, { v: 'er', l: 'ER' }, { v: 'rr', l: 'RR' }, { v: 'deposito-de-treinamento', l: 'DEPÓSITO DE TREINAMENTO' }, { v: 'hv', l: 'HV' }
];

function abrirModalEditar(tag) {
    const equipamento = (typeof inventarioData !== 'undefined' && inventarioData.length > 0)
        ? inventarioData.find(e => e.tag === tag)
        : null;
    const eq = equipamento || (typeof equipamentosExemplo !== 'undefined' && equipamentosExemplo.find(e => e.tag === tag));
    if (!eq) {
        if (typeof showToast === 'function') showToast('Equipamento não encontrado', 'warning');
        return;
    }

    window.editarEquipamentoTag = tag;

    const opcoesBR = { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    const ultimaChecagemBR = eq.ultimaChecagem
        ? new Date(eq.ultimaChecagem).toLocaleString('pt-BR', opcoesBR)
        : new Date().toLocaleString('pt-BR', opcoesBR);

    const titulo = document.getElementById('editar-titulo-serial');
    if (titulo) titulo.textContent = eq.serial || eq.id || '—';

    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val != null && val !== '' ? String(val) : ''; };
    setVal('edit-modelo', eq.modelo || '');
    setVal('edit-ip', eq.ip || '');
    setVal('edit-mac-rede', eq.macRede || '');
    setVal('edit-mac-bluetooth', eq.macBluetooth || '');
    setVal('edit-selb', eq.selb || '');
    setVal('edit-patrimonio', eq.patrimonio || '');
    setVal('edit-ultima-checagem', ultimaChecagemBR);
    var usuarioLogado = (typeof currentUser !== 'undefined' && currentUser !== null)
        ? (typeof currentUser === 'object' ? (currentUser.name || currentUser.data && currentUser.data.name) : currentUser)
        : (window.currentUser || null);
    setVal('edit-responsavel', usuarioLogado || eq.responsavel || '—');
    setVal('edit-fabricante', 'Zebra Technologies');
    setVal('edit-contador', (eq.contador != null && eq.contador !== '') ? Number(eq.contador) : '');

    const setorSelect = document.getElementById('edit-setor');
    if (setorSelect) {
        setorSelect.innerHTML = '';
        SETORES_EDIT.forEach(function (s) {
            const opt = document.createElement('option');
            opt.value = s.v;
            opt.textContent = s.l;
            setorSelect.appendChild(opt);
        });
        setorSelect.value = eq.setor || '';
    }

    const bancadaSelect = document.getElementById('edit-bancada');
    if (bancadaSelect) {
        bancadaSelect.innerHTML = '<option value="">—</option>';
        for (let i = 1; i <= 200; i++) {
            const opt = document.createElement('option');
            const valor = 'B' + String(i).padStart(2, '0');
            opt.value = valor;
            opt.textContent = valor;
            bancadaSelect.appendChild(opt);
        }
        bancadaSelect.value = eq.bancada || '';
    }

    const modal = document.getElementById('editar-modal');
    if (modal) {
        document.body.style.overflow = 'hidden';
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) modalContent.style.transform = 'translateY(0) scale(1)';
    }
}

function fecharModalEditar() {
    const modal = document.getElementById('editar-modal');
    if (!modal) return;
    document.body.style.overflow = '';
    modal.style.opacity = '0';
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) modalContent.style.transform = 'translateY(20px) scale(0.95)';
    setTimeout(function () { modal.style.display = 'none'; }, 300);
    window.editarEquipamentoTag = null;
}

function salvarEdicaoEquipamento() {
    const tag = window.editarEquipamentoTag;
    if (!tag) return;
    const idx = (typeof equipamentosExemplo !== 'undefined') ? equipamentosExemplo.findIndex(e => e.tag === tag) : -1;
    if (idx === -1) {
        if (typeof showToast === 'function') showToast('Equipamento não encontrado', 'warning');
        return;
    }

    const getVal = (id) => { const el = document.getElementById(id); return el ? (el.value || '').trim() : ''; };
    const contadorVal = document.getElementById('edit-contador');
    let contadorNum = (contadorVal && contadorVal.value !== '') ? parseInt(contadorVal.value, 10) : (equipamentosExemplo[idx].contador != null ? equipamentosExemplo[idx].contador : 0);
    if (isNaN(contadorNum)) contadorNum = 0;

    const responsavelEdicao = (typeof currentUser !== 'undefined' && currentUser !== null)
        ? (typeof currentUser === 'object' ? (currentUser.name || (currentUser.data && currentUser.data.name)) : currentUser)
        : (window.currentUser || equipamentosExemplo[idx].responsavel);
    const agoraIso = new Date().toISOString();
    const eqAntigo = equipamentosExemplo[idx];
    let historicoEdicoes = Array.isArray(eqAntigo.historicoEdicoes) && eqAntigo.historicoEdicoes.length > 0
        ? eqAntigo.historicoEdicoes.slice()
        : (eqAntigo.dataCadastro ? [{ acao: 'Cadastro', por: eqAntigo.responsavel || '—', em: eqAntigo.dataCadastro }] : []);
    historicoEdicoes.push({ acao: 'Edição', por: responsavelEdicao || '—', em: agoraIso });

    const atualizado = {
        serial: equipamentosExemplo[idx].serial,
        tag: tag,
        modelo: getVal('edit-modelo') || equipamentosExemplo[idx].modelo,
        ip: getVal('edit-ip') || equipamentosExemplo[idx].ip,
        macRede: (getVal('edit-mac-rede') || '').toUpperCase() || equipamentosExemplo[idx].macRede,
        macBluetooth: getVal('edit-mac-bluetooth') ? getVal('edit-mac-bluetooth').toUpperCase() : equipamentosExemplo[idx].macBluetooth,
        selb: getVal('edit-selb') || equipamentosExemplo[idx].selb,
        patrimonio: getVal('edit-patrimonio') || equipamentosExemplo[idx].patrimonio,
        setor: getVal('edit-setor') || equipamentosExemplo[idx].setor,
        bancada: getVal('edit-bancada') || equipamentosExemplo[idx].bancada,
        status: equipamentosExemplo[idx].status,
        ultimaChecagem: new Date().toISOString().replace('T', ' ').substring(0, 16),
        dataCadastro: equipamentosExemplo[idx].dataCadastro,
        observacoes: equipamentosExemplo[idx].observacoes || 'Equipamento atualizado',
        fabricante: 'Zebra Technologies',
        firmware: getVal('edit-firmware') || equipamentosExemplo[idx].firmware,
        contador: contadorNum,
        toner: equipamentosExemplo[idx].toner,
        ribbon: equipamentosExemplo[idx].ribbon,
        ink: equipamentosExemplo[idx].ink,
        responsavel: responsavelEdicao,
        garantia: equipamentosExemplo[idx].garantia,
        historicoEdicoes: historicoEdicoes
    };

    equipamentosExemplo[idx] = atualizado;
    if (typeof atualizarContadoresModelo === 'function') atualizarContadoresModelo();
    if (typeof filtrarInventario === 'function') filtrarInventario();
    if (typeof atualizarEstatisticas === 'function') atualizarEstatisticas();
    if (typeof inicializarGrafico === 'function') inicializarGrafico();
    fecharModalEditar();
    if (typeof showToast === 'function') showToast('Dados atualizados. Ver Detalhes mostrará as alterações.', 'success');
}

/**
 * Monta a lista de edições do equipamento (dados automáticos).
 * Usa eq.historicoEdicoes se existir; senão gera a partir de ultimaAlteracaoPor/Em e responsavel/ultimaChecagem.
 */
function obterHistoricoEdicoes(eq) {
    const opcoesBR = { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    const formatarQuando = (d) => d ? new Date(d).toLocaleString('pt-BR', opcoesBR) : '—';

    if (eq.historicoEdicoes && Array.isArray(eq.historicoEdicoes) && eq.historicoEdicoes.length > 0) {
        return eq.historicoEdicoes.map(entrada => ({
            por: entrada.por || entrada.responsavel || '—',
            em: formatarQuando(entrada.em || entrada.data),
            acao: entrada.acao || 'Alteração'
        }));
    }

    const entradas = [];
    const ultimaPor = eq.ultimaAlteracaoPor || eq.responsavel;
    const ultimaEm = eq.ultimaAlteracaoEm || eq.ultimaChecagem || eq.dataCadastro;
    if (ultimaPor || ultimaEm) {
        entradas.push({ por: ultimaPor || '—', em: formatarQuando(ultimaEm), acao: 'Última alteração' });
    }
    if (eq.dataCadastro && ultimaEm !== eq.dataCadastro) {
        entradas.push({ por: eq.responsavel || ultimaPor || '—', em: formatarQuando(eq.dataCadastro), acao: 'Cadastro' });
    }
    if (entradas.length === 0) {
        entradas.push({ por: '—', em: '—', acao: 'Nenhuma edição registrada' });
    }
    return entradas;
}

/**
 * Mostra o histórico de edições do equipamento (design com timeline, dados automáticos).
 */
function mostrarHistóricoEquipamento(eq) {
    const serialMaquina = eq.serial || eq.id || '—';
    const edicoes = obterHistoricoEdicoes(eq);

    let el = document.getElementById('historico-modal');
    if (!el) {
        el = document.createElement('div');
        el.id = 'historico-modal';
        el.className = 'modal-overlay historico-overlay';
        document.body.appendChild(el);
    }

    const itensHTML = edicoes.map((item, i) => `
        <li class="historico-item">
            <span class="historico-item-marker"></span>
            <div class="historico-item-content">
                <span class="historico-item-acao">${item.acao}</span>
                <span class="historico-item-por">Por: <strong>${item.por}</strong></span>
                <span class="historico-item-em">Em: ${item.em}</span>
            </div>
        </li>
    `).join('');

    el.innerHTML = `
        <div class="historico-modal-box" onclick="event.stopPropagation()">
            <div class="historico-modal-header">
                <h4 class="historico-modal-title">HISTÓRICO DE EDIÇÕES | ${serialMaquina}</h4>
                <button type="button" class="historico-modal-close" onclick="fecharHistórico()" aria-label="Fechar">×</button>
            </div>
            <div class="historico-modal-body">
                <ul class="historico-timeline">
                    ${itensHTML}
                </ul>
            </div>
        </div>
    `;
    el.onclick = () => fecharHistórico();
    el.style.display = 'flex';
}

function fecharHistórico() {
    const el = document.getElementById('historico-modal');
    if (el) el.style.display = 'none';
}

// ================= SISTEMA DE NOTIFICAÇÕES =================
// ================= FUNÇÕES DE NOTIFICAÇÕES =================
// Todas as funções de notificações foram removidas

// ================= MODAL BEM-VINDO (Apple / vidro) =================
function showBemVindoModal(nome) {
    const wrap = document.getElementById('modal-bem-vindo');
    const span = document.getElementById('modal-bem-vindo-nome');
    if (!wrap || !span) return;
    if (wrap.style.display === 'flex') return;
    span.textContent = nome || 'Usuário';
    wrap.style.display = 'flex';
    wrap.onclick = fecharBemVindoModal;
}

function fecharBemVindoModal() {
    const wrap = document.getElementById('modal-bem-vindo');
    if (wrap) {
        wrap.style.display = 'none';
        wrap.onclick = null;
    }
}

// ================= TOAST NOTIFICATIONS =================
function showToast(message, type = 'info', duration = 3000) {
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
        <button type="button" class="toast-close" aria-label="Fechar" onclick="var t=this.closest('.toast');if(t){t.classList.remove('show');setTimeout(function(){if(t.parentElement)t.remove();},280);}">×</button>
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
    // Usa o elemento existente no HTML ao invés de criar um novo
    let fab = document.getElementById('fab-container');
    
    if (!fab) {
        // Se não existir, cria um novo
        fab = document.createElement('div');
        fab.id = 'fab-container';
        fab.className = 'fab-container';
        document.body.appendChild(fab);
    }
    
    // Só adiciona conteúdo se ainda não tiver
    if (!fab.querySelector('.fab-main')) {
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
            </div>
        `;
    }
    
    // Inicialmente escondido (só aparece na home)
    fab.style.display = 'none';
    
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
// Função removida - notificações desabilitadas

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
    // Exporta IMEDIATAMENTE (sempre)
    window.toggleTheme = toggleTheme;
    
    const currentTheme = document.body.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Animação de transição
    document.body.style.opacity = '0.8';
    
    setTimeout(() => {
        setTheme(newTheme);
        document.body.style.opacity = '1';
    }, 200);
}

function setTheme(theme) {
    console.log(`🎨 Alterando tema para: ${theme}`);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('axis-theme', theme);
    
    // Atualiza ícone do botão
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        themeIcon.title = theme === 'dark' ? 'Modo claro' : 'Modo escuro';
        console.log(`✅ Ícone atualizado: ${themeIcon.textContent}`);
    } else {
        console.warn('⚠️ Elemento theme-icon não encontrado');
    }
    
    // Atualiza checkbox
    const themeSwitch = document.getElementById('theme-toggle-switch');
    if (themeSwitch) {
        themeSwitch.checked = theme === 'dark';
    }
    
    console.log(`✅ Tema alterado com sucesso para: ${theme}`);
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
                if (modal.id === 'editar-modal') fecharModalEditar();
            });
            
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
    
    // Atualização de notificações removida
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
    const modal = document.getElementById('modal-estatisticas');
    if (!modal) return;
    preencherModalEstatisticas();
    modal.style.display = 'flex';
    modal.onclick = function(e) {
        if (e.target === modal) fecharModalEstatisticas();
    };
}

function fecharModalEstatisticas() {
    const modal = document.getElementById('modal-estatisticas');
    if (modal) modal.style.display = 'none';
}

function preencherModalEstatisticas() {
    let totalUsuarios = 0;
    let totalEquipamentos = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith('db_')) continue;
        totalUsuarios++;
        try {
            const db = JSON.parse(localStorage.getItem(key) || '{}');
            const inv = db.inventorio || [];
            totalEquipamentos += Array.isArray(inv) ? inv.length : 0;
        } catch (_) {}
    }
    const rondas = JSON.parse(localStorage.getItem('rondas') || '[]');
    const rondasCount = Array.isArray(rondas) ? rondas.length : 0;
    const el = (id) => document.getElementById(id);
    if (el('modal-total-usuarios')) el('modal-total-usuarios').textContent = totalUsuarios;
    if (el('modal-total-equipamentos')) el('modal-total-equipamentos').textContent = totalEquipamentos;
    if (el('modal-rondas-realizadas')) el('modal-rondas-realizadas').textContent = rondasCount;
}

function abrirConfiguracoesAvancadas() {
    navigate('page-configuracoes');
}

function abrirLogsAuditoria() {
    const modal = document.getElementById('modal-logs');
    if (!modal) return;
    preencherModalLogs();
    modal.style.display = 'flex';
    modal.onclick = function(e) {
        if (e.target === modal) fecharModalLogs();
    };
}

function fecharModalLogs() {
    const modal = document.getElementById('modal-logs');
    if (modal) modal.style.display = 'none';
}

function preencherModalLogs() {
    const tbody = document.getElementById('logs-tbody');
    const logsVazio = document.getElementById('logs-vazio');
    if (!tbody) return;
    const entries = [];
    try {
        const log = JSON.parse(localStorage.getItem('axis_audit_log') || '[]');
        if (Array.isArray(log)) entries.push(...log);
    } catch (_) {}
    if (entries.length === 0) {
        const lastLogin = localStorage.getItem('last_login');
        const lastLogout = localStorage.getItem('last_logout');
        if (lastLogin) {
            try {
                const d = JSON.parse(lastLogin);
                entries.push({ type: 'login', user: d.usuario || '-', date: d.data || '' });
            } catch (_) {}
        }
        if (lastLogout) {
            try {
                const d = JSON.parse(lastLogout);
                entries.push({ type: 'logout', user: d.usuario || '-', date: d.data || '' });
            } catch (_) {}
        }
    }
    entries.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const limited = entries.slice(0, 100);
    if (limited.length === 0) {
        tbody.innerHTML = '';
        if (logsVazio) logsVazio.style.display = 'block';
        return;
    }
    if (logsVazio) logsVazio.style.display = 'none';
    tbody.innerHTML = limited.map((e) => {
        const dt = e.date ? new Date(e.date).toLocaleString('pt-BR') : '-';
        const ev = e.type === 'login' ? 'Login' : e.type === 'logout' ? 'Logout' : (e.type || 'Evento');
        return `<tr><td>${dt}</td><td>${ev}</td><td>${(e.user || '-').replace(/</g, '&lt;')}</td></tr>`;
    }).join('');
}

function carregarUsuarios() {
    const tbody = document.getElementById('usuarios-tbody');
    if (!tbody) return;
    
    const usuarios = [];
    
    // Busca todos os usuários no localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('db_') && key !== 'db_admin_filipe_silva') {
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
    const adminData = JSON.parse(localStorage.getItem('db_admin_filipe_silva') || '{}');
    if (adminData.name) {
        usuarios.unshift({
            login: 'admin_filipe_silva',
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
                    ${user.login !== 'admin_filipe_silva' ? `
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
    const login = document.getElementById('novo-usuario-login').value.trim();
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
    if (login === 'admin_filipe_silva' || login === 'ADMIN_FILIPE_SILVA') {
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

// ================= FUNÇÕES PARA RONDAS =================
function carregarRondas() {
    // Função para carregar dados de rondas
    // Pode ser expandida para carregar do localStorage ou API
}

function criarNovaRonda() {
    setTimeout(() => {
        window.location.href = 'pages/ronda.html';
    }, 500);
}

function verRondasPendentes() {
    // Filtra apenas rondas pendentes
    const pendentes = document.querySelectorAll('.status-pendente');
    if (pendentes.length > 0) {
        pendentes.forEach(item => {
            item.closest('.ronda-item').style.display = 'flex';
        });
        document.querySelectorAll('.status-concluida').forEach(item => {
            item.closest('.ronda-item').style.display = 'none';
        });
    }
}

function verHistoricoRondas() {
    // Mostra todas as rondas
    document.querySelectorAll('.ronda-item').forEach(item => {
        item.style.display = 'flex';
    });
}

function verDetalhesRonda(id) {
    // Pode abrir modal ou redirecionar para página de detalhes
}

function continuarRonda(id) {
    window.location.href = 'pages/ronda.html';
}

// ================= FUNÇÕES PARA SUPORTE =================
function carregarTickets() {
    console.log('🎫 Carregando tickets...');
    // Função para carregar dados de tickets
    // Pode ser expandida para carregar do localStorage ou API
}

function abrirNovoTicket() {
    console.log('🎫 Abrindo novo ticket...');
    const titulo = prompt('Digite o título do ticket:');
    if (titulo) {
        const descricao = prompt('Descreva o problema:');
        if (descricao) {
            showToast('Ticket criado com sucesso!', 'success');
            // Adiciona novo ticket à lista
            adicionarTicketToLista(titulo);
        }
    }
}

function verMeusTickets() {
    console.log('📋 Visualizando meus tickets...');
    showToast('Carregando seus tickets...', 'info');
    // Filtra apenas tickets do usuário atual
}

function abrirDocumentacao() {
    console.log('📚 Abrindo documentação...');
    showToast('Abrindo documentação do sistema...', 'info');
    // Pode abrir modal com documentação ou redirecionar
    alert('Documentação do Sistema AXIS\n\n1. Como cadastrar equipamentos\n2. Como realizar manutenções\n3. Como gerar relatórios\n\nEm breve: documentação completa disponível!');
}

function abrirFAQ() {
    console.log('❓ Abrindo FAQ...');
    showToast('Abrindo perguntas frequentes...', 'info');
    const faq = `
Perguntas Frequentes - AXIS

1. Como cadastrar um novo equipamento?
   - Acesse o módulo de Inventário e clique em "Criar Dispositivo"

2. Como realizar uma manutenção preventiva?
   - Acesse o módulo de Manutenção Preventiva e clique em "Iniciar Vistoria"

3. Como visualizar notas fiscais?
   - Acesse o módulo de Notas Fiscais para gerenciar sua biblioteca

4. Como alterar minhas configurações?
   - Acesse o módulo de Configurações no menu lateral
    `;
    alert(faq);
}

function verTicket(id) {
    console.log('🔍 Visualizando ticket:', id);
    showToast(`Abrindo ticket ${id}...`, 'info');
    alert(`Detalhes do Ticket ${id}\n\nStatus: Em análise\nCriado em: 26/01/2025\n\nDescrição: Problema reportado pelo usuário.\n\nEm breve: visualização completa de tickets!`);
}

function adicionarTicketToLista(titulo) {
    const ticketsLista = document.getElementById('tickets-lista');
    if (ticketsLista) {
        const novoTicket = document.createElement('div');
        novoTicket.className = 'ticket-item';
        novoTicket.innerHTML = `
            <div class="ticket-info">
                <span class="ticket-id">#TKT-${String(ticketsLista.children.length + 1).padStart(3, '0')}</span>
                <span class="ticket-titulo">${titulo}</span>
                <span class="ticket-status status-aberto">🟢 Aberto</span>
                <span class="ticket-data">${new Date().toLocaleDateString('pt-BR')}</span>
            </div>
            <button class="btn-secondary" onclick="verTicket('TKT-${String(ticketsLista.children.length + 1).padStart(3, '0')}')">Ver Detalhes</button>
        `;
        ticketsLista.insertBefore(novoTicket, ticketsLista.firstChild);
    }
}

// ================= FUNÇÕES GLOBAIS EXPORTADAS =================
// Torna funções disponíveis globalmente para eventos onclick
// Exporta ANTES de qualquer uso para garantir disponibilidade
// FORÇA exportação - sempre sobrescreve para garantir que está atualizada
if (typeof toggleSidebar === 'function') {
    window.toggleSidebar = toggleSidebar;
    Object.defineProperty(window, 'toggleSidebar', {
        value: toggleSidebar,
        writable: true,
        configurable: true,
        enumerable: true
    });
}

if (typeof navigate === 'function') {
    window.navigate = navigate;
    Object.defineProperty(window, 'navigate', {
        value: navigate,
        writable: true,
        configurable: true,
        enumerable: true
    });
}

// Garante que navigate esteja disponível imediatamente
if (typeof window.navigate !== 'function') {
    console.warn('⚠️ Função navigate não foi exportada corretamente, recriando...');
    window.navigate = function(pageId) {
        console.log(`📍 [Fallback] Navegando para: ${pageId}`);
        const sections = document.querySelectorAll('.main-section');
        sections.forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });
        const target = document.getElementById(pageId);
        if (target) {
            target.classList.add('active');
            target.style.display = 'block';
            localStorage.setItem('axis-current-page', pageId);
        }
    };
}
// FORÇA exportação de autenticação
if (typeof handleAuth === 'function') {
    window.handleAuth = handleAuth;
}
if (typeof togglePassword === 'function') {
    window.togglePassword = togglePassword;
}
if (typeof showToast === 'function') {
    window.showToast = showToast;
}
if (typeof showBemVindoModal === 'function') {
    window.showBemVindoModal = showBemVindoModal;
}
if (typeof fecharBemVindoModal === 'function') {
    window.fecharBemVindoModal = fecharBemVindoModal;
}
if (typeof logout === 'function') {
    window.logout = logout;
}
// FORÇA exportação de outras funções
if (typeof handleGlobalSearch === 'function') {
    window.handleGlobalSearch = handleGlobalSearch;
}
if (typeof filtrarPorModelo === 'function') {
    window.filtrarPorModelo = filtrarPorModelo;
}
// FORÇA exportação de todas as funções críticas
if (typeof filtrarInventario === 'function') {
    window.filtrarInventario = filtrarInventario;
}
if (typeof resetarFiltrosInventario === 'function') {
    window.resetarFiltrosInventario = resetarFiltrosInventario;
}
if (typeof editarEquipamento === 'function') {
    window.editarEquipamento = editarEquipamento;
}
if (typeof excluirEquipamento === 'function') {
    window.excluirEquipamento = excluirEquipamento;
}
if (typeof ordenarTabela === 'function') {
    window.ordenarTabela = ordenarTabela;
}
if (typeof mudarPagina === 'function') {
    window.mudarPagina = mudarPagina;
}
if (typeof exportarDados === 'function') {
    window.exportarDados = exportarDados;
}
// FORÇA exportação de abrirCadastroRapido (CRÍTICO)
if (typeof abrirCadastroRapido === 'function') {
    window.abrirCadastroRapido = abrirCadastroRapido;
    // Protege a função
    Object.defineProperty(window, 'abrirCadastroRapido', {
        value: abrirCadastroRapido,
        writable: true,
        configurable: true,
        enumerable: true
    });
    console.log('✅ abrirCadastroRapido exportada e protegida');
} else {
    console.error('❌ abrirCadastroRapido não foi definida!');
}
// FORÇA exportação de funções de Rondas
if (typeof carregarRondas === 'function') {
    window.carregarRondas = carregarRondas;
}
if (typeof criarNovaRonda === 'function') {
    window.criarNovaRonda = criarNovaRonda;
}
if (typeof verRondasPendentes === 'function') {
    window.verRondasPendentes = verRondasPendentes;
}
if (typeof verHistoricoRondas === 'function') {
    window.verHistoricoRondas = verHistoricoRondas;
}
if (typeof verDetalhesRonda === 'function') {
    window.verDetalhesRonda = verDetalhesRonda;
}
if (typeof continuarRonda === 'function') {
    window.continuarRonda = continuarRonda;
}

// FORÇA exportação de funções de Suporte
if (typeof abrirNovoTicket === 'function') {
    window.abrirNovoTicket = abrirNovoTicket;
}
if (typeof verMeusTickets === 'function') {
    window.verMeusTickets = verMeusTickets;
}
if (typeof abrirDocumentacao === 'function') {
    window.abrirDocumentacao = abrirDocumentacao;
}
if (typeof abrirFAQ === 'function') {
    window.abrirFAQ = abrirFAQ;
}
if (typeof verTicket === 'function') {
    window.verTicket = verTicket;
}
if (typeof carregarTickets === 'function') {
    window.carregarTickets = carregarTickets;
}
// FORÇA exportação de funções do modal
if (typeof fecharCadastro === 'function') {
    window.fecharCadastro = fecharCadastro;
}
if (typeof proximoPassoCadastro === 'function') {
    window.proximoPassoCadastro = proximoPassoCadastro;
}
if (typeof passoAnteriorCadastro === 'function') {
    window.passoAnteriorCadastro = passoAnteriorCadastro;
}
if (typeof finalizarCadastro === 'function') {
    window.finalizarCadastro = finalizarCadastro;
}
if (typeof renderizarTabela === 'function') {
    window.renderizarTabela = renderizarTabela;
}
if (typeof inicializarInventario === 'function') {
    window.inicializarInventario = inicializarInventario;
}

// FORÇA exportação de funções administrativas
if (typeof cadastrarUsuario === 'function') {
    window.cadastrarUsuario = cadastrarUsuario;
}
if (typeof limparFormularioUsuario === 'function') {
    window.limparFormularioUsuario = limparFormularioUsuario;
}
if (typeof filtrarUsuarios === 'function') {
    window.filtrarUsuarios = filtrarUsuarios;
}
if (typeof editarUsuario === 'function') {
    window.editarUsuario = editarUsuario;
}
if (typeof excluirUsuario === 'function') {
    window.excluirUsuario = excluirUsuario;
}
if (typeof abrirGerenciarUsuarios === 'function') {
    window.abrirGerenciarUsuarios = abrirGerenciarUsuarios;
}
if (typeof fecharModalUsuarios === 'function') {
    window.fecharModalUsuarios = fecharModalUsuarios;
}
if (typeof fecharModalEstatisticas === 'function') {
    window.fecharModalEstatisticas = fecharModalEstatisticas;
}
if (typeof fecharModalLogs === 'function') {
    window.fecharModalLogs = fecharModalLogs;
}
if (typeof abrirEstatisticasSistema === 'function') {
    window.abrirEstatisticasSistema = abrirEstatisticasSistema;
}
if (typeof abrirConfiguracoesAvancadas === 'function') {
    window.abrirConfiguracoesAvancadas = abrirConfiguracoesAvancadas;
}
if (typeof abrirLogsAuditoria === 'function') {
    window.abrirLogsAuditoria = abrirLogsAuditoria;
}

// FORÇA exportação de funções de equipamentos
if (typeof pingEquipamento === 'function') {
    window.pingEquipamento = pingEquipamento;
}
if (typeof verDetalhes === 'function') {
    window.verDetalhes = verDetalhes;
}
if (typeof fecharDetalhes === 'function') {
    window.fecharDetalhes = fecharDetalhes;
}
if (typeof fecharModalEditar === 'function') {
    window.fecharModalEditar = fecharModalEditar;
}
if (typeof abrirModalEditar === 'function') {
    window.abrirModalEditar = abrirModalEditar;
}
if (typeof copiarParaClipboard === 'function') {
    window.copiarParaClipboard = copiarParaClipboard;
}

// FORÇA exportação de outras funções
if (typeof toggleHighContrast === 'function') {
    window.toggleHighContrast = toggleHighContrast;
}
if (typeof imprimirInventario === 'function') {
    window.imprimirInventario = imprimirInventario;
}
if (typeof toggleFAB === 'function') {
    window.toggleFAB = toggleFAB;
}
if (typeof updateItemsPerPage === 'function') {
    window.updateItemsPerPage = updateItemsPerPage;
}
if (typeof clearLocalCache === 'function') {
    window.clearLocalCache = clearLocalCache;
}
if (typeof exportSettings === 'function') {
    window.exportSettings = exportSettings;
}

// Log final de exportação
console.log('✅ Todas as funções foram exportadas para window');

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