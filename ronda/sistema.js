// ============================================
// SISTEMA DE RONDAS - JavaScript Completo
// ============================================

// ===== VARIÁVEIS GLOBAIS =====
const { jsPDF } = window.jspdf;
let rondas = [];
let calendarioData = new Date();
let paginaAtual = 1;
const itensPorPagina = 10;

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Inicializando Sistema de Rondas...');
    
    // Esconder loading após 1.5 segundos
    setTimeout(() => {
        document.getElementById('loading').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loading').style.display = 'none';
        }, 500);
    }, 1500);
    
    // Carregar dados
    carregarDados();
    
    // Inicializar componentes
    inicializarNavegacao();
    inicializarFormulario();
    inicializarDashboard();
    inicializarMinhasRondas();
    inicializarCalendario();
    inicializarRelatorios();
    inicializarConfiguracoes();
    inicializarModais();
    
    // Atualizar data/hora em tempo real
    atualizarDataHora();
    setInterval(atualizarDataHora, 60000);
    
    // Atualizar dashboard periodicamente
    setInterval(() => {
        if (document.getElementById('dashboard').classList.contains('active')) {
            atualizarDashboard();
        }
    }, 30000);
    
    console.log('✅ Sistema inicializado com sucesso!');
});

// ===== FUNÇÕES DE DADOS =====
function carregarDados() {
    try {
        const dadosSalvos = localStorage.getItem('sistemaRondas');
        if (dadosSalvos) {
            const dados = JSON.parse(dadosSalvos);
            rondas = dados.rondas || [];
            console.log(`📂 Carregadas ${rondas.length} rondas`);
        } else {
            // Dados de exemplo para demonstração
            criarDadosExemplo();
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        rondas = [];
        criarDadosExemplo();
    }
    
    atualizarEstatisticasFooter();
}

function salvarDados() {
    const dados = {
        rondas: rondas,
        ultimaAtualizacao: new Date().toISOString()
    };
    
    try {
        localStorage.setItem('sistemaRondas', JSON.stringify(dados));
        console.log('💾 Dados salvos com sucesso');
        
        // Atualizar footer
        atualizarEstatisticasFooter();
        
        return true;
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        mostrarModal('Erro', 'Não foi possível salvar os dados. Verifique o espaço disponível.');
        return false;
    }
}

function criarDadosExemplo() {
    console.log('📝 Criando dados de exemplo...');
    
    const setores = ['Administração', 'Recepção', 'Almoxarifado', 'Produção', 'Expedição'];
    const status = ['concluido', 'ajustes', 'problemas'];
    const responsaveis = ['Operador', 'Técnico A', 'Técnico B'];
    const problemas = [
        'Toner acabando',
        'Papel travando',
        'Conexão de rede instável',
        'Sujo precisa limpeza',
        'Calibração necessária',
        'Peça com desgaste'
    ];
    
    for (let i = 0; i < 15; i++) {
        const data = new Date();
        data.setDate(data.getDate() - Math.floor(Math.random() * 30));
        
        const ronda = {
            id: Date.now() + i,
            data: data.toISOString().split('T')[0],
            hora: `${String(Math.floor(Math.random() * 12) + 8).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
            setor: setores[Math.floor(Math.random() * setores.length)],
            responsavel: responsaveis[Math.floor(Math.random() * responsaveis.length)],
            turno: ['Manhã', 'Tarde', 'Noite'][Math.floor(Math.random() * 3)],
            status: status[Math.floor(Math.random() * status.length)],
            impressoras: [
                {
                    modelo: 'HP LaserJet MFP M428',
                    serie: `SN${Math.floor(Math.random() * 10000)}`,
                    status: ['operando', 'manutencao', 'parada'][Math.floor(Math.random() * 3)]
                }
            ],
            relatorio: `Verificação realizada no setor. ${Math.random() > 0.5 ? `Problema encontrado: ${problemas[Math.floor(Math.random() * problemas.length)]}. Ação tomada: ${['Limpeza realizada', 'Toner substituído', 'Ajuste feito', 'Peça encomendada'][Math.floor(Math.random() * 4)]}.` : 'Tudo em perfeito estado.'}`,
            tags: ['toner', 'limpeza', 'papel'].filter(() => Math.random() > 0.5),
            observacoes: Math.random() > 0.7 ? 'Necessário acompanhar na próxima ronda.' : '',
            criadoEm: new Date().toISOString()
        };
        
        rondas.push(ronda);
    }
    
    salvarDados();
    console.log(`✅ ${rondas.length} rondas de exemplo criadas`);
}

// ===== NAVEGAÇÃO =====
function inicializarNavegacao() {
    const navBotoes = document.querySelectorAll('.nav-btn');
    
    navBotoes.forEach(botao => {
        botao.addEventListener('click', function() {
            // Remover active de todos
            navBotoes.forEach(b => b.classList.remove('active'));
            // Adicionar active ao clicado
            this.classList.add('active');
            
            // Esconder todas as páginas
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            
            // Mostrar página correspondente
            const paginaId = this.getAttribute('data-page');
            const pagina = document.getElementById(paginaId);
            if (pagina) {
                pagina.classList.add('active');
                
                // Inicializar página específica
                switch(paginaId) {
                    case 'dashboard':
                        atualizarDashboard();
                        break;
                    case 'minhas-rondas':
                        carregarRondas();
                        break;
                    case 'calendario':
                        renderizarCalendario();
                        break;
                    case 'relatorios':
                        atualizarRelatorios();
                        break;
                    case 'configuracoes':
                        atualizarConfiguracoes();
                        break;
                }
            }
        });
    });
}

// ===== FORMULÁRIO DE RONDA =====
function inicializarFormulario() {
    const form = document.getElementById('form-ronda');
    const steps = document.querySelectorAll('.form-step');
    const btnProximo = document.getElementById('btn-proximo');
    const btnVoltar = document.getElementById('btn-voltar');
    const btnSalvar = document.getElementById('btn-salvar');
    let passoAtual = 1;
    
    // Atualizar data/hora no formulário
    function atualizarDataHoraForm() {
        const agora = new Date();
        document.getElementById('data-atual').textContent = 
            `📅 ${agora.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
        document.getElementById('hora-atual').textContent = 
            `🕒 ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    atualizarDataHoraForm();
    setInterval(atualizarDataHoraForm, 60000);
    
    // Contador de caracteres
    document.getElementById('relatorio').addEventListener('input', function() {
        const texto = this.value;
        document.getElementById('contador-caracteres').textContent = texto.length;
        document.getElementById('contador-linhas').textContent = texto.split('\n').length;
    });
    
    // Campo "outro setor"
    document.getElementById('setor').addEventListener('change', function() {
        const outroInput = document.getElementById('outro-setor');
        outroInput.style.display = this.value === 'outro' ? 'block' : 'none';
        if (this.value !== 'outro') outroInput.value = '';
    });
    
    // Sistema de tags
    document.getElementById('input-tag').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            adicionarTag(this.value.trim());
            this.value = '';
        }
    });
    
    document.querySelectorAll('.tag-sugestao').forEach(tag => {
        tag.addEventListener('click', function() {
            adicionarTag(this.getAttribute('data-tag'));
        });
    });
    
    // Adicionar/remover impressoras
    document.getElementById('btn-add-impressora').addEventListener('click', adicionarImpressora);
    
    // Navegação entre passos
    btnProximo.addEventListener('click', function() {
        if (validarPasso(passoAtual)) {
            if (passoAtual === 3) {
                gerarResumo();
            } else {
                passoAtual++;
                atualizarPasso();
            }
        }
    });
    
    btnVoltar.addEventListener('click', function() {
        if (passoAtual > 1) {
            passoAtual--;
            atualizarPasso();
        }
    });
    
    // Submit do formulário
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        salvarRonda();
    });
    
    function validarPasso(passo) {
        switch(passo) {
            case 1:
                const setor = document.getElementById('setor');
                const responsavel = document.getElementById('responsavel');
                const turno = document.getElementById('turno');
                const status = document.querySelector('input[name="status"]:checked');
                
                if (!setor.value) {
                    mostrarAlerta('Selecione um setor!', setor);
                    return false;
                }
                if (setor.value === 'outro' && !document.getElementById('outro-setor').value.trim()) {
                    mostrarAlerta('Especifique o setor!', document.getElementById('outro-setor'));
                    return false;
                }
                if (!responsavel.value.trim()) {
                    mostrarAlerta('Informe o responsável!', responsavel);
                    return false;
                }
                if (!turno.value) {
                    mostrarAlerta('Selecione o turno!', turno);
                    return false;
                }
                if (!status) {
                    mostrarAlerta('Selecione o status geral!', document.querySelector('.status-options'));
                    return false;
                }
                return true;
                
            case 2:
                const relatorio = document.getElementById('relatorio');
                if (!relatorio.value.trim()) {
                    mostrarAlerta('Preencha o relatório detalhado!', relatorio);
                    return false;
                }
                return true;
                
            default:
                return true;
        }
    }
    
    function atualizarPasso() {
        // Atualizar steps
        steps.forEach(step => {
            step.classList.remove('active');
            if (parseInt(step.getAttribute('data-step')) === passoAtual) {
                step.classList.add('active');
            }
        });
        
        // Atualizar dots
        document.querySelectorAll('.step-dot').forEach(dot => {
            dot.classList.remove('active');
            if (parseInt(dot.getAttribute('data-step')) === passoAtual) {
                dot.classList.add('active');
            }
        });
        
        // Atualizar botões
        btnVoltar.style.display = passoAtual > 1 ? 'flex' : 'none';
        btnProximo.style.display = passoAtual < 3 ? 'flex' : 'none';
        btnSalvar.style.display = passoAtual === 3 ? 'flex' : 'none';
        
        // Scroll para topo
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    function mostrarAlerta(mensagem, elemento) {
        // Adicionar classe de erro
        elemento.classList.add('erro');
        
        // Mostrar mensagem
        const alerta = document.createElement('div');
        alerta.className = 'alerta-form';
        alerta.textContent = mensagem;
        alerta.style.cssText = `
            background: #e74c3c;
            color: white;
            padding: 10px;
            border-radius: 5px;
            margin-top: 5px;
            animation: fadeIn 0.3s;
        `;
        
        elemento.parentNode.insertBefore(alerta, elemento.nextSibling);
        
        // Remover após 3 segundos
        setTimeout(() => {
            alerta.remove();
            elemento.classList.remove('erro');
        }, 3000);
        
        // Scroll para elemento
        elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function adicionarTag(tag) {
    if (!tag) return;
    
    const tagsContainer = document.getElementById('tags-selecionadas');
    const tagId = 'tag-' + Date.now();
    
    // Verificar se já existe
    const tagsExistentes = Array.from(tagsContainer.querySelectorAll('.tag-text')).map(t => t.textContent);
    if (tagsExistentes.includes(tag)) return;
    
    const tagElement = document.createElement('div');
    tagElement.className = 'tag';
    tagElement.innerHTML = `
        <span class="tag-text">${tag}</span>
        <button type="button" class="tag-remove" onclick="removerTag('${tagId}')">
            <i class="fas fa-times"></i>
        </button>
    `;
    tagElement.id = tagId;
    
    tagsContainer.appendChild(tagElement);
}

function removerTag(tagId) {
    const tag = document.getElementById(tagId);
    if (tag) tag.remove();
}

function adicionarImpressora() {
    const container = document.getElementById('impressoras-container');
    const impressoraId = 'impressora-' + Date.now();
    
    const impressoraHTML = `
        <div class="impressora-item" id="${impressoraId}">
            <input type="text" class="form-control" placeholder="Modelo da impressora" data-type="modelo">
            <input type="text" class="form-control" placeholder="Número de Série" data-type="serie">
            <select class="form-control" data-type="status">
                <option value="">Status...</option>
                <option value="operando">✅ Operando</option>
                <option value="manutencao">🔧 Manutenção</option>
                <option value="parada">🛑 Parada</option>
            </select>
            <button type="button" class="btn-remove-impressora" onclick="removerImpressora('${impressoraId}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', impressoraHTML);
}

function removerImpressora(id) {
    const impressora = document.getElementById(id);
    if (impressora) impressora.remove();
}

function gerarResumo() {
    const resumoContainer = document.getElementById('resumo-ronda');
    
    // Coletar dados do formulário
    const setorSelecionado = document.getElementById('setor').value;
    const setor = setorSelecionado === 'outro' 
        ? document.getElementById('outro-setor').value
        : document.getElementById('setor').options[document.getElementById('setor').selectedIndex].text;
    
    const responsavel = document.getElementById('responsavel').value;
    const turno = document.getElementById('turno').options[document.getElementById('turno').selectedIndex].text;
    const status = document.querySelector('input[name="status"]:checked').value;
    
    // Contar impressoras
    const impressoras = document.querySelectorAll('.impressora-item');
    const impressorasContagem = {
        total: impressoras.length,
        operando: Array.from(impressoras).filter(i => i.querySelector('[data-type="status"]').value === 'operando').length,
        manutencao: Array.from(impressoras).filter(i => i.querySelector('[data-type="status"]').value === 'manutencao').length,
        parada: Array.from(impressoras).filter(i => i.querySelector('[data-type="status"]').value === 'parada').length
    };
    
    // Tags selecionadas
    const tags = Array.from(document.querySelectorAll('#tags-selecionadas .tag-text')).map(t => t.textContent);
    
    const resumoHTML = `
        <div class="resumo-item">
            <label><i class="fas fa-building"></i> Setor:</label>
            <p>${setor}</p>
        </div>
        <div class="resumo-item">
            <label><i class="fas fa-user"></i> Responsável:</label>
            <p>${responsavel}</p>
        </div>
        <div class="resumo-item">
            <label><i class="fas fa-clock"></i> Turno:</label>
            <p>${turno}</p>
        </div>
        <div class="resumo-item">
            <label><i class="fas fa-flag"></i> Status Geral:</label>
            <p class="status-${status}">${status === 'concluido' ? '✅ Concluído' : status === 'ajustes' ? '⚠️ Ajustes' : '❌ Problemas'}</p>
        </div>
        <div class="resumo-item">
            <label><i class="fas fa-print"></i> Impressoras:</label>
            <p>${impressorasContagem.total} verificadas (${impressorasContagem.operando} ✅, ${impressorasContagem.manutencao} 🔧, ${impressorasContagem.parada} 🛑)</p>
        </div>
        ${tags.length > 0 ? `
        <div class="resumo-item">
            <label><i class="fas fa-tags"></i> Tags:</label>
            <p>${tags.join(', ')}</p>
        </div>
        ` : ''}
        <div class="resumo-item">
            <label><i class="fas fa-clipboard-check"></i> Pronto para salvar!</label>
            <p>Revise os dados acima e clique em "Salvar Ronda" para finalizar.</p>
        </div>
    `;
    
    resumoContainer.innerHTML = resumoHTML;
}

function salvarRonda() {
    // Coletar dados do formulário
    const setorSelecionado = document.getElementById('setor').value;
    const setor = setorSelecionado === 'outro' 
        ? document.getElementById('outro-setor').value
        : document.getElementById('setor').options[document.getElementById('setor').selectedIndex].text;
    
    const responsavel = document.getElementById('responsavel').value;
    const turno = document.getElementById('turno').value;
    const status = document.querySelector('input[name="status"]:checked').value;
    
    // Impressoras
    const impressoras = Array.from(document.querySelectorAll('.impressora-item')).map(item => ({
        modelo: item.querySelector('[data-type="modelo"]').value,
        serie: item.querySelector('[data-type="serie"]').value,
        status: item.querySelector('[data-type="status"]').value
    })).filter(i => i.modelo && i.serie && i.status);
    
    // Tags
    const tags = Array.from(document.querySelectorAll('#tags-selecionadas .tag-text')).map(t => t.textContent);
    
    const ronda = {
        id: Date.now(),
        data: new Date().toISOString().split('T')[0],
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        setor: setor,
        responsavel: responsavel,
        turno: turno,
        status: status,
        impressoras: impressoras,
        relatorio: document.getElementById('relatorio').value,
        tags: tags,
        observacoes: document.getElementById('observacoes').value,
        criadoEm: new Date().toISOString()
    };
    
    // Adicionar à lista
    rondas.unshift(ronda);
    
    // Salvar dados
    if (salvarDados()) {
        // Feedback visual
        const btnSalvar = document.getElementById('btn-salvar');
        const originalHTML = btnSalvar.innerHTML;
        btnSalvar.innerHTML = '<i class="fas fa-check"></i> Salvo com Sucesso!';
        btnSalvar.disabled = true;
        
        // Gerar PDF se marcado
        if (document.getElementById('gerar-pdf').checked) {
            setTimeout(() => gerarPDF(ronda), 1000);
        }
        
        // Resetar formulário após 2 segundos
        setTimeout(() => {
            // Resetar formulário
            document.getElementById('form-ronda').reset();
            document.getElementById('tags-selecionadas').innerHTML = '';
            document.getElementById('impressoras-container').innerHTML = `
                <div class="impressora-item">
                    <input type="text" class="form-control" placeholder="Modelo da impressora" data-type="modelo">
                    <input type="text" class="form-control" placeholder="Número de Série" data-type="serie">
                    <select class="form-control" data-type="status">
                        <option value="">Status...</option>
                        <option value="operando">✅ Operando</option>
                        <option value="manutencao">🔧 Manutenção</option>
                        <option value="parada">🛑 Parada</option>
                    </select>
                    <button type="button" class="btn-remove-impressora">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            document.getElementById('resumo-ronda').innerHTML = '';
            
            // Resetar navegação do formulário
            document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
            document.querySelector('.form-step[data-step="1"]').classList.add('active');
            document.querySelectorAll('.step-dot').forEach(dot => dot.classList.remove('active'));
            document.querySelector('.step-dot[data-step="1"]').classList.add('active');
            
            document.getElementById('btn-voltar').style.display = 'none';
            document.getElementById('btn-proximo').style.display = 'flex';
            document.getElementById('btn-salvar').style.display = 'none';
            
            // Restaurar botão
            btnSalvar.innerHTML = originalHTML;
            btnSalvar.disabled = false;
            
            // Mostrar confirmação
            mostrarModal('✅ Ronda Salva!', `
                <p>A ronda foi registrada com sucesso!</p>
                ${document.getElementById('gerar-pdf').checked ? 
                    '<p><i class="fas fa-file-pdf"></i> O PDF está sendo gerado e será baixado automaticamente.</p>' : 
                    '<p><i class="fas fa-info-circle"></i> Você pode gerar o PDF posteriormente na lista de rondas.</p>'
                }
                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <strong>Detalhes:</strong><br>
                    • Setor: ${setor}<br>
                    • Status: ${status === 'concluido' ? 'Concluído' : status === 'ajustes' ? 'Ajustes' : 'Problemas'}<br>
                    • Impressoras: ${impressoras.length} verificadas<br>
                    • Data: ${ronda.data} às ${ronda.hora}
                </div>
            `, ['OK']);
            
            // Atualizar dashboard
            atualizarDashboard();
            
        }, 2000);
    }
}

// ===== DASHBOARD =====
function inicializarDashboard() {
    document.getElementById('btn-atualizar-dashboard').addEventListener('click', atualizarDashboard);
    atualizarDashboard();
}

function atualizarDashboard() {
    // Atualizar estatísticas
    document.getElementById('total-rondas').textContent = rondas.length;
    
    const rondasConcluidas = rondas.filter(r => r.status === 'concluido').length;
    document.getElementById('rondas-concluidas').textContent = rondasConcluidas;
    
    const problemas = rondas.filter(r => r.status === 'problemas').length;
    document.getElementById('total-problemas').textContent = problemas;
    
    const setoresUnicos = [...new Set(rondas.map(r => r.setor))];
    document.getElementById('setores-ativos').textContent = setoresUnicos.length;
    
    // Atualizar gráfico de status
    atualizarGraficoStatus();
    
    // Atualizar gráfico diário
    atualizarGraficoDiario();
    
    // Atualizar atividade recente
    atualizarAtividadeRecente();
}

function atualizarGraficoStatus() {
    const ctx = document.getElementById('chart-status').getContext('2d');
    
    const dados = {
        concluido: rondas.filter(r => r.status === 'concluido').length,
        ajustes: rondas.filter(r => r.status === 'ajustes').length,
        problemas: rondas.filter(r => r.status === 'problemas').length
    };
    
    if (window.chartStatus) {
        window.chartStatus.destroy();
    }
    
    window.chartStatus = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Concluído', 'Ajustes', 'Problemas'],
            datasets: [{
                data: [dados.concluido, dados.ajustes, dados.problemas],
                backgroundColor: ['#2ecc71', '#f39c12', '#e74c3c'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function atualizarGraficoDiario() {
    const ctx = document.getElementById('chart-diario').getContext('2d');
    
    // Últimos 7 dias
    const datas = [];
    const dados = { concluido: [], ajustes: [], problemas: [] };
    
    for (let i = 6; i >= 0; i--) {
        const data = new Date();
        data.setDate(data.getDate() - i);
        const dataStr = data.toISOString().split('T')[0];
        datas.push(dataStr.slice(8, 10) + '/' + dataStr.slice(5, 7));
        
        const rondasDia = rondas.filter(r => r.data === dataStr);
        dados.concluido.push(rondasDia.filter(r => r.status === 'concluido').length);
        dados.ajustes.push(rondasDia.filter(r => r.status === 'ajustes').length);
        dados.problemas.push(rondasDia.filter(r => r.status === 'problemas').length);
    }
    
    if (window.chartDiario) {
        window.chartDiario.destroy();
    }
    
    window.chartDiario = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: datas,
            datasets: [
                {
                    label: 'Concluído',
                    data: dados.concluido,
                    backgroundColor: '#2ecc71'
                },
                {
                    label: 'Ajustes',
                    data: dados.ajustes,
                    backgroundColor: '#f39c12'
                },
                {
                    label: 'Problemas',
                    data: dados.problemas,
                    backgroundColor: '#e74c3c'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function atualizarAtividadeRecente() {
    const container = document.getElementById('lista-recente');
    
    if (rondas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Nenhuma ronda registrada ainda.</p>
                <button class="btn-primary" onclick="document.querySelector('[data-page=\"nova-ronda\"]').click()">
                    <i class="fas fa-plus"></i> Criar Primeira Ronda
                </button>
            </div>
        `;
        return;
    }
    
    const rondasRecentes = rondas.slice(0, 5);
    
    container.innerHTML = rondasRecentes.map(ronda => `
        <div class="activity-item ${ronda.status}">
            <div class="activity-icon">
                ${ronda.status === 'concluido' ? '<i class="fas fa-check-circle"></i>' : 
                  ronda.status === 'ajustes' ? '<i class="fas fa-tools"></i>' : 
                  '<i class="fas fa-exclamation-triangle"></i>'}
            </div>
            <div class="activity-content">
                <div class="activity-header">
                    <strong>${ronda.setor}</strong>
                    <span class="activity-time">${ronda.data} às ${ronda.hora}</span>
                </div>
                <p class="activity-text">${ronda.relatorio.substring(0, 100)}${ronda.relatorio.length > 100 ? '...' : ''}</p>
                <div class="activity-footer">
                    <span class="activity-responsavel">👤 ${ronda.responsavel}</span>
                    ${ronda.tags.length > 0 ? 
                        `<span class="activity-tags">🏷️ ${ronda.tags.slice(0, 2).join(', ')}</span>` : 
                        ''
                    }
                    <button class="activity-action" onclick="verDetalhesRonda(${ronda.id})">
                        Ver detalhes
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ===== MINHAS RONDAS =====
function inicializarMinhasRondas() {
    document.getElementById('btn-aplicar-filtros').addEventListener('click', carregarRondas);
    document.getElementById('btn-limpar-filtros').addEventListener('click', limparFiltros);
    document.getElementById('btn-exportar-todas').addEventListener('click', exportarTodasRondas);
    document.getElementById('busca-rondas').addEventListener('input', carregarRondas);
    
    document.getElementById('btn-pagina-anterior').addEventListener('click', () => {
        if (paginaAtual > 1) {
            paginaAtual--;
            carregarRondas();
        }
    });
    
    document.getElementById('btn-pagina-proxima').addEventListener('click', () => {
        const totalPaginas = Math.ceil(rondasFiltradas.length / itensPorPagina);
        if (paginaAtual < totalPaginas) {
            paginaAtual++;
            carregarRondas();
        }
    });
    
    // Popular filtro de setores
    const setores = [...new Set(rondas.map(r => r.setor))];
    const selectSetor = document.getElementById('filtro-setor');
    selectSetor.innerHTML = '<option value="">Todos os setores</option>' +
        setores.map(s => `<option value="${s}">${s}</option>`).join('');
}

let rondasFiltradas = [];

function carregarRondas() {
    let resultados = [...rondas];
    
    // Aplicar filtros
    const filtroDataInicio = document.getElementById('filtro-data-inicio').value;
    const filtroDataFim = document.getElementById('filtro-data-fim').value;
    const filtroStatus = document.getElementById('filtro-status').value;
    const filtroSetor = document.getElementById('filtro-setor').value;
    const busca = document.getElementById('busca-rondas').value.toLowerCase();
    
    if (filtroDataInicio) {
        resultados = resultados.filter(r => r.data >= filtroDataInicio);
    }
    
    if (filtroDataFim) {
        resultados = resultados.filter(r => r.data <= filtroDataFim);
    }
    
    if (filtroStatus) {
        resultados = resultados.filter(r => r.status === filtroStatus);
    }
    
    if (filtroSetor) {
        resultados = resultados.filter(r => r.setor === filtroSetor);
    }
    
    if (busca) {
        resultados = resultados.filter(r => 
            r.setor.toLowerCase().includes(busca) ||
            r.responsavel.toLowerCase().includes(busca) ||
            r.relatorio.toLowerCase().includes(busca) ||
            r.tags.some(tag => tag.toLowerCase().includes(busca))
        );
    }
    
    rondasFiltradas = resultados;
    
    // Paginação
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const rondasPagina = rondasFiltradas.slice(inicio, fim);
    
    // Atualizar lista
    const container = document.getElementById('lista-rondas');
    
    if (rondasPagina.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>Nenhuma ronda encontrada com os filtros atuais.</p>
                <button class="btn-secondary" onclick="limparFiltros()">
                    <i class="fas fa-broom"></i> Limpar Filtros
                </button>
            </div>
        `;
    } else {
        container.innerHTML = rondasPagina.map(ronda => `
            <div class="ronda-card ${ronda.status}">
                <div class="ronda-header">
                    <div class="ronda-data">${ronda.data} às ${ronda.hora}</div>
                    <div class="ronda-status ${ronda.status}">
                        ${ronda.status === 'concluido' ? '✅ Concluído' : 
                          ronda.status === 'ajustes' ? '⚠️ Ajustes' : 
                          '❌ Problemas'}
                    </div>
                </div>
                
                <div class="ronda-info">
                    <div class="ronda-info-item">
                        <label>Setor:</label>
                        <p>${ronda.setor}</p>
                    </div>
                    <div class="ronda-info-item">
                        <label>Responsável:</label>
                        <p>${ronda.responsavel}</p>
                    </div>
                    <div class="ronda-info-item">
                        <label>Turno:</label>
                        <p>${ronda.turno}</p>
                    </div>
                    <div class="ronda-info-item">
                        <label>Impressoras:</label>
                        <p>${ronda.impressoras.length} verificadas</p>
                    </div>
                </div>
                
                ${ronda.tags.length > 0 ? `
                    <div class="ronda-tags">
                        ${ronda.tags.map(tag => `<span class="tag-mini">🏷️ ${tag}</span>`).join('')}
                    </div>
                ` : ''}
                
                <div class="ronda-conteudo">
                    ${ronda.relatorio.substring(0, 300)}
                    ${ronda.relatorio.length > 300 ? '...' : ''}
                </div>
                
                <div class="ronda-actions">
                    <button class="btn-secondary" onclick="verDetalhesRonda(${ronda.id})">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    <button class="btn-primary" onclick="gerarPDF(${JSON.stringify(ronda).replace(/"/g, '&quot;')})">
                        <i class="fas fa-file-pdf"></i> PDF
                    </button>
                    <button class="btn-danger" onclick="excluirRonda(${ronda.id})">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // Atualizar paginação
    atualizarPaginacao();
}

function limparFiltros() {
    document.getElementById('filtro-data-inicio').value = '';
    document.getElementById('filtro-data-fim').value = '';
    document.getElementById('filtro-status').value = '';
    document.getElementById('filtro-setor').value = '';
    document.getElementById('busca-rondas').value = '';
    paginaAtual = 1;
    carregarRondas();
}

function atualizarPaginacao() {
    const totalPaginas = Math.ceil(rondasFiltradas.length / itensPorPagina);
    const btnAnterior = document.getElementById('btn-pagina-anterior');
    const btnProximo = document.getElementById('btn-pagina-proxima');
    const infoPagina = document.getElementById('info-paginacao');
    
    btnAnterior.disabled = paginaAtual <= 1;
    btnProximo.disabled = paginaAtual >= totalPaginas;
    
    infoPagina.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
}

function exportarTodasRondas() {
    if (rondas.length === 0) {
        mostrarModal('Exportar', '<p>Não há rondas para exportar.</p>', ['OK']);
        return;
    }
    
    mostrarModal('Exportar Rondas', `
        <p>Exportar todas as ${rondas.length} rondas?</p>
        <div style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <strong>Opções de exportação:</strong><br>
            • PDF individual para cada ronda<br>
            • PDF consolidado com todas as rondas<br>
            • Arquivo Excel (CSV) com os dados
        </div>
        <div class="export-options">
            <label style="display: block; margin: 10px 0;">
                <input type="radio" name="export-type" value="individual" checked>
                PDFs individuais (${rondas.length} arquivos)
            </label>
            <label style="display: block; margin: 10px 0;">
                <input type="radio" name="export-type" value="consolidado">
                PDF consolidado (1 arquivo)
            </label>
            <label style="display: block; margin: 10px 0;">
                <input type="radio" name="export-type" value="excel">
                Arquivo Excel (CSV)
            </label>
        </div>
    `, [
        { text: 'Cancelar', class: 'btn-secondary' },
        { 
            text: 'Exportar', 
            class: 'btn-primary',
            action: () => {
                const tipo = document.querySelector('input[name="export-type"]:checked').value;
                switch(tipo) {
                    case 'individual':
                        exportarPDFsIndividuais();
                        break;
                    case 'consolidado':
                        exportarPDFConsolidado();
                        break;
                    case 'excel':
                        exportarExcel();
                        break;
                }
            }
        }
    ]);
}

// ===== CALENDÁRIO =====
function inicializarCalendario() {
    document.getElementById('btn-calendario-hoje').addEventListener('click', () => {
        calendarioData = new Date();
        renderizarCalendario();
    });
    
    document.getElementById('btn-calendario-mes').addEventListener('click', () => {
        // Já está em modo mês
        renderizarCalendario();
    });
    
    document.getElementById('btn-calendario-semana').addEventListener('click', () => {
        // Implementar visão semanal (simplificada)
        mostrarModal('Funcionalidade', 'A visão semanal será implementada na próxima versão.', ['OK']);
    });
    
    document.getElementById('btn-calendario-anterior').addEventListener('click', () => {
        calendarioData.setMonth(calendarioData.getMonth() - 1);
        renderizarCalendario();
    });
    
    document.getElementById('btn-calendario-proximo').addEventListener('click', () => {
        calendarioData.setMonth(calendarioData.getMonth() + 1);
        renderizarCalendario();
    });
}

function renderizarCalendario() {
    const mesAtual = calendarioData.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    document.getElementById('calendario-mes').textContent = 
        mesAtual.charAt(0).toUpperCase() + mesAtual.slice(1);
    
    const hoje = new Date();
    const ano = calendarioData.getFullYear();
    const mes = calendarioData.getMonth();
    
    // Primeiro dia do mês
    const primeiroDia = new Date(ano, mes, 1);
    // Último dia do mês
    const ultimoDia = new Date(ano, mes + 1, 0);
    // Dia da semana do primeiro dia (0 = Domingo)
    const primeiroDiaSemana = primeiroDia.getDay();
    
    // Dias da semana
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    // Construir calendário
    let calendarioHTML = '';
    
    // Cabeçalho com dias da semana
    diasSemana.forEach(dia => {
        calendarioHTML += `<div class="dia-semana">${dia}</div>`;
    });
    
    // Dias em branco antes do primeiro dia
    for (let i = 0; i < primeiroDiaSemana; i++) {
        calendarioHTML += `<div class="dia-calendario vazio"></div>`;
    }
    
    // Dias do mês
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
        const dataAtual = new Date(ano, mes, dia);
        const dataStr = dataAtual.toISOString().split('T')[0];
        
        // Verificar se é hoje
        const hojeStr = hoje.toISOString().split('T')[0];
        const isHoje = dataStr === hojeStr;
        
        // Rondas deste dia
        const rondasDia = rondas.filter(r => r.data === dataStr);
        
        let eventosHTML = '';
        if (rondasDia.length > 0) {
            eventosHTML = `<div class="dia-eventos">`;
            rondasDia.slice(0, 3).forEach(ronda => {
                const statusClass = `evento-${ronda.status}`;
                const statusIcon = ronda.status === 'concluido' ? '✅' : 
                                   ronda.status === 'ajustes' ? '⚠️' : '❌';
                eventosHTML += `
                    <div class="evento-calendario ${statusClass}" 
                         onclick="verDetalhesRonda(${ronda.id})"
                         title="${ronda.setor}: ${ronda.relatorio.substring(0, 50)}...">
                        ${statusIcon} ${ronda.setor.substring(0, 8)}...
                    </div>
                `;
            });
            if (rondasDia.length > 3) {
                eventosHTML += `<div class="evento-calendario mais" title="${rondasDia.length - 3} mais...">
                    +${rondasDia.length - 3}
                </div>`;
            }
            eventosHTML += `</div>`;
        }
        
        calendarioHTML += `
            <div class="dia-calendario ${isHoje ? 'dia-hoje' : ''}">
                <div class="dia-numero">${dia}</div>
                ${eventosHTML}
            </div>
        `;
    }
    
    document.getElementById('calendario-grid').innerHTML = calendarioHTML;
}

// ===== RELATÓRIOS =====
function inicializarRelatorios() {
    document.getElementById('btn-gerar-relatorio').addEventListener('click', gerarRelatorioPersonalizado);
    document.getElementById('btn-gerar-relatorio-completo').addEventListener('click', gerarRelatorioCompleto);
    
    document.querySelectorAll('.btn-export-relatorio').forEach(btn => {
        btn.addEventListener('click', function() {
            const tipo = this.getAttribute('data-tipo');
            exportarRelatorio(tipo);
        });
    });
    
    atualizarRelatorios();
}

function atualizarRelatorios() {
    // Relatório de Status
    atualizarGraficoRelatorioStatus();
    
    // Relatório de Evolução
    atualizarGraficoEvolucao();
    
    // Relatório de Setores
    atualizarGraficoSetores();
    
    // Relatório de Problemas
    atualizarGraficoProblemas();
}

function atualizarGraficoRelatorioStatus() {
    const ctx = document.getElementById('relatorio-status').getContext('2d');
    
    const dados = {
        concluido: rondas.filter(r => r.status === 'concluido').length,
        ajustes: rondas.filter(r => r.status === 'ajustes').length,
        problemas: rondas.filter(r => r.status === 'problemas').length
    };
    
    if (window.chartRelatorioStatus) {
        window.chartRelatorioStatus.destroy();
    }
    
    window.chartRelatorioStatus = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Concluído', 'Ajustes', 'Problemas'],
            datasets: [{
                data: [dados.concluido, dados.ajustes, dados.problemas],
                backgroundColor: ['#2ecc71', '#f39c12', '#e74c3c']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function atualizarGraficoEvolucao() {
    const ctx = document.getElementById('relatorio-evolucao').getContext('2d');
    
    // Últimos 6 meses
    const meses = [];
    const dados = { concluido: [], ajustes: [], problemas: [] };
    
    for (let i = 5; i >= 0; i--) {
        const data = new Date();
        data.setMonth(data.getMonth() - i);
        const mesAno = data.toLocaleString('pt-BR', { month: 'short' });
        meses.push(mesAno.charAt(0).toUpperCase() + mesAno.slice(1));
        
        const mesStr = data.getFullYear() + '-' + String(data.getMonth() + 1).padStart(2, '0');
        const rondasMes = rondas.filter(r => r.data.startsWith(mesStr));
        
        dados.concluido.push(rondasMes.filter(r => r.status === 'concluido').length);
        dados.ajustes.push(rondasMes.filter(r => r.status === 'ajustes').length);
        dados.problemas.push(rondasMes.filter(r => r.status === 'problemas').length);
    }
    
    if (window.chartEvolucao) {
        window.chartEvolucao.destroy();
    }
    
    window.chartEvolucao = new Chart(ctx, {
        type: 'line',
        data: {
            labels: meses,
            datasets: [
                {
                    label: 'Concluído',
                    data: dados.concluido,
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Ajustes',
                    data: dados.ajustes,
                    borderColor: '#f39c12',
                    backgroundColor: 'rgba(243, 156, 18, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Problemas',
                    data: dados.problemas,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function atualizarGraficoSetores() {
    const ctx = document.getElementById('relatorio-setores').getContext('2d');
    
    // Contar rondas por setor
    const contador = {};
    rondas.forEach(r => {
        contador[r.setor] = (contador[r.setor] || 0) + 1;
    });
    
    const setores = Object.keys(contador);
    const quantidades = Object.values(contador);
    
    if (window.chartSetores) {
        window.chartSetores.destroy();
    }
    
    window.chartSetores = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: setores,
            datasets: [{
                label: 'Rondas por Setor',
                data: quantidades,
                backgroundColor: '#3498db'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function atualizarGraficoProblemas() {
    const ctx = document.getElementById('relatorio-problemas').getContext('2d');
    
    // Palavras-chave comuns em problemas
    const palavrasChave = [
        { palavra: 'toner', contador: 0 },
        { palavra: 'papel', contador: 0 },
        { palavra: 'trav', contador: 0 },
        { palavra: 'rede', contador: 0 },
        { palavra: 'sujo', contador: 0 },
        { palavra: 'lento', contador: 0 },
        { palavra: 'erro', contador: 0 },
        { palavra: 'barulho', contador: 0 }
    ];
    
    // Contar ocorrências
    rondas.forEach(ronda => {
        const texto = ronda.relatorio.toLowerCase();
        palavrasChave.forEach(palavra => {
            if (texto.includes(palavra.palavra)) {
                palavra.contador++;
            }
        });
    });
    
    // Filtrar palavras com ocorrências
    const palavrasComOcorrencias = palavrasChave.filter(p => p.contador > 0);
    
    if (window.chartProblemas) {
        window.chartProblemas.destroy();
    }
    
    window.chartProblemas = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: palavrasComOcorrencias.map(p => p.palavra.charAt(0).toUpperCase() + p.palavra.slice(1)),
            datasets: [{
                data: palavrasComOcorrencias.map(p => p.contador),
                backgroundColor: [
                    '#e74c3c', '#3498db', '#2ecc71', '#f39c12',
                    '#9b59b6', '#1abc9c', '#d35400', '#c0392b'
                ].slice(0, palavrasComOcorrencias.length)
            }]
        },
        options: {
            responsive: true
        }
    });
}

function gerarRelatorioPersonalizado() {
    mostrarModal('Gerar Relatório', `
        <p>Selecione as opções para o relatório personalizado:</p>
        
        <div style="margin: 20px 0;">
            <label style="display: block; margin: 10px 0;">
                <input type="checkbox" id="opt-status" checked>
                Status das Rondas
            </label>
            <label style="display: block; margin: 10px 0;">
                <input type="checkbox" id="opt-evolucao" checked>
                Evolução Mensal
            </label>
            <label style="display: block; margin: 10px 0;">
                <input type="checkbox" id="opt-setores">
                Rondas por Setor
            </label>
            <label style="display: block; margin: 10px 0;">
                <input type="checkbox" id="opt-problemas">
                Análise de Problemas
            </label>
        </div>
        
        <div>
            <label style="display: block; margin: 10px 0;">
                Período:
                <select id="opt-periodo" style="margin-left: 10px; padding: 5px;">
                    <option value="30">Últimos 30 dias</option>
                    <option value="90">Últimos 90 dias</option>
                    <option value="180">Últimos 6 meses</option>
                    <option value="365">Último ano</option>
                    <option value="tudo">Todo o período</option>
                </select>
            </label>
        </div>
    `, [
        { text: 'Cancelar', class: 'btn-secondary' },
        { 
            text: 'Gerar Relatório', 
            class: 'btn-primary',
            action: () => {
                const periodo = parseInt(document.getElementById('opt-periodo').value);
                const opcoes = {
                    status: document.getElementById('opt-status').checked,
                    evolucao: document.getElementById('opt-evolucao').checked,
                    setores: document.getElementById('opt-setores').checked,
                    problemas: document.getElementById('opt-problemas').checked
                };
                
                // Filtrar rondas pelo período
                let rondasFiltradas = [...rondas];
                if (periodo !== 'tudo') {
                    const dataLimite = new Date();
                    dataLimite.setDate(dataLimite.getDate() - periodo);
                    rondasFiltradas = rondasFiltradas.filter(r => 
                        new Date(r.data) >= dataLimite
                    );
                }
                
                // Gerar PDF do relatório
                gerarPDFRelatorio(opcoes, rondasFiltradas, periodo);
            }
        }
    ]);
}

function gerarRelatorioCompleto() {
    const periodo = document.getElementById('relatorio-periodo').value;
    const formato = document.getElementById('relatorio-formato').value;
    
    let mensagem = '';
    switch(periodo) {
        case 'semana': mensagem = 'última semana'; break;
        case 'mes': mensagem = 'último mês'; break;
        case 'trimestre': mensagem = 'último trimestre'; break;
        case 'ano': mensagem = 'último ano'; break;
        default: mensagem = 'período personalizado';
    }
    
    mostrarModal('Relatório Completo', `
        <p>Gerar relatório completo da ${mensagem} em formato ${formato.toUpperCase()}?</p>
        <div style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <strong>O relatório incluirá:</strong><br>
            • Resumo executivo<br>
            • Estatísticas gerais<br>
            • Gráficos e análises<br>
            • Lista detalhada de rondas<br>
            • Recomendações
        </div>
    `, [
        { text: 'Cancelar', class: 'btn-secondary' },
        { 
            text: 'Gerar', 
            class: 'btn-primary',
            action: () => {
                // Filtrar pelo período
                let rondasPeriodo = [...rondas];
                const hoje = new Date();
                
                switch(periodo) {
                    case 'semana':
                        const semanaAtras = new Date(hoje);
                        semanaAtras.setDate(semanaAtras.getDate() - 7);
                        rondasPeriodo = rondasPeriodo.filter(r => new Date(r.data) >= semanaAtras);
                        break;
                    case 'mes':
                        const mesAtras = new Date(hoje);
                        mesAtras.setMonth(mesAtras.getMonth() - 1);
                        rondasPeriodo = rondasPeriodo.filter(r => new Date(r.data) >= mesAtras);
                        break;
                    case 'trimestre':
                        const trimestreAtras = new Date(hoje);
                        trimestreAtras.setMonth(trimestreAtras.getMonth() - 3);
                        rondasPeriodo = rondasPeriodo.filter(r => new Date(r.data) >= trimestreAtras);
                        break;
                    case 'ano':
                        const anoAtras = new Date(hoje);
                        anoAtras.setFullYear(anoAtras.getFullYear() - 1);
                        rondasPeriodo = rondasPeriodo.filter(r => new Date(r.data) >= anoAtras);
                        break;
                }
                
                switch(formato) {
                    case 'pdf':
                        gerarPDFRelatorioCompleto(rondasPeriodo, periodo);
                        break;
                    case 'excel':
                        exportarExcelCompleto(rondasPeriodo);
                        break;
                    case 'html':
                        exportarHTMLCompleto(rondasPeriodo);
                        break;
                }
            }
        }
    ]);
}

// ===== CONFIGURAÇÕES =====
function inicializarConfiguracoes() {
    document.getElementById('btn-backup').addEventListener('click', fazerBackup);
    document.getElementById('btn-restore').addEventListener('click', restaurarBackup);
    document.getElementById('btn-limpar-dados').addEventListener('click', limparDados);
    
    atualizarConfiguracoes();
}

function atualizarConfiguracoes() {
    // Atualizar estatísticas
    document.getElementById('config-total-rondas').textContent = rondas.length;
    
    // Calcular espaço usado
    const dataSize = JSON.stringify(rondas).length;
    const sizeKB = (dataSize / 1024).toFixed(2);
    document.getElementById('config-espaco').textContent = `${sizeKB} KB`;
    
    // Atualizar data da última atualização
    const ultimaAtualizacao = localStorage.getItem('sistemaRondas_ultimaAtualizacao');
    if (ultimaAtualizacao) {
        const data = new Date(ultimaAtualizacao);
        document.getElementById('config-data-update').textContent = 
            data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR').slice(0, 5);
    } else {
        document.getElementById('config-data-update').textContent = 'Nunca';
    }
}

function fazerBackup() {
    const dados = {
        rondas: rondas,
        config: {
            nome: document.getElementById('config-nome').value,
            autoPDF: document.getElementById('config-auto-pdf').checked,
            notificacoes: document.getElementById('config-notificacoes').checked
        },
        backupData: new Date().toISOString()
    };
    
    const dadosStr = JSON.stringify(dados, null, 2);
    const blob = new Blob([dadosStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-rondas-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    mostrarModal('Backup', '<p>Backup criado com sucesso! O arquivo foi baixado para seu computador.</p>', ['OK']);
}

function restaurarBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const dados = JSON.parse(event.target.result);
                
                mostrarModal('Restaurar Backup', `
                    <p>Dados encontrados no backup:</p>
                    <div style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        • ${dados.rondas?.length || 0} rondas<br>
                        • Backup criado em: ${new Date(dados.backupData).toLocaleString('pt-BR')}
                    </div>
                    <p><strong>Atenção:</strong> Isso substituirá todos os dados atuais.</p>
                `, [
                    { text: 'Cancelar', class: 'btn-secondary' },
                    { 
                        text: 'Restaurar', 
                        class: 'btn-primary',
                        action: () => {
                            rondas = dados.rondas || [];
                            salvarDados();
                            location.reload();
                        }
                    }
                ]);
            } catch (error) {
                mostrarModal('Erro', '<p>Erro ao ler o arquivo de backup. Verifique se o arquivo é válido.</p>', ['OK']);
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

function limparDados() {
    mostrarModal('Limpar Dados', `
        <p><strong style="color: #e74c3c;">⚠️ ATENÇÃO: Esta ação não pode ser desfeita!</strong></p>
        <p>Você está prestes a apagar todos os dados do sistema:</p>
        <div style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            • ${rondas.length} rondas serão perdidas<br>
            • Todas as configurações serão resetadas<br>
            • Todos os relatórios serão excluídos
        </div>
        <p>Digite <strong>APAGAR</strong> abaixo para confirmar:</p>
        <input type="text" id="confirmar-apagar" style="width: 100%; padding: 10px; border: 2px solid #e74c3c; border-radius: 5px; margin-top: 10px;">
    `, [
        { text: 'Cancelar', class: 'btn-secondary' },
        { 
            text: 'Limpar Tudo', 
            class: 'btn-danger',
            action: () => {
                const confirmacao = document.getElementById('confirmar-apagar').value;
                if (confirmacao === 'APAGAR') {
                    localStorage.clear();
                    mostrarModal('Dados Apagados', '<p>Todos os dados foram apagados. O sistema será recarregado.</p>', [
                        {
                            text: 'OK',
                            action: () => location.reload()
                        }
                    ]);
                } else {
                    mostrarModal('Erro', '<p>Confirmação incorreta. Os dados não foram apagados.</p>', ['OK']);
                }
            }
        }
    ]);
}

// ===== FUNÇÕES GERAIS =====
function verDetalhesRonda(id) {
    const ronda = rondas.find(r => r.id === id);
    if (!ronda) return;
    
    const statusTexto = ronda.status === 'concluido' ? '✅ Concluído' : 
                       ronda.status === 'ajustes' ? '⚠️ Ajustes' : '❌ Problemas';
    
    const impressorasHTML = ronda.impressoras.map(imp => `
        <div style="margin: 5px 0; padding: 10px; background: #f8f9fa; border-radius: 5px;">
            <strong>${imp.modelo}</strong><br>
            <small>Série: ${imp.serie}</small> • 
            <small>Status: ${imp.status === 'operando' ? '✅ Operando' : 
                            imp.status === 'manutencao' ? '🔧 Manutenção' : 
                            '🛑 Parada'}</small>
        </div>
    `).join('');
    
    const tagsHTML = ronda.tags.length > 0 ? `
        <div style="margin-top: 10px;">
            <strong>Tags:</strong><br>
            ${ronda.tags.map(tag => `<span style="display: inline-block; background: #3498db; color: white; padding: 4px 10px; border-radius: 20px; margin: 2px; font-size: 0.9rem;">🏷️ ${tag}</span>`).join('')}
        </div>
    ` : '';
    
    mostrarModal(`Ronda: ${ronda.setor}`, `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div>
                <strong>Data:</strong><br>
                ${ronda.data} às ${ronda.hora}
            </div>
            <div>
                <strong>Responsável:</strong><br>
                ${ronda.responsavel}
            </div>
            <div>
                <strong>Setor:</strong><br>
                ${ronda.setor}
            </div>
            <div>
                <strong>Turno:</strong><br>
                ${ronda.turno}
            </div>
            <div>
                <strong>Status:</strong><br>
                ${statusTexto}
            </div>
            <div>
                <strong>Impressoras:</strong><br>
                ${ronda.impressoras.length} verificadas
            </div>
        </div>
        
        ${impressorasHTML}
        
        <div style="margin-top: 20px;">
            <strong>Relatório:</strong>
            <div style="margin-top: 10px; padding: 15px; background: #f8f9fa; border-radius: 8px; white-space: pre-line; line-height: 1.6;">
                ${ronda.relatorio}
            </div>
        </div>
        
        ${ronda.observacoes ? `
            <div style="margin-top: 15px;">
                <strong>Observações:</strong><br>
                ${ronda.observacoes}
            </div>
        ` : ''}
        
        ${tagsHTML}
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; display: flex; gap: 10px; justify-content: flex-end;">
            <button class="btn-secondary" onclick="gerarPDF(${JSON.stringify(ronda).replace(/"/g, '&quot;')}); fecharModal()">
                <i class="fas fa-file-pdf"></i> Baixar PDF
            </button>
            <button class="btn-danger" onclick="excluirRonda(${ronda.id}); fecharModal()">
                <i class="fas fa-trash"></i> Excluir
            </button>
        </div>
    `);
}

function excluirRonda(id) {
    const ronda = rondas.find(r => r.id === id);
    if (!ronda) return;
    
    mostrarModal('Excluir Ronda', `
        <p>Tem certeza que deseja excluir esta ronda?</p>
        <div style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <strong>${ronda.setor}</strong><br>
            ${ronda.data} às ${ronda.hora}<br>
            ${ronda.responsavel} • ${ronda.status === 'concluido' ? 'Concluído' : ronda.status === 'ajustes' ? 'Ajustes' : 'Problemas'}
        </div>
        <p><strong>Esta ação não pode ser desfeita.</strong></p>
    `, [
        { text: 'Cancelar', class: 'btn-secondary' },
        { 
            text: 'Excluir', 
            class: 'btn-danger',
            action: () => {
                const index = rondas.findIndex(r => r.id === id);
                if (index !== -1) {
                    rondas.splice(index, 1);
                    salvarDados();
                    
                    // Atualizar interfaces
                    if (document.getElementById('dashboard').classList.contains('active')) {
                        atualizarDashboard();
                    } else if (document.getElementById('minhas-rondas').classList.contains('active')) {
                        carregarRondas();
                    } else if (document.getElementById('calendario').classList.contains('active')) {
                        renderizarCalendario();
                    } else if (document.getElementById('relatorios').classList.contains('active')) {
                        atualizarRelatorios();
                    }
                    
                    mostrarModal('Ronda Excluída', '<p>A ronda foi excluída com sucesso.</p>', ['OK']);
                }
            }
        }
    ]);
}

function gerarPDF(ronda) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    
    // Cabeçalho
    doc.setFontSize(20);
    doc.setTextColor(44, 62, 80);
    doc.text('RELATÓRIO DE RONDA - IMPRESSORAS', pageWidth / 2, margin, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Sistema de Controle de Manutenção Preventiva', pageWidth / 2, margin + 8, { align: 'center' });
    doc.text(`ID: ${ronda.id} • Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, margin + 15, { align: 'center' });
    
    // Linha divisória
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, margin + 20, pageWidth - margin, margin + 20);
    
    let yPos = margin + 30;
    
    // Informações da Ronda
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('INFORMAÇÕES DA RONDA', margin, yPos);
    
    yPos += 10;
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    
    const infoRows = [
        ['Data', ronda.data],
        ['Hora', ronda.hora],
        ['Setor', ronda.setor],
        ['Responsável', ronda.responsavel],
        ['Turno', ronda.turno],
        ['Status', ronda.status === 'concluido' ? '✅ CONCLUÍDO' : 
                   ronda.status === 'ajustes' ? '⚠️ AJUSTES' : '❌ PROBLEMAS'],
        ['Total de Impressoras', ronda.impressoras.length.toString()]
    ];
    
    infoRows.forEach(([label, value]) => {
        doc.setFont(undefined, 'bold');
        doc.text(`${label}:`, margin, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(value, margin + 40, yPos);
        yPos += 7;
    });
    
    yPos += 10;
    
    // Impressoras Verificadas
    if (ronda.impressoras.length > 0) {
        doc.setFont(undefined, 'bold');
        doc.text('IMPRESSORAS VERIFICADAS', margin, yPos);
        
        yPos += 10;
        
        // Tabela de impressoras
        const impressoraHeaders = [['Modelo', 'Nº Série', 'Status']];
        const impressoraData = ronda.impressoras.map(imp => [
            imp.modelo,
            imp.serie,
            imp.status === 'operando' ? '✅ Operando' : 
            imp.status === 'manutencao' ? '🔧 Manutenção' : '🛑 Parada'
        ]);
        
        doc.autoTable({
            startY: yPos,
            head: impressoraHeaders,
            body: impressoraData,
            margin: { left: margin, right: margin },
            styles: { fontSize: 10 },
            headStyles: { fillColor: [52, 152, 219] }
        });
        
        yPos = doc.lastAutoTable.finalY + 10;
    }
    
    // Relatório Detalhado
    doc.setFont(undefined, 'bold');
    doc.text('RELATÓRIO DETALHADO', margin, yPos);
    
    yPos += 10;
    doc.setFont(undefined, 'normal');
    
    // Formatar texto com quebras de linha
    const texto = ronda.relatorio;
    const lines = doc.splitTextToSize(texto, pageWidth - 2 * margin);
    
    lines.forEach(line => {
        // Verificar se precisa de nova página
        if (yPos > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            yPos = margin;
        }
        
        doc.text(line, margin, yPos);
        yPos += 7;
    });
    
    yPos += 5;
    
    // Tags
    if (ronda.tags.length > 0) {
        if (yPos > doc.internal.pageSize.getHeight() - margin - 20) {
            doc.addPage();
            yPos = margin;
        }
        
        doc.setFont(undefined, 'bold');
        doc.text('TAGS:', margin, yPos);
        yPos += 7;
        doc.setFont(undefined, 'normal');
        doc.text(ronda.tags.join(', '), margin, yPos);
        yPos += 10;
    }
    
    // Observações
    if (ronda.observacoes) {
        if (yPos > doc.internal.pageSize.getHeight() - margin - 30) {
            doc.addPage();
            yPos = margin;
        }
        
        doc.setFont(undefined, 'bold');
        doc.text('OBSERVAÇÕES:', margin, yPos);
        yPos += 7;
        doc.setFont(undefined, 'normal');
        
        const obsLines = doc.splitTextToSize(ronda.observacoes, pageWidth - 2 * margin);
        obsLines.forEach(line => {
            if (yPos > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                yPos = margin;
            }
            doc.text(line, margin, yPos);
            yPos += 7;
        });
    }
    
    // Rodapé
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Página ${i} de ${totalPages} • Sistema de Rondas • Confidential`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }
    
    // Nome do arquivo
    const data = new Date(ronda.data);
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const horaFormatada = ronda.hora.replace(':', '-');
    const setorFormatado = ronda.setor.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    const nomeArquivo = `${ano}/${mes}/${ronda.data}_${horaFormatada}_${setorFormatado}.pdf`;
    
    // Baixar PDF
    doc.save(nomeArquivo);
    
    return true;
}

function exportarPDFsIndividuais() {
    if (rondas.length === 0) return;
    
    mostrarModal('Exportando...', `
        <p>Gerando ${rondas.length} arquivos PDF...</p>
        <div style="text-align: center; margin: 20px 0;">
            <div class="loader" style="width: 30px; height: 30px; margin: 0 auto;"></div>
        </div>
        <p id="export-progress">Iniciando exportação...</p>
    `, [], false);
    
    let exportadas = 0;
    
    const exportarProxima = () => {
        if (exportadas < rondas.length) {
            const ronda = rondas[exportadas];
            gerarPDF(ronda);
            exportadas++;
            
            document.getElementById('export-progress').textContent = 
                `Exportando... ${exportadas} de ${rondas.length} (${Math.round((exportadas / rondas.length) * 100)}%)`;
            
            // Delay para não sobrecarregar o navegador
            setTimeout(exportarProxima, 500);
        } else {
            mostrarModal('Exportação Concluída', `
                <p>✅ Exportação concluída com sucesso!</p>
                <p>${rondas.length} arquivos PDF foram baixados.</p>
                <div style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <strong>Dicas:</strong><br>
                    • Os arquivos foram organizados em pastas por ano/mês<br>
                    • Verifique sua pasta de downloads<br>
                    • Recomendamos fazer backup regularmente
                </div>
            `, ['OK']);
        }
    };
    
    exportarProxima();
}

function exportarPDFRelatorio(opcoes, rondasFiltradas, periodo) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    
    // Cabeçalho
    doc.setFontSize(20);
    doc.setTextColor(44, 62, 80);
    doc.text('RELATÓRIO ANALÍTICO - RONDAS', pageWidth / 2, margin, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Sistema de Controle de Manutenção Preventiva', pageWidth / 2, margin + 8, { align: 'center' });
    doc.text(`Período: ${periodo === 'tudo' ? 'Todo o período' : `Últimos ${periodo} dias`} • Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, margin + 15, { align: 'center' });
    
    // Resumo
    let yPos = margin + 30;
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('RESUMO EXECUTIVO', margin, yPos);
    
    yPos += 10;
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    
    const resumo = [
        ['Total de Rondas', rondasFiltradas.length.toString()],
        ['Rondas Concluídas', rondasFiltradas.filter(r => r.status === 'concluido').length.toString()],
        ['Rondas com Ajustes', rondasFiltradas.filter(r => r.status === 'ajustes').length.toString()],
        ['Rondas com Problemas', rondasFiltradas.filter(r => r.status === 'problemas').length.toString()],
        ['Setores Ativos', [...new Set(rondasFiltradas.map(r => r.setor))].length.toString()],
        ['Taxa de Conclusão', `${Math.round((rondasFiltradas.filter(r => r.status === 'concluido').length / Math.max(rondasFiltradas.length, 1)) * 100)}%`]
    ];
    
    resumo.forEach(([label, value]) => {
        doc.setFont(undefined, 'bold');
        doc.text(`${label}:`, margin, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(value, margin + 60, yPos);
        yPos += 7;
    });
    
    // TODO: Adicionar gráficos e mais análises
    
    // Nome do arquivo
    const hoje = new Date().toISOString().split('T')[0];
    const nomeArquivo = `relatorio-rondas-${hoje}.pdf`;
    
    doc.save(nomeArquivo);
}

// ===== MODAIS =====
function inicializarModais() {
    // Fechar modal com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            fecharModal();
        }
    });
}

function mostrarModal(titulo, conteudo, botoes = ['OK'], fecharAutomaticamente = true) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');
    
    // Titulo
    modalTitle.textContent = titulo;
    
    // Conteúdo
    modalBody.innerHTML = conteudo;
    
    // Botões
    modalFooter.innerHTML = '';
    
    if (Array.isArray(botoes[0]) || (botoes.length > 0 && typeof botoes[0] === 'object')) {
        // Botões personalizados
        botoes.forEach(botao => {
            const btn = document.createElement('button');
            btn.className = botao.class || 'btn-secondary';
            btn.textContent = botao.text;
            btn.onclick = function() {
                if (botao.action) botao.action();
                if (botao.close !== false) fecharModal();
            };
            modalFooter.appendChild(btn);
        });
    } else {
        // Botões simples (strings)
        botoes.forEach(texto => {
            const btn = document.createElement('button');
            btn.className = texto === 'OK' ? 'btn-primary' : 'btn-secondary';
            btn.textContent = texto;
            btn.onclick = fecharModal;
            modalFooter.appendChild(btn);
        });
    }
    
    // Fechar com clique fora
    modal.onclick = function(e) {
        if (e.target === modal) {
            fecharModal();
        }
    };
    
    // Fechar com botão X
    document.querySelector('.modal-close').onclick = fecharModal;
    
    // Mostrar modal
    modal.classList.add('show');
    
    // Fechar automaticamente após 5 segundos (se especificado)
    if (fecharAutomaticamente && titulo.includes('Sucesso')) {
        setTimeout(fecharModal, 5000);
    }
}

function fecharModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('show');
}

// ===== UTILITÁRIOS =====
function atualizarDataHora() {
    const agora = new Date();
    const dataStr = agora.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    const horaStr = agora.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    // Atualizar no rodapé
    document.getElementById('footer-ultima-atualizacao').textContent = horaStr;
}

function atualizarEstatisticasFooter() {
    document.getElementById('footer-total-rondas').textContent = rondas.length;
}

// ===== FUNÇÕES NÃO IMPLEMENTADAS (para próxima versão) =====
function gerarPDFRelatorioCompleto(rondasPeriodo, periodo) {
    mostrarModal('Em Desenvolvimento', 'Esta funcionalidade será implementada na próxima versão.', ['OK']);
}

function exportarExcel() {
    mostrarModal('Em Desenvolvimento', 'Esta funcionalidade será implementada na próxima versão.', ['OK']);
}

function exportarExcelCompleto(rondasPeriodo) {
    mostrarModal('Em Desenvolvimento', 'Esta funcionalidade será implementada na próxima versão.', ['OK']);
}

function exportarHTMLCompleto(rondasPeriodo) {
    mostrarModal('Em Desenvolvimento', 'Esta funcionalidade será implementada na próxima versão.', ['OK']);
}

function exportarRelatorio(tipo) {
    mostrarModal('Em Desenvolvimento', `Exportação do relatório ${tipo} será implementada na próxima versão.`, ['OK']);
}

// ===== EXPORTAR FUNÇÕES PARA O HTML =====
window.gerarPDF = gerarPDF;
window.verDetalhesRonda = verDetalhesRonda;
window.excluirRonda = excluirRonda;
window.removerTag = removerTag;
window.removerImpressora = removerImpressora;
window.fecharModal = fecharModal;