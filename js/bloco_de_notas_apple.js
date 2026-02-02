// ============================================
// BLOCo DE NOTAS APPLE - JavaScript Completo
// Todas as funcionalidades implementadas
// ============================================

// Estrutura de Dados Expandida
let notebookData = {
    folders: {},
    notes: {},
    currentFolder: 'root',
    currentNote: null,
    folderExpanded: {}, // id da pasta -> true/false (subpastas expandidas)
    viewMode: 'grid',
    tags: {},
    templates: {},
    versions: {},
    comments: {},
    reminders: {},
    linkedNotes: {},
    settings: {
        theme: 'light',
        autosave: true,
        autosaveInterval: 2000,
        shortcuts: {},
        darkModeAuto: false
    },
    statistics: {
        totalWords: 0,
        notesCreated: 0,
        usageTime: 0,
        lastBackup: null
    }
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('📝 Bloco de Notas Apple inicializado');
    
    try {
        loadData();
    } catch (e) {
        console.warn('loadData:', e);
    }
    
    try {
        setupEventListeners();
    } catch (e) {
        console.warn('setupEventListeners:', e);
    }
    
    try {
        renderFolders();
        renderNotes();
    } catch (e) {
        console.warn('renderFolders/renderNotes:', e);
    }

    try {
        setupSidebarResizer();
    } catch (e) {
        console.warn('setupSidebarResizer:', e);
    }
    
    // Ao recarregar: nunca abrir o editor por padrão; só ao criar nova nota ou abrir uma existente
    notebookData.currentNote = null;
    const editorContainer = document.getElementById('note-editor-container');
    const emptyState = document.getElementById('empty-editor-state');
    const notesListContainer = document.getElementById('notes-list-container');
    const main = document.querySelector('.notebook-main');
    if (editorContainer) {
        editorContainer.style.display = 'none';
        editorContainer.classList.remove('active');
    }
    if (emptyState) {
        emptyState.style.display = 'flex';
        emptyState.classList.add('show');
    }
    if (notesListContainer) {
        notesListContainer.style.display = 'flex';
        notesListContainer.classList.remove('hidden');
    }
    if (main) main.classList.remove('editor-open');
    hideGoogleDocsToolbar();
    closeEditorOptionsPanel();
    
    try {
        setupKeyboardShortcuts();
    } catch (e) { console.warn('setupKeyboardShortcuts:', e); }
    try {
        initializeAdvancedFeatures();
    } catch (e) { console.warn('initializeAdvancedFeatures:', e); }
    try {
        initializeParticles();
    } catch (e) { console.warn('initializeParticles:', e); }
    try {
        initializeDragAndDrop();
    } catch (e) { console.warn('initializeDragAndDrop:', e); }
    try {
        initializeServiceWorker();
    } catch (e) { console.warn('initializeServiceWorker:', e); }
    try {
        initializeNotifications();
    } catch (e) { console.warn('initializeNotifications:', e); }
    try {
        startIntelligentAutosave();
    } catch (e) { console.warn('startIntelligentAutosave:', e); }
    try {
        startAutoBackup();
    } catch (e) { console.warn('startAutoBackup:', e); }
    try {
        startStatisticsTracking();
    } catch (e) { console.warn('startStatisticsTracking:', e); }
    
    // Garantir que os botões de pesquisa e + estejam visíveis
    setTimeout(() => {
        const searchBtn = document.getElementById('btn-search-notes');
        const folderBtn = document.getElementById('btn-new-folder');
        if (searchBtn) {
            searchBtn.style.display = 'flex';
            searchBtn.style.visibility = 'visible';
            searchBtn.style.opacity = '1';
        }
        if (folderBtn) {
            folderBtn.style.display = 'flex';
            folderBtn.style.visibility = 'visible';
            folderBtn.style.opacity = '1';
        }
    }, 100);
});

// Carregar dados do localStorage
function loadData() {
    const saved = localStorage.getItem('notebookAppleData');
    if (saved) {
        try {
            notebookData = JSON.parse(saved);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    }
    
    // Inicializar estrutura se vazia
    if (!notebookData.folders) notebookData.folders = {};
    if (!notebookData.notes) notebookData.notes = {};
    if (!notebookData.currentFolder) notebookData.currentFolder = 'root';
    if (!notebookData.tags) notebookData.tags = {};
    if (!notebookData.templates) notebookData.templates = {};
    if (!notebookData.versions) notebookData.versions = {};
    if (!notebookData.comments) notebookData.comments = {};
    if (!notebookData.reminders) notebookData.reminders = {};
    if (!notebookData.linkedNotes) notebookData.linkedNotes = {};
    if (!notebookData.settings) notebookData.settings = {
        theme: 'light',
        autosave: true,
        autosaveInterval: 2000,
        shortcuts: {},
        darkModeAuto: false
    };
    if (!notebookData.statistics) notebookData.statistics = {
        totalWords: 0,
        notesCreated: 0,
        usageTime: 0,
        lastBackup: null
    };
    if (!notebookData.folderExpanded) notebookData.folderExpanded = {};
    
    // Corrigir estrutura de pastas (garantir que pastas principais não sejam subpastas)
    fixFolderStructure();
    
    // Inicializar templates padrão
    initializeTemplates();
    
    // Inicializar tema
    applyTheme(notebookData.settings.theme);
    
    // Verificar modo escuro automático
    if (notebookData.settings.darkModeAuto) {
        checkAutoDarkMode();
    }
    
    // Ao recarregar a página, nunca abrir o editor por padrão: só ao criar nova nota ou clicar numa nota
    notebookData.currentNote = null;
}

// Salvar dados no localStorage
function saveData() {
    try {
        localStorage.setItem('notebookAppleData', JSON.stringify(notebookData));
        updateSaveStatus('Salvo');
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        updateSaveStatus('Erro ao salvar');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Botão nova pasta
    document.getElementById('btn-new-folder')?.addEventListener('click', () => {
        showModal('modal-new-folder');
    });
    
    // Botão nova nota
    // Botão Nova Nota no header
    document.getElementById('btn-new-note-header')?.addEventListener('click', createNewNote);
    // Botão Nova Nota na toolbar (se ainda existir)
    document.getElementById('btn-new-note')?.addEventListener('click', createNewNote);
    
    // Botões de formatação
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const format = this.dataset.format;
            if (format) {
                applyFormat(format);
            }
        });
    });
    
    // Color pickers
    setupColorPickers();
    
    // Inserir imagem
    document.getElementById('btn-insert-image')?.addEventListener('click', insertImage);
    
    // Inserir link
    document.getElementById('btn-insert-link')?.addEventListener('click', insertLink);
    
    // Inserir tabela
    document.getElementById('btn-insert-table')?.addEventListener('click', insertTable);
    
    // Salvar nota
    // Botão salvar removido - salvamento automático ativo
    // document.getElementById('btn-save-note')?.addEventListener('click', saveCurrentNote);
    
    // Fechar editor
    document.getElementById('btn-close-editor')?.addEventListener('click', closeEditor);
    
    // Título da nota
    document.getElementById('note-title')?.addEventListener('input', function() {
        if (notebookData.currentNote) {
            notebookData.notes[notebookData.currentNote].title = this.value;
            saveData();
            renderNotes();
        }
    });
    
    // Editor de conteúdo
    const editor = document.getElementById('rich-editor');
    if (editor) {
        editor.addEventListener('focus', function() {
            const toolbar = document.getElementById('editor-format-toolbar');
            if (toolbar && notebookData.currentNote) toolbar.style.display = 'block';
            updatePlaceholderVisibility();
        });
        editor.addEventListener('blur', function() {
            const toolbar = document.getElementById('editor-format-toolbar');
            if (toolbar) {
                if (isEditorEmpty(editor)) {
                    setTimeout(function() {
                        if (document.activeElement !== editor) toolbar.style.display = 'none';
                    }, 200);
                }
            }
            updatePlaceholderVisibility();
        });
        editor.addEventListener('input', (function() {
            var saveTimeout;
            return function() {
                updatePlaceholderVisibility();
                if (notebookData.currentNote) {
                    notebookData.notes[notebookData.currentNote].content = isEditorEmpty(editor) ? '' : editor.innerHTML;
                    updateWordCount();
                    clearTimeout(saveTimeout);
                    saveTimeout = setTimeout(saveData, 500);
                    var toolbar = document.getElementById('editor-format-toolbar');
                    if (toolbar && !isEditorEmpty(editor)) toolbar.style.display = 'block';
                }
            };
        })());
        editor.addEventListener('paste', handlePaste);
        initImageLayoutToolbar(editor);
        updatePlaceholderVisibility();
    }
    
    // Busca
    document.getElementById('search-notes')?.addEventListener('input', function() {
        searchNotes(this.value);
    });
    
    // Toggle view
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.dataset.view;
            setViewMode(view);
        });
    });
    
    // Favoritar nota
    document.getElementById('btn-star-note')?.addEventListener('click', toggleStar);
    
    // Exportar nota
    document.getElementById('btn-export-note')?.addEventListener('click', () => showModal('modal-export'));
    
    // Novos botões
    document.getElementById('btn-focus-mode')?.addEventListener('click', toggleFocusMode);
    document.getElementById('btn-templates')?.addEventListener('click', () => showModal('modal-templates'));
    document.getElementById('btn-statistics')?.addEventListener('click', () => showModal('modal-statistics'));
    document.getElementById('btn-shortcuts')?.addEventListener('click', () => showModal('modal-shortcuts'));
    document.getElementById('btn-theme-toggle')?.addEventListener('click', toggleTheme);
    document.getElementById('btn-theme-toggle-header')?.addEventListener('click', toggleTheme);
    document.getElementById('btn-pin-note')?.addEventListener('click', togglePin);
    document.getElementById('btn-advanced-search')?.addEventListener('click', () => showModal('modal-advanced-search'));
    document.getElementById('btn-voice-search')?.addEventListener('click', startVoiceSearch);
    document.getElementById('btn-add-tag')?.addEventListener('click', () => showModal('modal-tags'));
    document.getElementById('btn-markdown-preview')?.addEventListener('click', toggleMarkdownPreview);
    document.getElementById('btn-link-notes')?.addEventListener('click', showLinkNotesModal);
    document.getElementById('btn-versions')?.addEventListener('click', () => showModal('modal-versions'));
    document.getElementById('btn-comments')?.addEventListener('click', () => showModal('modal-comments'));
    /* Toolbar grande: mesmas ações do antigo menu pequeno */
    document.getElementById('toolbar-add-tag')?.addEventListener('click', () => showModal('modal-tags'));
    document.getElementById('toolbar-markdown-preview')?.addEventListener('click', toggleMarkdownPreview);
    document.getElementById('toolbar-link-notes')?.addEventListener('click', showLinkNotesModal);
    document.getElementById('toolbar-versions')?.addEventListener('click', () => showModal('modal-versions'));
    
    /* Menu hambúrguer ao lado do título: abre/fecha o painel de opções na área ao lado das pastas */
    document.getElementById('editor-toolbar-hamburger')?.addEventListener('click', toggleEditorToolbar);
    
    /* Botão fechar do painel de opções */
    document.getElementById('editor-options-close')?.addEventListener('click', closeEditorOptionsPanel);
    
    /* Itens do painel de opções (ação conforme data-action) */
    document.getElementById('editor-options-list')?.addEventListener('click', function (e) {
        const item = e.target.closest('.editor-option-item');
        if (!item) return;
        const action = item.getAttribute('data-action');
        if (!action) return;
        if (action === 'undo') document.getElementById('toolbar-undo')?.click();
        else if (action === 'redo') document.getElementById('toolbar-redo')?.click();
        else if (action === 'print') document.getElementById('toolbar-print')?.click();
        else if (action === 'bold') applyFormat('bold');
        else if (action === 'italic') applyFormat('italic');
        else if (action === 'underline') applyFormat('underline');
        else if (action === 'text-color') showEditorOptionsColors('text');
        else if (action === 'highlight') showEditorOptionsColors('highlight');
        else if (action === 'link') showModal('modal-insert-link');
        else if (action === 'image') showModal('modal-insert-image');
        else if (action === 'tag') showModal('modal-tags');
        else if (action === 'markdown') toggleMarkdownPreview();
        else if (action === 'link-notes') showLinkNotesModal();
        else if (action === 'versions') showModal('modal-versions');
        else if (action === 'comment') document.getElementById('toolbar-comment')?.click();
        else if (action === 'align-left') applyFormat('alignLeft');
        else if (action === 'align-center') applyFormat('alignCenter');
        else if (action === 'align-right') applyFormat('alignRight');
        else if (action === 'list-bullet') document.getElementById('toolbar-list-bullet')?.click();
        else if (action === 'list-number') document.getElementById('toolbar-list-number')?.click();
        else if (action === 'clear-format') document.getElementById('toolbar-clear-format')?.click();
    });
    
    /* Abas e paleta de cores no painel (cor do texto / marca-texto) */
    document.querySelectorAll('.editor-options-color-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.editor-options-color-tab').forEach(function (t) { t.classList.remove('active'); });
            this.classList.add('active');
            fillEditorOptionsColorsGrid(this.getAttribute('data-mode'));
        });
    });
    document.getElementById('editor-options-colors-grid')?.addEventListener('click', function (e) {
        var swatch = e.target.closest('.editor-options-color-swatch');
        if (!swatch) return;
        var color = swatch.getAttribute('data-color');
        var mode = document.querySelector('.editor-options-color-tab.active')?.getAttribute('data-mode') || 'text';
        applyEditorOptionColor(color, mode);
    });
    document.getElementById('editor-options-hex-apply')?.addEventListener('click', function() {
        var input = document.getElementById('editor-options-hex-input');
        if (!input) return;
        var hex = (input.value || '').trim();
        if (hex.indexOf('#') !== 0) hex = '#' + hex;
        if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
            showToast('Digite um código válido (ex: #FF5500)', 'info');
            return;
        }
        var mode = document.querySelector('.editor-options-color-tab.active')?.getAttribute('data-mode') || 'text';
        applyEditorOptionColor(hex, mode);
    });
    document.getElementById('editor-options-hex-input')?.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') document.getElementById('editor-options-hex-apply')?.click();
    });
    
    /* Modal Inserir Link: confirmar */
    document.getElementById('btn-insert-link-confirm')?.addEventListener('click', confirmInsertLink);
    
    /* Modal Inserir Imagem: zona de upload (clique + arrastar e soltar) e confirmar */
    var dropZone = document.getElementById('insert-image-drop');
    var fileInput = document.getElementById('insert-image-file');
    if (dropZone && fileInput) {
        dropZone.addEventListener('click', function () { fileInput.click(); });
        fileInput.addEventListener('change', onInsertImageFileSelected);
        dropZone.addEventListener('dragover', function (e) { e.preventDefault(); dropZone.classList.add('drag-over'); });
        dropZone.addEventListener('dragleave', function () { dropZone.classList.remove('drag-over'); });
        dropZone.addEventListener('drop', function (e) {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            var files = e.dataTransfer && e.dataTransfer.files;
            if (files && files[0] && files[0].type.indexOf('image/') === 0) {
                try {
                    var dt = new DataTransfer();
                    dt.items.add(files[0]);
                    fileInput.files = dt.files;
                } catch (err) {
                    fileInput.files = files;
                }
                onInsertImageFileSelected({ target: fileInput });
            }
        });
    }
    document.getElementById('btn-insert-image-confirm')?.addEventListener('click', confirmInsertImage);
    
    // Setup Toolbar Google Docs
    setupGoogleDocsToolbar();
}

// Setup color pickers
function setupColorPickers() {
    const textColorBtn = document.getElementById('btn-text-color');
    const highlightBtn = document.getElementById('btn-highlight');
    const textColorPicker = document.getElementById('text-color-picker');
    const highlightColorPicker = document.getElementById('highlight-color-picker');
    
    // Variável para controlar cliques dentro do picker
    let isClickingInsidePicker = false;
    
    if (textColorBtn && textColorPicker) {
        textColorBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Toggle o picker de texto
            textColorPicker.classList.toggle('show');
            
            // Fechar o outro picker
            if (highlightColorPicker) {
                highlightColorPicker.classList.remove('show');
            }
        });
        
        textColorPicker.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('mousedown', function(e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                isClickingInsidePicker = true;
            });
            
            option.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                const color = this.dataset.color;
                applyTextColor(color);
                // Atualizar seleção visual
                textColorPicker.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                // Não fechar o picker
                setTimeout(() => {
                    isClickingInsidePicker = false;
                }, 200);
            });
        });
    }
    
    if (highlightBtn && highlightColorPicker) {
        // Definir tipo para o header
        highlightColorPicker.setAttribute('data-type', 'Marca-Texto');
        
        highlightBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Toggle o picker de highlight
            highlightColorPicker.classList.toggle('show');
            
            // Fechar o outro picker
            if (textColorPicker) {
                textColorPicker.classList.remove('show');
            }
        });
        
        highlightColorPicker.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('mousedown', function(e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                isClickingInsidePicker = true;
            });
            
            option.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                const color = this.dataset.color;
                applyHighlight(color);
                // Atualizar seleção visual
                highlightColorPicker.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                // Não fechar o picker
                setTimeout(() => {
                    isClickingInsidePicker = false;
                }, 200);
            });
        });
    }
    
    // Fechar color pickers ao clicar fora
    // Detectar quando está clicando dentro do picker (para todas as áreas)
    [textColorPicker, highlightColorPicker].forEach(picker => {
        if (picker) {
            picker.addEventListener('mousedown', function(e) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                isClickingInsidePicker = true;
            });
            
            picker.addEventListener('click', function(e) {
                e.stopPropagation();
                e.stopImmediatePropagation();
            });
            
            picker.addEventListener('mouseup', function(e) {
                e.stopPropagation();
                e.stopImmediatePropagation();
            });
        }
    });
    
    // Obter referência ao editor
    const richEditor = document.getElementById('rich-editor');
    
    // Fechar apenas quando clicar fora - NÃO fechar ao clicar no editor
    document.addEventListener('click', function(e) {
        // Aguardar para garantir que eventos internos foram processados
        setTimeout(() => {
            // Se clicou no botão, não fechar (já tratado pelo toggle)
            if (textColorBtn?.contains(e.target) || highlightBtn?.contains(e.target)) {
                return;
            }
            
            // Se clicou dentro do editor de texto, NÃO fechar o picker
            if (richEditor?.contains(e.target)) {
                return; // Não fechar ao clicar no editor
            }
            
            // Se clicou dentro de qualquer picker ou seus elementos, não fechar
            const clickedInsideAnyPicker = textColorPicker?.contains(e.target) || 
                                          highlightColorPicker?.contains(e.target) ||
                                          e.target.closest('.color-picker') ||
                                          e.target.closest('.color-section') ||
                                          e.target.closest('.color-option');
            
            if (clickedInsideAnyPicker || isClickingInsidePicker) {
                return; // Não fechar se clicou dentro
            }
            
            // Se não clicou dentro de nenhum picker nem no editor, fechar ambos
            if (textColorPicker?.classList.contains('show')) {
                textColorPicker.classList.remove('show');
            }
            if (highlightColorPicker?.classList.contains('show')) {
                highlightColorPicker.classList.remove('show');
            }
        }, 200); // Delay maior para garantir que eventos internos foram processados
    });
}

// Renderizar pastas (com suporte a hierarquia)
function renderFolders() {
    const folderTree = document.getElementById('folder-tree');
    if (!folderTree) return;
    
    // Remover só os grupos dinâmicos, preservar "Todas as Notas" (root)
    const toRemove = [];
    for (var i = 0; i < folderTree.children.length; i++) {
        var child = folderTree.children[i];
        if (child.classList && child.classList.contains('folder-group')) {
            toRemove.push(child);
        }
    }
    toRemove.forEach(function (el) { folderTree.removeChild(el); });
    
    // Separar pastas raiz e subpastas
    // Primeiro, garantir que pastas principais não sejam subpastas
    const mainFolders = ['Filipe da Silva', 'Mercado Livre'];
    Object.values(notebookData.folders).forEach(folder => {
        if (mainFolders.includes(folder.name) && folder.parent && folder.parent !== 'root' && folder.parent !== null) {
            folder.parent = null;
        }
    });
    
    const rootFolders = Object.values(notebookData.folders).filter(f => !f.parent || f.parent === 'root' || f.parent === null);
    const subfolders = Object.values(notebookData.folders).filter(f => f.parent && f.parent !== 'root' && f.parent !== null);
    
    // Ordenar pastas raiz por nome
    rootFolders.sort((a, b) => a.name.localeCompare(b.name));
    
    if (!notebookData.folderExpanded) notebookData.folderExpanded = {};
    
    // Renderizar pastas raiz e suas subpastas (cada grupo com seta para expandir/recolher)
    rootFolders.forEach(folder => {
        const hasSubfolders = subfolders.some(sf => sf.parent === folder.id);
        const isExpanded = hasSubfolders && (notebookData.folderExpanded[folder.id] !== false);
        
        const group = document.createElement('div');
        group.className = 'folder-group' + (hasSubfolders && !isExpanded ? ' collapsed' : '');
        group.dataset.folderId = folder.id;
        
        // Pasta principal (com seta se tiver subpastas)
        const folderItem = createFolderElement(folder, false, isExpanded);
        group.appendChild(folderItem);
        
        // Subpastas (visíveis só quando expandido) + notas sob a seta de cada uma
        const childFolders = subfolders.filter(sf => sf.parent === folder.id);
        if (childFolders.length > 0) {
            childFolders.sort((a, b) => a.name.localeCompare(b.name));
            childFolders.forEach(subfolder => {
                const subfolderNotes = getNotesInFolder(subfolder.id);
                const subfolderExpanded = subfolderNotes.length > 0 && (notebookData.folderExpanded[subfolder.id] !== false);
                const subfolderItem = createFolderElement(subfolder, true, subfolderExpanded);
                group.appendChild(subfolderItem);
                // Notas desta subpasta (sob a seta, visíveis quando expandido)
                if (subfolderNotes.length > 0) {
                    const notesContainer = document.createElement('div');
                    notesContainer.className = 'folder-notes-list' + (!subfolderExpanded ? ' collapsed' : '');
                    notesContainer.dataset.folderId = subfolder.id;
                    subfolderNotes.sort((a, b) => new Date(b.updated || b.created) - new Date(a.updated || a.created));
                    subfolderNotes.forEach(note => {
                        notesContainer.appendChild(createSidebarNoteRow(note));
                    });
                    group.appendChild(notesContainer);
                }
            });
        }
        
        folderTree.appendChild(group);
    });
    
    updateFolderCounts();
}

// Alternar expandir/recolher subpastas
function toggleFolderExpand(folderId) {
    if (!notebookData.folderExpanded) notebookData.folderExpanded = {};
    notebookData.folderExpanded[folderId] = !notebookData.folderExpanded[folderId];
    renderFolders();
}

// Contar notas numa pasta (não trashed)
function getNotesInFolder(folderId) {
    return Object.values(notebookData.notes).filter(n => !n.trashed && n.folder === folderId);
}

// Criar elemento de pasta (isSubfolder, isExpanded para pasta raiz com subpastas ou subpasta com notas)
function createFolderElement(folder, isSubfolder = false, isExpanded = true) {
    const div = document.createElement('div');
    div.className = 'folder-item';
    if (isSubfolder) {
        div.classList.add('subfolder-item');
    }
    div.dataset.folderId = folder.id;
    
    const hasSubfolders = Object.values(notebookData.folders).some(f => f.parent === folder.id);
    const subfolderCount = Object.values(notebookData.folders).filter(f => f.parent === folder.id).length;
    const notesInFolder = getNotesInFolder(folder.id);
    const hasNotes = notesInFolder.length > 0;
    
    const menuItems = isSubfolder 
        ? `<button class="folder-menu-item folder-menu-item-rename" onclick="event.stopPropagation(); typeof openRenameFolderModal==='function'&&openRenameFolderModal('${folder.id}')">
            <i class="fas fa-pen"></i>
            <span>Renomear</span>
          </button>
          <button class="folder-menu-item folder-menu-item-danger" onclick="event.stopPropagation(); deleteSubfolder('${folder.id}')">
            <i class="fas fa-trash"></i>
            <span>Excluir subpasta</span>
          </button>`
        : `<button class="folder-menu-item folder-menu-item-rename" onclick="event.stopPropagation(); typeof openRenameFolderModal==='function'&&openRenameFolderModal('${folder.id}')">
            <i class="fas fa-pen"></i>
            <span>Renomear</span>
          </button>
          <button class="folder-menu-item" onclick="event.stopPropagation(); createSubfolder('${folder.id}')">
            <i class="fas fa-folder-plus"></i>
            <span>Criar subpasta</span>
          </button>
          <button class="folder-menu-item folder-menu-item-danger" onclick="event.stopPropagation(); deleteFolder('${folder.id}')">
            <i class="fas fa-trash"></i>
            <span>Excluir pasta</span>
          </button>`;
    
    // Seta: pastas raiz com subpastas; subpastas com notas
    const showChevron = (!isSubfolder && hasSubfolders) || (isSubfolder && hasNotes);
    const chevronHtml = showChevron
        ? `<button type="button" class="folder-chevron" onclick="event.stopPropagation(); typeof toggleFolderExpand==='function'&&toggleFolderExpand('${folder.id}');" title="${isExpanded ? 'Recolher' : 'Expandir'}" aria-expanded="${isExpanded}">
            <i class="fas fa-chevron-${isExpanded ? 'down' : 'right'}"></i>
          </button>`
        : !isSubfolder ? '<span class="folder-chevron-placeholder"></span>' : (isSubfolder ? '<span class="folder-chevron-placeholder"></span>' : '');
    
    const notesBadge = !isSubfolder && hasSubfolders ? `<span class="subfolder-count-badge">${subfolderCount}</span>` : '';
    const notesCountBadge = isSubfolder && hasNotes ? `<span class="subfolder-count-badge">${notesInFolder.length}</span>` : '';
    
    div.innerHTML = `
        <div class="folder-content ${isSubfolder ? 'subfolder-content' : ''}" 
             onclick="selectFolder('${folder.id}', this)"
             onmouseenter="${!isSubfolder && hasSubfolders ? `showSubfoldersPreview('${folder.id}')` : ''}"
             onmouseleave="${!isSubfolder && hasSubfolders ? `hideSubfoldersPreview('${folder.id}')` : ''}">
            ${chevronHtml}
            <i class="fas fa-folder folder-icon" style="color: ${folder.color}"></i>
            <span class="folder-name">${escapeHtml(folder.name)}</span>
            ${notesBadge}
            ${notesCountBadge}
        </div>
        <div class="folder-menu-container">
            <button class="folder-menu-btn" onclick="event.stopPropagation(); toggleFolderMenu('${folder.id}')" title="${isSubfolder ? 'Opções da subpasta' : 'Opções da pasta'}">
                <i class="fas fa-ellipsis-v"></i>
            </button>
            <div class="folder-menu" id="folder-menu-${folder.id}" style="display: none;">
                ${menuItems}
            </div>
        </div>
        ${!isSubfolder && hasSubfolders ? `<div class="subfolders-preview" id="subfolders-preview-${folder.id}" style="display: none;"></div>` : ''}
    `;
    
    return div;
}

// Criar linha de nota na sidebar (sob a seta da subpasta)
function createSidebarNoteRow(note) {
    const div = document.createElement('div');
    div.className = 'sidebar-note-item' + (notebookData.currentNote === note.id ? ' active' : '');
    div.dataset.noteId = note.id;
    div.innerHTML = `
        <span class="sidebar-note-icon"><i class="fas fa-file-alt"></i></span>
        <span class="sidebar-note-title">${escapeHtml(note.title || 'Sem título')}</span>
    `;
    div.addEventListener('click', (e) => {
        e.stopPropagation();
        selectFolder(note.folder, null);
        openNote(note.id);
    });
    return div;
}

// Selecionar pasta
function selectFolder(folderId, clickedElement) {
    // Fechar editor se estiver aberto
    if (notebookData.currentNote) {
        closeEditor();
    }
    
    notebookData.currentFolder = folderId;
    
    // Atualizar UI - remover active de todas as pastas
    document.querySelectorAll('.folder-content').forEach(el => {
        el.classList.remove('active');
    });
    
    // Ativar a pasta clicada
    if (clickedElement) {
        clickedElement.classList.add('active');
    } else {
        // Fallback: encontrar o elemento da pasta
        const folderEl = document.querySelector(`[data-folder-id="${folderId}"] .folder-content`);
        if (folderEl) folderEl.classList.add('active');
    }
    
    // Atualizar nome da pasta
    const folderName = folderId === 'root' 
        ? 'Todas as Notas' 
        : notebookData.folders[folderId]?.name || 'Pasta';
    const folderNameEl = document.getElementById('current-folder-name');
    if (folderNameEl) {
        folderNameEl.textContent = folderName;
    }
    
    // Garantir que o editor está fechado
    const editorContainer = document.getElementById('note-editor-container');
    if (editorContainer) {
        editorContainer.style.display = 'none';
        editorContainer.classList.remove('active');
    }
    
    // Garantir que o espaço em branco está escondido
    const emptyState = document.getElementById('empty-editor-state');
    if (emptyState) {
        emptyState.style.display = 'none';
        emptyState.classList.remove('show');
    }
    
    // Garantir que a lista está visível
    const notesList = document.getElementById('notes-list-container');
    if (notesList) {
        notesList.style.display = 'block';
        notesList.style.visibility = 'visible';
        notesList.classList.remove('hidden');
    }
    
    // Renderizar notas
    renderNotes();
}

// Renderizar notas
function renderNotes() {
    const notesGrid = document.getElementById('notes-grid');
    if (!notesGrid) {
        console.error('❌ notes-grid não encontrado!');
        return;
    }
    
    const notesListContainer = document.getElementById('notes-list-container');
    if (notesListContainer && notebookData.currentFolder !== 'trash') {
        notesListContainer.classList.remove('view-trash');
    }
    
    notesGrid.innerHTML = '';
    
    // Filtrar notas (excluir apenas as que estão explicitamente trashed)
    let notes = Object.values(notebookData.notes).filter(n => !n.trashed);
    console.log(`📝 Total de notas: ${Object.keys(notebookData.notes).length}, Não trashed: ${notes.length}`);
    if (notebookData.currentFolder !== 'root') {
        notes = notes.filter(n => n.folder === notebookData.currentFolder);
    }
    
    // Ordenar: pins primeiro, depois por data de atualização
    notes.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.updated || b.created) - new Date(a.updated || a.created);
    });
    
    if (notes.length === 0) {
        notesGrid.innerHTML = `
            <div class="empty-state" id="empty-state">
                <div class="empty-icon">📝</div>
                <h3>Nenhuma nota nesta pasta</h3>
                <p>Crie uma nota quando quiser usando o botão <strong>Criar nota</strong> ao lado.</p>
            </div>
        `;
        
        // Se não houver nota aberta, mostrar painel direito com opção de criar nota (pasta fica vazia até o usuário criar)
        if (!notebookData.currentNote) {
            const emptyState = document.getElementById('empty-editor-state');
            const notesList = document.getElementById('notes-list-container');
            if (emptyState && notesList) {
                notesList.style.display = 'none';
                emptyState.style.display = 'flex';
                emptyState.classList.add('show');
            }
            updateEmptyEditorState(true); // pasta vazia
        }
        return;
    }
    
    // Se houver notas, esconder espaço em branco e mostrar lista
    const emptyState = document.getElementById('empty-editor-state');
    const notesList = document.getElementById('notes-list-container');
    const editorContainer = document.getElementById('note-editor-container');
    
    // Esconder editor se não houver nota aberta
    if (editorContainer && !notebookData.currentNote) {
        editorContainer.style.display = 'none';
        editorContainer.classList.remove('active');
    }
    
    // Esconder espaço em branco
    if (emptyState) {
        emptyState.style.display = 'none';
        emptyState.classList.remove('show');
    }
    
    // Mostrar lista de notas
    if (notesList) {
        notesList.style.display = 'block';
        notesList.style.visibility = 'visible';
        notesList.classList.remove('hidden');
    }
    
    // Aplicar modo de visualização
    if (notebookData.viewMode === 'list') {
        notesGrid.classList.add('list-view');
    } else {
        notesGrid.classList.remove('list-view');
    }
    
    // Usar DocumentFragment para melhor performance (renderiza tudo de uma vez)
    const fragment = document.createDocumentFragment();
    
    // Criar cards de notas e adicionar ao fragment
    notes.forEach(note => {
        const card = createNoteCard(note);
        fragment.appendChild(card);
    });
    
    // Adicionar todos os cards de uma vez ao DOM (muito mais rápido)
    notesGrid.appendChild(fragment);
    
    // Garantir que a lista de notas está visível se houver notas (usa notesListContainer já declarado no início da função)
    if (!notebookData.currentNote && notesListContainer) {
        if (notes.length > 0) {
            // Há notas - mostrar lista
            notesListContainer.style.display = 'block';
            notesListContainer.style.visibility = 'visible';
            notesListContainer.classList.remove('hidden');
            if (emptyState) {
                emptyState.style.display = 'none';
                emptyState.classList.remove('show');
            }
        } else {
            // Não há notas - mostrar estado vazio se editor não estiver aberto
            if (editorContainer && !editorContainer.classList.contains('active')) {
                if (emptyState) {
                    emptyState.style.display = 'flex';
                    emptyState.classList.add('show');
                }
                notesListContainer.style.display = 'none';
            }
        }
    }
    
    // Atualizar árvore de pastas (contagem e notas sob cada subpasta)
    renderFolders();
    
    console.log(`✅ ${notes.length} notas renderizadas na pasta "${notebookData.currentFolder === 'root' ? 'Todas as Notas' : notebookData.folders[notebookData.currentFolder]?.name || 'Pasta'}"`);
}

// Criar card de nota (versão expandida)
function createNoteCard(note) {
    const div = document.createElement('div');
    div.className = 'note-card';
    div.dataset.noteId = note.id;
    if (notebookData.currentNote === note.id) {
        div.classList.add('active');
    }
    if (note.pinned) {
        div.classList.add('pinned');
    }
    
    const preview = note.content 
        ? note.content.replace(/<[^>]*>/g, '').substring(0, 150)
        : 'Sem conteúdo...';
    
    const date = new Date(note.updated || note.created);
    const dateStr = formatDate(date);
    
    // Extrair primeira imagem para preview
    const images = extractImagesFromNote(note);
    const imagePreview = images.length > 0 
        ? `<img src="${images[0]}" class="note-card-image-preview" alt="Preview" onerror="this.style.display='none'">`
        : '';
    
    // Tags
    const tags = (note.tags || []).map(tag => 
        `<span class="note-card-tag" style="background: ${tag.color}20; color: ${tag.color}; border-color: ${tag.color};">
            ${escapeHtml(tag.name)}
        </span>`
    ).join('');
    const tagsHtml = tags ? `<div class="note-card-tags">${tags}</div>` : '';
    
    // Indicador de pin
    const pinIcon = note.pinned ? '<i class="fas fa-thumbtack pinned-icon"></i>' : '';
    
    div.innerHTML = `
        <div class="note-card-header">
            ${pinIcon}
            <h4 class="note-card-title">${escapeHtml(note.title || 'Sem título')}</h4>
            <div class="note-card-actions">
                <i class="fas fa-star note-card-star ${note.starred ? 'active' : ''}" 
                   onclick="event.stopPropagation(); toggleNoteStar('${note.id}')" 
                   title="${note.starred ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"></i>
                <i class="fas fa-thumbtack note-card-pin ${note.pinned ? 'active' : ''}" 
                   onclick="event.stopPropagation(); toggleNotePin('${note.id}')" 
                   title="${note.pinned ? 'Desfixar nota' : 'Fixar nota'}"></i>
                <i class="fas fa-trash note-card-delete" 
                   onclick="event.stopPropagation(); deleteNote('${note.id}')" 
                   title="Excluir nota"></i>
            </div>
        </div>
        ${imagePreview}
        ${tagsHtml}
        <p class="note-card-preview">${escapeHtml(preview)}</p>
        <div class="note-card-footer">
            <span class="note-card-date">
                <i class="fas fa-clock"></i>
                ${dateStr}
            </span>
        </div>
    `;
    
    div.addEventListener('click', () => openNote(note.id));
    
    return div;
}

// Evitar duplicar nota por duplo clique
let _createNewNoteLock = false;

// Criar nova nota
function createNewNote() {
    if (_createNewNoteLock) return;
    _createNewNoteLock = true;
    setTimeout(function () { _createNewNoteLock = false; }, 800);

    const noteId = 'note-' + Date.now();
    const note = {
        id: noteId,
        title: 'Nova Nota',
        content: '',
        folder: notebookData.currentFolder,
        starred: false,
        pinned: false,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    };

    notebookData.notes[noteId] = note;
    saveData();
    renderNotes();
    
    // Esconder espaço em branco
    const emptyState = document.getElementById('empty-editor-state');
    if (emptyState) {
        emptyState.style.display = 'none';
        emptyState.classList.remove('show');
    }
    
    // Esconder lista de notas
    const notesList = document.getElementById('notes-list-container');
    if (notesList) {
        notesList.style.display = 'none';
    }
    
    openNote(noteId);
}

// Abrir nota
function openNote(noteId) {
    const note = notebookData.notes[noteId];
    if (!note) return;
    
    notebookData.currentNote = noteId;
    
    // Mostrar editor; menu de opções abre na área ao lado das pastas ao clicar no hambúrguer
    const editorContainer = document.getElementById('note-editor-container');
    const notesList = document.getElementById('notes-list-container');
    const emptyState = document.getElementById('empty-editor-state');
    
    // Garantir que o editor seja exibido - remover style inline e usar classe
    if (editorContainer) {
        editorContainer.style.display = ''; // Remover style inline
        editorContainer.classList.add('active'); // Adicionar classe que força display: flex !important
        editorContainer.style.setProperty('display', 'flex', 'important'); // Forçar via JavaScript
    }
    
    if (emptyState) {
        emptyState.style.display = 'none';
        emptyState.classList.remove('show');
    }
    
    if (notesList) {
        notesList.style.display = 'none';
        notesList.classList.add('hidden');
    }
    var main = document.querySelector('.notebook-main');
    if (main) main.classList.add('editor-open');

    // Preencher dados
    const titleInput = document.getElementById('note-title');
    const richEditor = document.getElementById('rich-editor');
    
    if (titleInput) {
        titleInput.value = note.title || '';
        titleInput.disabled = false;
    }
    
    if (richEditor) {
        var content = note.content && note.content.trim();
        var isEmpty = !content || content === '<p></p>' || content === '<p><br></p>' || content === '<p>Comece a escrever...</p>';
        richEditor.innerHTML = isEmpty ? (typeof EMPTY_EDITOR_HTML !== 'undefined' ? EMPTY_EDITOR_HTML : '<p><br></p>') : note.content;
        richEditor.contentEditable = 'true';
        updatePlaceholderVisibility();
    }
    
    const toolbar = document.getElementById('editor-format-toolbar');
    if (toolbar && richEditor) {
        toolbar.style.display = isEditorEmpty(richEditor) ? 'none' : 'block';
    }
    
    // Atualizar favorito
    const starBtn = document.getElementById('btn-star-note');
    if (starBtn) {
        starBtn.querySelector('i').className = note.starred ? 'fas fa-star' : 'far fa-star';
    }
    
    // Focar no editor após um pequeno delay para garantir que está visível
    setTimeout(() => {
        if (richEditor) {
            richEditor.focus();
            // Mover cursor para o início
            try {
                const range = document.createRange();
                const sel = window.getSelection();
                if (richEditor.childNodes.length > 0) {
                    range.setStart(richEditor.childNodes[0], 0);
                } else {
                    range.setStart(richEditor, 0);
                }
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            } catch (e) {
                console.log('Erro ao posicionar cursor:', e);
            }
        }
    }, 200);
    
    updateWordCount();
    
    // Renderizar tags e outras funcionalidades
    renderNoteTags(noteId);
    updateReadingProgress();
    renderProperties(noteId);
    
    // Carregar comentários se houver
    if (notebookData.comments[noteId]) {
        renderComments(noteId);
    }
    
    // Atualizar botão de pin
    const pinBtn = document.getElementById('btn-pin-note');
    if (pinBtn && note) {
        pinBtn.querySelector('i').className = note.pinned ? 'fas fa-thumbtack' : 'far fa-thumbtack';
    }
    
    // Salvar versão ao abrir (para histórico)
    saveVersion(noteId);
}

// Fechar editor
function closeEditor() {
    if (notebookData.currentNote) {
        saveCurrentNote();
    }
    
    notebookData.currentNote = null;
    
    // Esconder toolbar Google Docs e painel de opções (menu ao lado das pastas)
    hideGoogleDocsToolbar();
    closeEditorOptionsPanel();
    
    const editorContainer = document.getElementById('note-editor-container');
    const notesList = document.getElementById('notes-list-container');
    const emptyState = document.getElementById('empty-editor-state');
    
    if (editorContainer) {
        editorContainer.style.display = 'none';
        editorContainer.classList.remove('active');
    }
    if (notesList) {
        notesList.style.display = 'flex';
        notesList.classList.remove('hidden');
    }
    var main = document.querySelector('.notebook-main');
    if (main) main.classList.remove('editor-open');
    // Estilo Apple: sempre mostrar estado vazio no painel direito ao fechar a nota (nunca criar nota automaticamente)
    if (emptyState) {
        emptyState.style.display = 'flex';
        emptyState.classList.add('show');
        const notesInFolder = notebookData.currentFolder === 'root'
            ? Object.values(notebookData.notes).filter(n => !n.trashed && (!n.folder || n.folder === 'root'))
            : Object.values(notebookData.notes).filter(n => !n.trashed && n.folder === notebookData.currentFolder);
        updateEmptyEditorState(notesInFolder.length === 0);
    }
    if (notesList && !Object.values(notebookData.notes).some(n => !n.trashed)) notesList.style.display = 'none';

    // Esconder toolbar de formatação (se existir)
    const formatToolbar = document.getElementById('editor-format-toolbar');
    if (formatToolbar) formatToolbar.style.display = 'none';
    
    notebookData.currentNote = null;
    renderNotes();
}

// Atualizar texto e ícone do painel vazio (pasta vazia vs. nenhuma nota selecionada)
function updateEmptyEditorState(isFolderEmpty) {
    const titleEl = document.getElementById('empty-editor-title');
    const subtitleEl = document.getElementById('empty-editor-subtitle');
    const iconEl = document.getElementById('empty-editor-icon');
    if (!titleEl || !subtitleEl) return;
    if (isFolderEmpty) {
        titleEl.textContent = 'Esta pasta está vazia';
        if (subtitleEl) subtitleEl.textContent = 'Crie uma nota quando quiser. A pasta permanece vazia até você criar.';
        if (iconEl) iconEl.textContent = '📁';
    } else {
        titleEl.textContent = 'Selecione uma nota para começar';
        if (subtitleEl) subtitleEl.textContent = 'Ou crie uma nova nota usando o botão abaixo';
        if (iconEl) iconEl.textContent = '✍️';
    }
}

// Salvar nota atual
function saveCurrentNote() {
    if (!notebookData.currentNote) return;
    
    const note = notebookData.notes[notebookData.currentNote];
    if (!note) return;
    
    var editor = document.getElementById('rich-editor');
    note.title = document.getElementById('note-title').value || 'Sem título';
    note.content = (editor && isEditorEmpty(editor)) ? '' : (editor ? editor.innerHTML : '');
    note.updated = new Date().toISOString();
    
    saveData();
    renderNotes();
    updateSaveStatus('Salvo');
}

// Aplicar formatação
function applyFormat(format) {
    const editor = document.getElementById('rich-editor');
    if (!editor) return;
    
    editor.focus();
    
    // Tratar alinhamentos
    if (format === 'alignLeft') {
        document.execCommand('justifyLeft', false, null);
    } else if (format === 'alignCenter') {
        document.execCommand('justifyCenter', false, null);
    } else if (format === 'alignRight') {
        document.execCommand('justifyRight', false, null);
    } else {
        document.execCommand(format, false, null);
    }
    
    // Atualizar botões ativos
    updateFormatButtons();
    // Salvar automaticamente após formatação
    saveCurrentNote();
}

// Placeholder "Comece a escrever...": visível só quando o editor está vazio
var EMPTY_EDITOR_HTML = '<p><br></p>';
function isEditorEmpty(editor) {
    if (!editor) return true;
    var html = editor.innerHTML.trim();
    if (!html) return true;
    if (html === '<p></p>' || html === '<p><br></p>' || html === '<p><br/></p>') return true;
    if (html === '<p>Comece a escrever...</p>') return true;
    return false;
}
function updatePlaceholderVisibility() {
    var editor = document.getElementById('rich-editor');
    var placeholder = document.getElementById('rich-editor-placeholder');
    if (!editor || !placeholder) return;
    var empty = isEditorEmpty(editor);
    placeholder.setAttribute('aria-hidden', empty ? 'false' : 'true');
}

// Helper para escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Aplicar cor do texto
function applyTextColor(color) {
    const editor = document.getElementById('rich-editor');
    if (!editor) return;
    
    editor.focus();
    
    // Verificar se há texto selecionado
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && selection.toString().trim() !== '') {
        // Aplicar cor no texto selecionado
        document.execCommand('foreColor', false, color);
    } else {
        // Se não houver seleção, aplicar cor para o próximo texto digitado
        document.execCommand('foreColor', false, color);
    }
    
    // Salvar automaticamente
    saveCurrentNote();
}

// Aplicar realce (marca texto)
function applyHighlight(color) {
    const editor = document.getElementById('rich-editor');
    if (!editor) return;
    
    editor.focus();
    
    // Verificar se há texto selecionado
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && selection.toString().trim() !== '') {
        // Aplicar cor de fundo (marca texto) no texto selecionado
        try {
            const range = selection.getRangeAt(0);
            const selectedText = selection.toString();
            
            if (selectedText) {
                // Tentar usar execCommand primeiro (mais compatível)
                const success = document.execCommand('backColor', false, color);
                
                if (!success) {
                    // Se execCommand falhar, usar abordagem manual
                    const span = document.createElement('span');
                    span.style.backgroundColor = color;
                    span.style.color = 'inherit';
                    span.style.display = 'inline';
                    
                    try {
                        // Tentar usar surroundContents primeiro
                        range.surroundContents(span);
                    } catch (e) {
                        // Se surroundContents falhar, usar outra abordagem
                        const contents = range.extractContents();
                        span.appendChild(contents);
                        range.insertNode(span);
                    }
                    
                    // Atualizar seleção
                    const newRange = document.createRange();
                    newRange.selectNodeContents(span);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                }
                
                // Salvar automaticamente
                saveCurrentNote();
            }
        } catch (e) {
            console.error('Erro ao aplicar highlight:', e);
            // Fallback: usar backColor diretamente
            document.execCommand('backColor', false, color);
            saveCurrentNote();
        }
    } else {
        // Se não há seleção, aplicar ao próximo texto digitado
        document.execCommand('backColor', false, color);
    }
}

// Atualizar indicador visual de cor selecionada
function updateColorSelection(type, color) {
    const picker = type === 'text' 
        ? document.getElementById('text-color-picker')
        : document.getElementById('highlight-color-picker');
    
    if (picker) {
        picker.querySelectorAll('.color-option').forEach(opt => {
            if (opt.dataset.color === color) {
                opt.classList.add('selected');
            } else {
                opt.classList.remove('selected');
            }
        });
    }
}

// Toggle da toolbar de formatação (menu hambúrguer)
function toggleFormatToolbar() {
    const toolbar = document.getElementById('format-toolbar');
    const btn = document.getElementById('toolbar-hamburger-btn');
    
    if (toolbar && btn) {
        toolbar.classList.toggle('expanded');
        btn.classList.toggle('active');
    }
}

// Cores para o painel de opções (cor do texto e marca-texto)
var EDITOR_TEXT_COLORS = ['#000000', '#434343', '#666666', '#FFFFFF', '#FF0000', '#E74C3C', '#C0392B', '#FF9900', '#F39C12', '#D35400', '#FFFF00', '#F1C40F', '#F7DC6F', '#00FF00', '#27AE60', '#2ECC71', '#1ABC9C', '#4A86E8', '#3498DB', '#2980B9', '#9B59B6', '#8E44AD', '#9900FF', '#FF00FF', '#E91E63', '#EA9999', '#D5A6BD', '#F4CCCC', '#FADBD8', '#FDEBD0'];
var EDITOR_HIGHLIGHT_COLORS = ['#FFFF00', '#FFD966', '#FFF2CC', '#F9CB9C', '#F7DC6F', '#F1C40F', '#FF9900', '#F5B041', '#FADBD8', '#E06666', '#EC7063', '#00FF00', '#93C47D', '#B6D7A8', '#D9EAD3', '#ABEBC6', '#6D9EEB', '#4A86E8', '#A4C2F4', '#CFE2F3', '#AED6F1', '#9900FF', '#BB8FCE', '#D7BDE2', '#EA9999', '#F4CCCC', '#FADBD8', '#FDEBD0', '#FCF3CF', '#FEF9E7'];

function showEditorOptionsColors(mode) {
    var panel = document.getElementById('editor-options-colors');
    var tabs = document.querySelectorAll('.editor-options-color-tab');
    if (!panel) return;
    panel.style.display = 'block';
    tabs.forEach(function (t) { t.classList.toggle('active', t.getAttribute('data-mode') === mode); });
    fillEditorOptionsColorsGrid(mode);
}

function fillEditorOptionsColorsGrid(mode) {
    var grid = document.getElementById('editor-options-colors-grid');
    if (!grid) return;
    var colors = mode === 'highlight' ? EDITOR_HIGHLIGHT_COLORS : EDITOR_TEXT_COLORS;
    grid.innerHTML = '';
    colors.forEach(function (hex) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'editor-options-color-swatch';
        btn.setAttribute('data-color', hex);
        btn.style.background = hex;
        if (hex === '#FFFFFF' || hex === '#FFF2CC') btn.style.border = '1px solid #ddd';
        grid.appendChild(btn);
    });
}

function applyEditorOptionColor(color, mode) {
    var editor = document.getElementById('rich-editor');
    if (!editor) return;
    editor.focus();
    if (mode === 'highlight') {
        document.execCommand('hiliteColor', false, color);
    } else {
        document.execCommand('foreColor', false, color);
    }
    saveCurrentNote();
}

// Inserir imagem: abre modal de upload (vidro, bonito)
function insertImage() {
    resetInsertImageModal();
    showModal('modal-insert-image');
}

var _insertImageDataUrl = null;
var _insertImageFile = null;

function onInsertImageFileSelected(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    _insertImageFile = file;
    var reader = new FileReader();
    reader.onload = function (ev) {
        _insertImageDataUrl = ev.target.result;
        var preview = document.getElementById('insert-image-preview');
        var previewImg = document.getElementById('insert-image-preview-img');
        var filenameEl = document.getElementById('insert-image-filename');
        var zone = document.getElementById('insert-image-zone');
        var btn = document.getElementById('btn-insert-image-confirm');
        if (preview && previewImg && filenameEl) {
            zone.style.display = 'none';
            preview.style.display = 'block';
            previewImg.src = _insertImageDataUrl;
            filenameEl.textContent = file.name;
        }
        if (btn) btn.disabled = false;
    };
    reader.readAsDataURL(file);
}

function wrapImageWithLayout(img, layout) {
    layout = layout || 'block';
    var wrapper = null;
    if (layout === 'caption') {
        var figure = document.createElement('figure');
        figure.className = 'img-wrap img-wrap-caption';
        figure.setAttribute('data-image-layout', 'caption');
        var figcap = document.createElement('figcaption');
        figcap.contentEditable = 'true';
        figcap.className = 'img-figcaption';
        figcap.textContent = 'Digite a legenda aqui...';
        figure.appendChild(img);
        figure.appendChild(figcap);
        wrapper = figure;
    } else {
        var div = document.createElement('div');
        div.className = 'img-wrap img-wrap-' + layout;
        div.setAttribute('data-image-layout', layout);
        div.appendChild(img);
        wrapper = div;
    }
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.borderRadius = '12px';
    img.setAttribute('alt', 'Imagem da nota');
    if (layout === 'block') {
        img.style.margin = '16px 0';
    } else {
        img.style.margin = '0';
    }
    return wrapper;
}

function applyImageLayoutToElement(wrapOrImg, layout) {
    var img = wrapOrImg.tagName === 'IMG' ? wrapOrImg : wrapOrImg.querySelector('img');
    if (!img) return null;
    var parent = wrapOrImg.parentNode;
    var ref = wrapOrImg.nextSibling;
    var newWrap = wrapImageWithLayout(img, layout);
    if (wrapOrImg.tagName === 'FIGURE') {
        var cap = wrapOrImg.querySelector('figcaption');
        if (cap && layout === 'caption') {
            var newCap = newWrap.querySelector('figcaption');
            if (newCap && cap.textContent && cap.textContent.trim() !== 'Digite a legenda aqui...') newCap.textContent = cap.textContent;
        }
    }
    if (wrapOrImg.tagName === 'IMG') {
        if (ref) parent.insertBefore(newWrap, ref);
        else parent.appendChild(newWrap);
    } else {
        parent.replaceChild(newWrap, wrapOrImg);
    }
    return newWrap;
}

function confirmInsertImage() {
    if (!_insertImageDataUrl) return;
    var editor = document.getElementById('rich-editor');
    if (!editor) return;
    var posSelect = document.getElementById('insert-image-pos');
    var layout = (posSelect && posSelect.value) ? posSelect.value : 'block';
    var sel = window.getSelection();
    var rangeInEditor = sel.rangeCount > 0 && editor.contains(sel.getRangeAt(0).commonAncestorContainer);
    if (!rangeInEditor) setEditorCaretToEnd(editor);
    var img = document.createElement('img');
    img.src = _insertImageDataUrl;
    var wrapper = wrapImageWithLayout(img, layout);
    try {
        sel = window.getSelection();
        if (sel.rangeCount > 0) {
            var range = sel.getRangeAt(0);
            if (editor.contains(range.commonAncestorContainer)) {
                range.insertNode(wrapper);
                range.collapse(false);
                range.setStartAfter(wrapper);
                range.setEndAfter(wrapper);
                sel.removeAllRanges();
                sel.addRange(range);
            } else {
                editor.appendChild(wrapper);
            }
        } else {
            editor.appendChild(wrapper);
        }
    } catch (e) {
        editor.appendChild(wrapper);
    }
    editor.focus();
    updateWordCount();
    saveCurrentNote();
    closeModal('modal-insert-image');
    resetInsertImageModal();
}

function resetInsertImageModal() {
    _insertImageDataUrl = null;
    _insertImageFile = null;
    var fileInput = document.getElementById('insert-image-file');
    if (fileInput) fileInput.value = '';
    var zone = document.getElementById('insert-image-zone');
    var preview = document.getElementById('insert-image-preview');
    var previewImg = document.getElementById('insert-image-preview-img');
    var filenameEl = document.getElementById('insert-image-filename');
    var btn = document.getElementById('btn-insert-image-confirm');
    var posSelect = document.getElementById('insert-image-pos');
    if (zone) zone.style.display = '';
    if (preview) preview.style.display = 'none';
    if (previewImg) previewImg.src = '';
    if (filenameEl) filenameEl.textContent = '';
    if (btn) btn.disabled = true;
    if (posSelect) posSelect.value = 'block';
}

// Colocar cursor no final do editor (útil após abrir modal e perder a seleção)
function setEditorCaretToEnd(editor) {
    if (!editor) return;
    editor.focus();
    try {
        var sel = window.getSelection();
        var range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
    } catch (e) { console.warn('setEditorCaretToEnd:', e); }
}

var _selectedImageWrap = null;

function initImageLayoutToolbar(editor) {
    var toolbar = document.getElementById('image-layout-toolbar');
    if (!toolbar || !editor) return;
    var editorContent = document.getElementById('editor-content-wrapper');

    function getWrapOrImgFromTarget(target) {
        if (!target || !editor.contains(target)) return null;
        if (target.tagName === 'IMG') return target.closest('.img-wrap') || target;
        if (target.closest('.img-wrap')) return target.closest('.img-wrap');
        return null;
    }

    function clearSelectionHighlight() {
        if (_selectedImageWrap) {
            _selectedImageWrap.classList.remove('selected-image-wrap');
            if (_selectedImageWrap.tagName === 'IMG') _selectedImageWrap.classList.remove('selected-image-img');
            _selectedImageWrap = null;
        }
    }

    function showImageToolbar(el) {
        clearSelectionHighlight();
        _selectedImageWrap = el;
        if (el.classList) {
            if (el.classList.contains('img-wrap')) el.classList.add('selected-image-wrap');
            else if (el.tagName === 'IMG') el.classList.add('selected-image-img');
        }
        var rect = el.getBoundingClientRect();
        toolbar.classList.add('visible');
        toolbar.setAttribute('aria-hidden', 'false');
        toolbar.style.position = 'fixed';
        toolbar.style.left = Math.max(8, rect.left + (rect.width / 2) - (toolbar.offsetWidth / 2)) + 'px';
        toolbar.style.top = (rect.top - toolbar.offsetHeight - 10) + 'px';
        var currentLayout = (el.getAttribute && el.getAttribute('data-image-layout')) || (el.closest && el.closest('.img-wrap') && el.closest('.img-wrap').getAttribute('data-image-layout')) || 'block';
        toolbar.querySelectorAll('.img-layout-btn').forEach(function(btn) {
            btn.classList.toggle('active', btn.dataset.layout === currentLayout);
        });
    }

    function hideImageToolbar() {
        clearSelectionHighlight();
        toolbar.classList.remove('visible');
        toolbar.setAttribute('aria-hidden', 'true');
    }

    editor.addEventListener('click', function(e) {
        var el = getWrapOrImgFromTarget(e.target);
        if (el) {
            e.preventDefault();
            showImageToolbar(el);
        }
    });

    document.addEventListener('selectionchange', function() {
        var sel = window.getSelection();
        if (sel.rangeCount === 0) return;
        var node = sel.anchorNode;
        var el = node && (node.nodeType === 1 ? node : node.parentElement);
        var wrap = el && getWrapOrImgFromTarget(el);
        if (!wrap) hideImageToolbar();
    });

    document.addEventListener('click', function(e) {
        if (toolbar.contains(e.target)) return;
        var wrap = getWrapOrImgFromTarget(e.target);
        if (!wrap) hideImageToolbar();
    });

    toolbar.querySelectorAll('.img-layout-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            if (!_selectedImageWrap) return;
            var layout = this.dataset.layout;
            var newWrap = applyImageLayoutToElement(_selectedImageWrap, layout);
            toolbar.querySelectorAll('.img-layout-btn').forEach(function(b) { b.classList.toggle('active', b.dataset.layout === layout); });
            _selectedImageWrap = newWrap;
            newWrap.classList.add('selected-image-wrap');
            saveCurrentNote();
            updateWordCount();
        });
    });
}

// Inserir link: abre modal (vidro Apple, bonito e inteligente)
function insertLink() {
    document.getElementById('insert-link-url').value = '';
    document.getElementById('insert-link-text').value = '';
    showModal('modal-insert-link');
}

function confirmInsertLink() {
    var urlInput = document.getElementById('insert-link-url');
    var textInput = document.getElementById('insert-link-text');
    var url = urlInput && urlInput.value.trim();
    if (!url) return;
    var editor = document.getElementById('rich-editor');
    if (!editor) return;
    var text = textInput && textInput.value.trim();
    var sel = window.getSelection();
    var rangeInEditor = sel.rangeCount > 0 && editor.contains(sel.getRangeAt(0).commonAncestorContainer);
    if (!rangeInEditor) setEditorCaretToEnd(editor);
    var htmlToInsert = '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener">' + (text ? escapeHtml(text) : escapeHtml(url)) + '</a>';
    document.execCommand('insertHTML', false, htmlToInsert);
    saveCurrentNote();
    closeModal('modal-insert-link');
}

// Inserir tabela
function insertTable() {
    const rows = parseInt(prompt('Número de linhas:', '3')) || 3;
    const cols = parseInt(prompt('Número de colunas:', '3')) || 3;
    
    const editor = document.getElementById('rich-editor');
    const table = document.createElement('table');
    
    for (let i = 0; i < rows; i++) {
        const tr = document.createElement('tr');
        for (let j = 0; j < cols; j++) {
            const td = document.createElement('td');
            td.innerHTML = '&nbsp;';
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.insertNode(table);
    } else {
        editor.appendChild(table);
    }
    
    editor.focus();
    saveCurrentNote();
}

// Toggle favorito
function toggleStar() {
    if (!notebookData.currentNote) return;
    
    const note = notebookData.notes[notebookData.currentNote];
    if (!note) return;
    
    note.starred = !note.starred;
    saveData();
    
    const starBtn = document.getElementById('btn-star-note');
    if (starBtn) {
        starBtn.querySelector('i').className = note.starred ? 'fas fa-star' : 'far fa-star';
    }
    
    renderNotes();
}

function toggleNoteStar(noteId) {
    const note = notebookData.notes[noteId];
    if (!note) return;
    
    note.starred = !note.starred;
    saveData();
    renderNotes();
}

// Exportar nota
function exportNote() {
    if (!notebookData.currentNote) return;
    
    const note = notebookData.notes[notebookData.currentNote];
    if (!note) return;
    
    const html = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(note.title)}</title>
    <style>
        body {
            font-family: 'Inter', sans-serif;
            max-width: 900px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.8;
        }
        h1 { color: #1d1d1f; }
    </style>
</head>
<body>
    <h1>${escapeHtml(note.title)}</h1>
    ${note.content}
</body>
</html>
    `;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title || 'nota'}.html`;
    a.click();
    URL.revokeObjectURL(url);
}

// Selecionar cor da pasta no modal Nova Pasta (todas as cores clicáveis)
function selectFolderColor(el) {
    if (!el || !el.classList || !el.classList.contains('folder-color-option')) return;
    document.querySelectorAll('.folder-color-option').forEach(function (opt) {
        opt.classList.remove('active');
    });
    el.classList.add('active');
}
window.selectFolderColor = selectFolderColor;

// Criar pasta
function createFolder() {
    const name = document.getElementById('new-folder-name').value.trim();
    if (!name) {
        alert('Digite um nome para a pasta');
        return;
    }

    const colorOption = document.querySelector('.folder-color-option.active');
    const color = colorOption ? colorOption.dataset.color : '#007AFF';
    
    const folderId = 'folder-' + Date.now();
    const folder = {
        id: folderId,
        name: name,
        color: color,
        parent: notebookData.currentFolder === 'root' ? null : notebookData.currentFolder,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    };
    
    notebookData.folders[folderId] = folder;
    saveData();
    renderFolders();
    closeModal('modal-new-folder');
    
    // Limpar formulário
    document.getElementById('new-folder-name').value = '';
    document.querySelectorAll('.folder-color-option').forEach(opt => {
        opt.classList.remove('active');
    });
    document.querySelector('.folder-color-option')?.classList.add('active');
}

// Buscar notas
function searchNotes(query) {
    if (!query.trim()) {
        renderNotes();
        return;
    }
    
    const notesGrid = document.getElementById('notes-grid');
    if (!notesGrid) return;
    
    const results = Object.values(notebookData.notes).filter(note => {
        const searchText = (note.title + ' ' + note.content.replace(/<[^>]*>/g, '')).toLowerCase();
        return searchText.includes(query.toLowerCase());
    });
    
    notesGrid.innerHTML = '';
    
    if (results.length === 0) {
        notesGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>Nenhum resultado encontrado</h3>
            </div>
        `;
        return;
    }
    
    results.forEach(note => {
        const card = createNoteCard(note);
        notesGrid.appendChild(card);
    });
}

// Definir modo de visualização
function setViewMode(mode) {
    notebookData.viewMode = mode;
    saveData();
    
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === mode);
    });
    
    renderNotes();
}

// Atualizar contagem de palavras, caracteres, imagens e tempo de leitura
function updateWordCount() {
    const footer = document.querySelector('.editor-footer');
    if (footer) {
        footer.querySelectorAll('.word-count').forEach(el => { if (!el.id) el.remove(); });
    }
    const editor = document.getElementById('rich-editor');
    if (!editor) return;
    
    const text = editor.innerText || editor.textContent || '';
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const chars = text.length;
    const images = editor.querySelectorAll('img').length;
    
    if (typeof notebookData !== 'undefined' && notebookData.statistics) {
        notebookData.statistics.totalWords = words.length;
    }
    
    const wordEl = document.getElementById('word-count');
    const charEl = document.getElementById('char-count');
    const imageEl = document.getElementById('image-count');
    const readingEl = document.getElementById('reading-time');
    if (wordEl) wordEl.textContent = `${words.length} PALAVRAS`;
    if (charEl) charEl.textContent = `${chars} CARACTERES`;
    if (imageEl) imageEl.textContent = `${images} IMAGENS`;
    
    // Tempo de leitura: ~200 palavras/min → segundos = (palavras/200)*60
    const readingSeconds = Math.ceil((words.length / 200) * 60);
    let readingLabel = '0 MIN DE LEITURA';
    if (readingSeconds > 0) {
        if (readingSeconds < 60) {
            readingLabel = `${readingSeconds} SEG DE LEITURA`;
        } else if (readingSeconds < 3600) {
            const min = Math.ceil(readingSeconds / 60);
            readingLabel = `${min} MIN DE LEITURA`;
        } else {
            const h = (readingSeconds / 3600).toFixed(1).replace('.', ',');
            readingLabel = `${h} H DE LEITURA`;
        }
    }
    if (readingEl) readingEl.textContent = readingLabel;
}

// Atualizar status de salvamento
function updateSaveStatus(status) {
    const statusEl = document.getElementById('save-status');
    if (statusEl) {
        statusEl.textContent = status;
        if (status === 'Salvo') {
            statusEl.style.color = 'var(--apple-success)';
            setTimeout(() => {
                statusEl.textContent = '';
            }, 2000);
        } else {
            statusEl.style.color = 'var(--apple-danger)';
        }
    }
}

// Atualizar botões de formatação
function updateFormatButtons() {
    document.querySelectorAll('.format-btn').forEach(btn => {
        const format = btn.dataset.format;
        if (!format) return;
        
        // Verificar estados de alinhamento
        if (format === 'alignLeft') {
            if (document.queryCommandState('justifyLeft')) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        } else if (format === 'alignCenter') {
            if (document.queryCommandState('justifyCenter')) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        } else if (format === 'alignRight') {
            if (document.queryCommandState('justifyRight')) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        } else if (document.queryCommandState(format)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Atualizar contagens de pastas (mantida para compatibilidade, mas não mais usada na UI)
function updateFolderCounts() {
    // Função mantida para compatibilidade, mas contagem não é mais exibida
    // A contagem foi substituída pelo menu de três pontos
}

// Toggle menu de pasta
function toggleFolderMenu(folderId) {
    // Fechar todos os outros menus
    document.querySelectorAll('.folder-menu').forEach(menu => {
        if (menu.id !== `folder-menu-${folderId}`) {
            menu.style.display = 'none';
        }
    });
    
    // Toggle do menu atual
    const menu = document.getElementById(`folder-menu-${folderId}`);
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

// Criar subpasta
function createSubfolder(parentFolderId) {
    const parentFolder = notebookData.folders[parentFolderId];
    if (!parentFolder) {
        showToast('Pasta pai não encontrada', 'error');
        return;
    }
    
    // Fechar menu primeiro
    const menu = document.getElementById(`folder-menu-${parentFolderId}`);
    if (menu) {
        menu.style.display = 'none';
    }
    
    // Preencher modal de subpasta
    document.getElementById('subfolder-parent-name').textContent = parentFolder.name;
    document.getElementById('new-subfolder-name').value = '';
    document.getElementById('new-subfolder-name').focus();
    
    // Configurar botão de criar
    const createBtn = document.getElementById('create-subfolder-btn');
    if (createBtn) {
        createBtn.onclick = function() {
            const subfolderName = document.getElementById('new-subfolder-name').value.trim();
            if (!subfolderName) {
                showToast('Digite um nome para a subpasta', 'warning');
                return;
            }
            
            createSubfolderAction(parentFolderId, subfolderName);
        };
    }
    
    // Mostrar modal
    showModal('modal-new-subfolder');
}

function createSubfolderAction(parentFolderId, subfolderName) {
    const parentFolder = notebookData.folders[parentFolderId];
    if (!parentFolder) return;
    
    // Usar cor da pasta pai ou cor padrão
    const color = parentFolder.color || '#007AFF';
    
    const subfolderId = 'folder-' + Date.now();
    const subfolder = {
        id: subfolderId,
        name: subfolderName.trim(),
        color: color,
        parent: parentFolderId,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    };
    
    notebookData.folders[subfolderId] = subfolder;
    saveData();
    renderFolders();
    closeModal('modal-new-subfolder');
    
    showToast(`Subpasta "${subfolderName.trim()}" criada com sucesso!`, 'success');
}

// Excluir nota (mover para lixeira)
function deleteNote(noteId) {
    const note = notebookData.notes[noteId];
    if (!note) return;
    
    // Salvar pasta original para poder restaurar depois
    if (!note.originalFolder) {
        note.originalFolder = note.folder || 'root';
    }
    
    // Marcar como excluída (mover para lixeira)
    note.trashed = true;
    note.trashedAt = new Date().toISOString();
    
    // Remover propriedades antigas se existirem
    delete note.deleted;
    delete note.deletedAt;
    
    // Se estava aberta, fechar
    if (notebookData.currentNote === noteId) {
        closeEditor();
    }
    
    saveData();
    renderNotes();
    showToast('Nota movida para a lixeira', 'success');
}

// Excluir pasta (com modal estilo Apple)
function deleteFolder(folderId) {
    const folder = notebookData.folders[folderId];
    if (!folder) {
        showToast('Pasta não encontrada', 'error');
        return;
    }
    
    // Verificar se há notas na pasta
    const notesInFolder = Object.values(notebookData.notes).filter(n => n.folder === folderId);
    const subfolders = Object.values(notebookData.folders).filter(f => f.parent === folderId);
    
    // Preencher modal
    document.getElementById('delete-folder-title').textContent = 'Excluir Pasta';
    document.getElementById('delete-folder-message').textContent = `Tem certeza que deseja excluir a pasta "${folder.name}"?`;
    
    let detailsHtml = '';
    if (notesInFolder.length > 0) {
        detailsHtml += `<div class="detail-item"><i class="fas fa-file-alt"></i> Esta pasta contém <strong>${notesInFolder.length}</strong> nota(s)</div>`;
    }
    if (subfolders.length > 0) {
        detailsHtml += `<div class="detail-item"><i class="fas fa-folder"></i> Esta pasta contém <strong>${subfolders.length}</strong> subpasta(s)</div>`;
    }
    document.getElementById('delete-folder-details').innerHTML = detailsHtml;
    
    // Configurar botão de confirmação
    const confirmBtn = document.getElementById('delete-folder-confirm');
    confirmBtn.onclick = function() {
        // Mover notas para a raiz ou pasta pai
        const targetFolder = folder.parent || 'root';
        notesInFolder.forEach(note => {
            note.folder = targetFolder;
        });
        
        // Mover subpastas para a raiz ou pasta pai
        subfolders.forEach(subfolder => {
            subfolder.parent = folder.parent;
        });
        
        // Excluir a pasta
        delete notebookData.folders[folderId];
        
        // Se a pasta excluída estava selecionada, voltar para root
        if (notebookData.currentFolder === folderId) {
            notebookData.currentFolder = 'root';
        }
        
        saveData();
        renderFolders();
        renderNotes();
        closeModal('modal-delete-folder');
        showToast('Pasta excluída com sucesso!', 'success');
    };
    
    // Fechar menu
    const menu = document.getElementById(`folder-menu-${folderId}`);
    if (menu) {
        menu.style.display = 'none';
    }
    
    // Mostrar modal
    showModal('modal-delete-folder');
}

// Excluir subpasta (com modal estilo Apple)
function deleteSubfolder(subfolderId) {
    const subfolder = notebookData.folders[subfolderId];
    if (!subfolder) {
        showToast('Subpasta não encontrada', 'error');
        return;
    }
    
    // Verificar se há notas na subpasta
    const notesInSubfolder = Object.values(notebookData.notes).filter(n => n.folder === subfolderId);
    
    // Preencher modal
    document.getElementById('delete-subfolder-message').textContent = `Tem certeza que deseja excluir a subpasta "${subfolder.name}"?`;
    
    if (notesInSubfolder.length > 0) {
        document.getElementById('delete-subfolder-message').innerHTML += `<br><br><small>Esta subpasta contém ${notesInSubfolder.length} nota(s) que serão movidas para a pasta pai.</small>`;
    }
    
    // Configurar botão de confirmação
    const confirmBtn = document.getElementById('delete-subfolder-confirm');
    confirmBtn.onclick = function() {
        // Mover notas para a pasta pai
        const parentFolder = subfolder.parent || 'root';
        notesInSubfolder.forEach(note => {
            note.folder = parentFolder;
        });
        
        // Excluir a subpasta
        delete notebookData.folders[subfolderId];
        
        // Se a subpasta excluída estava selecionada, voltar para root
        if (notebookData.currentFolder === subfolderId) {
            notebookData.currentFolder = 'root';
        }
        
        saveData();
        renderFolders();
        renderNotes();
        closeModal('modal-delete-subfolder');
        showToast('Subpasta excluída com sucesso!', 'success');
    };
    
    // Fechar menu
    const menu = document.getElementById(`folder-menu-${subfolderId}`);
    if (menu) {
        menu.style.display = 'none';
    }
    
    // Mostrar modal
    showModal('modal-delete-subfolder');
}

// Abrir modal Renomear (vidro Apple: nome atual + novo nome) — pastas e subpastas
function openRenameFolderModal(folderId) {
    var folder = notebookData.folders[folderId];
    if (!folder) {
        if (typeof showToast === 'function') showToast('Pasta não encontrada.', 'error');
        return;
    }
    var menu = document.getElementById('folder-menu-' + folderId);
    if (menu) menu.style.display = 'none';

    document.getElementById('rename-folder-id').value = folderId;
    document.getElementById('rename-folder-current').value = folder.name || '';
    document.getElementById('rename-folder-name').value = '';
    document.getElementById('rename-folder-name').placeholder = 'Digite o novo nome';
    document.getElementById('rename-folder-name').focus();

    showModal('modal-rename-folder');
}

// Confirmar renomear pasta/subpasta
function confirmRenameFolder() {
    var folderId = document.getElementById('rename-folder-id').value;
    var newName = (document.getElementById('rename-folder-name').value || '').trim();
    if (!folderId) return;
    var folder = notebookData.folders[folderId];
    if (!folder) {
        if (typeof showToast === 'function') showToast('Pasta não encontrada.', 'error');
        closeModal('modal-rename-folder');
        return;
    }
    if (!newName) {
        if (typeof showToast === 'function') showToast('Digite o novo nome.', 'error');
        document.getElementById('rename-folder-name').focus();
        return;
    }
    folder.name = newName;
    saveData();
    renderFolders();
    closeModal('modal-rename-folder');
    if (typeof showToast === 'function') showToast('Pasta renomeada com sucesso!', 'success');
}

// Mostrar preview de subpastas ao passar o mouse
function showSubfoldersPreview(folderId) {
    const preview = document.getElementById(`subfolders-preview-${folderId}`);
    if (!preview) return;
    
    const subfolders = Object.values(notebookData.folders)
        .filter(f => f.parent === folderId)
        .sort((a, b) => a.name.localeCompare(b.name));
    
    if (subfolders.length === 0) return;
    
    preview.innerHTML = subfolders.map(sf => `
        <div class="subfolder-preview-item" onclick="selectFolder('${sf.id}', this)">
            <i class="fas fa-folder" style="color: ${sf.color}"></i>
            <span>${escapeHtml(sf.name)}</span>
        </div>
    `).join('');
    
    preview.style.display = 'block';
    preview.style.animation = 'slideDown 0.3s ease';
}

function hideSubfoldersPreview(folderId) {
    const preview = document.getElementById(`subfolders-preview-${folderId}`);
    if (!preview) return;
    
    preview.style.animation = 'slideUp 0.3s ease';
    setTimeout(() => {
        preview.style.display = 'none';
    }, 300);
}

// Fechar menus ao clicar fora
document.addEventListener('click', function(e) {
    if (!e.target.closest('.folder-menu-container')) {
        document.querySelectorAll('.folder-menu').forEach(menu => {
            menu.style.display = 'none';
        });
    }
});

// Sidebar resizer: arrastar para estender/retrair
var SIDEBAR_WIDTH_KEY = 'axis_notes_sidebar_width';
var SIDEBAR_MIN = 220;
var SIDEBAR_MAX = 480;

function setupSidebarResizer() {
    var sidebar = document.querySelector('.notebook-sidebar');
    var resizer = document.getElementById('sidebar-resizer');
    if (!sidebar || !resizer) return;

    var saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    var w = saved ? parseInt(saved, 10) : 300;
    if (w >= SIDEBAR_MIN && w <= SIDEBAR_MAX) {
        document.documentElement.style.setProperty('--apple-sidebar-width', w + 'px');
    }

    var resizing = false;
    var startX = 0;
    var startWidth = 0;

    resizer.addEventListener('mousedown', function (e) {
        e.preventDefault();
        resizing = true;
        startX = e.clientX;
        startWidth = sidebar.getBoundingClientRect().width;
        resizer.classList.add('resizing');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', function (e) {
        if (!resizing) return;
        var dx = e.clientX - startX;
        var newWidth = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, startWidth + dx));
        document.documentElement.style.setProperty('--apple-sidebar-width', newWidth + 'px');
    });

    document.addEventListener('mouseup', function () {
        if (!resizing) return;
        resizing = false;
        resizer.classList.remove('resizing');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        var w = sidebar.getBoundingClientRect().width;
        localStorage.setItem(SIDEBAR_WIDTH_KEY, Math.round(w).toString());
    });
}

// Modal functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Handle paste
function handlePaste(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');
    document.execCommand('insertText', false, text);
    saveCurrentNote();
}

// Atalhos de teclado
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl+S - Salvar
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveCurrentNote();
        }
        
        // Ctrl+N - Nova nota
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            createNewNote();
        }
        
        // Ctrl+B - Negrito
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            applyFormat('bold');
        }
        
        // Ctrl+I - Itálico
        if (e.ctrlKey && e.key === 'i') {
            e.preventDefault();
            applyFormat('italic');
        }
        
        // Ctrl+U - Sublinhado
        if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
            applyFormat('underline');
        }
        
        // Esc - Fechar editor
        if (e.key === 'Escape') {
            const editor = document.getElementById('note-editor-container');
            if (editor && editor.style.display !== 'none') {
                closeEditor();
            }
        }
        
        // F11 - Modo Foco
        if (e.key === 'F11') {
            e.preventDefault();
            toggleFocusMode();
        }
        
        // Ctrl+F - Busca
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            document.getElementById('search-notes')?.focus();
        }
        
        // Ctrl+E - Exportar
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            showModal('modal-export');
        }
    });
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Format date
function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrás`;
    
    return date.toLocaleDateString('pt-BR');
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Favoritos
function showFavorites() {
    notebookData.currentFolder = 'favorites';
    document.getElementById('current-folder-name').textContent = 'Favoritos';
    const notesListContainer = document.getElementById('notes-list-container');
    if (notesListContainer) notesListContainer.classList.remove('view-trash');
    
    const notesGrid = document.getElementById('notes-grid');
    notesGrid.innerHTML = '';
    
    const favorites = Object.values(notebookData.notes).filter(n => n.starred);
    
    if (favorites.length === 0) {
        notesGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⭐</div>
                <h3>Nenhum favorito ainda</h3>
            </div>
        `;
        return;
    }
    
    favorites.forEach(note => {
        const card = createNoteCard(note);
        notesGrid.appendChild(card);
    });
}

// Lixeira (só título e risco — sem botões de filtro/microfone/grade)
function showTrash() {
    notebookData.currentFolder = 'trash';
    document.getElementById('current-folder-name').textContent = 'Lixeira';
    
    // Esconder editor se estiver aberto e mostrar lista
    const editorContainer = document.getElementById('note-editor-container');
    const notesList = document.getElementById('notes-list-container');
    const emptyState = document.getElementById('empty-editor-state');
    
    if (editorContainer) {
        editorContainer.style.display = 'none';
        editorContainer.classList.remove('active');
    }
    if (notesList) {
        notesList.style.display = 'block';
        notesList.classList.add('view-trash');
    }
    if (emptyState) {
        emptyState.style.display = 'none';
        emptyState.classList.remove('show');
    }
    
    const notesGrid = document.getElementById('notes-grid');
    notesGrid.innerHTML = '';
    
    const trashed = Object.values(notebookData.notes).filter(n => n.trashed);
    
    if (trashed.length === 0) {
        notesGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🗑️</div>
                <h3>Lixeira vazia</h3>
                <p>Notas excluídas aparecerão aqui</p>
            </div>
        `;
        return;
    }
    
    // Ordenar por data de exclusão
    trashed.sort((a, b) => new Date(b.trashedAt || 0) - new Date(a.trashedAt || 0));
    
    trashed.forEach(note => {
        const card = createTrashNoteCard(note);
        notesGrid.appendChild(card);
    });
}

// Criar card de nota na lixeira
function createTrashNoteCard(note) {
    const div = document.createElement('div');
    div.className = 'note-card trash-note-card';
    div.dataset.noteId = note.id;
    
    const preview = note.content 
        ? note.content.replace(/<[^>]*>/g, '').substring(0, 150)
        : 'Sem conteúdo...';
    
    const trashedDate = note.trashedAt ? new Date(note.trashedAt) : new Date();
    const dateStr = formatDate(trashedDate);
    
    div.innerHTML = `
        <div class="note-card-header">
            <h4 class="note-card-title">${escapeHtml(note.title || 'Sem título')}</h4>
        </div>
        <p class="note-card-preview">${escapeHtml(preview)}</p>
        <div class="note-card-footer">
            <span class="note-card-date">
                <i class="fas fa-trash"></i>
                Excluída ${dateStr}
            </span>
        </div>
        <div class="trash-actions">
            <button class="btn-restore" onclick="event.stopPropagation(); restoreNoteFromTrash('${note.id}')">
                <i class="fas fa-undo"></i>
                <span>Restaurar</span>
            </button>
            <button class="btn-delete-permanent" onclick="event.stopPropagation(); deleteNotePermanent('${note.id}')">
                <i class="fas fa-trash-alt"></i>
                <span>Apagar Definitivamente</span>
            </button>
        </div>
    `;
    
    div.addEventListener('click', () => {
        // Abrir nota em modo somente leitura
        openTrashedNote(note.id);
    });
    
    return div;
}

// Restaurar nota da lixeira
function restoreNoteFromTrash(noteId) {
    const note = notebookData.notes[noteId];
    if (!note || !note.trashed) return;
    
    // Preencher modal
    document.getElementById('restore-note-confirm').onclick = function() {
        delete note.trashed;
        delete note.trashedAt;
        note.folder = note.originalFolder || 'root';
        delete note.originalFolder;
        
        saveData();
        showTrash();
        closeModal('modal-restore-note');
        showToast('Nota restaurada com sucesso!', 'success');
    };
    
    showModal('modal-restore-note');
}

// Apagar nota permanentemente
function deleteNotePermanent(noteId) {
    const note = notebookData.notes[noteId];
    if (!note) return;
    
    // Preencher modal
    document.getElementById('delete-permanent-confirm').onclick = function() {
        delete notebookData.notes[noteId];
        saveData();
        showTrash();
        closeModal('modal-delete-permanent');
        showToast('Nota apagada permanentemente!', 'success');
    };
    
    showModal('modal-delete-permanent');
}

// Abrir nota da lixeira (somente leitura)
function openTrashedNote(noteId) {
    const note = notebookData.notes[noteId];
    if (!note) return;
    
    notebookData.currentNote = noteId;
    
    // Mostrar editor; menu de opções abre na área ao lado das pastas ao clicar no hambúrguer
    const editorContainer = document.getElementById('note-editor-container');
    const notesList = document.getElementById('notes-list-container');
    const emptyState = document.getElementById('empty-editor-state');
    
    if (editorContainer) {
        editorContainer.style.display = 'flex';
        editorContainer.classList.add('active');
    }
    if (notesList) notesList.style.display = 'none';
    if (emptyState) {
        emptyState.style.display = 'none';
        emptyState.classList.remove('show');
    }
    
    // Preencher dados
    document.getElementById('note-title').value = note.title || '';
    document.getElementById('note-title').disabled = true;
    document.getElementById('rich-editor').innerHTML = note.content || '<p>Sem conteúdo...</p>';
    document.getElementById('rich-editor').contentEditable = 'false';
    
    // Esconder toolbar de formatação (se existir)
    const fmtToolbar = document.getElementById('editor-format-toolbar');
    if (fmtToolbar) fmtToolbar.style.display = 'none';
    
    updateWordCount();
}

// Atualizar moveToTrash para salvar pasta original
function moveToTrash(noteId) {
    if (!notebookData.notes[noteId]) return;
    const note = notebookData.notes[noteId];
    note.originalFolder = note.folder;
    note.trashed = true;
    note.trashedAt = new Date().toISOString();
    note.folder = 'trash';
    saveData();
    renderNotes();
    showToast('Nota movida para lixeira', 'success');
}

// Função para mover nota para lixeira
function moveToTrash(noteId) {
    if (!notebookData.notes[noteId]) return;
    notebookData.notes[noteId].trashed = true;
    notebookData.notes[noteId].trashedAt = new Date().toISOString();
    saveData();
    renderNotes();
    showToast('Nota movida para lixeira', 'success');
}

// Função para restaurar da lixeira
function restoreFromTrash(noteId) {
    if (!notebookData.notes[noteId]) return;
    delete notebookData.notes[noteId].trashed;
    delete notebookData.notes[noteId].trashedAt;
    saveData();
    showTrash();
    showToast('Nota restaurada', 'success');
}

// Exportar funções globais
window.toggleHamburgerMenu = function() {
    const menu = document.getElementById('hamburger-menu');
    const btn = document.getElementById('hamburger-btn');
    if (menu && btn) {
        menu.classList.toggle('show');
        btn.classList.toggle('active');
    }
};

// ============================================
// FUNCIONALIDADES AVANÇADAS - TODAS AS 50+ IDEIAS
// ============================================

// 1. SISTEMA DE TAGS/CATEGORIAS
function initializeTags() {
    const tagColors = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#5AC8FA', '#FF69B4', '#00CED1'];
    const tagColorsContainer = document.getElementById('tag-colors');
    if (tagColorsContainer) {
        tagColorsContainer.innerHTML = tagColors.map(color => 
            `<div class="tag-color-option" data-color="${color}" style="background: ${color};"></div>`
        ).join('');
    }
}

function addTagToNote(noteId, tagName, tagColor) {
    if (!notebookData.notes[noteId]) return;
    if (!notebookData.notes[noteId].tags) notebookData.notes[noteId].tags = [];
    
    const tag = { name: tagName, color: tagColor || '#007AFF' };
    if (!notebookData.notes[noteId].tags.find(t => t.name === tagName)) {
        notebookData.notes[noteId].tags.push(tag);
        saveData();
        renderNoteTags(noteId);
    }
}

function renderNoteTags(noteId) {
    const tagsContainer = document.getElementById('editor-tags');
    if (!tagsContainer || !notebookData.notes[noteId]) return;
    
    const tags = notebookData.notes[noteId].tags || [];
    tagsContainer.innerHTML = tags.map(tag => 
        `<span class="note-tag" style="background: ${tag.color}20; color: ${tag.color}; border-color: ${tag.color};">
            ${escapeHtml(tag.name)}
            <i class="fas fa-times" onclick="removeTagFromNote('${noteId}', '${tag.name}')"></i>
        </span>`
    ).join('');
}

function removeTagFromNote(noteId, tagName) {
    if (!notebookData.notes[noteId] || !notebookData.notes[noteId].tags) return;
    notebookData.notes[noteId].tags = notebookData.notes[noteId].tags.filter(t => t.name !== tagName);
    saveData();
    renderNoteTags(noteId);
}

// 2. PREVIEW DE IMAGENS
function extractImagesFromNote(note) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(note.content || '', 'text/html');
    const images = doc.querySelectorAll('img');
    return Array.from(images).map(img => img.src);
}

// 3. BARRA DE PROGRESSO DE LEITURA
function updateReadingProgress() {
    const editor = document.getElementById('rich-editor');
    const progressBar = document.getElementById('reading-progress');
    if (!editor || !progressBar) return;
    
    const scrollTop = editor.scrollTop;
    const scrollHeight = editor.scrollHeight - editor.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    
    progressBar.style.width = `${progress}%`;
}

// 4. TIMELINE DE VERSÕES
function saveVersion(noteId) {
    if (!notebookData.notes[noteId]) return;
    
    if (!notebookData.versions[noteId]) notebookData.versions[noteId] = [];
    
    const version = {
        id: 'v-' + Date.now(),
        content: notebookData.notes[noteId].content,
        title: notebookData.notes[noteId].title,
        timestamp: new Date().toISOString()
    };
    
    notebookData.versions[noteId].unshift(version);
    
    // Manter apenas últimas 50 versões
    if (notebookData.versions[noteId].length > 50) {
        notebookData.versions[noteId] = notebookData.versions[noteId].slice(0, 50);
    }
    
    saveData();
}

function restoreVersion(noteId, versionId) {
    if (!notebookData.versions[noteId]) return;
    
    const version = notebookData.versions[noteId].find(v => v.id === versionId);
    if (!version) return;
    
    notebookData.notes[noteId].content = version.content;
    notebookData.notes[noteId].title = version.title;
    
    saveData();
    openNote(noteId);
    showToast('Versão restaurada com sucesso!', 'success');
}

function renderVersionsTimeline(noteId) {
    const timeline = document.getElementById('versions-timeline');
    if (!timeline || !notebookData.versions[noteId]) return;
    
    const versions = notebookData.versions[noteId];
    timeline.innerHTML = versions.map(version => `
        <div class="version-item">
            <div class="version-date">${formatDate(new Date(version.timestamp))}</div>
            <div class="version-preview">${escapeHtml(version.title)}</div>
            <button class="btn-primary" onclick="restoreVersion('${noteId}', '${version.id}')">Restaurar</button>
        </div>
    `).join('');
}

// 5. SISTEMA DE COMENTÁRIOS
function addComment() {
    const commentText = document.getElementById('new-comment').value;
    if (!commentText.trim() || !notebookData.currentNote) return;
    
    if (!notebookData.comments[notebookData.currentNote]) {
        notebookData.comments[notebookData.currentNote] = [];
    }
    
    const comment = {
        id: 'c-' + Date.now(),
        text: commentText,
        timestamp: new Date().toISOString(),
        author: 'Você'
    };
    
    notebookData.comments[notebookData.currentNote].push(comment);
    document.getElementById('new-comment').value = '';
    saveData();
    renderComments(notebookData.currentNote);
}

function renderComments(noteId) {
    const commentsList = document.getElementById('comments-list');
    if (!commentsList || !notebookData.comments[noteId]) return;
    
    const comments = notebookData.comments[noteId];
    commentsList.innerHTML = comments.map(comment => `
        <div class="comment-item">
            <div class="comment-header">
                <strong>${escapeHtml(comment.author)}</strong>
                <span class="comment-date">${formatDate(new Date(comment.timestamp))}</span>
            </div>
            <div class="comment-text">${escapeHtml(comment.text)}</div>
        </div>
    `).join('');
}

// 6. TEMPLATES DE NOTAS
function initializeTemplates() {
    notebookData.templates = {
        'meeting': {
            name: 'Reunião',
            content: `<h2>Reunião - ${new Date().toLocaleDateString('pt-BR')}</h2>
<h3>Participantes:</h3>
<ul>
    <li></li>
</ul>
<h3>Pauta:</h3>
<ol>
    <li></li>
</ol>
<h3>Decisões:</h3>
<ul>
    <li></li>
</ul>
<h3>Próximos Passos:</h3>
<ul>
    <li></li>
</ul>`
        },
        'checklist': {
            name: 'Checklist',
            content: `<h2>Checklist</h2>
<ul>
    <li><input type="checkbox"> Tarefa 1</li>
    <li><input type="checkbox"> Tarefa 2</li>
    <li><input type="checkbox"> Tarefa 3</li>
</ul>`
        },
        'journal': {
            name: 'Diário',
            content: `<h2>${new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
<p></p>`
        },
        'todo': {
            name: 'Lista de Tarefas',
            content: `<h2>Lista de Tarefas</h2>
<h3>Prioridade Alta</h3>
<ul>
    <li></li>
</ul>
<h3>Prioridade Média</h3>
<ul>
    <li></li>
</ul>
<h3>Prioridade Baixa</h3>
<ul>
    <li></li>
</ul>`
        }
    };
    saveData();
}

function renderTemplates() {
    const templatesGrid = document.getElementById('templates-grid');
    if (!templatesGrid) return;
    
    templatesGrid.innerHTML = Object.entries(notebookData.templates).map(([id, template]) => `
        <div class="template-card" onclick="useTemplate('${id}')">
            <h4>${escapeHtml(template.name)}</h4>
        </div>
    `).join('');
}

function useTemplate(templateId) {
    const template = notebookData.templates[templateId];
    if (!template) return;
    
    createNewNote();
    setTimeout(() => {
        document.getElementById('rich-editor').innerHTML = template.content;
        saveCurrentNote();
        closeModal('modal-templates');
    }, 100);
}

// 7. PAINEL DE ATALHOS
function renderShortcuts() {
    const shortcutsList = document.getElementById('shortcuts-list');
    if (!shortcutsList) return;
    
    const shortcuts = [
        { key: 'Ctrl+N', desc: 'Nova Nota' },
        { key: 'Ctrl+S', desc: 'Salvar' },
        { key: 'Ctrl+B', desc: 'Negrito' },
        { key: 'Ctrl+I', desc: 'Itálico' },
        { key: 'Ctrl+U', desc: 'Sublinhado' },
        { key: 'Esc', desc: 'Fechar Editor' },
        { key: 'F11', desc: 'Modo Foco' },
        { key: 'Ctrl+F', desc: 'Buscar' },
        { key: 'Ctrl+E', desc: 'Exportar' }
    ];
    
    shortcutsList.innerHTML = shortcuts.map(s => `
        <div class="shortcut-item">
            <kbd>${s.key}</kbd>
            <span>${s.desc}</span>
        </div>
    `).join('');
}

// 8. MODO FOCO
function toggleFocusMode() {
    const editor = document.getElementById('note-editor-container');
    if (!editor) return;
    
    if (editor.classList.contains('focus-mode')) {
        editor.classList.remove('focus-mode');
        document.getElementById('btn-focus-mode').querySelector('i').className = 'fas fa-expand';
    } else {
        editor.classList.add('focus-mode');
        document.getElementById('btn-focus-mode').querySelector('i').className = 'fas fa-compress';
    }
}

// 9. PAINEL DE ESTATÍSTICAS
function renderStatistics() {
    const totalNotes = Object.keys(notebookData.notes).length;
    const totalWords = Object.values(notebookData.notes).reduce((sum, note) => {
        const text = (note.content || '').replace(/<[^>]*>/g, '');
        return sum + text.split(/\s+/).filter(w => w.length > 0).length;
    }, 0);
    
    document.getElementById('stat-total-notes').textContent = totalNotes;
    document.getElementById('stat-total-words').textContent = totalWords.toLocaleString();
    document.getElementById('stat-notes-created').textContent = notebookData.statistics.notesCreated || 0;
    document.getElementById('stat-usage-time').textContent = formatUsageTime(notebookData.statistics.usageTime || 0);
    
    // Gráfico
    renderStatisticsChart();
}

function renderStatisticsChart() {
    const ctx = document.getElementById('stats-chart');
    if (!ctx) return;
    
    const dates = [];
    const counts = [];
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
        last7Days.push(date.toDateString());
    }
    
    last7Days.forEach(day => {
        const count = Object.values(notebookData.notes).filter(note => {
            const noteDate = new Date(note.created || note.updated).toDateString();
            return noteDate === day;
        }).length;
        counts.push(count);
    });
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Notas Criadas',
                data: counts,
                borderColor: '#007AFF',
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function formatUsageTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}

// 10. SISTEMA DE LEMBRETES
function addReminder() {
    const datetime = document.getElementById('reminder-datetime').value;
    const message = document.getElementById('reminder-message').value;
    
    if (!datetime || !notebookData.currentNote) return;
    
    if (!notebookData.reminders[notebookData.currentNote]) {
        notebookData.reminders[notebookData.currentNote] = [];
    }
    
    const reminder = {
        id: 'r-' + Date.now(),
        datetime: datetime,
        message: message || 'Lembrete',
        noteId: notebookData.currentNote
    };
    
    notebookData.reminders[notebookData.currentNote].push(reminder);
    saveData();
    
    // Agendar notificação
    scheduleReminder(reminder);
    
    closeModal('modal-reminders');
    showToast('Lembrete adicionado!', 'success');
}

function scheduleReminder(reminder) {
    const reminderTime = new Date(reminder.datetime).getTime();
    const now = Date.now();
    const delay = reminderTime - now;
    
    if (delay > 0) {
        setTimeout(() => {
            showNotification(reminder.message);
        }, delay);
    }
}

// 11. DRAG & DROP
function initializeDragAndDrop() {
    const notesGrid = document.getElementById('notes-grid');
    if (!notesGrid || typeof Sortable === 'undefined') return;
    
    new Sortable(notesGrid, {
        animation: 150,
        handle: '.note-card',
        onEnd: function(evt) {
            // Reordenar notas baseado na nova posição
            const notes = Array.from(notesGrid.children)
                .filter(el => el.classList.contains('note-card'))
                .map(el => el.dataset.noteId);
            
            // Atualizar ordem (pode ser implementado com campo 'order' nas notas)
            saveData();
        }
    });
}

// 12. PREVIEW MARKDOWN
function toggleMarkdownPreview() {
    const editor = document.getElementById('rich-editor');
    const preview = document.getElementById('markdown-preview');
    const btn = document.getElementById('toolbar-markdown-preview') || document.getElementById('btn-markdown-preview');
    
    if (!editor || !preview) return;
    
    if (preview.style.display === 'none') {
        const markdown = htmlToMarkdown(editor.innerHTML);
        if (typeof marked !== 'undefined') {
            preview.innerHTML = marked.parse(markdown);
        } else {
            preview.innerHTML = markdown;
        }
        preview.style.display = 'block';
        editor.style.display = 'none';
        if (btn) {
            const icon = btn.querySelector('i');
            if (icon) icon.className = 'fas fa-edit';
        }
    } else {
        preview.style.display = 'none';
        editor.style.display = 'block';
        if (btn) {
            const icon = btn.querySelector('i');
            if (icon) icon.className = 'fas fa-eye';
        }
    }
}

function htmlToMarkdown(html) {
    // Conversão básica HTML para Markdown
    return html
        .replace(/<h1>(.*?)<\/h1>/g, '# $1\n')
        .replace(/<h2>(.*?)<\/h2>/g, '## $1\n')
        .replace(/<h3>(.*?)<\/h3>/g, '### $1\n')
        .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
        .replace(/<em>(.*?)<\/em>/g, '*$1*')
        .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/<[^>]+>/g, '');
}

// 13. BARRA LATERAL DE PROPRIEDADES
function togglePropertiesPanel() {
    const panel = document.getElementById('properties-panel');
    if (!panel) return;
    
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if (notebookData.currentNote) {
        renderProperties(notebookData.currentNote);
    }
}

function renderProperties(noteId) {
    const content = document.getElementById('properties-content');
    if (!content || !notebookData.notes[noteId]) return;
    
    const note = notebookData.notes[noteId];
    const created = new Date(note.created);
    const updated = new Date(note.updated || note.created);
    const text = (note.content || '').replace(/<[^>]*>/g, '');
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    const charCount = text.length;
    const sizeKB = (JSON.stringify(note).length / 1024).toFixed(2);
    
    content.innerHTML = `
        <div class="property-item">
            <label>Criada em:</label>
            <span>${created.toLocaleString('pt-BR')}</span>
        </div>
        <div class="property-item">
            <label>Atualizada em:</label>
            <span>${updated.toLocaleString('pt-BR')}</span>
        </div>
        <div class="property-item">
            <label>Palavras:</label>
            <span>${wordCount}</span>
        </div>
        <div class="property-item">
            <label>Caracteres:</label>
            <span>${charCount}</span>
        </div>
        <div class="property-item">
            <label>Tamanho:</label>
            <span>${sizeKB} KB</span>
        </div>
    `;
}

// 14. SISTEMA DE PINS
function togglePin() {
    if (!notebookData.currentNote) return;
    const note = notebookData.notes[notebookData.currentNote];
    if (!note) return;
    note.pinned = !note.pinned;
    saveData();
    var btn = document.getElementById('btn-pin-note');
    if (btn) btn.querySelector('i').className = note.pinned ? 'fas fa-thumbtack' : 'far fa-thumbtack';
    renderNotes();
    showToast(note.pinned ? 'Nota fixada!' : 'Nota desfixada!', 'success');
}
function toggleNotePin(noteId) {
    var note = notebookData.notes[noteId];
    if (!note) return;
    note.pinned = !note.pinned;
    saveData();
    renderNotes();
    showToast(note.pinned ? 'Nota fixada!' : 'Nota desfixada!', 'success');
}

function showPinned() {
    notebookData.currentFolder = 'pinned';
    document.getElementById('current-folder-name').textContent = 'Notas Fixadas';
    const notesListContainer = document.getElementById('notes-list-container');
    if (notesListContainer) notesListContainer.classList.remove('view-trash');
    
    const notesGrid = document.getElementById('notes-grid');
    notesGrid.innerHTML = '';
    
    const pinned = Object.values(notebookData.notes).filter(n => n.pinned);
    
    if (pinned.length === 0) {
        notesGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📌</div>
                <h3>Nenhuma nota fixada</h3>
            </div>
        `;
        return;
    }
    
    pinned.forEach(note => {
        const card = createNoteCard(note);
        notesGrid.appendChild(card);
    });
}

// 15. MODO ESCURO AUTOMÁTICO
function checkAutoDarkMode() {
    const hour = new Date().getHours();
    const isNight = hour >= 18 || hour < 6;
    
    if (isNight && notebookData.settings.theme !== 'dark') {
        applyTheme('dark');
    } else if (!isNight && notebookData.settings.theme !== 'light') {
        applyTheme('light');
    }
}

function toggleTheme() {
    const newTheme = notebookData.settings.theme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
}

function applyTheme(theme) {
    notebookData.settings.theme = theme;
    document.body.setAttribute('data-theme', theme);
    
    const iconClass = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    document.querySelectorAll('#btn-theme-toggle, #btn-theme-toggle-header').forEach(function(btn) {
        if (btn) {
            var icon = btn.querySelector('i');
            if (icon) icon.className = iconClass;
        }
    });
    
    saveData();
}

// 16-30. FUNCIONALIDADES CSS (implementadas no CSS)

// Corrigir estrutura de pastas - garantir que pastas principais não sejam subpastas incorretamente
function fixFolderStructure() {
    if (!notebookData.folders) return;
    
    // Lista de pastas que devem ser pastas principais (não subpastas)
    const mainFolders = ['Filipe da Silva', 'Mercado Livre'];
    let needsSave = false;
    
    Object.values(notebookData.folders).forEach(folder => {
        // Se a pasta está na lista de principais e tem um parent, remover o parent
        if (mainFolders.includes(folder.name) && folder.parent && folder.parent !== 'root') {
            console.log(`Corrigindo estrutura: ${folder.name} não deve ser subpasta de ${notebookData.folders[folder.parent]?.name || folder.parent}`);
            folder.parent = null; // Tornar pasta raiz
            needsSave = true;
        }
    });
    
    if (needsSave) {
        saveData();
        renderFolders(); // Re-renderizar para atualizar a visualização
    }
}

// 31. AUTOSAVE INTELIGENTE - Melhorado para salvar mais frequentemente
let autosaveTimeout;
function startIntelligentAutosave() {
    const editor = document.getElementById('rich-editor');
    const titleInput = document.getElementById('note-title');
    if (!editor) return;
    
    // Salvar ao digitar no editor
    editor.addEventListener('input', function() {
        clearTimeout(autosaveTimeout);
        
        const indicator = document.getElementById('autosave-indicator');
        if (indicator) {
            indicator.textContent = 'Salvando...';
            indicator.style.color = 'var(--apple-warning)';
        }
        
        autosaveTimeout = setTimeout(() => {
            if (notebookData.currentNote) {
                saveCurrentNote();
                saveVersion(notebookData.currentNote);
                
                if (indicator) {
                    indicator.textContent = 'Salvo';
                    indicator.style.color = 'var(--apple-success)';
                    setTimeout(() => {
                        indicator.textContent = '';
                    }, 2000);
                }
            }
        }, notebookData.settings.autosaveInterval || 1000); // Reduzido para 1 segundo
    });
    
    // Salvar ao mudar o título
    if (titleInput) {
        titleInput.addEventListener('input', function() {
            clearTimeout(autosaveTimeout);
            autosaveTimeout = setTimeout(() => {
                if (notebookData.currentNote) {
                    saveCurrentNote();
                }
            }, 1000);
        });
    }
    
    // Salvar ao perder foco
    editor.addEventListener('blur', function() {
        if (notebookData.currentNote) {
            saveCurrentNote();
        }
    });
    
    if (titleInput) {
        titleInput.addEventListener('blur', function() {
            if (notebookData.currentNote) {
                saveCurrentNote();
            }
        });
    }
}

// 32. BUSCA AVANÇADA
function performAdvancedSearch() {
    const text = document.getElementById('search-text').value.toLowerCase();
    const tags = Array.from(document.getElementById('search-tags').selectedOptions).map(o => o.value);
    const dateStart = document.getElementById('search-date-start').value;
    const dateEnd = document.getElementById('search-date-end').value;
    const sizeMin = parseInt(document.getElementById('search-size-min').value) || 0;
    
    let results = Object.values(notebookData.notes);
    
    if (text) {
        results = results.filter(note => {
            const searchText = (note.title + ' ' + note.content.replace(/<[^>]*>/g, '')).toLowerCase();
            return searchText.includes(text);
        });
    }
    
    if (tags.length > 0) {
        results = results.filter(note => {
            const noteTags = (note.tags || []).map(t => t.name);
            return tags.some(tag => noteTags.includes(tag));
        });
    }
    
    if (dateStart) {
        const start = new Date(dateStart);
        results = results.filter(note => new Date(note.created) >= start);
    }
    
    if (dateEnd) {
        const end = new Date(dateEnd);
        end.setHours(23, 59, 59);
        results = results.filter(note => new Date(note.created) <= end);
    }
    
    if (sizeMin > 0) {
        results = results.filter(note => {
            const text = (note.content || '').replace(/<[^>]*>/g, '');
            return text.split(/\s+/).filter(w => w.length > 0).length >= sizeMin;
        });
    }
    
    renderSearchResults(results);
    closeModal('modal-advanced-search');
}

function renderSearchResults(results) {
    const notesGrid = document.getElementById('notes-grid');
    if (!notesGrid) return;
    
    notesGrid.innerHTML = '';
    
    if (results.length === 0) {
        notesGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>Nenhum resultado encontrado</h3>
            </div>
        `;
        return;
    }
    
    results.forEach(note => {
        const card = createNoteCard(note);
        notesGrid.appendChild(card);
    });
}

// 33. EXPORTAÇÃO MÚLTIPLA
function exportNotes() {
    const format = document.getElementById('export-format').value;
    const selectedNotes = Array.from(document.querySelectorAll('#export-notes-list input:checked'))
        .map(cb => cb.value);
    
    if (selectedNotes.length === 0 && notebookData.currentNote) {
        selectedNotes.push(notebookData.currentNote);
    }
    
    selectedNotes.forEach(noteId => {
        const note = notebookData.notes[noteId];
        if (!note) return;
        
        switch(format) {
            case 'pdf':
                exportToPDF(note);
                break;
            case 'md':
                exportToMarkdown(note);
                break;
            case 'txt':
                exportToText(note);
                break;
            default:
                exportNote(note);
        }
    });
    
    closeModal('modal-export');
}

function exportToPDF(note) {
    if (typeof window.jspdf === 'undefined') {
        showToast('Biblioteca PDF não carregada', 'error');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(note.title || 'Sem título', 20, 20);
    
    doc.setFontSize(12);
    const content = note.content.replace(/<[^>]*>/g, '');
    const lines = doc.splitTextToSize(content, 170);
    doc.text(lines, 20, 40);
    
    doc.save(`${note.title || 'nota'}.pdf`);
}

function exportToMarkdown(note) {
    const markdown = `# ${note.title || 'Sem título'}\n\n${htmlToMarkdown(note.content)}`;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title || 'nota'}.md`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportToText(note) {
    const text = `${note.title || 'Sem título'}\n\n${note.content.replace(/<[^>]*>/g, '')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title || 'nota'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

// 34. SINCRONIZAÇÃO E BACKUP
function startAutoBackup() {
    setInterval(() => {
        const backup = JSON.stringify(notebookData);
        localStorage.setItem('notebookBackup_' + Date.now(), backup);
        
        // Manter apenas últimos 5 backups
        const backups = Object.keys(localStorage)
            .filter(k => k.startsWith('notebookBackup_'))
            .sort()
            .reverse();
        
        if (backups.length > 5) {
            backups.slice(5).forEach(k => localStorage.removeItem(k));
        }
        
        notebookData.statistics.lastBackup = new Date().toISOString();
        saveData();
    }, 3600000); // A cada hora
}

// 35-50. OUTRAS FUNCIONALIDADES
function initializeAdvancedFeatures() {
    initializeTags();
    renderTemplates();
    renderShortcuts();
    
    // Inicializar scroll listener para progresso de leitura
    const editor = document.getElementById('rich-editor');
    if (editor) {
        editor.addEventListener('scroll', updateReadingProgress);
    }
}

function initializeParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const ctx = canvas.getContext('2d');
    const particles = [];
    
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 2 + 1,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5
        });
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
            if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
            
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 122, 255, 0.1)';
            ctx.fill();
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

function initializeServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    try {
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
            .then(() => {})
            .catch(() => {});
    } catch (e) {}
}

function initializeNotifications() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function showNotification(message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Bloco de Notas', {
            body: message,
            icon: '/favicon.ico'
        });
    }
}

function startVoiceSearch() {
    if (!('webkitSpeechRecognition' in window)) {
        showToast('Busca por voz não suportada neste navegador', 'error');
        return;
    }
    
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('search-notes').value = transcript;
        searchNotes(transcript);
    };
    
    recognition.start();
    showToast('Ouvindo...', 'info');
}

function startStatisticsTracking() {
    notebookData.statistics.notesCreated = Object.keys(notebookData.notes).length;
    
    // Atualizar tempo de uso
    const startTime = Date.now();
    setInterval(() => {
        notebookData.statistics.usageTime = (notebookData.statistics.usageTime || 0) + 1;
        if (notebookData.statistics.usageTime % 60 === 0) {
            saveData();
        }
    }, 1000);
}

function showLinkNotesModal() {
    // Implementar modal de vincular notas
    showToast('Funcionalidade de vincular notas em desenvolvimento', 'info');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// createNoteCard já foi atualizado acima com todas as funcionalidades

// Atualizar openNote para incluir todas as funcionalidades
const originalOpenNote = openNote;
openNote = function(noteId) {
    originalOpenNote(noteId);
    
    // Renderizar tags
    renderNoteTags(noteId);
    
    // Atualizar progresso de leitura
    updateReadingProgress();
    
    // Renderizar propriedades
    renderProperties(noteId);
    
    // Carregar comentários se houver
    if (notebookData.comments[noteId]) {
        renderComments(noteId);
    }
    
    // Atualizar botão de pin
    const note = notebookData.notes[noteId];
    const pinBtn = document.getElementById('btn-pin-note');
    if (pinBtn && note) {
        pinBtn.querySelector('i').className = note.pinned ? 'fas fa-thumbtack' : 'far fa-thumbtack';
    }
    
    // Salvar versão ao abrir (para histórico)
    saveVersion(noteId);
};

// renderNotes já foi atualizado na função original, mas vamos garantir ordenação de pins

// Atualizar createNewNote para incluir estatísticas
const originalCreateNewNote = createNewNote;
createNewNote = function() {
    originalCreateNewNote();
    notebookData.statistics.notesCreated = (notebookData.statistics.notesCreated || 0) + 1;
    saveData();
};

// Exportar novas funções globais
window.toggleFocusMode = toggleFocusMode;
window.toggleTheme = toggleTheme;
window.togglePin = togglePin;
window.addComment = addComment;
window.addReminder = addReminder;
window.performAdvancedSearch = performAdvancedSearch;
window.exportNotes = exportNotes;
window.useTemplate = useTemplate;
window.restoreVersion = restoreVersion;
window.removeTagFromNote = removeTagFromNote;
window.showPinned = showPinned;
window.togglePropertiesPanel = togglePropertiesPanel;
window.startVoiceSearch = startVoiceSearch;
window.showTrash = showTrash;
window.moveToTrash = moveToTrash;
window.restoreFromTrash = restoreFromTrash;
window.showFavorites = showFavorites;
window.createNewNote = createNewNote;
window.selectFolder = selectFolder;
window.createFolder = createFolder;
window.toggleNoteStar = toggleNoteStar;
window.closeModal = closeModal;
window.showModal = showModal;
window.toggleFolderMenu = toggleFolderMenu;
window.createSubfolder = createSubfolder;
window.deleteFolder = deleteFolder;
window.toggleFolderExpand = toggleFolderExpand;
window.deleteSubfolder = deleteSubfolder;
window.openRenameFolderModal = openRenameFolderModal;
window.confirmRenameFolder = confirmRenameFolder;
window.showSubfoldersPreview = showSubfoldersPreview;
window.hideSubfoldersPreview = hideSubfoldersPreview;
window.restoreNoteFromTrash = restoreNoteFromTrash;
window.deleteNotePermanent = deleteNotePermanent;
window.deleteNote = deleteNote;
window.toggleFormatToolbar = toggleFormatToolbar;
window.setViewMode = setViewMode;
window.renderNotes = renderNotes;

// ============================================
// TOOLBAR GOOGLE DOCS - FUNCIONALIDADES
// ============================================

// Mostrar toolbar Google Docs
function showGoogleDocsToolbar() {
    const toolbar = document.getElementById('google-docs-toolbar');
    const container = document.querySelector('.notebook-container');
    const hamburger = document.getElementById('editor-toolbar-hamburger');
    if (toolbar) {
        toolbar.classList.add('show');
    }
    if (container) {
        container.classList.add('toolbar-active');
    }
    if (hamburger) {
        hamburger.classList.add('active');
    }
}

// Esconder toolbar Google Docs
function hideGoogleDocsToolbar() {
    const toolbar = document.getElementById('google-docs-toolbar');
    const container = document.querySelector('.notebook-container');
    const hamburger = document.getElementById('editor-toolbar-hamburger');
    if (toolbar) {
        toolbar.classList.remove('show');
    }
    if (container) {
        container.classList.remove('toolbar-active');
    }
    if (hamburger) {
        hamburger.classList.remove('active');
    }
}

// Toggle do painel de opções: sai do menu hambúrguer (como uma conversa), fica fixo; fecha só ao clicar no hambúrguer de novo
function toggleEditorToolbar() {
    if (!notebookData.currentNote) return;
    var panel = document.getElementById('editor-options-panel');
    var hamburger = document.getElementById('editor-toolbar-hamburger');
    if (!panel || !hamburger) return;
    var isOpen = panel.classList.toggle('open');
    hamburger.classList.toggle('active', isOpen);
    panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    if (isOpen) positionEditorOptionsPanelFromHamburger();
}

function positionEditorOptionsPanelFromHamburger() {
    var panel = document.getElementById('editor-options-panel');
    var hamburger = document.getElementById('editor-toolbar-hamburger');
    if (!panel || !hamburger) return;
    var rect = hamburger.getBoundingClientRect();
    var gap = 8;
    var maxH = Math.min(window.innerHeight - rect.top - 24, 520);
    panel.style.left = (rect.right + gap) + 'px';
    panel.style.top = rect.top + 'px';
    panel.style.height = maxH + 'px';
    panel.style.maxHeight = maxH + 'px';
    // Se o painel sair da tela à direita, abre à esquerda do hambúrguer
    if (rect.right + gap + 280 > window.innerWidth - 16) {
        panel.style.left = (rect.left - 280 - gap) + 'px';
        panel.style.transformOrigin = 'top right';
    } else {
        panel.style.transformOrigin = 'top left';
    }
}

function openEditorOptionsPanel() {
    var panel = document.getElementById('editor-options-panel');
    var hamburger = document.getElementById('editor-toolbar-hamburger');
    if (panel) {
        panel.classList.add('open');
        panel.setAttribute('aria-hidden', 'false');
        positionEditorOptionsPanelFromHamburger();
    }
    if (hamburger) hamburger.classList.add('active');
}

function closeEditorOptionsPanel() {
    var panel = document.getElementById('editor-options-panel');
    var hamburger = document.getElementById('editor-toolbar-hamburger');
    if (panel) {
        panel.classList.remove('open');
        panel.setAttribute('aria-hidden', 'true');
    }
    if (hamburger) hamburger.classList.remove('active');
}

window.toggleEditorToolbar = toggleEditorToolbar;
window.openEditorOptionsPanel = openEditorOptionsPanel;
window.closeEditorOptionsPanel = closeEditorOptionsPanel;
window.toggleNotePin = toggleNotePin;

document.addEventListener('click', function(e) {
    var panel = document.getElementById('editor-options-panel');
    var hamburger = document.getElementById('editor-toolbar-hamburger');
    if (panel && panel.classList.contains('open') && !panel.contains(e.target) && !(hamburger && hamburger.contains(e.target))) {
        closeEditorOptionsPanel();
    }
});

// Helper para mostrar toast (se não existir)
function showToast(message, type = 'info') {
    // Criar toast se não existir
    let toast = document.getElementById('toast-container');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-container';
        toast.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 10000;';
        document.body.appendChild(toast);
    }
    
    const toastEl = document.createElement('div');
    toastEl.style.cssText = `
        background: ${type === 'success' ? '#34C759' : type === 'error' ? '#FF3B30' : '#007AFF'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    toastEl.textContent = message;
    toast.appendChild(toastEl);
    
    setTimeout(() => {
        toastEl.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toastEl.remove(), 300);
    }, 3000);
}

// Setup Toolbar Google Docs
function setupGoogleDocsToolbar() {
    const editor = document.getElementById('rich-editor');
    if (!editor) return;
    
    // Menus button
    document.getElementById('toolbar-menus')?.addEventListener('click', () => {
        showToast('Menu de opções em desenvolvimento', 'info');
    });
    
    // Undo/Redo
    document.getElementById('toolbar-undo')?.addEventListener('click', () => {
        editor.focus();
        document.execCommand('undo', false, null);
        saveCurrentNote();
    });
    
    document.getElementById('toolbar-redo')?.addEventListener('click', () => {
        editor.focus();
        document.execCommand('redo', false, null);
        saveCurrentNote();
    });
    
    // Print
    document.getElementById('toolbar-print')?.addEventListener('click', () => {
        window.print();
    });
    
    // Spell Check
    document.getElementById('toolbar-spellcheck')?.addEventListener('click', () => {
        editor.focus();
        editor.spellcheck = !editor.spellcheck;
        showToast(editor.spellcheck ? 'Verificação ortográfica ativada' : 'Verificação ortográfica desativada', 'info');
    });
    
    // Paint Format
    document.getElementById('toolbar-paint-format')?.addEventListener('click', () => {
        if (typeof paintFormat === 'function') {
            paintFormat();
        } else {
            editor.focus();
            showToast('Formato de pintura em desenvolvimento', 'info');
        }
    });
    
    // Zoom Dropdown
    setupDropdown('toolbar-zoom', 'zoom-menu', (value) => {
        const zoom = parseInt(value);
        document.body.style.zoom = zoom / 100;
        showToast(`Zoom: ${zoom}%`, 'info');
    });
    
    // Text Style Dropdown
    setupDropdown('toolbar-text-style', 'text-style-menu', (value) => {
        editor.focus();
        const styleMap = {
            'normal': 'p',
            'title': 'h1',
            'subtitle': 'h2',
            'heading1': 'h1',
            'heading2': 'h2',
            'heading3': 'h3'
        };
        const tag = styleMap[value] || 'p';
        document.execCommand('formatBlock', false, `<${tag}>`);
        saveCurrentNote();
    });
    
    // Font Dropdown
    setupDropdown('toolbar-font', 'font-menu', (value) => {
        editor.focus();
        document.execCommand('fontName', false, value);
        saveCurrentNote();
    });
    
    // Font Size Dropdown
    setupDropdown('toolbar-font-size', 'font-size-menu', (value) => {
        editor.focus();
        document.execCommand('fontSize', false, value);
        saveCurrentNote();
    });
    
    // Bold, Italic, Underline
    document.getElementById('toolbar-bold')?.addEventListener('click', () => applyFormat('bold'));
    document.getElementById('toolbar-italic')?.addEventListener('click', () => applyFormat('italic'));
    document.getElementById('toolbar-underline')?.addEventListener('click', () => applyFormat('underline'));
    
    // Text Color & Highlight (reativar - mas já configurado em setupColorPickers)
    // Os event listeners dos botões já estão em setupColorPickers()
    // Mas vamos garantir que os color options também tenham listeners aqui
    const textColorPicker = document.getElementById('text-color-picker');
    const highlightColorPicker = document.getElementById('highlight-color-picker');
    
    // Garantir que color options tenham listeners
    if (textColorPicker) {
        textColorPicker.querySelectorAll('.color-option').forEach(option => {
            // Remover listener antigo se existir
            const newOption = option.cloneNode(true);
            option.parentNode.replaceChild(newOption, option);
            
            // Adicionar novo listener
            newOption.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const color = this.dataset.color;
                if (color) {
                    applyTextColor(color);
                    // Atualizar seleção visual
                    textColorPicker.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
                    this.classList.add('selected');
                }
            });
        });
    }
    
    if (highlightColorPicker) {
        highlightColorPicker.querySelectorAll('.color-option').forEach(option => {
            // Remover listener antigo se existir
            const newOption = option.cloneNode(true);
            option.parentNode.replaceChild(newOption, option);
            
            // Adicionar novo listener
            newOption.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const color = this.dataset.color;
                if (color) {
                    applyHighlight(color);
                    // Atualizar seleção visual
                    highlightColorPicker.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
                    this.classList.add('selected');
                }
            });
        });
    }
    
    // Link, Image, Comment
    document.getElementById('toolbar-link')?.addEventListener('click', insertLink);
    document.getElementById('toolbar-image')?.addEventListener('click', insertImage);
    document.getElementById('toolbar-comment')?.addEventListener('click', () => {
        showModal('modal-comments');
    });
    
    // Alignment
    document.getElementById('toolbar-align-left')?.addEventListener('click', () => applyFormat('alignLeft'));
    document.getElementById('toolbar-align-center')?.addEventListener('click', () => applyFormat('alignCenter'));
    document.getElementById('toolbar-align-right')?.addEventListener('click', () => applyFormat('alignRight'));
    document.getElementById('toolbar-align-justify')?.addEventListener('click', () => {
        editor.focus();
        document.execCommand('justifyFull', false, null);
        saveCurrentNote();
    });
    
    // Line Spacing
    setupDropdown('toolbar-line-spacing', 'line-spacing-menu', (value) => {
        editor.focus();
        const lineHeight = parseFloat(value);
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const selectedElement = range.commonAncestorContainer.nodeType === 3 
                ? range.commonAncestorContainer.parentElement 
                : range.commonAncestorContainer;
            if (selectedElement) {
                selectedElement.style.lineHeight = lineHeight;
                saveCurrentNote();
            }
        }
    });
    
    // Lists
    document.getElementById('toolbar-list-bullet')?.addEventListener('click', () => {
        editor.focus();
        document.execCommand('insertUnorderedList', false, null);
        saveCurrentNote();
    });
    
    document.getElementById('toolbar-list-number')?.addEventListener('click', () => {
        editor.focus();
        document.execCommand('insertOrderedList', false, null);
        saveCurrentNote();
    });
    
    // Indent
    document.getElementById('toolbar-indent-decrease')?.addEventListener('click', () => {
        editor.focus();
        document.execCommand('outdent', false, null);
        saveCurrentNote();
    });
    
    document.getElementById('toolbar-indent-increase')?.addEventListener('click', () => {
        editor.focus();
        document.execCommand('indent', false, null);
        saveCurrentNote();
    });
    
    // Clear Formatting
    document.getElementById('toolbar-clear-format')?.addEventListener('click', () => {
        editor.focus();
        document.execCommand('removeFormat', false, null);
        saveCurrentNote();
    });
    
    // Fechar dropdowns ao clicar fora
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.toolbar-dropdown')) {
            document.querySelectorAll('.toolbar-dropdown').forEach(dd => {
                dd.classList.remove('show');
            });
        }
    });
}

// Helper para configurar dropdowns
function setupDropdown(btnId, menuId, callback) {
    const btn = document.getElementById(btnId);
    const menu = document.getElementById(menuId);
    if (!btn || !menu) return;
    
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dropdown = btn.closest('.toolbar-dropdown');
        dropdown?.classList.toggle('show');
    });
    
    menu.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            const value = item.dataset.value;
            callback(value);
            const dropdown = btn.closest('.toolbar-dropdown');
            dropdown?.classList.remove('show');
            // Atualizar texto do botão
            const btnText = btn.querySelector('span');
            if (btnText) {
                btnText.textContent = item.textContent.trim();
            }
        });
    });
}