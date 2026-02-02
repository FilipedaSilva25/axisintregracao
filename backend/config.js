/**
 * Configuração central do backend - Projeto Vida / AXIS
 * Usa variáveis de ambiente quando disponíveis (deploy online).
 */

const path = require('path');

const PORT = Number(process.env.PORT) || 3006;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ROOT_DIR = path.resolve(__dirname, '..');

const DATA_DIR = path.join(ROOT_DIR, 'config', 'data');
const PAGES_DIR = path.join(ROOT_DIR, 'pages');
const CONFIG_MODULOS = path.join(ROOT_DIR, 'Novos Módulos', 'config');

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'application/font-woff',
    '.woff2': 'application/font-woff2',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.txt': 'text/plain',
    '.xml': 'application/xml'
};

const HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

module.exports = {
    PORT,
    NODE_ENV,
    ROOT_DIR,
    DATA_DIR,
    PAGES_DIR,
    CONFIG_MODULOS,
    MIME_TYPES,
    HEADERS
};
