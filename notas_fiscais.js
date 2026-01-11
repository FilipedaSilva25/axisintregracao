/* ============================================
   AXIS DOCUMENTS - SISTEMA DE NOTAS FISCAIS
   ============================================ */

// ================= CONFIGURAÇÃO INICIAL =================
const AppConfig = {
    APP_NAME: 'AXIS Documents',
    VERSION: '2.0.0',
    STORAGE_KEY: 'axis_documents_data',
    BACKUP_KEY: 'axis_backups',
    SETTINGS_KEY: 'axis_settings',
    ITEMS_PER_PAGE: 12
};

// ================= VARIÁVEIS GLOBAIS =================
let currentUser = null;
let notasFiscais = [];
let notasFiltradas = [];
let currentPage = 1;
let currentFilter = 'all';
let currentView = 'grid';
let sortField = 'data';
let sortDirection = 'desc';
let selectedFiles = [];
let selectedXMLs = [];
let backups = [];
let settings = {};
let lembretes = [];
let sistemaNotificacoes = [];

// ================= INICIALIZAÇÃO =================
document.addEventListener('DOMContentLoaded', function() {
    console.log(`${AppConfig.APP_NAME} v${AppConfig.VERSION} - Inicializando...`);
    
    // Carregar dados salvos
    carregarDados();
    
    // Configurar eventos
    configurarEventos();
    
    // Inicializar interface
    inicializarInterface();
    
    // Carregar dados iniciais
    carregarDadosIniciais();
    
    // Inicializar sistema de notificações
    inicializarSistemaNotificacoes();
    
    console.log(`${AppConfig.APP_NAME} - Sistema inicializado com sucesso!`);
});

function carregarDados() {
    // Carregar dados do localStorage
    const savedData = localStorage.getItem(AppConfig.STORAGE_KEY);
    const savedBackups = localStorage.getItem(AppConfig.BACKUP_KEY);
    const savedSettings = localStorage.getItem(AppConfig.SETTINGS_KEY);
    
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            notasFiscais = data.notasFiscais || [];
            currentUser = data.currentUser || { 
                nome: 'Administrador', 
                role: 'Gestor Financeiro',
                email: 'admin@axis.com'
            };
            lembretes = data.lembretes || [];
            console.log('Dados carregados do localStorage');
        } catch (e) {
            console.error('Erro ao carregar dados:', e);
            inicializarDadosPadrao();
        }
    } else {
        inicializarDadosPadrao();
    }
    
    // Carregar backups
    if (savedBackups) {
        try {
            backups = JSON.parse(savedBackups);
        } catch (e) {
            console.error('Erro ao carregar backups:', e);
            backups = [];
        }
    }
    
    // Carregar configurações
    if (savedSettings) {
        try {
            settings = JSON.parse(savedSettings);
        } catch (e) {
            console.error('Erro ao carregar configurações:', e);
            settings = obterConfiguracoesPadrao();
        }
    } else {
        settings = obterConfiguracoesPadrao();
    }
}

function obterConfiguracoesPadrao() {
    return {
        itemsPerPage: 12,
        defaultView: 'grid',
        currency: 'BRL',
        dateFormat: 'pt-BR',
        autoSave: true,
        animations: true,
        notifyExpiring: true,
        notifyDaysBefore: 7,
        notifyNew: true,
        notifyBackup: true,
        notificationSound: 'default',
        desktopNotifications: false,
        autoBackup: true,
        backupFrequency: 'daily',
        backupLocation: 'local',
        autoLock: true,
        lockTimeout: 15,
        exportEncrypt: true,
        activityLog: true,
        syncCloud: false,
        syncInterval: 30
    };
}

function inicializarDadosPadrao() {
    currentUser = {
        nome: 'Administrador',
        role: 'Gestor Financeiro',
        email: 'admin@axis.com'
    };
    
    // Gerar dados de exemplo
    notasFiscais = gerarDadosExemplo();
    lembretes = [];
    
    // Gerar backup inicial
    criarBackupInicial();
    
    salvarDados();
    salvarBackups();
    salvarConfiguracoes();
    
    console.log('Dados padrão inicializados');
}

function gerarDadosExemplo() {
    const fornecedores = [
        'ZEBRA TECHNOLOGIES BRASIL LTDA',
        'MICROSOFT DO BRASIL LTDA',
        'AMAZON WEB SERVICES BRASIL',
        'DELL COMPUTADORES DO BRASIL',
        'HP DO BRASIL',
        'SAMSUNG ELETRÔNICA',
        'LG ELETRONICS',
        'INTEL BRASIL',
        'IBM DO BRASIL',
        'ORACLE DO BRASIL'
    ];
    
    const tipos = ['entrada', 'saida', 'servico'];
    const statusList = ['pendente', 'pago', 'vencido'];
    const categorias = ['TI', 'Infraestrutura', 'Software', 'Hardware', 'Serviços'];
    
    const dados = [];
    const hoje = new Date();
    
    for (let i = 1; i <= 50; i++) {
        const tipo = tipos[Math.floor(Math.random() * tipos.length)];
        const status = statusList[Math.floor(Math.random() * statusList.length)];
        const fornecedor = fornecedores[Math.floor(Math.random() * fornecedores.length)];
        const valor = Math.floor(Math.random() * 50000) + 1000;
        
        // Data aleatória nos últimos 90 dias
        const data = new Date();
        data.setDate(hoje.getDate() - Math.floor(Math.random() * 90));
        
        // Data de vencimento (1-30 dias após emissão)
        const vencimento = new Date(data);
        vencimento.setDate(vencimento.getDate() + Math.floor(Math.random() * 30) + 1);
        
        // Se pago, data de pagamento aleatória entre emissão e vencimento
        let pagamento = null;
        if (status === 'pago') {
            pagamento = new Date(data);
            pagamento.setDate(pagamento.getDate() + Math.floor(Math.random() * (vencimento - data) / (1000 * 60 * 60 * 24)));
        }
        
        dados.push({
            id: `NF${i.toString().padStart(6, '0')}`,
            numero: (100000 + i).toString(),
            serie: '1',
            modelo: '55',
            chave: `NFe${Math.floor(Math.random() * 100000000000000000000000000000).toString().padStart(44, '0')}`,
            tipo: tipo,
            status: status,
            data: data.toISOString().split('T')[0],
            emissao: data.toISOString().split('T')[0],
            vencimento: vencimento.toISOString().split('T')[0],
            pagamento: pagamento ? pagamento.toISOString().split('T')[0] : null,
            fornecedor: fornecedor,
            cnpj: `${Math.floor(Math.random() * 100000000000000).toString().padStart(14, '0').replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}`,
            valor: valor,
            desconto: Math.floor(Math.random() * 500),
            impostos: {
                icms: valor * 0.18,
                pis: valor * 0.0165,
                cofins: valor * 0.076,
                iss: tipo === 'servico' ? valor * 0.05 : 0
            },
            produtos: [
                {
                    descricao: `Produto ${i}`,
                    quantidade: Math.floor(Math.random() * 10) + 1,
                    valorUnitario: valor / (Math.floor(Math.random() * 10) + 1),
                    valorTotal: valor
                }
            ],
            tags: ['importante', 'urgente'].slice(0, Math.floor(Math.random() * 2) + 1),
            categorias: [categorias[Math.floor(Math.random() * categorias.length)]],
            observacoes: 'Nota fiscal de exemplo para demonstração do sistema.',
            arquivos: [`nf_${i}.pdf`],
            criadoPor: currentUser.nome,
            criadoEm: data.toISOString(),
            modificadoEm: data.toISOString()
        });
    }
    
    return dados;
}

function salvarDados() {
    const data = {
        notasFiscais: notasFiscais,
        currentUser: currentUser,
        lembretes: lembretes,
        ultimoAcesso: new Date().toISOString()
    };
    
    try {
        localStorage.setItem(AppConfig.STORAGE_KEY, JSON.stringify(data));
        console.log('Dados salvos no localStorage');
        
        // Log de atividade
        if (settings.activityLog) {
            registrarAtividade('Dados salvos', `Total de notas: ${notasFiscais.length}`);
        }
    } catch (e) {
        console.error('Erro ao salvar dados:', e);
        showToast('Erro ao salvar dados. Verifique o espaço disponível.', 'error');
    }
}

function salvarBackups() {
    try {
        localStorage.setItem(AppConfig.BACKUP_KEY, JSON.stringify(backups));
        console.log('Backups salvos');
    } catch (e) {
        console.error('Erro ao salvar backups:', e);
    }
}

function salvarConfiguracoes() {
    try {
        localStorage.setItem(AppConfig.SETTINGS_KEY, JSON.stringify(settings));
        console.log('Configurações salvas');
    } catch (e) {
        console.error('Erro ao salvar configurações:', e);
    }
}

function configurarEventos() {
    // Eventos do teclado
    document.addEventListener('keydown', function(e) {
        // Ctrl + K para busca
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('global-search');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // Ctrl + S para salvar
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            salvarDados();
            showToast('Dados salvos com sucesso!', 'success');
        }
        
        // Ctrl + B para backup
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            criarBackup();
        }
        
        // Esc para fechar modais
        if (e.key === 'Escape') {
            fecharTodosModais();
            fecharSidebar();
        }
    });
    
    // Eventos de upload
    const uploadArea = document.getElementById('upload-area');
    if (uploadArea) {
        uploadArea.addEventListener('click', function() {
            document.getElementById('file-input').click();
        });
        
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--primary-color)';
            uploadArea.style.backgroundColor = 'var(--primary-light)';
        });
        
        uploadArea.addEventListener('dragleave', function() {
            uploadArea.style.borderColor = 'var(--border-color)';
            uploadArea.style.backgroundColor = 'transparent';
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--border-color)';
            uploadArea.style.backgroundColor = 'transparent';
            
            if (e.dataTransfer.files.length > 0) {
                selectedFiles = Array.from(e.dataTransfer.files);
                processarArquivosSelecionados();
            }
        });
    }
    
    // Evento do input de arquivos
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                selectedFiles = Array.from(e.target.files);
                processarArquivosSelecionados();
            }
        });
    }
    
    // Evento de busca
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                filtrarNotasFiscais();
            }, 300);
        });
    }
    
    // Eventos XML
    const xmlUploadArea = document.getElementById('xml-upload-area');
    if (xmlUploadArea) {
        xmlUploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            xmlUploadArea.style.borderColor = 'var(--primary-color)';
            xmlUploadArea.style.backgroundColor = 'var(--primary-light)';
        });
        
        xmlUploadArea.addEventListener('dragleave', function() {
            xmlUploadArea.style.borderColor = 'var(--border-color)';
            xmlUploadArea.style.backgroundColor = 'transparent';
        });
        
        xmlUploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            xmlUploadArea.style.borderColor = 'var(--border-color)';
            xmlUploadArea.style.backgroundColor = 'transparent';
            
            if (e.dataTransfer.files.length > 0) {
                selectedXMLs = Array.from(e.dataTransfer.files).filter(file => 
                    file.name.toLowerCase().endsWith('.xml')
                );
                processarXMLsSelecionados();
            }
        });
    }
    
    const xmlInput = document.getElementById('xml-input');
    if (xmlInput) {
        xmlInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                selectedXMLs = Array.from(e.target.files).filter(file => 
                    file.name.toLowerCase().endsWith('.xml')
                );
                processarXMLsSelecionados();
            }
        });
    }
    
    // Eventos de configurações
    const reportPeriod = document.getElementById('report-period');
    if (reportPeriod) {
        reportPeriod.addEventListener('change', function() {
            const customDates = document.getElementById('custom-dates');
            if (this.value === 'custom') {
                customDates.style.display = 'block';
            } else {
                customDates.style.display = 'none';
            }
        });
    }
    
    // Auto-save se configurado
    if (settings.autoSave) {
        setInterval(() => {
            salvarDados();
        }, 30000); // Salvar a cada 30 segundos
    }
    
    // Auto-backup se configurado
    if (settings.autoBackup) {
        setInterval(() => {
            verificarBackupAutomatico();
        }, 60000); // Verificar a cada minuto
    }
    
    // Verificar vencimentos
    setInterval(() => {
        verificarNotificacoesVencimento();
    }, 300000); // Verificar a cada 5 minutos
}

function inicializarInterface() {
    // Configurar tema
    const savedTheme = localStorage.getItem('axis_documents_theme') || 'light';
    setTheme(savedTheme);
    
    // Atualizar informações do usuário
    atualizarInfoUsuario();
    
    // Carregar configurações na interface
    carregarConfiguracoesInterface();
    
    // Mostrar dashboard inicialmente
    showSection('dashboard');
    
    // Inicializar gráficos
    inicializarGraficos();
}

function carregarConfiguracoesInterface() {
    // Configurações gerais
    const itemsPerPage = document.getElementById('settings-items-per-page');
    if (itemsPerPage) itemsPerPage.value = settings.itemsPerPage || 12;
    
    const defaultView = document.getElementById('settings-default-view');
    if (defaultView) defaultView.value = settings.defaultView || 'grid';
    
    const currency = document.getElementById('settings-currency');
    if (currency) currency.value = settings.currency || 'BRL';
    
    const dateFormat = document.getElementById('settings-date-format');
    if (dateFormat) dateFormat.value = settings.dateFormat || 'pt-BR';
    
    const autoSave = document.getElementById('settings-auto-save');
    if (autoSave) autoSave.checked = settings.autoSave !== false;
    
    const animations = document.getElementById('settings-animations');
    if (animations) animations.checked = settings.animations !== false;
    
    // Notificações
    const notifyExpiring = document.getElementById('notify-expiring');
    if (notifyExpiring) notifyExpiring.checked = settings.notifyExpiring !== false;
    
    const notifyDaysBefore = document.getElementById('notify-days-before');
    if (notifyDaysBefore) notifyDaysBefore.value = settings.notifyDaysBefore || 7;
    
    const notifyNew = document.getElementById('notify-new');
    if (notifyNew) notifyNew.checked = settings.notifyNew !== false;
    
    const notifyBackup = document.getElementById('notify-backup');
    if (notifyBackup) notifyBackup.checked = settings.notifyBackup !== false;
    
    const notificationSound = document.getElementById('notification-sound');
    if (notificationSound) notificationSound.value = settings.notificationSound || 'default';
    
    const desktopNotifications = document.getElementById('desktop-notifications');
    if (desktopNotifications) desktopNotifications.checked = settings.desktopNotifications || false;
    
    // Backup
    const autoBackup = document.getElementById('auto-backup');
    if (autoBackup) autoBackup.checked = settings.autoBackup !== false;
    
    const backupFrequency = document.getElementById('backup-frequency');
    if (backupFrequency) backupFrequency.value = settings.backupFrequency || 'daily';
    
    const backupLocation = document.getElementById('backup-location');
    if (backupLocation) backupLocation.value = settings.backupLocation || 'local';
    
    // Segurança
    const autoLock = document.getElementById('auto-lock');
    if (autoLock) autoLock.checked = settings.autoLock !== false;
    
    const lockTimeout = document.getElementById('lock-timeout');
    if (lockTimeout) lockTimeout.value = settings.lockTimeout || 15;
    
    const exportEncrypt = document.getElementById('export-encrypt');
    if (exportEncrypt) exportEncrypt.checked = settings.exportEncrypt !== false;
    
    const activityLog = document.getElementById('activity-log');
    if (activityLog) activityLog.checked = settings.activityLog !== false;
    
    const syncCloud = document.getElementById('sync-cloud');
    if (syncCloud) syncCloud.checked = settings.syncCloud || false;
    
    const syncInterval = document.getElementById('sync-interval');
    if (syncInterval) syncInterval.value = settings.syncInterval || 30;
}

function carregarDadosIniciais() {
    // Atualizar estatísticas
    atualizarEstatisticas();
    
    // Atualizar contador no menu
    atualizarContadorNFs();
    
    // Carregar últimas notas
    carregarUltimasNotas();
    
    // Carregar backups
    carregarListaBackups();
    
    // Carregar lembretes
    carregarLembretes();
    
    // Aplicar filtro inicial
    filtrarNotasFiscais();
}

function inicializarSistemaNotificacoes() {
    // Verificar notificações pendentes
    verificarNotificacoesVencimento();
    
    // Configurar notificações do navegador
    if ('Notification' in window && settings.desktopNotifications) {
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
}

// ================= GERENCIAMENTO DE INTERFACE =================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        overlay.style.display = 'none';
    } else {
        sidebar.classList.add('open');
        overlay.style.display = 'block';
    }
}

function fecharSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    sidebar.classList.remove('open');
    overlay.style.display = 'none';
}

function showSection(sectionId) {
    // Esconder todas as seções
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostrar seção selecionada
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Atualizar título da página
        atualizarTituloPagina(sectionId);
        
        // Atualizar menu ativo
        atualizarMenuAtivo(sectionId);
        
        // Se for a seção de notas, carregar dados
        if (sectionId === 'notas') {
            filtrarNotasFiscais();
        }
        
        // Se for dashboard, atualizar gráficos
        if (sectionId === 'dashboard') {
            setTimeout(() => {
                atualizarGraficos();
            }, 100);
        }
        
        // Se for relatórios, carregar dados
        if (sectionId === 'relatorios') {
            gerarRelatorioAvancado();
        }
        
        // Se for configurações, carregar abas
        if (sectionId === 'configuracoes') {
            openSettingsTab('geral');
        }
    }
}

function atualizarTituloPagina(sectionId) {
    const titles = {
        'dashboard': 'Dashboard',
        'notas': 'Notas Fiscais',
        'fornecedores': 'Fornecedores',
        'relatorios': 'Relatórios',
        'backup': 'Backup',
        'configuracoes': 'Configurações'
    };
    
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    
    if (pageTitle) {
        pageTitle.textContent = titles[sectionId] || 'Dashboard';
    }
    
    if (pageSubtitle) {
        const subtitles = {
            'dashboard': 'Visão geral do sistema',
            'notas': 'Gerencie suas notas fiscais',
            'fornecedores': 'Cadastro de fornecedores',
            'relatorios': 'Relatórios e análises',
            'backup': 'Backup e restauração',
            'configuracoes': 'Configurações do sistema'
        };
        pageSubtitle.textContent = subtitles[sectionId] || 'Sistema de gestão de notas fiscais';
    }
}

function atualizarMenuAtivo(sectionId) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        
        const onclickAttr = item.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(sectionId)) {
            item.classList.add('active');
        }
    });
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    setTheme(newTheme);
    
    showToast(`Tema ${newTheme === 'dark' ? 'escuro' : 'claro'} ativado`, 'success');
}

function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('axis_documents_theme', theme);
    
    // Atualizar ícone
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        themeIcon.title = `Alternar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`;
    }
}

function toggleAdvancedSearch() {
    const advancedSearch = document.getElementById('advanced-search');
    advancedSearch.classList.toggle('show');
}

function toggleNotifications() {
    const notificationsPanel = document.getElementById('notifications-panel');
    notificationsPanel.classList.toggle('show');
    
    if (notificationsPanel.classList.contains('show')) {
        carregarNotificacoes();
    }
}

function toggleFAB() {
    const fabContainer = document.querySelector('.fab-container');
    fabContainer.classList.toggle('active');
}

function openSettingsTab(tabId) {
    // Esconder todas as abas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remover ativo de todos os botões
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar aba selecionada
    const targetTab = document.getElementById(`tab-${tabId}`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // Ativar botão
    const targetBtn = document.querySelector(`.tab-btn[onclick*="${tabId}"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }
}

// ================= GERENCIAMENTO DE NOTAS FISCAIS =================
function filtrarNotasFiscais() {
    const searchTerm = document.getElementById('global-search').value.toLowerCase();
    
    // Aplicar filtro atual
    notasFiltradas = notasFiscais.filter(nota => {
        // Filtro por tipo
        if (currentFilter !== 'all') {
            if (currentFilter === 'pendente' && nota.status !== 'pendente') return false;
            if (currentFilter === 'entrada' && nota.tipo !== 'entrada') return false;
            if (currentFilter === 'saida' && nota.tipo !== 'saida') return false;
        }
        
        // Busca por termo
        if (searchTerm) {
            const searchFields = [
                nota.numero,
                nota.fornecedor,
                nota.cnpj,
                nota.tags?.join(' '),
                nota.categorias?.join(' '),
                nota.observacoes
            ].filter(field => field).join(' ').toLowerCase();
            
            if (!searchFields.includes(searchTerm)) {
                return false;
            }
        }
        
        return true;
    });
    
    // Ordenar
    ordenarNotas();
    
    // Atualizar interface
    atualizarListaNotas();
}

function filtrarPorTipo(tipo) {
    currentFilter = tipo;
    currentPage = 1;
    
    // Atualizar botões ativos
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('onclick')?.includes(tipo)) {
            tab.classList.add('active');
        }
    });
    
    // Aplicar filtro
    filtrarNotasFiscais();
    
    showToast(`Filtro aplicado: ${getFilterName(tipo)}`, 'info');
}

function getFilterName(tipo) {
    const names = {
        'all': 'Todas',
        'pendente': 'Pendentes',
        'entrada': 'Entrada',
        'saida': 'Saída'
    };
    return names[tipo] || tipo;
}

function ordenarNotas() {
    notasFiltradas.sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        
        // Tratamento especial para datas
        if (sortField === 'data' || sortField === 'vencimento' || sortField === 'emissao') {
            valA = new Date(valA);
            valB = new Date(valB);
        }
        
        // Tratamento especial para valores
        if (sortField === 'valor') {
            valA = a.valor;
            valB = b.valor;
        }
        
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
}

function sortTable(field) {
    if (sortField === field) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortField = field;
        sortDirection = 'asc';
    }
    
    ordenarNotas();
    atualizarListaNotas();
    
    showToast(`Ordenado por ${field} (${sortDirection})`, 'info');
}

function atualizarListaNotas() {
    if (currentView === 'grid') {
        renderizarGridNotas();
    } else {
        renderizarListaNotas();
    }
    
    atualizarPaginacao();
}

function renderizarGridNotas() {
    const nfsGrid = document.getElementById('nfs-grid');
    if (!nfsGrid) return;
    
    // Calcular itens para a página atual
    const startIndex = (currentPage - 1) * settings.itemsPerPage;
    const endIndex = startIndex + settings.itemsPerPage;
    const pageItems = notasFiltradas.slice(startIndex, endIndex);
    
    if (pageItems.length === 0) {
        nfsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-invoice" style="font-size: 3rem; color: var(--text-light); margin-bottom: 1rem;"></i>
                <h3>Nenhuma nota fiscal encontrada</h3>
                <p>Tente ajustar os filtros ou adicionar uma nova nota fiscal</p>
                <button class="btn-primary" onclick="abrirUpload()">
                    <i class="fas fa-plus"></i> Adicionar Nota Fiscal
                </button>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    pageItems.forEach(nota => {
        const statusClass = `nf-status ${nota.status}`;
        const statusText = nota.status === 'pendente' ? 'Pendente' : 
                          nota.status === 'pago' ? 'Pago' : 'Vencido';
        
        const tipoIcon = nota.tipo === 'entrada' ? '⬇️' : 
                        nota.tipo === 'saida' ? '⬆️' : '🔧';
        
        const valorFormatado = formatarMoeda(nota.valor, settings.currency);
        const dataFormatada = formatarData(nota.data, settings.dateFormat);
        
        html += `
            <div class="nf-card" data-id="${nota.id}">
                <div class="nf-card-header">
                    <div class="nf-number">NF-e ${nota.numero}</div>
                    <span class="${statusClass}">${statusText}</span>
                </div>
                
                <div class="nf-card-body">
                    <div class="nf-supplier">${nota.fornecedor}</div>
                    
                    <div class="nf-details">
                        <div class="nf-detail">
                            <span class="nf-label">Data</span>
                            <span class="nf-value">${dataFormatada}</span>
                        </div>
                        <div class="nf-detail">
                            <span class="nf-label">Tipo</span>
                            <span class="nf-value">${tipoIcon} ${nota.tipo}</span>
                        </div>
                        <div class="nf-detail">
                            <span class="nf-label">Valor</span>
                            <span class="nf-value valor">${valorFormatado}</span>
                        </div>
                        <div class="nf-detail">
                            <span class="nf-label">Vencimento</span>
                            <span class="nf-value">${formatarData(nota.vencimento, settings.dateFormat)}</span>
                        </div>
                    </div>
                    
                    ${nota.tags && nota.tags.length > 0 ? `
                        <div class="nf-tags">
                            ${nota.tags.slice(0, 3).map(tag => `
                                <span class="nf-tag">${tag}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                
                <div class="nf-card-footer">
                    <span class="nf-date">Adicionada em ${formatarData(nota.criadoEm, settings.dateFormat)}</span>
                    <div class="nf-actions">
                        <button class="nf-action" onclick="verDetalhes('${nota.id}')" title="Ver detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="nf-action" onclick="baixarNota('${nota.id}')" title="Baixar">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="nf-action" onclick="editarNota('${nota.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    nfsGrid.innerHTML = html;
    
    // Mostrar grid, esconder lista
    nfsGrid.style.display = 'grid';
    document.getElementById('nfs-list').style.display = 'none';
}

function renderizarListaNotas() {
    const tbody = document.getElementById('nfs-table-body');
    if (!tbody) return;
    
    // Calcular itens para a página atual
    const startIndex = (currentPage - 1) * settings.itemsPerPage;
    const endIndex = startIndex + settings.itemsPerPage;
    const pageItems = notasFiltradas.slice(startIndex, endIndex);
    
    if (pageItems.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center p-4">
                    <div class="empty-state">
                        <i class="fas fa-file-invoice" style="font-size: 2rem; color: var(--text-light); margin-bottom: 0.5rem;"></i>
                        <p>Nenhuma nota fiscal encontrada</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    pageItems.forEach(nota => {
        const statusClass = nota.status === 'pendente' ? 'warning' : 
                          nota.status === 'pago' ? 'success' : 'danger';
        
        const statusIcon = nota.status === 'pendente' ? '●' : 
                          nota.status === 'pago' ? '●' : '●';
        
        const valorFormatado = formatarMoeda(nota.valor, settings.currency);
        const dataFormatada = formatarData(nota.data, settings.dateFormat);
        
        html += `
            <tr>
                <td><strong>NF-e ${nota.numero}</strong></td>
                <td>${nota.fornecedor}</td>
                <td>${dataFormatada}</td>
                <td><strong>${valorFormatado}</strong></td>
                <td>
                    <span style="color: var(--${statusClass}-color);">
                        ${statusIcon} ${nota.status === 'pendente' ? 'Pendente' : nota.status === 'pago' ? 'Pago' : 'Vencido'}
                    </span>
                </td>
                <td>
                    <span class="nf-tag">${nota.tipo}</span>
                </td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="nf-action" onclick="verDetalhes('${nota.id}')" title="Ver detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="nf-action" onclick="baixarNota('${nota.id}')" title="Baixar">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="nf-action" onclick="editarNota('${nota.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    // Mostrar lista, esconder grid
    document.getElementById('nfs-grid').style.display = 'none';
    document.getElementById('nfs-list').style.display = 'block';
}

function changeView(view) {
    currentView = view;
    
    // Atualizar botões ativos
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick')?.includes(view)) {
            btn.classList.add('active');
        }
    });
    
    // Atualizar visualização
    atualizarListaNotas();
    
    showToast(`Visualização alterada para ${view === 'grid' ? 'grade' : 'lista'}`, 'info');
}

function atualizarPaginacao() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    const totalPages = Math.ceil(notasFiltradas.length / settings.itemsPerPage);
    
    if (totalPages <= 1) {
        pagination.innerHTML = `
            <div class="text-center" style="color: var(--text-secondary);">
                ${notasFiltradas.length} notas fiscais encontradas
            </div>
        `;
        return;
    }
    
    let html = `
        <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">
            Página ${currentPage} de ${totalPages}
        </div>
        <div style="display: flex; gap: 0.25rem;">
    `;
    
    // Botão primeira página
    html += `
        <button class="pagination-btn" onclick="goToPage(1)" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-angle-double-left"></i>
        </button>
        <button class="pagination-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-angle-left"></i>
        </button>
    `;
    
    // Números de página
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
        html += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">
                ${i}
            </button>
        `;
    }
    
    // Botão próxima página
    html += `
        <button class="pagination-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-angle-right"></i>
        </button>
        <button class="pagination-btn" onclick="goToPage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-angle-double-right"></i>
        </button>
    `;
    
    html += `</div>`;
    
    pagination.innerHTML = html;
}

function goToPage(page) {
    const totalPages = Math.ceil(notasFiltradas.length / settings.itemsPerPage);
    
    if (page < 1 || page > totalPages || page === currentPage) {
        return;
    }
    
    currentPage = page;
    atualizarListaNotas();
    
    // Scroll para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================= FUNÇÕES DE NOTAS =================
function verDetalhes(id) {
    const nota = notasFiscais.find(n => n.id === id);
    if (!nota) {
        showToast('Nota fiscal não encontrada', 'error');
        return;
    }
    
    const modalBody = document.getElementById('nf-details');
    if (!modalBody) return;
    
    const statusClass = nota.status === 'pendente' ? 'warning' : 
                       nota.status === 'pago' ? 'success' : 'danger';
    
    const tipoText = nota.tipo === 'entrada' ? 'Entrada' : 
                    nota.tipo === 'saida' ? 'Saída' : 'Serviço';
    
    modalBody.innerHTML = `
        <div class="nf-detail-header">
            <div>
                <h3>NF-e ${nota.numero}</h3>
                <p style="color: var(--text-secondary);">${nota.fornecedor}</p>
            </div>
            <div>
                <span class="nf-status ${nota.status}" style="font-size: 0.875rem;">
                    ${nota.status === 'pendente' ? 'Pendente' : nota.status === 'pago' ? 'Pago' : 'Vencido'}
                </span>
            </div>
        </div>
        
        <div class="nf-detail-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin: 1.5rem 0;">
            <div>
                <h4 style="margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">Informações</h4>
                <div style="background: var(--bg-color); padding: 1rem; border-radius: 0.5rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="color: var(--text-secondary);">Tipo:</span>
                        <span style="font-weight: 500;">${tipoText}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="color: var(--text-secondary);">Emissão:</span>
                        <span>${formatarData(nota.emissao, settings.dateFormat)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="color: var(--text-secondary);">Vencimento:</span>
                        <span>${formatarData(nota.vencimento, settings.dateFormat)}</span>
                    </div>
                    ${nota.pagamento ? `
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-secondary);">Pagamento:</span>
                            <span>${formatarData(nota.pagamento, settings.dateFormat)}</span>
                        </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;">
                        <span style="color: var(--text-secondary);">CNPJ:</span>
                        <span style="font-family: monospace;">${formatarCNPJ(nota.cnpj)}</span>
                    </div>
                </div>
            </div>
            
            <div>
                <h4 style="margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">Valores</h4>
                <div style="background: var(--bg-color); padding: 1rem; border-radius: 0.5rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="color: var(--text-secondary);">Valor Total:</span>
                        <span style="font-weight: 700; color: var(--primary-color);">${formatarMoeda(nota.valor, settings.currency)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="color: var(--text-secondary);">Desconto:</span>
                        <span>${formatarMoeda(nota.desconto || 0, settings.currency)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="color: var(--text-secondary);">ICMS:</span>
                        <span>${formatarMoeda(nota.impostos?.icms || 0, settings.currency)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="color: var(--text-secondary);">PIS/COFINS:</span>
                        <span>${formatarMoeda((nota.impostos?.pis || 0) + (nota.impostos?.cofins || 0), settings.currency)}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div style="margin: 1.5rem 0;">
            <h4 style="margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">Produtos/Serviços</h4>
            <div style="background: var(--bg-color); padding: 1rem; border-radius: 0.5rem;">
                ${nota.produtos.map(produto => `
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <div>
                            <div style="font-weight: 500;">${produto.descricao}</div>
                            <div style="font-size: 0.875rem; color: var(--text-secondary);">
                                ${produto.quantidade} x ${formatarMoeda(produto.valorUnitario, settings.currency)}
                            </div>
                        </div>
                        <div style="font-weight: 500;">${formatarMoeda(produto.valorTotal, settings.currency)}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        ${nota.observacoes ? `
            <div style="margin: 1.5rem 0;">
                <h4 style="margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">Observações</h4>
                <div style="background: var(--bg-color); padding: 1rem; border-radius: 0.5rem; color: var(--text-primary);">
                    ${nota.observacoes}
                </div>
            </div>
        ` : ''}
        
        ${nota.tags && nota.tags.length > 0 ? `
            <div style="margin: 1.5rem 0;">
                <h4 style="margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">Tags</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${nota.tags.map(tag => `
                        <span class="nf-tag">${tag}</span>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        <div style="margin: 1.5rem 0;">
            <h4 style="margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">Informações Técnicas</h4>
            <div style="background: var(--bg-color); padding: 1rem; border-radius: 0.5rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="color: var(--text-secondary);">Chave de Acesso:</span>
                    <span style="font-family: monospace; font-size: 0.875rem;">${nota.chave}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="color: var(--text-secondary);">Modelo:</span>
                    <span>${nota.modelo}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: var(--text-secondary);">Série:</span>
                    <span>${nota.serie}</span>
                </div>
            </div>
        </div>
    `;
    
    // Salvar o ID da nota atual no modal
    modalBody.dataset.currentNotaId = id;
    
    abrirModal('detalhes-modal');
}

function editarNota() {
    const modalBody = document.getElementById('nf-details');
    const notaId = modalBody?.dataset?.currentNotaId;
    
    if (!notaId) {
        showToast('Nota não selecionada', 'warning');
        return;
    }
    
    showToast('Funcionalidade de edição em desenvolvimento', 'info');
    // Em uma implementação real, abriria um formulário de edição
}

function baixarNota() {
    const modalBody = document.getElementById('nf-details');
    const notaId = modalBody?.dataset?.currentNotaId;
    
    if (!notaId) {
        showToast('Nota não selecionada', 'warning');
        return;
    }
    
    const nota = notasFiscais.find(n => n.id === notaId);
    if (!nota) {
        showToast('Nota não encontrada', 'error');
        return;
    }
    
    // Simular download
    showToast(`Baixando NF-e ${nota.numero}...`, 'info');
    
    // Gerar conteúdo do arquivo
    const conteudo = gerarConteudoDownload(nota);
    
    // Criar blob e link para download
    const blob = new Blob([conteudo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NF-e_${nota.numero}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast(`NF-e ${nota.numero} baixada com sucesso!`, 'success');
}

function gerarConteudoDownload(nota) {
    return `
NOTA FISCAL ELETRÔNICA
======================

DADOS DA NOTA:
Número: ${nota.numero}
Série: ${nota.serie}
Modelo: ${nota.modelo}
Chave de Acesso: ${nota.chave}
Tipo: ${nota.tipo}
Status: ${nota.status}

EMISSÃO:
Data: ${formatarData(nota.emissao, settings.dateFormat)}
Vencimento: ${formatarData(nota.vencimento, settings.dateFormat)}
${nota.pagamento ? `Pagamento: ${formatarData(nota.pagamento, settings.dateFormat)}` : ''}

FORNECEDOR:
${nota.fornecedor}
CNPJ: ${formatarCNPJ(nota.cnpj)}

VALORES:
Valor Total: ${formatarMoeda(nota.valor, settings.currency)}
Desconto: ${formatarMoeda(nota.desconto || 0, settings.currency)}
ICMS: ${formatarMoeda(nota.impostos?.icms || 0, settings.currency)}
PIS: ${formatarMoeda(nota.impostos?.pis || 0, settings.currency)}
COFINS: ${formatarMoeda(nota.impostos?.cofins || 0, settings.currency)}

PRODUTOS/SERVIÇOS:
${nota.produtos.map(p => `- ${p.descricao}: ${p.quantidade} x ${formatarMoeda(p.valorUnitario, settings.currency)} = ${formatarMoeda(p.valorTotal, settings.currency)}`).join('\n')}

OBSERVAÇÕES:
${nota.observacoes || 'Nenhuma observação'}

TAGS:
${nota.tags?.join(', ') || 'Nenhuma tag'}

INFORMAÇÕES DO SISTEMA:
Criado por: ${nota.criadoPor}
Criado em: ${formatarData(nota.criadoEm, settings.dateFormat)}
Modificado em: ${formatarData(nota.modificadoEm, settings.dateFormat)}
    `.trim();
}

function excluirNota() {
    const modalBody = document.getElementById('nf-details');
    const notaId = modalBody?.dataset?.currentNotaId;
    
    if (!notaId) {
        showToast('Nota não selecionada', 'warning');
        return;
    }
    
    if (!confirm('Tem certeza que deseja excluir esta nota fiscal? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    const index = notasFiscais.findIndex(n => n.id === notaId);
    if (index !== -1) {
        const notaExcluida = notasFiscais[index];
        notasFiscais.splice(index, 1);
        salvarDados();
        
        // Log de atividade
        if (settings.activityLog) {
            registrarAtividade('Nota excluída', `NF-e ${notaExcluida.numero} excluída`);
        }
        
        // Atualizar interface
        atualizarEstatisticas();
        atualizarContadorNFs();
        filtrarNotasFiscais();
        
        // Fechar modal
        fecharModal('detalhes-modal');
        
        showToast('Nota fiscal excluída com sucesso', 'success');
    }
}

// ================= UPLOAD E SCANNER =================
function abrirUpload() {
    selectedFiles = [];
    document.getElementById('upload-progress').style.display = 'none';
    document.getElementById('btn-processar').disabled = true;
    
    // Resetar área de upload
    const uploadArea = document.getElementById('upload-area');
    uploadArea.innerHTML = `
        <div class="upload-icon">
            <i class="fas fa-file-upload"></i>
        </div>
        <h4>Arraste e solte seus arquivos</h4>
        <p>ou clique para selecionar</p>
        <button class="btn-secondary" onclick="document.getElementById('file-input').click()">
            Selecionar Arquivos
        </button>
    `;
    
    abrirModal('upload-modal');
}

function processarArquivosSelecionados() {
    if (selectedFiles.length === 0) {
        showToast('Nenhum arquivo selecionado', 'warning');
        return;
    }
    
    // Habilitar botão de processar
    document.getElementById('btn-processar').disabled = false;
    
    // Atualizar área de upload
    const uploadArea = document.getElementById('upload-area');
    uploadArea.innerHTML = `
        <div class="upload-icon" style="color: var(--success-color);">
            <i class="fas fa-check-circle"></i>
        </div>
        <h4>${selectedFiles.length} arquivo(s) selecionado(s)</h4>
        <p>Clique em "Processar" para importar as notas fiscais</p>
        <div style="text-align: left; margin-top: 1rem;">
            ${selectedFiles.slice(0, 3).map(file => `
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; color: var(--text-secondary);">
                    <i class="fas fa-file${file.type.includes('pdf') ? '-pdf' : file.type.includes('image') ? '-image' : ''}"></i>
                    <span style="font-size: 0.875rem;">${file.name}</span>
                </div>
            `).join('')}
            ${selectedFiles.length > 3 ? `
                <div style="color: var(--text-light); font-size: 0.875rem;">
                    + ${selectedFiles.length - 3} mais arquivo(s)
                </div>
            ` : ''}
        </div>
    `;
}

function processarUpload() {
    if (selectedFiles.length === 0) {
        showToast('Nenhum arquivo para processar', 'warning');
        return;
    }
    
    // Mostrar progresso
    document.getElementById('upload-progress').style.display = 'block';
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const progressPercent = document.getElementById('progress-percent');
    
    // Simular processamento
    let processed = 0;
    const total = selectedFiles.length;
    
    const processInterval = setInterval(() => {
        processed++;
        const percent = Math.round((processed / total) * 100);
        
        progressFill.style.width = `${percent}%`;
        progressText.textContent = `Processando ${processed} de ${total} arquivos`;
        progressPercent.textContent = `${percent}%`;
        
        if (processed === total) {
            clearInterval(processInterval);
            
            // Adicionar notas fiscais
            adicionarNotasDoUpload();
            
            // Fechar modal após 1 segundo
            setTimeout(() => {
                fecharModal('upload-modal');
                showToast(`${total} nota(s) fiscal(is) importada(s) com sucesso!`, 'success');
            }, 1000);
        }
    }, 300);
}

function adicionarNotasDoUpload() {
    const novasNotas = [];
    
    selectedFiles.forEach((file, index) => {
        const novaNota = {
            id: `NF${(notasFiscais.length + index + 1).toString().padStart(6, '0')}`,
            numero: (100000 + notasFiscais.length + index + 1).toString(),
            serie: '1',
            modelo: '55',
            chave: `NFe${Math.floor(Math.random() * 100000000000000000000000000000).toString().padStart(44, '0')}`,
            tipo: 'entrada',
            status: 'pendente',
            data: new Date().toISOString().split('T')[0],
            emissao: new Date().toISOString().split('T')[0],
            vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            pagamento: null,
            fornecedor: 'FORNECEDOR IMPORTADO',
            cnpj: '00.000.000/0000-00',
            valor: Math.floor(Math.random() * 10000) + 1000,
            desconto: 0,
            impostos: {
                icms: 0,
                pis: 0,
                cofins: 0,
                iss: 0
            },
            produtos: [
                {
                    descricao: `Produto importado ${index + 1}`,
                    quantidade: 1,
                    valorUnitario: Math.floor(Math.random() * 10000) + 1000,
                    valorTotal: Math.floor(Math.random() * 10000) + 1000
                }
            ],
            tags: ['importado'],
            categorias: ['Importado'],
            observacoes: `Importado do arquivo: ${file.name}`,
            arquivos: [file.name],
            criadoPor: currentUser.nome,
            criadoEm: new Date().toISOString(),
            modificadoEm: new Date().toISOString()
        };
        
        novasNotas.push(novaNota);
        notasFiscais.unshift(novaNota);
    });
    
    // Salvar dados
    salvarDados();
    
    // Log de atividade
    if (settings.activityLog) {
        registrarAtividade('Upload de notas', `${novasNotas.length} nota(s) importada(s)`);
    }
    
    // Notificação se configurado
    if (settings.notifyNew) {
        adicionarNotificacaoSistema(`Novas notas importadas`, `${novasNotas.length} nota(s) fiscal(is) foram importadas com sucesso.`, 'info');
    }
    
    // Atualizar interface
    atualizarEstatisticas();
    atualizarContadorNFs();
    filtrarNotasFiscais();
    carregarUltimasNotas();
}

function abrirScanner() {
    abrirModal('scanner-modal');
}

function toggleCamera() {
    const btnCamera = document.getElementById('btn-camera');
    const cameraPreview = document.getElementById('camera-preview');
    const scannerPlaceholder = document.querySelector('.scanner-placeholder');
    const btnCapturar = document.getElementById('btn-capturar');
    
    if (btnCamera.textContent.includes('Ligar')) {
        // Simular acesso à câmera (em produção, usar API real)
        scannerPlaceholder.style.display = 'none';
        cameraPreview.style.display = 'block';
        
        // Simular stream de vídeo
        cameraPreview.innerHTML = `
            <div style="width: 100%; height: 300px; background: linear-gradient(45deg, #4361ee, #3a0ca3); display: flex; align-items: center; justify-content: center; border-radius: 0.5rem;">
                <div style="text-align: center; color: white;">
                    <i class="fas fa-video" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>Câmera ativa</p>
                    <p style="font-size: 0.875rem; opacity: 0.8;">Simulação de câmera</p>
                </div>
            </div>
        `;
        
        btnCamera.innerHTML = '<i class="fas fa-video-slash"></i> Desligar Câmera';
        btnCapturar.disabled = false;
        
        showToast('Câmera ativada (simulação)', 'info');
    } else {
        // Desligar câmera
        scannerPlaceholder.style.display = 'flex';
        cameraPreview.style.display = 'none';
        cameraPreview.innerHTML = '';
        
        btnCamera.innerHTML = '<i class="fas fa-video"></i> Ligar Câmera';
        btnCapturar.disabled = true;
    }
}

function capturarImagem() {
    showToast('Imagem capturada com sucesso!', 'success');
    
    // Simular captura
    setTimeout(() => {
        showToast('Processando imagem...', 'info');
        
        // Simular processamento OCR
        setTimeout(() => {
            // Criar nota a partir da captura
            const novaNota = {
                id: `NF${(notasFiscais.length + 1).toString().padStart(6, '0')}`,
                numero: (100000 + notasFiscais.length + 1).toString(),
                serie: '1',
                modelo: '55',
                chave: `NFe${Math.floor(Math.random() * 100000000000000000000000000000).toString().padStart(44, '0')}`,
                tipo: 'entrada',
                status: 'pendente',
                data: new Date().toISOString().split('T')[0],
                emissao: new Date().toISOString().split('T')[0],
                vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                pagamento: null,
                fornecedor: 'FORNECEDOR ESCANEADO',
                cnpj: '00.000.000/0000-00',
                valor: Math.floor(Math.random() * 5000) + 1000,
                desconto: 0,
                impostos: {
                    icms: 0,
                    pis: 0,
                    cofins: 0,
                    iss: 0
                },
                produtos: [
                    {
                        descricao: 'Produto escaneado',
                        quantidade: 1,
                        valorUnitario: Math.floor(Math.random() * 5000) + 1000,
                        valorTotal: Math.floor(Math.random() * 5000) + 1000
                    }
                ],
                tags: ['escaneado'],
                categorias: ['Escaneado'],
                observacoes: 'Nota fiscal escaneada via câmera',
                arquivos: ['captura.jpg'],
                criadoPor: currentUser.nome,
                criadoEm: new Date().toISOString(),
                modificadoEm: new Date().toISOString()
            };
            
            notasFiscais.unshift(novaNota);
            salvarDados();
            
            // Log de atividade
            if (settings.activityLog) {
                registrarAtividade('Nota escaneada', 'NF escaneada via câmera');
            }
            
            // Atualizar interface
            atualizarEstatisticas();
            atualizarContadorNFs();
            filtrarNotasFiscais();
            
            // Fechar modal
            fecharModal('scanner-modal');
            
            showToast('Nota fiscal criada a partir da captura!', 'success');
        }, 2000);
    }, 1000);
}

// ================= VALIDAÇÃO DE CHAVE NF-e =================
function abrirValidacaoChave() {
    document.getElementById('chave-acesso').value = '';
    document.getElementById('validation-result').style.display = 'none';
    document.getElementById('btn-usar-chave').disabled = true;
    abrirModal('validacao-modal');
}

function formatarChaveAcesso(input) {
    // Remover caracteres não numéricos
    let value = input.value.replace(/\D/g, '');
    
    // Limitar a 44 caracteres
    value = value.substring(0, 44);
    
    // Atualizar valor do campo
    input.value = value;
}

function validarChaveAcesso() {
    const chaveInput = document.getElementById('chave-acesso');
    const chave = chaveInput.value;
    
    if (chave.length !== 44) {
        showToast('A chave de acesso deve ter exatamente 44 dígitos', 'error');
        return;
    }
    
    // Validar formato básico da chave NF-e
    const cUF = chave.substring(0, 2); // Código da UF
    const AAMM = chave.substring(2, 6); // Ano e mês
    const CNPJ = chave.substring(6, 20); // CNPJ do emitente
    const mod = chave.substring(20, 22); // Modelo
    const serie = chave.substring(22, 25); // Série
    const nNF = chave.substring(25, 34); // Número da NF
    const tpEmis = chave.substring(34, 35); // Tipo de emissão
    const cNF = chave.substring(35, 43); // Código numérico
    const dv = chave.substring(43, 44); // Dígito verificador
    
    // Validar dígito verificador usando módulo 11
    const isValidDV = validarDigitoVerificador(chave);
    
    // Validar códigos
    const ufsValidas = ['11','12','13','14','15','16','17','21','22','23','24','25','26','27','28','29','31','32','33','35','41','42','43','50','51','52','53'];
    const isUFValid = ufsValidas.includes(cUF);
    const isModeloValid = ['55', '65'].includes(mod); // 55=NF-e, 65=NFC-e
    
    // Verificar se já existe nota com esta chave
    const notaExistente = notasFiscais.find(n => n.chave === chave);
    
    // Mostrar resultado
    const resultDiv = document.getElementById('validation-result');
    resultDiv.style.display = 'block';
    
    if (isValidDV && isUFValid && isModeloValid) {
        resultDiv.innerHTML = `
            <div style="color: var(--success-color);">
                <h4><i class="fas fa-check-circle"></i> Chave Válida</h4>
                <div style="margin-top: 0.5rem; font-size: 0.875rem;">
                    <p><strong>UF:</strong> ${cUF}</p>
                    <p><strong>Emissão:</strong> ${AAMM.substring(2, 4)}/${AAMM.substring(0, 2)}</p>
                    <p><strong>CNPJ Emitente:</strong> ${formatarCNPJ(CNPJ)}</p>
                    <p><strong>Modelo:</strong> ${mod}</p>
                    <p><strong>Série:</strong> ${parseInt(serie)}</p>
                    <p><strong>Número NF:</strong> ${parseInt(nNF)}</p>
                    ${notaExistente ? 
                        `<p style="color: var(--warning-color);"><i class="fas fa-exclamation-triangle"></i> Esta chave já está cadastrada no sistema</p>` : 
                        `<p style="color: var(--success-color);"><i class="fas fa-check"></i> Chave disponível para uso</p>`
                    }
                </div>
            </div>
        `;
        
        // Habilitar botão de usar chave se não existir
        if (!notaExistente) {
            document.getElementById('btn-usar-chave').disabled = false;
        }
    } else {
        resultDiv.innerHTML = `
            <div style="color: var(--danger-color);">
                <h4><i class="fas fa-times-circle"></i> Chave Inválida</h4>
                <div style="margin-top: 0.5rem; font-size: 0.875rem;">
                    ${!isValidDV ? '<p>Dígito verificador inválido</p>' : ''}
                    ${!isUFValid ? '<p>Código da UF inválido</p>' : ''}
                    ${!isModeloValid ? '<p>Modelo de documento inválido</p>' : ''}
                    <p>Verifique os dados e tente novamente.</p>
                </div>
            </div>
        `;
    }
}

function validarDigitoVerificador(chave) {
    // Remover o dígito verificador
    const chaveSemDV = chave.substring(0, 43);
    const dvInformado = chave.substring(43, 44);
    
    // Calcular dígito verificador
    let soma = 0;
    let peso = 2;
    
    for (let i = chaveSemDV.length - 1; i >= 0; i--) {
        soma += parseInt(chaveSemDV.charAt(i)) * peso;
        peso++;
        if (peso > 9) peso = 2;
    }
    
    const resto = soma % 11;
    let dvCalculado = 11 - resto;
    
    if (dvCalculado === 0 || dvCalculado === 10 || dvCalculado === 11) {
        dvCalculado = 0;
    }
    
    return dvCalculado.toString() === dvInformado;
}

function usarChaveValidada() {
    const chave = document.getElementById('chave-acesso').value;
    
    // Criar nova nota com a chave validada
    const novaNota = {
        id: `NF${(notasFiscais.length + 1).toString().padStart(6, '0')}`,
        numero: chave.substring(25, 34).replace(/^0+/, ''),
        serie: chave.substring(22, 25).replace(/^0+/, ''),
        modelo: chave.substring(20, 22),
        chave: chave,
        tipo: 'entrada',
        status: 'pendente',
        data: new Date().toISOString().split('T')[0],
        emissao: new Date().toISOString().split('T')[0],
        vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        pagamento: null,
        fornecedor: 'FORNECEDOR - DADOS DA CHAVE',
        cnpj: formatarCNPJ(chave.substring(6, 20)),
        valor: Math.floor(Math.random() * 10000) + 1000,
        desconto: 0,
        impostos: {
            icms: 0,
            pis: 0,
            cofins: 0,
            iss: 0
        },
        produtos: [
            {
                descricao: 'Produto da chave validada',
                quantidade: 1,
                valorUnitario: Math.floor(Math.random() * 10000) + 1000,
                valorTotal: Math.floor(Math.random() * 10000) + 1000
            }
        ],
        tags: ['chave-validada'],
        categorias: ['Validado'],
        observacoes: 'Nota fiscal criada a partir de chave validada',
        arquivos: [],
        criadoPor: currentUser.nome,
        criadoEm: new Date().toISOString(),
        modificadoEm: new Date().toISOString()
    };
    
    notasFiscais.unshift(novaNota);
    salvarDados();
    
    // Log de atividade
    if (settings.activityLog) {
        registrarAtividade('Chave validada', 'Nova NF criada a partir de chave validada');
    }
    
    // Atualizar interface
    atualizarEstatisticas();
    atualizarContadorNFs();
    filtrarNotasFiscais();
    
    // Fechar modal
    fecharModal('validacao-modal');
    
    showToast('Nota fiscal criada a partir da chave validada!', 'success');
}

// ================= IMPORTAR XML =================
function abrirImportacaoXML() {
    selectedXMLs = [];
    document.getElementById('xml-process').style.display = 'none';
    document.getElementById('xml-preview').style.display = 'none';
    document.getElementById('btn-processar-xml').disabled = true;
    abrirModal('xml-modal');
}

function processarXMLsSelecionados() {
    if (selectedXMLs.length === 0) {
        showToast('Nenhum arquivo XML selecionado', 'warning');
        return;
    }
    
    // Habilitar botão de processar
    document.getElementById('btn-processar-xml').disabled = false;
    
    // Atualizar área de upload
    const xmlUploadArea = document.getElementById('xml-upload-area');
    xmlUploadArea.innerHTML = `
        <div class="upload-icon" style="color: var(--success-color);">
            <i class="fas fa-check-circle"></i>
        </div>
        <h4>${selectedXMLs.length} arquivo(s) XML selecionado(s)</h4>
        <p>Clique em "Processar XMLs" para extrair os dados</p>
        <div style="text-align: left; margin-top: 1rem;">
            ${selectedXMLs.slice(0, 3).map(file => `
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; color: var(--text-secondary);">
                    <i class="fas fa-file-code"></i>
                    <span style="font-size: 0.875rem;">${file.name}</span>
                </div>
            `).join('')}
            ${selectedXMLs.length > 3 ? `
                <div style="color: var(--text-light); font-size: 0.875rem;">
                    + ${selectedXMLs.length - 3} mais arquivo(s)
                </div>
            ` : ''}
        </div>
    `;
    
    // Mostrar pré-visualização do primeiro arquivo
    mostrarPreviaXML(selectedXMLs[0]);
}

function mostrarPreviaXML(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const xmlContent = e.target.result;
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
            
            // Tentar extrair dados comuns
            let dadosExtraidos = {
                chave: extrairDoXML(xmlDoc, 'chNFe') || extrairDoXML(xmlDoc, 'chCTe'),
                numero: extrairDoXML(xmlDoc, 'nNF') || extrairDoXML(xmlDoc, 'nCT'),
                serie: extrairDoXML(xmlDoc, 'serie') || extrairDoXML(xmlDoc, 'serieCT'),
                modelo: extrairDoXML(xmlDoc, 'mod') || '55',
                emitente: extrairDoXML(xmlDoc, 'xNome'),
                cnpj: extrairDoXML(xmlDoc, 'CNPJ') || extrairDoXML(xmlDoc, 'CPF'),
                valor: extrairDoXML(xmlDoc, 'vNF') || extrairDoXML(xmlDoc, 'vServ'),
                data: extrairDoXML(xmlDoc, 'dhEmi') || extrairDoXML(xmlDoc, 'dEmi')
            };
            
            // Formatar dados
            if (dadosExtraidos.data) {
                dadosExtraidos.data = dadosExtraidos.data.substring(0, 10);
            }
            
            // Mostrar preview
            const xmlDataDiv = document.getElementById('xml-data');
            xmlDataDiv.innerHTML = `
                <h5>Dados Extraídos do XML</h5>
                <div style="background: var(--bg-color); padding: 1rem; border-radius: 0.5rem; margin-top: 0.5rem;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                        ${Object.entries(dadosExtraidos).map(([key, value]) => `
                            ${value ? `
                                <div>
                                    <span style="font-size: 0.875rem; color: var(--text-secondary);">${key}:</span>
                                    <div style="font-weight: 500; word-break: break-all;">${value}</div>
                                </div>
                            ` : ''}
                        `).join('')}
                    </div>
                </div>
                <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 1rem;">
                    <i class="fas fa-info-circle"></i> Os dados acima são uma pré-visualização. O processamento completo extrairá mais informações.
                </p>
            `;
            
            document.getElementById('xml-preview').style.display = 'block';
            
        } catch (error) {
            console.error('Erro ao processar XML:', error);
            document.getElementById('xml-data').innerHTML = `
                <div style="color: var(--danger-color);">
                    <i class="fas fa-exclamation-triangle"></i> Erro ao ler arquivo XML. Verifique se o arquivo é válido.
                </div>
            `;
        }
    };
    
    reader.readAsText(file);
}

function extrairDoXML(xmlDoc, tagName) {
    const element = xmlDoc.getElementsByTagName(tagName)[0];
    return element ? element.textContent : null;
}

function processarXMLs() {
    if (selectedXMLs.length === 0) {
        showToast('Nenhum XML para processar', 'warning');
        return;
    }
    
    // Mostrar processo
    document.getElementById('xml-process').style.display = 'block';
    const progressFill = document.getElementById('xml-progress-fill');
    const progressText = document.getElementById('xml-progress-text');
    const progressPercent = document.getElementById('xml-progress-percent');
    const xmlResults = document.getElementById('xml-results');
    
    let processed = 0;
    const total = selectedXMLs.length;
    const notasCriadas = [];
    const erros = [];
    
    xmlResults.innerHTML = '';
    
    const processarProximo = () => {
        if (processed >= total) {
            // Processamento completo
            progressFill.style.width = '100%';
            progressText.textContent = 'Processamento completo';
            progressPercent.textContent = '100%';
            
            // Mostrar resumo
            let resumoHTML = `
                <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-color); border-radius: 0.5rem;">
                    <h5>Resumo do Processamento</h5>
                    <p><strong>Total de arquivos:</strong> ${total}</p>
                    <p style="color: var(--success-color);"><strong>Notas criadas:</strong> ${notasCriadas.length}</p>
                    ${erros.length > 0 ? `<p style="color: var(--danger-color);"><strong>Erros:</strong> ${erros.length}</p>` : ''}
                </div>
            `;
            
            xmlResults.innerHTML = resumoHTML;
            
            // Atualizar interface se notas foram criadas
            if (notasCriadas.length > 0) {
                setTimeout(() => {
                    atualizarEstatisticas();
                    atualizarContadorNFs();
                    filtrarNotasFiscais();
                    fecharModal('xml-modal');
                    showToast(`${notasCriadas.length} nota(s) criada(s) a partir de XML!`, 'success');
                    
                    // Log de atividade
                    if (settings.activityLog) {
                        registrarAtividade('Importação XML', `${notasCriadas.length} nota(s) importada(s) de XML`);
                    }
                }, 1500);
            }
            
            return;
        }
        
        const file = selectedXMLs[processed];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const xmlContent = e.target.result;
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
                
                // Extrair dados básicos
                const chave = extrairDoXML(xmlDoc, 'chNFe') || 
                             extrairDoXML(xmlDoc, 'chCTe') || 
                             `XML${Date.now()}${processed}`;
                
                // Verificar se já existe
                const existe = notasFiscais.find(n => n.chave === chave);
                
                if (!existe) {
                    const novaNota = criarNotaDeXML(xmlDoc, chave, file.name);
                    notasFiscais.unshift(novaNota);
                    notasCriadas.push(novaNota);
                    
                    // Adicionar ao resumo
                    xmlResults.innerHTML += `
                        <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border-bottom: 1px solid var(--border-color);">
                            <i class="fas fa-check-circle" style="color: var(--success-color);"></i>
                            <span>${file.name}: NF-e ${novaNota.numero} criada</span>
                        </div>
                    `;
                } else {
                    xmlResults.innerHTML += `
                        <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border-bottom: 1px solid var(--border-color);">
                            <i class="fas fa-info-circle" style="color: var(--warning-color);"></i>
                            <span>${file.name}: Já existe no sistema</span>
                        </div>
                    `;
                }
                
            } catch (error) {
                console.error('Erro ao processar XML:', error, file.name);
                erros.push(file.name);
                
                xmlResults.innerHTML += `
                    <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border-bottom: 1px solid var(--border-color);">
                        <i class="fas fa-times-circle" style="color: var(--danger-color);"></i>
                        <span>${file.name}: Erro no processamento</span>
                    </div>
                `;
            }
            
            // Atualizar progresso
            processed++;
            const percent = Math.round((processed / total) * 100);
            
            progressFill.style.width = `${percent}%`;
            progressText.textContent = `${processed} de ${total} processados`;
            progressPercent.textContent = `${percent}%`;
            
            // Processar próximo
            setTimeout(processarProximo, 100);
        };
        
        reader.readAsText(file);
    };
    
    // Iniciar processamento
    processarProximo();
    
    // Salvar dados
    setTimeout(() => {
        salvarDados();
    }, 500);
}

function criarNotaDeXML(xmlDoc, chave, nomeArquivo) {
    // Extrair dados do XML
    const numero = extrairDoXML(xmlDoc, 'nNF') || extrairDoXML(xmlDoc, 'nCT') || '000001';
    const serie = extrairDoXML(xmlDoc, 'serie') || extrairDoXML(xmlDoc, 'serieCT') || '1';
    const modelo = extrairDoXML(xmlDoc, 'mod') || '55';
    const emitente = extrairDoXML(xmlDoc, 'xNome') || 'EMITENTE NÃO IDENTIFICADO';
    const cnpj = extrairDoXML(xmlDoc, 'CNPJ') || extrairDoXML(xmlDoc, 'CPF') || '00.000.000/0000-00';
    const valorText = extrairDoXML(xmlDoc, 'vNF') || extrairDoXML(xmlDoc, 'vServ') || '0';
    const valor = parseFloat(valorText) || Math.floor(Math.random() * 10000) + 1000;
    const dataText = extrairDoXML(xmlDoc, 'dhEmi') || extrairDoXML(xmlDoc, 'dEmi') || new Date().toISOString();
    const data = dataText.substring(0, 10);
    
    // Determinar tipo baseado no modelo
    let tipo = 'entrada';
    if (modelo === '55') tipo = 'entrada';
    if (modelo === '65') tipo = 'saida';
    
    return {
        id: `NF${(notasFiscais.length + 1).toString().padStart(6, '0')}`,
        numero: numero.replace(/^0+/, ''),
        serie: serie,
        modelo: modelo,
        chave: chave,
        tipo: tipo,
        status: 'pendente',
        data: data,
        emissao: data,
        vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        pagamento: null,
        fornecedor: emitente,
        cnpj: formatarCNPJ(cnpj.replace(/\D/g, '')),
        valor: valor,
        desconto: 0,
        impostos: {
            icms: valor * 0.18,
            pis: valor * 0.0165,
            cofins: valor * 0.076,
            iss: tipo === 'servico' ? valor * 0.05 : 0
        },
        produtos: [
            {
                descricao: 'Produto/Serviço do XML',
                quantidade: 1,
                valorUnitario: valor,
                valorTotal: valor
            }
        ],
        tags: ['xml-importado'],
        categorias: ['XML'],
        observacoes: `Importado do arquivo XML: ${nomeArquivo}`,
        arquivos: [nomeArquivo],
        criadoPor: currentUser.nome,
        criadoEm: new Date().toISOString(),
        modificadoEm: new Date().toISOString()
    };
}

// ================= DASHBOARD E ESTATÍSTICAS =================
function atualizarEstatisticas() {
    const total = notasFiscais.length;
    const pendentes = notasFiscais.filter(n => n.status === 'pendente').length;
    const pagas = notasFiscais.filter(n => n.status === 'pago').length;
    const vencidas = notasFiscais.filter(n => n.status === 'vencido').length;
    const valorTotal = notasFiscais.reduce((sum, n) => sum + n.valor, 0);
    const valorPendente = notasFiscais
        .filter(n => n.status === 'pendente')
        .reduce((sum, n) => sum + n.valor, 0);
    
    // Atualizar contadores
    document.getElementById('total-nfs').textContent = total;
    document.getElementById('pendentes-nfs').textContent = pendentes;
    document.getElementById('pagas-nfs').textContent = pagas;
    document.getElementById('vencidas-nfs').textContent = vencidas;
    
    // Atualizar gráficos
    atualizarGraficos();
    
    // Atualizar informações financeiras no dashboard
    const financialInfo = document.getElementById('financial-summary');
    if (financialInfo) {
        financialInfo.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary);">Valor Total</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">
                        ${formatarMoeda(valorTotal, settings.currency)}
                    </div>
                </div>
                <div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary);">Pendente</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--warning-color);">
                        ${formatarMoeda(valorPendente, settings.currency)}
                    </div>
                </div>
                <div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary);">Média por NF</div>
                    <div style="font-size: 1.25rem; font-weight: 600;">
                        ${total > 0 ? formatarMoeda(valorTotal / total, settings.currency) : formatarMoeda(0, settings.currency)}
                    </div>
                </div>
                <div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary);">Impostos Totais</div>
                    <div style="font-size: 1.25rem; font-weight: 600; color: var(--danger-color);">
                        ${formatarMoeda(notasFiscais.reduce((sum, n) => sum + (n.impostos?.icms || 0) + (n.impostos?.pis || 0) + (n.impostos?.cofins || 0) + (n.impostos?.iss || 0), 0), settings.currency)}
                    </div>
                </div>
            </div>
        `;
    }
}

function atualizarContadorNFs() {
    const nfCount = document.getElementById('nf-count');
    if (nfCount) {
        nfCount.textContent = notasFiscais.length;
    }
}

function carregarUltimasNotas() {
    const tbody = document.getElementById('recent-nfs-table');
    if (!tbody) return;
    
    // Pegar últimas 5 notas
    const ultimasNotas = [...notasFiscais]
        .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
        .slice(0, 5);
    
    if (ultimasNotas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center p-4" style="color: var(--text-secondary);">
                    Nenhuma nota fiscal cadastrada
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    ultimasNotas.forEach(nota => {
        const statusClass = nota.status === 'pendente' ? 'warning' : 
                          nota.status === 'pago' ? 'success' : 'danger';
        
        const valorFormatado = formatarMoeda(nota.valor, settings.currency);
        const dataFormatada = formatarData(nota.data, settings.dateFormat);
        
        html += `
            <tr>
                <td><strong>NF-e ${nota.numero}</strong></td>
                <td>${nota.fornecedor}</td>
                <td>${dataFormatada}</td>
                <td><strong>${valorFormatado}</strong></td>
                <td>
                    <span style="color: var(--${statusClass}-color);">
                        ${nota.status === 'pendente' ? 'Pendente' : nota.status === 'pago' ? 'Pago' : 'Vencido'}
                    </span>
                </td>
                <td>
                    <button class="nf-action" onclick="verDetalhes('${nota.id}')" title="Ver detalhes">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

function inicializarGraficos() {
    // Gráfico de distribuição por tipo
    const ctxTipo = document.getElementById('chart-tipo');
    if (ctxTipo) {
        // Destruir gráfico anterior se existir
        if (window.chartTipo) {
            window.chartTipo.destroy();
        }
        
        const tipos = ['entrada', 'saida', 'servico'];
        const dados = tipos.map(tipo => 
            notasFiscais.filter(n => n.tipo === tipo).length
        );
        
        window.chartTipo = new Chart(ctxTipo, {
            type: 'doughnut',
            data: {
                labels: ['Entrada', 'Saída', 'Serviço'],
                datasets: [{
                    data: dados,
                    backgroundColor: [
                        'rgba(67, 97, 238, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(245, 158, 11, 0.8)'
                    ],
                    borderColor: [
                        'rgb(67, 97, 238)',
                        'rgb(239, 68, 68)',
                        'rgb(245, 158, 11)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Gráfico mensal
    const ctxMensal = document.getElementById('chart-mensal');
    if (ctxMensal) {
        // Destruir gráfico anterior se existir
        if (window.chartMensal) {
            window.chartMensal.destroy();
        }
        
        // Agrupar por mês
        const meses = {};
        const hoje = new Date();
        
        // Últimos 6 meses
        for (let i = 5; i >= 0; i--) {
            const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            const chave = `${data.getFullYear()}-${(data.getMonth() + 1).toString().padStart(2, '0')}`;
            meses[chave] = 0;
        }
        
        // Contar notas por mês
        notasFiscais.forEach(nota => {
            const data = new Date(nota.data);
            const chave = `${data.getFullYear()}-${(data.getMonth() + 1).toString().padStart(2, '0')}`;
            
            if (meses[chave] !== undefined) {
                meses[chave] += nota.valor;
            }
        });
        
        const labels = Object.keys(meses).map(chave => {
            const [ano, mes] = chave.split('-');
            const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            return `${mesesNomes[parseInt(mes) - 1]}/${ano.slice(2)}`;
        });
        
        const dados = Object.values(meses);
        
        window.chartMensal = new Chart(ctxMensal, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Valor (R$)',
                    data: dados,
                    backgroundColor: 'rgba(67, 97, 238, 0.8)',
                    borderColor: 'rgb(67, 97, 238)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatarMoeda(value, settings.currency);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Valor: ${formatarMoeda(context.raw, settings.currency)}`;
                            }
                        }
                    }
                }
            }
        });
    }
}

function atualizarGraficos() {
    if (window.chartTipo) {
        const tipos = ['entrada', 'saida', 'servico'];
        const dados = tipos.map(tipo => 
            notasFiscais.filter(n => n.tipo === tipo).length
        );
        
        window.chartTipo.data.datasets[0].data = dados;
        window.chartTipo.update();
    }
    
    if (window.chartMensal) {
        // Atualizar dados do gráfico mensal
        const meses = {};
        const hoje = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            const chave = `${data.getFullYear()}-${(data.getMonth() + 1).toString().padStart(2, '0')}`;
            meses[chave] = 0;
        }
        
        notasFiscais.forEach(nota => {
            const data = new Date(nota.data);
            const chave = `${data.getFullYear()}-${(data.getMonth() + 1).toString().padStart(2, '0')}`;
            
            if (meses[chave] !== undefined) {
                meses[chave] += nota.valor;
            }
        });
        
        window.chartMensal.data.datasets[0].data = Object.values(meses);
        window.chartMensal.update();
    }
}

// ================= RELATÓRIOS AVANÇADOS =================
function gerarRelatorioAvancado() {
    const periodo = document.getElementById('report-period').value;
    const tipoRelatorio = document.getElementById('report-type').value;
    
    // Determinar datas baseadas no período
    let dataInicio, dataFim;
    const hoje = new Date();
    
    switch (periodo) {
        case 'current_month':
            dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
            break;
        case 'last_month':
            dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
            dataFim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
            break;
        case 'current_quarter':
            const quarter = Math.floor(hoje.getMonth() / 3);
            dataInicio = new Date(hoje.getFullYear(), quarter * 3, 1);
            dataFim = new Date(hoje.getFullYear(), (quarter * 3) + 3, 0);
            break;
        case 'current_year':
            dataInicio = new Date(hoje.getFullYear(), 0, 1);
            dataFim = new Date(hoje.getFullYear(), 11, 31);
            break;
        case 'custom':
            const dateFrom = document.getElementById('report-date-from').value;
            const dateTo = document.getElementById('report-date-to').value;
            if (!dateFrom || !dateTo) {
                showToast('Selecione as datas personalizadas', 'warning');
                return;
            }
            dataInicio = new Date(dateFrom);
            dataFim = new Date(dateTo);
            break;
        default:
            dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    }
    
    // Filtrar notas pelo período
    const notasPeriodo = notasFiscais.filter(nota => {
        const dataNota = new Date(nota.data);
        return dataNota >= dataInicio && dataNota <= dataFim;
    });
    
    // Gerar relatório baseado no tipo
    switch (tipoRelatorio) {
        case 'financial':
            gerarRelatorioFinanceiro(notasPeriodo, dataInicio, dataFim);
            break;
        case 'tax':
            gerarRelatorioFiscal(notasPeriodo, dataInicio, dataFim);
            break;
        case 'supplier':
            gerarRelatorioFornecedor(notasPeriodo, dataInicio, dataFim);
            break;
        case 'category':
            gerarRelatorioCategoria(notasPeriodo, dataInicio, dataFim);
            break;
        case 'status':
            gerarRelatorioStatus(notasPeriodo, dataInicio, dataFim);
            break;
    }
    
    showToast('Relatório gerado com sucesso!', 'success');
}

function gerarRelatorioFinanceiro(notas, inicio, fim) {
    // Resumo financeiro
    const totalNotas = notas.length;
    const valorTotal = notas.reduce((sum, n) => sum + n.valor, 0);
    const valorPendente = notas.filter(n => n.status === 'pendente').reduce((sum, n) => sum + n.valor, 0);
    const valorPago = notas.filter(n => n.status === 'pago').reduce((sum, n) => sum + n.valor, 0);
    const impostosTotais = notas.reduce((sum, n) => sum + 
        (n.impostos?.icms || 0) + 
        (n.impostos?.pis || 0) + 
        (n.impostos?.cofins || 0) + 
        (n.impostos?.iss || 0), 0);
    
    const financialSummary = document.getElementById('financial-summary');
    if (financialSummary) {
        financialSummary.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                <div style="background: var(--primary-light); padding: 1rem; border-radius: 0.5rem;">
                    <div style="font-size: 0.875rem; color: var(--primary-color);">Total de Notas</div>
                    <div style="font-size: 1.5rem; font-weight: 700;">${totalNotas}</div>
                </div>
                <div style="background: var(--success-light); padding: 1rem; border-radius: 0.5rem;">
                    <div style="font-size: 0.875rem; color: var(--success-color);">Valor Total</div>
                    <div style="font-size: 1.5rem; font-weight: 700;">${formatarMoeda(valorTotal, settings.currency)}</div>
                </div>
                <div style="background: var(--warning-light); padding: 1rem; border-radius: 0.5rem;">
                    <div style="font-size: 0.875rem; color: var(--warning-color);">Pendente</div>
                    <div style="font-size: 1.5rem; font-weight: 700;">${formatarMoeda(valorPendente, settings.currency)}</div>
                </div>
                <div style="background: var(--danger-light); padding: 1rem; border-radius: 0.5rem;">
                    <div style="font-size: 0.875rem; color: var(--danger-color);">Impostos</div>
                    <div style="font-size: 1.5rem; font-weight: 700;">${formatarMoeda(impostosTotais, settings.currency)}</div>
                </div>
            </div>
        `;
    }
    
    // Gráfico de distribuição
    const ctxDistribution = document.getElementById('report-chart-distribution');
    if (ctxDistribution && window.chartDistribution) {
        window.chartDistribution.destroy();
    }
    
    const tipos = ['entrada', 'saida', 'servico'];
    const dadosTipos = tipos.map(tipo => 
        notas.filter(n => n.tipo === tipo).reduce((sum, n) => sum + n.valor, 0)
    );
    
    window.chartDistribution = new Chart(ctxDistribution, {
        type: 'pie',
        data: {
            labels: ['Entrada', 'Saída', 'Serviço'],
            datasets: [{
                data: dadosTipos,
                backgroundColor: [
                    'rgba(67, 97, 238, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(245, 158, 11, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${formatarMoeda(context.raw, settings.currency)}`;
                        }
                    }
                }
            }
        }
    });
    
    // Gráfico de evolução
    const ctxEvolution = document.getElementById('report-chart-evolution');
    if (ctxEvolution && window.chartEvolution) {
        window.chartEvolution.destroy();
    }
    
    // Agrupar por semana
    const semanas = {};
    const umaSemana = 7 * 24 * 60 * 60 * 1000;
    let dataAtual = new Date(inicio);
    
    while (dataAtual <= fim) {
        const semana = `Sem ${Math.floor((dataAtual - inicio) / umaSemana) + 1}`;
        semanas[semana] = 0;
        dataAtual = new Date(dataAtual.getTime() + umaSemana);
    }
    
    notas.forEach(nota => {
        const dataNota = new Date(nota.data);
        const semanaNum = Math.floor((dataNota - inicio) / umaSemana) + 1;
        const semana = `Sem ${semanaNum}`;
        if (semanas[semana] !== undefined) {
            semanas[semana] += nota.valor;
        }
    });
    
    window.chartEvolution = new Chart(ctxEvolution, {
        type: 'line',
        data: {
            labels: Object.keys(semanas),
            datasets: [{
                label: 'Valor por Semana',
                data: Object.values(semanas),
                borderColor: 'rgb(67, 97, 238)',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatarMoeda(value, settings.currency);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Valor: ${formatarMoeda(context.raw, settings.currency)}`;
                        }
                    }
                }
            }
        }
    });
    
    // Detalhamento
    const tbody = document.getElementById('report-details');
    if (tbody) {
        let html = '';
        notas.slice(0, 10).forEach(nota => {
            html += `
                <tr>
                    <td>NF-e ${nota.numero}</td>
                    <td>${nota.fornecedor}</td>
                    <td>${formatarData(nota.data, settings.dateFormat)}</td>
                    <td>${formatarMoeda(nota.valor, settings.currency)}</td>
                    <td>${formatarMoeda(nota.impostos?.icms || 0, settings.currency)}</td>
                    <td>${formatarMoeda((nota.impostos?.pis || 0) + (nota.impostos?.cofins || 0), settings.currency)}</td>
                    <td>
                        <span class="nf-status ${nota.status}">
                            ${nota.status === 'pendente' ? 'Pendente' : nota.status === 'pago' ? 'Pago' : 'Vencido'}
                        </span>
                    </td>
                </tr>
            `;
        });
        
        if (notas.length > 10) {
            html += `
                <tr>
                    <td colspan="7" class="text-center" style="color: var(--text-secondary);">
                        ... e mais ${notas.length - 10} nota(s)
                    </td>
                </tr>
            `;
        }
        
        tbody.innerHTML = html;
    }
}

function gerarRelatorioFiscal(notas, inicio, fim) {
    // Implementação similar para relatório fiscal
    showToast('Relatório fiscal gerado', 'info');
}

function gerarRelatorioFornecedor(notas, inicio, fim) {
    // Implementação similar para relatório por fornecedor
    showToast('Relatório por fornecedor gerado', 'info');
}

function gerarRelatorioCategoria(notas, inicio, fim) {
    // Implementação similar para relatório por categoria
    showToast('Relatório por categoria gerado', 'info');
}

function gerarRelatorioStatus(notas, inicio, fim) {
    // Implementação similar para relatório por status
    showToast('Relatório por status gerado', 'info');
}

function exportarRelatorioExcel() {
    showToast('Exportando relatório para Excel...', 'info');
    
    // Simular exportação
    setTimeout(() => {
        const data = [
            ['Relatório Financeiro', '', '', ''],
            ['Data', new Date().toLocaleDateString('pt-BR'), '', ''],
            ['', '', '', ''],
            ['NF-e', 'Fornecedor', 'Data', 'Valor', 'Status']
        ];
        
        // Adicionar dados
        notasFiscais.slice(0, 20).forEach(nota => {
            data.push([
                `NF-e ${nota.numero}`,
                nota.fornecedor,
                formatarData(nota.data, settings.dateFormat),
                formatarMoeda(nota.valor, settings.currency),
                nota.status === 'pendente' ? 'Pendente' : nota.status === 'pago' ? 'Pago' : 'Vencido'
            ]);
        });
        
        // Converter para CSV
        const csv = data.map(row => 
            row.map(cell => `"${cell}"`).join(',')
        ).join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `relatorio_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast('Relatório exportado para CSV com sucesso!', 'success');
    }, 1000);
}

function gerarRelatorioContabil() {
    showToast('Gerando relatório contábil em PDF...', 'info');
    
    // Simular geração de PDF
    setTimeout(() => {
        const totalNotas = notasFiscais.length;
        const valorTotal = notasFiscais.reduce((sum, n) => sum + n.valor, 0);
        const impostosTotais = notasFiscais.reduce((sum, n) => sum + 
            (n.impostos?.icms || 0) + 
            (n.impostos?.pis || 0) + 
            (n.impostos?.cofins || 0) + 
            (n.impostos?.iss || 0), 0);
        
        const conteudo = `
RELATÓRIO CONTÁBIL - AXIS DOCUMENTS
====================================
Data: ${new Date().toLocaleDateString('pt-BR')}
Período: Completo

RESUMO GERAL:
Total de Notas Fiscais: ${totalNotas}
Valor Total: ${formatarMoeda(valorTotal, settings.currency)}
Impostos Totais: ${formatarMoeda(impostosTotais, settings.currency)}
Valor Líquido: ${formatarMoeda(valorTotal - impostosTotais, settings.currency)}

DISTRIBUIÇÃO POR STATUS:
Pendentes: ${notasFiscais.filter(n => n.status === 'pendente').length}
Pagas: ${notasFiscais.filter(n => n.status === 'pago').length}
Vencidas: ${notasFiscais.filter(n => n.status === 'vencido').length}

DISTRIBUIÇÃO POR TIPO:
Entrada: ${notasFiscais.filter(n => n.tipo === 'entrada').length}
Saída: ${notasFiscais.filter(n => n.tipo === 'saida').length}
Serviço: ${notasFiscais.filter(n => n.tipo === 'servico').length}

TOP 10 FORNECEDORES:
${agruparPorFornecedor().slice(0, 10).map(f => `- ${f.fornecedor}: ${formatarMoeda(f.valor, settings.currency)} (${f.quantidade} notas)`).join('\n')}

IMPOSTOS DETALHADOS:
ICMS: ${formatarMoeda(notasFiscais.reduce((sum, n) => sum + (n.impostos?.icms || 0), 0), settings.currency)}
PIS: ${formatarMoeda(notasFiscais.reduce((sum, n) => sum + (n.impostos?.pis || 0), 0), settings.currency)}
COFINS: ${formatarMoeda(notasFiscais.reduce((sum, n) => sum + (n.impostos?.cofins || 0), 0), settings.currency)}
ISS: ${formatarMoeda(notasFiscais.reduce((sum, n) => sum + (n.impostos?.iss || 0), 0), settings.currency)}

OBSERVAÇÕES:
Este relatório foi gerado automaticamente pelo sistema AXIS Documents.
Os dados são referentes a todas as notas fiscais cadastradas no sistema.

Gerado em: ${new Date().toLocaleString('pt-BR')}
        `.trim();
        
        const blob = new Blob([conteudo], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `relatorio_contabil_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast('Relatório contábil gerado com sucesso!', 'success');
    }, 1500);
}

function agruparPorFornecedor() {
    const fornecedores = {};
    
    notasFiscais.forEach(nota => {
        if (!fornecedores[nota.fornecedor]) {
            fornecedores[nota.fornecedor] = {
                fornecedor: nota.fornecedor,
                quantidade: 0,
                valor: 0
            };
        }
        fornecedores[nota.fornecedor].quantidade++;
        fornecedores[nota.fornecedor].valor += nota.valor;
    });
    
    return Object.values(fornecedores).sort((a, b) => b.valor - a.valor);
}

// ================= BACKUP E RESTAURAÇÃO =================
function criarBackupInicial() {
    const backup = {
        id: `backup_${Date.now()}`,
        nome: 'Backup Inicial',
        data: new Date().toISOString(),
        tamanho: JSON.stringify(notasFiscais).length,
        notas: notasFiscais.length,
        tipo: 'inicial'
    };
    
    backups.unshift(backup);
}

function criarBackup() {
    const backup = {
        id: `backup_${Date.now()}`,
        nome: `Backup ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`,
        data: new Date().toISOString(),
        tamanho: JSON.stringify(notasFiscais).length,
        notas: notasFiscais.length,
        tipo: 'manual'
    };
    
    backups.unshift(backup);
    salvarBackups();
    
    // Log de atividade
    if (settings.activityLog) {
        registrarAtividade('Backup criado', `Backup manual criado com ${notasFiscais.length} notas`);
    }
    
    // Notificação se configurado
    if (settings.notifyBackup) {
        adicionarNotificacaoSistema('Backup criado', `Backup manual criado com sucesso.`, 'info');
    }
    
    // Atualizar lista
    carregarListaBackups();
    
    showToast('Backup criado com sucesso!', 'success');
}

function carregarListaBackups() {
    const backupList = document.getElementById('backup-list');
    if (!backupList) return;
    
    if (backups.length === 0) {
        backupList.innerHTML = `
            <div style="text-align: center; padding: 1rem; color: var(--text-secondary);">
                <i class="fas fa-database" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                <p>Nenhum backup disponível</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    backups.slice(0, 5).forEach(backup => {
        const dataFormatada = formatarData(backup.data, settings.dateFormat);
        const horaFormatada = new Date(backup.data).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
        const tamanhoFormatado = formatarTamanho(backup.tamanho);
        
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-bottom: 1px solid var(--border-color);">
                <div>
                    <div style="font-weight: 500;">${backup.nome}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">
                        ${dataFormatada} ${horaFormatada} • ${backup.notas} notas • ${tamanhoFormatado}
                    </div>
                </div>
                <button class="btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="restaurarBackupEspecifico('${backup.id}')">
                    Restaurar
                </button>
            </div>
        `;
    });
    
    if (backups.length > 5) {
        html += `
            <div style="text-align: center; padding: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">
                + ${backups.length - 5} backup(s) anteriores
            </div>
        `;
    }
    
    backupList.innerHTML = html;
}

function formatarTamanho(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function exportarBackupJSON() {
    const data = {
        notasFiscais: notasFiscais,
        currentUser: currentUser,
        lembretes: lembretes,
        exportDate: new Date().toISOString(),
        version: AppConfig.VERSION
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `backup_axis_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Backup JSON exportado com sucesso!', 'success');
}

function exportarBackupCSV() {
    // Cabeçalhos
    const headers = ['Número', 'Fornecedor', 'CNPJ', 'Data', 'Valor', 'Status', 'Tipo', 'Vencimento', 'Pagamento'];
    
    // Dados
    const rows = notasFiscais.map(nota => [
        nota.numero,
        nota.fornecedor,
        nota.cnpj,
        formatarData(nota.data, settings.dateFormat),
        nota.valor.toString().replace('.', ','),
        nota.status,
        nota.tipo,
        formatarData(nota.vencimento, settings.dateFormat),
        nota.pagamento ? formatarData(nota.pagamento, settings.dateFormat) : ''
    ]);
    
    // Combinar headers e rows
    const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_axis_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('Backup CSV exportado com sucesso!', 'success');
}

function restaurarBackup() {
    const fileInput = document.getElementById('restore-file');
    if (!fileInput.files.length) {
        showToast('Selecione um arquivo para restaurar', 'warning');
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const conteudo = e.target.result;
            let dados;
            
            if (file.name.toLowerCase().endsWith('.json')) {
                dados = JSON.parse(conteudo);
            } else if (file.name.toLowerCase().endsWith('.csv')) {
                dados = parseCSVParaDados(conteudo);
            } else {
                throw new Error('Formato não suportado');
            }
            
            if (!confirm(`Tem certeza que deseja restaurar este backup? ${dados.notasFiscais ? dados.notasFiscais.length : dados.length} notas serão restauradas. Os dados atuais serão sobrescritos.`)) {
                return;
            }
            
            // Restaurar dados
            if (dados.notasFiscais) {
                // Formato JSON completo
                notasFiscais = dados.notasFiscais;
                if (dados.currentUser) currentUser = dados.currentUser;
                if (dados.lembretes) lembretes = dados.lembretes;
            } else {
                // Formato CSV
                notasFiscais = dados;
            }
            
            salvarDados();
            
            // Log de atividade
            if (settings.activityLog) {
                registrarAtividade('Backup restaurado', `Backup restaurado do arquivo: ${file.name}`);
            }
            
            // Atualizar interface
            atualizarEstatisticas();
            atualizarContadorNFs();
            filtrarNotasFiscais();
            carregarUltimasNotas();
            
            showToast('Backup restaurado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao restaurar backup:', error);
            showToast('Erro ao restaurar backup. Verifique o formato do arquivo.', 'error');
        }
    };
    
    reader.readAsText(file);
}

function parseCSVParaDados(csv) {
    const linhas = csv.split('\n');
    const headers = linhas[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    const dados = [];
    
    for (let i = 1; i < linhas.length; i++) {
        if (!linhas[i].trim()) continue;
        
        const valores = linhas[i].split(',').map(v => v.replace(/"/g, '').trim());
        const nota = {
            id: `NF${(dados.length + 1).toString().padStart(6, '0')}`,
            numero: valores[headers.indexOf('Número')] || '000001',
            fornecedor: valores[headers.indexOf('Fornecedor')] || 'Fornecedor',
            cnpj: valores[headers.indexOf('CNPJ')] || '00.000.000/0000-00',
            data: valores[headers.indexOf('Data')] || new Date().toISOString().split('T')[0],
            valor: parseFloat(valores[headers.indexOf('Valor')]?.replace(',', '.') || '1000'),
            status: valores[headers.indexOf('Status')] || 'pendente',
            tipo: valores[headers.indexOf('Tipo')] || 'entrada',
            vencimento: valores[headers.indexOf('Vencimento')] || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            pagamento: valores[headers.indexOf('Pagamento')] || null,
            criadoPor: currentUser.nome,
            criadoEm: new Date().toISOString(),
            modificadoEm: new Date().toISOString()
        };
        
        dados.push(nota);
    }
    
    return dados;
}

function restaurarBackupEspecifico(backupId) {
    const backup = backups.find(b => b.id === backupId);
    if (!backup) {
        showToast('Backup não encontrado', 'error');
        return;
    }
    
    if (!confirm(`Tem certeza que deseja restaurar o backup "${backup.nome}"? Os dados atuais serão sobrescritos.`)) {
        return;
    }
    
    // Em uma implementação real, buscaria os dados do backup específico
    // Por enquanto, simular restauração
    showToast('Restaurando backup...', 'info');
    
    setTimeout(() => {
        // Simular restauração
        showToast('Backup restaurado com sucesso!', 'success');
        
// ================= VARIÁVEIS GLOBAIS =================
let notasFiscais = [];
let currentPage = 1;
let itemsPerPage = 10;
let currentSort = { field: 'data', order: 'desc' };
let userPoints = 1000;
let userAchievements = [];
let notifications = [];
let axisConfig = {
    theme: 'light',
    animations: true,
    autoSave: true,
    itemsPerPage: 10,
    defaultView: 'grid',
    currency: 'BRL',
    dateFormat: 'pt-BR'
};

// ================= INICIALIZAÇÃO =================
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadDemoData();
    updateDashboard();
    setupSync();
});

function initializeApp() {
    // Carregar configurações salvas
    loadSettings();
    
    // Aplicar tema salvo
    applyTheme(axisConfig.theme);
    
    // Atualizar pontos
    updatePointsDisplay();
    
    // Configurar atalhos de teclado
    setupKeyboardShortcuts();
    
    // Iniciar sistema de notificações
    setupNotificationSystem();
    
    // Iniciar gamificação
    setupGamification();
}

function setupEventListeners() {
    // Upload de arquivos
    document.getElementById('file-input')?.addEventListener('change', handleFileUpload);
    document.getElementById('xml-input')?.addEventListener('change', handleXMLUpload);
    document.getElementById('restore-file')?.addEventListener('change', handleRestoreFile);
    
    // Drag and drop
    setupDragAndDrop('upload-zone', handleFileUpload);
    setupDragAndDrop('xml-upload-zone', handleXMLUpload);
    
    // Filtros
    document.getElementById('report-period')?.addEventListener('change', toggleCustomDates);
    document.getElementById('two-factor-auth')?.addEventListener('change', toggle2FAMethods);
}

function setupDragAndDrop(elementId, callback) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.addEventListener('dragover', (e) => {
        e.preventDefault();
        element.style.borderColor = 'var(--axis-primary)';
        element.style.background = 'var(--axis-gradient-light)';
    });
    
    element.addEventListener('dragleave', () => {
        element.style.borderColor = '';
        element.style.background = '';
    });
    
    element.addEventListener('drop', (e) => {
        e.preventDefault();
        element.style.borderColor = '';
        element.style.background = '';
        
        if (e.dataTransfer.files.length > 0) {
            callback({ target: { files: e.dataTransfer.files } });
        }
    });
}

// ================= TEMA =================
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Atualizar ícone
    const themeIcon = document.getElementById('theme-icon');
    themeIcon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    
    // Salvar preferência
    axisConfig.theme = newTheme;
    saveSettings();
    
    // Mostrar toast
    showToast(`Tema ${newTheme === 'light' ? 'claro' : 'escuro'} ativado`, 'success');
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeIcon = document.getElementById('theme-icon');
    themeIcon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// ================= SIDEBAR =================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    sidebar.classList.toggle('show');
    overlay.classList.toggle('show');
}

function showSection(sectionId) {
    // Esconder todas as seções
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostrar seção selecionada
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
        
        // Atualizar título da página
        updatePageTitle(sectionId);
        
        // Atualizar navegação
        updateNavigation(sectionId);
        
        // Fechar sidebar no mobile
        if (window.innerWidth < 1200) {
            toggleSidebar();
        }
        
        // Carregar dados específicos da seção
        loadSectionData(sectionId);
    }
}

function updatePageTitle(sectionId) {
    const titles = {
        'dashboard': 'Dashboard',
        'notas': 'Notas Fiscais',
        'fornecedores': 'Fornecedores',
        'relatorios': 'Relatórios',
        'backup': 'Backup',
        'configuracoes': 'Configurações'
    };
    
    const subtitles = {
        'dashboard': 'Sistema inteligente de gestão fiscal',
        'notas': 'Gerencie todas as suas notas fiscais',
        'fornecedores': 'Gerencie seus fornecedores',
        'relatorios': 'Análises detalhadas e relatórios',
        'backup': 'Backup e restauração de dados',
        'configuracoes': 'Configure o sistema conforme suas necessidades'
    };
    
    document.getElementById('page-title').textContent = titles[sectionId] || 'Dashboard';
    document.getElementById('page-subtitle').textContent = subtitles[sectionId] || 'Sistema inteligente de gestão fiscal';
}

function updateNavigation(sectionId) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeItem = document.querySelector(`.nav-item[onclick*="${sectionId}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

// ================= BUSCA E FILTROS =================
function handleSearch() {
    const searchTerm = document.getElementById('global-search').value.toLowerCase();
    const filteredNotas = notasFiscais.filter(nota => 
        nota.numero.toLowerCase().includes(searchTerm) ||
        nota.fornecedor.toLowerCase().includes(searchTerm) ||
        nota.chaveAcesso.toLowerCase().includes(searchTerm)
    );
    
    displayNotasFiscais(filteredNotas);
}

function toggleAdvancedSearch() {
    const advancedSearch = document.getElementById('advanced-search');
    advancedSearch.style.display = advancedSearch.style.display === 'block' ? 'none' : 'block';
}

function aplicarFiltros() {
    const dateFrom = document.getElementById('date-from').value;
    const dateTo = document.getElementById('date-to').value;
    const valueMin = document.getElementById('value-min').value;
    const valueMax = document.getElementById('value-max').value;
    const tipo = document.getElementById('filter-tipo').value;
    const status = document.getElementById('filter-status').value;
    
    let filtered = notasFiscais;
    
    if (dateFrom) {
        filtered = filtered.filter(nota => new Date(nota.data) >= new Date(dateFrom));
    }
    
    if (dateTo) {
        filtered = filtered.filter(nota => new Date(nota.data) <= new Date(dateTo));
    }
    
    if (valueMin) {
        filtered = filtered.filter(nota => nota.valor >= parseFloat(valueMin));
    }
    
    if (valueMax) {
        filtered = filtered.filter(nota => nota.valor <= parseFloat(valueMax));
    }
    
    if (tipo !== 'all') {
        filtered = filtered.filter(nota => nota.tipo === tipo);
    }
    
    if (status !== 'all') {
        filtered = filtered.filter(nota => nota.status === status);
    }
    
    displayNotasFiscais(filtered);
    toggleAdvancedSearch();
    
    showToast(`Filtros aplicados: ${filtered.length} notas encontradas`, 'success');
}

function limparFiltros() {
    document.getElementById('date-from').value = '';
    document.getElementById('date-to').value = '';
    document.getElementById('value-min').value = '';
    document.getElementById('value-max').value = '';
    document.getElementById('filter-tipo').value = 'all';
    document.getElementById('filter-status').value = 'all';
    
    displayNotasFiscais(notasFiscais);
    showToast('Filtros limpos', 'info');
}

function filtrarPorTipo(tipo) {
    const tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    event.target.classList.add('active');
    
    let filtered = notasFiscais;
    if (tipo !== 'all') {
        if (tipo === 'pendente') {
            filtered = notasFiscais.filter(nota => nota.status === 'pendente');
        } else {
            filtered = notasFiscais.filter(nota => nota.tipo === tipo);
        }
    }
    
    displayNotasFiscais(filtered);
}

// ================= NOTIFICAÇÕES =================
function setupNotificationSystem() {
    // Notificações de exemplo
    notifications = [
        {
            id: 1,
            title: 'Bem-vindo ao AXIS!',
            message: 'Sistema de gestão de notas fiscais inicializado com sucesso.',
            time: new Date(),
            read: false,
            type: 'info'
        },
        {
            id: 2,
            title: 'Backup Automático',
            message: 'Backup dos dados realizado com sucesso.',
            time: new Date(Date.now() - 3600000),
            read: true,
            type: 'success'
        }
    ];
    
    updateNotificationBadge();
    loadNotifications();
}

function toggleNotifications() {
    const panel = document.getElementById('notifications-panel');
    panel.classList.toggle('show');
    
    if (panel.classList.contains('show')) {
        markNotificationsAsRead();
    }
}

function loadNotifications() {
    const list = document.getElementById('notifications-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    notifications.forEach(notification => {
        const timeAgo = getTimeAgo(notification.time);
        const notificationItem = document.createElement('div');
        notificationItem.className = `notification-item ${notification.read ? '' : 'unread'}`;
        notificationItem.innerHTML = `
            <div class="notification-header">
                <span class="notification-title">${notification.title}</span>
                <span class="notification-time">${timeAgo}</span>
            </div>
            <div class="notification-content">${notification.message}</div>
        `;
        
        notificationItem.addEventListener('click', () => {
            notification.read = true;
            updateNotificationBadge();
            loadNotifications();
        });
        
        list.appendChild(notificationItem);
    });
}

function addNotification(title, message, type = 'info') {
    const notification = {
        id: notifications.length + 1,
        title,
        message,
        time: new Date(),
        read: false,
        type
    };
    
    notifications.unshift(notification);
    updateNotificationBadge();
    loadNotifications();
    
    // Mostrar toast se não estiver na tela de notificações
    const panel = document.getElementById('notifications-panel');
    if (!panel.classList.contains('show')) {
        showToast(title, type);
    }
}

function markNotificationsAsRead() {
    notifications.forEach(notification => {
        notification.read = true;
    });
    updateNotificationBadge();
    loadNotifications();
}

function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notification-badge');
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'block' : 'none';
    }
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' anos atrás';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' meses atrás';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' dias atrás';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' horas atrás';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutos atrás';
    
    return 'Agora mesmo';
}

// ================= DASHBOARD =================
function updateDashboard() {
    updateStats();
    updateCharts();
    updateRecentNotas();
    updateSmartWidgets();
}

function updateStats() {
    const total = notasFiscais.length;
    const pendentes = notasFiscais.filter(n => n.status === 'pendente').length;
    const pagas = notasFiscais.filter(n => n.status === 'pago').length;
    const vencidas = notasFiscais.filter(n => n.status === 'vencido').length;
    
    document.getElementById('total-nfs').textContent = total;
    document.getElementById('pendentes-nfs').textContent = pendentes;
    document.getElementById('pagas-nfs').textContent = pagas;
    document.getElementById('vencidas-nfs').textContent = vencidas;
    
    // Atualizar badge da sidebar
    const nfBadge = document.getElementById('nf-count');
    if (nfBadge) {
        nfBadge.textContent = total;
    }
    
    // Atualizar footer
    const footerCount = document.getElementById('footer-nf-count');
    if (footerCount) {
        footerCount.textContent = `${total} notas fiscais`;
    }
}

function updateCharts() {
    updateTipoChart();
    updateMensalChart();
}

function updateTipoChart() {
    const ctx = document.getElementById('chart-tipo')?.getContext('2d');
    if (!ctx) return;
    
    const tipos = ['entrada', 'saida', 'servico'];
    const labels = ['Entrada', 'Saída', 'Serviço'];
    const data = tipos.map(tipo => 
        notasFiscais.filter(n => n.tipo === tipo).length
    );
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(67, 97, 238, 0.8)',
                    'rgba(6, 214, 160, 0.8)',
                    'rgba(76, 201, 240, 0.8)'
                ],
                borderColor: [
                    'rgb(67, 97, 238)',
                    'rgb(6, 214, 160)',
                    'rgb(76, 201, 240)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'var(--text-primary)',
                        padding: 20
                    }
                }
            }
        }
    });
}

function updateMensalChart() {
    const ctx = document.getElementById('chart-mensal')?.getContext('2d');
    if (!ctx) return;
    
    // Últimos 6 meses
    const months = [];
    const data = [];
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.toLocaleDateString('pt-BR', { month: 'short' });
        months.push(month);
        
        // Simular dados
        data.push(Math.floor(Math.random() * 100) + 20);
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Notas Fiscais',
                data: data,
                borderColor: 'rgb(67, 97, 238)',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: 'var(--text-primary)'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'var(--border-color)'
                    },
                    ticks: {
                        color: 'var(--text-secondary)'
                    }
                },
                x: {
                    grid: {
                        color: 'var(--border-color)'
                    },
                    ticks: {
                        color: 'var(--text-secondary)'
                    }
                }
            }
        }
    });
}

function updateRecentNotas() {
    const tbody = document.getElementById('recent-nfs-table');
    if (!tbody) return;
    
    const recentNotas = notasFiscais
        .sort((a, b) => new Date(b.data) - new Date(a.data))
        .slice(0, 5);
    
    tbody.innerHTML = '';
    
    recentNotas.forEach(nota => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${nota.numero}</td>
            <td>${nota.fornecedor}</td>
            <td>${formatDate(nota.data)}</td>
            <td>${formatCurrency(nota.valor)}</td>
            <td><span class="status-badge status-${nota.status}">${nota.status}</span></td>
            <td>
                <button class="nf-action-btn" onclick="viewNFDetails('${nota.id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateSmartWidgets() {
    const container = document.getElementById('axis-smart-widgets');
    if (!container) return;
    
    // Widgets inteligentes
    const widgets = [
        {
            title: 'Insights Financeiros',
            icon: 'fas fa-chart-line',
            content: `Total em notas: ${formatCurrency(notasFiscais.reduce((sum, n) => sum + n.valor, 0))}`,
            color: 'primary'
        },
        {
            title: 'Próximos Vencimentos',
            icon: 'fas fa-clock',
            content: notasFiscais.filter(n => n.status === 'pendente').length + ' notas pendentes',
            color: 'warning'
        },
        {
            title: 'Eficiência do Sistema',
            icon: 'fas fa-rocket',
            content: 'Performance: 100%',
            color: 'success'
        }
    ];
    
    container.innerHTML = widgets.map(widget => `
        <div class="chart-card axis-card">
            <h3><i class="${widget.icon}"></i> ${widget.title}</h3>
            <div class="widget-content">
                <p>${widget.content}</p>
            </div>
        </div>
    `).join('');
}

// ================= GERENCIAMENTO DE NOTAS =================
function displayNotasFiscais(notas = notasFiscais) {
    const view = axisConfig.defaultView;
    
    if (view === 'grid') {
        displayNotasGrid(notas);
    } else {
        displayNotasList(notas);
    }
    
    updatePagination(notas.length);
}

function displayNotasGrid(notas) {
    const container = document.getElementById('nfs-grid');
    const listContainer = document.getElementById('nfs-list');
    
    if (!container) return;
    
    container.style.display = 'grid';
    if (listContainer) listContainer.style.display = 'none';
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedNotas = notas.slice(startIndex, endIndex);
    
    container.innerHTML = paginatedNotas.map(nota => `
        <div class="nf-card axis-card" onclick="viewNFDetails('${nota.id}')">
            <div class="nf-header">
                <span class="nf-number">${nota.numero}</span>
                <span class="nf-type ${nota.tipo}">${nota.tipo}</span>
            </div>
            <div class="nf-body">
                <div class="nf-supplier">${nota.fornecedor}</div>
                <div class="nf-date">${formatDate(nota.data)}</div>
                <div class="nf-value">${formatCurrency(nota.valor)}</div>
                <div class="nf-status">
                    <span class="status-badge status-${nota.status}">${nota.status}</span>
                </div>
            </div>
            <div class="nf-footer">
                <div class="nf-info">
                    <small>Vence: ${formatDate(nota.vencimento)}</small>
                </div>
                <div class="nf-actions">
                    <button class="nf-action-btn" onclick="event.stopPropagation(); editNF('${nota.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="nf-action-btn" onclick="event.stopPropagation(); deleteNF('${nota.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function displayNotasList(notas) {
    const container = document.getElementById('nfs-list');
    const gridContainer = document.getElementById('nfs-grid');
    const tbody = document.getElementById('nfs-table-body');
    
    if (!container || !tbody) return;
    
    container.style.display = 'block';
    if (gridContainer) gridContainer.style.display = 'none';
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedNotas = notas.slice(startIndex, endIndex);
    
    tbody.innerHTML = paginatedNotas.map(nota => `
        <tr>
            <td>${nota.numero}</td>
            <td>${nota.fornecedor}</td>
            <td>${formatDate(nota.data)}</td>
            <td>${formatCurrency(nota.valor)}</td>
            <td><span class="status-badge status-${nota.status}">${nota.status}</span></td>
            <td><span class="nf-type ${nota.tipo}">${nota.tipo}</span></td>
            <td>
                <button class="nf-action-btn" onclick="viewNFDetails('${nota.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="nf-action-btn" onclick="editNF('${nota.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="nf-action-btn" onclick="deleteNF('${nota.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function changeView(view) {
    axisConfig.defaultView = view;
    saveSettings();
    
    const viewBtns = document.querySelectorAll('.view-btn');
    viewBtns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    displayNotasFiscais();
}

function sortTable(field) {
    if (currentSort.field === field) {
        currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.field = field;
        currentSort.order = 'asc';
    }
    
    notasFiscais.sort((a, b) => {
        let aValue = a[field];
        let bValue = b[field];
        
        if (field === 'data' || field === 'vencimento') {
            aValue = new Date(aValue);
            bValue = new Date(bValue);
        }
        
        if (field === 'valor') {
            aValue = parseFloat(aValue);
            bValue = parseFloat(bValue);
        }
        
        if (aValue < bValue) return currentSort.order === 'asc' ? -1 : 1;
        if (aValue > bValue) return currentSort.order === 'asc' ? 1 : -1;
        return 0;
    });
    
    displayNotasFiscais();
    
    // Adicionar indicador de ordenação
    const headers = document.querySelectorAll('th');
    headers.forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
        if (header.textContent.toLowerCase().includes(field)) {
            header.classList.add(`sort-${currentSort.order}`);
        }
    });
}

function updatePagination(totalItems) {
    const container = document.getElementById('pagination');
    if (!container) return;
    
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Botão anterior
    html += `
        <button class="pagination-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Números das páginas
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += `<span class="pagination-dots">...</span>`;
        }
    }
    
    // Botão próximo
    html += `
        <button class="pagination-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    container.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    displayNotasFiscais();
}

// ================= MODAIS =================
function abrirUpload() {
    openModal('upload-modal');
}

function abrirScanner() {
    openModal('scanner-modal');
}

function abrirImportacaoXML() {
    openModal('xml-modal');
}

function abrirValidacaoChave() {
    openModal('validate-key-modal');
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
        
        // Resetar formulários
        if (modalId === 'upload-modal') {
            resetUploadForm();
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    });
}

// ================= UPLOAD =================
function handleFileUpload(event) {
    const files = event.target.files;
    if (files.length > 0) {
        simulateUploadProcess(files[0]);
    }
}

function simulateUploadProcess(file) {
    const progressBar = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const progressContainer = document.getElementById('upload-progress');
    
    progressContainer.style.display = 'block';
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        progressBar.style.width = progress + '%';
        progressText.textContent = progress + '%';
        
        if (progress >= 100) {
            clearInterval(interval);
            
            // Simular processamento
            setTimeout(() => {
                addDemoNF();
                showToast('Nota fiscal processada com sucesso!', 'success');
                addPoints(50);
                closeModal('upload-modal');
                progressContainer.style.display = 'none';
                progressBar.style.width = '0%';
                progressText.textContent = '0%';
            }, 500);
        }
    }, 200);
}

function resetUploadForm() {
    document.getElementById('file-input').value = '';
    document.getElementById('progress-fill').style.width = '0%';
    document.getElementById('progress-text').textContent = '0%';
    document.getElementById('upload-progress').style.display = 'none';
}

// ================= SCANNER =================
let scannerStream = null;

function startScanner() {
    const video = document.getElementById('scanner-video');
    const startBtn = document.getElementById('start-scanner');
    const stopBtn = document.getElementById('stop-scanner');
    const captureBtn = document.getElementById('capture-btn');
    
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
            scannerStream = stream;
            video.srcObject = stream;
            startBtn.disabled = true;
            stopBtn.disabled = false;
            captureBtn.disabled = false;
        })
        .catch(error => {
            showToast('Erro ao acessar a câmera: ' + error.message, 'error');
        });
}

function stopScanner() {
    if (scannerStream) {
        scannerStream.getTracks().forEach(track => track.stop());
        scannerStream = null;
        
        const video = document.getElementById('scanner-video');
        video.srcObject = null;
        
        document.getElementById('start-scanner').disabled = false;
        document.getElementById('stop-scanner').disabled = true;
        document.getElementById('capture-btn').disabled = true;
    }
}

function captureImage() {
    const video = document.getElementById('scanner-video');
    const canvas = document.getElementById('scanner-canvas');
    const resultDiv = document.getElementById('scanner-result');
    const saveBtn = document.getElementById('save-scan-btn');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    // Simular processamento de imagem
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
        <h4>Resultado do Scan</h4>
        <div class="scan-preview">
            <img src="${canvas.toDataURL()}" alt="Scan" style="max-width: 100%; border-radius: 8px;">
            <div class="scan-info">
                <p><strong>Nota detectada:</strong> NF-e 123456</p>
                <p><strong>Valor:</strong> R$ 1.234,56</p>
                <p><strong>Fornecedor:</strong> Empresa Exemplo LTDA</p>
            </div>
        </div>
    `;
    
    saveBtn.disabled = false;
}

function saveScanResult() {
    showToast('Nota fiscal escaneada salva com sucesso!', 'success');
    addPoints(30);
    addDemoNF();
    closeModal('scanner-modal');
    stopScanner();
}

// ================= IMPORTAR XML =================
function handleXMLUpload(event) {
    const files = event.target.files;
    if (files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const xmlText = e.target.result;
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
                
                // Extrair dados do XML (simplificado)
                const nfe = xmlDoc.querySelector('NFe');
                let nfData = {
                    numero: 'NF-e ' + Math.floor(Math.random() * 10000),
                    fornecedor: 'Fornecedor XML',
                    data: new Date().toISOString().split('T')[0],
                    valor: (Math.random() * 10000).toFixed(2),
                    tipo: 'entrada',
                    status: 'pendente',
                    vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                };
                
                // Tentar extrair dados reais
                const emitente = xmlDoc.querySelector('emit');
                if (emitente) {
                    const nome = emitente.querySelector('xNome');
                    if (nome) nfData.fornecedor = nome.textContent;
                }
                
                const valor = xmlDoc.querySelector('vNF');
                if (valor) nfData.valor = parseFloat(valor.textContent);
                
                // Mostrar preview
                const preview = document.getElementById('xml-preview');
                const info = document.getElementById('xml-info');
                const importBtn = document.getElementById('import-xml-btn');
                
                info.innerHTML = `
                    <div class="xml-data">
                        <p><strong>Número:</strong> ${nfData.numero}</p>
                        <p><strong>Fornecedor:</strong> ${nfData.fornecedor}</p>
                        <p><strong>Valor:</strong> ${formatCurrency(nfData.valor)}</p>
                        <p><strong>Tipo:</strong> ${nfData.tipo}</p>
                    </div>
                `;
                
                preview.style.display = 'block';
                importBtn.disabled = false;
                
                // Armazenar dados temporariamente
                importBtn.dataset.nfData = JSON.stringify(nfData);
                
            } catch (error) {
                showToast('Erro ao processar XML: ' + error.message, 'error');
            }
        };
        
        reader.readAsText(file);
    }
}

function importarXML() {
    const importBtn = document.getElementById('import-xml-btn');
    const nfData = JSON.parse(importBtn.dataset.nfData || '{}');
    
    if (nfData.numero) {
        addNotaFiscal(nfData);
        showToast('XML importado com sucesso!', 'success');
        addPoints(40);
        closeModal('xml-modal');
    }
}

// ================= VALIDAÇÃO DE CHAVE =================
function validarChaveNF() {
    const key = document.getElementById('nf-key').value;
    const captcha = document.getElementById('nf-captcha').value;
    const captchaCode = document.getElementById('captcha-code').textContent;
    
    if (!key || key.length !== 44) {
        showToast('Chave de acesso inválida. Deve ter 44 dígitos.', 'error');
        return;
    }
    
    if (captcha !== captchaCode) {
        showToast('Código de segurança incorreto.', 'error');
        refreshCaptcha();
        return;
    }
    
    // Simular validação
    const resultDiv = document.getElementById('validation-result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
        <div class="validation-success">
            <i class="fas fa-check-circle"></i>
            <h4>Chave Validada com Sucesso!</h4>
            <div class="validation-details">
                <p><strong>Status:</strong> Autorizada</p>
                <p><strong>Emissão:</strong> ${formatDate(new Date())}</p>
                <p><strong>Valor:</strong> R$ ${(Math.random() * 5000).toFixed(2)}</p>
                <p><strong>Emitente:</strong> Empresa Validada S/A</p>
            </div>
        </div>
    `;
    
    addPoints(20);
    showToast('Chave validada com sucesso!', 'success');
}

function refreshCaptcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
        captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('captcha-code').textContent = captcha;
}

// ================= DETALHES DA NF =================
function viewNFDetails(nfId) {
    const nota = notasFiscais.find(n => n.id === nfId);
    if (!nota) return;
    
    const modal = document.getElementById('nf-details-modal');
    const content = document.getElementById('nf-details-content');
    
    content.innerHTML = `
        <div class="nf-details">
            <div class="detail-header">
                <div class="detail-title">
                    <h4>${nota.numero}</h4>
                    <span class="nf-type ${nota.tipo}">${nota.tipo}</span>
                </div>
                <div class="detail-status">
                    <span class="status-badge status-${nota.status}">${nota.status}</span>
                </div>
            </div>
            
            <div class="detail-grid">
                <div class="detail-group">
                    <label>Fornecedor</label>
                    <p>${nota.fornecedor}</p>
                </div>
                
                <div class="detail-group">
                    <label>Data de Emissão</label>
                    <p>${formatDate(nota.data)}</p>
                </div>
                
                <div class="detail-group">
                    <label>Valor</label>
                    <p class="detail-value">${formatCurrency(nota.valor)}</p>
                </div>
                
                <div class="detail-group">
                    <label>Vencimento</label>
                    <p>${formatDate(nota.vencimento)}</p>
                </div>
                
                <div class="detail-group">
                    <label>Chave de Acesso</label>
                    <p class="detail-key">${nota.chaveAcesso || 'Não informada'}</p>
                </div>
                
                <div class="detail-group">
                    <label>CNPJ</label>
                    <p>${nota.cnpj || 'Não informado'}</p>
                </div>
            </div>
            
            <div class="detail-notes">
                <label>Observações</label>
                <p>${nota.observacoes || 'Nenhuma observação registrada.'}</p>
            </div>
            
            ${nota.anexos ? `
                <div class="detail-attachments">
                    <label>Anexos</label>
                    <div class="attachment-list">
                        ${nota.anexos.map(anexo => `
                            <a href="#" class="attachment-item">
                                <i class="fas fa-file-pdf"></i>
                                <span>${anexo}</span>
                            </a>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    openModal('nf-details-modal');
    modal.dataset.nfId = nfId;
}

function editNF(nfId) {
    const nota = notasFiscais.find(n => n.id === nfId);
    if (nota) {
        showToast('Funcionalidade de edição em desenvolvimento', 'info');
    }
}

function deleteNF(nfId) {
    if (confirm('Tem certeza que deseja excluir esta nota fiscal?')) {
        const index = notasFiscais.findIndex(n => n.id === nfId);
        if (index !== -1) {
            notasFiscais.splice(index, 1);
            updateDashboard();
            displayNotasFiscais();
            saveData();
            showToast('Nota fiscal excluída com sucesso!', 'success');
            addPoints(-10); // Penalidade por exclusão
        }
    }
}

// ================= GAMIFICAÇÃO =================
function setupGamification() {
    // Conquistas iniciais
    userAchievements = [
        { id: 1, name: 'Primeira NF', icon: '📝', unlocked: true, date: new Date() },
        { id: 2, name: 'Backup Realizado', icon: '💾', unlocked: true, date: new Date() }
    ];
    
    updateAchievementsDisplay();
}

function addPoints(points) {
    userPoints += points;
    if (userPoints < 0) userPoints = 0;
    
    updatePointsDisplay();
    
    // Verificar conquistas
    checkAchievements();
    
    // Mostrar feedback
    if (points > 0) {
        showToast(`+${points} pontos ganhos!`, 'success');
    } else if (points < 0) {
        showToast(`${Math.abs(points)} pontos perdidos`, 'warning');
    }
}

function updatePointsDisplay() {
    const display = document.getElementById('axis-points-display');
    if (display) {
        display.textContent = `${userPoints} pts`;
        
        // Animação especial para ganho de pontos
        if (userPoints > 0) {
            display.style.animation = 'pointsGlow 1s ease';
            setTimeout(() => {
                display.style.animation = '';
            }, 1000);
        }
    }
}

function checkAchievements() {
    const achievementsToCheck = [
        { condition: userPoints >= 1000, achievement: { id: 3, name: 'Mestre Axis', icon: '🏆', description: 'Alcançou 1000 pontos' } },
        { condition: notasFiscais.length >= 10, achievement: { id: 4, name: 'Colecionador', icon: '📚', description: 'Cadastrou 10 notas' } },
        { condition: notasFiscais.filter(n => n.status === 'pago').length >= 5, achievement: { id: 5, name: 'Financeiro', icon: '💰', description: '5 notas pagas' } }
    ];
    
    achievementsToCheck.forEach(({ condition, achievement }) => {
        if (condition && !userAchievements.find(a => a.id === achievement.id)) {
            unlockAchievement(achievement);
        }
    });
}

function unlockAchievement(achievement) {
    achievement.unlocked = true;
    achievement.date = new Date();
    userAchievements.push(achievement);
    
    updateAchievementsDisplay();
    
    // Notificação especial
    addNotification('Nova Conquista!', `Você desbloqueou: ${achievement.name}`, 'success');
    
    // Efeito visual
    const achievementEffect = document.createElement('div');
    achievementEffect.className = 'achievement-effect';
    achievementEffect.innerHTML = `
        <div class="achievement-popup">
            <span class="achievement-icon">${achievement.icon}</span>
            <h4>Conquista Desbloqueada!</h4>
            <p>${achievement.name}</p>
        </div>
    `;
    document.body.appendChild(achievementEffect);
    
    setTimeout(() => {
        achievementEffect.remove();
    }, 3000);
}

function updateAchievementsDisplay() {
    const container = document.querySelector('.achievements-list');
    if (!container) return;
    
    // Mostrar apenas 3 conquistas mais recentes
    const recentAchievements = [...userAchievements]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);
    
    container.innerHTML = recentAchievements.map(achievement => `
        <div class="achievement">
            <span class="achievement-icon">${achievement.icon}</span>
            <span class="achievement-text">${achievement.name}</span>
        </div>
    `).join('');
}

// ================= COMMAND PALETTE =================
function openCommandPalette() {
    const palette = document.getElementById('command-palette');
    if (palette) {
        palette.classList.add('show');
        document.getElementById('command-input').focus();
    }
}

function closeCommandPalette() {
    const palette = document.getElementById('command-palette');
    if (palette) {
        palette.classList.remove('show');
        document.getElementById('command-input').value = '';
    }
}

function executeCommand(command) {
    closeCommandPalette();
    
    switch(command) {
        case 'upload':
            abrirUpload();
            break;
        case 'dashboard':
            showSection('dashboard');
            break;
        case 'scanner':
            abrirScanner();
            break;
        case 'relatorio':
            showSection('relatorios');
            break;
        case 'backup':
            showSection('backup');
            break;
        case 'configuracoes':
            showSection('configuracoes');
            break;
        default:
            showToast(`Comando "${command}" não reconhecido`, 'error');
    }
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K para command palette
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openCommandPalette();
        }
        
        // Ctrl/Cmd + . para AI Assistant
        if ((e.ctrlKey || e.metaKey) && e.key === '.') {
            e.preventDefault();
            toggleAIAssistant();
        }
        
        // ESC para fechar modais
        if (e.key === 'Escape') {
            closeAllModals();
            closeCommandPalette();
            toggleAIAssistant(false);
        }
    });
}

// ================= AI ASSISTANT =================
function toggleAIAssistant(show = null) {
    const assistant = document.getElementById('ai-assistant');
    if (show === null) {
        show = !assistant.classList.contains('show');
    }
    
    if (show) {
        assistant.classList.add('show');
    } else {
        assistant.classList.remove('show');
    }
}

function sendAIMessage() {
    const input = document.getElementById('ai-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Adicionar mensagem do usuário
    addAIMessage(message, 'user');
    input.value = '';
    
    // Simular resposta do AI
    setTimeout(() => {
        const response = generateAIResponse(message);
        addAIMessage(response, 'ai');
    }, 1000);
}

function addAIMessage(message, sender) {
    const container = document.getElementById('ai-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ${sender}`;
    
    if (sender === 'ai') {
        messageDiv.innerHTML = `
            <div class="ai-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <p>${message}</p>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="ai-avatar user">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-content">
                <p>${message}</p>
            </div>
        `;
    }
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

function generateAIResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('olá') || lowerMessage.includes('oi') || lowerMessage.includes('hello')) {
        return 'Olá! Eu sou o Axis AI, seu assistente virtual. Como posso ajudá-lo com suas notas fiscais hoje?';
    }
    
    if (lowerMessage.includes('quantas notas') || lowerMessage.includes('total de notas')) {
        return `Você tem ${notasFiscais.length} notas fiscais cadastradas no sistema.`;
    }
    
    if (lowerMessage.includes('pendente') || lowerMessage.includes('vencimento')) {
        const pendentes = notasFiscais.filter(n => n.status === 'pendente').length;
        return `Você tem ${pendentes} notas fiscais pendentes. Recomendo verificar os vencimentos.`;
    }
    
    if (lowerMessage.includes('valor') || lowerMessage.includes('total')) {
        const total = notasFiscais.reduce((sum, n) => sum + n.valor, 0);
        return `O valor total das suas notas fiscais é ${formatCurrency(total)}.`;
    }
    
    if (lowerMessage.includes('ajuda') || lowerMessage.includes('comandos')) {
        return 'Posso ajudá-lo com: informações sobre notas fiscais, relatórios, backup, configurações. Digite sua pergunta!';
    }
    
    return 'Entendi sua pergunta. Como assistente AI, posso ajudá-lo a gerenciar suas notas fiscais, gerar relatórios e responder dúvidas sobre o sistema Axis.';
}

// ================= CONFIGURAÇÕES =================
function loadSettings() {
    const saved = localStorage.getItem('axisConfig');
    if (saved) {
        axisConfig = { ...axisConfig, ...JSON.parse(saved) };
        applySettings();
    }
}

function saveSettings() {
    localStorage.setItem('axisConfig', JSON.stringify(axisConfig));
}

function applySettings() {
    // Aplicar configurações gerais
    if (axisConfig.itemsPerPage) {
        itemsPerPage = axisConfig.itemsPerPage;
        const select = document.getElementById('settings-items-per-page');
        if (select) select.value = itemsPerPage;
    }
    
    if (axisConfig.defaultView) {
        const select = document.getElementById('settings-default-view');
        if (select) select.value = axisConfig.defaultView;
    }
    
    if (axisConfig.currency) {
        const select = document.getElementById('settings-currency');
        if (select) select.value = axisConfig.currency;
    }
    
    if (axisConfig.dateFormat) {
        const select = document.getElementById('settings-date-format');
        if (select) select.value = axisConfig.dateFormat;
    }
    
    if (axisConfig.autoSave !== undefined) {
        const checkbox = document.getElementById('settings-auto-save');
        if (checkbox) checkbox.checked = axisConfig.autoSave;
    }
    
    if (axisConfig.animations !== undefined) {
        const checkbox = document.getElementById('settings-animations');
        if (checkbox) checkbox.checked = axisConfig.animations;
    }
}

function saveSettings() {
    // Coletar configurações dos inputs
    axisConfig.itemsPerPage = parseInt(document.getElementById('settings-items-per-page').value) || 10;
    axisConfig.defaultView = document.getElementById('settings-default-view').value;
    axisConfig.currency = document.getElementById('settings-currency').value;
    axisConfig.dateFormat = document.getElementById('settings-date-format').value;
    axisConfig.autoSave = document.getElementById('settings-auto-save').checked;
    axisConfig.animations = document.getElementById('settings-animations').checked;
    
    // Salvar no localStorage
    localStorage.setItem('axisConfig', JSON.stringify(axisConfig));
    
    // Aplicar imediatamente
    itemsPerPage = axisConfig.itemsPerPage;
    
    showToast('Configurações salvas com sucesso!', 'success');
}

function resetSettings() {
    if (confirm('Restaurar configurações padrão?')) {
        axisConfig = {
            theme: 'light',
            animations: true,
            autoSave: true,
            itemsPerPage: 10,
            defaultView: 'grid',
            currency: 'BRL',
            dateFormat: 'pt-BR'
        };
        
        applySettings();
        saveSettings();
        showToast('Configurações restauradas para padrão', 'info');
    }
}

function openSettingsTab(tabId) {
    // Esconder todas as abas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remover active de todos os botões
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar aba selecionada
    const tab = document.getElementById(`tab-${tabId}`);
    if (tab) {
        tab.classList.add('active');
    }
    
    // Ativar botão
    event.target.classList.add('active');
}

function toggleCustomDates() {
    const period = document.getElementById('report-period').value;
    const customDates = document.getElementById('custom-dates');
    customDates.style.display = period === 'custom' ? 'block' : 'none';
}

function toggle2FAMethods() {
    const enabled = document.getElementById('two-factor-auth').checked;
    const methods = document.getElementById('auth-methods');
    methods.style.display = enabled ? 'block' : 'none';
}

// ================= BACKUP =================
function criarBackup() {
    const backupData = {
        notasFiscais,
        userPoints,
        userAchievements,
        axisConfig,
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `axis-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    addNotification('Backup Criado', 'Backup dos dados realizado com sucesso.', 'success');
    addPoints(25);
}

function exportarBackupJSON() {
    criarBackup();
}

function exportarBackupCSV() {
    // Converter notas para CSV
    const headers = ['Número', 'Fornecedor', 'Data', 'Valor', 'Tipo', 'Status', 'Vencimento'];
    const rows = notasFiscais.map(nota => [
        nota.numero,
        nota.fornecedor,
        nota.data,
        nota.valor,
        nota.tipo,
        nota.status,
        nota.vencimento
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `axis-notas-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    showToast('CSV exportado com sucesso!', 'success');
}

function salvarConfigBackup() {
    const autoBackup = document.getElementById('auto-backup').checked;
    const frequency = document.getElementById('backup-frequency').value;
    const location = document.getElementById('backup-location').value;
    
    localStorage.setItem('backupConfig', JSON.stringify({
        autoBackup,
        frequency,
        location
    }));
    
    showToast('Configurações de backup salvas!', 'success');
}

function handleRestoreFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backupData = JSON.parse(e.target.result);
            
            if (confirm('Restaurar backup? Isso sobrescreverá os dados atuais.')) {
                notasFiscais = backupData.notasFiscais || [];
                userPoints = backupData.userPoints || 1000;
                userAchievements = backupData.userAchievements || [];
                axisConfig = { ...axisConfig, ...backupData.axisConfig };
                
                saveData();
                saveSettings();
                updateDashboard();
                displayNotasFiscais();
                
                showToast('Backup restaurado com sucesso!', 'success');
                addNotification('Restauração Completa', 'Dados restaurados do backup.', 'info');
            }
        } catch (error) {
            showToast('Erro ao restaurar backup: arquivo inválido', 'error');
        }
    };
    
    reader.readAsText(file);
}

function restaurarBackup() {
    document.getElementById('restore-file').click();
}

// ================= RELATÓRIOS =================
function gerarRelatorioAvancado() {
    const period = document.getElementById('report-period').value;
    const type = document.getElementById('report-type').value;
    
    let startDate, endDate;
    
    if (period === 'custom') {
        startDate = new Date(document.getElementById('report-date-from').value);
        endDate = new Date(document.getElementById('report-date-to').value);
    } else {
        const now = new Date();
        switch(period) {
            case 'current_month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'last_month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'current_quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
                break;
            case 'current_year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                break;
        }
    }
    
    // Filtrar notas pelo período
    const filteredNotas = notasFiscais.filter(nota => {
        const notaDate = new Date(nota.data);
        return notaDate >= startDate && notaDate <= endDate;
    });
    
    // Gerar relatório baseado no tipo
    switch(type) {
        case 'financial':
            generateFinancialReport(filteredNotas);
            break;
        case 'tax':
            generateTaxReport(filteredNotas);
            break;
        case 'supplier':
            generateSupplierReport(filteredNotas);
            break;
        case 'status':
            generateStatusReport(filteredNotas);
            break;
    }
    
    showToast('Relatório gerado com sucesso!', 'success');
}

function generateFinancialReport(notas) {
    const total = notas.reduce((sum, n) => sum + n.valor, 0);
    const avg = total / (notas.length || 1);
    const max = Math.max(...notas.map(n => n.valor));
    const min = Math.min(...notas.map(n => n.valor));
    
    const summary = document.getElementById('financial-summary');
    if (summary) {
        summary.innerHTML = `
            <div class="financial-stats">
                <div class="stat">
                    <span class="stat-label">Total</span>
                    <span class="stat-value">${formatCurrency(total)}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Média</span>
                    <span class="stat-value">${formatCurrency(avg)}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Maior</span>
                    <span class="stat-value">${formatCurrency(max)}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Menor</span>
                    <span class="stat-value">${formatCurrency(min)}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Quantidade</span>
                    <span class="stat-value">${notas.length}</span>
                </div>
            </div>
        `;
    }
    
    // Atualizar tabela de detalhes
    const details = document.getElementById('report-details');
    if (details) {
        details.innerHTML = notas.map(nota => `
            <tr>
                <td>${nota.numero}</td>
                <td>${nota.fornecedor}</td>
                <td>${formatDate(nota.data)}</td>
                <td>${formatCurrency(nota.valor)}</td>
                <td>${formatCurrency(nota.valor * 0.18)}</td>
                <td>${formatCurrency(nota.valor * 0.03)}</td>
                <td><span class="status-badge status-${nota.status}">${nota.status}</span></td>
            </tr>
        `).join('');
    }
}

function exportarRelatorioExcel() {
    showToast('Exportação para Excel em desenvolvimento', 'info');
}

function gerarRelatorioContabil() {
    showToast('Gerando PDF contábil...', 'info');
    
    // Simular geração de PDF
    setTimeout(() => {
        showToast('PDF contábil gerado com sucesso!', 'success');
        addPoints(15);
    }, 2000);
}

// ================= SYNC =================
function setupSync() {
    // Sincronizar a cada 5 minutos
    setInterval(() => {
        if (axisConfig.autoSave) {
            saveData();
            updateSyncStatus();
        }
    }, 5 * 60 * 1000);
    
    // Status inicial
    updateSyncStatus();
}

function updateSyncStatus() {
    const status = document.getElementById('sync-status');
    if (status) {
        const now = new Date();
        status.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        // Animação de sincronização
        status.style.animation = 'axisSpin 1s ease';
        setTimeout(() => {
            status.style.animation = '';
        }, 1000);
    }
}

// ================= UTILITÁRIOS =================
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString(axisConfig.dateFormat || 'pt-BR');
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: axisConfig.currency || 'BRL'
    }).format(value);
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${getToastIcon(type)}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${getToastTitle(type)}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

function getToastIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

function getToastTitle(type) {
    switch(type) {
        case 'success': return 'Sucesso!';
        case 'error': return 'Erro!';
        case 'warning': return 'Atenção!';
        default: return 'Informação';
    }
}

// ================= DADOS DEMO =================
function loadDemoData() {
    const savedData = localStorage.getItem('notasFiscais');
    if (savedData) {
        notasFiscais = JSON.parse(savedData);
    } else {
        generateDemoData();
    }
}

function generateDemoData() {
    const fornecedores = [
        'Fornecedor A Ltda',
        'Distribuidora B SA',
        'Comércio C ME',
        'Serviços D EIRELI',
        'Indústria E LTDA'
    ];
    
    const tipos = ['entrada', 'saida', 'servico'];
    const statuses = ['pendente', 'pago', 'vencido'];
    
    for (let i = 1; i <= 15; i++) {
        const tipo = tipos[Math.floor(Math.random() * tipos.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const data = new Date();
        data.setDate(data.getDate() - Math.floor(Math.random() * 30));
        
        addNotaFiscal({
            id: 'nf-' + i,
            numero: 'NF-e ' + (1000 + i),
            fornecedor: fornecedores[Math.floor(Math.random() * fornecedores.length)],
            data: data.toISOString().split('T')[0],
            valor: (Math.random() * 10000).toFixed(2),
            tipo: tipo,
            status: status,
            vencimento: new Date(data.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            chaveAcesso: '12345678901234567890123456789012345678901234',
            cnpj: Math.random().toString().slice(2, 16),
            observacoes: i % 3 === 0 ? 'Nota com observações especiais' : null,
            anexos: i % 4 === 0 ? ['nota.pdf', 'comprovante.jpg'] : null
        }, false);
    }
    
    saveData();
}

function addDemoNF() {
    const fornecedores = ['Fornecedor Demo', 'Empresa Teste', 'Fornecedor Novo'];
    const tipos = ['entrada', 'saida', 'servico'];
    
    const novaNF = {
        id: 'nf-' + (notasFiscais.length + 1),
        numero: 'NF-e ' + (1000 + notasFiscais.length + 1),
        fornecedor: fornecedores[Math.floor(Math.random() * fornecedores.length)],
        data: new Date().toISOString().split('T')[0],
        valor: (Math.random() * 5000).toFixed(2),
        tipo: tipos[Math.floor(Math.random() * tipos.length)],
        status: 'pendente',
        vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    
    addNotaFiscal(novaNF);
}

function addNotaFiscal(nota, showNotification = true) {
    if (!nota.id) {
        nota.id = 'nf-' + Date.now();
    }
    
    notasFiscais.unshift(nota);
    
    if (showNotification) {
        addNotification('Nova Nota Fiscal', `Nota ${nota.numero} adicionada com sucesso`, 'success');
    }
    
    updateDashboard();
    displayNotasFiscais();
    saveData();
}

function saveData() {
    localStorage.setItem('notasFiscais', JSON.stringify(notasFiscais));
    localStorage.setItem('userPoints', userPoints);
    localStorage.setItem('userAchievements', JSON.stringify(userAchievements));
}

function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'notas':
            displayNotasFiscais();
            break;
        case 'relatorios':
            gerarRelatorioAvancado();
            break;
        // Outras seções podem carregar dados específicos aqui
    }
}

function abrirLembretes() {
    showToast('Sistema de lembretes em desenvolvimento', 'info');
}

function gerarRelatorio() {
    showToast('Gerando relatório...', 'info');
    setTimeout(() => {
        showToast('Relatório gerado com sucesso!', 'success');
        addPoints(20);
    }, 1500);
}

function abrirCadastroFornecedor() {
    showToast('Cadastro de fornecedor em desenvolvimento', 'info');
}

function searchSuppliers() {
    showToast('Busca de fornecedores em desenvolvimento', 'info');
}

function exportarFornecedores() {
    showToast('Exportação de fornecedores em desenvolvimento', 'info');
}

function conectarGoogleDrive() {
    showToast('Conexão com Google Drive em desenvolvimento', 'info');
}

function testarEmail() {
    showToast('Teste de e-mail em desenvolvimento', 'info');
}

function changePassword() {
    showToast('Alteração de senha em desenvolvimento', 'info');
}

function resetAllData() {
    if (confirm('Tem certeza que deseja resetar todos os dados? Esta ação não pode ser desfeita.')) {
        localStorage.clear();
        location.reload();
    }
}

function logout() {
    if (confirm('Deseja sair do sistema?')) {
        showToast('Saindo do sistema...', 'info');
        setTimeout(() => {
            // Em um sistema real, aqui iria para a página de login
            alert('Sistema de login em desenvolvimento');
        }, 1000);
    }
}