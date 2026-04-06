/**
 * Servidor principal - Projeto Vida / AXIS
 * Backend completo: API + arquivos estáticos.
 * Porta padrão 3006 (ou variável de ambiente PORT).
 * Para deploy online: Render, Railway, VPS, Hostinger (ver docs/BACKEND_DEPLOY.md e docs/DEPLOY_HOSTINGER.md)
 *
 * Variáveis: ver backend/axis-load-dotenv.js (.env, .env.2, (2).env, " (2).env" com espaço, config/selbetti.env).
 */

const path = require('path');
const fs = require('fs');
const rootDir = path.resolve(__dirname);
const { loadAxisDotenv, logAxisDotenvSummary } = require('./backend/axis-load-dotenv');
const _axisEnv = loadAxisDotenv(rootDir);
logAxisDotenvSummary(_axisEnv.results);
const http = require('http');
const { PORT, ROOT_DIR, DATA_DIR, AXIS_APP_VERSION } = require('./backend/config');
const { handleApi } = require('./backend/routes');
const { serveFile, normalizeUrlPath } = require('./backend/static');

/** Garantir que a pasta de dados e ficheiros do Bot WhatsApp existem (AXIS BOT 100%) */
function ensureBotDataDir() {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        const packingFile = path.join(DATA_DIR, 'packing-trocas.json');
        const packingPrevFile = path.join(DATA_DIR, 'packing-preventivas.json');
        const bancadasFile = path.join(DATA_DIR, 'bancadas-status.json');
        if (!fs.existsSync(packingFile)) {
            fs.writeFileSync(packingFile, JSON.stringify([], null, 2), 'utf8');
        }
        if (!fs.existsSync(packingPrevFile)) {
            fs.writeFileSync(packingPrevFile, JSON.stringify([], null, 2), 'utf8');
        }
        if (!fs.existsSync(bancadasFile)) {
            fs.writeFileSync(bancadasFile, JSON.stringify({ bancadas: {}, updatedAt: null }, null, 2), 'utf8');
        }
        const browserUsersFile = path.join(DATA_DIR, 'axis-browser-users.json');
        if (!fs.existsSync(browserUsersFile)) {
            fs.writeFileSync(browserUsersFile, JSON.stringify({ version: 1, byLogin: {}, updatedAt: null }, null, 2), 'utf8');
        }
    } catch (e) {
        console.warn('Aviso: não foi possível criar pasta/ficheiros de dados do bot:', e.message);
    }
}
ensureBotDataDir();

const server = http.createServer(async (req, res) => {
    const url = (req.url || '/').split('?')[0];
    console.log(`[${(req.method || 'GET').toUpperCase()}] ${url}`);
    const rawPath = (req.url || '/').split('?')[0];
    let urlPath = normalizeUrlPath(rawPath);
    /* Trailing slash pode fazer falhar match exato das rotas API (ex.: /api/persist/browser-users/). */
    if (urlPath.length > 1) urlPath = urlPath.replace(/\/+$/, '');

    if (req.method === 'OPTIONS') {
        res.writeHead(200, require('./backend/config').HEADERS);
        res.end();
        return;
    }

    const handled = await handleApi(req, res, urlPath);
    if (!handled) {
        serveFile(req, res, urlPath);
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('\n🚀 Servidor Projeto Vida / AXIS');
    console.log(`   Versão: ${AXIS_APP_VERSION}`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`   Pasta: ${ROOT_DIR}`);
    console.log('\n🤖 Bot WhatsApp: http://localhost:' + PORT + '/pages/whatsapp-qr.html');
    console.log('✨ Abra o navegador em: http://localhost:' + PORT + '\n');
    let cloudApi = false;
    try {
        const cloud = require('./backend/whatsapp-cloud-api');
        cloudApi = cloud.isConfigured();
    } catch (e) {}
    if (cloudApi) {
        console.log('✅ Bot WhatsApp Cloud API (24/7) – webhook: /api/whatsapp/cloud-webhook');
    } else {
        try {
            const { startConnector } = require('./backend/whatsapp-connector');
            startConnector().then(() => {}).catch(e => console.warn('WhatsApp Baileys: ', e.message));
        } catch (e) {
            console.warn('⚠️ WhatsApp: npm install para Baileys. Ou use Cloud API (variáveis de ambiente).');
        }
    }
    const sbUser = (process.env.SELBETTI_PORTAL_USER || '').trim();
    const sbPass = (process.env.SELBETTI_PORTAL_PASSWORD || process.env.SELBETTI_PORTAL_PASS || '').trim();
    if (sbUser && sbPass) {
        console.log('✅ Selbetti (op.8 WhatsApp): credenciais carregadas — Playwright abre chamado no *Portal do Cliente*.');
    } else {
        console.warn(
            '⚠️ Selbetti: sem SELBETTI_PORTAL_USER/PASSWORD no processo — op.8 só grava em fila local. ' +
                'Preencha as linhas em ` (2).env` (atenção ao espaço no nome) ou crie `config/selbetti.env` a partir de config/selbetti.env.example.'
        );
    }
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ Porta ${PORT} em uso. Feche outro processo ou altere PORT no .env\n`);
    } else {
        console.error('\n❌ Erro:', error.message);
    }
    process.exit(1);
});

process.on('uncaughtException', (e) => console.error('❌ Uncaught:', e));
process.on('unhandledRejection', (r) => console.error('❌ Rejection:', r));
