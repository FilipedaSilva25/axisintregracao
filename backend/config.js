/**
 * Configuração central do backend - Projeto Vida / AXIS
 * Usa variáveis de ambiente quando disponíveis (deploy online).
 */

const path = require('path');

const PORT = Number(process.env.PORT) || 3006;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ROOT_DIR = path.resolve(__dirname, '..');

/** Versão exibida no site (Configurações, GET /health): campo "version" em package.json na raiz. Em cada entrega relevante suba o semver (ex.: 2.9.0 → 2.9.1). Opcional: AXIS_APP_VERSION no .env sobrescreve. Atualize também config/data/axis-news.json (featuredVersion, listUpdatedAt, entradas com summaryIntro/bullets). */
let AXIS_APP_VERSION = String(process.env.AXIS_APP_VERSION || '').trim();
if (!AXIS_APP_VERSION) {
    try {
        AXIS_APP_VERSION = require('../package.json').version || '0.0.0';
    } catch (_) {
        AXIS_APP_VERSION = '0.0.0';
    }
}

const DATA_DIR = path.join(ROOT_DIR, 'config', 'data');
const PAGES_DIR = path.join(ROOT_DIR, 'pages');
const CONFIG_MODULOS = path.join(ROOT_DIR, 'Novos Módulos', 'config');

/** Pasta de armazenamento de documentos (manuais, firmware, etc.)
 *  Para 2TB+ use variável DOCS_STORAGE_DIR apontando para disco/NAS:
 *  Ex: D:\\axis-documentacao ou /mnt/2tb-storage/docs
 */
const DOCS_STORAGE_DIR = process.env.DOCS_STORAGE_DIR || path.join(ROOT_DIR, 'docs-storage');
/** Ficheiro JSON com a lista de documentos (títulos, categorias, IDs). */
const DOCS_METADATA_FILE = process.env.DOCS_METADATA_FILE || path.join(DATA_DIR, 'axis-docs.json');

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
    '.xml': 'application/xml',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.bin': 'application/octet-stream',
    '.zeb': 'application/octet-stream',
    '.zpl': 'text/plain',
    '.lbl': 'application/octet-stream',
    '.nlbl': 'application/octet-stream'
};

/** Número oficial do bot AXIS (WhatsApp da empresa) - usado nas instruções e validação */
const AXIS_BOT_NUMBER = process.env.AXIS_BOT_NUMBER || '5548991578172';

const HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    /** Reduz vazamento de URL completa para terceiros; não bloqueia F12 */
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    /** Alinhado à política da Apple/WebKit: câmara só em contexto seguro; o header reforça o meta no HTML. */
    'Permissions-Policy': 'camera=(self), microphone=()',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Content-Disposition'
};

/** Headers para GET /api/docs/.../file — permite iframe na mesma origem (pré-visualização no modal). */
const HEADERS_DOC_FILE_PREVIEW = {
    ...HEADERS,
    'X-Frame-Options': 'SAMEORIGIN'
};

module.exports = {
    PORT,
    NODE_ENV,
    AXIS_APP_VERSION,
    AXIS_BOT_NUMBER,
    ROOT_DIR,
    DATA_DIR,
    PAGES_DIR,
    CONFIG_MODULOS,
    DOCS_STORAGE_DIR,
    DOCS_METADATA_FILE,
    MIME_TYPES,
    HEADERS,
    HEADERS_DOC_FILE_PREVIEW
};
