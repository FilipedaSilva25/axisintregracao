/**
 * Rotas da API - Projeto Vida / AXIS
 * Todas as rotas retornam true se trataram a requisição; false para deixar o servidor servir estático.
 */

const path = require('path');
const fs = require('fs');
const { DATA_DIR, CONFIG_MODULOS, HEADERS, ROOT_DIR } = require('./config');

const MANUTENCOES_DIR = path.join(ROOT_DIR, 'manutencoes');
const { readJson, writeJson } = require('./data');

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
                'POST /api/manutencoes/salvar-pdf'
            ]
        });
        return true;
    }

    return false;
}

module.exports = { handleApi };
