// ================= PREVIEW RÁPIDO E DOWNLOAD COM CONFIRMAÇÃO =================

function axisNfBuscarNotaPorId(notaId) {
    if (typeof state !== 'undefined' && state.notasFiscais) {
        return state.notasFiscais.find(function (n) {
            return String(n.id) === String(notaId) || String(n.numero) === String(notaId);
        });
    }
    return null;
}

function fecharModalVisualizarNF() {
    var iframe = document.getElementById('nf-viewer-iframe');
    var img = document.getElementById('nf-viewer-img');
    var modal = document.getElementById('nf-viewer-modal');
    if (iframe) {
        iframe.src = 'about:blank';
        iframe.style.display = 'none';
    }
    if (img) {
        img.removeAttribute('src');
        img.style.display = 'none';
    }
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
}

function abrirModalVisualizarNF(notaId) {
    var nota = axisNfBuscarNotaPorId(notaId);
    if (!nota) {
        if (typeof mostrarToast !== 'undefined') {
            mostrarToast('Nota fiscal não encontrada', 'error');
        }
        return;
    }
    fecharPreviewRapidoNF();

    var modal = document.getElementById('nf-viewer-modal');
    var iframe = document.getElementById('nf-viewer-iframe');
    var img = document.getElementById('nf-viewer-img');
    var fallback = document.getElementById('nf-viewer-fallback');
    var title = document.getElementById('nf-viewer-title');
    var sub = document.getElementById('nf-viewer-sub');
    var dl = document.getElementById('nf-viewer-download');
    if (!modal || !iframe || !img || !fallback) return;

    title.textContent = 'NF-' + (nota.numero || '—');
    sub.textContent =
        (nota.cliente || nota.fornecedor || '—') + ' · ' + formatarData(nota.data);

    iframe.style.display = 'none';
    img.style.display = 'none';
    fallback.style.display = 'none';
    fallback.innerHTML = '';

    var url = nota.arquivoDataUrl || '';
    if (url.indexOf('data:application/pdf') === 0 || url.indexOf('data:application/octet-stream') === 0) {
        iframe.src = url + '#toolbar=0&navpanes=0';
        iframe.style.display = 'block';
    } else if (url.indexOf('data:image/') === 0) {
        img.src = url;
        img.style.display = 'block';
    } else if (url.indexOf('data:text/xml') === 0 || url.indexOf('data:application/xml') === 0) {
        iframe.src = url;
        iframe.style.display = 'block';
    } else {
        fallback.innerHTML =
            '<p class="nf-viewer-fallback-text"><i class="fas fa-file-alt"></i> Pré-visualização indisponível</p>' +
            '<p class="nf-viewer-fallback-hint">O ficheiro não está guardado neste browser (nota antiga ou limite de armazenamento). Faça upload de novo para ver o PDF aqui.</p>';
        fallback.style.display = 'flex';
    }

    if (dl) {
        if (url) {
            dl.href = url;
            dl.download = nota.nomeArquivo || 'NF-' + (nota.numero || notaId) + '.pdf';
            dl.style.display = 'inline-flex';
        } else {
            dl.style.display = 'none';
        }
    }

    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

// Preview rápido (resumo + mini documento quando houver arquivoDataUrl)
function mostrarPreviewRapidoNF(notaId) {
    var nota = axisNfBuscarNotaPorId(notaId);
    if (!nota) {
        if (typeof mostrarToast !== 'undefined') {
            mostrarToast('Nota fiscal não encontrada', 'error');
        }
        return;
    }

    var docMini = '';
    var u = nota.arquivoDataUrl || '';
    if (u.indexOf('data:application/pdf') === 0 || u.indexOf('data:application/octet-stream') === 0) {
        docMini =
            '<div class="nf-preview-doc"><iframe class="nf-preview-doc-iframe" title="Pré-visualização" src="' +
            u +
            '#toolbar=0"></iframe></div>';
    } else if (u.indexOf('data:image/') === 0) {
        docMini = '<div class="nf-preview-doc nf-preview-doc--img"><img src="' + u + '" alt="" /></div>';
    }

    var preview = document.createElement('div');
    preview.id = 'nf-preview-rapido';
    preview.className = 'nf-preview-rapido';

    var statusClass =
        nota.status === 'pago' || nota.status === 'paga'
            ? 'success'
            : nota.status === 'vencido' || nota.status === 'vencida'
              ? 'danger'
              : 'warning';

    preview.innerHTML =
        '<div class="nf-preview-head">' +
        '<div><h3 class="nf-preview-title">NF-' +
        (nota.numero || 'N/A') +
        '</h3>' +
        '<span class="status-badge ' +
        statusClass +
        ' nf-preview-status">' +
        (nota.status || 'pendente') +
        '</span></div>' +
        '<button type="button" class="nf-preview-x" onclick="fecharPreviewRapidoNF()" aria-label="Fechar"><i class="fas fa-times"></i></button></div>' +
        '<div class="nf-preview-body">' +
        docMini +
        '<div class="nf-preview-meta">' +
        '<div class="nf-preview-field"><span class="nf-preview-label">Fornecedor</span><span class="nf-preview-value">' +
        (nota.cliente || nota.fornecedor || 'Não informado') +
        '</span></div>' +
        '<div class="nf-preview-field"><span class="nf-preview-label">Data de emissão</span><span class="nf-preview-value">' +
        formatarData(nota.data) +
        '</span></div>' +
        (nota.dataVencimento
            ? '<div class="nf-preview-field"><span class="nf-preview-label">Vencimento</span><span class="nf-preview-value">' +
              formatarData(nota.dataVencimento) +
              '</span></div>'
            : '') +
        '<div class="nf-preview-field"><span class="nf-preview-label">Valor</span><span class="nf-preview-value nf-preview-valor">' +
        formatarMoeda(nota.valor) +
        '</span></div>' +
        (nota.tamanho
            ? '<div class="nf-preview-field"><span class="nf-preview-label">Tamanho</span><span class="nf-preview-value">' +
              (typeof formatarTamanho === 'function' ? formatarTamanho(nota.tamanho) : nota.tamanho + ' KB') +
              '</span></div>'
            : '') +
        '</div>' +
        '<div class="nf-preview-actions">' +
        '<button type="button" class="nf-preview-btn nf-preview-btn-primary" onclick="fecharPreviewRapidoNF(); abrirModalVisualizarNF(\'' +
        String(notaId).replace(/'/g, "\\'") +
        '\');"><i class="fas fa-expand"></i> Ver documento em ecrã completo</button>' +
        '<button type="button" class="nf-preview-btn nf-preview-btn-secondary" onclick="fecharPreviewRapidoNF(); editarNF(\'' +
        String(notaId).replace(/'/g, "\\'") +
        '\');"><i class="fas fa-edit"></i> Editar</button></div></div>';

    document.body.appendChild(preview);

    var overlay = document.createElement('div');
    overlay.id = 'nf-preview-overlay';
    overlay.className = 'nf-preview-overlay';
    overlay.onclick = fecharPreviewRapidoNF;
    document.body.appendChild(overlay);
    
    // Animações CSS
    if (!document.getElementById('nf-preview-styles')) {
        const style = document.createElement('style');
        style.id = 'nf-preview-styles';
        style.textContent = `
            @keyframes previewFadeIn {
                from {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

function fecharPreviewRapidoNF() {
    const preview = document.getElementById('nf-preview-rapido');
    const overlay = document.getElementById('nf-preview-overlay');
    if (preview) preview.remove();
    if (overlay) overlay.remove();
}

function abrirVisualizadorPDFCompleto(notaId) {
    abrirModalVisualizarNF(notaId);
}

// Download com confirmação em vidro
function confirmarDownloadPDF(notaId) {
    var nota = axisNfBuscarNotaPorId(notaId);

    if (!nota) {
        if (typeof mostrarToast !== 'undefined') {
            mostrarToast('Nota fiscal não encontrada', 'error');
        }
        return;
    }
    
    // Modal de confirmação em vidro
    const modal = document.createElement('div');
    modal.id = 'nf-download-confirm';
    modal.className = 'nf-download-confirm';
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 450px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(40px) saturate(180%);
        -webkit-backdrop-filter: blur(40px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        padding: 32px;
        animation: previewFadeIn 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: linear-gradient(135deg, rgba(0, 122, 255, 0.2), rgba(0, 122, 255, 0.1)); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; color: var(--accent-blue);">
                <i class="fas fa-download"></i>
            </div>
            <h3 style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: var(--text-main);">Baixar Nota Fiscal?</h3>
            <p style="margin: 0; font-size: 14px; color: var(--text-secondary);">NF-${nota.numero || 'N/A'} - ${nota.cliente || nota.fornecedor || 'Fornecedor'}</p>
        </div>
        <div style="display: flex; gap: 12px;">
            <button onclick="fecharConfirmDownload();" style="flex: 1; padding: 12px; background: rgba(0, 0, 0, 0.1); color: var(--text-main); border: none; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
                Cancelar
            </button>
            <button onclick="fecharConfirmDownload(); executarDownloadPDF('${notaId}');" style="flex: 1; padding: 12px; background: var(--accent-blue); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
                <i class="fas fa-download"></i> Baixar
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Overlay
    const overlay = document.createElement('div');
    overlay.id = 'nf-download-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        z-index: 9999;
        animation: fadeIn 0.3s ease;
    `;
    overlay.onclick = fecharConfirmDownload;
    document.body.appendChild(overlay);
}

function fecharConfirmDownload() {
    const modal = document.getElementById('nf-download-confirm');
    const overlay = document.getElementById('nf-download-overlay');
    if (modal) modal.remove();
    if (overlay) overlay.remove();
}

function executarDownloadPDF(notaId) {
    var nota = axisNfBuscarNotaPorId(notaId);
    if (!nota) return;

    if (nota.arquivoDataUrl) {
        var a = document.createElement('a');
        a.href = nota.arquivoDataUrl;
        a.download = nota.nomeArquivo || 'NF-' + (nota.numero || notaId) + '.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        if (typeof mostrarToast !== 'undefined') {
            mostrarToast('Download de NF-' + (nota.numero || notaId) + ' iniciado', 'success');
        }
        return;
    }

    if (typeof mostrarToast !== 'undefined') {
        mostrarToast('Sem ficheiro guardado para download — faça upload do PDF novamente.', 'warning');
    }
}

// Sobrescrever funções existentes
if (typeof visualizarNF !== 'undefined') {
    window.visualizarNFOriginal = visualizarNF;
}
window.visualizarNF = mostrarPreviewRapidoNF;

if (typeof baixarPDF !== 'undefined') {
    window.baixarPDFOriginal = baixarPDF;
}
window.baixarPDF = confirmarDownloadPDF;

// Exportar funções
window.axisNfBuscarNotaPorId = axisNfBuscarNotaPorId;
window.abrirModalVisualizarNF = abrirModalVisualizarNF;
window.fecharModalVisualizarNF = fecharModalVisualizarNF;
window.mostrarPreviewRapidoNF = mostrarPreviewRapidoNF;
window.fecharPreviewRapidoNF = fecharPreviewRapidoNF;
window.abrirVisualizadorPDFCompleto = abrirVisualizadorPDFCompleto;
window.confirmarDownloadPDF = confirmarDownloadPDF;
window.fecharConfirmDownload = fecharConfirmDownload;
window.executarDownloadPDF = executarDownloadPDF;

(function bindNfViewerEscapeOnce() {
    if (window._nfViewerEscBound) return;
    window._nfViewerEscBound = true;
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        var modal = document.getElementById('nf-viewer-modal');
        if (!modal || modal.getAttribute('aria-hidden') !== 'false') return;
        if (typeof window.fecharModalVisualizarNF === 'function') {
            window.fecharModalVisualizarNF();
        }
    });
})();

console.log('✅ Preview rápido e download com confirmação carregados!');
