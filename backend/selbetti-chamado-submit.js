/**
 * Envio de pedidos de abertura de chamado (Portal do Cliente Selbetti).
 *
 * Ordem de tentativa:
 * 1) SELBETTI_CHAMADO_WEBHOOK_URL — POST JSON (recomendado: n8n, Make, serviço próprio).
 * 2) SELBETTI_USE_PLAYWRIGHT=1 + SELBETTI_PORTAL_USER + SELBETTI_PORTAL_PASSWORD — automação de browser (experimental).
 * 3) Fila local em config/data/selbetti-chamados-fila.json
 *
 * Nunca coloque senhas no código; use apenas .env no servidor.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const { DATA_DIR } = require('./config');

const FILA_FILE = path.join(DATA_DIR, 'selbetti-chamados-fila.json');

function postJson(urlString, bodyObj, secret) {
    return new Promise((resolve) => {
        let u;
        try {
            u = new URL(urlString);
        } catch (e) {
            resolve({ ok: false, error: 'URL do webhook inválida' });
            return;
        }
        const isHttps = u.protocol === 'https:';
        const lib = isHttps ? https : http;
        const payload = JSON.stringify(bodyObj);
        const opts = {
            hostname: u.hostname,
            port: u.port || (isHttps ? 443 : 80),
            path: u.pathname + u.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Length': Buffer.byteLength(payload, 'utf8')
            },
            timeout: 45000
        };
        if (secret) opts.headers['X-AXIS-Webhook-Secret'] = secret;

        const req = lib.request(opts, (res) => {
            let data = '';
            res.on('data', (c) => { data += c; });
            res.on('end', () => {
                const code = res.statusCode || 0;
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch (_) {}
                if (code >= 200 && code < 300) {
                    const ticket =
                        (parsed && (parsed.ticketNumber || parsed.os || parsed.numeroChamado)) || null;
                    resolve({ ok: true, mode: 'webhook', ticketNumber: ticket, raw: parsed || data });
                } else {
                    resolve({ ok: false, error: `Webhook HTTP ${code}`, body: data.substring(0, 500) });
                }
            });
        });
        req.on('error', (e) => resolve({ ok: false, error: e.message }));
        req.on('timeout', () => {
            req.destroy();
            resolve({ ok: false, error: 'Webhook timeout' });
        });
        req.end(payload);
    });
}

function appendFila(entry) {
    try {
        if (!fs.existsSync(path.dirname(FILA_FILE))) {
            fs.mkdirSync(path.dirname(FILA_FILE), { recursive: true });
        }
    } catch (_) {}
    let arr = [];
    try {
        if (fs.existsSync(FILA_FILE)) {
            arr = JSON.parse(fs.readFileSync(FILA_FILE, 'utf8'));
        }
    } catch (_) {
        arr = [];
    }
    if (!Array.isArray(arr)) arr = [];
    arr.unshift(entry);
    fs.writeFileSync(FILA_FILE, JSON.stringify(arr.slice(0, 500), null, 2), 'utf8');
}

/**
 * @param {object} payload — campos do fluxo WhatsApp
 * @returns {Promise<{ok:boolean, mode?:string, ref?:string, ticketNumber?:string, error?:string}>}
 */
async function submitSelbettiChamado(payload) {
    const webhook = (process.env.SELBETTI_CHAMADO_WEBHOOK_URL || '').trim();
    const webhookSecret = (process.env.SELBETTI_CHAMADO_WEBHOOK_SECRET || '').trim();

    if (webhook) {
        const r = await postJson(webhook, payload, webhookSecret);
        if (r.ok) return r;
        // Webhook falhou: ainda guardamos cópia na fila
        const ref = 'AXIS-SB-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex');
        appendFila({
            id: ref,
            ...payload,
            status: 'webhook_falhou',
            webhookError: r.error,
            queuedAt: new Date().toISOString()
        });
        return { ok: false, error: r.error || 'Webhook falhou', ref, filaBackup: true };
    }

    const user = (process.env.SELBETTI_PORTAL_USER || '').trim();
    const pass = (process.env.SELBETTI_PORTAL_PASSWORD || process.env.SELBETTI_PORTAL_PASS || '').trim();
    const explicitOff =
        process.env.SELBETTI_USE_PLAYWRIGHT === '0' ||
        String(process.env.SELBETTI_USE_PLAYWRIGHT || '').toLowerCase() === 'false';
    /** Sem webhook: Playwright liga automaticamente com SELBETTI_PORTAL_USER + SELBETTI_PORTAL_PASSWORD. Desligar: SELBETTI_USE_PLAYWRIGHT=0 */
    const usePw = !explicitOff && !!(user && pass);

    if (usePw && user && pass) {
        try {
            const rawDelay = process.env.SELBETTI_PLAYWRIGHT_START_DELAY_MS;
            let delayMs =
                rawDelay !== undefined && String(rawDelay).trim() !== ''
                    ? parseInt(String(rawDelay).trim(), 10)
                    : 300000;
            if (!Number.isFinite(delayMs) || delayMs < 0) delayMs = 300000;
            if (delayMs > 0) {
                console.log(
                    '[Selbetti] Aguardando ' +
                        Math.round(delayMs / 1000) +
                        's antes de abrir o Playwright (ajuste SELBETTI_PLAYWRIGHT_START_DELAY_MS; use 0 para desligar).'
                );
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
            const pw = require('./selbetti-portal-playwright');
            const r = await pw.openTicketViaPortal(payload);
            if (r && r.ok && r.ticketNumber) return { ok: true, mode: 'playwright', ticketNumber: r.ticketNumber };
            if (r && r.ok && r.partial) {
                const ref = 'AXIS-SB-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex');
                appendFila({
                    id: ref,
                    ...payload,
                    status: 'playwright_parcial',
                    detail: r.message || '',
                    queuedAt: new Date().toISOString()
                });
                return {
                    ok: true,
                    mode: 'queued',
                    ref,
                    partial: true,
                    message: r.message || 'Automação parcial; dados guardados na fila AXIS.'
                };
            }
            if (r && !r.ok && r.error) {
                const ref = 'AXIS-SB-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex');
                appendFila({
                    id: ref,
                    ...payload,
                    status: 'playwright_erro',
                    detail: r.error,
                    queuedAt: new Date().toISOString()
                });
                return { ok: true, mode: 'queued', ref, playwrightError: r.error };
            }
        } catch (e) {
            const ref = 'AXIS-SB-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex');
            appendFila({
                id: ref,
                ...payload,
                status: 'playwright_excecao',
                detail: String(e.message || e),
                queuedAt: new Date().toISOString()
            });
            return { ok: true, mode: 'queued', ref, playwrightError: String(e.message || e) };
        }
    }

    const ref = 'AXIS-SB-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex');
    appendFila({
        id: ref,
        ...payload,
        status: 'fila_local',
        queuedAt: new Date().toISOString()
    });
    const temUser = !!(process.env.SELBETTI_PORTAL_USER || '').trim();
    const temPass = !!(process.env.SELBETTI_PORTAL_PASSWORD || process.env.SELBETTI_PORTAL_PASS || '').trim();
    console.warn(
        '[Selbetti] Chamado na fila local (ref ' +
            ref +
            '). Motivo: sem credenciais Playwright neste processo (user=' +
            temUser +
            ' pass=' +
            temPass +
            ') ou SELBETTI_USE_PLAYWRIGHT=0. Confirme ` (2).env` (com espaço no nome), (2).env, .env.2 ou config/selbetti.env — linhas Selbetti sem #. npm run check-selbetti-env'
    );
    return {
        ok: true,
        mode: 'queued',
        ref,
        message:
            'Sem webhook nem Playwright configurados: pedido guardado na fila local do servidor. ' +
            'Defina SELBETTI_CHAMADO_WEBHOOK_URL ou Playwright no .env para envio automático ao portal.'
    };
}

module.exports = { submitSelbettiChamado, appendFila };
