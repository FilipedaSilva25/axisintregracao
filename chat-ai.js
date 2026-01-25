/* ============================================
   SISTEMA DE IA PARA CHAT DE SUPORTE
   ============================================ */

class ChatAI {
    constructor() {
        this.baseConhecimento = this.inicializarBaseConhecimento();
        this.contexto = [];
    }

    inicializarBaseConhecimento() {
        return {
            // Problemas comuns e soluções
            problemas: {
                'não imprime': {
                    resposta: 'Para resolver problemas de impressão, verifique:\n\n1. ✅ Impressora está ligada e online?\n2. ✅ Há papel no compartimento?\n3. ✅ O toner/ribbon não está esgotado?\n4. ✅ Há erros no painel da impressora?\n5. ✅ A impressora está selecionada corretamente no sistema?\n\nSe o problema persistir, abra um ticket de suporte para assistência técnica.',
                    acao: 'sugerir_ticket'
                },
                'conectar rede': {
                    resposta: 'Para conectar a impressora na rede Wi-Fi:\n\n1. Acesse o menu de configurações no painel\n2. Vá em "Rede" > "Wi-Fi" > "Configurar Wi-Fi"\n3. Selecione sua rede e insira a senha\n4. Aguarde a conexão ser estabelecida\n\nO IP será exibido no painel da impressora.',
                    acao: 'mostrar_guia'
                },
                'configurar': {
                    resposta: 'Para configurar uma impressora pela primeira vez:\n\n1. Conecte à rede elétrica e ligue\n2. Conecte o cabo de rede ou configure Wi-Fi\n3. Acesse o IP no navegador para configurações avançadas\n4. Instale os drivers no computador\n\nConsulte a documentação técnica para mais detalhes.',
                    acao: 'mostrar_documentacao'
                },
                'erro papel': {
                    resposta: 'Para resolver erro de papel:\n\n1. Verifique se há papel no compartimento\n2. Remova papel preso ou dobrado\n3. Ajuste o guia de papel corretamente\n4. Limpe os rolos de alimentação se necessário\n5. Reinicie a impressora',
                    acao: 'sugerir_manutencao'
                },
                'toner': {
                    resposta: 'Para verificar o status do toner:\n\n1. No sistema AXIS, acesse Inventário\n2. Clique em "Ver Detalhes" do equipamento\n3. Veja a seção "Status dos Consumíveis"\n\nVocê também pode verificar diretamente no painel da impressora.',
                    acao: 'mostrar_inventario'
                },
                'ribbon': {
                    resposta: 'Para verificar o status do ribbon:\n\n1. No sistema AXIS, acesse Inventário\n2. Clique em "Ver Detalhes" do equipamento\n3. Veja a seção "Status dos Consumíveis"\n\nO ribbon geralmente precisa ser trocado quando está abaixo de 20%.',
                    acao: 'mostrar_inventario'
                },
                'firmware': {
                    resposta: 'Para atualizar o firmware:\n\n1. Acesse o site da Zebra Technologies\n2. Baixe o firmware mais recente para seu modelo\n3. Conecte a impressora ao computador via USB ou rede\n4. Execute o instalador e siga as instruções\n\n⚠️ Não desligue a impressora durante a atualização!',
                    acao: 'mostrar_documentacao'
                },
                'zt411': {
                    resposta: 'A ZT411 é uma impressora industrial da Zebra. Características:\n\n• Impressão térmica de transferência\n• Resolução: 203 ou 300 dpi\n• Velocidade: até 6 polegadas/segundo\n• Conectividade: Ethernet, USB, Serial\n\nConsulte o manual completo na seção de Documentação.',
                    acao: 'mostrar_manual_zt411'
                },
                'zd421': {
                    resposta: 'A ZD421 é uma impressora desktop da Zebra. Características:\n\n• Impressão térmica de transferência\n• Resolução: 203 dpi\n• Velocidade: até 6 polegadas/segundo\n• Conectividade: Wi-Fi, Bluetooth, USB\n\nConsulte o manual completo na seção de Documentação.',
                    acao: 'mostrar_manual_zd421'
                },
                'zq630': {
                    resposta: 'A ZQ630 é uma impressora pagewide da Zebra. Características:\n\n• Impressão térmica de transferência\n• Resolução: 300 dpi\n• Velocidade: até 8 polegadas/segundo\n• Conectividade: Ethernet, Wi-Fi, USB\n\nConsulte o manual completo na seção de Documentação.',
                    acao: 'mostrar_manual_zq630'
                }
            },
            
            // Saudações
            saudacoes: [
                'Olá! Como posso ajudá-lo hoje?',
                'Oi! Em que posso ajudar?',
                'Olá! Estou aqui para ajudar com o sistema AXIS.',
                'Bem-vindo! Como posso ajudar você?'
            ],
            
            // Despedidas
            despedidas: [
                'Fico feliz em ajudar! Se precisar de mais alguma coisa, estou aqui.',
                'De nada! Qualquer dúvida, pode me chamar.',
                'Por nada! Estou sempre disponível para ajudar.',
                'Foi um prazer ajudar! Até logo!'
            ]
        };
    }

    /**
     * Processa mensagem do usuário e retorna resposta da IA
     */
    processarMensagem(mensagemUsuario) {
        const mensagem = mensagemUsuario.toLowerCase().trim();
        
        // Adicionar ao contexto
        this.contexto.push({
            tipo: 'usuario',
            mensagem: mensagemUsuario,
            timestamp: new Date().toISOString()
        });

        // Verificar se é saudação
        if (this.isSaudacao(mensagem)) {
            return this.responderSaudacao();
        }

        // Verificar se é despedida
        if (this.isDespedida(mensagem)) {
            return this.responderDespedida();
        }

        // Buscar na base de conhecimento
        const resposta = this.buscarResposta(mensagem);
        
        if (resposta) {
            this.contexto.push({
                tipo: 'ia',
                mensagem: resposta.texto,
                acao: resposta.acao,
                timestamp: new Date().toISOString()
            });
            return resposta;
        }

        // Resposta genérica se não encontrar
        return this.responderGenerico(mensagem);
    }

    isSaudacao(mensagem) {
        const saudacoes = ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hello', 'hi', 'e aí'];
        return saudacoes.some(s => mensagem.includes(s));
    }

    isDespedida(mensagem) {
        const despedidas = ['obrigado', 'obrigada', 'valeu', 'tchau', 'até', 'bye', 'fim'];
        return despedidas.some(d => mensagem.includes(d));
    }

    buscarResposta(mensagem) {
        // Buscar por palavras-chave nos problemas conhecidos
        for (const [palavraChave, solucao] of Object.entries(this.baseConhecimento.problemas)) {
            if (mensagem.includes(palavraChave)) {
                return {
                    texto: solucao.resposta,
                    acao: solucao.acao,
                    confianca: 0.9
                };
            }
        }

        // Buscar por modelo de impressora
        const modelos = ['zt411', 'zd421', 'zq630'];
        for (const modelo of modelos) {
            if (mensagem.includes(modelo)) {
                const solucao = this.baseConhecimento.problemas[modelo];
                if (solucao) {
                    return {
                        texto: solucao.resposta,
                        acao: solucao.acao,
                        confianca: 0.9
                    };
                }
            }
        }

        return null;
    }

    responderSaudacao() {
        const saudacoes = this.baseConhecimento.saudacoes;
        const saudacao = saudacoes[Math.floor(Math.random() * saudacoes.length)];
        
        return {
            texto: saudacao + '\n\nPosso ajudar com:\n• Problemas de impressão\n• Configuração de impressoras\n• Status de consumíveis\n• Documentação técnica\n• E muito mais!',
            acao: null,
            confianca: 1.0
        };
    }

    responderDespedida() {
        const despedidas = this.baseConhecimento.despedidas;
        const despedida = despedidas[Math.floor(Math.random() * despedidas.length)];
        
        return {
            texto: despedida,
            acao: null,
            confianca: 1.0
        };
    }

    responderGenerico(mensagem) {
        // Respostas inteligentes baseadas em contexto
        const respostas = [
            'Entendo sua dúvida. Deixe-me verificar na base de conhecimento...',
            'Essa é uma questão interessante. Vou consultar nossa documentação.',
            'Compreendo. Pode descrever melhor o problema?',
            'Vou ajudar você com isso. Pode me dar mais detalhes?',
            'Deixe-me pensar sobre isso... Pode ser mais específico?'
        ];

        // Se a mensagem contém palavras relacionadas a problema
        if (mensagem.includes('problema') || mensagem.includes('erro') || mensagem.includes('não funciona')) {
            return {
                texto: 'Entendo que você está com um problema. Para te ajudar melhor:\n\n1. Qual modelo de impressora? (ZT411, ZD421 ou ZQ630)\n2. Qual é o problema específico?\n3. Quando começou a acontecer?\n\nCom essas informações, posso te orientar melhor ou abrir um ticket de suporte.',
                acao: 'sugerir_ticket',
                confianca: 0.7
            };
        }

        // Se menciona ajuda ou suporte
        if (mensagem.includes('ajuda') || mensagem.includes('suporte') || mensagem.includes('assistência')) {
            return {
                texto: 'Estou aqui para ajudar! Posso:\n\n✅ Responder perguntas técnicas\n✅ Orientar sobre configurações\n✅ Sugerir soluções para problemas\n✅ Direcionar para documentação\n✅ Abrir ticket de suporte se necessário\n\nO que você precisa?',
                acao: null,
                confianca: 0.8
            };
        }

        // Resposta padrão
        const resposta = respostas[Math.floor(Math.random() * respostas.length)];
        return {
            texto: resposta + '\n\n💡 Dica: Você pode me perguntar sobre:\n• Problemas de impressão\n• Configuração de rede\n• Status de consumíveis\n• Manuais e documentação\n• Ou abrir um ticket de suporte',
            acao: 'sugerir_opcoes',
            confianca: 0.5
        };
    }

    /**
     * Executa ação sugerida pela IA
     */
    executarAcao(acao, dados = {}) {
        switch(acao) {
            case 'sugerir_ticket':
                if (typeof abrirModalNovoTicket === 'function') {
                    setTimeout(() => {
                        if (typeof showToast === 'function') {
                            showToast('Abra um ticket para assistência técnica detalhada', 'info');
                        }
                    }, 1000);
                }
                break;
                
            case 'mostrar_documentacao':
                if (typeof switchTab === 'function') {
                    setTimeout(() => {
                        switchTab('documentacao');
                        if (typeof showToast === 'function') {
                            showToast('Navegando para documentação...', 'info');
                        }
                    }, 1000);
                }
                break;
                
            case 'mostrar_inventario':
                if (typeof navigate === 'function') {
                    setTimeout(() => {
                        navigate('page-inventario');
                        if (typeof showToast === 'function') {
                            showToast('Navegando para inventário...', 'info');
                        }
                    }, 1000);
                }
                break;
                
            case 'mostrar_manual_zt411':
            case 'mostrar_manual_zd421':
            case 'mostrar_manual_zq630':
                if (typeof switchTab === 'function') {
                    setTimeout(() => {
                        switchTab('documentacao');
                        if (typeof showToast === 'function') {
                            showToast('Consulte o manual na seção de documentação', 'info');
                        }
                    }, 1000);
                }
                break;
        }
    }
}

// Instância global
window.chatAI = new ChatAI();
