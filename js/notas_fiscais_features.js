// ================= DASHBOARD DE ESTATÍSTICAS COMPLETO =================
function atualizarDashboard() {
    if (!state || !state.notasFiscais) return;
    
    const hoje = new Date();
    const tresDiasFuturo = new Date(hoje);
    tresDiasFuturo.setDate(hoje.getDate() + 3);
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    
    // Cálculos dos KPIs
    const totalNF = state.notasFiscais.length;
    const valorTotal = state.notasFiscais.reduce((sum, n) => sum + (parseFloat(n.valor) || 0), 0);
    const pendentes = state.notasFiscais.filter(n => n.status === 'pendente' || n.status === 'pendente').length;
    const vencidas = state.notasFiscais.filter(n => n.status === 'vencido' || n.status === 'vencida').length;
    const pagas = state.notasFiscais.filter(n => n.status === 'pago' || n.status === 'paga').length;
    
    // A vencer (próximos 3 dias)
    const aVencer = state.notasFiscais.filter(function(n) {
        if (n.status === 'pago' || n.status === 'paga') return false;
        const dataVenc = n.dataVencimento ? new Date(n.dataVencimento) : new Date(n.data);
        return dataVenc >= hoje && dataVenc <= tresDiasFuturo;
    }).length;
    
    // Em atraso (vencidas há mais de 3 dias)
    const emAtraso = state.notasFiscais.filter(function(n) {
        if (n.status === 'pago' || n.status === 'paga') return false;
        const dataVenc = n.dataVencimento ? new Date(n.dataVencimento) : new Date(n.data);
        const tresDiasAtras = new Date(hoje);
        tresDiasAtras.setDate(hoje.getDate() - 3);
        return dataVenc < tresDiasAtras;
    }).length;
    
    // Concluídas este mês
    const concluidasMes = state.notasFiscais.filter(function(n) {
        if (n.status !== 'pago' && n.status !== 'paga') return false;
        const dataNota = new Date(n.data);
        return dataNota >= inicioMes;
    }).length;
    
    // Valor médio
    const valorMedio = totalNF > 0 ? valorTotal / totalNF : 0;
    
    // Atualizar elementos
    const ids = {
        'stats-total-nf': totalNF,
        'stats-valor-total': formatarMoeda ? formatarMoeda(valorTotal) : 'R$ ' + valorTotal.toFixed(2),
        'stats-pendentes': pendentes,
        'stats-vencidas': vencidas,
        'stats-a-vencer': aVencer,
        'stats-pagas': pagas,
        'stats-em-atraso': emAtraso,
        'stats-concluidas-mes': concluidasMes,
        'stats-valor-medio': formatarMoeda ? formatarMoeda(valorMedio) : 'R$ ' + valorMedio.toFixed(2)
    };
    
    Object.keys(ids).forEach(function(id) {
        const el = document.getElementById(id);
        if (el) el.textContent = ids[id];
    });
    
    atualizarGraficoStatus();
    atualizarGraficoTimeline();
}

function atualizarGraficoStatus() {
    const canvas = document.getElementById('stats-chart-canvas');
    if (!canvas || typeof Chart === 'undefined') return;
    
    const ctx = canvas.getContext('2d');
    const pago = state.notasFiscais.filter(function(n) { return n.status === 'pago' || n.status === 'paga'; }).length;
    const pendente = state.notasFiscais.filter(function(n) { return n.status === 'pendente'; }).length;
    const vencido = state.notasFiscais.filter(function(n) { return n.status === 'vencido' || n.status === 'vencida'; }).length;
    const aVencer = state.notasFiscais.filter(function(n) {
        if (n.status === 'pago' || n.status === 'paga') return false;
        const hoje = new Date();
        const tresDiasFuturo = new Date(hoje);
        tresDiasFuturo.setDate(hoje.getDate() + 3);
        const dataVenc = n.dataVencimento ? new Date(n.dataVencimento) : new Date(n.data);
        return dataVenc >= hoje && dataVenc <= tresDiasFuturo;
    }).length;
    
    if (window.statsChart) {
        window.statsChart.destroy();
    }
    
    window.statsChart = new Chart(ctx, {
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
                    display: true,
                    position: 'bottom',
                    labels: {
                        padding: 10,
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}

function atualizarGraficoTimeline() {
    const canvas = document.getElementById('stats-timeline-canvas');
    if (!canvas || typeof Chart === 'undefined') return;
    
    const ctx = canvas.getContext('2d');
    const hoje = new Date();
    const meses = [];
    const dados = [];
    
    // Últimos 6 meses
    for (var i = 5; i >= 0; i--) {
        const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const mesNome = data.toLocaleDateString('pt-BR', { month: 'short' });
        meses.push(mesNome);
        
        const notasMes = state.notasFiscais.filter(function(n) {
            const dataNota = new Date(n.data);
            return dataNota.getMonth() === data.getMonth() && dataNota.getFullYear() === data.getFullYear();
        }).length;
        
        dados.push(notasMes);
    }
    
    if (window.timelineChart) {
        window.timelineChart.destroy();
    }
    
    window.timelineChart = new Chart(ctx, {
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

// ================= BUSCA INTELIGENTE =================
let searchHistory = JSON.parse(localStorage.getItem('axis_search_history') || '[]');

function expandirBusca() {
    const suggestions = document.getElementById('search-suggestions');
    if (suggestions) {
        suggestions.style.display = 'block';
        carregarSugestoes();
    }
}

function colapsarBusca() {
    setTimeout(() => {
        const suggestions = document.getElementById('search-suggestions');
        if (suggestions) {
            suggestions.style.display = 'none';
        }
    }, 200);
}

function carregarSugestoes() {
    const container = document.getElementById('search-suggestions');
    if (!container) return;
    
    let html = '';
    
    if (searchHistory.length > 0) {
        html += '<div style="padding: 8px 16px; font-weight: 600; color: var(--text-secondary); font-size: 11px; text-transform: uppercase;">Histórico</div>';
        searchHistory.slice(0, 5).forEach(termo => {
            html += '<div class="suggestion-item" onclick="aplicarSugestao(\'' + termo + '\')"><i class="fas fa-history"></i> ' + termo + '</div>';
        });
    }
    
    if (state.clientes.length > 0) {
        html += '<div style="padding: 8px 16px; font-weight: 600; color: var(--text-secondary); font-size: 11px; text-transform: uppercase;">Clientes</div>';
        state.clientes.slice(0, 5).forEach(cliente => {
            html += '<div class="suggestion-item" onclick="aplicarSugestao(\'' + cliente + '\')"><i class="fas fa-building"></i> ' + cliente + '</div>';
        });
    }
    
    container.innerHTML = html || '<div class="suggestion-item">Nenhuma sugestão</div>';
}

function aplicarSugestao(termo) {
    const input = document.getElementById('search-input');
    if (input) {
        input.value = termo;
        buscarNotas(termo);
        adicionarAoHistoricoBusca(termo);
        colapsarBusca();
    }
}

function adicionarAoHistoricoBusca(termo) {
    if (termo && termo.trim()) {
        searchHistory = searchHistory.filter(h => h !== termo);
        searchHistory.unshift(termo);
        searchHistory = searchHistory.slice(0, 10);
        localStorage.setItem('axis_search_history', JSON.stringify(searchHistory));
    }
}

function aplicarFiltroRapido(tipo) {
    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    
    let dataFrom = '';
    let dataTo = hoje.toISOString().split('T')[0];
    
    switch(tipo) {
        case 'hoje':
            dataFrom = dataTo;
            break;
        case 'semana':
            dataFrom = inicioSemana.toISOString().split('T')[0];
            break;
        case 'mes':
            dataFrom = inicioMes.toISOString().split('T')[0];
            break;
    }
    
    state.filters.dataFrom = dataFrom;
    state.filters.dataTo = dataTo;
    
    document.querySelectorAll('.quick-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) {
        event.target.closest('.quick-filter-btn')?.classList.add('active');
    }
    
    renderizarConteudo();
    mostrarToast('Filtro aplicado: ' + tipo, 'success');
}

// ================= COMMAND PALETTE =================
const commands = [
    { id: 'upload', name: 'upload', icon: 'fa-cloud-upload-alt', description: 'Abrir upload de nota fiscal', action: function() { if (typeof abrirUpload !== 'undefined') abrirUpload(); } },
    { id: 'dashboard', name: 'dashboard', icon: 'fa-home', description: 'Ir para o dashboard', action: function() { if (typeof showSection !== 'undefined') showSection('dashboard'); } },
    { id: 'scanner', name: 'scanner', icon: 'fa-camera', description: 'Abrir scanner de notas', action: function() { if (typeof abrirScanner !== 'undefined') abrirScanner(); } },
    { id: 'relatorio', name: 'relatorio', icon: 'fa-chart-line', description: 'Gerar relatório', action: function() { if (typeof showSection !== 'undefined') showSection('relatorios'); if (typeof abrirRelatorios !== 'undefined') abrirRelatorios(); } },
    { id: 'backup', name: 'backup', icon: 'fa-database', description: 'Abrir backup', action: function() { if (typeof showSection !== 'undefined') showSection('backup'); } },
    { id: 'configuracoes', name: 'configuracoes', icon: 'fa-cog', description: 'Abrir configurações', action: function() { if (typeof showSection !== 'undefined') showSection('configuracoes'); } }
];

let selectedCommandIndex = 0;

function abrirCommandPalette() {
    const palette = document.getElementById('command-palette');
    if (palette) {
        palette.style.display = 'flex';
        const input = document.getElementById('command-input');
        if (input) {
            input.value = '';
            input.focus();
            // Renderizar todos os comandos inicialmente
            renderizarComandos(commands);
            selectedCommandIndex = 0;
        }
    }
}

function fecharCommandPalette() {
    const palette = document.getElementById('command-palette');
    if (palette) {
        palette.style.display = 'none';
    }
}

function filtrarComandos(event) {
    const termo = event.target.value.toLowerCase();
    const comandosFiltrados = commands.filter(function(cmd) {
        return cmd.name.toLowerCase().includes(termo) || cmd.id.toLowerCase().includes(termo);
    });
    
    renderizarComandos(comandosFiltrados);
    selectedCommandIndex = 0;
}

function renderizarComandos(comandos) {
    const container = document.getElementById('command-palette-list');
    if (!container) return;
    
    if (comandos.length === 0) {
        container.innerHTML = '<div class="command-item">Nenhum comando encontrado</div>';
        return;
    }
    
    let html = '';
    comandos.forEach(function(cmd, index) {
        html += '<div class="command-item ' + (index === selectedCommandIndex ? 'selected' : '') + '" onclick="executarComandoSelecionado(\'' + cmd.id + '\')" data-command-id="' + cmd.id + '">';
        html += '<i class="fas ' + cmd.icon + '"></i>';
        html += '<span class="command-item-name">' + cmd.name + '</span>';
        if (cmd.description) {
            html += '<span style="font-size: 12px; color: var(--text-secondary); margin-left: auto;">' + cmd.description + '</span>';
        }
        html += '</div>';
    });
    
    container.innerHTML = html;
}

function executarComando(event) {
    if (event.key === 'Escape') {
        fecharCommandPalette();
        return;
    }
    
    if (event.key === 'Enter') {
        const selected = document.querySelector('.command-item.selected');
        if (selected) {
            const cmdId = selected.dataset.commandId;
            executarComandoSelecionado(cmdId);
        }
        return;
    }
    
    if (event.key === 'ArrowDown') {
        event.preventDefault();
        const items = document.querySelectorAll('.command-item');
        selectedCommandIndex = Math.min(selectedCommandIndex + 1, items.length - 1);
        atualizarSelecaoComando();
        return;
    }
    
    if (event.key === 'ArrowUp') {
        event.preventDefault();
        selectedCommandIndex = Math.max(selectedCommandIndex - 1, 0);
        atualizarSelecaoComando();
        return;
    }
}

function atualizarSelecaoComando() {
    document.querySelectorAll('.command-item').forEach(function(item, index) {
        item.classList.toggle('selected', index === selectedCommandIndex);
    });
}

function executarComandoSelecionado(cmdId) {
    const cmd = commands.find(function(c) { return c.id === cmdId; });
    if (cmd && cmd.action) {
        cmd.action();
        fecharCommandPalette();
    }
}

// Atalho global Cmd/Ctrl+K
document.addEventListener('keydown', function(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        abrirCommandPalette();
    }
    
    if (e.key === 'Escape') {
        const palette = document.getElementById('command-palette');
        if (palette && palette.style.display === 'flex') {
            fecharCommandPalette();
        }
    }
});

// ================= PREVIEW LATERAL DE PDF =================
function mostrarPreviewPDF(nota) {
    const panel = document.getElementById('pdf-preview-panel');
    const content = document.getElementById('pdf-preview-content');
    const title = document.getElementById('preview-title');
    
    if (!panel || !content) return;
    
    if (title) title.textContent = 'NF-' + nota.numero + '.pdf';
    
    content.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-file-pdf" style="font-size: 64px; color: var(--danger-color); margin-bottom: 16px;"></i><h4>' + nota.cliente + '</h4><p>Data: ' + formatarData(nota.data) + '</p><p>Valor: ' + formatarMoeda(nota.valor) + '</p><p>Status: <span class="status-badge ' + nota.status + '">' + nota.status + '</span></p><button class="btn-primary" onclick="abrirVisualizadorPDF(' + JSON.stringify(nota).replace(/"/g, '&quot;') + ')" style="margin-top: 20px;"><i class="fas fa-eye"></i> Abrir PDF Completo</button></div>';
    
    panel.style.display = 'flex';
}

function fecharPreviewPDF() {
    const panel = document.getElementById('pdf-preview-panel');
    if (panel) {
        panel.style.display = 'none';
    }
}

// ================= BARRA DE AÇÕES EM LOTE =================
function mostrarBarraAcoes() {
    const bar = document.getElementById('batch-actions-bar');
    if (bar && state.selectedItems.length > 0) {
        bar.style.display = 'block';
        const countEl = document.getElementById('batch-count');
        if (countEl) countEl.textContent = state.selectedItems.length + ' selecionados';
    }
}

function fecharBarraAcoes() {
    const bar = document.getElementById('batch-actions-bar');
    if (bar) {
        bar.style.display = 'none';
    }
    state.selectedItems = [];
    renderizarConteudo();
}

function aplicarTagEmLote() {
    if (state.selectedItems.length === 0) {
        mostrarToast('Selecione itens primeiro', 'error');
        return;
    }
    abrirTags();
}

function downloadEmLote() {
    if (state.selectedItems.length === 0) {
        mostrarToast('Selecione itens primeiro', 'error');
        return;
    }
    
    const pdfs = state.selectedItems.filter(function(item) { return item.tipo === 'pdf'; });
    if (pdfs.length === 0) {
        mostrarToast('Apenas PDFs podem ser baixados', 'error');
        return;
    }
    
    mostrarToast('Preparando download de ' + pdfs.length + ' arquivo(s)...', 'success');
}

function enviarEmailEmLote() {
    if (state.selectedItems.length === 0) {
        mostrarToast('Selecione itens primeiro', 'error');
        return;
    }
    mostrarToast('Funcionalidade de email em desenvolvimento', 'success');
}

function exportarEmLote() {
    if (state.selectedItems.length === 0) {
        mostrarToast('Selecione itens primeiro', 'error');
        return;
    }
    abrirRelatorios();
}

// ================= SISTEMA DE TAGS =================
let tags = JSON.parse(localStorage.getItem('axis_tags') || '[]');

function abrirTags() {
    const modal = document.getElementById('tags-modal');
    if (modal) {
        modal.classList.add('show');
        renderizarTags();
    }
}

function renderizarTags() {
    const container = document.getElementById('tags-list');
    if (!container) return;
    
    if (tags.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">Nenhuma tag criada</div>';
        return;
    }
    
    let html = '';
    tags.forEach(function(tag, index) {
        html += '<div class="tag-item"><div class="tag-color" style="background-color: ' + tag.cor + ';"></div><span>' + tag.nome + '</span><button onclick="removerTag(' + index + ')" style="margin-left: auto; background: none; border: none; color: var(--danger-color); cursor: pointer;"><i class="fas fa-times"></i></button></div>';
    });
    
    container.innerHTML = html;
}

function criarNovaTag() {
    const nomeInput = document.getElementById('nova-tag-nome');
    const corInput = document.getElementById('nova-tag-cor');
    
    if (!nomeInput || !corInput) return;
    
    const nome = nomeInput.value.trim();
    const cor = corInput.value;
    
    if (!nome) {
        mostrarToast('Digite um nome para a tag', 'error');
        return;
    }
    
    if (tags.find(function(t) { return t.nome === nome; })) {
        mostrarToast('Uma tag com esse nome já existe', 'error');
        return;
    }
    
    tags.push({ nome: nome, cor: cor });
    localStorage.setItem('axis_tags', JSON.stringify(tags));
    
    nomeInput.value = '';
    renderizarTags();
    mostrarToast('Tag criada com sucesso', 'success');
}

function removerTag(index) {
    tags.splice(index, 1);
    localStorage.setItem('axis_tags', JSON.stringify(tags));
    renderizarTags();
    mostrarToast('Tag removida', 'success');
}

// ================= TIMELINE VISUAL =================
function abrirTimeline() {
    const modal = document.getElementById('timeline-modal');
    if (modal) {
        modal.classList.add('show');
        renderizarTimeline();
    }
}

function renderizarTimeline() {
    const calendar = document.getElementById('timeline-calendar');
    if (calendar) {
        calendar.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">Calendário será implementado aqui</p>';
    }
}

// ================= RELATÓRIOS =================
function abrirRelatorios() {
    const modal = document.getElementById('relatorios-modal');
    if (modal) {
        modal.classList.add('show');
    }
}

function gerarRelatorio() {
    const tipoEl = document.getElementById('relatorio-tipo');
    const dataInicioEl = document.getElementById('relatorio-data-inicio');
    const dataFimEl = document.getElementById('relatorio-data-fim');
    
    if (!tipoEl || !dataInicioEl || !dataFimEl) return;
    
    const tipo = tipoEl.value;
    const dataInicio = dataInicioEl.value;
    const dataFim = dataFimEl.value;
    
    mostrarToast('Gerando relatório ' + tipo.toUpperCase() + '...', 'success');
    
    const notasFiltradas = state.notasFiscais.filter(function(nota) {
        if (dataInicio && nota.data < dataInicio) return false;
        if (dataFim && nota.data > dataFim) return false;
        return true;
    });
    
    if (tipo === 'excel') {
        exportarParaExcel(notasFiltradas);
    } else if (tipo === 'csv') {
        exportarParaCSV(notasFiltradas);
    } else {
        exportarParaPDF(notasFiltradas);
    }
    
    fecharModal('relatorios-modal');
}

function exportarParaExcel(notas) {
    mostrarToast('Exportação para Excel em desenvolvimento', 'success');
}

function exportarParaCSV(notas) {
    let csv = 'Cliente,Data,Valor,Status,Numero\n';
    notas.forEach(function(nota) {
        csv += nota.cliente + ',' + nota.data + ',' + nota.valor + ',' + nota.status + ',' + nota.numero + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notas_fiscais_' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
    
    mostrarToast('CSV exportado com sucesso', 'success');
}

function exportarParaPDF(notas) {
    mostrarToast('Exportação para PDF em desenvolvimento', 'success');
}

// ================= INTEGRAÇÕES =================
function enviarPorEmail(notas) {
    mostrarToast('Funcionalidade de email em desenvolvimento', 'success');
}

function compartilharPorWhatsApp(notas) {
    const texto = notas.map(function(n) { return 'NF-' + n.numero + ' - ' + formatarMoeda(n.valor); }).join('\\n');
    const url = 'https://wa.me/?text=' + encodeURIComponent(texto);
    window.open(url, '_blank');
    mostrarToast('Abrindo WhatsApp...', 'success');
}

// ================= AUTOMAÇÕES =================
function configurarLembretes() {
    const hoje = new Date();
    const proximos7Dias = new Date(hoje);
    proximos7Dias.setDate(hoje.getDate() + 7);
    
    const notasProximas = state.notasFiscais.filter(function(nota) {
        if (nota.status !== 'pendente') return false;
        const dataNota = new Date(nota.data);
        return dataNota >= hoje && dataNota <= proximos7Dias;
    });
    
    if (notasProximas.length > 0) {
        mostrarToast(notasProximas.length + ' nota(s) próxima(s) do vencimento', 'warning');
    }
}

setInterval(configurarLembretes, 5 * 60 * 1000);

// ================= SEGURANÇA E BACKUP =================
let lixeiraFeatures = JSON.parse(localStorage.getItem('axis_lixeira') || '[]');

function moverParaLixeira(item) {
    lixeiraFeatures.push({
        item: item,
        deletadoEm: new Date().toISOString()
    });
    localStorage.setItem('axis_lixeira', JSON.stringify(lixeiraFeatures));
}

function restaurarDaLixeira(index) {
    const item = lixeiraFeatures[index];
    if (item && item.item && item.item.nota) {
        state.notasFiscais.push(item.item.nota);
    }
    lixeiraFeatures.splice(index, 1);
    localStorage.setItem('axis_lixeira', JSON.stringify(lixeiraFeatures));
    salvarDados();
    mostrarToast('Item restaurado', 'success');
}

// ================= EXPORTAR FUNÇÕES GLOBAIS =================
window.abrirCommandPalette = abrirCommandPalette;
window.fecharCommandPalette = fecharCommandPalette;
window.filtrarComandos = filtrarComandos;
window.executarComando = executarComando;
window.executarComandoSelecionado = executarComandoSelecionado;
window.aplicarFiltroRapido = aplicarFiltroRapido;
window.expandirBusca = expandirBusca;
window.colapsarBusca = colapsarBusca;
window.aplicarSugestao = aplicarSugestao;
window.mostrarPreviewPDF = mostrarPreviewPDF;
window.fecharPreviewPDF = fecharPreviewPDF;
window.mostrarBarraAcoes = mostrarBarraAcoes;
window.fecharBarraAcoes = fecharBarraAcoes;
window.aplicarTagEmLote = aplicarTagEmLote;
window.downloadEmLote = downloadEmLote;
window.enviarEmailEmLote = enviarEmailEmLote;
window.exportarEmLote = exportarEmLote;
window.abrirTags = abrirTags;
window.criarNovaTag = criarNovaTag;
window.removerTag = removerTag;
window.abrirTimeline = abrirTimeline;
window.abrirRelatorios = abrirRelatorios;
window.gerarRelatorio = gerarRelatorio;
window.enviarPorEmail = enviarPorEmail;
window.compartilharPorWhatsApp = compartilharPorWhatsApp;

// Hook para atualizar dashboard quando salvarDados for chamado
(function() {
    // Aguardar carregamento completo
    setTimeout(function() {
        if (typeof salvarDados !== 'undefined' && typeof window.salvarDados === 'undefined') {
            const originalSalvarDados = salvarDados;
            window.salvarDados = function() {
                originalSalvarDados();
                if (typeof atualizarDashboard !== 'undefined') {
                    setTimeout(atualizarDashboard, 100);
                }
            };
        }
    }, 1000);
})();

// Inicializar dashboard após carregamento completo
(function() {
    function initDashboard() {
        if (typeof state !== 'undefined' && typeof atualizarDashboard !== 'undefined') {
            setTimeout(function() {
                atualizarDashboard();
            }, 1500);
        } else {
            setTimeout(initDashboard, 500);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDashboard);
    } else {
        initDashboard();
    }
})();
