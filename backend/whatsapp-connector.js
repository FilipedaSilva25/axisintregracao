/**
 * Conector WhatsApp - AXIS Packing Machine Bot
 * Usa Baileys para conectar ao WhatsApp Web.
 * Ao receber mensagem, processa o fluxo de troca e responde.
 */

const path = require('path');
const fs = require('fs');
const { DATA_DIR, ROOT_DIR } = require('./config');

const AUTH_DIR = path.join(DATA_DIR, 'whatsapp-auth');
const PACKING_TROCAS_FILE = path.join(DATA_DIR, 'packing-trocas.json');

let sock = null;
let currentQR = null;
let isConnected = false;
let botNumber = null; // Número do bot quando conectado (para wa.me)

function ensureAuthDir() {
    if (!fs.existsSync(path.dirname(AUTH_DIR))) {
        fs.mkdirSync(path.dirname(AUTH_DIR), { recursive: true });
    }
    if (!fs.existsSync(AUTH_DIR)) {
        fs.mkdirSync(AUTH_DIR, { recursive: true });
    }
}

async function startConnector() {
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
                const code = lastDisconnect?.error?.output?.statusCode;
                if (code === DisconnectReason.loggedOut) {
                    botNumber = null;
                    console.log('\n⚠️ WhatsApp desconectado (logout). Reabra o servidor e escaneie o QR novamente.\n');
                    return;
                }
                console.log('\n🔄 Reconectando WhatsApp em 3s...\n');
                sock = null;
                setTimeout(() => startConnector().catch(e => console.error('Reconnect:', e.message)), 3000);
            }

            if (connection === 'open') {
                currentQR = null;
                isConnected = true;
                console.log('\n✅ Bot WhatsApp conectado! Número:', botNumber || '(configure perfil: foto AXIS, nome AXIS INTEGRAÇÃO)');
                console.log('   Envie "troca" para registrar uma troca de cabeça.\n');
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
            if (type !== 'notify' && type !== 'append') return;
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
                    const { handleIncoming } = require('./whatsapp-packing-bot');
                    const { readJsonSync, writeJson } = require('./data');

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
                        }
                    );

                    if (reply && sock) {
                        await sock.sendMessage(jid, { text: reply });
                        console.log('[Bot] Resposta enviada para', fromJid);
                    }
                } catch (e) {
                    console.error('Erro ao processar mensagem:', e.message);
                    if (sock) {
                        try {
                            await sock.sendMessage(jid, { text: '❌ Ocorreu um erro. Tente novamente ou digite *troca* para recomeçar.' });
                        } catch (_) {}
                    }
                }
            }
        });

        return sock;
    } catch (e) {
        console.error('Erro ao iniciar WhatsApp:', e.message);
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
