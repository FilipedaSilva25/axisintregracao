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
    try {
        console.log(`${req.method} ${req.url}`);

        // Remove query string e decodifica a URL (para lidar com espaços e caracteres especiais)
        let urlPath = req.url.split('?')[0];
        
        try {
            // Tenta decodificar a URL - pode falhar se já estiver decodificada
            urlPath = decodeURIComponent(urlPath);
        } catch (e) {
            // Se falhar, tenta decodificar com escape
            try {
                urlPath = decodeURIComponent(escape(urlPath));
            } catch (e2) {
                // Se ainda falhar, usa o caminho original
                console.warn('Aviso: Não foi possível decodificar URL:', urlPath);
            }
        }
        
        // Remove query string e normaliza a URL
        let filePath = '.' + urlPath;
        
        // Se for a raiz, serve index.html
        if (filePath === './' || filePath === '.') {
            filePath = './index.html';
        }

        // Normaliza o caminho (resolve .. e .)
        // Usa path.resolve para garantir caminho absoluto correto
        filePath = path.resolve(__dirname, filePath);
        
        // Segurança: garante que o arquivo está dentro do diretório do projeto
        const projectRoot = path.resolve(__dirname);
        if (!filePath.startsWith(projectRoot)) {
            console.error(`❌ Tentativa de acesso fora do diretório: ${filePath}`);
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
                    // Arquivo não encontrado
                    console.error(`❌ Arquivo não encontrado: ${filePath}`);
                    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(`<h1>404 - Arquivo não encontrado</h1><p>Arquivo: ${path.relative(projectRoot, filePath)}</p><p>URL: ${req.url}</p>`, 'utf-8');
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
                        'Content-Type': contentType + '; charset=utf-8',
                        'Cache-Control': 'no-cache'
                    });
                } else {
                    res.writeHead(200, { 'Content-Type': contentType });
                }
                res.end(content, encoding === 'utf8' ? 'utf-8' : undefined);
            }
        });
    } catch (err) {
        console.error('❌ Erro ao processar requisição:', err);
        if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>Erro interno do servidor</h1>', 'utf-8');
        }
    }
});

server.listen(PORT, () => {
    console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📂 Servindo arquivos de: ${__dirname}`);
    console.log(`\n✨ Abra seu navegador em: http://localhost:${PORT}\n`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Erro: A porta ${PORT} já está em uso!`);
        console.log(`💡 Tente fechar outros processos usando a porta ${PORT} ou altere a porta no server.js\n`);
    } else {
        console.error(`\n❌ Erro ao iniciar servidor: ${err.message}\n`);
    }
    process.exit(1);
});
