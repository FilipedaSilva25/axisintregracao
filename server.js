/**
 * Servidor principal - Projeto Vida / AXIS
 * Backend completo: API + arquivos estáticos.
 * Porta padrão 3006 (ou variável de ambiente PORT).
 * Para deploy online: use Render, Railway, etc. (ver docs/BACKEND_DEPLOY.md)
 */

const http = require('http');
const { PORT, ROOT_DIR } = require('./backend/config');
const { handleApi } = require('./backend/routes');
const { serveFile, normalizeUrlPath } = require('./backend/static');

const server = http.createServer(async (req, res) => {
    console.log(`${req.method} ${req.url}`);
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
    console.log(`   http://localhost:${PORT}`);
    console.log(`   Pasta: ${ROOT_DIR}`);
    console.log('\n✨ Abra o navegador em: http://localhost:' + PORT + '\n');
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
