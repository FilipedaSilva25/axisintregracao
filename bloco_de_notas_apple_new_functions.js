// ============================================
// BLOCo DE NOTAS APPLE - 30+ FUNÇÕES NOVAS
// Funções avançadas e correções de botões
// ============================================

// Helper para escape HTML (se não existir)
if (typeof escapeHtml === 'undefined') {
    window.escapeHtml = function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };
}

// 1. INSERT LINK - Corrigido e melhorado (Sobrescreve versão antiga)
window.insertLink = function() {
    const editor = document.getElementById('rich-editor');
    if (!editor) return;
    
    const url = prompt('Digite ou cole o link:');
    if (!url) return;
    
    const selection = window.getSelection();
    if (selection.rangeCount === 0 || selection.toString().trim() === '') {
        const linkText = url;
        document.execCommand('insertHTML', false, `<a href="${escapeHtml(url)}" target="_blank">${escapeHtml(linkText)}</a>`);
    } else {
        document.execCommand('createLink', false, url);
        // Adicionar target="_blank" manualmente
        const links = editor.querySelectorAll('a[href="' + url + '"]');
        links.forEach(link => {
            if (!link.getAttribute('target')) {
                link.setAttribute('target', '_blank');
            }
        });
    }
    
    editor.focus();
    saveCurrentNote();
    showToast('Link inserido com sucesso!', 'success');
}

// 2. INSERT IMAGE - Corrigido e melhorado (Sobrescreve versão antiga)
window.insertImage = function() {
    const editor = document.getElementById('rich-editor');
    if (!editor) return;
    
    const url = prompt('Digite a URL da imagem ou cole um link:');
    if (!url) return;
    
    editor.focus();
    const img = document.createElement('img');
    img.src = url;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.borderRadius = '8px';
    img.style.margin = '10px 0';
    img.onerror = function() {
        this.style.display = 'none';
        showToast('Erro ao carregar imagem. Verifique a URL.', 'error');
    };
    
    const range = window.getSelection().getRangeAt(0);
    range.insertNode(img);
    range.collapse(false);
    
    saveCurrentNote();
    showToast('Imagem inserida!', 'success');
}

// 3. PAINT FORMAT - Implementado (Sobrescreve se existir)
let paintFormatState = null;

window.paintFormat = function() {
    const editor = document.getElementById('rich-editor');
    if (!editor) return;
    
    if (!paintFormatState) {
        // Primeira vez - capturar formatação
        const selection = window.getSelection();
        if (selection.rangeCount === 0 || selection.toString().trim() === '') {
            showToast('Selecione o texto com a formatação desejada', 'info');
            return;
        }
        
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer.nodeType === 3 
            ? range.commonAncestorContainer.parentElement 
            : range.commonAncestorContainer;
        
        paintFormatState = {
            fontFamily: window.getComputedStyle(container).fontFamily,
            fontSize: window.getComputedStyle(container).fontSize,
            fontWeight: window.getComputedStyle(container).fontWeight,
            fontStyle: window.getComputedStyle(container).fontStyle,
            color: window.getComputedStyle(container).color,
            backgroundColor: window.getComputedStyle(container).backgroundColor
        };
        
        showToast('Formatação capturada! Agora selecione o texto para aplicar.', 'success');
        
        // Adicionar classe visual
        const btn = document.getElementById('toolbar-paint-format');
        if (btn) btn.classList.add('active');
    } else {
        // Segunda vez - aplicar formatação
        const selection = window.getSelection();
        if (selection.rangeCount === 0 || selection.toString().trim() === '') {
            showToast('Selecione o texto para aplicar a formatação', 'info');
            return;
        }
        
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.fontFamily = paintFormatState.fontFamily;
        span.style.fontSize = paintFormatState.fontSize;
        span.style.fontWeight = paintFormatState.fontWeight;
        span.style.fontStyle = paintFormatState.fontStyle;
        span.style.color = paintFormatState.color;
        span.style.backgroundColor = paintFormatState.backgroundColor;
        
        try {
            const contents = range.extractContents();
            span.appendChild(contents);
            range.insertNode(span);
        } catch (e) {
            // Fallback
            document.execCommand('foreColor', false, paintFormatState.color);
            document.execCommand('backColor', false, paintFormatState.backgroundColor);
        }
        
        paintFormatState = null;
        const btn = document.getElementById('toolbar-paint-format');
        if (btn) btn.classList.remove('active');
        
        saveCurrentNote();
        showToast('Formatação aplicada!', 'success');
    }
}

// 4. DUPLICAR NOTA
function duplicateNote(noteId) {
    const note = notebookData.notes[noteId];
    if (!note) return;
    
    const newId = 'note-' + Date.now();
    const duplicated = {
        ...note,
        id: newId,
        title: note.title + ' (Cópia)',
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    };
    
    notebookData.notes[newId] = duplicated;
    saveData();
    renderNotes();
    openNote(newId);
    showToast('Nota duplicada com sucesso!', 'success');
}

// 5. MOVER NOTA PARA PASTA
function moveNoteToFolder(noteId, folderId) {
    const note = notebookData.notes[noteId];
    if (!note) return;
    
    note.folder = folderId;
    saveData();
    renderNotes();
    showToast(`Nota movida para "${folderId === 'root' ? 'Todas as Notas' : notebookData.folders[folderId]?.name}"`, 'success');
}

// 6. COPIAR CONTEÚDO DA NOTA
function copyNoteContent(noteId) {
    const note = notebookData.notes[noteId];
    if (!note) return;
    
    const plainText = note.content.replace(/<[^>]*>/g, '');
    navigator.clipboard.writeText(plainText).then(() => {
        showToast('Conteúdo copiado para a área de transferência!', 'success');
    });
}

// 7. CONTAR PALAVRAS E CARACTERES (MELHORADO)
function updateWordCount() {
    const editor = document.getElementById('rich-editor');
    if (!editor) return;
    
    const text = editor.innerText || editor.textContent || '';
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    
    // Atualizar estatísticas
    notebookData.statistics.totalWords = words.length;
    
    // Mostrar no footer se existir
    const footer = document.querySelector('.editor-footer');
    if (footer) {
        const countEl = footer.querySelector('.word-count');
        if (!countEl) {
            const countDiv = document.createElement('div');
            countDiv.className = 'word-count';
            countDiv.style.cssText = 'font-size: 12px; color: #666;';
            footer.appendChild(countDiv);
        }
        footer.querySelector('.word-count').textContent = `${words.length} palavras • ${characters} caracteres`;
    }
}

// 8. ENCONTRAR E SUBSTITUIR
function findAndReplace() {
    const find = prompt('Texto para encontrar:');
    if (!find) return;
    
    const replace = prompt('Substituir por:') || '';
    const editor = document.getElementById('rich-editor');
    if (!editor) return;
    
    const content = editor.innerHTML;
    const regex = new RegExp(escapeHtml(find), 'gi');
    editor.innerHTML = content.replace(regex, escapeHtml(replace));
    
    saveCurrentNote();
    showToast('Substituição concluída!', 'success');
}

// 9. INSERIR TABELA
function insertTable() {
    const rows = parseInt(prompt('Número de linhas:', '3')) || 3;
    const cols = parseInt(prompt('Número de colunas:', '3')) || 3;
    
    const editor = document.getElementById('rich-editor');
    if (!editor) return;
    
    let tableHTML = '<table style="border-collapse: collapse; width: 100%; margin: 10px 0;">';
    for (let i = 0; i < rows; i++) {
        tableHTML += '<tr>';
        for (let j = 0; j < cols; j++) {
            tableHTML += '<td style="border: 1px solid #ddd; padding: 8px;">&nbsp;</td>';
        }
        tableHTML += '</tr>';
    }
    tableHTML += '</table>';
    
    editor.focus();
    document.execCommand('insertHTML', false, tableHTML);
    saveCurrentNote();
    showToast(`Tabela ${rows}x${cols} inserida!`, 'success');
}

// 10. INSERIR HORIZONTAL RULE
function insertHorizontalRule() {
    const editor = document.getElementById('rich-editor');
    if (!editor) return;
    
    editor.focus();
    document.execCommand('insertHorizontalRule', false, null);
    saveCurrentNote();
}

// 11. INSERIR DATA/HORA
function insertDateTime() {
    const editor = document.getElementById('rich-editor');
    if (!editor) return;
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR');
    
    editor.focus();
    document.execCommand('insertText', false, `${dateStr} ${timeStr}`);
    saveCurrentNote();
}

// 12. INSERIR EMOJI
function insertEmoji(emoji) {
    const editor = document.getElementById('rich-editor');
    if (!editor) return;
    
    if (!emoji) {
        // Mostrar picker de emoji simples
        const emojis = ['😀', '😂', '❤️', '👍', '🔥', '⭐', '📝', '📌', '✅', '❌', '💡', '🎯', '🚀', '💻', '📱'];
        const selected = prompt(`Escolha um emoji (digite o número):\n${emojis.map((e, i) => `${i + 1}. ${e}`).join('\n')}`);
        emoji = emojis[parseInt(selected) - 1];
        if (!emoji) return;
    }
    
    editor.focus();
    document.execCommand('insertText', false, emoji);
    saveCurrentNote();
}

// 13. TRANSLATE TEXT (Usando API básica)
function translateText(text, targetLang = 'en') {
    // Implementação básica - pode ser conectada a API real
    showToast('Tradução em desenvolvimento. Use Google Translate para traduzir o texto.', 'info');
}

// 14. GERAR RESUMO AUTOMÁTICO
function generateSummary(noteId) {
    const note = notebookData.notes[noteId];
    if (!note) return;
    
    const text = note.content.replace(/<[^>]*>/g, '');
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const summary = sentences.slice(0, 3).join('. ') + '.';
    
    const editor = document.getElementById('rich-editor');
    if (editor && notebookData.currentNote === noteId) {
        editor.focus();
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand('insertHTML', false, `<p><strong>Resumo:</strong> ${escapeHtml(summary)}</p>`);
        saveCurrentNote();
    }
    
    showToast('Resumo gerado!', 'success');
}

// 15. CONVERTER PARA MARKDOWN
function convertToMarkdown(noteId) {
    const note = notebookData.notes[noteId];
    if (!note) return;
    
    let md = `# ${note.title}\n\n`;
    md += note.content.replace(/<h1>/gi, '# ').replace(/<h2>/gi, '## ')
        .replace(/<h3>/gi, '### ').replace(/<strong>/gi, '**').replace(/<\/strong>/gi, '**')
        .replace(/<em>/gi, '*').replace(/<\/em>/gi, '*')
        .replace(/<p>/gi, '').replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]*>/g, '');
    
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title || 'nota'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Markdown exportado!', 'success');
}

// 16. COMPARTILHAR NOTA VIA WHATSAPP
function shareNoteViaWhatsApp(noteId) {
    const note = notebookData.notes[noteId];
    if (!note) return;
    
    const text = note.content.replace(/<[^>]*>/g, '').substring(0, 500);
    const url = `https://wa.me/?text=${encodeURIComponent(`*${note.title}*\n\n${text}`)}`;
    window.open(url, '_blank');
    showToast('Compartilhando no WhatsApp...', 'info');
}

// 17. COMPARTILHAR NOTA VIA EMAIL
function shareNoteViaEmail(noteId) {
    const note = notebookData.notes[noteId];
    if (!note) return;
    
    const subject = encodeURIComponent(note.title);
    const body = encodeURIComponent(note.content.replace(/<[^>]*>/g, ''));
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    showToast('Abrindo cliente de email...', 'info');
}

// 18. COMPRIMIR IMAGENS NA NOTA
function compressImagesInNote(noteId) {
    const note = notebookData.notes[noteId];
    if (!note) return;
    
    const editor = document.getElementById('rich-editor');
    if (!editor) return;
    
    const images = editor.querySelectorAll('img');
    if (images.length === 0) {
        showToast('Nenhuma imagem encontrada na nota', 'info');
        return;
    }
    
    showToast('Compressão de imagens em desenvolvimento', 'info');
    // Implementação futura com canvas API
}

// 19. APLICAR TEMPLATE
function applyTemplate(templateId) {
    const template = notebookData.templates[templateId];
    if (!template) return;
    
    const editor = document.getElementById('rich-editor');
    if (!editor) return;
    
    editor.innerHTML = template.content;
    saveCurrentNote();
    showToast(`Template "${template.name}" aplicado!`, 'success');
}

// 20. SALVAR COMO TEMPLATE
function saveAsTemplate(noteId) {
    const note = notebookData.notes[noteId];
    if (!note) return;
    
    const name = prompt('Nome do template:');
    if (!name) return;
    
    const templateId = 'template-' + Date.now();
    notebookData.templates[templateId] = {
        id: templateId,
        name: name,
        content: note.content,
        created: new Date().toISOString()
    };
    
    saveData();
    showToast('Template salvo com sucesso!', 'success');
}

// 21. COMPARAR NOTAS (DIFF)
function compareNotes(noteId1, noteId2) {
    const note1 = notebookData.notes[noteId1];
    const note2 = notebookData.notes[noteId2];
    
    if (!note1 || !note2) {
        showToast('Selecione duas notas para comparar', 'info');
        return;
    }
    
    const text1 = note1.content.replace(/<[^>]*>/g, '');
    const text2 = note2.content.replace(/<[^>]*>/g, '');
    
    // Comparação simples - pode ser melhorada
    const similar = calculateSimilarity(text1, text2);
    showToast(`Similaridade entre as notas: ${Math.round(similar * 100)}%`, 'info');
}

// 22. CALCULAR SIMILARIDADE (Helper)
function calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
}

// 23. LEVENSHTEIN DISTANCE (Helper)
function levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[str2.length][str1.length];
}

// 24. GERAR ÍNDICE AUTOMÁTICO
function generateTableOfContents(noteId) {
    const note = notebookData.notes[noteId];
    if (!note) return;
    
    const editor = document.getElementById('rich-editor');
    if (!editor) return;
    
    const headings = editor.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0) {
        showToast('Nenhum cabeçalho encontrado na nota', 'info');
        return;
    }
    
    let toc = '<div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; background: #f9f9f9; border-radius: 5px;"><h3>Índice</h3><ul>';
    headings.forEach(heading => {
        const level = parseInt(heading.tagName.charAt(1));
        const indent = (level - 1) * 20;
        toc += `<li style="margin-left: ${indent}px;"><a href="#${heading.id || ''}">${heading.textContent}</a></li>`;
    });
    toc += '</ul></div>';
    
    editor.focus();
    const range = document.createRange();
    range.setStart(editor, 0);
    range.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand('insertHTML', false, toc);
    
    saveCurrentNote();
    showToast('Índice gerado!', 'success');
}

// 25. REMOVER FORMATAÇÃO DE TEXTOS COLADOS
function pasteAsPlainText() {
    const editor = document.getElementById('rich-editor');
    if (!editor) return;
    
    editor.addEventListener('paste', function(e) {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    }, { once: true });
    
    showToast('Cole o texto (será inserido sem formatação)', 'info');
}

// 26. INSERIR CITATION
function insertCitation(author, title, year) {
    const editor = document.getElementById('rich-editor');
    if (!editor) return;
    
    if (!author) {
        author = prompt('Autor:') || '';
    }
    if (!title) {
        title = prompt('Título:') || '';
    }
    if (!year) {
        year = prompt('Ano:') || '';
    }
    
    const citation = `(${author}, ${year})`;
    editor.focus();
    document.execCommand('insertText', false, citation);
    saveCurrentNote();
}

// 27. CONVERTER CASE
function convertCase(caseType) {
    const editor = document.getElementById('rich-editor');
    if (!editor) return;
    
    const selection = window.getSelection();
    if (selection.rangeCount === 0 || selection.toString().trim() === '') {
        showToast('Selecione o texto para converter', 'info');
        return;
    }
    
    const text = selection.toString();
    let converted = text;
    
    switch(caseType) {
        case 'upper':
            converted = text.toUpperCase();
            break;
        case 'lower':
            converted = text.toLowerCase();
            break;
        case 'title':
            converted = text.replace(/\w\S*/g, (txt) => 
                txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            );
            break;
        case 'sentence':
            converted = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
            break;
    }
    
    document.execCommand('insertText', false, converted);
    saveCurrentNote();
}

// 28. INSERIR WATERMARK
function insertWatermark(text) {
    const editor = document.getElementById('rich-editor');
    if (!editor) return;
    
    if (!text) {
        text = prompt('Texto da marca d\'água:') || 'CONFIDENCIAL';
    }
    
    const watermark = document.createElement('div');
    watermark.textContent = text;
    watermark.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 72px; color: rgba(0,0,0,0.1); pointer-events: none; z-index: 9999; font-weight: bold;';
    document.body.appendChild(watermark);
    
    setTimeout(() => {
        watermark.remove();
    }, 3000);
    
    showToast('Marca d\'água exibida (apenas visual)', 'info');
}

// 29. EXPORTAR PARA DOCX (BÁSICO)
function exportToDocx(noteId) {
    const note = notebookData.notes[noteId];
    if (!note) return;
    
    // Implementação básica - gera HTML que pode ser aberto no Word
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${escapeHtml(note.title)}</title>
</head>
<body>
    <h1>${escapeHtml(note.title)}</h1>
    ${note.content}
</body>
</html>`;
    
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title || 'nota'}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Documento Word exportado!', 'success');
}

// 30. BACKUP AUTOMÁTICO
function enableAutoBackup(intervalMinutes = 30) {
    setInterval(() => {
        const backup = JSON.stringify(notebookData);
        localStorage.setItem('notebook_backup_' + Date.now(), backup);
        
        // Manter apenas últimos 5 backups
        const backups = Object.keys(localStorage)
            .filter(k => k.startsWith('notebook_backup_'))
            .sort()
            .slice(-5);
        
        Object.keys(localStorage)
            .filter(k => k.startsWith('notebook_backup_') && !backups.includes(k))
            .forEach(k => localStorage.removeItem(k));
        
        showToast('Backup automático realizado!', 'success');
    }, intervalMinutes * 60 * 1000);
    
    showToast(`Backup automático ativado (a cada ${intervalMinutes} minutos)`, 'success');
}

// 31. RESTAURAR BACKUP
function restoreBackup() {
    const backups = Object.keys(localStorage)
        .filter(k => k.startsWith('notebook_backup_'))
        .sort()
        .reverse();
    
    if (backups.length === 0) {
        showToast('Nenhum backup encontrado', 'error');
        return;
    }
    
    const latest = localStorage.getItem(backups[0]);
    if (confirm('Restaurar o backup mais recente? Isso substituirá seus dados atuais.')) {
        notebookData = JSON.parse(latest);
        saveData();
        renderFolders();
        renderNotes();
        showToast('Backup restaurado com sucesso!', 'success');
    }
}

// Todas as funções já estão sendo exportadas via window.* no início
// Exportações adicionais apenas se necessário
window.moveNoteToFolder = moveNoteToFolder;
window.copyNoteContent = copyNoteContent;
window.findAndReplace = findAndReplace;
window.insertTable = insertTable;
window.insertHorizontalRule = insertHorizontalRule;
window.insertDateTime = insertDateTime;
window.insertEmoji = insertEmoji;
window.generateSummary = generateSummary;
window.convertToMarkdown = convertToMarkdown;
window.shareNoteViaWhatsApp = shareNoteViaWhatsApp;
window.shareNoteViaEmail = shareNoteViaEmail;
window.applyTemplate = applyTemplate;
window.saveAsTemplate = saveAsTemplate;
window.compareNotes = compareNotes;
window.generateTableOfContents = generateTableOfContents;
window.pasteAsPlainText = pasteAsPlainText;
window.insertCitation = insertCitation;
window.convertCase = convertCase;
window.insertWatermark = insertWatermark;
window.exportToDocx = exportToDocx;
window.enableAutoBackup = enableAutoBackup;
window.restoreBackup = restoreBackup;
