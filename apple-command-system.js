/* ============================================
   SISTEMA DE COMANDOS ESTILO APPLE SPOTLIGHT
   ============================================ */

class CommandBar {
    constructor() {
        this.element = null;
        this.input = null;
        this.suggestions = null;
        this.comandosDisponiveis = [];
        this.historico = [];
        this.indiceHistorico = -1;
        
        this.inicializar();
    }
    
    inicializar() {
        this.criarHTML();
        this.preencherComandos();
        this.configurarEventos();
    }
    
    criarHTML() {
        const commandBarHTML = `
            <div class="command-bar" id="command-bar" style="display: none;">
                <div class="command-bar-overlay" onclick="window.commandBar.toggle()"></div>
                <div class="command-bar-modal">
                    <div class="command-bar-header">
                        <i class="fas fa-search"></i>
                        <input type="text" 
                               class="command-input" 
                               id="command-input"
                               placeholder="Digite um comando ou pesquise...">
                        <button class="command-close" onclick="window.commandBar.toggle()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="command-suggestions" id="command-suggestions">
                        <!-- Sugestões aparecem aqui -->
                    </div>
                    <div class="command-footer">
                        <span class="command-hint">Pressione <kbd>Esc</kbd> para fechar</span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', commandBarHTML);
        
        this.element = document.getElementById('command-bar');
        this.input = document.getElementById('command-input');
        this.suggestions = document.getElementById('command-suggestions');
    }
    
    preencherComandos() {
        this.comandosDisponiveis = [
            // Navegação
            { nome: 'Ir para Dashboard', categoria: 'Navegação', atalho: 'Ctrl+D', acao: () => showSection('dashboard') },
            { nome: 'Ir para Notas Fiscais', categoria: 'Navegação', atalho: 'Ctrl+N', acao: () => showSection('notas') },
            { nome: 'Ir para Relatórios', categoria: 'Navegação', atalho: 'Ctrl+R', acao: () => showSection('relatorios') },
            { nome: 'Voltar para Home', categoria: 'Navegação', atalho: 'Ctrl+H', acao: () => voltarParaHome() },
            
            // Clientes
            { nome: 'Novo Cliente', categoria: 'Cliente', atalho: 'Ctrl+Shift+N', acao: () => abrirModalNovoCliente() },
            { nome: 'Buscar Cliente', categoria: 'Cliente', atalho: 'Ctrl+F', acao: () => focarBusca() },
            { nome: 'Listar Todos Clientes', categoria: 'Cliente', acao: () => mostrarTodosClientes() },
            
            // Meses
            { nome: 'Ir para Janeiro', categoria: 'Mês', acao: () => navegarParaMes('janeiro') },
            { nome: 'Ir para Fevereiro', categoria: 'Mês', acao: () => navegarParaMes('fevereiro') },
            { nome: 'Ir para Março', categoria: 'Mês', acao: () => navegarParaMes('março') },
            { nome: 'Ir para Abril', categoria: 'Mês', acao: () => navegarParaMes('abril') },
            { nome: 'Ir para Maio', categoria: 'Mês', acao: () => navegarParaMes('maio') },
            { nome: 'Ir para Junho', categoria: 'Mês', acao: () => navegarParaMes('junho') },
            { nome: 'Ir para Julho', categoria: 'Mês', acao: () => navegarParaMes('julho') },
            { nome: 'Ir para Agosto', categoria: 'Mês', acao: () => navegarParaMes('agosto') },
            { nome: 'Ir para Setembro', categoria: 'Mês', acao: () => navegarParaMes('setembro') },
            { nome: 'Ir para Outubro', categoria: 'Mês', acao: () => navegarParaMes('outubro') },
            { nome: 'Ir para Novembro', categoria: 'Mês', acao: () => navegarParaMes('novembro') },
            { nome: 'Ir para Dezembro', categoria: 'Mês', acao: () => navegarParaMes('dezembro') },
            
            // Notas Fiscais
            { nome: 'Nova Nota Fiscal', categoria: 'Nota Fiscal', atalho: 'Ctrl+Shift+F', acao: () => {
                if (typeof abrirUploadApple === 'function') {
                    abrirUploadApple();
                } else if (typeof abrirUpload === 'function') {
                    abrirUpload();
                } else {
                    mostrarModalUpload();
                }
            }},
            { nome: 'Exportar Notas', categoria: 'Nota Fiscal', acao: () => exportarNotas() },
            { nome: 'Importar XML', categoria: 'Nota Fiscal', acao: () => abrirImportacaoXML() },
            
            // Filtros
            { nome: 'Mostrar Pendentes', categoria: 'Filtro', acao: () => filtrarPorStatus('pendente') },
            { nome: 'Mostrar Pagos', categoria: 'Filtro', acao: () => filtrarPorStatus('pago') },
            { nome: 'Mostrar Vencidos', categoria: 'Filtro', acao: () => filtrarPorStatus('vencido') },
            { nome: 'Limpar Filtros', categoria: 'Filtro', acao: () => limparFiltros() },
            
            // Relatórios
            { nome: 'Gerar Relatório Mensal', categoria: 'Relatório', acao: () => gerarRelatorioMensal() },
            { nome: 'Gerar Relatório Anual', categoria: 'Relatório', acao: () => gerarRelatorioAnual() },
            { nome: 'Exportar PDF', categoria: 'Relatório', acao: () => exportarParaPDF() },
            { nome: 'Exportar Excel', categoria: 'Relatório', acao: () => exportarParaExcel() },
            
            // Visualização
            { nome: 'Alternar Visualização', categoria: 'Visualização', atalho: 'Ctrl+V', acao: () => toggleView() },
            { nome: 'Modo Escuro', categoria: 'Visualização', acao: () => toggleTheme() },
            
            // Utilitários
            { nome: 'Recarregar Página', categoria: 'Utilitário', atalho: 'Ctrl+R', acao: () => location.reload() },
            { nome: 'Limpar Cache', categoria: 'Utilitário', acao: () => limparCacheLocal() },
            { nome: 'Fazer Backup', categoria: 'Utilitário', acao: () => fazerBackup() },
            { nome: 'Restaurar Backup', categoria: 'Utilitário', acao: () => restaurarBackup() }
        ];
    }
    
    configurarEventos() {
        // Atalho: Cmd/Ctrl + K
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.toggle();
            }
        });
        
        // Input de busca
        if (this.input) {
            this.input.addEventListener('input', (e) => {
                this.atualizarSugestoes(e.target.value);
            });
            
            this.input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.executarComandoSelecionado();
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.navegarSugestoes(1);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.navegarSugestoes(-1);
                } else if (e.key === 'Escape') {
                    this.toggle();
                }
            });
        }
    }
    
    toggle() {
        if (!this.element) return;
        
        const isVisible = this.element.style.display !== 'none';
        this.element.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            setTimeout(() => {
                if (this.input) {
                    this.input.focus();
                    this.atualizarSugestoes('');
                }
            }, 100);
        }
    }
    
    atualizarSugestoes(termo) {
        if (!this.suggestions) return;
        
        const termoLower = termo.toLowerCase().trim();
        let filtrado = this.comandosDisponiveis;
        
        if (termoLower) {
            filtrado = this.comandosDisponiveis.filter(cmd =>
                cmd.nome.toLowerCase().includes(termoLower) ||
                cmd.categoria.toLowerCase().includes(termoLower) ||
                (cmd.atalho && cmd.atalho.toLowerCase().includes(termoLower))
            );
        }
        
        // Agrupar por categoria
        const agrupado = {};
        filtrado.forEach(cmd => {
            if (!agrupado[cmd.categoria]) {
                agrupado[cmd.categoria] = [];
            }
            agrupado[cmd.categoria].push(cmd);
        });
        
        let html = '';
        Object.keys(agrupado).sort().forEach(categoria => {
            html += `<div class="command-category">${categoria}</div>`;
            agrupado[categoria].forEach((cmd, index) => {
                html += `
                    <div class="command-suggestion ${index === 0 ? 'selected' : ''}" 
                         data-command="${cmd.nome}"
                         onclick="window.commandBar.executarComando('${cmd.nome}')">
                        <div class="command-suggestion-content">
                            <span class="command-name">${this.destacarTermo(cmd.nome, termoLower)}</span>
                            ${cmd.atalho ? `<span class="command-shortcut">${cmd.atalho}</span>` : ''}
                        </div>
                    </div>
                `;
            });
        });
        
        if (html === '') {
            html = '<div class="command-empty">Nenhum comando encontrado</div>';
        }
        
        this.suggestions.innerHTML = html;
    }
    
    destacarTermo(texto, termo) {
        if (!termo) return texto;
        const regex = new RegExp(`(${termo})`, 'gi');
        return texto.replace(regex, '<mark>$1</mark>');
    }
    
    navegarSugestoes(direcao) {
        const items = this.suggestions.querySelectorAll('.command-suggestion');
        const selected = this.suggestions.querySelector('.command-suggestion.selected');
        
        if (items.length === 0) return;
        
        let index = selected ? Array.from(items).indexOf(selected) : -1;
        index += direcao;
        
        if (index < 0) index = items.length - 1;
        if (index >= items.length) index = 0;
        
        items.forEach(item => item.classList.remove('selected'));
        items[index].classList.add('selected');
        items[index].scrollIntoView({ block: 'nearest' });
    }
    
    executarComandoSelecionado() {
        const selected = this.suggestions.querySelector('.command-suggestion.selected');
        if (selected) {
            const nomeComando = selected.dataset.command;
            this.executarComando(nomeComando);
        }
    }
    
    executarComando(nomeComando) {
        const comando = this.comandosDisponiveis.find(cmd => cmd.nome === nomeComando);
        if (comando && comando.acao) {
            this.toggle();
            comando.acao();
            this.adicionarHistorico(nomeComando);
        }
    }
    
    adicionarHistorico(comando) {
        this.historico.push(comando);
        if (this.historico.length > 50) {
            this.historico.shift();
        }
        this.indiceHistorico = this.historico.length;
    }
}

// Funções auxiliares para comandos
function abrirModalNovoCliente() {
    showToast('Funcionalidade de novo cliente em desenvolvimento', 'info');
}

function focarBusca() {
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
        searchInput.focus();
    } else {
        showToast('Campo de busca não encontrado', 'warning');
    }
}

function mostrarTodosClientes() {
    voltarClientes();
}

function navegarParaMes(mesNome) {
    const meses = {
        'janeiro': 1, 'fevereiro': 2, 'março': 3, 'abril': 4,
        'maio': 5, 'junho': 6, 'julho': 7, 'agosto': 8,
        'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12
    };
    
    if (clienteSelecionado && meses[mesNome.toLowerCase()]) {
        const mesNumero = meses[mesNome.toLowerCase()];
        selecionarMes(mesNome, mesNumero, clienteSelecionado);
    } else {
        showToast('Selecione um cliente primeiro', 'warning');
    }
}

function exportarNotas() {
    showToast('Exportando notas fiscais...', 'info');
}

function filtrarPorStatus(status) {
    showToast(`Filtrando por: ${status}`, 'info');
}

function limparFiltros() {
    voltarClientes();
    showToast('Filtros limpos', 'success');
}

function gerarRelatorioMensal() {
    showToast('Gerando relatório mensal...', 'info');
}

function gerarRelatorioAnual() {
    showToast('Gerando relatório anual...', 'info');
}

function exportarParaPDF() {
    showToast('Exportando para PDF...', 'info');
}

function exportarParaExcel() {
    showToast('Exportando para Excel...', 'info');
}

function limparCacheLocal() {
    if (confirm('Tem certeza que deseja limpar o cache local?')) {
        localStorage.removeItem('axis_documents_data');
        showToast('Cache limpo com sucesso', 'success');
        setTimeout(() => location.reload(), 1000);
    }
}

function fazerBackup() {
    showToast('Fazendo backup...', 'info');
}

function restaurarBackup() {
    showToast('Funcionalidade de restaurar backup em desenvolvimento', 'info');
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    window.commandBar = new CommandBar();
});
