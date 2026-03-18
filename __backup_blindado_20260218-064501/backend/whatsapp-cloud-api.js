/**
 * WhatsApp Cloud API - Bot AXIS 24/7
 * Funciona sem QR, sem pareamento. Requer configuração na Meta (Developer App).
 * Envio de mensagens via Graph API.
 */

const https = require('https');

const ACCESS_TOKEN = process.env.WA_CLOUD_API_ACCESS_TOKEN || process.env.CLOUD_API_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID || process.env.CLOUD_API_PHONE_NUMBER_ID;
const API_VERSION = process.env.WA_CLOUD_API_VERSION || 'v21.0';

function isConfigured() {
    return !!(ACCESS_TOKEN && PHONE_NUMBER_ID);
}

/**
 * Envia mensagem de texto via WhatsApp Cloud API
 * @param {string} to - Número do destinatário (ex: 5548999999999)
 * @param {string} text - Texto da mensagem
 * @returns {Promise<{ok: boolean, messageId?: string, error?: string}>}
 */
async function sendMessage(to, text) {
    if (!isConfigured()) {
        return { ok: false, error: 'Cloud API não configurada (WA_CLOUD_API_ACCESS_TOKEN, WA_PHONE_NUMBER_ID)' };
    }
    const num = String(to || '').replace(/\D/g, '').substring(0, 20);
    if (!num) return { ok: false, error: 'Número inválido' };

    const body = JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: num,
        type: 'text',
        text: { body: String(text || '').substring(0, 4096) }
    });

    return new Promise((resolve) => {
        const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;
        const u = new URL(url);
        const req = https.request({
            hostname: u.hostname,
            path: u.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + ACCESS_TOKEN
            }
        }, (res) => {
            let data = '';
            res.on('data', (ch) => { data += ch; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.error) {
                        resolve({ ok: false, error: parsed.error.message || JSON.stringify(parsed.error) });
                    } else {
                        resolve({ ok: true, messageId: parsed.messages?.[0]?.id });
                    }
                } catch (e) {
                    resolve({ ok: false, error: e.message || data });
                }
            });
        });
        req.on('error', (e) => resolve({ ok: false, error: e.message }));
        req.setTimeout(15000, () => {
            req.destroy();
            resolve({ ok: false, error: 'Timeout' });
        });
        req.end(body);
    });
}

/**
 * Extrai mensagens do payload do webhook da Meta
 * @param {object} body - Corpo JSON do POST
 * @returns {Array<{from: string, text: string}>}
 */
function parseWebhookMessages(body) {
    const out = [];
    try {
        const entries = body.entry || [];
        for (const entry of entries) {
            const changes = entry.changes || [];
            for (const change of changes) {
                const value = change.value || {};
                const messages = value.messages || [];
                for (const msg of messages) {
                    if (msg.from_me) continue;
                    const from = String(msg.from || '').replace(/\D/g, '').substring(0, 20) || 'unknown';
                    let text = '';
                    if (msg.text?.body) text = msg.text.body;
                    else if (msg.type === 'button' && msg.button?.text) text = msg.button.text;
                    else if (msg.type === 'interactive' && msg.interactive?.button_reply?.title) text = msg.interactive.button_reply.title;
                    else if (msg.type === 'interactive' && msg.interactive?.list_reply?.title) text = msg.interactive.list_reply.title;
                    out.push({ from, text: String(text || '').trim() });
                }
            }
        }
    } catch (e) {}
    return out;
}

module.exports = {
    isConfigured,
    sendMessage,
    parseWebhookMessages,
    getConnectionStatus: () => ({ connected: isConfigured(), cloudApi: true })
};
