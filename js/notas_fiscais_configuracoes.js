// ================= SISTEMA DE CONFIGURAÇÕES =================

var nfConfigGlassOutsideBound = false;

function nfCloseAllConfigGlassDropdowns() {
    document.querySelectorAll('#configuracoes .setor-selector-dropdown.is-open').forEach(function (d) {
        d.classList.remove('is-open');
        d.setAttribute('aria-hidden', 'true');
        var tid = d.id.replace(/-dropdown$/, '-trigger');
        var t = document.getElementById(tid);
        if (t) t.setAttribute('aria-expanded', 'false');
    });
}

function nfBindConfigGlassOutsideClick() {
    if (nfConfigGlassOutsideBound) return;
    nfConfigGlassOutsideBound = true;
    document.addEventListener('click', function () {
        if (!document.getElementById('configuracoes')) return;
        nfCloseAllConfigGlassDropdowns();
    });
}

function nfBuildDropdownFromSelect(select) {
    var dropdown = document.getElementById(select.id + '-dropdown');
    if (!dropdown) return;
    dropdown.innerHTML = '';
    Array.prototype.forEach.call(select.options, function (opt) {
        var div = document.createElement('div');
        div.className = 'setor-selector-option';
        div.setAttribute('role', 'option');
        div.setAttribute('data-value', opt.value);
        div.textContent = opt.textContent;
        dropdown.appendChild(div);
    });
}

function nfSyncGlassFromSelect(selectId) {
    var select = document.getElementById(selectId);
    var trigger = document.getElementById(selectId + '-trigger');
    var dropdown = document.getElementById(selectId + '-dropdown');
    if (!select || !trigger || !dropdown) return;
    var opt = select.options[select.selectedIndex];
    trigger.textContent = opt ? opt.textContent.trim() : '';
    dropdown.querySelectorAll('.setor-selector-option').forEach(function (o) {
        o.classList.toggle('selected', (o.getAttribute('data-value') || '') === select.value);
    });
}

function nfInitGlassSelect(selectId) {
    var select = document.getElementById(selectId);
    var trigger = document.getElementById(selectId + '-trigger');
    var dropdown = document.getElementById(selectId + '-dropdown');
    if (!select || !trigger || !dropdown) return;
    if (select.dataset.nfGlassBound === '1') return;
    select.dataset.nfGlassBound = '1';
    nfBuildDropdownFromSelect(select);
    trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        var wasOpen = dropdown.classList.contains('is-open');
        nfCloseAllConfigGlassDropdowns();
        if (!wasOpen) {
            dropdown.classList.add('is-open');
            trigger.setAttribute('aria-expanded', 'true');
            dropdown.setAttribute('aria-hidden', 'false');
            nfSyncGlassFromSelect(selectId);
        }
    });
    dropdown.querySelectorAll('.setor-selector-option').forEach(function (optEl) {
        optEl.addEventListener('click', function (e) {
            e.stopPropagation();
            var v = optEl.getAttribute('data-value') || '';
            select.value = v;
            trigger.textContent = optEl.textContent.trim();
            dropdown.querySelectorAll('.setor-selector-option').forEach(function (o) {
                o.classList.remove('selected');
            });
            optEl.classList.add('selected');
            dropdown.classList.remove('is-open');
            trigger.setAttribute('aria-expanded', 'false');
            dropdown.setAttribute('aria-hidden', 'true');
            select.dispatchEvent(new Event('change', { bubbles: true }));
        });
    });
    nfBindConfigGlassOutsideClick();
    nfSyncGlassFromSelect(selectId);
}

var NF_GLASS_SELECT_IDS = [
    'settings-items-per-page',
    'settings-default-view',
    'settings-currency',
    'settings-date-format',
    'notification-sound'
];

function nfInitAllGlassSelects() {
    NF_GLASS_SELECT_IDS.forEach(nfInitGlassSelect);
}

function nfSyncAllConfigGlassSelects() {
    NF_GLASS_SELECT_IDS.forEach(nfSyncGlassFromSelect);
}

function carregarConfiguracoes() {
    var configs = JSON.parse(localStorage.getItem('axis_nf_configuracoes') || '{}');

    var configuracoesPadrao = {
        itemsPerPage: configs.itemsPerPage || '20',
        defaultView: configs.defaultView || 'grid',
        currency: configs.currency || 'BRL',
        dateFormat: configs.dateFormat || 'pt-BR',
        autoSave: configs.autoSave !== undefined ? configs.autoSave : true,
        animations: configs.animations !== undefined ? configs.animations : true,
        notifyExpiring: configs.notifyExpiring !== undefined ? configs.notifyExpiring : true,
        notifyDaysBefore: configs.notifyDaysBefore || '7',
        notifyNew: configs.notifyNew !== undefined ? configs.notifyNew : true,
        notifyBackup: configs.notifyBackup !== undefined ? configs.notifyBackup : true,
        notificationSound: configs.notificationSound || 'none',
        desktopNotifications: configs.desktopNotifications !== undefined ? configs.desktopNotifications : false,
        googleDriveConnected: configs.googleDriveConnected || false,
        smtpServer: configs.smtpServer || 'smtp.gmail.com',
        smtpPort: configs.smtpPort || '587',
        smtpEmail: configs.smtpEmail || '',
        syncCloud: configs.syncCloud !== undefined ? configs.syncCloud : false,
        syncInterval: configs.syncInterval || '15',
        sessionTimeout: configs.sessionTimeout || '15',
        autoLogout: configs.autoLogout !== undefined ? configs.autoLogout : false,
        twoFactorAuth: configs.twoFactorAuth !== undefined ? configs.twoFactorAuth : false,
        twoFactorMethod: configs.twoFactorMethod || 'email'
    };

    function setSelect(id, value) {
        var el = document.getElementById(id);
        if (el && el.tagName === 'SELECT') el.value = value;
    }
    function setChecked(id, value) {
        var el = document.getElementById(id);
        if (el && el.type === 'checkbox') el.checked = value;
    }
    function setInput(id, value) {
        var el = document.getElementById(id);
        if (el) el.value = value;
    }

    setSelect('settings-items-per-page', configuracoesPadrao.itemsPerPage);
    setSelect('settings-default-view', configuracoesPadrao.defaultView);
    setSelect('settings-currency', configuracoesPadrao.currency);
    setSelect('settings-date-format', configuracoesPadrao.dateFormat);
    setChecked('settings-auto-save', configuracoesPadrao.autoSave);
    setChecked('settings-animations', configuracoesPadrao.animations);

    setChecked('notify-expiring', configuracoesPadrao.notifyExpiring);
    setInput('notify-days-before', configuracoesPadrao.notifyDaysBefore);
    setChecked('notify-new', configuracoesPadrao.notifyNew);
    setChecked('notify-backup', configuracoesPadrao.notifyBackup);
    setSelect('notification-sound', configuracoesPadrao.notificationSound);
    setChecked('desktop-notifications', configuracoesPadrao.desktopNotifications);

    nfSyncAllConfigGlassSelects();
    return configuracoesPadrao;
}

function saveSettings() {
    var prev = JSON.parse(localStorage.getItem('axis_nf_configuracoes') || '{}');

    function val(id, fallback) {
        var el = document.getElementById(id);
        return el ? el.value : fallback;
    }
    function chk(id, fallback) {
        var el = document.getElementById(id);
        return el ? el.checked : fallback;
    }

    var configuracoes = Object.assign({}, prev, {
        itemsPerPage: val('settings-items-per-page', prev.itemsPerPage || '20'),
        defaultView: val('settings-default-view', prev.defaultView || 'grid'),
        currency: val('settings-currency', prev.currency || 'BRL'),
        dateFormat: val('settings-date-format', prev.dateFormat || 'pt-BR'),
        autoSave: chk('settings-auto-save', prev.autoSave !== false),
        animations: chk('settings-animations', prev.animations !== false),
        notifyExpiring: chk('notify-expiring', prev.notifyExpiring !== false),
        notifyDaysBefore: val('notify-days-before', prev.notifyDaysBefore || '7'),
        notifyNew: chk('notify-new', prev.notifyNew !== false),
        notifyBackup: chk('notify-backup', prev.notifyBackup !== false),
        notificationSound: val('notification-sound', prev.notificationSound || 'none'),
        desktopNotifications: chk('desktop-notifications', !!prev.desktopNotifications)
    });

    localStorage.setItem('axis_nf_configuracoes', JSON.stringify(configuracoes));

    if (typeof state !== 'undefined' && state.viewMode) {
        state.viewMode = configuracoes.defaultView;
    }

    if (typeof mostrarToast !== 'undefined') {
        mostrarToast('As configurações foram salvas com sucesso.', 'success');
    } else {
        alert('As configurações foram salvas com sucesso.');
    }
}

function resetSettings() {
    if (!confirm('Deseja restaurar todas as configurações para os valores padrão?')) {
        return;
    }

    localStorage.removeItem('axis_nf_configuracoes');
    carregarConfiguracoes();

    if (typeof mostrarToast !== 'undefined') {
        mostrarToast('Os valores padrão foram restaurados.', 'success');
    } else {
        alert('Os valores padrão foram restaurados.');
    }
}

function resetAllData() {
    if (!confirm('ATENÇÃO: Esta ação irá apagar TODOS os dados do sistema (notas fiscais, configurações, etc.). Esta ação NÃO pode ser desfeita.\n\nDeseja realmente continuar?')) {
        return;
    }

    if (!confirm('Tem CERTEZA? Todos os dados serão perdidos permanentemente!')) {
        return;
    }

    var keysToKeep = [];
    Object.keys(localStorage).forEach(function (key) {
        if (keysToKeep.indexOf(key) === -1) {
            localStorage.removeItem(key);
        }
    });

    if (typeof mostrarToast !== 'undefined') {
        mostrarToast('Todos os dados foram resetados. A página será recarregada.', 'success');
    } else {
        alert('Todos os dados foram resetados. A página será recarregada.');
    }

    setTimeout(function () {
        window.location.reload();
    }, 2000);
}

function openSettingsTab(tabId) {
    var root = document.querySelector('#configuracoes .settings-tabs');
    if (!root) return;
    root.querySelectorAll('.tab-btn').forEach(function (btn) {
        btn.classList.remove('active');
    });
    root.querySelectorAll('.tab-content').forEach(function (content) {
        content.classList.remove('active');
    });
    var btn = root.querySelector('.tab-btn[data-settings-tab="' + tabId + '"]');
    var content = document.getElementById('tab-' + tabId);
    if (btn) btn.classList.add('active');
    if (content) content.classList.add('active');
}

document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
        nfInitAllGlassSelects();
        carregarConfiguracoes();
    }, 100);
});

window.saveSettings = saveSettings;
window.resetSettings = resetSettings;
window.resetAllData = resetAllData;
window.openSettingsTab = openSettingsTab;
window.carregarConfiguracoes = carregarConfiguracoes;

