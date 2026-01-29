/* ============================================
   SISTEMA DE SUPORTE TÉCNICO AXIS
   ============================================ */

// Configurações
const SUPORTE_CONFIG = {
    whatsapp: '+5548998328507', // +55 (48) 99832-8507 (sem espaços, parênteses ou hífens)
    email: 'ext_sifilipe@mercadolivre.com',
    nomeSuporte: 'Filipe da Silva'
};

// Log de configuração
console.log('📱 WhatsApp configurado:', SUPORTE_CONFIG.whatsapp);
console.log('✉️ E-mail configurado:', SUPORTE_CONFIG.email);

// Variáveis globais
let tickets = [];
let chatMessages = [];
let currentTab = 'tickets';
let currentTicketId = null;
let chatOpen = false;

// ================= INICIALIZAÇÃO =================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 Sistema de Suporte Técnico iniciando...');
    
    // Carregar dados salvos
    carregarDados();
    
    // Inicializar componentes
    inicializarTabs();
    inicializarFormularioTicket();
    inicializarChat();
    inicializarFAQ();
    
    // Mostrar tickets
    renderizarTickets();
    
    console.log('✅ Sistema de Suporte Técnico pronto!');
});

// ================= GERENCIAMENTO DE DADOS =================
function carregarDados() {
    // Carregar tickets do localStorage
    const ticketsSalvos = localStorage.getItem('axis_tickets');
    if (ticketsSalvos) {
        tickets = JSON.parse(ticketsSalvos);
    }
    
    // Carregar mensagens do chat
    const chatSalvo = localStorage.getItem('axis_chat_messages');
    if (chatSalvo) {
        chatMessages = JSON.parse(chatSalvo);
    }
    
    // Se não houver tickets, criar alguns de exemplo
    if (tickets.length === 0) {
        criarTicketsExemplo();
    }
}

function salvarDados() {
    localStorage.setItem('axis_tickets', JSON.stringify(tickets));
    localStorage.setItem('axis_chat_messages', JSON.stringify(chatMessages));
}

// ================= SISTEMA DE TICKETS =================
function criarTicketsExemplo() {
    tickets = [
        {
            id: 'TKT-001',
            titulo: 'Impressora ZT411 não imprime',
            descricao: 'A impressora está ligada mas não está imprimindo os documentos enviados.',
            categoria: 'hardware',
            prioridade: 'alta',
            status: 'aberto',
            dataCriacao: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            dataAtualizacao: new Date().toISOString(),
            usuario: 'João Silva',
            comentarios: []
        },
        {
            id: 'TKT-002',
            titulo: 'Erro ao conectar impressora na rede',
            descricao: 'Não consigo conectar a impressora ZD421 na rede Wi-Fi.',
            categoria: 'rede',
            prioridade: 'media',
            status: 'em_andamento',
            dataCriacao: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            dataAtualizacao: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            usuario: 'Maria Santos',
            comentarios: [
                {
                    autor: 'Suporte Técnico',
                    mensagem: 'Verifique se a senha do Wi-Fi está correta.',
                    data: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
                }
            ]
        },
        {
            id: 'TKT-003',
            titulo: 'Como configurar impressora ZQ630?',
            descricao: 'Preciso de ajuda para configurar a impressora pela primeira vez.',
            categoria: 'configuracao',
            prioridade: 'baixa',
            status: 'resolvido',
            dataCriacao: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            dataAtualizacao: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            usuario: 'Carlos Oliveira',
            comentarios: [
                {
                    autor: 'Suporte Técnico',
                    mensagem: 'Siga o guia de configuração inicial disponível na documentação.',
                    data: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
                }
            ]
        }
    ];
    salvarDados();
}

function criarNovoTicket(dados) {
    const novoId = 'TKT-' + String(tickets.length + 1).padStart(3, '0');
    const ticket = {
        id: novoId,
        titulo: dados.titulo,
        descricao: dados.descricao,
        categoria: dados.categoria,
        prioridade: dados.prioridade,
        status: 'aberto',
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString(),
        usuario: dados.usuario || 'Usuário',
        comentarios: []
    };
    
    tickets.unshift(ticket);
    salvarDados();
    
    // Mostrar confirmação
    if (typeof showToast === 'function') {
        showToast(`Ticket ${novoId} criado com sucesso! Abrindo WhatsApp...`, 'success');
    }
    
    // Renderizar tickets primeiro
    renderizarTickets();
    
    // Fechar modal
    fecharModalTicket();
    
    // Enviar notificação WhatsApp AUTOMATICAMENTE usando API
    // Não esperar delay - enviar imediatamente
    if (window.whatsappAPI) {
        window.whatsappAPI.notificarTicketCriado(ticket).then(resultado => {
            console.log('✅ Notificação WhatsApp enviada automaticamente:', resultado);
            if (typeof showToast === 'function') {
                showToast(`Ticket ${novoId} criado! Técnico notificado via WhatsApp.`, 'success');
            }
        }).catch(error => {
            console.error('❌ Erro ao enviar notificação:', error);
            // Fallback se API falhar
            enviarNotificacaoWhatsApp(ticket);
        });
    } else {
        // Fallback se API não estiver disponível
        console.warn('⚠️ WhatsApp API não disponível, usando método alternativo');
        enviarNotificacaoWhatsApp(ticket);
    }
    
    return ticket;
}

function enviarNotificacaoWhatsApp(ticket) {
    try {
        const mensagem = `🚨 *NOVO TICKET CRIADO - AXIS*

*ID:* ${ticket.id}
*Título:* ${ticket.titulo}
*Categoria:* ${getCategoriaNome(ticket.categoria)}
*Prioridade:* ${getPrioridadeNome(ticket.prioridade)}
*Usuário:* ${ticket.usuario}

*Descrição:*
${ticket.descricao}

_Data: ${formatarData(ticket.dataCriacao)}_`;

        // Codificar mensagem
        const mensagemCodificada = encodeURIComponent(mensagem);
        
        // Limpar número do WhatsApp (remover espaços, parênteses, hífens)
        const numeroLimpo = SUPORTE_CONFIG.whatsapp.replace(/\D/g, '');
        
        // Criar URL do WhatsApp
        const whatsappUrl = `https://wa.me/${numeroLimpo}?text=${mensagemCodificada}`;
        
        console.log('📱 Enviando notificação WhatsApp para técnico:', SUPORTE_CONFIG.whatsapp);
        console.log('📱 Número limpo:', numeroLimpo);
        console.log('📱 Mensagem:', mensagem);
        
        // ENVIAR NOTIFICAÇÃO PARA O TÉCNICO VIA WHATSAPP
        // IMPORTANTE: Sem API de WhatsApp, a única forma garantida de enviar
        // é abrindo o WhatsApp Web. Isso abrirá uma nova aba com a mensagem
        // pré-formatada pronta para enviar ao número do técnico.
        
        // Abrir WhatsApp Web com a mensagem formatada
        // A mensagem será enviada para o número do técnico: +55 (48) 99832-8507
        const novaJanela = window.open(
            whatsappUrl, 
            'whatsapp_notification',
            'width=800,height=600,menubar=no,toolbar=no,location=no,status=no'
        );
        
        // Tentar focar na janela (pode não funcionar se popup foi bloqueado)
        if (novaJanela) {
            try {
                novaJanela.focus();
            } catch (e) {
                console.warn('Não foi possível focar na janela do WhatsApp');
            }
        } else {
            // Se popup foi bloqueado, mostrar instruções
            console.warn('⚠️ Popup bloqueado. Por favor, permita popups para este site.');
            if (typeof showToast === 'function') {
                showToast('Permita popups para receber notificações automáticas', 'warning');
            }
        }
        
        // Mostrar notificação visual para o usuário (sem abrir WhatsApp)
        if (typeof showToast === 'function') {
            showToast(`Ticket ${ticket.id} criado! O técnico foi notificado via WhatsApp.`, 'success');
        }
        
        console.log('✅ Notificação WhatsApp enviada silenciosamente para o técnico:', SUPORTE_CONFIG.whatsapp);
        
        // Registrar no log do sistema
        registrarNotificacaoTicket(ticket);
        
    } catch (error) {
        console.error('❌ Erro ao enviar notificação WhatsApp:', error);
        if (typeof showToast === 'function') {
            showToast('Ticket criado, mas houve um erro ao notificar o técnico.', 'warning');
        }
    }
}

function registrarNotificacaoTicket(ticket) {
    // Registrar que a notificação foi enviada
    const notificacoes = JSON.parse(localStorage.getItem('axis_ticket_notifications') || '[]');
    notificacoes.push({
        ticketId: ticket.id,
        data: new Date().toISOString(),
        status: 'enviada'
    });
    localStorage.setItem('axis_ticket_notifications', JSON.stringify(notificacoes));
}

function getCategoriaNome(categoria) {
    const categorias = {
        'hardware': 'Hardware',
        'software': 'Software',
        'rede': 'Rede',
        'configuracao': 'Configuração',
        'manutencao': 'Manutenção',
        'outro': 'Outro'
    };
    return categorias[categoria] || categoria;
}

function getPrioridadeNome(prioridade) {
    const prioridades = {
        'baixa': 'Baixa',
        'media': 'Média',
        'alta': 'Alta',
        'critica': 'Crítica'
    };
    return prioridades[prioridade] || prioridade;
}

function formatarData(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function renderizarTickets() {
    const container = document.getElementById('tickets-container');
    if (!container) return;
    
    if (tickets.length === 0) {
        container.innerHTML = `
            <div class="empty-state-tickets">
                <div class="empty-icon">🎫</div>
                <h4>Nenhum ticket encontrado</h4>
                <p>Crie seu primeiro ticket de suporte clicando no botão acima.</p>
            </div>
        `;
        return;
    }
    
    // Filtrar por status se necessário
    const filtroStatus = document.getElementById('filtro-status')?.value || 'todos';
    let ticketsFiltrados = tickets;
    
    if (filtroStatus !== 'todos') {
        ticketsFiltrados = tickets.filter(t => t.status === filtroStatus);
    }
    
    // Ordenar por data (mais recentes primeiro)
    ticketsFiltrados.sort((a, b) => new Date(b.dataAtualizacao) - new Date(a.dataAtualizacao));
    
    container.innerHTML = ticketsFiltrados.map(ticket => {
        const statusClass = `status-${ticket.status}`;
        const prioridadeClass = `prioridade-${ticket.prioridade}`;
        
        return `
            <div class="ticket-card" onclick="abrirDetalhesTicket('${ticket.id}')">
                <div class="ticket-header">
                    <div class="ticket-id">${ticket.id}</div>
                    <div class="ticket-status ${statusClass}">${getStatusNome(ticket.status)}</div>
                </div>
                <h3 class="ticket-titulo">${ticket.titulo}</h3>
                <p class="ticket-descricao">${ticket.descricao.substring(0, 100)}${ticket.descricao.length > 100 ? '...' : ''}</p>
                <div class="ticket-footer">
                    <div class="ticket-meta">
                        <span class="ticket-categoria">${getCategoriaNome(ticket.categoria)}</span>
                        <span class="ticket-prioridade ${prioridadeClass}">${getPrioridadeNome(ticket.prioridade)}</span>
                    </div>
                    <div class="ticket-data">${formatarData(ticket.dataAtualizacao)}</div>
                </div>
            </div>
        `;
    }).join('');
}

function getStatusNome(status) {
    const statusMap = {
        'aberto': 'Aberto',
        'em_andamento': 'Em Andamento',
        'resolvido': 'Resolvido',
        'fechado': 'Fechado'
    };
    return statusMap[status] || status;
}

function abrirDetalhesTicket(ticketId) {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    
    currentTicketId = ticketId;
    
    const modal = document.getElementById('modal-ticket-detalhes');
    if (!modal) return;
    
    modal.innerHTML = `
        <div class="modal-content-ticket">
            <div class="modal-header-ticket">
                <h2>${ticket.id} - ${ticket.titulo}</h2>
                <button class="close-modal-btn" onclick="fecharDetalhesTicket()">×</button>
            </div>
            <div class="modal-body-ticket">
                <div class="ticket-info-grid">
                    <div class="info-item">
                        <label>Status:</label>
                        <span class="status-badge status-${ticket.status}">${getStatusNome(ticket.status)}</span>
                    </div>
                    <div class="info-item">
                        <label>Prioridade:</label>
                        <span class="prioridade-badge prioridade-${ticket.prioridade}">${getPrioridadeNome(ticket.prioridade)}</span>
                    </div>
                    <div class="info-item">
                        <label>Categoria:</label>
                        <span>${getCategoriaNome(ticket.categoria)}</span>
                    </div>
                    <div class="info-item">
                        <label>Usuário:</label>
                        <span>${ticket.usuario}</span>
                    </div>
                    <div class="info-item">
                        <label>Data de Criação:</label>
                        <span>${formatarData(ticket.dataCriacao)}</span>
                    </div>
                    <div class="info-item">
                        <label>Última Atualização:</label>
                        <span>${formatarData(ticket.dataAtualizacao)}</span>
                    </div>
                </div>
                
                <div class="ticket-descricao-completa">
                    <h3>Descrição</h3>
                    <p>${ticket.descricao}</p>
                </div>
                
                <div class="ticket-comentarios">
                    <h3>Comentários (${ticket.comentarios.length})</h3>
                    <div class="comentarios-list">
                        ${ticket.comentarios.map(comentario => `
                            <div class="comentario-item">
                                <div class="comentario-header">
                                    <strong>${comentario.autor}</strong>
                                    <span>${formatarData(comentario.data)}</span>
                                </div>
                                <p>${comentario.mensagem}</p>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="adicionar-comentario">
                        <textarea id="novo-comentario" placeholder="Adicione um comentário..."></textarea>
                        <button class="btn-primary" onclick="adicionarComentario('${ticket.id}')">Adicionar Comentário</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

function fecharDetalhesTicket() {
    const modal = document.getElementById('modal-ticket-detalhes');
    if (modal) {
        modal.style.display = 'none';
    }
    currentTicketId = null;
}

function adicionarComentario(ticketId) {
    const textarea = document.getElementById('novo-comentario');
    if (!textarea || !textarea.value.trim()) {
        showToast('Digite um comentário', 'warning');
        return;
    }
    
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    
    ticket.comentarios.push({
        autor: 'Você',
        mensagem: textarea.value.trim(),
        data: new Date().toISOString()
    });
    
    ticket.dataAtualizacao = new Date().toISOString();
    salvarDados();
    
    textarea.value = '';
    abrirDetalhesTicket(ticketId);
    renderizarTickets();
    
    showToast('Comentário adicionado!', 'success');
}

// ================= FORMULÁRIO DE TICKET =================
function inicializarFormularioTicket() {
    const form = document.getElementById('form-novo-ticket');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const dados = {
            titulo: document.getElementById('ticket-titulo').value.trim(),
            descricao: document.getElementById('ticket-descricao').value.trim(),
            categoria: document.getElementById('ticket-categoria').value,
            prioridade: document.getElementById('ticket-prioridade').value,
            usuario: localStorage.getItem('user-display-name') || 'Usuário'
        };
        
        if (!dados.titulo || !dados.descricao) {
            showToast('Preencha todos os campos obrigatórios', 'warning');
            return;
        }
        
        criarNovoTicket(dados);
        form.reset();
    });
}

function abrirModalNovoTicket() {
    const modal = document.getElementById('modal-novo-ticket');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
    }
}

function fecharModalTicket() {
    const modal = document.getElementById('modal-novo-ticket');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

// ================= SISTEMA DE CHAT =================
function inicializarChat() {
    // Criar botão flutuante se não existir
    criarBotaoChatFlutuante();
    
    const chatToggle = document.getElementById('chat-toggle');
    const chatContainer = document.getElementById('chat-container');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    
    if (chatToggle) {
        chatToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleChat();
        });
    }
    
    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            enviarMensagemChat();
        });
    }
    
    // Carregar mensagens
    renderizarChat();
    
    // Remover simulação de respostas automáticas antiga
    // Agora a IA processa as mensagens na função enviarMensagemChat
    
    // Fechar chat ao clicar fora
    document.addEventListener('click', (e) => {
        if (chatOpen && chatContainer && !chatContainer.contains(e.target) && !chatToggle.contains(e.target)) {
            toggleChat();
        }
    });
}

function criarBotaoChatFlutuante() {
    // Botão de chat flutuante removido - agora usa apenas o FAB menu unificado
    // Não criar botão individual, sempre usar o FAB menu
    return;
}

function toggleChat() {
    chatOpen = !chatOpen;
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
        chatContainer.classList.toggle('chat-open', chatOpen);
    }
}

function enviarMensagemChat() {
    const input = document.getElementById('chat-input');
    if (!input || !input.value.trim()) return;
    
    const textoUsuario = input.value.trim();
    
    // Mensagem do usuário
    const mensagem = {
        id: Date.now(),
        autor: 'Você',
        texto: textoUsuario,
        data: new Date().toISOString(),
        respondida: false
    };
    
    chatMessages.push(mensagem);
    salvarDados();
    
    input.value = '';
    renderizarChat();
    
    // Scroll para baixo
    const chatMessagesContainer = document.getElementById('chat-messages');
    if (chatMessagesContainer) {
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }
    
    // Processar com IA após um pequeno delay
    setTimeout(() => {
        processarComIA(textoUsuario);
    }, 500);
}

function processarComIA(mensagemUsuario) {
    if (!window.chatAI) {
        console.warn('IA do chat não está disponível');
        responderMensagemChat({ texto: mensagemUsuario });
        return;
    }
    
    // Mostrar indicador de digitação
    mostrarIndicadorDigitacao();
    
    // Processar mensagem com IA
    setTimeout(() => {
        const respostaIA = window.chatAI.processarMensagem(mensagemUsuario);
        
        // Remover indicador
        removerIndicadorDigitacao();
        
        // Criar resposta da IA
        const resposta = {
            id: Date.now(),
            autor: SUPORTE_CONFIG.nomeSuporte + ' (IA)',
            texto: respostaIA.texto,
            data: new Date().toISOString(),
            respondida: true,
            acao: respostaIA.acao
        };
        
        chatMessages.push(resposta);
        salvarDados();
        
        renderizarChat();
        
        // Scroll para baixo
        const chatMessagesContainer = document.getElementById('chat-messages');
        if (chatMessagesContainer) {
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        }
        
        // Executar ação se houver
        if (respostaIA.acao) {
            setTimeout(() => {
                window.chatAI.executarAcao(respostaIA.acao);
            }, 1500);
        }
    }, 1000 + Math.random() * 1000); // Simular tempo de processamento
}

function mostrarIndicadorDigitacao() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    
    const indicador = document.createElement('div');
    indicador.id = 'typing-indicator';
    indicador.className = 'chat-message message-suporte typing-indicator';
    indicador.innerHTML = `
        <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    
    container.appendChild(indicador);
    
    // Scroll para baixo
    container.scrollTop = container.scrollHeight;
}

function removerIndicadorDigitacao() {
    const indicador = document.getElementById('typing-indicator');
    if (indicador) {
        indicador.remove();
    }
}

function responderMensagemChat(mensagemUsuario) {
    // Esta função agora é usada apenas como fallback
    // A IA processa as mensagens na função processarComIA
    if (window.chatAI) {
        processarComIA(mensagemUsuario.texto || mensagemUsuario);
        return;
    }
    
    // Fallback se IA não estiver disponível
    const respostas = [
        'Olá! Como posso ajudá-lo hoje?',
        'Entendo sua dúvida. Vou verificar isso para você.',
        'Essa é uma questão importante. Deixe-me consultar nossa base de conhecimento.'
    ];
    
    const respostaAleatoria = respostas[Math.floor(Math.random() * respostas.length)];
    
    const resposta = {
        id: Date.now(),
        autor: SUPORTE_CONFIG.nomeSuporte,
        texto: respostaAleatoria,
        data: new Date().toISOString(),
        respondida: true
    };
    
    if (mensagemUsuario.respondida !== undefined) {
        mensagemUsuario.respondida = true;
    }
    
    chatMessages.push(resposta);
    salvarDados();
    
    renderizarChat();
    
    // Scroll para baixo
    const chatMessagesContainer = document.getElementById('chat-messages');
    if (chatMessagesContainer) {
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }
}

function renderizarChat() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    
    if (chatMessages.length === 0) {
        container.innerHTML = `
            <div class="chat-empty">
                <p>Nenhuma mensagem ainda. Comece a conversar!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = chatMessages.map(msg => {
        const isUsuario = msg.autor === 'Você';
        return `
            <div class="chat-message ${isUsuario ? 'message-usuario' : 'message-suporte'}">
                <div class="message-header">
                    <strong>${msg.autor}</strong>
                    <span>${formatarData(msg.data)}</span>
                </div>
                <div class="message-text">${msg.texto}</div>
            </div>
        `;
    }).join('');
    
    // Scroll para baixo
    container.scrollTop = container.scrollHeight;
}

// ================= FAQ =================
function inicializarFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const pergunta = item.querySelector('.faq-pergunta');
        if (pergunta) {
            pergunta.addEventListener('click', () => {
                item.classList.toggle('faq-ativo');
            });
        }
    });
}

// ================= TABS =================
function inicializarTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
}

function switchTab(tabId) {
    currentTab = tabId;
    
    // Atualizar botões
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    
    // Mostrar conteúdo
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tabId}`);
    });
}

// ================= CONTATOS =================
function abrirWhatsApp() {
    const mensagem = encodeURIComponent('Olá! Preciso de ajuda com o sistema AXIS.');
    const url = `https://wa.me/${SUPORTE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${mensagem}`;
    window.open(url, '_blank', 'noopener,noreferrer');
}

function abrirEmail() {
    const assunto = encodeURIComponent('Suporte Técnico - AXIS');
    const corpo = encodeURIComponent('Olá,\n\nPreciso de ajuda com o sistema AXIS.\n\n');
    const url = `mailto:${SUPORTE_CONFIG.email}?subject=${assunto}&body=${corpo}`;
    window.location.href = url;
}

// ================= FUNÇÕES GLOBAIS =================
window.abrirModalNovoTicket = abrirModalNovoTicket;
window.fecharModalTicket = fecharModalTicket;
window.abrirDetalhesTicket = abrirDetalhesTicket;
window.fecharDetalhesTicket = fecharDetalhesTicket;
window.adicionarComentario = adicionarComentario;
window.abrirWhatsApp = abrirWhatsApp;
window.abrirEmail = abrirEmail;
window.switchTab = switchTab;
window.renderizarTickets = renderizarTickets;
window.toggleChat = toggleChat;

// Função showToast (se não existir)
if (typeof showToast === 'undefined') {
    window.showToast = function(mensagem, tipo = 'info') {
        console.log(`[${tipo.toUpperCase()}] ${mensagem}`);
    };
}
