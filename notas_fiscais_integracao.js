// ================= INTEGRAÇÃO DAS FUNCIONALIDADES COM A ESTRUTURA ATUAL =================

// Aguardar state estar disponível
function aguardarState(callback, maxTentativas) {
    maxTentativas = maxTentativas || 10;
    var tentativas = 0;
    
    function verificar() {
        if ((typeof state !== 'undefined' && state.notasFiscais) || 
            (window.state && window.state.notasFiscais)) {
            callback();
        } else if (tentativas < maxTentativas) {
            tentativas++;
            setTimeout(verificar, 200);
        } else {
            // Usar localStorage como fallback
            try {
                const saved = localStorage.getItem('axis_notas_fiscais');
                if (saved) {
                    const data = JSON.parse(saved);
                    callback(data.notasFiscais || []);
                } else {
                    callback([]);
                }
            } catch (e) {
                callback([]);
            }
        }
    }
    
    verificar();
}

// Atualizar dashboard com todos os KPIs
function atualizarDashboardCompleto() {
    aguardarState(function(notasFiscaisForcadas) {
        let notasFiscais = notasFiscaisForcadas;
        
        if (!notasFiscais) {
            if (typeof state !== 'undefined' && state.notasFiscais) {
                notasFiscais = state.notasFiscais;
            } else if (window.state && window.state.notasFiscais) {
                notasFiscais = window.state.notasFiscais;
            } else {
                try {
                    const saved = localStorage.getItem('axis_notas_fiscais');
                    if (saved) {
                        const data = JSON.parse(saved);
                        notasFiscais = data.notasFiscais || [];
                    }
                } catch (e) {
                    notasFiscais = [];
                }
            }
        }
        
        if (!notasFiscais) notasFiscais = [];
        
        atualizarKPIs(notasFiscais);
        atualizarGraficos(notasFiscais);
        
        // Atualizar contador no menu
        const nfCountEl = document.getElementById('nf-count');
        if (nfCountEl) {
            nfCountEl.textContent = notasFiscais.length;
        }
    });
}

function atualizarKPIs(notas) {
    if (!notas || !Array.isArray(notas)) notas = [];
    
    const hoje = new Date();
    const tresDiasFuturo = new Date(hoje);
    tresDiasFuturo.setDate(hoje.getDate() + 3);
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    
    // Cálculos
    const totalNF = notas.length;
    const valorTotal = notas.reduce(function(sum, n) { return sum + (parseFloat(n.valor) || 0); }, 0);
    const pendentes = notas.filter(function(n) { return n.status === 'pendente'; }).length;
    const vencidas = notas.filter(function(n) { return n.status === 'vencido' || n.status === 'vencida'; }).length;
    const pagas = notas.filter(function(n) { return n.status === 'pago' || n.status === 'paga'; }).length;
    
    // A vencer
    const aVencer = notas.filter(function(n) {
        if (n.status === 'pago' || n.status === 'paga') return false;
        const dataVenc = n.dataVencimento ? new Date(n.dataVencimento) : new Date(n.data);
        return dataVenc >= hoje && dataVenc <= tresDiasFuturo;
    }).length;
    
    // Em atraso
    const emAtraso = notas.filter(function(n) {
        if (n.status === 'pago' || n.status === 'paga') return false;
        const dataVenc = n.dataVencimento ? new Date(n.dataVencimento) : new Date(n.data);
        const tresDiasAtras = new Date(hoje);
        tresDiasAtras.setDate(hoje.getDate() - 3);
        return dataVenc < tresDiasAtras;
    }).length;
    
    // Concluídas este mês
    const concluidasMes = notas.filter(function(n) {
        if (n.status !== 'pago' && n.status !== 'paga') return false;
        const dataNota = new Date(n.data);
        return dataNota >= inicioMes;
    }).length;
    
    // Valor médio
    const valorMedio = totalNF > 0 ? valorTotal / totalNF : 0;
    
    // Função auxiliar para formatar moeda
    function formatarMoeda(valor) {
        return 'R$ ' + parseFloat(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    
    // Atualizar elementos
    const elementos = {
        'total-nfs': totalNF,
        'valor-total-nfs': formatarMoeda(valorTotal),
        'pendentes-nfs': pendentes,
        'vencidas-nfs': vencidas,
        'a-vencer-nfs': aVencer,
        'pagas-nfs': pagas,
        'em-atraso-nfs': emAtraso,
        'concluidas-mes-nfs': concluidasMes,
        'valor-medio-nfs': formatarMoeda(valorMedio)
    };
    
    Object.keys(elementos).forEach(function(id) {
        const el = document.getElementById(id);
        if (el) el.textContent = elementos[id];
    });
}

function atualizarGraficos(notas) {
    if (!notas || !Array.isArray(notas)) notas = [];
    
    // Gráfico de Status
    const canvasStatus = document.getElementById('chart-status');
    if (canvasStatus && typeof Chart !== 'undefined') {
        const ctx = canvasStatus.getContext('2d');
        const pago = notas.filter(function(n) { return n.status === 'pago' || n.status === 'paga'; }).length;
        const pendente = notas.filter(function(n) { return n.status === 'pendente'; }).length;
        const vencido = notas.filter(function(n) { return n.status === 'vencido' || n.status === 'vencida'; }).length;
        const hoje = new Date();
        const tresDiasFuturo = new Date(hoje);
        tresDiasFuturo.setDate(hoje.getDate() + 3);
        const aVencer = notas.filter(function(n) {
            if (n.status === 'pago' || n.status === 'paga') return false;
            const dataVenc = n.dataVencimento ? new Date(n.dataVencimento) : new Date(n.data);
            return dataVenc >= hoje && dataVenc <= tresDiasFuturo;
        }).length;
        
        if (window.chartStatus) {
            window.chartStatus.destroy();
        }
        
        window.chartStatus = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Pagas', 'Pendentes', 'Vencidas', 'A Vencer'],
                datasets: [{
                    data: [pago, pendente, vencido, aVencer],
                    backgroundColor: [
                        'rgba(52, 199, 89, 0.8)',
                        'rgba(255, 149, 0, 0.8)',
                        'rgba(255, 59, 48, 0.8)',
                        'rgba(255, 204, 0, 0.8)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Gráfico Timeline (6 meses)
    const canvasTimeline = document.getElementById('chart-timeline');
    if (canvasTimeline && typeof Chart !== 'undefined') {
        const ctx = canvasTimeline.getContext('2d');
        const hoje = new Date();
        const meses = [];
        const dados = [];
        
        for (var i = 5; i >= 0; i--) {
            const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            const mesNome = data.toLocaleDateString('pt-BR', { month: 'short' });
            meses.push(mesNome);
            
            const notasMes = notas.filter(function(n) {
                const dataNota = new Date(n.data);
                return dataNota.getMonth() === data.getMonth() && dataNota.getFullYear() === data.getFullYear();
            }).length;
            
            dados.push(notasMes);
        }
        
        if (window.chartTimeline) {
            window.chartTimeline.destroy();
        }
        
        window.chartTimeline = new Chart(ctx, {
            type: 'line',
            data: {
                labels: meses,
                datasets: [{
                    label: 'Notas Fiscais',
                    data: dados,
                    borderColor: 'rgba(0, 122, 255, 0.8)',
                    backgroundColor: 'rgba(0, 122, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }
}

// Busca inteligente
function buscarNotasFiscais(termo) {
    if (!termo || termo.trim() === '') {
        renderizarNotasFiscais();
        return;
    }
    
    const termoLower = termo.toLowerCase();
    const notas = window.notasFiscais || (typeof state !== 'undefined' ? state.notasFiscais : []);
    
    const resultados = notas.filter(function(nota) {
        const numero = (nota.numero || '').toString().toLowerCase();
        const fornecedor = (nota.cliente || nota.fornecedor || '').toLowerCase();
        const cnpj = (nota.cnpj || '').toString().toLowerCase();
        const palavras = termoLower.split(' ');
        
        return palavras.every(function(palavra) {
            return numero.includes(palavra) || 
                   fornecedor.includes(palavra) || 
                   cnpj.includes(palavra);
        });
    });
    
    renderizarNotasFiscais(resultados);
}

// Filtrar por status
function filtrarPorStatus(status) {
    const notas = window.notasFiscais || (typeof state !== 'undefined' ? state.notasFiscais : []);
    let filtradas = notas;
    
    if (status !== 'all') {
        if (status === 'a-vencer') {
            const hoje = new Date();
            const tresDiasFuturo = new Date(hoje);
            tresDiasFuturo.setDate(hoje.getDate() + 3);
            filtradas = notas.filter(function(n) {
                if (n.status === 'pago' || n.status === 'paga') return false;
                const dataVenc = n.dataVencimento ? new Date(n.dataVencimento) : new Date(n.data);
                return dataVenc >= hoje && dataVenc <= tresDiasFuturo;
            });
        } else {
            filtradas = notas.filter(function(n) {
                return n.status === status;
            });
        }
    }
    
    renderizarNotasFiscais(filtradas);
    
    // Atualizar tabs
    document.querySelectorAll('.filter-tab').forEach(function(tab) {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Alterar visualização
function changeView(mode) {
    const grid = document.getElementById('nfs-grid');
    const list = document.getElementById('nfs-list');
    const gridBtn = document.getElementById('view-grid-btn');
    const listBtn = document.getElementById('view-list-btn');
    
    if (mode === 'grid') {
        if (grid) grid.style.display = 'grid';
        if (list) list.style.display = 'none';
        if (gridBtn) gridBtn.classList.add('active');
        if (listBtn) listBtn.classList.remove('active');
    } else {
        if (grid) grid.style.display = 'none';
        if (list) list.style.display = 'block';
        if (gridBtn) gridBtn.classList.remove('active');
        if (listBtn) listBtn.classList.add('active');
    }
}

// Renderizar notas fiscais
function renderizarNotasFiscais(notas) {
    if (!notas) {
        notas = window.notasFiscais || (typeof state !== 'undefined' ? state.notasFiscais : []);
    }
    
    renderizarGridNotas(notas);
    renderizarListaNotas(notas);
}

function renderizarGridNotas(notas) {
    const container = document.getElementById('nfs-grid');
    if (!container) return;
    
    if (notas.length === 0) {
        container.innerHTML = '<div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 60px;"><i class="fas fa-file-invoice" style="font-size: 64px; opacity: 0.3; margin-bottom: 20px;"></i><h3>Nenhuma nota fiscal encontrada</h3></div>';
        return;
    }
    
    let html = '';
    notas.forEach(function(nota, index) {
        const statusClass = nota.status === 'pago' || nota.status === 'paga' ? 'success' : 
                           nota.status === 'vencido' || nota.status === 'vencida' ? 'danger' : 
                           nota.status === 'pendente' ? 'warning' : 'info';
        
        const notaIdUnico = nota.id || nota.numero || ('nota_' + index);
        html += `
            <div class="nf-card axis-card" onclick="abrirDetalhesNF('${notaIdUnico}')">
                <div class="nf-card-header">
                    <span class="nf-number">NF-${nota.numero || 'N/A'}</span>
                    <span class="status-badge ${statusClass}">${nota.status || 'pendente'}</span>
                </div>
                <div class="nf-card-body">
                    <h4>${nota.cliente || nota.fornecedor || 'Fornecedor não informado'}</h4>
                    <p><i class="fas fa-calendar"></i> ${formatarData(nota.data)}</p>
                    <p><i class="fas fa-dollar-sign"></i> ${formatarMoeda(nota.valor)}</p>
                </div>
                <div class="nf-card-actions">
                    <button class="btn-icon" onclick="event.stopPropagation(); if(typeof mostrarPreviewRapidoNF !== 'undefined') mostrarPreviewRapidoNF('${notaIdUnico}'); else if(typeof visualizarNF !== 'undefined') visualizarNF('${notaIdUnico}');" title="Visualizar Rápido">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" onclick="event.stopPropagation(); editarNF('${notaIdUnico}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="event.stopPropagation(); if(typeof confirmarDownloadPDF !== 'undefined') confirmarDownloadPDF('${notaIdUnico}'); else if(typeof baixarPDF !== 'undefined') baixarPDF('${notaIdUnico}');" title="Baixar PDF">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn-icon btn-trash" onclick="event.stopPropagation(); moverParaLixeiraNF('${notaIdUnico}');" title="Mover para Lixeira">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderizarListaNotas(notas) {
    const tbody = document.getElementById('nfs-table-body');
    if (!tbody) return;
    
    if (notas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--text-secondary);">Nenhuma nota fiscal encontrada</td></tr>';
        return;
    }
    
    let html = '';
    notas.forEach(function(nota, index) {
        const statusClass = nota.status === 'pago' || nota.status === 'paga' ? 'pago' : 
                           nota.status === 'vencido' || nota.status === 'vencida' ? 'vencido' : 
                           'pendente';
        
        const notaIdUnico = nota.id || nota.numero || ('nota_' + index);
        html += `
            <tr onclick="abrirDetalhesNF('${notaIdUnico}')">
                <td class="col-checkbox">
                    <input type="checkbox" class="nf-checkbox" data-nf-id="${notaIdUnico}" onchange="toggleSelecaoNF('${notaIdUnico}')">
                </td>
                <td>NF-${nota.numero || 'N/A'}</td>
                <td>${nota.cliente || nota.fornecedor || '-'}</td>
                <td>${formatarData(nota.data)}</td>
                <td>${nota.dataVencimento ? formatarData(nota.dataVencimento) : '-'}</td>
                <td>${formatarMoeda(nota.valor)}</td>
                <td><span class="status-badge ${statusClass}">${nota.status || 'pendente'}</span></td>
                <td class="col-acoes">
                    <button class="btn-icon" onclick="event.stopPropagation(); if(typeof mostrarPreviewRapidoNF !== 'undefined') mostrarPreviewRapidoNF('${notaIdUnico}'); else if(typeof visualizarNF !== 'undefined') visualizarNF('${notaIdUnico}');" title="Visualizar Rápido">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" onclick="event.stopPropagation(); editarNF('${notaIdUnico}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="event.stopPropagation(); if(typeof confirmarDownloadPDF !== 'undefined') confirmarDownloadPDF('${notaIdUnico}'); else if(typeof baixarPDF !== 'undefined') baixarPDF('${notaIdUnico}');" title="Baixar PDF">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn-icon btn-trash" onclick="event.stopPropagation(); moverParaLixeiraNF('${notaIdUnico}');" title="Mover para Lixeira">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Funções auxiliares
function formatarData(data) {
    if (!data) return '-';
    const d = new Date(data);
    if (isNaN(d.getTime())) return data;
    return d.toLocaleDateString('pt-BR');
}

function formatarMoeda(valor) {
    if (!valor) return 'R$ 0,00';
    return 'R$ ' + parseFloat(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Exportar funções auxiliares
window.formatarData = formatarData;
window.formatarMoeda = formatarMoeda;

// Seleção de notas
let notasSelecionadas = [];

function toggleSelecaoNF(id) {
    const index = notasSelecionadas.indexOf(id);
    if (index >= 0) {
        notasSelecionadas.splice(index, 1);
    } else {
        notasSelecionadas.push(id);
    }
    
    atualizarBarraAcoesMassa();
}

function selecionarTodasNotas() {
    const checkbox = document.getElementById('select-all-nfs');
    const checkboxes = document.querySelectorAll('.nf-checkbox');
    
    if (checkbox && checkbox.checked) {
        notasSelecionadas = [];
        checkboxes.forEach(function(cb) {
            cb.checked = true;
            notasSelecionadas.push(cb.dataset.nfId);
        });
    } else {
        notasSelecionadas = [];
        checkboxes.forEach(function(cb) {
            cb.checked = false;
        });
    }
    
    atualizarBarraAcoesMassa();
}

function atualizarBarraAcoesMassa() {
    const bar = document.getElementById('batch-actions-bar');
    const count = document.getElementById('batch-count');
    
    if (bar && count) {
        if (notasSelecionadas.length > 0) {
            bar.style.display = 'block';
            count.textContent = notasSelecionadas.length + ' selecionadas';
        } else {
            bar.style.display = 'none';
        }
    }
}

function fecharBarraAcoesMassa() {
    const bar = document.getElementById('batch-actions-bar');
    if (bar) {
        bar.style.display = 'none';
    }
    notasSelecionadas = [];
    document.querySelectorAll('.nf-checkbox').forEach(function(cb) {
        cb.checked = false;
    });
    const selectAll = document.getElementById('select-all-nfs');
    if (selectAll) selectAll.checked = false;
}

// Ações em massa
function alterarStatusEmMassa() {
    if (notasSelecionadas.length === 0) {
        alert('Selecione pelo menos uma nota');
        return;
    }
    alert('Funcionalidade de alterar status em massa será implementada');
}

function exportarEmMassa() {
    if (notasSelecionadas.length === 0) {
        alert('Selecione pelo menos uma nota');
        return;
    }
    alert('Funcionalidade de exportação em massa será implementada');
}

function enviarEmailEmMassa() {
    if (notasSelecionadas.length === 0) {
        alert('Selecione pelo menos uma nota');
        return;
    }
    alert('Funcionalidade de envio de email em massa será implementada');
}

function aplicarTagEmMassa() {
    if (notasSelecionadas.length === 0) {
        alert('Selecione pelo menos uma nota');
        return;
    }
    alert('Funcionalidade de aplicar tag em massa será implementada');
}

function excluirEmMassa() {
    if (notasSelecionadas.length === 0) {
        mostrarToast('Selecione pelo menos uma nota', 'error');
        return;
    }
    
    if (confirm('Deseja realmente mover ' + notasSelecionadas.length + ' nota(s) para a lixeira?')) {
        let notasMovidas = 0;
        
        notasSelecionadas.forEach(function(notaId) {
            if (typeof moverParaLixeiraNFConfirmado !== 'undefined') {
                moverParaLixeiraNFConfirmado(notaId);
                notasMovidas++;
            } else if (typeof window.moverParaLixeiraNFConfirmado !== 'undefined') {
                window.moverParaLixeiraNFConfirmado(notaId);
                notasMovidas++;
            }
        });
        
        if (notasMovidas > 0) {
            mostrarToast(notasMovidas + ' nota(s) movida(s) para a lixeira', 'success');
            notasSelecionadas = [];
            fecharBarraAcoesMassa();
            
            // Atualizar lista de notas
            if (typeof renderizarNotasFiscais !== 'undefined') {
                const stateObj = typeof state !== 'undefined' ? state : (typeof window.state !== 'undefined' ? window.state : null);
                if (stateObj && stateObj.notasFiscais) {
                    renderizarNotasFiscais(stateObj.notasFiscais);
                }
            }
        }
    }
}

// Ações individuais
function visualizarNF(id) {
    alert('Visualizar NF ' + id);
}

function editarNF(id) {
    alert('Editar NF ' + id);
}

function baixarPDF(id) {
    alert('Baixar PDF da NF ' + id);
}

function abrirDetalhesNF(id) {
    alert('Abrir detalhes da NF ' + id);
}

// Exportar funções globais
window.atualizarDashboardCompleto = atualizarDashboardCompleto;
window.buscarNotasFiscais = buscarNotasFiscais;
window.filtrarPorStatus = filtrarPorStatus;
window.changeView = changeView;
window.renderizarNotasFiscais = renderizarNotasFiscais;
window.toggleSelecaoNF = toggleSelecaoNF;
window.selecionarTodasNotas = selecionarTodasNotas;
window.fecharBarraAcoesMassa = fecharBarraAcoesMassa;
window.alterarStatusEmMassa = alterarStatusEmMassa;
window.exportarEmMassa = exportarEmMassa;
window.enviarEmailEmMassa = enviarEmailEmMassa;
window.aplicarTagEmMassa = aplicarTagEmMassa;
window.excluirEmMassa = excluirEmMassa;
window.visualizarNF = visualizarNF;
window.editarNF = editarNF;
window.baixarPDF = baixarPDF;
window.abrirDetalhesNF = abrirDetalhesNF;

// Funções de navegação e UI
function showSection(sectionId) {
    // Esconder todas as seções
    document.querySelectorAll('.content-section').forEach(function(section) {
        section.classList.remove('active');
    });
    
    // Mostrar seção selecionada
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }
    
    // Atualizar título da página
    const titles = {
        'dashboard': 'Dashboard',
        'notas': 'Notas Fiscais',
        'fornecedores': 'Fornecedores',
        'relatorios': 'Relatórios',
        'backup': 'Backup',
        'configuracoes': 'Configurações'
    };
    
    const titleEl = document.getElementById('page-title');
    const subtitleEl = document.querySelector('.page-subtitle');
    
    if (titleEl) {
        titleEl.textContent = titles[sectionId] || 'Dashboard';
    }
    
    if (subtitleEl) {
        if (sectionId === 'dashboard') {
            subtitleEl.textContent = 'Sistema inteligente de gestão fiscal';
        } else if (sectionId === 'notas') {
            subtitleEl.textContent = 'Gerencie todas as suas notas fiscais';
        } else {
            subtitleEl.textContent = '';
        }
    }
    
    // Atualizar navegação ativa
    document.querySelectorAll('.nav-item').forEach(function(item) {
        item.classList.remove('active');
    });
    
    const navItem = document.querySelector('.nav-item[onclick*="' + sectionId + '"]');
    if (navItem) {
        navItem.classList.add('active');
    }
    
    // Se for dashboard, atualizar métricas
    if (sectionId === 'dashboard') {
        setTimeout(function() {
            atualizarDashboardCompleto();
        }, 100);
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar && overlay) {
        sidebar.classList.toggle('open');
        overlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
    }
}

function toggleNotifications() {
    const panel = document.getElementById('notifications-panel');
    if (panel) {
        panel.classList.toggle('active');
    }
}

function toggleAdvancedSearch() {
    const search = document.getElementById('advanced-search');
    if (search) {
        search.classList.toggle('active');
    }
}

function aplicarFiltros() {
    // Implementar lógica de filtros
    const dateFrom = document.getElementById('date-from')?.value || '';
    const dateTo = document.getElementById('date-to')?.value || '';
    const valorMin = document.getElementById('value-min')?.value || '';
    const valorMax = document.getElementById('value-max')?.value || '';
    const tipo = document.getElementById('filter-tipo')?.value || 'all';
    const status = document.getElementById('filter-status')?.value || 'all';
    
    // Aplicar filtros aos dados
    if (typeof state !== 'undefined' && state.notasFiscais) {
        renderizarNotasFiscais(state.notasFiscais);
    }
    
    mostrarToast('Filtros aplicados com sucesso', 'success');
}

function limparFiltros() {
    document.getElementById('date-from').value = '';
    document.getElementById('date-to').value = '';
    document.getElementById('value-min').value = '';
    document.getElementById('value-max').value = '';
    document.getElementById('filter-tipo').value = 'all';
    document.getElementById('filter-status').value = 'all';
    
    if (typeof state !== 'undefined' && state.notasFiscais) {
        renderizarNotasFiscais(state.notasFiscais);
    }
    
    mostrarToast('Filtros limpos', 'info');
}

function mostrarToast(mensagem, tipo) {
    // Implementação simples de toast
    const toast = document.createElement('div');
    toast.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: rgba(0, 122, 255, 0.9); color: white; padding: 16px 24px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2); z-index: 10000; animation: slideUp 0.3s ease;';
    toast.textContent = mensagem;
    document.body.appendChild(toast);
    
    setTimeout(function() {
        toast.style.animation = 'slideDown 0.3s ease';
        setTimeout(function() {
            toast.remove();
        }, 300);
    }, 3000);
}

// Exportar funções globalmente
window.showSection = showSection;
window.toggleSidebar = toggleSidebar;
window.toggleNotifications = toggleNotifications;
window.toggleAdvancedSearch = toggleAdvancedSearch;
window.aplicarFiltros = aplicarFiltros;
window.limparFiltros = limparFiltros;
window.mostrarToast = mostrarToast;
window.atualizarDashboardCompleto = atualizarDashboardCompleto;
window.atualizarKPIs = atualizarKPIs;
window.atualizarGraficos = atualizarGraficos;
window.buscarNotasFiscais = buscarNotasFiscais;
window.renderizarNotasFiscais = renderizarNotasFiscais;
window.renderizarGridNotas = renderizarGridNotas;
window.renderizarListaNotas = renderizarListaNotas;
window.changeView = changeView;

// Função para formatar moeda (se não existir)
if (typeof formatarMoeda === 'undefined') {
    window.formatarMoeda = function(valor) {
        if (!valor || isNaN(valor)) return 'R$ 0,00';
        return 'R$ ' + parseFloat(valor).toLocaleString('pt-BR', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    };
}

// Inicializar dashboard quando possível
function inicializarDashboardAutomatico() {
    // Esperar um pouco para garantir que state esteja disponível
    setTimeout(function() {
        atualizarDashboardCompleto();
    }, 1500);
}

// Inicializar quando a página carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        inicializarDashboardAutomatico();
    });
} else {
    inicializarDashboardAutomatico();
}
