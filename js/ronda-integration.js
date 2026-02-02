// ============================================
// INTEGRAÇÃO DO SISTEMA DE RONDAS NO INDEX.HTML
// ============================================

// Objeto global para o sistema de rondas
window.rondaSystem = {
    initialized: false,
    
    // Inicializar o sistema de rondas
    initRondaSystem: function() {
        if (this.initialized) return;
        
        const pageRondas = document.getElementById('page-rondas');
        if (!pageRondas) return;
        
        // Esconder loading se existir
        const loading = document.getElementById('ronda-loading');
        if (loading) {
            loading.style.display = 'none';
        }
        
        // Inicializar componentes do sistema
        if (typeof window.inicializarNavegacao === 'function') {
            window.inicializarNavegacao();
        }
        if (typeof window.inicializarFormulario === 'function') {
            window.inicializarFormulario();
        }
        if (typeof window.inicializarDashboard === 'function') {
            window.inicializarDashboard();
        }
        if (typeof window.inicializarMinhasRondas === 'function') {
            window.inicializarMinhasRondas();
        }
        if (typeof window.inicializarCalendario === 'function') {
            window.inicializarCalendario();
        }
        if (typeof window.inicializarRelatorios === 'function') {
            window.inicializarRelatorios();
        }
        if (typeof window.inicializarConfiguracoes === 'function') {
            window.inicializarConfiguracoes();
        }
        
        this.initialized = true;
        console.log('✅ Sistema de Rondas inicializado com sucesso!');
    }
};

// Inicializar quando a página de rondas for acessada
document.addEventListener('DOMContentLoaded', function() {
    const pageRondas = document.getElementById('page-rondas');
    if (pageRondas && pageRondas.classList.contains('active')) {
        window.rondaSystem.initRondaSystem();
    }
});

// Observar mudanças na navegação para inicializar quando necessário
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const pageRondas = document.getElementById('page-rondas');
            if (pageRondas && pageRondas.classList.contains('active')) {
                if (!window.rondaSystem.initialized) {
                    window.rondaSystem.initRondaSystem();
                }
            }
        }
    });
});

// Iniciar observação quando o DOM estiver pronto
setTimeout(() => {
    const pageRondas = document.getElementById('page-rondas');
    if (pageRondas) {
        observer.observe(pageRondas, { attributes: true });
    }
}, 100);
