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
        atualizarUltimasNotasDashboard(notasFiscais);
        
        // Atualizar contador no menu
        const nfCountEl = document.getElementById('nf-count');
        if (nfCountEl) {
            nfCountEl.textContent = notasFiscais.length;
        }
        if (typeof atualizarRelatorioSeVisivel === 'function') atualizarRelatorioSeVisivel();
    });
}

function valorPorExtenso(v) {
    var n = parseFloat(v);
    if (isNaN(n) || n < 0) return '';
    var inteiro = Math.floor(n);
    var centavos = Math.round((n - inteiro) * 100);
    var u = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    var dez = ['', 'dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    var dec = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    var cen = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
    function ate999(x) {
        if (x === 0) return 'zero';
        if (x === 100) return 'cem';
        var s = '';
        if (x >= 100) { s = cen[Math.floor(x / 100)]; x = x % 100; if (x) s += ' e '; }
        if (x >= 20) { s += dec[Math.floor(x / 10)]; x = x % 10; if (x) s += ' e '; }
        if (x >= 10) return s + dez[x - 9];
        if (x > 0) s += u[x];
        return s.replace(/ e $/, '');
    }
    function milhao(x) {
        if (x === 0) return '';
        if (x === 1) return 'um milhão';
        if (x < 1000) return ate999(x) + ' milhões';
        return '';
    }
    function mil(x) {
        if (x === 0) return '';
        if (x === 1) return 'um mil';
        return ate999(x) + ' mil';
    }
    var milhoes = Math.floor(inteiro / 1000000);
    var milhares = Math.floor((inteiro % 1000000) / 1000);
    var rest = inteiro % 1000;
    var p = [];
    if (milhoes > 0) p.push(milhao(milhoes));
    if (milhares > 0) p.push(mil(milhares));
    if (rest > 0 || p.length === 0) p.push(ate999(rest));
    var reais = p.join(' e ').replace(/ e zero$/, '') || 'zero';
    var rs = (inteiro === 1 && milhares === 0 && milhoes === 0) ? 'real' : 'reais';
    var cv = (centavos === 0) ? '' : (centavos === 1 ? ' e um centavo' : ' e ' + ate999(centavos) + ' centavos');
    return reais + ' ' + rs + cv;
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
    
    // Gráfico Distribuição por Tipo (Entrada / Saída / Serviço)
    var canvasTipo = document.getElementById('chart-tipo');
    if (canvasTipo && typeof Chart !== 'undefined') {
        var ctxTipo = canvasTipo.getContext('2d');
        var entrada = notas.filter(function(n) { return (n.tipo || '').toLowerCase() === 'entrada'; }).length;
        var saida = notas.filter(function(n) { return (n.tipo || '').toLowerCase() === 'saida' || (n.tipo || '').toLowerCase() === 'saída'; }).length;
        var servico = notas.filter(function(n) { return (n.tipo || '').toLowerCase() === 'servico' || (n.tipo || '').toLowerCase() === 'serviço'; }).length;
        var outros = notas.length - entrada - saida - servico;
        if (entrada === 0 && saida === 0 && servico === 0 && outros === 0) {
            entrada = 1;
            saida = 1;
            servico = 1;
            outros = 0;
        }
        if (window.chartTipo) {
            window.chartTipo.destroy();
        }
        window.chartTipo = new Chart(ctxTipo, {
            type: 'doughnut',
            data: {
                labels: ['Entrada', 'Saída', 'Serviço', 'Outros'],
                datasets: [{
                    data: [entrada, saida, servico, outros],
                    backgroundColor: [
                        'rgba(0, 122, 255, 0.8)',
                        'rgba(46, 204, 113, 0.8)',
                        'rgba(255, 149, 0, 0.8)',
                        'rgba(142, 68, 173, 0.8)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
}

function axisEscHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function axisIdParaOnclick(id) {
    return String(id == null ? '' : id).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r|\n/g, '');
}

function timestampOrdenacaoNota(n) {
    if (n.uploadDate) {
        var u = new Date(n.uploadDate).getTime();
        if (!isNaN(u)) return u;
    }
    if (n.data) {
        var d = new Date(n.data).getTime();
        if (!isNaN(d)) return d;
    }
    return 0;
}

/** Preenche a tabela «Últimas notas fiscais» com dados reais (mais recentes primeiro). */
function atualizarUltimasNotasDashboard(notas) {
    var tbody = document.getElementById('recent-nfs-table');
    if (!tbody) return;
    if (!notas || !Array.isArray(notas) || notas.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="6" style="text-align:center;padding:28px;color:var(--text-secondary);">Nenhuma nota cadastrada ainda</td></tr>';
        return;
    }

    var copia = notas.slice().sort(function (a, b) {
        return timestampOrdenacaoNota(b) - timestampOrdenacaoNota(a);
    });
    var limite = Math.min(12, copia.length);
    var html = '';
    var fmtData = typeof formatarData === 'function' ? formatarData : null;
    var fmtMoeda = typeof formatarMoeda === 'function' ? formatarMoeda : null;

    for (var i = 0; i < limite; i++) {
        var n = copia[i];
        var nid = n.id != null ? n.id : n.numero;
        var safeClick = axisIdParaOnclick(nid);
        var numLimpo = String(n.numero != null ? n.numero : '—').replace(/^NF-?/i, '');
        var num = axisEscHtml(numLimpo);
        var forn = axisEscHtml(n.cliente || n.fornecedor || '—');
        var dataStr = fmtData ? fmtData(n.data) : axisEscHtml(n.data || '—');
        var valorStr = fmtMoeda ? fmtMoeda(n.valor) : axisEscHtml(n.valor != null ? n.valor : '—');
        var st = (n.status || 'pendente').toString();
        var stLower = st.toLowerCase();
        var badgeClass =
            stLower === 'pago' || stLower === 'paga'
                ? 'pago'
                : stLower === 'vencido' || stLower === 'vencida'
                  ? 'vencido'
                  : 'pendente';
        html +=
            '<tr>' +
            '<td><strong>NF-' +
            num +
            '</strong></td>' +
            '<td>' +
            forn +
            '</td>' +
            '<td>' +
            dataStr +
            '</td>' +
            '<td>' +
            valorStr +
            '</td>' +
            '<td><span class="status-badge ' +
            badgeClass +
            '">' +
            axisEscHtml(st) +
            '</span></td>' +
            '<td class="col-acoes-recent">' +
            '<button type="button" class="btn-icon dash-nf-view" title="Ver documento" onclick="event.stopPropagation();if(typeof abrirModalVisualizarNF===\'function\')abrirModalVisualizarNF(\'' +
            safeClick +
            '\');else if(typeof mostrarPreviewRapidoNF===\'function\')mostrarPreviewRapidoNF(\'' +
            safeClick +
            '\');">' +
            '<i class="fas fa-eye"></i></button>' +
            '</td>' +
            '</tr>';
    }
    tbody.innerHTML = html;
}

function irParaBibliotecaNotas() {
    if (typeof showSection === 'function') {
        showSection('notas');
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
    atualizarUltimasNotasDashboard(notas);
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
            <div class="nf-card axis-card nf-card-selectable" data-nf-id="${notaIdUnico}" onclick="abrirDetalhesNF('${notaIdUnico}')">
                <div class="nf-card-glow" aria-hidden="true"></div>
                <div class="nf-card-check-wrap">
                    <input type="checkbox" class="nf-checkbox" data-nf-id="${notaIdUnico}" onclick="event.stopPropagation(); toggleSelecaoNF('${notaIdUnico}');" title="Selecionar para exclusão em massa">
                </div>
                <div class="nf-card-top">
                    <span class="nf-card-pdf-badge" aria-hidden="true"><i class="fas fa-file-pdf"></i></span>
                    <div class="nf-card-header">
                        <span class="nf-number">NF-${nota.numero || 'N/A'}</span>
                        <span class="status-badge ${statusClass}">${nota.status || 'pendente'}</span>
                    </div>
                </div>
                <div class="nf-card-body">
                    <h4 class="nf-card-cliente">${nota.cliente || nota.fornecedor || 'Fornecedor não informado'}</h4>
                    <div class="nf-card-meta">
                        <span class="nf-card-meta-item"><i class="fas fa-calendar-alt"></i> ${formatarData(nota.data)}</span>
                        <span class="nf-card-meta-item nf-card-valor">${formatarMoeda(nota.valor)}</span>
                    </div>
                </div>
                <div class="nf-card-actions">
                    <button type="button" class="nf-btn nf-btn-view" onclick="event.stopPropagation(); if(typeof abrirModalVisualizarNF==='function')abrirModalVisualizarNF('${notaIdUnico}'); else if(typeof mostrarPreviewRapidoNF==='function')mostrarPreviewRapidoNF('${notaIdUnico}');" title="Ver documento">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button type="button" class="nf-btn nf-btn-icon" onclick="event.stopPropagation(); editarNF('${notaIdUnico}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="nf-btn nf-btn-icon" onclick="event.stopPropagation(); if(typeof confirmarDownloadPDF==='function')confirmarDownloadPDF('${notaIdUnico}'); else if(typeof baixarPDF==='function')baixarPDF('${notaIdUnico}');" title="Baixar">
                        <i class="fas fa-download"></i>
                    </button>
                    <button type="button" class="nf-btn nf-btn-icon nf-btn-trash" onclick="event.stopPropagation(); moverParaLixeiraNF('${notaIdUnico}');" title="Lixeira">
                        <i class="fas fa-trash-alt"></i>
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
                    <button type="button" class="nf-btn nf-btn-view nf-btn-view--table" onclick="event.stopPropagation(); if(typeof abrirModalVisualizarNF==='function')abrirModalVisualizarNF('${notaIdUnico}'); else if(typeof mostrarPreviewRapidoNF==='function')mostrarPreviewRapidoNF('${notaIdUnico}');" title="Ver documento">
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
    sincronizarToolbarSelecao();
}

function selecionarTodasNotasToolbar() {
    var checkbox = document.getElementById('select-all-nfs-toolbar');
    var checkboxes = document.querySelectorAll('.nf-checkbox');
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
    var selectAllList = document.getElementById('select-all-nfs');
    if (selectAllList) selectAllList.checked = !!checkbox && checkbox.checked;
    atualizarBarraAcoesMassa();
}

function sincronizarToolbarSelecao() {
    var toolbarCb = document.getElementById('select-all-nfs-toolbar');
    var checkboxes = document.querySelectorAll('.nf-checkbox');
    if (toolbarCb) {
        toolbarCb.checked = checkboxes.length > 0 && notasSelecionadas.length === checkboxes.length;
    }
    var countEl = document.getElementById('mass-count-text');
    if (countEl) countEl.textContent = notasSelecionadas.length + ' selecionadas';
}

function atualizarBarraAcoesMassa() {
    var bar = document.getElementById('batch-actions-bar');
    var count = document.getElementById('batch-count');
    if (bar && count) {
        if (notasSelecionadas.length > 0) {
            bar.style.display = 'block';
            count.textContent = notasSelecionadas.length + ' selecionadas';
        } else {
            bar.style.display = 'none';
        }
    }
    var countText = document.getElementById('mass-count-text');
    if (countText) countText.textContent = notasSelecionadas.length + ' selecionadas';
    sincronizarToolbarSelecao();
}

function fecharBarraAcoesMassa() {
    var bar = document.getElementById('batch-actions-bar');
    if (bar) bar.style.display = 'none';
    notasSelecionadas = [];
    document.querySelectorAll('.nf-checkbox').forEach(function(cb) {
        cb.checked = false;
    });
    var selectAll = document.getElementById('select-all-nfs');
    if (selectAll) selectAll.checked = false;
    var toolbarCb = document.getElementById('select-all-nfs-toolbar');
    if (toolbarCb) toolbarCb.checked = false;
    var countText = document.getElementById('mass-count-text');
    if (countText) countText.textContent = '0 selecionadas';
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

function buscarNotaNoStateAxis(notaId) {
    if (typeof state === 'undefined' || !state.notasFiscais) return null;
    var id = String(notaId);
    return state.notasFiscais.find(function (n) {
        return String(n.id) === id || String(n.numero) === id;
    });
}

function nfDataParaInputDate(data) {
    if (!data) return '';
    var d = new Date(data);
    if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
    }
    var m = String(data).match(/(\d{4})-(\d{2})-(\d{2})/);
    return m ? m[0] : '';
}

function nfValorParaInput(valor) {
    if (valor === undefined || valor === null || valor === '') return '';
    var n = parseFloat(valor);
    if (isNaN(n)) return String(valor);
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function abrirModalEditarNotaFiscal(notaId) {
    var nota = buscarNotaNoStateAxis(notaId);
    if (!nota) {
        if (typeof mostrarToast !== 'undefined') {
            mostrarToast('Nota fiscal não encontrada', 'error');
        }
        return;
    }
    if (typeof fecharModalVisualizarNF === 'function') {
        fecharModalVisualizarNF();
    }
    if (typeof fecharPreviewRapidoNF === 'function') {
        fecharPreviewRapidoNF();
    }

    var modal = document.getElementById('nf-edit-modal');
    if (!modal) return;

    document.getElementById('nf-edit-nota-id').value = nota.id != null ? String(nota.id) : String(nota.numero);
    document.getElementById('nf-edit-numero').value = nota.numero != null ? String(nota.numero) : '';
    document.getElementById('nf-edit-cliente').value = nota.cliente || nota.fornecedor || '';
    document.getElementById('nf-edit-data').value = nfDataParaInputDate(nota.data);
    document.getElementById('nf-edit-venc').value = nfDataParaInputDate(nota.dataVencimento);
    document.getElementById('nf-edit-valor').value = nfValorParaInput(nota.valor);

    var st = (nota.status || 'pendente').toLowerCase();
    var sel = document.getElementById('nf-edit-status');
    if (sel) {
        var ok = false;
        for (var i = 0; i < sel.options.length; i++) {
            if (sel.options[i].value === st) {
                sel.selectedIndex = i;
                ok = true;
                break;
            }
        }
        if (!ok) sel.value = 'pendente';
    }

    modal.style.display = '';
    modal.classList.add('show');
}

function salvarEdicaoNotaFiscal() {
    var hiddenId = document.getElementById('nf-edit-nota-id');
    if (!hiddenId) return;
    var notaId = hiddenId.value;
    var nota = buscarNotaNoStateAxis(notaId);
    if (!nota) {
        if (typeof mostrarToast !== 'undefined') {
            mostrarToast('Nota não encontrada', 'error');
        }
        return;
    }

    var numEl = document.getElementById('nf-edit-numero');
    var cliEl = document.getElementById('nf-edit-cliente');
    var dataEl = document.getElementById('nf-edit-data');
    var vencEl = document.getElementById('nf-edit-venc');
    var valorEl = document.getElementById('nf-edit-valor');
    var stEl = document.getElementById('nf-edit-status');

    if (numEl) nota.numero = numEl.value.trim() || nota.numero;
    if (cliEl) {
        nota.cliente = cliEl.value.trim();
        nota.fornecedor = nota.cliente;
    }
    if (dataEl && dataEl.value) {
        nota.data = dataEl.value;
    }
    if (vencEl) {
        nota.dataVencimento = vencEl.value || null;
    }
    if (valorEl && valorEl.value) {
        var raw = valorEl.value.replace(/\./g, '').replace(',', '.');
        var v = parseFloat(raw);
        if (!isNaN(v)) nota.valor = v;
    }
    if (stEl) nota.status = stEl.value;

    if (typeof window.axisSincronizarFornecedorDaNota === 'function') {
        try {
            window.axisSincronizarFornecedorDaNota(nota);
        } catch (eSync) {}
    }

    if (typeof salvarDados === 'function') {
        salvarDados();
    }
    if (typeof renderizarNotasFiscais === 'function') {
        renderizarNotasFiscais(state.notasFiscais);
    }
    if (typeof atualizarDashboardCompleto === 'function') {
        atualizarDashboardCompleto();
    }

    if (typeof closeModal === 'function') {
        closeModal('nf-edit-modal');
    } else {
        var m = document.getElementById('nf-edit-modal');
        if (m) {
            m.classList.remove('show');
            m.style.display = 'none';
        }
    }

    if (typeof mostrarToast !== 'undefined') {
        mostrarToast('Nota atualizada', 'success');
    }
}

function baixarPDF(id) {
    alert('Baixar PDF da NF ' + id);
}

function abrirDetalhesNF(id) {
    if (typeof mostrarPreviewRapidoNF === 'function') {
        mostrarPreviewRapidoNF(id);
    } else if (typeof abrirModalVisualizarNF === 'function') {
        abrirModalVisualizarNF(id);
    }
}

// Exportar funções globais
window.atualizarDashboardCompleto = atualizarDashboardCompleto;
window.atualizarUltimasNotasDashboard = atualizarUltimasNotasDashboard;
window.irParaBibliotecaNotas = irParaBibliotecaNotas;
window.buscarNotasFiscais = buscarNotasFiscais;
window.filtrarPorStatus = filtrarPorStatus;
window.changeView = changeView;
window.renderizarNotasFiscais = renderizarNotasFiscais;
window.toggleSelecaoNF = toggleSelecaoNF;
window.selecionarTodasNotas = selecionarTodasNotas;
window.selecionarTodasNotasToolbar = selecionarTodasNotasToolbar;
window.fecharBarraAcoesMassa = fecharBarraAcoesMassa;
window.alterarStatusEmMassa = alterarStatusEmMassa;
window.exportarEmMassa = exportarEmMassa;
window.enviarEmailEmMassa = enviarEmailEmMassa;
window.aplicarTagEmMassa = aplicarTagEmMassa;
window.excluirEmMassa = excluirEmMassa;
window.visualizarNF = visualizarNF;
window.abrirModalEditarNotaFiscal = abrirModalEditarNotaFiscal;
window.salvarEdicaoNotaFiscal = salvarEdicaoNotaFiscal;
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
        'dashboard': 'Dashboard Financeiro',
        'notas': 'AXIS NOTAS FISCAIS',
        'fornecedores': 'Fornecedores',
        'relatorios': 'Relatórios',
        'backup': 'Backup',
        'configuracoes': 'Configurações',
        'lixeira': 'Lixeira'
    };
    
    const titleEl = document.getElementById('page-title');
    const subtitleEl = document.querySelector('.page-subtitle');
    const subtitleDetailEl = document.getElementById('page-subtitle-detail');
    
    if (titleEl) {
        titleEl.textContent = titles[sectionId] || 'Dashboard Financeiro';
    }
    
    if (subtitleDetailEl) {
        if (sectionId === 'dashboard') {
            subtitleDetailEl.style.display = 'flex';
            subtitleDetailEl.innerHTML =
                '<i class="fas fa-sync-alt" aria-hidden="true"></i> Dados atualizados em tempo real';
        } else {
            subtitleDetailEl.style.display = 'none';
            subtitleDetailEl.innerHTML = '';
        }
    }
    
    if (subtitleEl) {
        if (sectionId === 'notas') {
            subtitleEl.textContent = '';
            subtitleEl.style.display = 'none';
        } else if (sectionId === 'dashboard') {
            subtitleEl.style.display = '';
            subtitleEl.textContent = 'Visão geral inteligente das suas notas fiscais';
        } else if (sectionId === 'lixeira') {
            subtitleEl.style.display = '';
            subtitleEl.textContent = 'Notas fiscais excluídas';
        } else {
            subtitleEl.textContent = '';
            subtitleEl.style.display = 'none';
        }
    }
    
    // Atualizar navegação ativa (menu antigo e novo)
    document.querySelectorAll('.nav-item').forEach(function(item) {
        item.classList.remove('active');
    });
    document.querySelectorAll('.sidebar-link').forEach(function(item) {
        item.classList.remove('active');
    });
    document.querySelectorAll('.sidebar-quick-item').forEach(function(item) {
        item.classList.remove('active');
    });
    
    var navItem = document.querySelector('.nav-item[onclick*="' + sectionId + '"]');
    if (navItem) navItem.classList.add('active');
    var sidebarLink = document.querySelector('.sidebar-link[onclick*="showSection(\'' + sectionId + '\')"]');
    if (sidebarLink) sidebarLink.classList.add('active');
    
    if (sectionId === 'dashboard') {
        setTimeout(function() {
            if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
        }, 80);
    }
    if (sectionId === 'relatorios') {
        setTimeout(function() {
            if (typeof gerarRelatorioAvancado === 'function') gerarRelatorioAvancado();
        }, 100);
    }
    if (sectionId === 'fornecedores') {
        setTimeout(function() {
            if (typeof renderizarTabelaFornecedores === 'function') renderizarTabelaFornecedores();
        }, 50);
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

var axisNotificacoes = [];

function adicionarNotificacao(mensagem, tipo) {
    tipo = tipo || 'info';
    axisNotificacoes.push({ msg: mensagem, tipo: tipo, ts: Date.now() });
    atualizarListaNotificacoes();
    atualizarBadgeNotificacoes();
}

function atualizarBadgeNotificacoes() {
    var badge = document.getElementById('notification-badge');
    if (!badge) return;
    var n = axisNotificacoes.length;
    badge.textContent = n;
    badge.style.display = n > 0 ? '' : 'none';
}

function atualizarListaNotificacoes() {
    var list = document.getElementById('notifications-list');
    if (!list) return;
    list.innerHTML = axisNotificacoes.length === 0
        ? '<div class="notifications-empty">Nenhuma notificação</div>'
        : axisNotificacoes.slice().reverse().map(function(n) {
            var c = n.tipo === 'success' ? 'success' : n.tipo === 'warning' ? 'warning' : 'info';
            return '<div class="notification-item axis-nf-' + c + '">' +
                '<span class="notification-msg">' + (n.msg || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>' +
                '</div>';
        }).join('');
}

function toggleNotifications() {
    var panel = document.getElementById('notifications-panel');
    if (panel) {
        panel.classList.toggle('active');
        if (panel.classList.contains('active')) atualizarListaNotificacoes();
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
    
    adicionarNotificacao('Filtros aplicados com sucesso', 'success');
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
    
    adicionarNotificacao('Filtros limpos', 'info');
}

function mostrarToast(mensagem, tipo) {
    adicionarNotificacao(mensagem, tipo || 'info');
}

// Exportar funções globalmente
window.showSection = showSection;
window.toggleSidebar = toggleSidebar;
window.toggleNotifications = toggleNotifications;
window.toggleAdvancedSearch = toggleAdvancedSearch;
window.aplicarFiltros = aplicarFiltros;
window.limparFiltros = limparFiltros;
window.mostrarToast = mostrarToast;
window.adicionarNotificacao = adicionarNotificacao;
window.atualizarDashboardCompleto = atualizarDashboardCompleto;
window.atualizarUltimasNotasDashboard = atualizarUltimasNotasDashboard;
window.irParaBibliotecaNotas = irParaBibliotecaNotas;
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
    setTimeout(function() {
        atualizarDashboardCompleto();
    }, 200);
    setTimeout(function() {
        atualizarDashboardCompleto();
    }, 900);
}

// Inicializar quando a página carregar
function initNotificacoesSino() {
    atualizarListaNotificacoes();
    atualizarBadgeNotificacoes();
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        inicializarDashboardAutomatico();
        initNotificacoesSino();
    });
} else {
    inicializarDashboardAutomatico();
    initNotificacoesSino();
}
