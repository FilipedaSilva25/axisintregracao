const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3006;

// Mapeamento de tipos MIME
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'application/font-woff',
    '.woff2': 'application/font-woff2',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf'
};

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    // Headers de segurança e compatibilidade
    const headers = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Tratar requisições OPTIONS (CORS preflight)
    if (req.method === 'OPTIONS') {
        res.writeHead(200, headers);
        res.end();
        return;
    }

    // Remove query string e decodifica a URL (para lidar com espaços e caracteres especiais)
    let urlPath = req.url.split('?')[0];
    
    // Decodifica a URL de forma mais robusta
    try {
        // Primeiro tenta decodificar normalmente
        urlPath = decodeURIComponent(urlPath);
    } catch (e) {
        try {
            // Se falhar, tenta com escape
            urlPath = decodeURIComponent(escape(urlPath));
        } catch (e2) {
            try {
                // Última tentativa: usar unescape
                urlPath = unescape(urlPath);
            } catch (e3) {
                // Se tudo falhar, usa o caminho original
                console.warn('Aviso: Não foi possível decodificar URL:', urlPath);
            }
        }
    }
    
    // Normaliza caracteres especiais comuns
    urlPath = urlPath.replace(/%C3%A7/g, 'ç')
                     .replace(/%C3%A3/g, 'ã')
                     .replace(/%C3%A1/g, 'á')
                     .replace(/%C3%A9/g, 'é')
                     .replace(/%C3%AD/g, 'í')
                     .replace(/%C3%B3/g, 'ó')
                     .replace(/%C3%BA/g, 'ú')
                     .replace(/%C3%A0/g, 'à')
                     .replace(/%C3%B5/g, 'õ')
                     .replace(/%C3%AA/g, 'ê')
                     .replace(/%C3%B4/g, 'ô');
    
    const dataDir = path.join(__dirname, 'config', 'data');
    
    // ---- API / Dados (banco JSON) ----
    const sendJson = (obj) => {
        res.writeHead(200, { ...headers, 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(obj), 'utf-8');
    };
    const sendErr = (code, msg) => {
        res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: msg }), 'utf-8');
    };
    
    if (req.method === 'GET' && (urlPath === '/data/axis-seed.json' || urlPath === '/data/axis-seed')) {
        const fp = path.join(dataDir, 'axis-seed.json');
        fs.readFile(fp, 'utf8', (err, data) => {
            if (err) { sendErr(404, 'axis-seed.json não encontrado'); return; }
            try { sendJson(JSON.parse(data)); } catch (e) { sendErr(500, 'JSON inválido'); }
        });
        return;
    }
    if (req.method === 'GET' && (urlPath === '/api/backup' || urlPath === '/api/backup.json')) {
        const fp = path.join(dataDir, 'axis-backup.json');
        fs.readFile(fp, 'utf8', (err, data) => {
            if (err) { sendJson({}); return; }
            try { sendJson(JSON.parse(data || '{}')); } catch (e) { sendJson({}); }
        });
        return;
    }
    if (req.method === 'POST' && urlPath === '/api/backup') {
        let body = '';
        req.on('data', (chunk) => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const parsed = JSON.parse(body || '{}');
                const fp = path.join(dataDir, 'axis-backup.json');
                fs.writeFile(fp, JSON.stringify(parsed, null, 2), 'utf8', (err) => {
                    if (err) { sendErr(500, 'Erro ao salvar backup'); return; }
                    sendJson({ ok: true, message: 'Backup salvo' });
                });
            } catch (e) { sendErr(400, 'JSON inválido'); }
        });
        return;
    }
    if (req.method === 'GET' && (urlPath === '/health' || urlPath === '/ping')) {
        sendJson({ ok: true, port: PORT });
        return;
    }
    
    // Remove query string e normaliza a URL
    let filePath = '.' + urlPath;
    
    // Se for a raiz, serve index.html
    if (filePath === './' || filePath === '.') {
        filePath = './index.html';
    }

    // Normaliza o caminho (resolve .. e .)
    // Usa path.posix para manter compatibilidade com URLs
    filePath = path.normalize(filePath);
    
    // Segurança: prevenir directory traversal
    if (filePath.includes('..')) {
        res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>403 - Acesso Negado</h1>', 'utf-8');
        return;
    }

    // Obtém a extensão do arquivo
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    // Define se é arquivo de texto (precisa de encoding UTF-8)
    const isTextFile = ['.html', '.css', '.js', '.json', '.txt', '.xml'].includes(extname);
    const encoding = isTextFile ? 'utf8' : null;

    // Lê o arquivo
    fs.readFile(filePath, encoding, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // Arquivo não encontrado - tenta encontrar na pasta pages
                console.error(`❌ Arquivo não encontrado: ${filePath}`);
                
                // Se o arquivo não foi encontrado, tenta na pasta pages
                // Verifica se já está procurando em pages ou se precisa adicionar
                let pagesPath;
                if (filePath.includes('pages')) {
                    // Já está em pages, mas não encontrou - pode ser problema de encoding
                    pagesPath = filePath;
                } else {
                    // Não está em pages, adiciona o caminho
                    pagesPath = path.join('.', 'pages', urlPath.replace(/^\//, ''));
                }
                
                if (!filePath.includes('pages') || error) {
                    const fileName = path.basename(urlPath);
                    const pagesDir = path.join('.', 'pages');
                    
                    // Lista arquivos na pasta pages e tenta encontrar por nome similar
                    fs.readdir(pagesDir, (dirErr, files) => {
                        if (dirErr) {
                            console.error(`❌ Erro ao ler pasta pages: ${dirErr}`);
                            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                            res.end(`<h1>404 - Arquivo não encontrado</h1><p>Arquivo: ${filePath}</p>`, 'utf-8');
                            return;
                        }
                        
                        // Tenta encontrar arquivo exato ou similar
                        let foundFile = null;
                        const searchName = fileName.toLowerCase().replace(/[^a-z0-9]/g, '');
                        
                        for (const file of files) {
                            const fileLower = file.toLowerCase().replace(/[^a-z0-9]/g, '');
                            if (file === fileName || fileLower === searchName || 
                                (fileLower.includes('manuten') && fileLower.includes('preventiva'))) {
                                foundFile = file;
                                break;
                            }
                        }
                        
                        if (foundFile) {
                            const pagesPath = path.join(pagesDir, foundFile);
                            console.log(`✅ Arquivo encontrado: ${pagesPath}`);
                            
                            fs.readFile(pagesPath, encoding, (err2, content2) => {
                                if (!err2 && content2) {
                                    if (extname === '.html' || extname === '.css' || extname === '.js') {
                                        res.writeHead(200, { 
                                            ...headers,
                                            'Content-Type': contentType + '; charset=utf-8',
                                            'Cache-Control': 'no-cache'
                                        });
                                    } else {
                                        res.writeHead(200, { 
                                            ...headers,
                                            'Content-Type': contentType 
                                        });
                                    }
                                    res.end(content2, 'utf-8');
                                } else {
                                    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                                    res.end(`<h1>404 - Erro ao ler arquivo</h1>`, 'utf-8');
                                }
                            });
                        } else {
                            console.error(`❌ Arquivo não encontrado em pages. Arquivos disponíveis: ${files.join(', ')}`);
                            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                            res.end(`<h1>404 - Arquivo não encontrado</h1><p>Procurado: ${fileName}</p><p>Arquivos em pages: ${files.join(', ')}</p>`, 'utf-8');
                        }
                    });
                    return; // Retorna aqui para não executar o código abaixo
                } else {
                    // Já estava procurando em pages e não encontrou
                    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(`<h1>404 - Arquivo não encontrado</h1><p>Arquivo: ${filePath}</p><p>URL original: ${req.url}</p>`, 'utf-8');
                }
            } else {
                // Erro do servidor
                console.error(`❌ Erro do servidor: ${error.code} - ${filePath}`);
                res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`<h1>Erro do servidor</h1><p>${error.code}</p>`, 'utf-8');
            }
        } else {
            // Sucesso - ajusta Content-Type para arquivos de texto
            if (extname === '.html' || extname === '.css' || extname === '.js') {
                res.writeHead(200, { 
                    ...headers,
                    'Content-Type': contentType + '; charset=utf-8',
                    'Cache-Control': 'no-cache'
                });
            } else {
                res.writeHead(200, { 
                    ...headers,
                    'Content-Type': contentType 
                });
            }
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📂 Servindo arquivos de: ${__dirname}`);
    console.log(`\n✨ Abra seu navegador em: http://localhost:${PORT}\n`);
});

// Tratamento de erros do servidor
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ Erro: A porta ${PORT} já está em uso!`);
        console.error(`💡 Tente encerrar outros processos usando a porta ${PORT} ou mude a porta no arquivo server.js\n`);
    } else {
        console.error(`\n❌ Erro do servidor:`, error);
    }
    process.exit(1);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejeitada:', reason);
});
