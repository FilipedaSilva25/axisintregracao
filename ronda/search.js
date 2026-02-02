// Busca e filtros de relatórios

let resultadosBusca = [];
let ordenacao = 'data-desc';

function buscarRelatorios() {
    let resultados = [...rondas];
    
    // Filtro de busca por texto
    const textoBusca = document.getElementById('input-busca').value.toLowerCase();
    if (textoBusca) {
        resultados = resultados.filter(r => 
            r.relatorio.toLowerCase().includes(textoBusca) ||
            r.setor.toLowerCase().includes(textoBusca) ||
            r.tags.some(tag => tag.includes(textoBusca))
        );
    }
    
    // Filtro por data
    const filtroData = document.getElementById('filtro-data').value;
    if (filtroData) {
        resultados = resultados.filter(r => r.data === filtroData);
    }
    
    // Filtro por setor
    const filtroSetor = document.getElementById('filtro-setor').value;
    if (filtroSetor) {
        resultados = resultados.filter(r => r.setor === filtroSetor);
    }
    
    // Filtro por status
    const filtroStatus = document.getElementById('filtro-status').value;
    if (filtroStatus) {
        resultados = resultados.filter(r => r.status === filtroStatus);
    }
    
    // Filtro por tags
    const filtroTags = document.getElementById('filtro-tags').value;
    if (filtroTags) {
        resultados = resultados.filter(r => r.tags.includes(filtroTags));
    }
    
    // Ordenação
    resultados.sort((a, b) => {
        if (ordenacao === 'data-desc') {
            return new Date(b.dataCompleta) - new Date(a.dataCompleta);
        } else if (ordenacao === 'data-asc') {
            return new Date(a.dataCompleta) - new Date(b.dataCompleta);
        } else if (ordenacao === 'setor') {
            return a.setor.localeCompare(b.setor);
        } else if (ordenacao === 'status') {
            return a.status.localeCompare(b.status);
        }
        return 0;
    });
    
    resultadosBusca = resultados;
    exibirResultados(resultados);
}

function exibirResultados(resultados) {
    const container = document.getElementById('container-relatorios');
    const totalElement = document.getElementById('total-resultados');
    
    totalElement.textContent = resultados.length;
    
    if (resultados.length === 0) {
        container.innerHTML = `
            <div class="sem-resultados">
                <h3>📭 Nenhum relatório encontrado</h3>
                <p>Tente ajustar os filtros ou realizar uma nova busca.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = resultados.map(ronda => `
        <div class="relatorio-card ${ronda.status}">
            <div class="relatorio-header">
                <div class="relatorio-data">${ronda.data} às ${ronda.hora}</div>
                <div class="relatorio-setor">${ronda.setor}</div>
                <div class="relatorio-status ${ronda.status}">
                    ${ronda.status === 'ok' ? '✅ Tudo OK' : 
                      ronda.status === 'ajustes' ? '⚠️ Pequenos ajustes' : '❌ Problemas sérios'}
                </div>
            </div>
            
            ${ronda.tags.length > 0 ? `
                <div class="relatorio-tags">
                    ${ronda.tags.map(tag => `<span class="tag-mini">🏷️ ${tag}</span>`).join('')}
                </div>
            ` : ''}
            
            <div class="relatorio-conteudo">
                ${ronda.relatorio.substring(0, 300)}
                ${ronda.relatorio.length > 300 ? '...' : ''}
            </div>
            
            <div class="relatorio-actions">
                <button class="btn-pdf" onclick="gerarPDF(${JSON.stringify(ronda).replace(/"/g, '&quot;')})">
                    📄 Baixar PDF
                </button>
                <button class="btn-editar" onclick="editarRonda(${ronda.id})">
                    ✏️ Editar
                </button>
                <button class="btn-excluir" onclick="excluirRonda(${ronda.id})">
                    🗑️ Excluir
                </button>
            </div>
        </div>
    `).join('');
}

function atualizarFiltros() {
    // Setores
    const setores = [...new Set(rondas.map(r => r.setor))];
    const selectSetor = document.getElementById('filtro-setor');
    selectSetor.innerHTML = '<option value="">Todos os setores</option>' +
        setores.map(s => `<option value="${s}">${s}</option>`).join('');
    
    // Tags
    const todasTags = [...new Set(rondas.flatMap(r => r.tags))];
    const selectTags = document.getElementById('filtro-tags');
    selectTags.innerHTML = '<option value="">Todas as tags</option>' +
        todasTags.map(tag => `<option value="${tag}">${tag}</option>`).join('');
}

// Event Listeners
document.getElementById('btn-buscar').addEventListener('click', buscarRelatorios);
document.getElementById('input-busca').addEventListener('keyup', function(e) {
    if (e.key === 'Enter') buscarRelatorios();
});

document.getElementById('btn-aplicar-filtros').addEventListener('click', buscarRelatorios);
document.getElementById('btn-limpar-filtros').addEventListener('click', function() {
    document.getElementById('input-busca').value = '';
    document.getElementById('filtro-data').value = '';
    document.getElementById('filtro-setor').value = '';
    document.getElementById('filtro-status').value = '';
    document.getElementById('filtro-tags').value = '';
    buscarRelatorios();
});

document.getElementById('btn-ordenar').addEventListener('click', function() {
    const opcoes = ['data-desc', 'data-asc', 'setor', 'status'];
    const atualIndex = opcoes.indexOf(ordenacao);
    ordenacao = opcoes[(atualIndex + 1) % opcoes.length];
    
    const textos = {
        'data-desc': 'Ordenar por Data ▼',
        'data-asc': 'Ordenar por Data ▲',
        'setor': 'Ordenar por Setor',
        'status': 'Ordenar por Status'
    };
    
    this.textContent = textos[ordenacao];
    buscarRelatorios();
});

document.getElementById('btn-exportar-resultados').addEventListener('click', function() {
    if (resultadosBusca.length === 0) {
        alert('Nenhum resultado para exportar!');
        return;
    }
    
    if (confirm(`Exportar ${resultadosBusca.length} relatórios como PDFs individuais?`)) {
        resultadosBusca.forEach((ronda, index) => {
            setTimeout(() => gerarPDF(ronda), index * 500);
        });
        alert(`Iniciando exportação de ${resultadosBusca.length} arquivos...`);
    }
});

// Funções auxiliares
function editarRonda(id) {
    const ronda = rondas.find(r => r.id === id);
    if (!ronda) return;
    
    // Preencher formulário com dados da ronda
    document.getElementById('btn-nova-ronda').click();
    
    // Preencher campos
    document.getElementById('setor').value = 'outro';
    document.getElementById('outro-setor').value = ronda.setor;
    document.getElementById('outro-setor').style.display = 'block';
    
    document.querySelector(`input[name="status"][value="${ronda.status}"]`).checked = true;
    document.getElementById('relatorio').value = ronda.relatorio;
    document.getElementById('contador').textContent = ronda.relatorio.length;
    
    // Preencher tags
    const tagsContainer = document.getElementById('tags-container');
    tagsContainer.innerHTML = '';
    ronda.tags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag';
        tagElement.dataset.tag = tag;
        tagElement.innerHTML = `
            ${tag}
            <span class="remove-tag" onclick="removerTag(this)">×</span>
        `;
        tagsContainer.appendChild(tagElement);
    });
    
    // Alterar comportamento do submit para edição
    const form = document.getElementById('form-ronda');
    const originalSubmit = form.onsubmit;
    
    form.onsubmit = function(e) {
        e.preventDefault();
        
        // Atualizar ronda existente
        const index = rondas.findIndex(r => r.id === id);
        if (index !== -1) {
            // Coletar dados atualizados
            const setor = document.getElementById('outro-setor').value.trim();
            const status = document.querySelector('input[name="status"]:checked')?.value;
            const relatorio = document.getElementById('relatorio').value.trim();
            const tags = Array.from(document.querySelectorAll('#tags-container .tag'))
                .map(tag => tag.dataset.tag);
            
            rondas[index] = {
                ...rondas[index],
                setor,
                status,
                tags,
                relatorio,
                dataCompleta: new Date().toISOString()
            };
            
            localStorage.setItem('rondas', JSON.stringify(rondas));
            
            alert('✅ Ronda atualizada com sucesso!');
            gerarPDF(rondas[index]);
            
            // Restaurar comportamento original
            form.onsubmit = originalSubmit;
            form.reset();
            document.getElementById('btn-dashboard').click();
        }
    };
}

function excluirRonda(id) {
    if (confirm('Tem certeza que deseja excluir esta ronda? Esta ação não pode ser desfeita.')) {
        const index = rondas.findIndex(r => r.id === id);
        if (index !== -1) {
            rondas.splice(index, 1);
            localStorage.setItem('rondas', JSON.stringify(rondas));
            buscarRelatorios();
            atualizarDashboard();
            alert('Ronda excluída com sucesso!');
        }
    }
}