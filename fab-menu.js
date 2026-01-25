/* ============================================
   MENU FAB UNIFICADO - CHAT E WHATSAPP
   ============================================ */

class FABMenu {
    constructor() {
        this.isOpen = false;
        this.whatsappButton = null;
        this.chatButton = null;
    }

    criarMenuFAB() {
        // Verificar se já existe
        if (document.getElementById('fab-menu-unificado')) return;

        // Verificar se usuário está logado
        const isLoggedIn = localStorage.getItem('last_login');
        if (!isLoggedIn) {
            return;
        }

        // Criar container do menu FAB
        const fabContainer = document.createElement('div');
        fabContainer.id = 'fab-menu-unificado';
        fabContainer.className = 'fab-menu-unificado';
        fabContainer.innerHTML = `
            <!-- Botão principal (chat) -->
            <button class="fab-main-button" id="fab-main-toggle" title="Chat de Suporte">
                <span class="fab-main-icon">💬</span>
            </button>
            
            <!-- Menu de opções -->
            <div class="fab-menu-options" id="fab-menu-options">
                <button class="fab-option-button" id="fab-whatsapp-button" title="Alertas WhatsApp">
                    <span class="fab-option-icon">📱</span>
                    <span class="fab-option-label">WhatsApp</span>
                </button>
            </div>
        `;

        document.body.appendChild(fabContainer);

        // Event listeners
        const mainButton = document.getElementById('fab-main-toggle');
        const whatsappButton = document.getElementById('fab-whatsapp-button');

        if (mainButton) {
            mainButton.addEventListener('click', (e) => {
                e.stopPropagation();
                // Abrir chat diretamente ao clicar no botão principal
                this.abrirChat();
            });
        }

        if (whatsappButton) {
            whatsappButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.abrirWhatsApp();
                this.toggleMenu();
            });
        }

        // Fechar menu ao clicar fora
        document.addEventListener('click', (e) => {
            if (this.isOpen && !fabContainer.contains(e.target)) {
                this.toggleMenu();
            }
        });

        console.log('✅ Menu FAB unificado criado');
    }

    toggleMenu() {
        const container = document.getElementById('fab-menu-unificado');
        const options = document.getElementById('fab-menu-options');
        const mainButton = document.getElementById('fab-main-toggle');

        if (!container || !options) return;

        this.isOpen = !this.isOpen;

        if (this.isOpen) {
            container.classList.add('active');
            options.style.display = 'flex';
            mainButton.style.transform = 'rotate(45deg)';
        } else {
            container.classList.remove('active');
            setTimeout(() => {
                options.style.display = 'none';
            }, 300);
            mainButton.style.transform = 'rotate(0deg)';
        }
    }

    abrirChat() {
        if (typeof toggleChat === 'function') {
            toggleChat();
        } else if (typeof window.suporteTecnico && typeof window.suporteTecnico.toggleChat === 'function') {
            window.suporteTecnico.toggleChat();
        } else {
            console.warn('Função toggleChat não encontrada');
        }
    }

    abrirWhatsApp() {
        if (window.whatsAppAlerts && typeof window.whatsAppAlerts.abrirPainelControle === 'function') {
            window.whatsAppAlerts.abrirPainelControle();
        } else {
            console.warn('Painel WhatsApp não encontrado');
        }
    }

    removerMenu() {
        const menu = document.getElementById('fab-menu-unificado');
        if (menu) {
            menu.remove();
            this.isOpen = false;
        }
    }

    atualizarVisibilidade() {
        const isLoggedIn = localStorage.getItem('last_login');
        const menu = document.getElementById('fab-menu-unificado');
        const authScreen = document.getElementById('auth-screen');
        const mainContent = document.getElementById('main-content');

        // Verificar se está na tela de login (auth-screen visível)
        const isOnLoginScreen = authScreen && (authScreen.style.display === 'flex' || authScreen.style.display === '');

        if (isLoggedIn && !isOnLoginScreen && mainContent && mainContent.style.display !== 'none') {
            if (!menu) {
                this.criarMenuFAB();
            } else {
                menu.style.display = 'block';
            }
        } else {
            if (menu) {
                menu.style.display = 'none';
            }
        }
    }
}

// Instância global
window.fabMenu = new FABMenu();

// Observar mudanças no login
function observarLoginFAB() {
    const observer = new MutationObserver(() => {
        if (window.fabMenu) {
            window.fabMenu.atualizarVisibilidade();
        }
    });

    // Observar mudanças no localStorage (login/logout)
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        originalSetItem.apply(this, arguments);
        if (key === 'last_login' || key === 'user') {
            setTimeout(() => {
                if (window.fabMenu) {
                    window.fabMenu.atualizarVisibilidade();
                }
            }, 100);
        }
    };

    // Verificar inicialmente
    setTimeout(() => {
        if (window.fabMenu) {
            window.fabMenu.atualizarVisibilidade();
        }
    }, 1000);
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    observarLoginFAB();
    
    // Criar menu após um pequeno delay para garantir que outros sistemas estão prontos
    setTimeout(() => {
        if (window.fabMenu) {
            window.fabMenu.atualizarVisibilidade();
        }
    }, 1500);
});
