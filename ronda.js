// ============================================
// SISTEMA DE RONDAS - JavaScript Completo
// Design Glass Morphism - Todos os botões funcionam
// ============================================

// Variáveis globais
let passoAtual = 1;
const totalPassos = 3;

// Nomes dos meses
const mesesNomes = {
    '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
    '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
    '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
};

// Inicialização quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Sistema de Rondas inicializado');
    
    // Inicializar formulário
    inicializarFormulario();
    
    // Event listeners
    setupEventListeners();
    
    // Atualizar contadores
    atualizarContadores();
});

// Inicializar formulário
function inicializarFormulario() {
    mostrarPasso(1);
    
    // Selecionar status por padrão
    const statusConcluido = document.querySelector('input[name="ronda-status"][value="concluido"]');
    if (statusConcluido) {
        statusConcluido.checked = true;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Botão próximo
    const btnProximo = document.getElementById('btn-proximo');
    if (btnProximo) {
        btnProximo.addEventListener('click', proximoPasso);
    }
    
    // Botão voltar
    const btnVoltar = document.getElementById('btn-voltar');
    if (btnVoltar) {
        btnVoltar.addEventListener('click', passoAnterior);
    }
    
    // Formulário submit
    const form = document.getElementById('ronda-form');
    if (form) {
        form.addEventListener('submit', salvarRonda);
    }
    
    // Campo "outro setor"
    const setorSelect = document.getElementById('ronda-setor');
    const outroSetor = document.getElementById('ronda-outro-setor');
    if (setorSelect && outroSetor) {
        setorSelect.addEventListener('change', function() {
            if (this.value === 'outro') {
                outroSetor.style.display = 'block';
                outroSetor.required = true;
            } else {
                outroSetor.style.display = 'none';
                outroSetor.required = false;
                outroSetor.value = '';
            }
        });
    }
    
    // Contador de caracteres
    const textarea = document.getElementById('ronda-descricao');
    if (textarea) {
        textarea.addEventListener('input', atualizarContadores);
        textarea.addEventListener('keyup', atualizarContadores);
    }
    
    // Status options hover
    const statusOptions = document.querySelectorAll('.ronda-status-option');
    statusOptions.forEach(option => {
        option.addEventListener('click', function() {
            const radio = this.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
                atualizarStatusSelecionado();
            }
        });
    });
}

// Mostrar passo específico
function mostrarPasso(passo) {
    passoAtual = passo;
    
    // Esconder todos os passos
    const passos = document.querySelectorAll('.ronda-form-step');
    passos.forEach(p => p.classList.remove('active'));
    
    // Mostrar passo atual
    const passoAtualEl = document.querySelector(`.ronda-form-step[data-step="${passo}"]`);
    if (passoAtualEl) {
        passoAtualEl.classList.add('active');
    }
    
    // Atualizar indicadores
    atualizarIndicadores();
    
    // Atualizar botões
    atualizarBotoes();
    
    // Se for passo 3, gerar resumo
    if (passo === 3) {
        gerarResumo();
    }
}

// Atualizar indicadores de passo
function atualizarIndicadores() {
    const dots = document.querySelectorAll('.ronda-step-dot');
    dots.forEach((dot, index) => {
        if (index + 1 === passoAtual) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// Atualizar botões de navegação
function atualizarBotoes() {
    const btnVoltar = document.getElementById('btn-voltar');
    const btnProximo = document.getElementById('btn-proximo');
    const btnSalvar = document.getElementById('btn-salvar');
    
    if (btnVoltar) {
        if (passoAtual === 1) {
            btnVoltar.style.display = 'none';
        } else {
            btnVoltar.style.display = 'inline-flex';
        }
    }
    
    if (btnProximo && btnSalvar) {
        if (passoAtual === totalPassos) {
            btnProximo.style.display = 'none';
            btnSalvar.style.display = 'inline-flex';
        } else {
            btnProximo.style.display = 'inline-flex';
            btnSalvar.style.display = 'none';
        }
    }
}

// Próximo passo
function proximoPasso() {
    if (validarPassoAtual()) {
        if (passoAtual < totalPassos) {
            mostrarPasso(passoAtual + 1);
        }
    }
}

// Passo anterior
function passoAnterior() {
    if (passoAtual > 1) {
        mostrarPasso(passoAtual - 1);
    }
}

// Validar passo atual
function validarPassoAtual() {
    const passoEl = document.querySelector(`.ronda-form-step[data-step="${passoAtual}"]`);
    if (!passoEl) return false;
    
    const camposObrigatorios = passoEl.querySelectorAll('[required]');
    let valido = true;
    
    camposObrigatorios.forEach(campo => {
        if (!campo.value.trim()) {
            valido = false;
            campo.style.borderColor = '#ff3b30';
            setTimeout(() => {
                campo.style.borderColor = '';
            }, 2000);
        }
    });
    
    // Validar status se for passo 1
    if (passoAtual === 1) {
        const statusSelecionado = document.querySelector('input[name="ronda-status"]:checked');
        if (!statusSelecionado) {
            valido = false;
            alert('Por favor, selecione um status geral.');
        }
    }
    
    if (!valido) {
        alert('Por favor, preencha todos os campos obrigatórios.');
    }
    
    return valido;
}

// Atualizar contadores
function atualizarContadores() {
    const textarea = document.getElementById('ronda-descricao');
    const contadorCaracteres = document.getElementById('ronda-contador-caracteres');
    const contadorLinhas = document.getElementById('ronda-contador-linhas');
    
    if (textarea && contadorCaracteres && contadorLinhas) {
        const texto = textarea.value;
        const caracteres = texto.length;
        const linhas = texto.split('\n').length;
        
        contadorCaracteres.textContent = caracteres;
        contadorLinhas.textContent = linhas;
    }
}

// Atualizar status selecionado
function atualizarStatusSelecionado() {
    const statusOptions = document.querySelectorAll('.ronda-status-option');
    statusOptions.forEach(option => {
        const radio = option.querySelector('input[type="radio"]');
        if (radio && radio.checked) {
            option.style.borderColor = getStatusColor(radio.value);
            option.style.background = 'rgba(255, 255, 255, 0.7)';
        } else {
            option.style.borderColor = 'transparent';
            option.style.background = 'rgba(255, 255, 255, 0.5)';
        }
    });
}

function getStatusColor(status) {
    const cores = {
        'concluido': '#34c759',
        'ajustes': '#ff9500',
        'problemas': '#ff3b30'
    };
    return cores[status] || '#007aff';
}

// Gerar resumo
function gerarResumo() {
    const resumoEl = document.getElementById('ronda-resumo');
    if (!resumoEl) return;
    
    const setor = document.getElementById('ronda-setor').value;
    const outroSetor = document.getElementById('ronda-outro-setor').value;
    const setorFinal = setor === 'outro' ? outroSetor : setor;
    const responsavel = document.getElementById('ronda-responsavel').value;
    const turno = document.getElementById('ronda-turno').value;
    const status = document.querySelector('input[name="ronda-status"]:checked')?.value || '';
    const descricao = document.getElementById('ronda-descricao').value;
    
    const checkboxes = document.querySelectorAll('input[name="ronda-checklist"]:checked');
    const checklistItems = Array.from(checkboxes).map(cb => cb.value);
    
    const dataAtual = new Date();
    const dataFormatada = dataAtual.toLocaleDateString('pt-BR');
    const horaFormatada = dataAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    resumoEl.innerHTML = `
        <h4>📋 Resumo da Ronda</h4>
        <div class="ronda-resumo-item">
            <strong>Data e Hora:</strong>
            <span>${dataFormatada} às ${horaFormatada}</span>
        </div>
        <div class="ronda-resumo-item">
            <strong>Setor:</strong>
            <span>${setorFinal}</span>
        </div>
        <div class="ronda-resumo-item">
            <strong>Responsável:</strong>
            <span>${responsavel}</span>
        </div>
        <div class="ronda-resumo-item">
            <strong>Turno:</strong>
            <span>${turno}</span>
        </div>
        <div class="ronda-resumo-item">
            <strong>Status:</strong>
            <span style="text-transform: capitalize;">${status}</span>
        </div>
        <div class="ronda-resumo-item">
            <strong>Itens do Checklist:</strong>
            <span>${checklistItems.length} itens marcados</span>
        </div>
        <div class="ronda-resumo-item">
            <strong>Descrição:</strong>
            <span>${descricao.length} caracteres</span>
        </div>
    `;
}

// Salvar ronda
function salvarRonda(e) {
    e.preventDefault();
    
    if (!validarPassoAtual()) {
        return;
    }
    
    // Coletar dados
    const setor = document.getElementById('ronda-setor').value;
    const outroSetor = document.getElementById('ronda-outro-setor').value;
    const setorFinal = setor === 'outro' ? outroSetor : setor;
    const responsavel = document.getElementById('ronda-responsavel').value;
    const turno = document.getElementById('ronda-turno').value;
    const status = document.querySelector('input[name="ronda-status"]:checked')?.value || '';
    const descricao = document.getElementById('ronda-descricao').value;
    
    const checkboxes = document.querySelectorAll('input[name="ronda-checklist"]:checked');
    const checklistItems = Array.from(checkboxes).map(cb => cb.value);
    
    const dataAtual = new Date();
    const ano = dataAtual.getFullYear().toString();
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
    const nomeMes = mesesNomes[mes] || 'Mês';
    
    // Criar objeto da ronda
    const ronda = {
        id: Date.now().toString(),
        setor: setorFinal,
        responsavel: responsavel,
        turno: turno,
        status: status,
        descricao: descricao,
        checklist: checklistItems,
        data: dataAtual.toISOString(),
        dataFormatada: dataAtual.toLocaleDateString('pt-BR'),
        horaFormatada: dataAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        ano: ano,
        mes: mes,
        nomeMes: nomeMes
    };
    
    // Carregar rondas existentes
    let rondas = [];
    try {
        const dadosSalvos = localStorage.getItem('sistemaRondas');
        if (dadosSalvos) {
            rondas = JSON.parse(dadosSalvos);
        }
    } catch (error) {
        console.error('Erro ao carregar rondas:', error);
    }
    
    // Adicionar nova ronda
    rondas.push(ronda);
    
    // Salvar no localStorage
    try {
        localStorage.setItem('sistemaRondas', JSON.stringify(rondas));
        console.log('✅ Ronda salva com sucesso!');
        console.log('📁 Organização:', `${ano}/${nomeMes}`);
        
        // Mostrar mensagem de sucesso
        alert('✅ Ronda salva com sucesso!\n\nOrganização: ' + ano + '/' + nomeMes);
        
        // Limpar formulário
        document.getElementById('ronda-form').reset();
        mostrarPasso(1);
        
        // Atualizar contadores
        atualizarContadores();
    } catch (error) {
        console.error('Erro ao salvar ronda:', error);
        alert('❌ Erro ao salvar ronda. Por favor, tente novamente.');
    }
}

// Exportar funções globais
window.toggleHamburgerMenu = function() {
    const menu = document.getElementById('hamburger-menu');
    const btn = document.getElementById('hamburger-btn');
    if (menu && btn) {
        menu.classList.toggle('show');
        btn.classList.toggle('active');
    }
};
