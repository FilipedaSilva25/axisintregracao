/**
 * Servidor principal - Projeto Vida / AXIS
 * Backend completo: API + arquivos estáticos.
 * Porta padrão 3006 (ou variável de ambiente PORT).
 * Para deploy online: Render, Railway, VPS, Hostinger (ver docs/BACKEND_DEPLOY.md e docs/DEPLOY_HOSTINGER.md)
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
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
    } catch (e) {
        console.warn('Aviso: não foi possível criar pasta/ficheiros de dados do bot:', e.message);
    }
}
ensureBotDataDir();

const server = http.createServer(async (req, res) => {
    const url = (req.url || '/').split('?')[0];
    console.log(`[${(req.method || 'GET').toUpperCase()}] ${url}`);
    const rawPath = (req.url || '/').split('?')[0];
    const urlPath = normalizeUrlPath(rawPath);

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
