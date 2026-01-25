// Dashboard e gráficos

function atualizarDashboard() {
    if (!document.getElementById('dashboard-section').style.display !== 'none') return;
    
    // Estatísticas básicas
    document.getElementById('total-rondas').textContent = rondas.length;
    
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    const rondasEsteMes = rondas.filter(r => {
        const data = new Date(r.dataCompleta);
        return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
    });
    
    document.getElementById('rondas-mes').textContent = rondasEsteMes.length;
    
    // Setores únicos
    const setoresUnicos = [...new Set(rondas.map(r => r.setor))];
    document.getElementById('setores-ativos').textContent = setoresUnicos.length;
    
    // Taxa de problemas
    const problemas = rondas.filter(r => r.status === 'problemas').length;
    const taxa = rondas.length > 0 ? Math.round((problemas / rondas.length) * 100) : 0;
    document.getElementById('taxa-problemas').textContent = `${taxa}%`;
    
    // Atualizar gráficos
    atualizarGraficoSetores();
    atualizarGraficoStatus();
}

function atualizarGraficoSetores() {
    const ctx = document.getElementById('chart-setores')?.getContext('2d');
    if (!ctx) return;
    
    // Contar rondas por setor
    const contador = {};
    rondas.forEach(r => {
        contador[r.setor] = (contador[r.setor] || 0) + 1;
    });
    
    const setores = Object.keys(contador);
    const quantidades = Object.values(contador);
    
    // Cores dinâmicas
    const cores = setores.map((_, i) => {
        const hue = (i * 137) % 360; // Golden angle para cores distintas
        return `hsl(${hue}, 70%, 60%)`;
    });
    
    if (window.chartSetores) {
        window.chartSetores.destroy();
    }
    
    window.chartSetores = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: setores,
            datasets: [{
                data: quantidades,
                backgroundColor: cores,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function atualizarGraficoStatus() {
    const ctx = document.getElementById('chart-status')?.getContext('2d');
    if (!ctx) return;
    
    // Últimos 30 dias
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
    
    const rondasRecentes = rondas.filter(r => 
        new Date(r.dataCompleta) >= trintaDiasAtras
    );
    
    // Agrupar por dia e status
    const dadosPorDia = {};
    const hoje = new Date();
    
    for (let i = 29; i >= 0; i--) {
        const data = new Date(hoje);
        data.setDate(data.getDate() - i);
        const dataStr = data.toISOString().split('T')[0];
        dadosPorDia[dataStr] = { ok: 0, ajustes: 0, problemas: 0 };
    }
    
    rondasRecentes.forEach(ronda => {
        if (dadosPorDia[ronda.data]) {
            dadosPorDia[ronda.data][ronda.status] += 1;
        }
    });
    
    const dias = Object.keys(dadosPorDia);
    const dadosOK = dias.map(dia => dadosPorDia[dia].ok);
    const dadosAjustes = dias.map(dia => dadosPorDia[dia].ajustes);
    const dadosProblemas = dias.map(dia => dadosPorDia[dia].problemas);
    
    if (window.chartStatus) {
        window.chartStatus.destroy();
    }
    
    window.chartStatus = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dias.map(dia => new Date(dia).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })),
            datasets: [
                {
                    label: '✅ OK',
                    data: dadosOK,
                    backgroundColor: 'rgba(39, 174, 96, 0.7)',
                    borderColor: 'rgba(39, 174, 96, 1)',
                    borderWidth: 1
                },
                {
                    label: '⚠️ Ajustes',
                    data: dadosAjustes,
                    backgroundColor: 'rgba(243, 156, 18, 0.7)',
                    borderColor: 'rgba(243, 156, 18, 1)',
                    borderWidth: 1
                },
                {
                    label: '❌ Problemas',
                    data: dadosProblemas,
                    backgroundColor: 'rgba(231, 76, 60, 0.7)',
                    borderColor: 'rgba(231, 76, 60, 1)',
                    borderWidth: 1
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
            },
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
}