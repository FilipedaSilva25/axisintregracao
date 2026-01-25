// Sistema de Tags

function carregarTags() {
    const container = document.getElementById('lista-tags');
    const statsContainer = document.getElementById('tags-usage-stats');
    
    if (!container) return;
    
    // Carregar tags do localStorage ou usar padrão
    if (!tags || tags.length === 0) {
        tags = ['toner', 'papel', 'software', 'hardware', 'rede', 'manutenção', 'limpeza'];
        localStorage.setItem('tags', JSON.stringify(tags));
    }
    
    // Exibir tags
    container.innerHTML = tags.map(tag => `
        <div class="tag-editable" data-tag="${tag}">
            <span class="tag-name">🏷️ ${tag}</span>
            <span class="tag-count">(${contarUsoTag(tag)})</span>
            <button class="btn-remover-tag" onclick="removerTagSistema('${tag}')">🗑️</button>
        </div>
    `).join('');
    
    // Estatísticas
    const estatisticas = calcularEstatisticasTags();
    statsContainer.innerHTML = `
        <div class="stat-item">
            <strong>Total de tags:</strong> ${tags.length}
        </div>
        <div class="stat-item">
            <strong>Tags mais usadas:</strong>
            ${estatisticas.top3.map(tag => `<br>• ${tag.nome} (${tag.uso}×)`).join('')}
        </div>
        <div class="stat-item">
            <strong>Rondas com tags:</strong> ${estatisticas.rondasComTags} / ${rondas.length}
        </div>
        <div class="stat-item">
            <strong>Média de tags por ronda:</strong> ${estatisticas.mediaPorRonda.toFixed(1)}
        </div>
    `;
}

function contarUsoTag(tag) {
    return rondas.filter(r => r.tags.includes(tag)).length;
}

function calcularEstatisticasTags() {
    const uso = {};
    
    // Contar uso de cada tag
    tags.forEach(tag => {
        uso[tag] = contarUsoTag(tag);
    });
    
    // Encontrar top 3
    const top3 = Object.entries(uso)
        .map(([nome, uso]) => ({ nome, uso }))
        .sort((a, b) => b.uso - a.uso)
        .slice(0, 3);
    
    // Rondas com pelo menos uma tag
    const rondasComTags = rondas.filter(r => r.tags.length > 0).length;
    
    // Média de tags por ronda
    const totalTags = rondas.reduce((sum, r) => sum + r.tags.length, 0);
    const mediaPorRonda = rondas.length > 0 ? totalTags / rondas.length : 0;
    
    return {
        top3,
        rondasComTags,
        mediaPorRonda
    };
}

// Criar nova tag
document.getElementById('btn-criar-tag')?.addEventListener('click', function() {
    const input = document.getElementById('nova-tag');
    const novaTag = input.value.trim().toLowerCase();
    
    if (!novaTag) {
        alert('Digite um nome para a tag!');
        return;
    }
    
    if (tags.includes(novaTag)) {
        alert('Esta tag já existe!');
        return;
    }
    
    tags.push(novaTag);
    localStorage.setItem('tags', JSON.stringify(tags));
    
    input.value = '';
    carregarTags();
    
    // Atualizar filtros na página de busca
    if (typeof atualizarFiltros === 'function') {
        atualizarFiltros();
    }
});

// Remover tag do sistema
function removerTagSistema(tag) {
    if (confirm(`Remover a tag "${tag}"? Isso não removerá as tags das rondas existentes.`)) {
        const index = tags.indexOf(tag);
        if (index !== -1) {
            tags.splice(index, 1);
            localStorage.setItem('tags', JSON.stringify(tags));
            carregarTags();
            
            // Atualizar filtros
            if (typeof atualizarFiltros === 'function') {
                atualizarFiltros();
            }
        }
    }
}

// Permitir Enter para criar tag
document.getElementById('nova-tag')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('btn-criar-tag').click();
    }
});