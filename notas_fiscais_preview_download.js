// ================= PREVIEW RÁPIDO E DOWNLOAD COM CONFIRMAÇÃO =================

// Preview rápido estilo WhatsApp
function mostrarPreviewRapidoNF(notaId) {
    let nota = null;
    
    if (typeof state !== 'undefined' && state.notasFiscais) {
        nota = state.notasFiscais.find(function(n) {
            return (n.id || n.numero) === notaId;
        });
    }
    
    if (!nota) {
        if (typeof mostrarToast !== 'undefined') {
            mostrarToast('Nota fiscal não encontrada', 'error');
        }
        return;
    }
    
    // Criar preview rápido
    const preview = document.createElement('div');
    preview.id = 'nf-preview-rapido';
    preview.className = 'nf-preview-rapido';
    preview.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(40px) saturate(180%);
        -webkit-backdrop-filter: blur(40px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        padding: 0;
        overflow: hidden;
        animation: previewFadeIn 0.3s ease;
    `;
    
    const statusClass = nota.status === 'pago' || nota.status === 'paga' ? 'success' : 
                       nota.status === 'vencido' || nota.status === 'vencida' ? 'danger' : 
                       'warning';
    
    preview.innerHTML = `
        <div style="background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(0, 122, 255, 0.05)); padding: 24px; border-bottom: 1px solid rgba(0, 0, 0, 0.1); display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h3 style="margin: 0; font-size: 20px; font-weight: 700; color: var(--text-main);">NF-${nota.numero || 'N/A'}</h3>
                <span class="status-badge ${statusClass}" style="margin-top: 8px; display: inline-block;">${nota.status || 'pendente'}</span>
            </div>
            <button onclick="fecharPreviewRapidoNF()" style="width: 36px; height: 36px; border: none; background: rgba(0, 0, 0, 0.1); border-radius: 50%; cursor: pointer; color: var(--text-main); font-size: 18px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div style="padding: 24px; overflow-y: auto; max-height: calc(80vh - 100px);">
            <div style="margin-bottom: 20px;">
                <label style="display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Fornecedor</label>
                <div style="font-size: 16px; font-weight: 600; color: var(--text-main);">${nota.cliente || nota.fornecedor || 'Não informado'}</div>
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Data de Emissão</label>
                <div style="font-size: 16px; color: var(--text-main);">${formatarData(nota.data)}</div>
            </div>
            ${nota.dataVencimento ? `
            <div style="margin-bottom: 20px;">
                <label style="display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Data de Vencimento</label>
                <div style="font-size: 16px; color: var(--text-main);">${formatarData(nota.dataVencimento)}</div>
            </div>
            ` : ''}
            <div style="margin-bottom: 20px;">
                <label style="display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Valor</label>
                <div style="font-size: 24px; font-weight: 700; color: var(--accent-blue);">${formatarMoeda(nota.valor)}</div>
            </div>
            ${nota.cnpj ? `
            <div style="margin-bottom: 20px;">
                <label style="display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">CNPJ</label>
                <div style="font-size: 16px; color: var(--text-main);">${nota.cnpj}</div>
            </div>
            ` : ''}
            ${nota.tamanho ? `
            <div style="margin-bottom: 20px;">
                <label style="display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Tamanho</label>
                <div style="font-size: 16px; color: var(--text-main);">${formatarTamanho ? formatarTamanho(nota.tamanho) : (nota.tamanho + ' KB')}</div>
            </div>
            ` : ''}
            <div style="display: flex; gap: 12px; margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(0, 0, 0, 0.1);">
                <button onclick="fecharPreviewRapidoNF(); abrirVisualizadorPDFCompleto('${notaId}');" style="flex: 1; padding: 12px; background: var(--accent-blue); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
                    <i class="fas fa-eye"></i> Ver Completo
                </button>
                <button onclick="fecharPreviewRapidoNF(); editarNF('${notaId}');" style="flex: 1; padding: 12px; background: rgba(0, 0, 0, 0.1); color: var(--text-main); border: none; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
                    <i class="fas fa-edit"></i> Editar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(preview);
    
    // Adicionar overlay
    const overlay = document.createElement('div');
    overlay.id = 'nf-preview-overlay';
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
    // Implementar visualização completa do PDF
    if (typeof abrirDetalhesNF !== 'undefined') {
        abrirDetalhesNF(notaId);
    }
}

// Download com confirmação em vidro
function confirmarDownloadPDF(notaId) {
    let nota = null;
    
    if (typeof state !== 'undefined' && state.notasFiscais) {
        nota = state.notasFiscais.find(function(n) {
            return (n.id || n.numero) === notaId;
        });
    }
    
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
    let nota = null;
    
    if (typeof state !== 'undefined' && state.notasFiscais) {
        nota = state.notasFiscais.find(function(n) {
            return (n.id || n.numero) === notaId;
        });
    }
    
    if (!nota) return;
    
    // Simular download
    if (typeof mostrarToast !== 'undefined') {
        mostrarToast('Preparando download de NF-' + (nota.numero || notaId), 'success');
    }
    
    // Criar download simulado
    const data = JSON.stringify(nota, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NF-${nota.numero || notaId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
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
window.mostrarPreviewRapidoNF = mostrarPreviewRapidoNF;
window.fecharPreviewRapidoNF = fecharPreviewRapidoNF;
window.confirmarDownloadPDF = confirmarDownloadPDF;
window.fecharConfirmDownload = fecharConfirmDownload;
window.executarDownloadPDF = executarDownloadPDF;

console.log('✅ Preview rápido e download com confirmação carregados!');
