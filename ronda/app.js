// Sistema de Rondas - Arquivo Principal
// Autor: Sistema de Rondas v2.0

// Dados persistentes
let rondas = JSON.parse(localStorage.getItem('rondas')) || [];
let tags = JSON.parse(localStorage.getItem('tags')) || ['toner', 'papel', 'software', 'hardware', 'rede'];

// Elementos principais
const sections = {
    dashboard: document.getElementById('dashboard-section'),
    form: document.getElementById('form-ronda-section'),
    calendario: document.getElementById('calendario-section'),
    relatorios: document.getElementById('relatorios-section'),
    tags: document.getElementById('tags-section')
};

// Navegação
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const target = this.id.replace('btn-', '');
        
        // Atualizar botões ativos
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        // Mostrar seção correta
        Object.values(sections).forEach(section => {
            section.style.display = 'none';
        });
        
        if (sections[target]) {
            sections[target].style.display = 'block';
            
            // Inicializar seção se necessário
            switch(target) {
                case 'dashboard':
                    atualizarDashboard();
                    break;
                case 'calendario':
                    inicializarCalendario();
                    break;
                case 'relatorios':
                    buscarRelatorios();
                    break;
                case 'tags':
                    carregarTags();
                    break;
            }
        }
    });
});

// Inicializar data/hora no formulário
function atualizarDataHora() {
    const agora = new Date();
    document.getElementById('data-atual').textContent = 
        `📅 ${agora.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
    document.getElementById('hora-inicio').textContent = 
        `🕒 ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

// Contador de caracteres
document.getElementById('relatorio').addEventListener('input', function() {
    document.getElementById('contador').textContent = this.value.length;
});

// Campo "outro setor"
document.getElementById('setor').addEventListener('change', function() {
    const outroInput = document.getElementById('outro-setor');
    outroInput.style.display = this.value === 'outro' ? 'block' : 'none';
    if (this.value !== 'outro') outroInput.value = '';
});

// Sistema de tags no formulário
document.getElementById('btn-add-tag').addEventListener('click', function() {
    const input = document.getElementById('tag-input');
    const tag = input.value.trim().toLowerCase();
    
    if (tag && !document.querySelector(`.tag[data-tag="${tag}"]`)) {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag';
        tagElement.dataset.tag = tag;
        tagElement.innerHTML = `
            ${tag}
            <span class="remove-tag" onclick="removerTag(this)">×</span>
        `;
        document.getElementById('tags-container').appendChild(tagElement);
        input.value = '';
    }
});

function removerTag(element) {
    element.parentElement.remove();
}

// Submissão do formulário
document.getElementById('form-ronda').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Coletar dados
    const setorSelecionado = document.getElementById('setor').value;
    const setor = setorSelecionado === 'outro' 
        ? document.getElementById('outro-setor').value.trim()
        : document.getElementById('setor').options[document.getElementById('setor').selectedIndex].text;
    
    const status = document.querySelector('input[name="status"]:checked')?.value || 'ok';
    const relatorio = document.getElementById('relatorio').value.trim();
    
    // Coletar tags
    const tagsSelecionadas = Array.from(document.querySelectorAll('#tags-container .tag'))
        .map(tag => tag.dataset.tag);
    
    if (!setor || !relatorio) {
        alert('Por favor, preencha o setor e o relatório!');
        return;
    }
    
    const dataAtual = new Date();
    const novaRonda = {
        id: Date.now(),
        data: dataAtual.toISOString().split('T')[0],
        dataCompleta: dataAtual.toISOString(),
        hora: dataAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        setor: setor,
        status: status,
        tags: tagsSelecionadas,
        relatorio: relatorio
    };
    
    // Salvar
    rondas.unshift(novaRonda);
    localStorage.setItem('rondas', JSON.stringify(rondas));
    
    // Baixar PDF
    gerarPDF(novaRonda);
    
    // Feedback
    alert(`✅ Ronda salva com sucesso!\n\nPDF baixado automaticamente.\nArquivo: ${formatarNomeArquivo(novaRonda)}`);
    
    // Resetar formulário
    this.reset();
    document.getElementById('tags-container').innerHTML = '';
    document.getElementById('contador').textContent = '0';
    atualizarDataHora();
    atualizarDashboard();
});

// Função para gerar PDF
function gerarPDF(ronda) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    
    // Cabeçalho
    doc.setFontSize(20);
    doc.setTextColor(44, 62, 80);
    doc.text('RELATÓRIO DE RONDA - IMPRESSORAS', pageWidth / 2, margin, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Sistema de Rondas v2.0 - Controle de Manutenção Preventiva', pageWidth / 2, margin + 8, { align: 'center' });
    
    // Linha divisória
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, margin + 15, pageWidth - margin, margin + 15);
    
    let yPos = margin + 25;
    
    // Informações da ronda
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('INFORMAÇÕES DA RONDA', margin, yPos);
    
    yPos += 10;
    doc.setFont(undefined, 'normal');
    
    // Tabela de informações
    const infos = [
        ['Data', ronda.data],
        ['Hora', ronda.hora],
        ['Setor', ronda.setor],
        ['Status', formatarStatusTexto(ronda.status)],
        ['Tags', ronda.tags.join(', ') || 'Nenhuma']
    ];
    
    infos.forEach(([label, value]) => {
        doc.setFont(undefined, 'bold');
        doc.text(`${label}:`, margin, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(value, margin + 40, yPos);
        yPos += 8;
    });
    
    yPos += 10;
    
    // Relatório detalhado
    doc.setFont(undefined, 'bold');
    doc.text('RELATÓRIO DETALHADO', margin, yPos);
    
    yPos += 10;
    doc.setFont(undefined, 'normal');
    
    // Texto formatado
    const texto = ronda.relatorio;
    const lines = doc.splitTextToSize(texto, pageWidth - 2 * margin);
    
    // Adicionar marcadores
    const formattedLines = [];
    lines.forEach(line => {
        if (line.trim().startsWith('•')) {
            doc.setFont(undefined, 'bold');
            doc.text('•', margin, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(line.substring(1).trim(), margin + 5, yPos);
        } else {
            doc.text(line, margin, yPos);
        }
        yPos += 7;
        
        // Nova página se necessário
        if (yPos > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            yPos = margin;
        }
    });
    
    // Rodapé
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Página ${i} de ${totalPages} • Sistema de Rondas • Gerado em ${new Date().toLocaleString('pt-BR')}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }
    
    // Baixar
    const nomeArquivo = formatarNomeArquivo(ronda);
    doc.save(nomeArquivo);
    
    return true;
}

function formatarNomeArquivo(ronda) {
    const data = new Date(ronda.dataCompleta);
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const nomeMes = meses[data.getMonth()];
    const horaFormatada = ronda.hora.replace(':', '-');
    const setorFormatado = ronda.setor.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    return `${ano}/${mes}-${nomeMes}/${ronda.data}_${horaFormatada}_${setorFormatado}.pdf`;
}

function formatarStatusTexto(status) {
    const map = {
        'ok': '✅ TUDO OK',
        'ajustes': '⚠️ PEQUENOS AJUSTES',
        'problemas': '❌ PROBLEMAS SÉRIOS'
    };
    return map[status] || status.toUpperCase();
}

// Cancelar ronda
document.getElementById('btn-cancelar').addEventListener('click', function() {
    if (confirm('Cancelar esta ronda? Os dados não salvos serão perdidos.')) {
        document.getElementById('form-ronda').reset();
        document.getElementById('tags-container').innerHTML = '';
        document.getElementById('contador').textContent = '0';
    }
});

// Salvar sem PDF
document.getElementById('btn-salvar-sem-pdf').addEventListener('click', function() {
    document.getElementById('form-ronda').dispatchEvent(new Event('submit'));
});

// Exportar tudo
document.getElementById('btn-exportar').addEventListener('click', function() {
    if (rondas.length === 0) {
        alert('Nenhuma ronda para exportar!');
        return;
    }
    
    if (confirm(`Exportar todas as ${rondas.length} rondas como PDFs individuais?`)) {
        rondas.forEach((ronda, index) => {
            setTimeout(() => {
                gerarPDF(ronda);
            }, index * 500);
        });
        
        alert(`Iniciando exportação de ${rondas.length} arquivos...`);
    }
});

// Atualizar rodapé
function atualizarRodape() {
    document.getElementById('total-registros').textContent = rondas.length;
    
    // Calcular espaço usado
    const dataSize = JSON.stringify(rondas).length;
    const sizeKB = (dataSize / 1024).toFixed(2);
    document.getElementById('espaco-utilizado').textContent = `${sizeKB} KB`;
    
    // Última ronda
    if (rondas.length > 0) {
        const ultima = rondas[0];
        document.getElementById('ultima-ronda').textContent = 
            `${ultima.data} às ${ultima.hora} - ${ultima.setor}`;
    }
}

// Inicialização
function init() {
    atualizarDataHora();
    atualizarDashboard();
    atualizarRodape();
    setInterval(atualizarDataHora, 60000); // Atualizar minuto a minuto
    
    // Mostrar dashboard por padrão
    document.getElementById('btn-dashboard').click();
}

// Iniciar quando carregar
document.addEventListener('DOMContentLoaded', init);