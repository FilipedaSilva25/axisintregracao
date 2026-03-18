/**
 * Conector WhatsApp - AXIS Packing Machine Bot
 * Usa Baileys para conectar ao WhatsApp Web.
 * Reconexão automática contínua: mantém sempre conectado e nunca desiste (exceto logout).
 */

const path = require('path');
const fs = require('fs');
const { DATA_DIR, ROOT_DIR, PORT } = require('./config');

const AUTH_DIR = path.join(DATA_DIR, 'whatsapp-auth');
const PACKING_TROCAS_FILE = path.join(DATA_DIR, 'packing-trocas.json');
const BANCADAS_STATUS_FILE = path.join(DATA_DIR, 'bancadas-status.json');
const PECAS_ESTOQUE_FILE = path.join(DATA_DIR, 'pecas-estoque.json');
const PECAS_MOVIMENTOS_FILE = path.join(DATA_DIR, 'pecas-movimentos.json');
const REGISTRO_CHAMADOS_FILE = path.join(DATA_DIR, 'registro-chamados.json');

const RECONNECT_DELAY_INITIAL_MS = 3000;
const RECONNECT_DELAY_MAX_MS = 60000;
const RECONNECT_BACKOFF_MULTIPLIER = 2;

let sock = null;
let currentQR = null;
let isConnected = false;
let botNumber = null;
let reconnectDelayMs = RECONNECT_DELAY_INITIAL_MS;
let reconnectTimeoutId = null;
let isReconnecting = false;

function ensureAuthDir() {
    if (!fs.existsSync(path.dirname(AUTH_DIR))) {
        fs.mkdirSync(path.dirname(AUTH_DIR), { recursive: true });
    }
    if (!fs.existsSync(AUTH_DIR)) {
        fs.mkdirSync(AUTH_DIR, { recursive: true });
    }
}

async function startConnector() {
    if (reconnectTimeoutId) {
        clearTimeout(reconnectTimeoutId);
        reconnectTimeoutId = null;
    }
    try {
        ensureAuthDir();
        const baileys = await import('@whiskeysockets/baileys');
        const makeWASocket = baileys.default;
        const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = baileys;
        const pino = (await import('pino')).default;
        const logger = pino({ level: 'error' });

        const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
        try {
            const me = state?.creds?.me;
            if (me) {
                const jid = typeof me === 'string' ? me : (me.id || me.user || me.jid || '');
                if (jid) {
                    let num = String(jid).replace(/@.*$/, '').replace(/:\d+$/, '').replace(/\D/g, '');
                    if (num && !num.startsWith('55')) num = '55' + num;
                    if (num) botNumber = num;
                }
            }
        } catch (_) {}
        const { version } = await fetchLatestBaileysVersion();

        sock = makeWASocket({
            version,
            logger,
            auth: state
        });

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                currentQR = qr;
                isConnected = false;
                console.log('\n📱 Escaneie o QR Code abaixo no WhatsApp para conectar o bot:\n');
            }

            if (connection === 'close') {
                currentQR = null;
                isConnected = false;
                sock = null;
                const code = lastDisconnect?.error?.output?.statusCode;
                if (code === DisconnectReason.loggedOut) {
                    botNumber = null;
                    reconnectDelayMs = RECONNECT_DELAY_INITIAL_MS;
                    console.log('\n⚠️ WhatsApp desconectado (logout). Reabra o servidor e escaneie o QR novamente.\n');
                    return;
                }
                if (isReconnecting) return;
                isReconnecting = true;
                const delay = reconnectDelayMs;
                reconnectDelayMs = Math.min(reconnectDelayMs * RECONNECT_BACKOFF_MULTIPLIER, RECONNECT_DELAY_MAX_MS);
                console.log('\n🔄 WhatsApp desconectou. Reconectando em ' + (delay / 1000) + 's... (tentativa automática)\n');
                reconnectTimeoutId = setTimeout(() => {
                    isReconnecting = false;
                    startConnector().catch(e => {
                        console.error('Reconnect:', e.message);
                        isReconnecting = false;
                    });
                }, delay);
            }

            if (connection === 'open') {
                currentQR = null;
                isConnected = true;
                isReconnecting = false;
                reconnectDelayMs = RECONNECT_DELAY_INITIAL_MS;
                if (reconnectTimeoutId) {
                    clearTimeout(reconnectTimeoutId);
                    reconnectTimeoutId = null;
                }
                console.log('\n✅ Bot WhatsApp conectado! Número:', botNumber || '(configure perfil: foto AXIS, nome AXIS INTEGRAÇÃO)');
                console.log('   Envie "oi" ou "menu" para ver opções: Troca de Cabeça, Manutenção Preventiva, Status de Bancada.\n');
            }
        });

        sock.ev.on('creds.update', (creds) => {
            saveCreds(creds);
            try {
                const me = creds?.me;
                if (me) {
                    const jid = typeof me === 'string' ? me : (me.id || me.user || me.jid || '');
                    if (jid) {
                        let num = String(jid).replace(/@.*$/, '').replace(/:\d+$/, '').replace(/\D/g, '');
                        if (num && !num.startsWith('55')) num = '55' + num;
                        if (num) botNumber = num;
                    }
                }
            } catch (_) {}
        });

        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            // Só processar mensagem NOVA (notify). Ignorar 'append' = mesma mensagem de novo = evita enviar 2 respostas
            if (type !== 'notify') return;
            let handleIncoming, readJsonSync, writeJson;
            try {
                handleIncoming = require('./whatsapp-packing-bot').handleIncoming;
                const data = require('./data');
                readJsonSync = data.readJsonSync;
                writeJson = data.writeJson;
            } catch (e) {
                console.error('[Bot] Módulos packing-bot/data:', e.message);
                return;
            }
            for (const msg of messages) {
                if (msg.key.fromMe) continue;
                const jid = msg.key.remoteJid;
                if (!jid || jid.endsWith('@broadcast')) continue;

                let text = '';
                if (msg.message?.conversation) text = msg.message.conversation;
                else if (msg.message?.extendedTextMessage?.text) text = msg.message.extendedTextMessage.text;
                else if (msg.message?.ephemeralMessage?.message?.conversation) text = msg.message.ephemeralMessage.message.conversation;
                else if (msg.message?.ephemeralMessage?.message?.extendedTextMessage?.text) text = msg.message.ephemeralMessage.message.extendedTextMessage.text;
                else if (msg.message?.buttonsResponseMessage?.selectedButtonId) text = msg.message.buttonsResponseMessage.selectedButtonId;
                else if (msg.message?.templateButtonReplyMessage?.selectedId) text = msg.message.templateButtonReplyMessage.selectedId;
                if (!text || !String(text).trim()) continue;

                const participant = msg.key.participant || jid;
                const fromJid = participant.toString().replace(/@.*/, '').replace(/\D/g, '') || jid.replace(/@.*/, '').replace(/\D/g, '') || 'unknown';

                console.log('[Bot] Mensagem de', fromJid, ':', String(text).trim().substring(0, 50));

                try {
                    const baseUrl = process.env.BASE_URL || (process.env.PORT ? `http://localhost:${PORT}` : '');
                    const getBancadasStatus = async () => {
                        try {
                            return readJsonSync(BANCADAS_STATUS_FILE, { bancadas: {}, updatedAt: null });
                        } catch (e) {
                            return { bancadas: {}, updatedAt: null };
                        }
                    };
                    const validStatus = ['DISPONIVEL', 'IMPRESSORA', 'NOTEBOOK', 'SEM_IMPRESSORA_IMP', 'SEM_IMPRESSORA_NB'];
                    const updateBancadaStatus = async (bancada, equipamento) => {
                        const eq = (equipamento || '').toUpperCase().trim();
                        if (!validStatus.includes(eq)) throw new Error('Equipamento inválido');
                        let data = { bancadas: {}, updatedAt: null };
                        try {
                            data = readJsonSync(BANCADAS_STATUS_FILE, {});
                            data.bancadas = data.bancadas && typeof data.bancadas === 'object' ? data.bancadas : {};
                        } catch (e) {}
                        data.bancadas[String(bancada).trim()] = eq;
                        data.updatedAt = new Date().toISOString();
                        await writeJson(BANCADAS_STATUS_FILE, data);
                    };

                    const getPecasEstoque = async () => {
                        try {
                            const raw = readJsonSync(PECAS_ESTOQUE_FILE, []);
                            return Array.isArray(raw) ? raw : (raw.estoque || []);
                        } catch (e) {
                            return [];
                        }
                    };
                    const registerPecasEntrada = async (body) => {
                        const data = require('./data');
                        const writeJsonP = data.writeJson;
                        let estoque = [];
                        try {
                            estoque = readJsonSync(PECAS_ESTOQUE_FILE, []);
                            if (!Array.isArray(estoque)) estoque = [];
                        } catch (e) {}
                        const produto = String(body.produto || '').trim() || 'Item';
                        const qtd = Math.max(1, parseInt(String(body.quantidade || 1), 10) || 1);
                        const pecaId = body.pecaId || null;
                        const idx = pecaId ? estoque.findIndex(p => p && p.id === pecaId) : -1;
                        if (idx >= 0) {
                            estoque[idx].quantidade = (estoque[idx].quantidade || 0) + qtd;
                        } else {
                            estoque.unshift({
                                id: 'peca-' + Date.now(),
                                categoria: body.categoria || 'peca',
                                produto: produto,
                                nome: produto,
                                fabricante: '',
                                conteudo: '',
                                lote: '',
                                validade: '',
                                quantidade: qtd,
                                dataRecebimento: new Date().toISOString(),
                                dataCadastro: new Date().toISOString(),
                                local: '',
                                observacao: body.observacao || '',
                                historico: [{ acao: 'criacao', data: new Date().toISOString(), usuario: body.usuario || 'WhatsApp' }]
                            });
                        }
                        const mov = {
                            id: 'mov-' + Date.now(),
                            pecaId: pecaId || (estoque[0] && estoque[0].id),
                            tipo: 'entrada',
                            produto: produto,
                            quantidade: qtd,
                            observacao: body.observacao || 'Entrada via WhatsApp',
                            dataHora: new Date().toISOString()
                        };
                        let movimentos = [];
                        try {
                            movimentos = readJsonSync(PECAS_MOVIMENTOS_FILE, []);
                            if (!Array.isArray(movimentos)) movimentos = [];
                        } catch (e) {}
                        movimentos.unshift(mov);
                        await writeJsonP(PECAS_ESTOQUE_FILE, estoque);
                        await writeJsonP(PECAS_MOVIMENTOS_FILE, movimentos);
                    };
                    const registerPecasSaida = async (body) => {
                        const data = require('./data');
                        const writeJsonP = data.writeJson;
                        let estoque = [];
                        try {
                            estoque = readJsonSync(PECAS_ESTOQUE_FILE, []);
                            if (!Array.isArray(estoque)) estoque = [];
                        } catch (e) {}
                        const idx = estoque.findIndex(p => p && p.id === body.pecaId);
                        if (idx < 0) throw new Error('Item não encontrado');
                        const qtd = Math.max(1, parseInt(String(body.quantidade || 1), 10) || 1);
                        const disponivel = estoque[idx].quantidade || 0;
                        if (qtd > disponivel) throw new Error('Quantidade maior que o estoque');
                        estoque[idx].quantidade = disponivel - qtd;
                        const mov = {
                            id: 'mov-' + Date.now(),
                            pecaId: body.pecaId,
                            tipo: 'saída',
                            produto: estoque[idx].produto || estoque[idx].nome || body.produto,
                            quantidade: qtd,
                            observacao: body.observacao || 'Saída via WhatsApp',
                            dataHora: new Date().toISOString()
                        };
                        let movimentos = [];
                        try {
                            movimentos = readJsonSync(PECAS_MOVIMENTOS_FILE, []);
                            if (!Array.isArray(movimentos)) movimentos = [];
                        } catch (e) {}
                        movimentos.unshift(mov);
                        await writeJsonP(PECAS_ESTOQUE_FILE, estoque);
                        await writeJsonP(PECAS_MOVIMENTOS_FILE, movimentos);
                    };
                    const registerChamado = async (body) => {
                        let chamados = [];
                        try {
                            const data = readJsonSync(REGISTRO_CHAMADOS_FILE, []);
                            chamados = Array.isArray(data) ? data : (data.chamados || []);
                        } catch (e) { chamados = []; }
                        const chave = (body && body.chave ? String(body.chave) : (body && body.numero ? String(body.numero) : '')).trim();
                        const status = (body && body.status ? String(body.status) : 'ABERTO').trim() || 'ABERTO';
                        const observacao = body && body.observacao ? String(body.observacao) : '';
                        const tipos = body && Array.isArray(body.tipos) ? body.tipos : [];
                        const phone = body && body.phone ? String(body.phone) : fromJid;
                        const novo = {
                            id: body && body.id ? String(body.id) : ('rc-wa-' + Date.now()),
                            data: body && body.data ? String(body.data) : new Date().toISOString(),
                            chave: chave || '(sem número)',
                            status: status,
                            tipos: tipos,
                            observacao: observacao,
                            origem: 'whatsapp',
                            phone: phone
                        };
                        chamados.unshift(novo);
                        await writeJson(REGISTRO_CHAMADOS_FILE, chamados);
                    };

                    const reply = await handleIncoming(
                        { from: fromJid, body: text },
                        (phone, r) => r,
                        async (troca) => {
                            let trocas = [];
                            try {
                                const data = readJsonSync(PACKING_TROCAS_FILE, []);
                                trocas = Array.isArray(data) ? data : (data.trocas || []);
                            } catch (e) { trocas = []; }
                            trocas.unshift({
                                id: 'pm_wa_' + Date.now(),
                                dataHora: troca.dataHora || new Date().toISOString(),
                                numeroPm: troca.numeroPm,
                                quantidadeImpressoes: troca.quantidadeImpressoes || 0,
                                tecnico: String(troca.tecnico || '').substring(0, 100),
                                origem: 'whatsapp',
                                phone: troca.phone
                            });
                            await writeJson(PACKING_TROCAS_FILE, trocas);
                        },
                        { getBancadasStatus, baseUrl, updateBancadaStatus, getPecasEstoque, registerPecasEntrada, registerPecasSaida, registerChamado }
                    );

                    if (reply && sock) {
                        await sock.sendMessage(jid, { text: reply });
                        console.log('[Bot] Resposta enviada para', fromJid);
                    }
                } catch (e) {
                    console.error('[Bot] Erro ao processar mensagem:', e.message);
                    if (sock) {
                        try {
                            await sock.sendMessage(jid, { text: '❌ Ocorreu um erro. Tente novamente ou digite *oi* ou *menu* para recomeçar.' });
                        } catch (_) {}
                    }
                }
            }
        });

        return sock;
    } catch (e) {
        console.error('Erro ao iniciar WhatsApp:', e.message);
        sock = null;
        isConnected = false;
        if (!isReconnecting) {
            isReconnecting = true;
            const delay = reconnectDelayMs;
            reconnectDelayMs = Math.min(reconnectDelayMs * RECONNECT_BACKOFF_MULTIPLIER, RECONNECT_DELAY_MAX_MS);
            console.log('🔄 Nova tentativa em ' + (delay / 1000) + 's...\n');
            reconnectTimeoutId = setTimeout(() => {
                isReconnecting = false;
                startConnector().catch(() => {});
            }, delay);
        }
        return null;
    }
}

function getQR() {
    return currentQR;
}

function getConnectionStatus() {
    return { connected: isConnected, hasQR: !!currentQR };
}

function getBotNumber() {
    return botNumber;
}

async function disconnectAndLogout() {
    try {
        if (reconnectTimeoutId) {
            clearTimeout(reconnectTimeoutId);
            reconnectTimeoutId = null;
        }
        isReconnecting = false;
        reconnectDelayMs = RECONNECT_DELAY_INITIAL_MS;
        const oldSock = sock;
        sock = null;
        currentQR = null;
        isConnected = false;
        botNumber = null;
        if (oldSock) {
            try { await oldSock.logout(); } catch (_) {}
        }
        if (fs.existsSync(AUTH_DIR)) {
            const files = fs.readdirSync(AUTH_DIR);
            for (const f of files) {
                try {
                    fs.unlinkSync(path.join(AUTH_DIR, f));
                } catch (_) {}
            }
        }
        await startConnector();
        return true;
    } catch (e) {
        console.error('Erro ao desconectar:', e.message);
        try { await startConnector(); } catch (_) {}
        return false;
    }
}

module.exports = {
    startConnector,
    getQR,
    getConnectionStatus,
    getBotNumber,
    disconnectAndLogout,
    isConnected: () => isConnected
};
