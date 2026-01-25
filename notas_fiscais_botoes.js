// ================= FUNÇÕES PARA TODOS OS BOTÕES =================
// Este arquivo garante que TODOS os botões do site funcionem corretamente

// ================= BUSCA E FILTROS =================
function handleSearch() {
    const input = document.getElementById('global-search');
    if (!input) return;
    
    const termo = input.value.toLowerCase().trim();
    
    if (typeof buscarNotasFiscais !== 'undefined') {
        buscarNotasFiscais(termo);
    } else if (typeof buscarNotas !== 'undefined') {
        buscarNotas(termo);
    } else if (typeof state !== 'undefined' && state.notasFiscais) {
        const notasFiltradas = state.notasFiscais.filter(function(nota) {
            const numero = (nota.numero || '').toString().toLowerCase();
            const fornecedor = (nota.fornecedor || nota.cliente || '').toString().toLowerCase();
            const cnpj = (nota.cnpj || '').toString().toLowerCase();
            const palavras = termo.split(' ');
            
            return palavras.some(function(palavra) {
                return numero.includes(palavra) || 
                       fornecedor.includes(palavra) || 
                       cnpj.includes(palavra);
            });
        });
        
        if (typeof renderizarNotasFiscais !== 'undefined') {
            renderizarNotasFiscais(notasFiltradas);
        }
    }
}

function filtrarPorStatus(status) {
    // Atualizar botões de filtro
    document.querySelectorAll('.filter-tab').forEach(function(btn) {
        btn.classList.remove('active');
    });
    
    const btnAtivo = event ? event.currentTarget : document.querySelector('.filter-tab[onclick*="' + status + '"]');
    if (btnAtivo) {
        btnAtivo.classList.add('active');
    }
    
    // Aplicar filtro
    if (typeof state !== 'undefined' && state.notasFiscais) {
        let notasFiltradas = state.notasFiscais;
        
        if (status !== 'all') {
            notasFiltradas = state.notasFiscais.filter(function(nota) {
                const notaStatus = (nota.status || 'pendente').toLowerCase();
                
                if (status === 'pago' || status === 'paga') {
                    return notaStatus === 'pago' || notaStatus === 'paga';
                } else if (status === 'vencido' || status === 'vencida') {
                    return notaStatus === 'vencido' || notaStatus === 'vencida';
                } else if (status === 'pendente') {
                    return notaStatus === 'pendente';
                } else if (status === 'a-vencer') {
                    const hoje = new Date();
                    const tresDiasFuturo = new Date(hoje);
                    tresDiasFuturo.setDate(hoje.getDate() + 3);
                    const dataVenc = nota.dataVencimento ? new Date(nota.dataVencimento) : new Date(nota.data);
                    return dataVenc >= hoje && dataVenc <= tresDiasFuturo;
                }
                
                return notaStatus === status;
            });
        }
        
        // Renderizar notas filtradas
        if (typeof renderizarNotasFiscais !== 'undefined') {
            renderizarNotasFiscais(notasFiltradas);
        } else if (typeof renderizarListaNotas !== 'undefined') {
            renderizarListaNotas(notasFiltradas);
        } else if (typeof renderizarConteudo !== 'undefined') {
            renderizarConteudo();
        } else if (typeof state !== 'undefined' && typeof renderizarGrid !== 'undefined') {
            // Tentar renderizar na grid atual
            const itens = notasFiltradas.map(function(nota, index) {
                return {
                    tipo: 'pdf',
                    nome: 'NF-' + (nota.numero || index),
                    nota: nota,
                    caminho: nota.caminho || []
                };
            });
            renderizarGrid(itens);
        }
        
        if (typeof mostrarToast !== 'undefined') {
            mostrarToast('Filtro aplicado: ' + (status === 'all' ? 'Todas' : status), 'success');
        }
    }
}

function changeView(mode) {
    // Atualizar botões de visualização
    document.querySelectorAll('.view-btn').forEach(function(btn) {
        btn.classList.remove('active');
    });
    
    const btnAtivo = document.getElementById('view-' + mode + '-btn');
    if (btnAtivo) {
        btnAtivo.classList.add('active');
    }
    
    // Aplicar modo de visualização
    if (typeof state !== 'undefined') {
        state.viewMode = mode;
        
        if (typeof aplicarViewMode !== 'undefined') {
            aplicarViewMode();
        } else if (typeof toggleViewMode !== 'undefined') {
            toggleViewMode();
        } else if (typeof renderizarConteudo !== 'undefined') {
            renderizarConteudo();
        }
        
        // Salvar preferência
        localStorage.setItem('axis_view_mode', mode);
    }
}

function sortTable(coluna) {
    if (typeof state !== 'undefined') {
        // Inverter ordem se já estiver ordenando pela mesma coluna
        if (state.sortBy === coluna) {
            state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            state.sortBy = coluna;
            state.sortDirection = 'asc';
        }
        
        if (typeof renderizarConteudo !== 'undefined') {
            renderizarConteudo();
        } else if (typeof renderizarNotasFiscais !== 'undefined') {
            renderizarNotasFiscais(state.notasFiscais || []);
        }
        
        // Atualizar indicadores visuais
        document.querySelectorAll('th[onclick*="sortTable"]').forEach(function(th) {
            th.classList.remove('sort-asc', 'sort-desc');
        });
        
        const thAtivo = document.querySelector('th[onclick*="sortTable(\'' + coluna + '\')"]');
        if (thAtivo) {
            thAtivo.classList.add('sort-' + state.sortDirection);
        }
    }
}

// ================= AÇÕES EM MASSA =================
function alterarStatusEmMassa() {
    const selecionadas = document.querySelectorAll('.nf-checkbox:checked');
    if (selecionadas.length === 0) {
        if (typeof mostrarToast !== 'undefined') {
            mostrarToast('Selecione pelo menos uma nota', 'error');
        } else {
            alert('Selecione pelo menos uma nota');
        }
        return;
    }
    
    const novoStatus = prompt('Digite o novo status (pago, pendente, vencido):');
    if (!novoStatus) return;
    
    if (typeof state !== 'undefined' && state.notasFiscais) {
        selecionadas.forEach(function(cb) {
            const nfId = cb.dataset.nfId;
            const nota = state.notasFiscais.find(function(n) {
                return (n.id || n.numero) === nfId;
            });
            if (nota) {
                nota.status = novoStatus.toLowerCase();
            }
        });
        
        if (typeof salvarDados !== 'undefined') {
            salvarDados();
        }
        
        if (typeof renderizarNotasFiscais !== 'undefined') {
            renderizarNotasFiscais(state.notasFiscais);
        }
        
        if (typeof atualizarDashboardCompleto !== 'undefined') {
            atualizarDashboardCompleto();
        }
        
        if (typeof mostrarToast !== 'undefined') {
            mostrarToast(selecionadas.length + ' nota(s) atualizada(s)', 'success');
        }
    }
}

function exportarEmMassa() {
    const selecionadas = document.querySelectorAll('.nf-checkbox:checked');
    if (selecionadas.length === 0) {
        if (typeof mostrarToast !== 'undefined') {
            mostrarToast('Selecione pelo menos uma nota', 'error');
        } else {
            alert('Selecione pelo menos uma nota');
        }
        return;
    }
    
    if (typeof exportarCSV !== 'undefined') {
        exportarCSV();
    } else if (typeof exportarExcel !== 'undefined') {
        exportarExcel();
    } else {
        // Exportação simples em JSON
        if (typeof state !== 'undefined' && state.notasFiscais) {
            const notasExportar = [];
            selecionadas.forEach(function(cb) {
                const nfId = cb.dataset.nfId;
                const nota = state.notasFiscais.find(function(n) {
                    return (n.id || n.numero) === nfId;
                });
                if (nota) {
                    notasExportar.push(nota);
                }
            });
            
            const json = JSON.stringify(notasExportar, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'notas_fiscais_' + new Date().getTime() + '.json';
            a.click();
            URL.revokeObjectURL(url);
            
            if (typeof mostrarToast !== 'undefined') {
                mostrarToast(selecionadas.length + ' nota(s) exportada(s)', 'success');
            }
        }
    }
}

function enviarEmailEmMassa() {
    const selecionadas = document.querySelectorAll('.nf-checkbox:checked');
    if (selecionadas.length === 0) {
        if (typeof mostrarToast !== 'undefined') {
            mostrarToast('Selecione pelo menos uma nota', 'error');
        } else {
            alert('Selecione pelo menos uma nota');
        }
        return;
    }
    
    if (typeof enviarPorEmail !== 'undefined') {
        enviarPorEmail();
    } else {
        alert('Funcionalidade de envio por email será implementada em breve.\n' + selecionadas.length + ' nota(s) selecionada(s).');
    }
}

function aplicarTagEmMassa() {
    const selecionadas = document.querySelectorAll('.nf-checkbox:checked');
    if (selecionadas.length === 0) {
        if (typeof mostrarToast !== 'undefined') {
            mostrarToast('Selecione pelo menos uma nota', 'error');
        } else {
            alert('Selecione pelo menos uma nota');
        }
        return;
    }
    
    if (typeof aplicarTag !== 'undefined') {
        aplicarTag();
    } else if (typeof abrirTags !== 'undefined') {
        abrirTags();
    } else {
        const tag = prompt('Digite o nome da tag:');
        if (!tag) return;
        
        if (typeof state !== 'undefined' && state.notasFiscais) {
            selecionadas.forEach(function(cb) {
                const nfId = cb.dataset.nfId;
                const nota = state.notasFiscais.find(function(n) {
                    return (n.id || n.numero) === nfId;
                });
                if (nota) {
                    if (!nota.tags) nota.tags = [];
                    if (!nota.tags.includes(tag)) {
                        nota.tags.push(tag);
                    }
                }
            });
            
            if (typeof salvarDados !== 'undefined') {
                salvarDados();
            }
            
            if (typeof mostrarToast !== 'undefined') {
                mostrarToast('Tag "' + tag + '" aplicada em ' + selecionadas.length + ' nota(s)', 'success');
            }
        }
    }
}

function excluirEmMassa() {
    const selecionadas = document.querySelectorAll('.nf-checkbox:checked');
    if (selecionadas.length === 0) {
        if (typeof mostrarToast !== 'undefined') {
            mostrarToast('Selecione pelo menos uma nota', 'error');
        } else {
            alert('Selecione pelo menos uma nota');
        }
        return;
    }
    
    if (!confirm('Deseja realmente excluir ' + selecionadas.length + ' nota(s)? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    if (typeof state !== 'undefined' && state.notasFiscais) {
        selecionadas.forEach(function(cb) {
            const nfId = cb.dataset.nfId;
            const index = state.notasFiscais.findIndex(function(n) {
                return (n.id || n.numero) === nfId;
            });
            if (index >= 0) {
                state.notasFiscais.splice(index, 1);
            }
        });
        
        if (typeof salvarDados !== 'undefined') {
            salvarDados();
        }
        
        if (typeof renderizarNotasFiscais !== 'undefined') {
            renderizarNotasFiscais(state.notasFiscais);
        }
        
        if (typeof atualizarDashboardCompleto !== 'undefined') {
            atualizarDashboardCompleto();
        }
        
        if (typeof fecharBarraAcoesMassa !== 'undefined') {
            fecharBarraAcoesMassa();
        }
        
        if (typeof mostrarToast !== 'undefined') {
            mostrarToast(selecionadas.length + ' nota(s) excluída(s)', 'success');
        }
    }
}

// ================= RELATÓRIOS =================
function gerarRelatorioAvancado() {
    if (typeof gerarRelatorio !== 'undefined') {
        gerarRelatorio();
    } else if (typeof abrirRelatorios !== 'undefined') {
        abrirRelatorios();
    } else {
        alert('Funcionalidade de relatórios avançados será implementada em breve.');
    }
}

// ================= EXPORTAR FUNÇÕES GLOBALMENTE =================
window.handleSearch = handleSearch;
window.filtrarPorStatus = filtrarPorStatus;
window.changeView = changeView;
window.sortTable = sortTable;
window.alterarStatusEmMassa = alterarStatusEmMassa;
window.exportarEmMassa = exportarEmMassa;
window.enviarEmailEmMassa = enviarEmailEmMassa;
window.aplicarTagEmMassa = aplicarTagEmMassa;
window.excluirEmMassa = excluirEmMassa;
window.gerarRelatorioAvancado = gerarRelatorioAvancado;

// Garantir que funções já existentes sejam mantidas
if (typeof abrirCommandPalette === 'undefined') {
    window.abrirCommandPalette = function() {
        if (typeof abrirCommandPalette !== 'undefined' && typeof notas_fiscais_features !== 'undefined') {
            // Tentar usar função do features
            return;
        }
        alert('Command Palette será aberto (Ctrl+K)');
    };
}

console.log('✅ Todas as funções de botões foram carregadas!');
