/**
 * Servir arquivos estáticos com fallback para pasta pages
 */

const fs = require('fs');
const path = require('path');
const { ROOT_DIR, PAGES_DIR, MIME_TYPES, HEADERS } = require('./config');

const TEXT_EXT = ['.html', '.css', '.js', '.json', '.txt', '.xml'];

function normalizeUrlPath(urlPath) {
    let decoded = urlPath;
    try {
        decoded = decodeURIComponent(urlPath);
    } catch (e) {
        try { decoded = decodeURIComponent(escape(urlPath)); } catch (e2) {}
    }
    return decoded
        .replace(/%C3%A7/g, 'ç').replace(/%C3%A3/g, 'ã').replace(/%C3%A1/g, 'á')
        .replace(/%C3%A9/g, 'é').replace(/%C3%AD/g, 'í').replace(/%C3%B3/g, 'ó')
        .replace(/%C3%BA/g, 'ú').replace(/%C3%A0/g, 'à').replace(/%C3%B5/g, 'õ')
        .replace(/%C3%AA/g, 'ê').replace(/%C3%B4/g, 'ô');
}

function serveFile(req, res, urlPath) {
    let filePath = path.join(ROOT_DIR, urlPath.replace(/^\//, '') || '');
    if (filePath === ROOT_DIR || filePath === path.join(ROOT_DIR, '')) {
        filePath = path.join(ROOT_DIR, 'index.html');
    }
    filePath = path.normalize(filePath);

    if (filePath.includes('..') || !filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>403 - Acesso Negado</h1>', 'utf-8');
        return;
    }

    const ext = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const encoding = TEXT_EXT.includes(ext) ? 'utf8' : null;

    fs.readFile(filePath, encoding, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                tryPagesFallback(req, res, urlPath, ext, contentType, encoding);
            } else {
                res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>Erro do servidor</h1>', 'utf-8');
            }
            return;
        }
        const ct = TEXT_EXT.includes(ext)
            ? { ...HEADERS, 'Content-Type': contentType + '; charset=utf-8', 'Cache-Control': 'no-cache' }
            : { ...HEADERS, 'Content-Type': contentType };
        res.writeHead(200, ct);
        res.end(content, 'utf-8');
    });
}

function tryPagesFallback(req, res, urlPath, extname, contentType, encoding) {
    const fileName = path.basename(urlPath);
    fs.readdir(PAGES_DIR, (dirErr, files) => {
        if (dirErr) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>404 - Arquivo não encontrado</h1>', 'utf-8');
            return;
        }
        const searchName = (fileName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        let found = files.find((f) => {
            const fl = f.toLowerCase().replace(/[^a-z0-9]/g, '');
            return f === fileName || fl === searchName ||
                (fl.includes('manuten') && fl.includes('preventiva'));
        });
        if (!found) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>404 - Arquivo não encontrado</h1>', 'utf-8');
            return;
        }
        const pagesPath = path.join(PAGES_DIR, found);
        fs.readFile(pagesPath, encoding, (err2, content2) => {
            if (err2 || !content2) {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>404 - Erro ao ler arquivo</h1>', 'utf-8');
                return;
            }
            const ct = ['.html', '.css', '.js'].includes(extname)
                ? { ...HEADERS, 'Content-Type': contentType + '; charset=utf-8', 'Cache-Control': 'no-cache' }
                : { ...HEADERS, 'Content-Type': contentType };
            res.writeHead(200, ct);
            res.end(content2, 'utf-8');
        });
    });
}

module.exports = { serveFile, normalizeUrlPath };
