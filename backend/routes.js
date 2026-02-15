/**
 * Rotas da API - Projeto Vida / AXIS
 * Todas as rotas retornam true se trataram a requisição; false para deixar o servidor servir estático.
 */

const path = require('path');
const fs = require('fs');
const { DATA_DIR, CONFIG_MODULOS, HEADERS, ROOT_DIR } = require('./config');

const MANUTENCOES_DIR = path.join(ROOT_DIR, 'manutencoes');
const { readJson, readJsonSync, writeJson } = require('./data');
const PACKING_TROCAS_FILE = path.join(DATA_DIR, 'packing-trocas.json');

function sendJson(res, obj) {
    res.writeHead(200, { ...HEADERS, 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(obj), 'utf-8');
}

function sendErr(res, code, msg) {
    res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: msg }), 'utf-8');
}

function parseBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', (chunk) => { body += chunk.toString(); });
        req.on('end', () => {
            try { resolve(body ? JSON.parse(body) : {}); } catch (e) { resolve({}); }
        });
    });
}

async function handleApi(req, res, urlPath) {
    const method = req.method;

    // ---- Redirecionamento: /whatsapp-qr → /pages/whatsapp-qr.html (evita conflito com tryPagesFallback) ----
    const isWhatsAppQrRoot = (urlPath === '/whatsapp-qr' || urlPath === '/whatsapp-qr.html' || urlPath === '/whatsapp-qr/') && method === 'GET';
    if (isWhatsAppQrRoot) {
        res.writeHead(302, { 'Location': '/pages/whatsapp-qr.html', 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=/pages/whatsapp-qr.html"></head><body>Redirecionando para <a href="/pages/whatsapp-qr.html">QR Code WhatsApp</a>...</body></html>', 'utf-8');
        return true;
    }

    // ---- Health / Ping ----
    if ((urlPath === '/health' || urlPath === '/ping') && method === 'GET') {
        sendJson(res, { ok: true, port: require('./config').PORT, env: require('./config').NODE_ENV });
        return true;
    }

    // ---- Dados AXIS ----
    if ((urlPath === '/data/axis-seed.json' || urlPath === '/data/axis-seed') && method === 'GET') {
        const fp = path.join(DATA_DIR, 'axis-seed.json');
        const data = await readJson(fp);
        if (data === null) {
            sendErr(res, 404, 'axis-seed.json não encontrado');
            return true;
        }
        sendJson(res, data);
        return true;
    }

    // ---- Backup ----
    if ((urlPath === '/api/backup' || urlPath === '/api/backup.json') && method === 'GET') {
        const fp = path.join(DATA_DIR, 'axis-backup.json');
        const data = await readJson(fp, {});
        sendJson(res, data);
        return true;
    }
    if (urlPath === '/api/backup' && method === 'POST') {
        const body = await parseBody(req);
        const fp = path.join(DATA_DIR, 'axis-backup.json');
        try {
            await writeJson(fp, body);
            sendJson(res, { ok: true, message: 'Backup salvo' });
        } catch (e) {
            sendErr(res, 500, 'Erro ao salvar backup');
        }
        return true;
    }

    // ---- Config Alertas (Novos Módulos) ----
    if ((urlPath === '/api/config/alertas' || urlPath === '/api/config/alertas.json') && method === 'GET') {
        const fp = path.join(CONFIG_MODULOS, 'config-alertas.json');
        const data = await readJson(fp, {});
        sendJson(res, data);
        return true;
    }
    if (urlPath === '/api/config/alertas' && (method === 'POST' || method === 'PUT')) {
        const body = await parseBody(req);
        const fp = path.join(CONFIG_MODULOS, 'config-alertas.json');
        try {
            await writeJson(fp, body);
            sendJson(res, { ok: true, message: 'Config alertas salva' });
        } catch (e) {
            sendErr(res, 500, 'Erro ao salvar config alertas');
        }
        return true;
    }

    // ---- Config Técnicos (Novos Módulos) ----
    if ((urlPath === '/api/config/tecnicos' || urlPath === '/api/config/tecnicos.json') && method === 'GET') {
        const fp = path.join(CONFIG_MODULOS, 'config-tecnicos.json');
        const data = await readJson(fp, {});
        sendJson(res, data);
        return true;
    }
    if (urlPath === '/api/config/tecnicos' && (method === 'POST' || method === 'PUT')) {
        const body = await parseBody(req);
        const fp = path.join(CONFIG_MODULOS, 'config-tecnicos.json');
        try {
            await writeJson(fp, body);
            sendJson(res, { ok: true, message: 'Config técnicos salva' });
        } catch (e) {
            sendErr(res, 500, 'Erro ao salvar config técnicos');
        }
        return true;
    }

    // ---- Manutenções Preventivas: salvar PDF em pastas Ano/Mês ----
    if (urlPath === '/api/manutencoes/salvar-pdf' && method === 'POST') {
        const body = await parseBody(req);
        const { ano, mes, nomeArquivo, pdfBase64 } = body;
        if (!ano || !mes || !nomeArquivo || !pdfBase64) {
            sendErr(res, 400, 'Faltam ano, mes, nomeArquivo ou pdfBase64');
            return true;
        }
        const dirAno = path.join(MANUTENCOES_DIR, String(ano));
        const dirMes = path.join(dirAno, String(mes));
        const safeName = path.basename(nomeArquivo).replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = path.join(dirMes, safeName);
        try {
            if (!fs.existsSync(dirAno)) fs.mkdirSync(dirAno, { recursive: true });
            if (!fs.existsSync(dirMes)) fs.mkdirSync(dirMes, { recursive: true });
            const buf = Buffer.from(pdfBase64, 'base64');
            fs.writeFileSync(filePath, buf);
            sendJson(res, { ok: true, message: 'PDF salvo em Manutenções Preventivas', path: `manutencoes/${ano}/${mes}/${safeName}` });
        } catch (e) {
            sendErr(res, 500, 'Erro ao salvar PDF: ' + (e.message || String(e)));
        }
        return true;
    }

    // ---- Packing Machine - Trocas de Cabeça de Impressão ----
    if (urlPath === '/api/packing/trocas' && method === 'GET') {
        let trocas = [];
        try {
            const data = readJsonSync(PACKING_TROCAS_FILE, []);
            trocas = Array.isArray(data) ? data : (data.trocas || []);
        } catch (e) {
            trocas = [];
        }
        sendJson(res, { ok: true, trocas });
        return true;
    }

    if ((urlPath === '/api/packing/troca' || urlPath === '/api/packing/trocas') && method === 'POST') {
        const body = await parseBody(req);
        const { numeroPm, quantidadeImpressoes, tecnico, dataHora } = body;
        if (!numeroPm || tecnico == null || tecnico === '') {
            sendErr(res, 400, 'Faltam numeroPm ou tecnico');
            return true;
        }
        const qtd = Math.max(0, parseInt(String(quantidadeImpressoes || 0), 10) || 0);
        let pm = String(numeroPm).trim();
        if (/^[1-6]$/.test(pm)) pm = 'PM ' + pm;
        else if (!/^PM [1-6]$/i.test(pm)) {
            const n = parseInt(pm.replace(/\D/g, ''), 10);
            pm = (n >= 1 && n <= 6) ? 'PM ' + n : 'PM 1';
        } else {
            pm = pm.replace(/pm\s*/i, 'PM ');
        }
        const troca = {
            id: 'pm_api_' + Date.now(),
            dataHora: dataHora || new Date().toISOString(),
            numeroPm: pm,
            quantidadeImpressoes: qtd,
            tecnico: String(tecnico || '').trim().substring(0, 100),
            origem: body.origem || 'api'
        };
        let trocas = [];
        try {
            const data = readJsonSync(PACKING_TROCAS_FILE, []);
            trocas = Array.isArray(data) ? data : (data.trocas || []);
        } catch (e) {
            trocas = [];
        }
        trocas.unshift(troca);
        try {
            await writeJson(PACKING_TROCAS_FILE, trocas);
            sendJson(res, { ok: true, message: 'Troca registrada', troca });
        } catch (e) {
            sendErr(res, 500, 'Erro ao salvar: ' + (e.message || ''));
        }
        return true;
    }

    // ---- Status e QR do WhatsApp (Baileys integrado) ----
    if (urlPath === '/whatsapp-connect' || urlPath === '/whatsapp-connect.html') {
        const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AXIS - Conectar WhatsApp Bot</title><style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;min-height:100vh;margin:0;display:flex;align-items:center;justify-content:center;padding:20px}.card{background:rgba(255,255,255,.08);border-radius:16px;padding:32px;max-width:400px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.3)}h1{font-size:24px;margin:0 0 8px}.sub{color:#94a3b8;margin-bottom:24px;font-size:14px}#qr{max-width:280px;margin:16px auto;padding:16px;background:#fff;border-radius:12px}#qr img{width:100%;height:auto}.status{font-size:14px;margin-top:16px;padding:12px;border-radius:8px;background:rgba(37,211,102,.2);color:#25D366}.status.warn{background:rgba(253,126,20,.2);color:#fd7e14}.status.err{background:rgba(239,68,68,.2);color:#ef4444}a{color:#00e5ff;text-decoration:none}a:hover{text-decoration:underline}</style></head><body><div class="card"><h1>🤖 Bot WhatsApp - AXIS</h1><p class="sub">Troca de Cabeça (Packing Machine)</p><div id="qr"></div><div id="status" class="status"></div><p style="margin-top:24px;font-size:13px"><a href="/">← Voltar ao AXIS</a></p></div><script>
var s=document.getElementById('status');
var qr=document.getElementById('qr');
function poll(){fetch('/api/whatsapp/status').then(r=>r.json()).then(d=>{
if(d.connected){qr.innerHTML='';s.textContent='✅ Conectado! Envie "troca" no WhatsApp para registrar.';s.className='status';return}
if(d.qr){qr.innerHTML='<img src="'+d.qr+'" alt="QR Code">';s.textContent='Escaneie o QR Code no WhatsApp (Aparelho conectado > Vincular dispositivo)';s.className='status warn';}else{qr.innerHTML='';s.textContent='Aguardando QR... Iniciando bot.';s.className='status warn'}
}).catch(()=>{s.textContent='Erro ao conectar. O servidor está rodando?';s.className='status err'})}
poll();setInterval(poll,3000);
</script></body></html>`;
        res.writeHead(200, { ...HEADERS, 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html, 'utf-8');
        return true;
    }

    // ---- QR Code AXIS (wa.me) – sempre disponível, não depende do connector ----
    if ((urlPath === '/api/whatsapp/qr-axis' || urlPath === '/api/whatsapp/qr') && method === 'GET') {
        try {
            const QRCode = require('qrcode');
            const { AXIS_BOT_NUMBER } = require('./config');
            const num = (AXIS_BOT_NUMBER || '5548991578172').replace(/\D/g, '');
            const waMe = 'https://wa.me/' + num;
            const waMeQr = await new Promise((resolve, reject) => {
                QRCode.toDataURL(waMe, { margin: 2, width: 300 }, (err, url) => {
                    if (err) reject(err);
                    else resolve(url);
                });
            });
            sendJson(res, { ok: true, qr: waMeQr, number: num });
        } catch (e) {
            sendJson(res, { ok: false, error: e.message });
        }
        return true;
    }

    if (urlPath === '/api/whatsapp/status' && method === 'GET') {
        const QRCode = require('qrcode');
        const { AXIS_BOT_NUMBER } = require('./config');
        let connected = false;
        let hasQR = false;
        let qrBase64 = null;
        let botNumber = null;
        let cloudApi = false;
        try {
            const cloud = require('./whatsapp-cloud-api');
            if (cloud.isConfigured()) {
                connected = true;
                cloudApi = true;
                botNumber = AXIS_BOT_NUMBER;
            }
        } catch (e) {}
        if (!cloudApi) {
            try {
                const connector = require('./whatsapp-connector');
                const status = connector.getConnectionStatus();
                connected = status.connected;
                hasQR = status.hasQR;
                const qrStr = connector.getQR();
                botNumber = connector.getBotNumber ? connector.getBotNumber() : null;
                if (qrStr) {
                    qrBase64 = await new Promise((resolve, reject) => {
                        QRCode.toDataURL(qrStr, { margin: 2, width: 300 }, (err, url) => {
                            if (err) reject(err);
                            else resolve(url);
                        });
                    });
                }
            } catch (e) {
                connected = false;
                hasQR = false;
            }
        }
        let waMeQr = null;
        try {
            const waMe = 'https://wa.me/' + (AXIS_BOT_NUMBER || '5548991578172').replace(/\D/g, '');
            waMeQr = await new Promise((resolve, reject) => {
                QRCode.toDataURL(waMe, { margin: 2, width: 300 }, (err, url) => {
                    if (err) reject(err);
                    else resolve(url);
                });
            });
        } catch (e) {}
        function formatarNumeroBR(n) {
            if (!n) return '';
            var d = String(n).replace(/\D/g, '');
            if (!d.startsWith('55')) d = '55' + d;
            if (d.length === 13) return '+55 ' + d.slice(2, 4) + ' ' + d.slice(4, 9) + '-' + d.slice(9);
            if (d.length === 12) return '+55 ' + d.slice(2, 4) + ' ' + d.slice(4, 8) + '-' + d.slice(8);
            return n;
        }
        sendJson(res, { ok: true, connected, hasQR, qr: qrBase64, waMeQr, botNumber, axisBotNumber: AXIS_BOT_NUMBER, axisBotNumberFormatado: formatarNumeroBR(AXIS_BOT_NUMBER), cloudApi, numeroConectado: botNumber, numeroConectadoFormatado: formatarNumeroBR(botNumber) });
        return true;
    }

    if ((urlPath === '/api/whatsapp/logout' || urlPath === '/api/whatsapp/desconectar') && (method === 'POST' || method === 'GET')) {
        try {
            const connector = require('./whatsapp-connector');
            if (connector.disconnectAndLogout) {
                await connector.disconnectAndLogout();
                sendJson(res, { ok: true, message: 'Desconectado. Escaneie o novo QR com um número DEDICADO (chip secundário ou linha da empresa).' });
            } else {
                sendJson(res, { ok: false, error: 'Função não disponível' });
            }
        } catch (e) {
            sendJson(res, { ok: false, error: e.message || 'Erro ao desconectar' });
        }
        return true;
    }

    // ---- Webhook: WhatsApp Cloud API (Meta oficial) - 24/7 sem QR ----
    const WEBHOOK_VERIFY_TOKEN = process.env.WA_WEBHOOK_VERIFY_TOKEN || process.env.WEBHOOK_VERIFY_TOKEN || 'axis-packing-bot';
    if (urlPath === '/api/whatsapp/cloud-webhook' && method === 'GET') {
        const fullUrl = req.url || '';
        const query = fullUrl.includes('?') ? new URLSearchParams(fullUrl.split('?')[1]) : new Map();
        const mode = query.get('hub.mode');
        const token = query.get('hub.verify_token');
        const challenge = query.get('hub.challenge');
        if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN && challenge) {
            res.writeHead(200, { 'Content-Type': 'text/plain', ...HEADERS });
            res.end(challenge, 'utf-8');
        } else {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('Forbidden', 'utf-8');
        }
        return true;
    }
    if (urlPath === '/api/whatsapp/cloud-webhook' && method === 'POST') {
        const cloudApi = require('./whatsapp-cloud-api');
        if (!cloudApi.isConfigured()) {
            res.writeHead(200, { 'Content-Type': 'application/json', ...HEADERS });
            res.end(JSON.stringify({ ok: false, error: 'Cloud API não configurada' }), 'utf-8');
            return true;
        }
        const body = await parseBody(req);
        res.writeHead(200, { 'Content-Type': 'application/json', ...HEADERS });
        res.end(JSON.stringify({ ok: true }), 'utf-8');
        setImmediate(async () => {
            const messages = cloudApi.parseWebhookMessages(body);
            const { handleIncoming } = require('./whatsapp-packing-bot');
            for (const { from, text } of messages) {
                if (!text) continue;
                try {
                    const reply = await handleIncoming(
                        { from, body: text },
                        (phone, msg) => msg,
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
                    if (reply) {
                        const r = await cloudApi.sendMessage(from, reply);
                        if (!r.ok) console.error('Cloud API send:', r.error);
                    }
                } catch (e) {
                    console.error('Erro webhook Cloud API:', e.message);
                    try { await cloudApi.sendMessage(from, '❌ Ocorreu um erro. Digite *troca* para recomeçar.'); } catch (_) {}
                }
            }
        });
        return true;
    }

    // ---- Webhook: WhatsApp Bot - mensagem recebida (fluxo conversacional) ----
    if (urlPath === '/api/whatsapp/packing-webhook' && method === 'POST') {
        const body = await parseBody(req);
        let from = body.from || body.phone || (body.data && body.data.key && body.data.key.remoteJid) || '';
        let text = body.body || body.text || (body.data && body.data.message && (body.data.message.conversation || (body.data.message.extendedTextMessage && body.data.message.extendedTextMessage.text))) || '';
        from = String(from).split('@')[0].replace(/\D/g, '').substring(0, 20) || 'unknown';
        text = String(text || '').trim();

        try {
            const { handleIncoming } = require('./whatsapp-packing-bot');
            const { readJsonSync, writeJson } = require('./data');
            const reply = await handleIncoming(
                { from: from, body: text },
                (phone, msg) => msg,
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
            sendJson(res, { ok: true, reply: reply || 'Ok.', from });
        } catch (e) {
            sendJson(res, { ok: false, error: (e.message || String(e)), reply: 'Desculpe, ocorreu um erro. Digite *troca* para recomeçar.' });
        }
        return true;
    }

    // ---- Webhook: WhatsApp Bot → Packing (troca completa) ----
    if (urlPath === '/api/whatsapp/packing-registro' && method === 'POST') {
        const body = await parseBody(req);
        const { numeroPm, quantidadeImpressoes, tecnico, dataHora, phone } = body;
        if (!numeroPm || tecnico == null || tecnico === '') {
            sendErr(res, 400, 'Faltam numeroPm ou tecnico');
            return true;
        }
        const pm = /^PM\s*([1-6])$/i.test(String(numeroPm).trim())
            ? 'PM ' + String(numeroPm).match(/([1-6])/)[1]
            : (/^[1-6]$/.test(String(numeroPm).trim()) ? 'PM ' + String(numeroPm).trim() : 'PM 1');
        const qtd = Math.max(0, parseInt(String(quantidadeImpressoes || 0), 10) || 0);
        const troca = {
            id: 'pm_wa_' + Date.now(),
            dataHora: dataHora || new Date().toISOString(),
            numeroPm: pm,
            quantidadeImpressoes: qtd,
            tecnico: String(tecnico || '').trim().substring(0, 100),
            origem: 'whatsapp',
            phone: phone ? String(phone).replace(/\D/g, '').substring(0, 20) : undefined
        };
        let trocas = [];
        try {
            const data = readJsonSync(PACKING_TROCAS_FILE, []);
            trocas = Array.isArray(data) ? data : (data.trocas || []);
        } catch (e) {
            trocas = [];
        }
        trocas.unshift(troca);
        try {
            await writeJson(PACKING_TROCAS_FILE, trocas);
            sendJson(res, { ok: true, message: 'Troca registrada via WhatsApp', troca });
        } catch (e) {
            sendErr(res, 500, 'Erro ao salvar');
        }
        return true;
    }

    // ---- Lista de rotas (dev) ----
    if (urlPath === '/api' && method === 'GET') {
        sendJson(res, {
            message: 'Backend Projeto Vida / AXIS',
            endpoints: [
                'GET  /health, /ping',
                'GET  /data/axis-seed, /data/axis-seed.json',
                'GET  /api/backup',
                'POST /api/backup',
                'GET  /api/config/alertas',
                'POST /api/config/alertas',
                'GET  /api/config/tecnicos',
                'POST /api/config/tecnicos',
                'POST /api/manutencoes/salvar-pdf',
                'GET  /api/packing/trocas',
                'POST /api/packing/troca',
                'POST /api/whatsapp/packing-registro',
                'POST /api/whatsapp/packing-webhook'
            ]
        });
        return true;
    }

    return false;
}

module.exports = { handleApi };
