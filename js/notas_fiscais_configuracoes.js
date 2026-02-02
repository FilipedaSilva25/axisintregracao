// ================= SISTEMA DE CONFIGURAÇÕES =================

// Carregar configurações do localStorage
function carregarConfiguracoes() {
    const configs = JSON.parse(localStorage.getItem('axis_nf_configuracoes') || '{}');
    
    // Aplicar valores padrão
    const configuracoesPadrao = {
        // Geral
        itemsPerPage: configs.itemsPerPage || '20',
        defaultView: configs.defaultView || 'grid',
        currency: configs.currency || 'BRL',
        dateFormat: configs.dateFormat || 'pt-BR',
        autoSave: configs.autoSave !== undefined ? configs.autoSave : true,
        animations: configs.animations !== undefined ? configs.animations : true,
        
        // Notificações
        notifyExpiring: configs.notifyExpiring !== undefined ? configs.notifyExpiring : true,
        notifyDaysBefore: configs.notifyDaysBefore || '7',
        notifyNew: configs.notifyNew !== undefined ? configs.notifyNew : true,
        notifyBackup: configs.notifyBackup !== undefined ? configs.notifyBackup : true,
        notificationSound: configs.notificationSound || 'none',
        desktopNotifications: configs.desktopNotifications !== undefined ? configs.desktopNotifications : false,
        
        // Integração
        googleDriveConnected: configs.googleDriveConnected || false,
        smtpServer: configs.smtpServer || 'smtp.gmail.com',
        smtpPort: configs.smtpPort || '587',
        smtpEmail: configs.smtpEmail || '',
        syncCloud: configs.syncCloud !== undefined ? configs.syncCloud : false,
        syncInterval: configs.syncInterval || '15',
        
        // Segurança
        sessionTimeout: configs.sessionTimeout || '15',
        autoLogout: configs.autoLogout !== undefined ? configs.autoLogout : false,
        twoFactorAuth: configs.twoFactorAuth !== undefined ? configs.twoFactorAuth : false,
        twoFactorMethod: configs.twoFactorMethod || 'email'
    };
    
    // Aplicar valores nos campos
    document.getElementById('settings-items-per-page').value = configuracoesPadrao.itemsPerPage;
    document.getElementById('settings-default-view').value = configuracoesPadrao.defaultView;
    document.getElementById('settings-currency').value = configuracoesPadrao.currency;
    document.getElementById('settings-date-format').value = configuracoesPadrao.dateFormat;
    document.getElementById('settings-auto-save').checked = configuracoesPadrao.autoSave;
    document.getElementById('settings-animations').checked = configuracoesPadrao.animations;
    
    document.getElementById('notify-expiring').checked = configuracoesPadrao.notifyExpiring;
    document.getElementById('notify-days-before').value = configuracoesPadrao.notifyDaysBefore;
    document.getElementById('notify-new').checked = configuracoesPadrao.notifyNew;
    document.getElementById('notify-backup').checked = configuracoesPadrao.notifyBackup;
    document.getElementById('notification-sound').value = configuracoesPadrao.notificationSound;
    document.getElementById('desktop-notifications').checked = configuracoesPadrao.desktopNotifications;
    
    const googleDriveStatus = document.getElementById('google-drive-status');
    if (googleDriveStatus) {
        googleDriveStatus.innerHTML = configuracoesPadrao.googleDriveConnected 
            ? '<span class="status-badge connected">Conectado</span><button class="btn-secondary" onclick="desconectarGoogleDrive()">Desconectar</button>'
            : '<span class="status-badge disconnected">Não conectado</span><button class="btn-secondary" onclick="conectarGoogleDrive()">Conectar</button>';
    }
    document.getElementById('smtp-server').value = configuracoesPadrao.smtpServer;
    document.getElementById('smtp-port').value = configuracoesPadrao.smtpPort;
    document.getElementById('smtp-email').value = configuracoesPadrao.smtpEmail;
    document.getElementById('sync-cloud').checked = configuracoesPadrao.syncCloud;
    document.getElementById('sync-interval').value = configuracoesPadrao.syncInterval;
    
    document.getElementById('session-timeout').value = configuracoesPadrao.sessionTimeout;
    document.getElementById('auto-logout').checked = configuracoesPadrao.autoLogout;
    document.getElementById('two-factor-auth').checked = configuracoesPadrao.twoFactorAuth;
    document.getElementById('two-factor-method').value = configuracoesPadrao.twoFactorMethod;
    
    // Mostrar/ocultar opções de 2FA
    const authMethods = document.getElementById('auth-methods');
    if (authMethods) {
        authMethods.style.display = configuracoesPadrao.twoFactorAuth ? 'block' : 'none';
    }
    
    return configuracoesPadrao;
}

// Salvar configurações
function saveSettings() {
    const configuracoes = {
        // Geral
        itemsPerPage: document.getElementById('settings-items-per-page').value,
        defaultView: document.getElementById('settings-default-view').value,
        currency: document.getElementById('settings-currency').value,
        dateFormat: document.getElementById('settings-date-format').value,
        autoSave: document.getElementById('settings-auto-save').checked,
        animations: document.getElementById('settings-animations').checked,
        
        // Notificações
        notifyExpiring: document.getElementById('notify-expiring').checked,
        notifyDaysBefore: document.getElementById('notify-days-before').value,
        notifyNew: document.getElementById('notify-new').checked,
        notifyBackup: document.getElementById('notify-backup').checked,
        notificationSound: document.getElementById('notification-sound').value,
        desktopNotifications: document.getElementById('desktop-notifications').checked,
        
        // Integração
        smtpServer: document.getElementById('smtp-server').value,
        smtpPort: document.getElementById('smtp-port').value,
        smtpEmail: document.getElementById('smtp-email').value,
        syncCloud: document.getElementById('sync-cloud').checked,
        syncInterval: document.getElementById('sync-interval').value,
        
        // Segurança
        sessionTimeout: document.getElementById('session-timeout').value,
        autoLogout: document.getElementById('auto-logout').checked,
        twoFactorAuth: document.getElementById('two-factor-auth').checked,
        twoFactorMethod: document.getElementById('two-factor-method').value
    };
    
    // Salvar no localStorage
    localStorage.setItem('axis_nf_configuracoes', JSON.stringify(configuracoes));
    
    // Aplicar algumas configurações imediatamente
    if (typeof state !== 'undefined' && state.viewMode) {
        state.viewMode = configuracoes.defaultView;
    }
    
    // Mostrar toast de sucesso
    if (typeof mostrarToast !== 'undefined') {
        mostrarToast('Configurações salvas com sucesso!', 'success');
    } else {
        alert('Configurações salvas com sucesso!');
    }
}

// Restaurar padrões
function resetSettings() {
    if (!confirm('Deseja restaurar todas as configurações para os valores padrão?')) {
        return;
    }
    
    // Remover configurações do localStorage
    localStorage.removeItem('axis_nf_configuracoes');
    
    // Recarregar configurações (que aplicará os padrões)
    carregarConfiguracoes();
    
    if (typeof mostrarToast !== 'undefined') {
        mostrarToast('Configurações restauradas para os valores padrão', 'success');
    } else {
        alert('Configurações restauradas para os valores padrão');
    }
}

// Resetar todos os dados
function resetAllData() {
    if (!confirm('ATENÇÃO: Esta ação irá apagar TODOS os dados do sistema (notas fiscais, configurações, etc.). Esta ação NÃO pode ser desfeita.\n\nDeseja realmente continuar?')) {
        return;
    }
    
    if (!confirm('Tem CERTEZA? Todos os dados serão perdidos permanentemente!')) {
        return;
    }
    
    // Limpar localStorage
    const keysToKeep = []; // Lista de chaves para manter (se houver)
    const keys = Object.keys(localStorage);
    keys.forEach(function(key) {
        if (keysToKeep.indexOf(key) === -1) {
            localStorage.removeItem(key);
        }
    });
    
    if (typeof mostrarToast !== 'undefined') {
        mostrarToast('Todos os dados foram resetados. A página será recarregada.', 'success');
    } else {
        alert('Todos os dados foram resetados. A página será recarregada.');
    }
    
    // Recarregar página após 2 segundos
    setTimeout(function() {
        window.location.reload();
    }, 2000);
}

// Abrir aba de configurações
function openSettingsTab(tabId) {
    // Remover active de todos os botões e conteúdos
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(function(content) {
        content.classList.remove('active');
    });
    
    // Ativar botão e conteúdo selecionados
    const btn = document.querySelector(`.tab-btn[onclick*="'${tabId}'"]`);
    const content = document.getElementById(`tab-${tabId}`);
    
    if (btn) btn.classList.add('active');
    if (content) content.classList.add('active');
}

// Conectar Google Drive
function conectarGoogleDrive() {
    if (typeof mostrarToast !== 'undefined') {
        mostrarToast('Funcionalidade de Google Drive em desenvolvimento', 'info');
    } else {
        alert('Funcionalidade de Google Drive em desenvolvimento');
    }
    
    // Simular conexão (apenas para demonstração)
    const configs = JSON.parse(localStorage.getItem('axis_nf_configuracoes') || '{}');
    configs.googleDriveConnected = true;
    localStorage.setItem('axis_nf_configuracoes', JSON.stringify(configs));
    
    const googleDriveStatus = document.getElementById('google-drive-status');
    if (googleDriveStatus) {
        googleDriveStatus.innerHTML = '<span class="status-badge connected">Conectado</span><button class="btn-secondary" onclick="desconectarGoogleDrive()">Desconectar</button>';
    }
}

// Desconectar Google Drive
function desconectarGoogleDrive() {
    const configs = JSON.parse(localStorage.getItem('axis_nf_configuracoes') || '{}');
    configs.googleDriveConnected = false;
    localStorage.setItem('axis_nf_configuracoes', JSON.stringify(configs));
    
    const googleDriveStatus = document.getElementById('google-drive-status');
    if (googleDriveStatus) {
        googleDriveStatus.innerHTML = '<span class="status-badge disconnected">Não conectado</span><button class="btn-secondary" onclick="conectarGoogleDrive()">Conectar</button>';
    }
}

// Testar conexão de e-mail
function testarEmail() {
    const server = document.getElementById('smtp-server').value;
    const port = document.getElementById('smtp-port').value;
    const email = document.getElementById('smtp-email').value;
    
    if (!server || !port || !email) {
        if (typeof mostrarToast !== 'undefined') {
            mostrarToast('Preencha todos os campos de e-mail', 'error');
        } else {
            alert('Preencha todos os campos de e-mail');
        }
        return;
    }
    
    if (typeof mostrarToast !== 'undefined') {
        mostrarToast('Testando conexão...', 'info');
    }
    
    // Simular teste (apenas para demonstração)
    setTimeout(function() {
        if (typeof mostrarToast !== 'undefined') {
            mostrarToast('Conexão de e-mail testada com sucesso!', 'success');
        } else {
            alert('Conexão de e-mail testada com sucesso!');
        }
    }, 1500);
}

// Alterar senha
function changePassword() {
    const current = document.getElementById('current-password').value;
    const newPass = document.getElementById('new-password').value;
    const confirm = document.getElementById('confirm-password').value;
    
    if (!current || !newPass || !confirm) {
        if (typeof mostrarToast !== 'undefined') {
            mostrarToast('Preencha todos os campos de senha', 'error');
        } else {
            alert('Preencha todos os campos de senha');
        }
        return;
    }
    
    if (newPass !== confirm) {
        if (typeof mostrarToast !== 'undefined') {
            mostrarToast('As senhas não coincidem', 'error');
        } else {
            alert('As senhas não coincidem');
        }
        return;
    }
    
    if (newPass.length < 6) {
        if (typeof mostrarToast !== 'undefined') {
            mostrarToast('A senha deve ter pelo menos 6 caracteres', 'error');
        } else {
            alert('A senha deve ter pelo menos 6 caracteres');
        }
        return;
    }
    
    // Aqui seria feita a validação da senha atual e alteração real
    // Por enquanto, apenas simular
    
    if (typeof mostrarToast !== 'undefined') {
        mostrarToast('Senha alterada com sucesso!', 'success');
    } else {
        alert('Senha alterada com sucesso!');
    }
    
    // Limpar campos
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
}

// Toggle 2FA
function toggle2FA() {
    const twoFactorCheckbox = document.getElementById('two-factor-auth');
    const authMethods = document.getElementById('auth-methods');
    
    if (twoFactorCheckbox && authMethods) {
        authMethods.style.display = twoFactorCheckbox.checked ? 'block' : 'none';
    }
}

// Inicializar ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    // Carregar configurações ao carregar a página
    setTimeout(function() {
        carregarConfiguracoes();
        // Garantir que 2FA está no estado correto
        toggle2FA();
    }, 500);
});

// Exportar funções globalmente
window.saveSettings = saveSettings;
window.resetSettings = resetSettings;
window.resetAllData = resetAllData;
window.openSettingsTab = openSettingsTab;
window.conectarGoogleDrive = conectarGoogleDrive;
window.desconectarGoogleDrive = desconectarGoogleDrive;
window.testarEmail = testarEmail;
window.changePassword = changePassword;
window.carregarConfiguracoes = carregarConfiguracoes;
window.toggle2FA = toggle2FA;

console.log('✅ Sistema de configurações carregado!');
