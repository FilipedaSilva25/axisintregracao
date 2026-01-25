/* ============================================
   API DE WHATSAPP - SISTEMA DE NOTIFICAÇÕES
   ============================================ */

class WhatsAppAPI {
    constructor() {
        this.apiUrl = 'https://api.whatsapp.com/send';
        this.telefoneTecnico = '+5548998328507'; // +55 (48) 99832-8507
        this.webhookUrl = null; // Pode ser configurado para usar webhook
    }

    /**
     * Envia notificação via WhatsApp usando API
     * Tenta múltiplos métodos para garantir entrega
     */
    async enviarNotificacao(mensagem, dados = {}) {
        try {
            // Método 1: Tentar usar webhook se configurado
            if (this.webhookUrl) {
                return await this.enviarViaWebhook(mensagem, dados);
            }

            // Método 2: Usar API do WhatsApp Business (se disponível)
            // Para produção, você precisaria configurar uma API real
            const resultado = await this.enviarViaAPI(mensagem, dados);
            
            if (resultado.success) {
                return resultado;
            }

            // Método 3: Fallback - usar link direto do WhatsApp
            return this.enviarViaLinkDireto(mensagem);

        } catch (error) {
            console.error('❌ Erro ao enviar notificação WhatsApp:', error);
            // Fallback final
            return this.enviarViaLinkDireto(mensagem);
        }
    }

    /**
     * Envia via Webhook (configurar seu webhook aqui)
     */
    async enviarViaWebhook(mensagem, dados) {
        if (!this.webhookUrl) {
            throw new Error('Webhook não configurado');
        }

        try {
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: this.telefoneTecnico,
                    message: mensagem,
                    data: dados,
                    timestamp: new Date().toISOString()
                })
            });

            if (response.ok) {
                return { success: true, method: 'webhook' };
            }
        } catch (error) {
            console.warn('Webhook falhou, usando método alternativo');
        }

        return { success: false };
    }

    /**
     * Envia via API do WhatsApp Business
     * NOTA: Para usar isso, você precisa:
     * 1. Ter uma conta WhatsApp Business API
     * 2. Configurar token de acesso
     * 3. Ter um servidor backend
     */
    async enviarViaAPI(mensagem, dados) {
        // Esta é uma estrutura para integração futura
        // Por enquanto, retorna false para usar fallback
        return { success: false };
    }

    /**
     * Envia via link direto do WhatsApp (método mais confiável sem API)
     * Abre WhatsApp Web com mensagem pré-formatada AUTOMATICAMENTE
     */
    enviarViaLinkDireto(mensagem) {
        const numeroLimpo = this.telefoneTecnico.replace(/\D/g, '');
        const mensagemCodificada = encodeURIComponent(mensagem);
        const whatsappUrl = `https://wa.me/${numeroLimpo}?text=${mensagemCodificada}`;

        // Método 1: Tentar abrir em nova aba (mais confiável)
        try {
            const novaJanela = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
            if (novaJanela) {
                novaJanela.focus();
                console.log('✅ WhatsApp aberto em nova janela para o técnico');
                return { 
                    success: true, 
                    method: 'link_direto',
                    url: whatsappUrl 
                };
            }
        } catch (error) {
            console.warn('⚠️ Popup bloqueado, tentando método alternativo:', error);
        }

        // Método 2: Criar link invisível e clicar (fallback)
        const link = document.createElement('a');
        link.href = whatsappUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
            if (link.parentNode) {
                link.parentNode.removeChild(link);
            }
        }, 100);

        return { 
            success: true, 
            method: 'link_direto',
            url: whatsappUrl 
        };
    }

    /**
     * Envia notificação de ticket criado
     */
    async notificarTicketCriado(ticket) {
        const mensagem = this.formatarMensagemTicket(ticket);
        return await this.enviarNotificacao(mensagem, { tipo: 'ticket', ticketId: ticket.id });
    }

    /**
     * Formata mensagem do ticket
     */
    formatarMensagemTicket(ticket) {
        return `🚨 *NOVO TICKET CRIADO - AXIS*

*ID:* ${ticket.id}
*Título:* ${ticket.titulo}
*Categoria:* ${this.getCategoriaNome(ticket.categoria)}
*Prioridade:* ${this.getPrioridadeNome(ticket.prioridade)}
*Usuário:* ${ticket.usuario}

*Descrição:*
${ticket.descricao}

_Data: ${this.formatarData(ticket.dataCriacao)}_

👉 *Acesse o sistema para responder*`;
    }

    getCategoriaNome(categoria) {
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

    getPrioridadeNome(prioridade) {
        const prioridades = {
            'baixa': 'Baixa',
            'media': 'Média',
            'alta': 'Alta',
            'critica': 'Crítica'
        };
        return prioridades[prioridade] || prioridade;
    }

    formatarData(dataISO) {
        const data = new Date(dataISO);
        return data.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Configurar webhook (para uso futuro)
     */
    configurarWebhook(url) {
        this.webhookUrl = url;
        localStorage.setItem('whatsapp_webhook_url', url);
    }
}

// Instância global
window.whatsappAPI = new WhatsAppAPI();
