// ================= SISTEMA DE LIXEIRA E ESTRUTURA DE PASTAS =================
// Este arquivo gerencia a lixeira e organiza notas em estrutura hierárquica

// ================= LIXEIRA =================
let lixeira = JSON.parse(localStorage.getItem('axis_nf_lixeira') || '[]');

// Dias para exclusão automática (padrão: 30 dias, como iPhone)
const DIAS_EXCLUSAO_AUTOMATICA = 30;

function salvarLixeira() {
    localStorage.setItem('axis_nf_lixeira', JSON.stringify(lixeira));
}

// Verificar e limpar itens antigos automaticamente
function verificarExclusaoAutomatica() {
    const agora = new Date();
    let itensRemovidos = 0;
    
    lixeira = lixeira.filter(function(nota) {
        if (!nota.movidoParaLixeiraEm) {
            return true; // Manter se não tiver data de exclusão
        }
        
        const dataExclusao = new Date(nota.movidoParaLixeiraEm);
        const diasDecorridos = Math.floor((agora - dataExclusao) / (1000 * 60 * 60 * 24));
        
        if (diasDecorridos >= DIAS_EXCLUSAO_AUTOMATICA) {
            itensRemovidos++;
            return false; // Excluir permanentemente
        }
        
        return true; // Manter
    });
    
    if (itensRemovidos > 0) {
        salvarLixeira();
        atualizarBadgeLixeira();
        
        if (typeof renderizarConteudoLixeira !== 'undefined') {
            renderizarConteudoLixeira();
        }
        
        console.log(`${itensRemovidos} nota(s) excluída(s) automaticamente após ${DIAS_EXCLUSAO_AUTOMATICA} dias`);
    }
}

// Executar verificação de exclusão automática a cada hora
setInterval(verificarExclusaoAutomatica, 60 * 60 * 1000);
// Executar uma vez ao carregar
setTimeout(verificarExclusaoAutomatica, 2000);

// Calcular dias restantes até exclusão automática
function calcularDiasRestantes(dataExclusao) {
    if (!dataExclusao) return null;
    
    const agora = new Date();
    const dataExcl = new Date(dataExclusao);
    const diasDecorridos = Math.floor((agora - dataExcl) / (1000 * 60 * 60 * 24));
    const diasRestantes = DIAS_EXCLUSAO_AUTOMATICA - diasDecorridos;
    
    return diasRestantes > 0 ? diasRestantes : 0;
}

function moverParaLixeiraNF(notaId) {
    console.log('🗑️ moverParaLixeiraNF chamado com ID:', notaId);
    
    // Confirmar antes de mover para lixeira
    if (confirm('Deseja realmente mover esta nota fiscal para a lixeira?\n\nA nota ficará na lixeira por 30 dias antes da exclusão automática permanente.')) {
        moverParaLixeiraNFConfirmado(notaId);
    }
}

function moverParaLixeiraNFConfirmado(notaId) {
    console.log('🗑️ moverParaLixeiraNFConfirmado chamado com ID:', notaId);
    
    let nota = null;
    let notaIndex = -1;
    
    // Tentar encontrar o state - múltiplas fontes
    let stateObj = null;
    if (typeof state !== 'undefined' && state.notasFiscais) {
        stateObj = state;
    } else if (typeof window.state !== 'undefined' && window.state.notasFiscais) {
        stateObj = window.state;
    } else {
        // Tentar carregar do localStorage
        try {
            const saved = localStorage.getItem('axis_notas_fiscais');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.notasFiscais) {
                    stateObj = { notasFiscais: data.notasFiscais, clientes: data.clientes || [] };
                }
            }
        } catch (e) {
            console.error('Erro ao carregar do localStorage:', e);
        }
    }
    
    if (!stateObj || !stateObj.notasFiscais) {
        console.error('❌ State não encontrado ou notasFiscais não existe');
        console.log('State disponível:', typeof state !== 'undefined' ? 'sim' : 'não');
        console.log('window.state disponível:', typeof window.state !== 'undefined' ? 'sim' : 'não');
        
        if (typeof mostrarToast !== 'undefined') {
            mostrarToast('Erro: Estado não inicializado. Recarregue a página.', 'error');
        } else {
            alert('Erro: Estado não inicializado. Por favor, recarregue a página.');
        }
        return;
    }
    
    console.log('✅ State encontrado. Total de notas:', stateObj.notasFiscais.length);
    
    // Tentar encontrar a nota por ID ou número (mais robusto)
    const buscaStr = notaId.toString().trim();
    console.log('🔍 Buscando nota com ID:', buscaStr);
    console.log('📊 Total de notas no state:', stateObj.notasFiscais.length);
    
    // ESTRATÉGIA 1: Se o ID contém "nota_", usar índice diretamente (mais confiável)
    if (buscaStr.startsWith('nota_')) {
        const idx = parseInt(buscaStr.replace('nota_', ''));
        if (!isNaN(idx) && idx >= 0 && idx < stateObj.notasFiscais.length) {
            notaIndex = idx;
            console.log('✅ Nota encontrada por índice (nota_):', notaIndex);
        }
    }
    
    // ESTRATÉGIA 2: Se ainda não encontrou, tentar encontrar pelo ID exato
    if (notaIndex < 0) {
        notaIndex = stateObj.notasFiscais.findIndex(function(n, idx) {
            // Comparar por id (exato)
            if (n.id && n.id.toString().trim() === buscaStr) return true;
            // Comparar por numero (exato)
            if (n.numero && n.numero.toString().trim() === buscaStr) return true;
            return false;
        });
        if (notaIndex >= 0) {
            console.log('✅ Nota encontrada por ID/numero:', notaIndex);
        }
    }
    
    // ESTRATÉGIA 3: Se ainda não encontrou, tentar por número numérico direto como índice
    if (notaIndex < 0 && !isNaN(buscaStr) && buscaStr.length > 0) {
        const idx = parseInt(buscaStr);
        if (idx >= 0 && idx < stateObj.notasFiscais.length) {
            // Verificar se o índice corresponde ao número da nota
            const notaNoIndice = stateObj.notasFiscais[idx];
            if (notaNoIndice && (notaNoIndice.numero && notaNoIndice.numero.toString() === buscaStr)) {
                notaIndex = idx;
                console.log('✅ Nota encontrada por índice numérico correspondente:', notaIndex);
            }
        }
    }
    
    // ESTRATÉGIA 4: Busca flexível por número (parcial)
    if (notaIndex < 0) {
        notaIndex = stateObj.notasFiscais.findIndex(function(n) {
            // Comparar número contendo a string
            if (n.numero && n.numero.toString().includes(buscaStr)) return true;
            // Comparar ID contendo a string
            if (n.id && n.id.toString().includes(buscaStr)) return true;
            return false;
        });
        if (notaIndex >= 0) {
            console.log('✅ Nota encontrada por busca parcial:', notaIndex);
        }
    }
    
    if (notaIndex >= 0) {
        nota = JSON.parse(JSON.stringify(stateObj.notasFiscais[notaIndex])); // Clone
        nota.movidoParaLixeiraEm = new Date().toISOString();
        
        console.log('📋 Nota encontrada:', {
            id: nota.id,
            numero: nota.numero,
            cliente: nota.cliente,
            index: notaIndex
        });
        
        // Adicionar à lixeira
        lixeira.push(nota);
        salvarLixeira();
        console.log('🗑️ Nota adicionada à lixeira. Total na lixeira:', lixeira.length);
        
        // Remover do array principal
        stateObj.notasFiscais.splice(notaIndex, 1);
        console.log('✅ Nota removida do array principal. Total restante:', stateObj.notasFiscais.length);
        
        // Garantir que o state global seja atualizado também
        if (typeof state !== 'undefined' && state !== stateObj) {
            state.notasFiscais = stateObj.notasFiscais;
            state.clientes = stateObj.clientes || [];
        }
        if (typeof window.state !== 'undefined' && window.state !== stateObj) {
            window.state.notasFiscais = stateObj.notasFiscais;
            window.state.clientes = stateObj.clientes || [];
        }
        
        // Salvar dados - múltiplas tentativas
        let dadosSalvos = false;
        if (typeof salvarDados === 'function') {
            try {
                salvarDados();
                dadosSalvos = true;
                console.log('✅ Dados salvos via salvarDados()');
            } catch (e) {
                console.error('Erro ao chamar salvarDados():', e);
            }
        } else if (typeof window.salvarDados === 'function') {
            try {
                window.salvarDados();
                dadosSalvos = true;
                console.log('✅ Dados salvos via window.salvarDados()');
            } catch (e) {
                console.error('Erro ao chamar window.salvarDados():', e);
            }
        }
        
        // Salvar manualmente no localStorage SEMPRE (garantir persistência)
        try {
            const dataToSave = {
                clientes: stateObj.clientes || [],
                notasFiscais: stateObj.notasFiscais || [],
                subpastas: stateObj.subpastas || {}
            };
            localStorage.setItem('axis_notas_fiscais', JSON.stringify(dataToSave));
            console.log('✅ Dados salvos no localStorage (garantido)');
        } catch (e) {
            console.error('❌ Erro ao salvar no localStorage:', e);
        }
        
        // Garantir que window.notasFiscais também seja atualizado (se existir)
        if (typeof window.notasFiscais !== 'undefined') {
            window.notasFiscais = stateObj.notasFiscais;
        }
        
        // Atualizar interface - múltiplas tentativas com delay para garantir sincronização
        setTimeout(function() {
            // Atualizar renderização principal
            if (typeof renderizarNotasFiscais === 'function') {
                try {
                    renderizarNotasFiscais(stateObj.notasFiscais);
                    console.log('✅ Interface atualizada via renderizarNotasFiscais()');
                } catch (e) {
                    console.error('Erro ao chamar renderizarNotasFiscais():', e);
                }
            } else if (typeof window.renderizarNotasFiscais === 'function') {
                try {
                    window.renderizarNotasFiscais(stateObj.notasFiscais);
                    console.log('✅ Interface atualizada via window.renderizarNotasFiscais()');
                } catch (e) {
                    console.error('Erro ao chamar window.renderizarNotasFiscais():', e);
                }
            }
            
            // Atualizar conteúdo (explorer view)
            if (typeof renderizarConteudo === 'function') {
                try {
                    renderizarConteudo();
                    console.log('✅ Conteúdo atualizado via renderizarConteudo()');
                } catch (e) {
                    console.error('Erro ao chamar renderizarConteudo():', e);
                }
            } else if (typeof window.renderizarConteudo === 'function') {
                try {
                    window.renderizarConteudo();
                    console.log('✅ Conteúdo atualizado via window.renderizarConteudo()');
                } catch (e) {
                    console.error('Erro ao chamar window.renderizarConteudo():', e);
                }
            }
            
            // Atualizar dashboard
            if (typeof atualizarDashboardCompleto === 'function') {
                try {
                    atualizarDashboardCompleto();
                    console.log('✅ Dashboard atualizado via atualizarDashboardCompleto()');
                } catch (e) {
                    console.error('Erro ao chamar atualizarDashboardCompleto():', e);
                }
            } else if (typeof window.atualizarDashboardCompleto === 'function') {
                try {
                    window.atualizarDashboardCompleto();
                    console.log('✅ Dashboard atualizado via window.atualizarDashboardCompleto()');
                } catch (e) {
                    console.error('Erro ao chamar window.atualizarDashboardCompleto():', e);
                }
            }
        }, 200);
        
        // Atualizar badge da lixeira na sidebar
        atualizarBadgeLixeira();
        
        // Mostrar mensagem de sucesso
        if (typeof mostrarToast === 'function') {
            mostrarToast('Nota fiscal movida para a lixeira', 'success');
        } else if (typeof window.mostrarToast === 'function') {
            window.mostrarToast('Nota fiscal movida para a lixeira', 'success');
        } else {
            alert('✅ Nota fiscal movida para a lixeira com sucesso!');
        }
        
        console.log('✅ Processo completo: Nota movida para lixeira');
    } else {
        // Debug: mostrar informações sobre a busca falha
        console.error('❌ Nota não encontrada!');
        console.log('ID buscado:', notaId);
        console.log('String de busca:', buscaStr);
        console.log('Total de notas no state:', stateObj.notasFiscais.length);
        console.log('Primeiras 3 notas:', stateObj.notasFiscais.slice(0, 3).map(function(n, i) {
            return { index: i, id: n.id, numero: n.numero, cliente: n.cliente };
        }));
        
        if (typeof mostrarToast === 'function') {
            mostrarToast('Nota fiscal não encontrada. ID: ' + notaId, 'error');
        } else if (typeof window.mostrarToast === 'function') {
            window.mostrarToast('Nota fiscal não encontrada. ID: ' + notaId, 'error');
        } else {
            alert('❌ Nota fiscal não encontrada!\nID buscado: ' + notaId + '\n\nTotal de notas: ' + stateObj.notasFiscais.length);
        }
    }
}

function restaurarDaLixeira(nota) {
    // Se nota for string (JSON stringificado), fazer parse
    if (typeof nota === 'string') {
        try {
            nota = JSON.parse(nota.replace(/&quot;/g, '"'));
        } catch (e) {
            console.error('Erro ao fazer parse da nota:', e);
        }
    }
    
    // Remover da lixeira
    const index = lixeira.findIndex(function(n) {
        const id1 = (n.id || n.numero || '').toString();
        const id2 = (nota.id || nota.numero || '').toString();
        return id1 === id2;
    });
    
    if (index >= 0) {
        const notaRestaurada = JSON.parse(JSON.stringify(lixeira[index]));
        delete notaRestaurada.movidoParaLixeiraEm;
        
        // Adicionar de volta ao array principal
        const stateObj = typeof state !== 'undefined' ? state : (typeof window.state !== 'undefined' ? window.state : null);
        
        if (stateObj && stateObj.notasFiscais) {
            stateObj.notasFiscais.push(notaRestaurada);
            
            // Organizar automaticamente na estrutura
            if (typeof organizarNotaNaEstrutura !== 'undefined') {
                organizarNotaNaEstrutura(notaRestaurada);
            }
            
            // Remover da lixeira
            lixeira.splice(index, 1);
            salvarLixeira();
            atualizarBadgeLixeira();
            
            if (typeof salvarDados !== 'undefined') {
                salvarDados();
            } else if (typeof window.salvarDados !== 'undefined') {
                window.salvarDados();
            }
            
            // Atualizar interface
            if (typeof renderizarNotasFiscais !== 'undefined') {
                renderizarNotasFiscais(stateObj.notasFiscais);
            } else if (typeof window.renderizarNotasFiscais !== 'undefined') {
                window.renderizarNotasFiscais(stateObj.notasFiscais);
            }
            
            if (typeof renderizarConteudo !== 'undefined') {
                renderizarConteudo();
            } else if (typeof window.renderizarConteudo !== 'undefined') {
                window.renderizarConteudo();
            }
            
            if (typeof atualizarDashboardCompleto !== 'undefined') {
                atualizarDashboardCompleto();
            } else if (typeof window.atualizarDashboardCompleto !== 'undefined') {
                window.atualizarDashboardCompleto();
            }
            
            // Atualizar renderização da lixeira se estiver aberta
            if (typeof renderizarConteudoLixeira !== 'undefined') {
                renderizarConteudoLixeira();
            }
            
            if (typeof mostrarToast !== 'undefined') {
                mostrarToast('Nota fiscal restaurada', 'success');
            } else if (typeof window.mostrarToast !== 'undefined') {
                window.mostrarToast('Nota fiscal restaurada', 'success');
            }
        }
    }
}

function esvaziarLixeira() {
    if (!confirm('Deseja realmente esvaziar a lixeira? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    lixeira = [];
    salvarLixeira();
    
    if (typeof mostrarToast !== 'undefined') {
        mostrarToast('Lixeira esvaziada', 'success');
    }
}

// ================= ORGANIZAÇÃO AUTOMÁTICA EM ESTRUTURA =================
function organizarNotaNaEstrutura(nota) {
    if (!nota) return;
    
    // Garantir que a nota tenha fornecedor/cliente
    const fornecedor = nota.cliente || nota.fornecedor || 'Sem Fornecedor';
    
    // Extrair ano, mês e data da nota
    let ano, mes, mesNome, data;
    
    if (nota.data) {
        const dataObj = new Date(nota.data);
        if (!isNaN(dataObj.getTime())) {
            ano = dataObj.getFullYear();
            mes = String(dataObj.getMonth() + 1).padStart(2, '0');
            mesNome = obterNomeMes(mes);
            data = nota.data; // Usar data original
        }
    }
    
    // Se não tiver data válida, usar data atual
    if (!ano) {
        const hoje = new Date();
        ano = hoje.getFullYear();
        mes = String(hoje.getMonth() + 1).padStart(2, '0');
        mesNome = obterNomeMes(mes);
        data = hoje.toISOString().split('T')[0];
    }
    
    // Atualizar propriedades da nota
    nota.cliente = fornecedor;
    nota.fornecedor = fornecedor;
    nota.ano = ano;
    nota.mes = mes;
    nota.mesNome = mesNome;
    nota.data = data;
    nota.caminho = `${fornecedor}/${ano}/${mes}/${data}`;
    
    // Garantir que o cliente esteja na lista
    if (typeof state !== 'undefined' && state.clientes) {
        if (!state.clientes.includes(fornecedor)) {
            state.clientes.push(fornecedor);
            state.clientes.sort();
        }
    }
}

function obterNomeMes(numeroMes) {
    const meses = {
        '01': 'Janeiro',
        '02': 'Fevereiro',
        '03': 'Março',
        '04': 'Abril',
        '05': 'Maio',
        '06': 'Junho',
        '07': 'Julho',
        '08': 'Agosto',
        '09': 'Setembro',
        '10': 'Outubro',
        '11': 'Novembro',
        '12': 'Dezembro'
    };
    return meses[numeroMes] || 'Desconhecido';
}

// Organizar todas as notas automaticamente
function organizarTodasNotasNaEstrutura() {
    if (typeof state !== 'undefined' && state.notasFiscais) {
        state.notasFiscais.forEach(function(nota) {
            organizarNotaNaEstrutura(nota);
        });
        
        if (typeof salvarDados !== 'undefined') {
            salvarDados();
        }
        
        if (typeof renderizarNotasFiscais !== 'undefined') {
            renderizarNotasFiscais(state.notasFiscais);
        }
        
        if (typeof renderizarConteudo !== 'undefined') {
            renderizarConteudo();
        }
        
        if (typeof renderizarTreeView !== 'undefined') {
            renderizarTreeView();
        }
        
        if (typeof mostrarToast !== 'undefined') {
            mostrarToast('Todas as notas foram organizadas na estrutura', 'success');
        }
    }
}

// Organizar automaticamente quando uma nota for criada ou editada
function aplicarOrganizacaoAutomatica(nota) {
    if (nota) {
        organizarNotaNaEstrutura(nota);
        
        if (typeof salvarDados !== 'undefined') {
            salvarDados();
        }
    }
}

// ================= FUNÇÕES DA INTERFACE DA LIXEIRA =================
function atualizarBadgeLixeira() {
    const badge = document.getElementById('lixeira-count');
    if (badge) {
        badge.textContent = lixeira.length;
        if (lixeira.length === 0) {
            badge.style.display = 'none';
        } else {
            badge.style.display = 'inline-flex';
        }
    }
}

function mostrarLixeira() {
    // Ocultar todas as seções
    document.querySelectorAll('.content-section').forEach(function(section) {
        section.classList.remove('active');
    });
    
    // Mostrar seção da lixeira
    const lixeiraSection = document.getElementById('lixeira');
    if (!lixeiraSection) {
        console.error('❌ Seção da lixeira não encontrada no HTML');
        if (typeof mostrarToast !== 'undefined') {
            mostrarToast('Erro: Seção da lixeira não encontrada', 'error');
        }
        return;
    }
    
    lixeiraSection.classList.add('active');
    
    // Renderizar conteúdo da lixeira
    if (typeof renderizarConteudoLixeira === 'function') {
        renderizarConteudoLixeira();
    } else if (typeof window.renderizarConteudoLixeira === 'function') {
        window.renderizarConteudoLixeira();
    }
    
    // Atualizar menu ativo
    document.querySelectorAll('.nav-item').forEach(function(item) {
        item.classList.remove('active');
    });
    
    // Tentar encontrar o item da lixeira no menu
    const lixeiraNav = document.querySelector('.nav-item[onclick*="mostrarLixeira"]') ||
                       Array.from(document.querySelectorAll('.nav-item')).find(function(item) {
                           return item.textContent && item.textContent.includes('Lixeira');
                       });
    
    if (lixeiraNav) {
        lixeiraNav.classList.add('active');
    }
    
    // Fechar sidebar no mobile
    const sidebar = document.getElementById('sidebar');
    if (sidebar && window.innerWidth <= 768) {
        sidebar.classList.remove('open');
        const overlay = document.getElementById('sidebar-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            overlay.style.display = 'none';
        }
    }
    
}

function renderizarConteudoLixeira() {
    // Carregar lixeira do localStorage
    lixeira = JSON.parse(localStorage.getItem('axis_nf_lixeira') || '[]');
    
    // Funções auxiliares locais se não existirem
    const formatarDataLocal = typeof formatarData !== 'undefined' ? formatarData : function(data) {
        if (!data) return '-';
        const d = new Date(data);
        if (isNaN(d.getTime())) return data;
        return d.toLocaleDateString('pt-BR');
    };
    
    const formatarMoedaLocal = typeof formatarMoeda !== 'undefined' ? formatarMoeda : function(valor) {
        if (!valor) return 'R$ 0,00';
        return 'R$ ' + parseFloat(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    
    // Renderizar grid
    const gridContainer = document.getElementById('lixeira-grid');
    if (gridContainer) {
        if (lixeira.length === 0) {
            gridContainer.innerHTML = '<div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 60px;"><i class="fas fa-trash-alt" style="font-size: 64px; opacity: 0.3; margin-bottom: 20px;"></i><h3>Lixeira vazia</h3><p style="color: var(--text-secondary);">Nenhuma nota fiscal foi excluída</p></div>';
        } else {
            let html = '';
            lixeira.forEach(function(nota, index) {
                const statusClass = nota.status === 'pago' || nota.status === 'paga' ? 'success' : 
                                   nota.status === 'vencido' || nota.status === 'vencida' ? 'danger' : 
                                   'warning';
                
                const notaIdUnico = nota.id || nota.numero || ('lixeira_' + index);
                const diasRestantes = calcularDiasRestantes(nota.movidoParaLixeiraEm);
                const diasRestantesTexto = diasRestantes !== null && diasRestantes > 0 
                    ? `${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'} restantes`
                    : 'Será excluída em breve';
                const diasRestantesCor = diasRestantes !== null && diasRestantes <= 7 ? '#ff3b30' : '#ff9500';
                
                html += `
                    <div class="nf-card axis-card" style="opacity: 0.8;">
                        <div class="nf-card-header">
                            <span class="nf-number">NF-${nota.numero || 'N/A'}</span>
                            <span class="status-badge ${statusClass}">${nota.status || 'pendente'}</span>
                        </div>
                        <div class="nf-card-body">
                            <h4>${nota.cliente || nota.fornecedor || 'Fornecedor não informado'}</h4>
                            <p><i class="fas fa-calendar"></i> ${formatarDataLocal(nota.data)}</p>
                            <p><i class="fas fa-dollar-sign"></i> ${formatarMoedaLocal(nota.valor)}</p>
                            <p style="font-size: 11px; color: var(--text-secondary); margin-top: 8px;"><i class="fas fa-trash"></i> Excluído: ${formatarDataLocal(nota.movidoParaLixeiraEm)}</p>
                            <p style="font-size: 12px; color: ${diasRestantesCor}; margin-top: 8px; font-weight: 600;"><i class="fas fa-clock"></i> ${diasRestantesTexto}</p>
                        </div>
                        <div class="nf-card-actions">
                            <button class="btn-icon" onclick="event.stopPropagation(); restaurarDaLixeira(${JSON.stringify(nota).replace(/"/g, '&quot;')});" title="Restaurar">
                                <i class="fas fa-undo"></i>
                            </button>
                            <button class="btn-icon btn-trash" onclick="event.stopPropagation(); excluirPermanentementeLixeira('${notaIdUnico}');" title="Excluir Permanentemente">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            gridContainer.innerHTML = html;
        }
    }
    
    // Renderizar lista
    const tbody = document.getElementById('lixeira-table-body');
    if (tbody) {
        if (lixeira.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">Lixeira vazia</td></tr>';
        } else {
            let html = '';
            lixeira.forEach(function(nota, index) {
                const statusClass = nota.status === 'pago' || nota.status === 'paga' ? 'pago' : 
                                   nota.status === 'vencido' || nota.status === 'vencida' ? 'vencido' : 
                                   'pendente';
                const notaIdUnico = nota.id || nota.numero || ('lixeira_' + index);
                const diasRestantes = calcularDiasRestantes(nota.movidoParaLixeiraEm);
                const diasRestantesTexto = diasRestantes !== null && diasRestantes > 0 
                    ? `${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'}`
                    : 'Próximo da exclusão';
                const diasRestantesCor = diasRestantes !== null && diasRestantes > 0 && diasRestantes <= 7 ? '#ff3b30' : '#ff9500';
                
                html += `
                    <tr>
                        <td>NF-${nota.numero || 'N/A'}</td>
                        <td>${nota.cliente || nota.fornecedor || '-'}</td>
                        <td>${formatarDataLocal(nota.data)}</td>
                        <td>${formatarMoedaLocal(nota.valor)}</td>
                        <td>${formatarDataLocal(nota.movidoParaLixeiraEm)}</td>
                        <td style="color: ${diasRestantesCor}; font-weight: 600;">${diasRestantesTexto}</td>
                        <td class="col-acoes">
                            <button class="btn-icon" onclick="restaurarDaLixeira(${JSON.stringify(nota).replace(/"/g, '&quot;')});" title="Restaurar">
                                <i class="fas fa-undo"></i>
                            </button>
                            <button class="btn-icon btn-trash" onclick="excluirPermanentementeLixeira('${notaIdUnico}');" title="Excluir Permanentemente">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        }
    }
}

function excluirPermanentementeLixeira(notaId) {
    if (!confirm('Deseja realmente excluir permanentemente esta nota fiscal? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    // Remover da lixeira
    const index = lixeira.findIndex(function(n) {
        const id = (n.id || n.numero || '').toString();
        const buscaId = notaId.toString();
        return id === buscaId || buscaId.includes(id);
    });
    
    if (index >= 0) {
        lixeira.splice(index, 1);
        salvarLixeira();
        atualizarBadgeLixeira();
        renderizarConteudoLixeira();
        
        if (typeof mostrarToast !== 'undefined') {
            mostrarToast('Nota fiscal excluída permanentemente', 'success');
        }
    }
}

function restaurarTodasLixeira() {
    if (lixeira.length === 0) {
        if (typeof mostrarToast !== 'undefined') {
            mostrarToast('Lixeira vazia', 'info');
        }
        return;
    }
    
    if (!confirm(`Deseja restaurar todas as ${lixeira.length} nota(s) da lixeira?`)) {
        return;
    }
    
    const stateObj = typeof state !== 'undefined' ? state : (typeof window.state !== 'undefined' ? window.state : null);
    
    if (stateObj) {
        lixeira.forEach(function(nota) {
            const notaRestaurada = JSON.parse(JSON.stringify(nota));
            delete notaRestaurada.movidoParaLixeiraEm;
            
            // Organizar automaticamente
            if (typeof organizarNotaNaEstrutura !== 'undefined') {
                organizarNotaNaEstrutura(notaRestaurada);
            }
            
            stateObj.notasFiscais.push(notaRestaurada);
        });
        
        lixeira = [];
        salvarLixeira();
        atualizarBadgeLixeira();
        
        if (typeof salvarDados !== 'undefined') {
            salvarDados();
        }
        
        if (typeof renderizarNotasFiscais !== 'undefined') {
            renderizarNotasFiscais(stateObj.notasFiscais);
        }
        
        renderizarConteudoLixeira();
        
        // Voltar para a seção de notas
        mostrarLixeira(); // Fechar lixeira e voltar
        
        if (typeof mostrarToast !== 'undefined') {
            mostrarToast('Todas as notas foram restauradas', 'success');
        }
    }
}

function esvaziarLixeira() {
    if (lixeira.length === 0) {
        if (typeof mostrarToast !== 'undefined') {
            mostrarToast('Lixeira já está vazia', 'info');
        }
        return;
    }
    
    if (!confirm(`Deseja realmente esvaziar a lixeira? ${lixeira.length} nota(s) serão excluídas permanentemente.`)) {
        return;
    }
    
    lixeira = [];
    salvarLixeira();
    atualizarBadgeLixeira();
    renderizarConteudoLixeira();
    
    if (typeof mostrarToast !== 'undefined') {
        mostrarToast('Lixeira esvaziada', 'success');
    }
}

// ================= MODAL DE CONFIRMAÇÃO EM GLASSMORPHISM =================
function mostrarModalConfirmacaoExclusao(notaId) {
    // Buscar nota para mostrar informações
    const stateObj = typeof state !== 'undefined' ? state : (typeof window.state !== 'undefined' ? window.state : null);
    
    if (!stateObj || !stateObj.notasFiscais) {
        if (typeof mostrarToast !== 'undefined') {
            mostrarToast('Erro: Estado não inicializado', 'error');
        }
        return;
    }
    
    // Tentar encontrar a nota (busca mais robusta)
    let nota = null;
    const buscaStr = notaId.toString();
    
    // Primeiro, tentar por índice se começar com "nota_"
    if (buscaStr.startsWith('nota_')) {
        const idx = parseInt(buscaStr.replace('nota_', ''));
        if (!isNaN(idx) && idx >= 0 && idx < stateObj.notasFiscais.length) {
            nota = stateObj.notasFiscais[idx];
        }
    }
    
    // Se não encontrou, tentar por ID ou número
    if (!nota) {
        nota = stateObj.notasFiscais.find(function(n, idx) {
            // Comparar por id
            if (n.id && n.id.toString() === buscaStr) return true;
            // Comparar por numero
            if (n.numero && n.numero.toString() === buscaStr) return true;
            // Se buscaStr é numérico, tentar por índice
            if (!isNaN(buscaStr)) {
                const idxNum = parseInt(buscaStr);
                if (idx === idxNum) return true;
            }
            return false;
        });
    }
    
    // Se ainda não encontrou e buscaStr é numérico, usar como índice direto
    if (!nota && !isNaN(buscaStr)) {
        const idx = parseInt(buscaStr);
        if (idx >= 0 && idx < stateObj.notasFiscais.length) {
            nota = stateObj.notasFiscais[idx];
        }
    }
    
    if (!nota) {
        if (typeof mostrarToast !== 'undefined') {
            mostrarToast('Nota fiscal não encontrada', 'error');
        }
        return;
    }
    
    // Remover modal existente se houver
    const modalExistente = document.getElementById('modal-confirmacao-exclusao');
    if (modalExistente) {
        modalExistente.remove();
    }
    
    // Criar modal em glassmorphism
    const modal = document.createElement('div');
    modal.id = 'modal-confirmacao-exclusao';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(40px) saturate(180%);
        -webkit-backdrop-filter: blur(40px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 24px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        padding: 32px;
        max-width: 500px;
        width: 90%;
        animation: slideUp 0.3s ease;
    `;
    
    const formatarMoedaLocal = typeof formatarMoeda !== 'undefined' ? formatarMoeda : function(v) {
        return 'R$ ' + parseFloat(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    
    modalContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 80px; height: 80px; margin: 0 auto 16px; background: linear-gradient(135deg, rgba(255, 59, 48, 0.1), rgba(255, 149, 0, 0.1)); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-trash-alt" style="font-size: 36px; color: #ff3b30;"></i>
            </div>
            <h2 style="margin: 0 0 8px; font-size: 24px; color: var(--text-main, #1d1d1f);">Mover para Lixeira?</h2>
            <p style="margin: 0; color: var(--text-secondary, #86868b); font-size: 14px;">Esta nota será movida para a lixeira e poderá ser recuperada por até ${DIAS_EXCLUSAO_AUTOMATICA} dias</p>
        </div>
        
        <div style="background: rgba(0, 0, 0, 0.03); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: var(--text-secondary, #86868b); font-size: 14px;">Número NF:</span>
                <strong style="color: var(--text-main, #1d1d1f);">NF-${nota.numero || 'N/A'}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: var(--text-secondary, #86868b); font-size: 14px;">Fornecedor:</span>
                <strong style="color: var(--text-main, #1d1d1f);">${nota.cliente || nota.fornecedor || '-'}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-secondary, #86868b); font-size: 14px;">Valor:</span>
                <strong style="color: var(--text-main, #1d1d1f);">${formatarMoedaLocal(nota.valor)}</strong>
            </div>
        </div>
        
        <div style="display: flex; gap: 12px;">
            <button id="btn-cancelar-exclusao" style="flex: 1; padding: 14px 24px; background: rgba(0, 0, 0, 0.05); border: none; border-radius: 12px; font-size: 16px; font-weight: 600; color: var(--text-main, #1d1d1f); cursor: pointer; transition: all 0.2s;">
                Cancelar
            </button>
            <button id="btn-confirmar-exclusao" style="flex: 1; padding: 14px 24px; background: linear-gradient(135deg, #ff3b30, #ff9500); border: none; border-radius: 12px; font-size: 16px; font-weight: 600; color: white; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(255, 59, 48, 0.3);">
                <i class="fas fa-trash"></i> Mover para Lixeira
            </button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Event listeners
    const btnCancelar = document.getElementById('btn-cancelar-exclusao');
    const btnConfirmar = document.getElementById('btn-confirmar-exclusao');
    
    btnCancelar.addEventListener('mouseenter', function() {
        this.style.background = 'rgba(0, 0, 0, 0.1)';
    });
    btnCancelar.addEventListener('mouseleave', function() {
        this.style.background = 'rgba(0, 0, 0, 0.05)';
    });
    
    btnConfirmar.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 6px 16px rgba(255, 59, 48, 0.4)';
    });
    btnConfirmar.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 12px rgba(255, 59, 48, 0.3)';
    });
    
    btnCancelar.onclick = function() {
        modal.style.animation = 'fadeOut 0.2s ease';
        setTimeout(function() {
            modal.remove();
        }, 200);
    };
    
    btnConfirmar.onclick = function() {
        modal.style.animation = 'fadeOut 0.2s ease';
        setTimeout(function() {
            modal.remove();
            moverParaLixeiraNFConfirmado(notaId);
        }, 200);
    };
    
    modal.onclick = function(e) {
        if (e.target === modal) {
            btnCancelar.onclick();
        }
    };
    
    // Adicionar animações CSS se não existirem
    if (!document.getElementById('modal-exclusao-styles')) {
        const style = document.createElement('style');
        style.id = 'modal-exclusao-styles';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

// ================= EXPORTAR FUNÇÕES =================
window.moverParaLixeiraNF = moverParaLixeiraNF;
window.moverParaLixeiraNFConfirmado = moverParaLixeiraNFConfirmado;
window.mostrarModalConfirmacaoExclusao = mostrarModalConfirmacaoExclusao;
window.restaurarDaLixeira = restaurarDaLixeira;
window.esvaziarLixeira = esvaziarLixeira;
window.organizarNotaNaEstrutura = organizarNotaNaEstrutura;
window.organizarTodasNotasNaEstrutura = organizarTodasNotasNaEstrutura;
window.aplicarOrganizacaoAutomatica = aplicarOrganizacaoAutomatica;
window.mostrarLixeira = mostrarLixeira;
window.renderizarConteudoLixeira = renderizarConteudoLixeira;
window.excluirPermanentementeLixeira = excluirPermanentementeLixeira;
window.restaurarTodasLixeira = restaurarTodasLixeira;
window.atualizarBadgeLixeira = atualizarBadgeLixeira;
window.calcularDiasRestantes = calcularDiasRestantes;

// Organizar notas existentes na inicialização
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
            if (typeof state !== 'undefined' && state.notasFiscais && state.notasFiscais.length > 0) {
                // Verificar se já foram organizadas
                const primeiraNota = state.notasFiscais[0];
                if (!primeiraNota.ano || !primeiraNota.mes) {
                    organizarTodasNotasNaEstrutura();
                }
            }
            
            // Atualizar badge da lixeira na inicialização
            atualizarBadgeLixeira();
        }, 2000);
    });
} else {
    setTimeout(function() {
        if (typeof state !== 'undefined' && state.notasFiscais && state.notasFiscais.length > 0) {
            const primeiraNota = state.notasFiscais[0];
            if (!primeiraNota.ano || !primeiraNota.mes) {
                organizarTodasNotasNaEstrutura();
            }
        }
        
        // Atualizar badge da lixeira na inicialização
        atualizarBadgeLixeira();
    }, 2000);
}

console.log('✅ Sistema de lixeira e estrutura de pastas carregado!');
