/**
 * API HTTP interna AXIS — abertura de chamado Selbetti (Portal do Cliente via Playwright / webhook / fila).
 *
 * A WAP (wap2/ultimas.asp) é o canal do técnico; a OS é criada no portal cliente. Esta API dispara o mesmo motor que o WhatsApp op.8.
 *
 * Rotas:
 *   GET  /api/selbetti-chamado/diagnostico  — estado das variáveis (sem expor segredos)
 *   POST /api/selbetti-chamado/submit       — corpo JSON = payload do chamado
 *   GET  /api/selbetti-chamado/fila         — últimos registos na fila local
 *   POST /api/selbetti-chamado/retry        — { "id": "AXIS-SB-..." } reenvia um item da fila
 *   GET  /api/selbetti-chamado/playwright-log?lines=80 — últimas linhas do log Playwright
 *   POST /api/selbetti-chamado/test-login   — só testa login no portal (demora ~30–60s)
 *   GET  /api/selbetti-chamado/status       — notas de integração (JSON)
 *
 * Segurança: se SELBETTI_SUBMIT_API_KEY estiver definido, envie cabeçalho X-AXIS-Selbetti-Key ou X-Api-Key.
 */

const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { DATA_DIR } = require('./config');
const { submitSelbettiChamado } = require('./selbetti-chamado-submit');
const { normalizeSelbettiCodigoTypo } = require('./selbetti-codigo-normalize');

const FILA_FILE = path.join(DATA_DIR, 'selbetti-chamados-fila.json');
const MAX_BODY = 256 * 1024;

function parseBodyLimited(req) {
    return new Promise((resolve) => {
        let body = '';
        let total = 0;
        let tooLarge = false;
        req.on('data', (chunk) => {
            if (tooLarge) return;
            total += chunk.length;
            if (total > MAX_BODY) {
                tooLarge = true;
                resolve({ __parseError: 'too_large' });
                return;
            }
            body += chunk.toString();
        });
        req.on('end', () => {
            if (tooLarge) return;
            if (!body) return resolve({});
            try {
                resolve(JSON.parse(body));
            } catch (_) {
                resolve({ __parseError: 'invalid_json' });
            }
        });
        req.on('error', () => resolve({ __parseError: 'read' }));
    });
}

function requestApiKey(req) {
    const h = req.headers || {};
    const a = h['x-axis-selbetti-key'] || h['x-api-key'] || h['authorization'] || '';
    if (typeof a === 'string' && /^Bearer\s+/i.test(a)) {
        return a.replace(/^Bearer\s+/i, '').trim();
    }
    return String(a || '').trim();
}

function authOk(req) {
    const expected = (process.env.SELBETTI_SUBMIT_API_KEY || '').trim();
    if (!expected) return true;
    return requestApiKey(req) === expected;
}

function readFilaSafe() {
    try {
        if (!fs.existsSync(FILA_FILE)) return [];
        const raw = fs.readFileSync(FILA_FILE, 'utf8');
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch (_) {
        return [];
    }
}

/**
 * Normaliza corpo HTTP / WhatsApp para o formato esperado por submitSelbettiChamado.
 */
function normalizeChamadoPayload(body) {
    if (!body || typeof body !== 'object') return null;
    const tipoMap = { 1: 'consumo', 2: 'equipamento', 3: 'software' };
    let tipo = String(body.tipo || '').toLowerCase();
    if (tipoMap[body.tipo]) tipo = tipoMap[body.tipo];
    if (!['consumo', 'equipamento', 'software'].includes(tipo)) tipo = 'equipamento';

    const nome = String(body.nome || body.name || '').trim();
    const email = String(body.email || '').trim();
    const telefone = String(body.telefone || body.phone || body.tel || '').trim();
    const problema = String(body.problema || body.descricao || body.description || '').trim();
    const selb = normalizeSelbettiCodigoTypo(String(body.selb || body.SELB || '').trim());
    const serie = normalizeSelbettiCodigoTypo(String(body.serie || body.serial || body.serieNumero || '').trim());
    let prioridade = String(body.prioridade || 'NORMAL').toUpperCase();
    if (!['NORMAL', 'ALTA', 'CRITICA', 'CRÍTICA'].includes(prioridade)) prioridade = 'NORMAL';
    if (prioridade === 'CRÍTICA') prioridade = 'CRITICA';

    if (nome.length < 2) return { error: 'Campo nome é obrigatório (mín. 2 caracteres).' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'E-mail inválido.' };
    if (problema.length < 3) return { error: 'Campo problema/descrição é obrigatório (mín. 3 caracteres).' };

    return {
        tipo,
        selb,
        serie,
        nome: nome.substring(0, 120),
        email: email.substring(0, 120),
        telefone: telefone.substring(0, 40),
        prioridade,
        problema: problema.substring(0, 4000),
        whatsappPhone: String(body.whatsappPhone || body.from || 'api').substring(0, 32),
        source: String(body.source || 'axis_http_api').substring(0, 64),
        createdAt: body.createdAt || new Date().toISOString()
    };
}

/**
 * @returns {Promise<boolean>} true se tratou o pedido
 */
async function handleSelbettiChamadoApi(req, res, urlPath, method, sendJson, sendErr) {
    const base = '/api/selbetti-chamado';
    if (urlPath.indexOf(base) !== 0) return false;

    if (urlPath === `${base}/diagnostico` && method === 'GET') {
        const user = !!(process.env.SELBETTI_PORTAL_USER || '').trim();
        const pass = !!(process.env.SELBETTI_PORTAL_PASSWORD || process.env.SELBETTI_PORTAL_PASS || '').trim();
        let playwrightPkg = false;
        try {
            require.resolve('playwright');
            playwrightPkg = true;
        } catch (_) {}
        const webhook = !!(process.env.SELBETTI_CHAMADO_WEBHOOK_URL || '').trim();
        const explicitOff =
            process.env.SELBETTI_USE_PLAYWRIGHT === '0' ||
            String(process.env.SELBETTI_USE_PLAYWRIGHT || '').toLowerCase() === 'false';
        const usePw = !explicitOff && user && pass;
        const fila = readFilaSafe();
        const rawD = process.env.SELBETTI_PLAYWRIGHT_START_DELAY_MS;
        let playwrightStartDelayMs =
            rawD !== undefined && String(rawD).trim() !== ''
                ? parseInt(String(rawD).trim(), 10)
                : 300000;
        if (!Number.isFinite(playwrightStartDelayMs) || playwrightStartDelayMs < 0) playwrightStartDelayMs = 300000;
        sendJson(res, {
            ok: true,
            selbetti: {
                portalUserConfigured: user,
                portalPasswordConfigured: pass,
                playwrightStartDelayMs,
                playwrightPackageInstalled: playwrightPkg,
                playwrightWillRun: usePw && !webhook,
                webhookConfigured: webhook,
                playwrightExplicitlyDisabled: explicitOff,
                filaLocalCount: fila.length,
                lastFilaStatus: fila[0] ? fila[0].status : null,
                lastFilaId: fila[0] ? fila[0].id : null,
                playwrightChannel: (process.env.SELBETTI_PLAYWRIGHT_CHANNEL || '').trim() || null,
                whatsappNonBlocking:
                    'Com Baileys ou Cloud API, após SIM o utilizador recebe resposta imediata e o resultado do Selbetti numa segunda mensagem.',
                note:
                    'A OS abre-se no Portal do Cliente (canal_cliente_novo). A WAP (técnico) lista ordens conforme regras Selbetti — pode haver atraso ou filtro por técnico/cliente. Dica: SELBETTI_PLAYWRIGHT_CHANNEL=chrome e HEADED=1 para depuração.'
            },
            apiSubmitKeyRequired: !!(process.env.SELBETTI_SUBMIT_API_KEY || '').trim()
        });
        return true;
    }

    if (urlPath === `${base}/fila` && method === 'GET') {
        if (!authOk(req)) {
            sendErr(res, 401, 'Defina cabeçalho X-AXIS-Selbetti-Key (ou configure SELBETTI_SUBMIT_API_KEY no .env).');
            return true;
        }
        const limit = Math.min(100, Math.max(1, parseInt(new URL(req.url || '', 'http://x').searchParams.get('limit') || '30', 10)));
        const filaFull = readFilaSafe();
        sendJson(res, { ok: true, total: filaFull.length, items: filaFull.slice(0, limit) });
        return true;
    }

    if (urlPath === `${base}/submit` && method === 'POST') {
        if (!authOk(req)) {
            sendErr(res, 401, 'Chave API inválida ou em falta. Use X-AXIS-Selbetti-Key ou desative a chave removendo SELBETTI_SUBMIT_API_KEY.');
            return true;
        }
        const body = await parseBodyLimited(req);
        if (body.__parseError === 'too_large') {
            sendErr(res, 413, 'Corpo JSON demasiado grande');
            return true;
        }
        if (body.__parseError === 'invalid_json') {
            sendErr(res, 400, 'JSON inválido');
            return true;
        }
        const payload = normalizeChamadoPayload(body);
        if (payload.error) {
            sendErr(res, 400, payload.error);
            return true;
        }
        try {
            const result = await submitSelbettiChamado(payload);
            sendJson(res, { ok: result.ok !== false, ...result });
        } catch (e) {
            sendErr(res, 500, String(e.message || e));
        }
        return true;
    }

    if (urlPath === `${base}/playwright-log` && method === 'GET') {
        if (!authOk(req)) {
            sendErr(res, 401, 'Chave API em falta.');
            return true;
        }
        const lines = Math.min(250, Math.max(1, parseInt(new URL(req.url || '', 'http://x').searchParams.get('lines') || '80', 10)));
        const logPath = path.join(DATA_DIR, 'selbetti-playwright.log');
        let tail = '';
        try {
            if (fs.existsSync(logPath)) {
                const all = fs.readFileSync(logPath, 'utf8').split(/\r?\n/);
                tail = all.slice(-lines).join('\n');
            }
        } catch (e) {
            tail = '(erro ao ler log: ' + (e.message || e) + ')';
        }
        sendJson(res, { ok: true, path: logPath, lines, tail });
        return true;
    }

    if (urlPath === `${base}/test-login` && method === 'POST') {
        if (!authOk(req)) {
            sendErr(res, 401, 'Chave API inválida ou em falta.');
            return true;
        }
        try {
            const pw = require('./selbetti-portal-playwright');
            const r = await pw.testSelbettiPortalLoginOnly();
            sendJson(res, { ok: r.ok, ...r });
        } catch (e) {
            sendErr(res, 500, String(e.message || e));
        }
        return true;
    }

    if (urlPath === `${base}/retry` && method === 'POST') {
        if (!authOk(req)) {
            sendErr(res, 401, 'Chave API inválida ou em falta.');
            return true;
        }
        const body = await parseBodyLimited(req);
        const id = String(body.id || body.ref || '').trim();
        if (!id) {
            sendErr(res, 400, 'Indique { "id": "AXIS-SB-..." }');
            return true;
        }
        const fila = readFilaSafe();
        const item = fila.find((x) => x && x.id === id);
        if (!item) {
            sendErr(res, 404, 'ID não encontrado na fila');
            return true;
        }
        const payload = {
            tipo: item.tipo || 'equipamento',
            selb: item.selb || '',
            serie: item.serie || '',
            nome: item.nome || '',
            email: item.email || '',
            telefone: item.telefone || '',
            prioridade: item.prioridade || 'NORMAL',
            problema: item.problema || '',
            whatsappPhone: item.whatsappPhone || 'retry',
            source: 'axis_fila_retry',
            createdAt: new Date().toISOString()
        };
        try {
            const result = await submitSelbettiChamado(payload);
            sendJson(res, { ok: true, retriedId: id, ...result });
        } catch (e) {
            sendErr(res, 500, String(e.message || e));
        }
        return true;
    }

    sendErr(
        res,
        404,
        'Sub-rota Selbetti desconhecida. Use /status, /diagnostico, /submit, /fila, /retry, /playwright-log ou /test-login.'
    );
    return true;
}

module.exports = { handleSelbettiChamadoApi, normalizeChamadoPayload, readFilaSafe };
