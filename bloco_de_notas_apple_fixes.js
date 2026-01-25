// Script para corrigir CSS dinamicamente - Sidebar e Lista de Notas
// Este arquivo deve ser incluído APÓS o CSS principal

(function() {
    'use strict';
    
    // Criar e injetar CSS corrigido
    const style = document.createElement('style');
    style.id = 'bloco-notas-fixes';
    style.textContent = `
        /* SOBREPOSIÇÃO - Sidebar Visível */
        .notebook-sidebar {
            width: var(--apple-sidebar-width) !important;
            background: var(--apple-glass) !important;
            backdrop-filter: var(--apple-blur) !important;
            -webkit-backdrop-filter: var(--apple-blur) !important;
            border-right: 1px solid var(--apple-glass-border) !important;
            display: flex !important;
            flex-direction: column !important;
            box-shadow: 2px 0 20px rgba(0, 0, 0, 0.05) !important;
            z-index: 10 !important;
        }
        
        /* SOBREPOSIÇÃO - Lista de Notas Visível */
        .notes-list-container:not(.hidden) {
            display: block !important;
            flex: 1;
            overflow-y: auto;
            padding: 20px;
        }
        
        /* Garantir que notes-list-container está visível quando há conteúdo */
        .notes-list-container[style*="display: block"],
        .notes-list-container[style*="display:block"] {
            display: block !important;
            visibility: visible !important;
        }
        
        /* Garantir que o container principal use flex para sidebar e main */
        .notebook-container {
            display: flex !important;
        }
        
        /* Ajustar área principal quando sidebar está visível */
        .notebook-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
    `;
    
    // Aguardar DOM estar pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            document.head.appendChild(style);
        });
    } else {
        document.head.appendChild(style);
    }
})();
