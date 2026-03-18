/**
 * Servidor principal - Projeto Vida / AXIS
 * Backend completo: API + arquivos estáticos.
 * Porta padrão 3006 (ou variável de ambiente PORT).
 * Para deploy online: use Render, Railway, etc. (ver docs/BACKEND_DEPLOY.md)
 */

require('dotenv').config();
const http = require('http');
const { PORT, ROOT_DIR } = require('./backend/config');
const { handleApi } = require('./backend/routes');
const { serveFile, normalizeUrlPath } = require('./backend/static');

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

function onListening() {
    const actualPort = server.address().port;
    console.log('\n🚀 Servidor Projeto Vida / AXIS');
    console.log(`   http://localhost:${actualPort}`);
    if (actualPort !== PORT) {
        console.log(`   (porta ${PORT} estava em uso)`);
    }
    console.log(`   Pasta: ${ROOT_DIR}`);
    console.log('\n🤖 Bot WhatsApp: http://localhost:' + actualPort + '/pages/whatsapp-qr.html');
    console.log('✨ Abra o navegador em: http://localhost:' + actualPort + '\n');
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
}

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        tryNextPort(error.port);
    } else {
        console.error('\n❌ Erro:', error.message);
        process.exit(1);
    }
});

const MAX_PORT_ATTEMPTS = 6; // 3006, 3007, ... 3011
let portAttempt = 0;

function tryNextPort(lastPort) {
    portAttempt++;
    const tryPort = PORT + portAttempt;
    if (tryPort > PORT + MAX_PORT_ATTEMPTS - 1) {
        console.error(`\n❌ Portas ${PORT} a ${PORT + MAX_PORT_ATTEMPTS - 1} em uso. Feche outros processos ou altere PORT no .env\n`);
        process.exit(1);
    }
    console.log(`   Porta ${lastPort} em uso, tentando ${tryPort}...`);
    server.listen(tryPort, '0.0.0.0', onListening);
}

server.listen(PORT, '0.0.0.0', onListening);

process.on('uncaughtException', (e) => console.error('❌ Uncaught:', e));
process.on('unhandledRejection', (r) => console.error('❌ Rejection:', r));
