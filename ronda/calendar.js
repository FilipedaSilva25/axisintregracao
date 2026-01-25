// Calendário de Rondas

let calendar = null;

function inicializarCalendario() {
    if (calendar) {
        calendar.destroy();
    }
    
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;
    
    // Converter rondas para eventos do calendário
    const eventos = rondas.map(ronda => {
        const data = new Date(ronda.dataCompleta);
        const cor = ronda.status === 'ok' ? '#27ae60' : 
                    ronda.status === 'ajustes' ? '#f39c12' : '#e74c3c';
        
        return {
            title: `${ronda.setor} - ${ronda.status === 'ok' ? '✅' : ronda.status === 'ajustes' ? '⚠️' : '❌'}`,
            start: data,
            end: new Date(data.getTime() + 30 * 60000), // 30 minutos
            color: cor,
            textColor: '#fff',
            extendedProps: {
                rondaId: ronda.id,
                setor: ronda.setor,
                status: ronda.status,
                relatorio: ronda.relatorio.substring(0, 100) + '...'
            }
        };
    });
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
        },
        locale: 'pt-br',
        events: eventos,
        eventClick: function(info) {
            const ronda = rondas.find(r => r.id === info.event.extendedProps.rondaId);
            if (ronda) {
                mostrarDetalhesRonda(ronda);
            }
        },
        datesSet: function(info) {
            atualizarEstatisticasPeriodo(info.start, info.end);
        }
    });
    
    calendar.render();
    
    // Controles do calendário
    document.getElementById('btn-hoje').addEventListener('click', () => calendar.today());
    document.getElementById('btn-mes-anterior').addEventListener('click', () => calendar.prev());
    document.getElementById('btn-proximo-mes').addEventListener('click', () => calendar.next());
    document.getElementById('select-visualizacao').addEventListener('change', function() {
        calendar.changeView(this.value);
    });
}

function atualizarEstatisticasPeriodo(inicio, fim) {
    const rondasPeriodo = rondas.filter(r => {
        const dataRonda = new Date(r.dataCompleta);
        return dataRonda >= inicio && dataRonda <= fim;
    });
    
    // Adicionar estatísticas ao calendário
    const stats = document.createElement('div');
    stats.className = 'calendar-stats';
    stats.innerHTML = `
        <strong>Período selecionado:</strong>
        ${inicio.toLocaleDateString('pt-BR')} a ${fim.toLocaleDateString('pt-BR')}
        • ${rondasPeriodo.length} rondas
        • ${[...new Set(rondasPeriodo.map(r => r.setor))].length} setores
    `;
    
    // Remover estatísticas anteriores
    const oldStats = document.querySelector('.calendar-stats');
    if (oldStats) oldStats.remove();
    
    document.querySelector('.calendar-controls').appendChild(stats);
}

function mostrarDetalhesRonda(ronda) {
    const modalHTML = `
        <div class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h3>📋 Detalhes da Ronda</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="info-grid">
                        <div><strong>Data:</strong> ${ronda.data}</div>
                        <div><strong>Hora:</strong> ${ronda.hora}</div>
                        <div><strong>Setor:</strong> ${ronda.setor}</div>
                        <div><strong>Status:</strong> ${formatarStatusTexto(ronda.status)}</div>
                    </div>
                    <div class="modal-section">
                        <h4>Relatório:</h4>
                        <div class="relatorio-modal">${ronda.relatorio}</div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn-pdf" onclick="gerarPDF(${JSON.stringify(ronda).replace(/"/g, '&quot;')})">
                            📄 Baixar PDF
                        </button>
                        <button class="btn-fechar-modal">Fechar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Fechar modal
    document.querySelector('.modal-close').addEventListener('click', fecharModal);
    document.querySelector('.btn-fechar-modal').addEventListener('click', fecharModal);
    document.querySelector('.modal-overlay').addEventListener('click', function(e) {
        if (e.target === this) fecharModal();
    });
}

function fecharModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
}