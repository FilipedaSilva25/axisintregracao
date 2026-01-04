/* ==========================================================
   SISTEMA DE ALERTAS WHATSAPP - AXIS INTELLIGENCE
   Versão: 1.0
   Autor: Filipe da Silva
   Data: 2024
   ========================================================== */

class WhatsAppAlerts {
    constructor() {
        console.log('🔧 WhatsApp Alerts iniciado...');
        
        // Configurações padrão
        this.config = {
            apiKey: localStorage.getItem('whatsapp_api_key') || '',
            enabled: true,
            soundAlert: true,
            modoTeste: true,
            delayEntreEnvios: 2000
        };
        
        // Carregar configurações
        this.carregarConfiguracoes();
        
        // Inicializar
        this.inicializar();
    }
    
    // 1. INICIALIZAÇÃO DO SISTEMA
    inicializar() {
        console.log('🔄 Inicializando sistema de alertas...');
        
        // Criar botão flutuante
        this.criarBotaoFlutuante();
        
        // Criar badge de notificações
        this.atualizarBadge();
        
        // Verificar logs antigos
        this.limparLogsAntigos();
        
        console.log('✅ Sistema de alertas pronto!');
    }
    
    // 2. CARREGAR CONFIGURAÇÕES
    carregarConfiguracoes() {
        try {
            const saved = localStorage.getItem('whatsapp_config');
            if (saved) {
                this.config = { ...this.config, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('⚠️ Configurações não encontradas, usando padrão');
        }
    }
    
    // 3. SALVAR CONFIGURAÇÕES
    salvarConfiguracoes() {
        localStorage.setItem('whatsapp_config', JSON.stringify(this.config));
    }
    
    // 4. CRIAR BOTÃO FLUTUANTE
    criarBotaoFlutuante() {
        // Verificar se já existe
        if (document.getElementById('whatsapp-float-button')) return;
        
        const botaoHTML = `
            <div id="whatsapp-float-button" class="whatsapp-float">
                <button class="whatsapp-button" title="Alertas WhatsApp">
                    <span class="whatsapp-icon">📱</span>
                    <span class="whatsapp-badge-alert" id="whatsapp-badge-alert">0</span>
                </button>
            </div>
        `;
        
        // Adicionar ao body
        const div = document.createElement('div');
        div.innerHTML = botaoHTML;
        document.body.appendChild(div.firstElementChild);
        
        // Adicionar evento de clique
        document.querySelector('.whatsapp-button').addEventListener('click', (e) => {
            e.preventDefault();
            this.abrirPainelControle();
        });
    }
    
    // 5. ALERTA DE PREVENTIVA CONCLUÍDA
    alertarPreventivaConcluida(dados) {
        if (!this.config.enabled) {
            console.log('⚠️ Alertas desativados');
            return false;
        }
        
        const mensagem = `✅ *PREVENTIVA CONCLUÍDA - AXIS SYSTEM*\n\n` +
                        `📋 *Técnico:* ${dados.tecnico || 'FILIPE DA SILVA'}\n` +
                        `🖨️ *Impressora:* ${dados.modelo || 'ZT411'}\n` +
                        `🔢 *Serial:* ${dados.serial || 'N/D'}\n` +
                        `🏷️ *Patrimônio:* ${dados.selb || 'N/D'}\n` +
                        `📅 *Data:* ${new Date().toLocaleDateString('pt-BR')}\n` +
                        `⏱️ *Hora:* ${new Date().toLocaleTimeString('pt-BR')}\n` +
                        `📊 *Status:* ${dados.status || 'Concluído com sucesso'}\n\n` +
                        `_Sistema AXIS - Mercado Livre_`;
        
        const enviado = this.enviarWhatsApp(mensagem, 'preventiva');
        
        if (enviado) {
            // Registrar log
            this.registrarLog('preventiva_concluida', {
                ...dados,
                mensagem: mensagem,
                timestamp: new Date().toISOString()
            });
            
            // Atualizar badge
            this.atualizarBadge();
            
            // Efeito visual
            this.efeitoConfirmacao();
            
            console.log('✅ Alerta de preventiva enviado!');
        }
        
        return enviado;
    }
    
    // 6. ALERTA DE FALHA CRÍTICA
    alertarFalhaCritica(dados) {
        if (!this.config.enabled) return false;
        
        const mensagem = `🚨 *FALHA CRÍTICA DETECTADA - AXIS ALERT*\n\n` +
                        `⚠️ *URGENTE: Intervenção necessária*\n\n` +
                        `🔧 *Equipamento:* ${dados.tag || 'ZT411-IND-XXX'}\n` +
                        `📍 *Setor:* ${dados.setor || 'Produção Sul'}\n` +
                        `🌐 *IP:* ${dados.ip || '10.15.20.XXX'}\n` +
                        `🔴 *Problema:* ${dados.problema || 'Falha não especificada'}\n` +
                        `📈 *Impacto:* ${dados.impacto || 'Alto - Parada operacional'}\n\n` +
                        `📞 *Técnico responsável:* ${dados.responsavel || 'FILIPE DA SILVA'}\n` +
                        `⏰ *Hora do alerta:* ${new Date().toLocaleTimeString('pt-BR')}\n\n` +
                        `_Ação imediata requerida_`;
        
        const enviado = this.enviarWhatsApp(mensagem, 'critico');
        
        if (enviado) {
            this.registrarLog('falha_critica', {
                ...dados,
                mensagem: mensagem,
                timestamp: new Date().toISOString()
            });
            
            this.atualizarBadge();
            console.log('🚨 Alerta de falha crítica enviado!');
        }
        
        return enviado;
    }
    
    // 7. ENVIAR VIA WHATSAPP (SIMPLES - SEM API)
    enviarWhatsApp(mensagem, tipo = 'preventiva') {
        try {
            // Se estiver em modo teste, apenas simula
            if (this.config.modoTeste) {
                console.log(`📱 [MODO TESTE] WhatsApp para ${tipo}:`);
                console.log(mensagem);
                
                // Mostrar notificação visual
                this.mostrarNotificacaoTeste(tipo, mensagem);
                return true;
            }
            
            // Se não for teste, usa o link direto do WhatsApp
            const mensagemCodificada = encodeURIComponent(mensagem);
            
            // Números padrão (substitua pelos seus)
            const numeros = {
                'critico': ['+5511999999999'],
                'preventiva': ['+5511999999999'],
                'estoque': ['+5511999999999']
            };
            
            const numerosParaEnviar = numeros[tipo] || ['+5511999999999'];
            
            // Para cada número, abrir WhatsApp Web
            numerosParaEnviar.forEach((numero, index) => {
                setTimeout(() => {
                    const url = `https://wa.me/${numero}?text=${mensagemCodificada}`;
                    
                    // Abrir em nova aba
                    window.open(url, '_blank', 'noopener,noreferrer');
                    
                }, index * this.config.delayEntreEnvios);
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao enviar WhatsApp:', error);
            return false;
        }
    }
    
    // 8. REGISTRAR LOG LOCAL
    registrarLog(tipo, dados) {
        const log = {
            id: Date.now(),
            tipo,
            dados,
            timestamp: new Date().toISOString(),
            enviado: true,
            modo: this.config.modoTeste ? 'teste' : 'real'
        };
        
        // Salvar no localStorage
        const logs = JSON.parse(localStorage.getItem('axis_whatsapp_logs') || '[]');
        logs.unshift(log); // Adiciona no início
        
        // Manter apenas últimos 100 logs
        if (logs.length > 100) {
            logs.length = 100;
        }
        
        localStorage.setItem('axis_whatsapp_logs', JSON.stringify(logs));
        
        console.log(`📝 Log registrado: ${tipo}`);
    }
    
    // 9. ATUALIZAR BADGE DE NOTIFICAÇÕES
    atualizarBadge() {
        const logs = JSON.parse(localStorage.getItem('axis_whatsapp_logs') || '[]');
        const hoje = new Date().toDateString();
        
        const alertasHoje = logs.filter(log => {
            const logDate = new Date(log.timestamp).toDateString();
            return logDate === hoje;
        }).length;
        
        // Atualizar badge
        const badge = document.getElementById('whatsapp-badge-alert');
        if (badge) {
            badge.textContent = alertasHoje;
            badge.style.display = alertasHoje > 0 ? 'flex' : 'none';
        }
        
        return alertasHoje;
    }
    
    // 10. PAINEL DE CONTROLE
    abrirPainelControle() {
        // Fechar painel existente
        this.fecharPainelControle();
        
        // Criar overlay
        const overlay = document.createElement('div');
        overlay.id = 'whatsapp-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(5px);
        `;
        
        // Painel principal
        const painel = document.createElement('div');
        painel.id = 'whatsapp-painel';
        painel.style.cssText = `
            background: white;
            border-radius: 20px;
            padding: 30px;
            width: 90%;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            font-family: 'Inter', sans-serif;
        `;
        
        // Carregar logs recentes
        const logs = JSON.parse(localStorage.getItem('axis_whatsapp_logs') || '[]');
        const logsRecentes = logs.slice(0, 5);
        
        painel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #075E54; display: flex; align-items: center; gap: 10px;">
                    <span>📱</span> Alertas WhatsApp
                </h2>
                <button onclick="window.whatsAppAlerts.fecharPainelControle()" 
                        style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">
                    ×
                </button>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                <h4 style="margin-top: 0; color: #333;">⚙️ Configurações</h4>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                    <span>🔔 Alertas ativos</span>
                    <label class="switch">
                        <input type="checkbox" id="toggle-alertas" ${this.config.enabled ? 'checked' : ''}>
                        <span class="slider round"></span>
                    </label>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span>🧪 Modo teste</span>
                    <label class="switch">
                        <input type="checkbox" id="toggle-teste" ${this.config.modoTeste ? 'checked' : ''}>
                        <span class="slider round"></span>
                    </label>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="color: #333;">🚀 Testes Rápidos</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <button onclick="window.whatsAppAlerts.testarPreventiva()" 
                            style="background: #28a745; color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer;">
                        ✅ Testar Preventiva
                    </button>
                    <button onclick="window.whatsAppAlerts.testarFalha()" 
                            style="background: #dc3545; color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer;">
                        🚨 Testar Falha
                    </button>
                </div>
            </div>
            
            <div>
                <h4 style="color: #333;">📜 Últimos Alertas</h4>
                ${logsRecentes.length > 0 ? 
                    logsRecentes.map(log => `
                        <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; margin-bottom: 8px; border-left: 4px solid ${this.getCorPorTipo(log.tipo)};">
                            <div style="font-weight: bold; color: #333;">${this.getIconePorTipo(log.tipo)} ${log.tipo.replace('_', ' ').toUpperCase()}</div>
                            <div style="font-size: 12px; color: #666;">${new Date(log.timestamp).toLocaleString('pt-BR')}</div>
                            <div style="font-size: 12px; color: #888; margin-top: 5px;">${log.dados.modelo || log.dados.tag || 'Sem detalhes'}</div>
                        </div>
                    `).join('') : 
                    '<p style="color: #666; text-align: center;">Nenhum alerta recente</p>'
                }
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="window.whatsAppAlerts.verTodosLogs()" 
                        style="background: #25D366; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; width: 100%;">
                    📋 Ver Todos os Logs
                </button>
            </div>
            
            <style>
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 50px;
                    height: 24px;
                }
                
                .switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: .4s;
                }
                
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 16px;
                    width: 16px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: .4s;
                }
                
                input:checked + .slider {
                    background-color: #25D366;
                }
                
                input:checked + .slider:before {
                    transform: translateX(26px);
                }
                
                .slider.round {
                    border-radius: 34px;
                }
                
                .slider.round:before {
                    border-radius: 50%;
                }
            </style>
        `;
        
        overlay.appendChild(painel);
        document.body.appendChild(overlay);
        
        // Adicionar eventos
        document.getElementById('toggle-alertas').addEventListener('change', (e) => {
            this.config.enabled = e.target.checked;
            this.salvarConfiguracoes();
        });
        
        document.getElementById('toggle-teste').addEventListener('change', (e) => {
            this.config.modoTeste = e.target.checked;
            this.salvarConfiguracoes();
        });
        
        // Fechar ao clicar fora
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.fecharPainelControle();
            }
        });
    }
    
    // 11. FECHAR PAINEL
    fecharPainelControle() {
        const overlay = document.getElementById('whatsapp-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
    
    // 12. TESTES RÁPIDOS
    testarPreventiva() {
        this.alertarPreventivaConcluida({
            tecnico: "FILIPE DA SILVA",
            modelo: "ZT411",
            serial: "TEST-001",
            selb: "SELB-TEST",
            status: "Teste realizado com sucesso"
        });
    }
    
    testarFalha() {
        this.alertarFalhaCritica({
            tag: "ZT411-IND-001",
            setor: "Produção Sul",
            ip: "10.15.20.1",
            problema: "Teste de falha crítica",
            impacto: "Teste - Sem impacto real",
            responsavel: "FILIPE DA SILVA"
        });
    }
    
    // 13. VER TODOS OS LOGS
    verTodosLogs() {
        const logs = JSON.parse(localStorage.getItem('axis_whatsapp_logs') || '[]');
        console.table(logs);
        alert(`📊 Total de logs: ${logs.length}\nVerifique o console (F12) para detalhes.`);
    }
    
    // 14. MÉTODOS AUXILIARES
    getCorPorTipo(tipo) {
        const cores = {
            'preventiva_concluida': '#28a745',
            'falha_critica': '#dc3545',
            'estoque_baixo': '#fd7e14'
        };
        return cores[tipo] || '#666';
    }
    
    getIconePorTipo(tipo) {
        const icones = {
            'preventiva_concluida': '✅',
            'falha_critica': '🚨',
            'estoque_baixo': '📦'
        };
        return icones[tipo] || '📝';
    }
    
    mostrarNotificacaoTeste(tipo, mensagem) {
        // Criar notificação flutuante
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: white;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            border-left: 5px solid ${this.getCorPorTipo(tipo)};
            z-index: 10000;
            max-width: 300px;
            font-family: 'Inter', sans-serif;
        `;
        
        notif.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <span style="font-size: 20px;">${this.getIconePorTipo(tipo)}</span>
                <strong style="color: #333;">MODO TESTE</strong>
            </div>
            <div style="color: #666; font-size: 12px;">${mensagem.substring(0, 100)}...</div>
            <div style="font-size: 10px; color: #888; margin-top: 5px;">${new Date().toLocaleTimeString('pt-BR')}</div>
        `;
        
        document.body.appendChild(notif);
        
        // Remover após 5 segundos
        setTimeout(() => {
            notif.remove();
        }, 5000);
    }
    
    efeitoConfirmacao() {
        const btn = document.querySelector('.whatsapp-button');
        if (btn) {
            btn.style.transform = 'scale(1.2)';
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
            }, 300);
        }
    }
    
    limparLogsAntigos() {
        const logs = JSON.parse(localStorage.getItem('axis_whatsapp_logs') || '[]');
        const umaSemanaAtras = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        const logsRecentes = logs.filter(log => {
            return new Date(log.timestamp).getTime() > umaSemanaAtras;
        });
        
        if (logsRecentes.length < logs.length) {
            localStorage.setItem('axis_whatsapp_logs', JSON.stringify(logsRecentes));
            console.log('🧹 Logs antigos removidos');
        }
    }
} // ← CHAVE QUE FECHA A CLASSE WhatsAppAlerts (ADICIONE SE FALTAR)

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.whatsAppAlerts = new WhatsAppAlerts();
    console.log('🎯 WhatsApp Alerts carregado e pronto!');
    
    // Expor métodos globais para teste
    window.testarAlertaPreventiva = () => window.whatsAppAlerts.testarPreventiva();
    window.testarAlertaFalha = () => window.whatsAppAlerts.testarFalha();
    window.abrirPainelAlertas = () => window.whatsAppAlerts.abrirPainelControle();
});