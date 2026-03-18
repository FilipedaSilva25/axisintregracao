/**
 * Rotas da API - Projeto Vida / AXIS
 * Todas as rotas retornam true se trataram a requisição; false para deixar o servidor servir estático.
 */

const path = require('path');
const fs = require('fs');
const { DATA_DIR, CONFIG_MODULOS, HEADERS, ROOT_DIR, DOCS_STORAGE_DIR, DOCS_METADATA_FILE } = require('./config');

const MANUTENCOES_DIR = path.join(ROOT_DIR, 'manutencoes');
const { readJson, readJsonSync, writeJson } = require('./data');
const PACKING_TROCAS_FILE = path.join(DATA_DIR, 'packing-trocas.json');
const BANCADAS_STATUS_FILE = path.join(DATA_DIR, 'bancadas-status.json');
const PECAS_ESTOQUE_FILE = path.join(DATA_DIR, 'pecas-estoque.json');
const PECAS_MOVIMENTOS_FILE = path.join(DATA_DIR, 'pecas-movimentos.json');
const REGISTRO_CHAMADOS_FILE = path.join(DATA_DIR, 'registro-chamados.json');

// Evita responder 2x à mesma mensagem do webhook Cloud API (Meta às vezes reenvia)
const CLOUD_WEBHOOK_PROCESSED_IDS = new Set();
const CLOUD_WEBHOOK_MAX_IDS = 5000;

function sendJson(res, obj) {
    res.writeHead(200, { ...HEADERS, 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(obj), 'utf-8');
}

function sendErr(res, code, msg) {
    res.writeHead(code, { ...HEADERS, 'Content-Type': 'application/json; charset=utf-8' });
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

    // ---- Raiz: NÃO redirecionar para login ao recarregar ----
    // O cliente (script.js) decide: se já logado, mantém a página atual; se não, mostra login.
    // (Removido redirecionamento GET / → ?tela=login#login para não perder a página ao dar F5.)

    // ---- Redirecionamento: /whatsapp-qr → /pages/whatsapp-qr.html (evita conflito com tryPagesFallback) ----
    const isWhatsAppQrRoot = (urlPath === '/whatsapp-qr' || urlPath === '/whatsapp-qr.html' || urlPath === '/whatsapp-qr/') && method === 'GET';
    if (isWhatsAppQrRoot) {
        res.writeHead(302, { 'Location': '/pages/whatsapp-qr.html', 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=/pages/whatsapp-qr.html"></head><body>Redirecionando para <a href="/pages/whatsapp-qr.html">QR Code WhatsApp</a>...</body></html>', 'utf-8');
        return true;
    }

    // ---- Favicon (evita 404 e erros no console do navegador) ----
    if (urlPath === '/favicon.ico' && method === 'GET') {
        res.writeHead(204, { 'Content-Length': '0' });
        res.end();
        return true;
    }

    // ---- Health / Ping ----
    if ((urlPath === '/health' || urlPath === '/ping') && method === 'GET') {
        sendJson(res, { ok: true, port: require('./config').PORT, env: require('./config').NODE_ENV });
        return true;
    }

    // ---- TOTP setup: rota explícita (qualquer variação de path que contenha totp-setup) ----
    const pathNorm = String(urlPath || '').trim().replace(/\/+$/, '');
    if (method === 'POST' && pathNorm.indexOf('totp-setup') !== -1 && pathNorm.indexOf('api') !== -1 && pathNorm.indexOf('auth') !== -1) {
        let body;
        try { body = await parseBody(req); } catch (_) { sendErr(res, 400, 'Body inválido'); return true; }
        const login = body.login && String(body.login).trim();
        if (!login) {
            sendErr(res, 400, 'login é obrigatório');
            return true;
        }
        try {
            const totp = require('./totp');
            const forceNew = body.forceNew === true || body.forceNew === 'true';
            if (forceNew) {
                await totp.removeTotp(login);
            }
            const existingSecret = totp.getSecretForLogin(login);
            const alreadyEnabled = totp.isTotpEnabled(login);
            if (!forceNew && existingSecret && !alreadyEnabled) {
                const otpauthUrl = totp.buildOtpauthUrl(login, existingSecret);
                sendJson(res, { otpauthUrl, secret: existingSecret });
                return true;
            }
            const { secret, otpauthUrl } = totp.generateSecret(login);
            await totp.saveSecret(login, secret);
            sendJson(res, { otpauthUrl, secret });
        } catch (err) {
            const msg = err && err.message ? err.message : '';
            console.error('TOTP setup error:', msg);
            if (msg.indexOf('Cannot find module') !== -1) {
                sendErr(res, 500, 'Módulo speakeasy em falta. Execute: npm install speakeasy');
            } else {
                sendErr(res, 500, 'Erro ao gerar QR do Google Authenticator. Verifique a pasta config/data e tente novamente.');
            }
        }
        return true;
    }

    // ---- TOTP (Google Authenticator) 2FA ----
    if (urlPath === '/api/auth/totp-required' && method === 'GET') {
        const url = new URL(req.url || '', 'http://localhost');
        const login = url.searchParams.get('login');
        if (!login) {
            sendJson(res, { required: false, requireEveryEntry: false });
            return true;
        }
        const totp = require('./totp');
        const required = await totp.shouldRequireTotp(login);
        const requireEveryEntry = await totp.requireTotpEveryEntry(login);
        sendJson(res, { required: !!required, requireEveryEntry: !!requireEveryEntry });
        return true;
    }

    if (urlPath === '/api/auth/verify-totp' && method === 'POST') {
        let body;
        try { body = await parseBody(req); } catch (_) { sendErr(res, 400, 'Body inválido'); return true; }
        const login = body.login && String(body.login).trim();
        const code = body.code && String(body.code).trim();
        if (!login || !code) {
            sendErr(res, 400, 'login e code são obrigatórios');
            return true;
        }
        const totp = require('./totp');
        const secret = totp.getSecretForLogin(login);
        if (!secret || !totp.verifyToken(secret, code)) {
            sendErr(res, 403, 'Código inválido ou expirado');
            return true;
        }
        await totp.setLastVerifiedAt(login);
        sendJson(res, { ok: true, login });
        return true;
    }

    if (urlPath === '/api/auth/totp-reset' && method === 'POST') {
        let body;
        try { body = await parseBody(req); } catch (_) { sendErr(res, 400, 'Body inválido'); return true; }
        const login = body.login && String(body.login).trim();
        const code = body.code && String(body.code).trim();
        if (!login || !code) {
            sendErr(res, 400, 'login e code são obrigatórios');
            return true;
        }
        const totp = require('./totp');
        const secret = totp.getSecretForLogin(login);
        if (!secret || !totp.verifyToken(secret, code)) {
            sendErr(res, 403, 'Código inválido. Use o código que está AGORA no app.');
            return true;
        }
        await totp.resetTotpRequire(login);
        sendJson(res, { ok: true });
        return true;
    }

    // totp-confirm: aceitar /api/auth/totp-confirm e também /api/totp-confirm ou /api/totp-confirm/1 (evita 401 por URL errada no console)
    const isTotpConfirm = (method === 'POST') && (
        urlPath === '/api/auth/totp-confirm' ||
        urlPath === '/api/totp-confirm' ||
        (String(urlPath).indexOf('/api/totp-confirm/') === 0)
    );
    if (isTotpConfirm) {
        let body;
        try { body = await parseBody(req); } catch (_) { sendErr(res, 400, 'Body inválido'); return true; }
        const login = body.login && String(body.login).trim();
        const code = body.code && String(body.code).trim();
        if (!login || !code) {
            sendErr(res, 400, 'login e code são obrigatórios');
            return true;
        }
        const totp = require('./totp');
        const secret = totp.getSecretForLogin(login);
        if (!secret) {
            sendErr(res, 403, '2FA ainda não configurado para este utilizador. Clique em «Configurar Google Authenticator», escaneie o QR e confirme com o código do app.');
            return true;
        }
        if (!totp.verifyToken(secret, code)) {
            sendErr(res, 403, 'Código inválido. Use o código que está AGORA no app (renova a cada 30 s). Verifique a hora do telemóvel.');
            return true;
        }
        await totp.enableTotp(login);
        // Regista momento da confirmação para a janela de 60 minutos sem pedir código novamente
        await totp.setLastVerifiedAt(login);
        sendJson(res, { ok: true });
        return true;
    }

    if (urlPath === '/api/auth/totp-disable' && method === 'POST') {
        let body;
        try { body = await parseBody(req); } catch (_) { sendErr(res, 400, 'Body inválido'); return true; }
        const login = body.login && String(body.login).trim();
        if (!login) {
            sendErr(res, 400, 'login é obrigatório');
            return true;
        }
        const totp = require('./totp');
        await totp.removeTotp(login);
        sendJson(res, { ok: true });
        return true;
    }

    if (urlPath === '/api/auth/totp-status' && method === 'GET') {
        const url = new URL(req.url || '', 'http://localhost');
        const login = url.searchParams.get('login');
        if (!login) {
            sendJson(res, { enabled: false });
            return true;
        }
        const totp = require('./totp');
        const enabled = await totp.isTotpEnabled(login);
        sendJson(res, { enabled: !!enabled });
        return true;
    }

    // ---- Registro de Chamados (mesmo ficheiro do bot WhatsApp: tempo real no site) ----
    if (urlPath === '/api/registro-chamados' && method === 'GET') {
        try {
            let list = [];
            try {
                const raw = readJsonSync(REGISTRO_CHAMADOS_FILE, []);
                list = Array.isArray(raw) ? raw : (raw.chamados || []);
            } catch (e) { list = []; }
            sendJson(res, { ok: true, chamados: list });
            return true;
        } catch (e) {
            sendErr(res, 500, 'Erro ao ler chamados');
            return true;
        }
    }
    if (urlPath === '/api/registro-chamados' && method === 'POST') {
        let body;
        try { body = await parseBody(req); } catch (_) { sendErr(res, 400, 'Body inválido'); return true; }
        const chave = (body.chave && String(body.chave).trim()) || '';
        const status = (body.status && String(body.status).trim()) || 'ABERTO';
        const observacao = (body.observacao && String(body.observacao).trim()) || '';
        const tipos = Array.isArray(body.tipos) ? body.tipos : [];
        if (!chave) {
            sendErr(res, 400, 'Número do chamado é obrigatório');
            return true;
        }
        try {
            let list = [];
            try {
                const raw = readJsonSync(REGISTRO_CHAMADOS_FILE, []);
                list = Array.isArray(raw) ? raw : (raw.chamados || []);
            } catch (e) { list = []; }
            const novo = {
                id: body.id || ('rc-' + Date.now()),
                data: body.data || new Date().toISOString(),
                chave: chave,
                status: status,
                tipos: tipos,
                observacao: observacao,
                origem: body.origem || 'site'
            };
            list.unshift(novo);
            await writeJson(REGISTRO_CHAMADOS_FILE, list);
            sendJson(res, { ok: true, chamado: novo });
            return true;
        } catch (e) {
            sendErr(res, 500, 'Erro ao salvar chamado');
            return true;
        }
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

    // ---- Documentação AXIS: upload e armazenamento (suporte 2TB+ via DOCS_STORAGE_DIR) ----
    const docsPath = (urlPath || '').replace(/\/+$/, '').trim();
    if (docsPath.startsWith('/api/docs')) {
        try {
        const docsDir = DOCS_STORAGE_DIR || path.join(ROOT_DIR, 'docs-storage');
        const metadataFile = DOCS_METADATA_FILE || path.join(DATA_DIR, 'axis-docs.json');
        if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
        const dirForMeta = path.dirname(metadataFile);
        if (!fs.existsSync(dirForMeta)) fs.mkdirSync(dirForMeta, { recursive: true });
        if (!fs.existsSync(metadataFile)) {
            try { fs.writeFileSync(metadataFile, '[]', 'utf8'); } catch (_) {}
        }
        const getDocs = () => {
            try {
                const d = readJsonSync(metadataFile, []);
                return Array.isArray(d) ? d : (d.docs || d);
            } catch (e) { return []; }
        };
        const saveDocs = (docs) => { return writeJson(metadataFile, docs); };
        const idFromPath = (p) => {
            const m = p.match(/\/api\/docs\/([^\/]+)(?:\/file)?$/);
            return m ? decodeURIComponent(m[1]) : null;
        };
        const id = idFromPath(docsPath);
        if ((docsPath === '/api/docs') && method === 'GET') {
            let docs = [];
            try { docs = getDocs(); } catch (e) { docs = []; }
            sendJson(res, { ok: true, docs });
            return true;
        }
        if (docsPath === '/api/docs' && method === 'POST') {
            const ct = (req.headers['content-type'] || '');
            if (ct.includes('multipart/form-data')) {
                const form = formidable({ uploadDir: docsDir, keepExtensions: true, multiples: true, maxFileSize: 100 * 1024 * 1024 });
                try {
                    const [fields, files] = await form.parse(req);
                    const titulo = (fields.titulo && (Array.isArray(fields.titulo) ? fields.titulo[0] : fields.titulo)) || '';
                    const descricao = (fields.descricao && (Array.isArray(fields.descricao) ? fields.descricao[0] : fields.descricao)) || '';
                    const categoria = (fields.categoria && (Array.isArray(fields.categoria) ? fields.categoria[0] : fields.categoria)) || 'documentos';
                    const file = files.arquivo ? (Array.isArray(files.arquivo) ? files.arquivo[0] : files.arquivo) : null;
                    if (!titulo) {
                        sendErr(res, 400, 'Título obrigatório');
                        return true;
                    }
                    let docId, fileName, tipo = 'texto';
                    if (file && file.filepath && fs.existsSync(file.filepath)) {
                        tipo = 'arquivo';
                        docId = 'doc-' + Date.now();
                        const ext = path.extname(file.originalFilename || file.newFilename || '') || path.extname(file.filepath);
                        fileName = docId + (ext || '.bin');
                        const dest = path.join(docsDir, fileName);
                        fs.renameSync(file.filepath, dest);
                        docId = fileName;
                    } else {
                        const conteudo = (fields.conteudo && (Array.isArray(fields.conteudo) ? fields.conteudo[0] : fields.conteudo)) || '';
                        if (!conteudo) {
                            sendErr(res, 400, 'Envie um arquivo ou preencha o conteúdo em texto.');
                            return true;
                        }
                        docId = 'doc-' + Date.now();
                        const meta = { id: docId, titulo, descricao, categoria, tipo: 'texto', conteudo, data: new Date().toISOString() };
                        const docs = getDocs();
                        docs.push(meta);
                        await saveDocs(docs);
                        sendJson(res, { ok: true, doc: meta });
                        return true;
                    }
                    const meta = { id: docId, titulo, descricao, categoria, tipo: 'arquivo', fileName, data: new Date().toISOString() };
                    const docs = getDocs();
                    docs.push(meta);
                    await saveDocs(docs);
                    sendJson(res, { ok: true, doc: meta });
                } catch (e) {
                    sendErr(res, 500, 'Erro ao fazer upload: ' + (e.message || ''));
                }
                return true;
            }
            const body = await parseBody(req);
            const { titulo, descricao, categoria, conteudo } = body;
            if (!titulo || !conteudo) {
                sendErr(res, 400, 'Título e conteúdo obrigatórios');
                return true;
            }
            const docId = 'doc-' + Date.now();
            const meta = { id: docId, titulo, descricao: descricao || '', categoria: categoria || 'documentos', tipo: 'texto', conteudo, data: new Date().toISOString() };
            const docs = getDocs();
            docs.push(meta);
            await saveDocs(docs);
            sendJson(res, { ok: true, doc: meta });
            return true;
        }
        if (id && docsPath.endsWith('/file') && method === 'GET') {
            const docs = getDocs();
            const doc = docs.find(d => d.id === id || d.fileName === id);
            if (!doc) {
                sendErr(res, 404, 'Documento não encontrado');
                return true;
            }
            const fp = path.join(docsDir, doc.fileName || doc.id);
            if (!fs.existsSync(fp) || !fs.statSync(fp).isFile()) {
                sendErr(res, 404, 'Arquivo não encontrado');
                return true;
            }
            const ext = path.extname(fp).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            res.writeHead(200, { ...HEADERS, 'Content-Type': contentType, 'Content-Disposition': 'inline; filename="' + (doc.titulo || doc.id) + ext + '"' });
            fs.createReadStream(fp).pipe(res);
            return true;
        }
        if (id && method === 'PUT') {
            const body = await parseBody(req);
            const docs = getDocs();
            const idx = docs.findIndex(d => d.id === id);
            if (idx < 0) {
                sendErr(res, 404, 'Documento não encontrado');
                return true;
            }
            const d = docs[idx];
            if (body.titulo) d.titulo = body.titulo;
            if (body.descricao !== undefined) d.descricao = body.descricao;
            if (body.categoria) d.categoria = body.categoria;
            if (body.conteudo !== undefined) d.conteudo = body.conteudo;
            d.updatedAt = new Date().toISOString();
            await saveDocs(docs);
            sendJson(res, { ok: true, doc: d });
            return true;
        }
        if (id && method === 'DELETE') {
            const docs = getDocs();
            const doc = docs.find(d => d.id === id);
            if (!doc) {
                sendErr(res, 404, 'Documento não encontrado');
                return true;
            }
            if (doc.fileName) {
                const fp = path.join(docsDir, doc.fileName);
                if (fs.existsSync(fp)) try { fs.unlinkSync(fp); } catch (e) {}
            }
            const filtered = docs.filter(d => d.id !== id);
            await saveDocs(filtered);
            sendJson(res, { ok: true });
            return true;
        }
        sendErr(res, 404, 'Rota de documentação não encontrada');
        return true;
        } catch (err) {
            if ((docsPath === '/api/docs') && method === 'GET') {
                sendJson(res, { ok: true, docs: [] });
                return true;
            }
            sendErr(res, 500, 'Erro no serviço de documentação: ' + (err.message || ''));
            return true;
        }
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

    // ---- Packing Machine - Trocas de Cabeça de Impressão ----
    if (urlPath === '/api/packing/trocas' && method === 'GET') {
        let trocas = [];
        try {
            const data = readJsonSync(PACKING_TROCAS_FILE, []);
            trocas = Array.isArray(data) ? data : (data.trocas || []);
        } catch (e) {
            trocas = [];
        }
        sendJson(res, { ok: true, trocas });
        return true;
    }

    if ((urlPath === '/api/packing/troca' || urlPath === '/api/packing/trocas') && method === 'POST') {
        const body = await parseBody(req);
        const { numeroPm, quantidadeImpressoes, tecnico, dataHora } = body;
        if (!numeroPm || tecnico == null || tecnico === '') {
            sendErr(res, 400, 'Faltam numeroPm ou tecnico');
            return true;
        }
        const qtd = Math.max(0, parseInt(String(quantidadeImpressoes || 0), 10) || 0);
        let pm = String(numeroPm).trim();
        if (/^[1-6]$/.test(pm)) pm = 'PM ' + pm;
        else if (!/^PM [1-6]$/i.test(pm)) {
            const n = parseInt(pm.replace(/\D/g, ''), 10);
            pm = (n >= 1 && n <= 6) ? 'PM ' + n : 'PM 1';
        } else {
            pm = pm.replace(/pm\s*/i, 'PM ');
        }
        const troca = {
            id: 'pm_api_' + Date.now(),
            dataHora: dataHora || new Date().toISOString(),
            numeroPm: pm,
            quantidadeImpressoes: qtd,
            tecnico: String(tecnico || '').trim().substring(0, 100),
            origem: body.origem || 'api'
        };
        let trocas = [];
        try {
            const data = readJsonSync(PACKING_TROCAS_FILE, []);
            trocas = Array.isArray(data) ? data : (data.trocas || []);
        } catch (e) {
            trocas = [];
        }
        trocas.unshift(troca);
        try {
            await writeJson(PACKING_TROCAS_FILE, trocas);
            sendJson(res, { ok: true, message: 'Troca registrada', troca });
        } catch (e) {
            sendErr(res, 500, 'Erro ao salvar: ' + (e.message || ''));
        }
        return true;
    }

    // ---- Status de Bancada (substitui Google Forms/planilha) ----
    const bancadasStatusPath = (urlPath || '').replace(/\/+$/, '');
    if (bancadasStatusPath === '/api/bancadas/status' && method === 'GET') {
        let data = { bancadas: {}, updatedAt: null };
        try {
            const raw = readJsonSync(BANCADAS_STATUS_FILE, {});
            data.bancadas = raw.bancadas && typeof raw.bancadas === 'object' ? raw.bancadas : {};
            data.updatedAt = raw.updatedAt || null;
        } catch (e) {
            data.bancadas = {};
        }
        sendJson(res, { ok: true, ...data });
        return true;
    }

    if (bancadasStatusPath === '/api/bancadas/status' && method === 'POST') {
        const body = await parseBody(req);
        const validStatus = ['DISPONIVEL', 'IMPRESSORA', 'NOTEBOOK', 'SEM_IMPRESSORA_IMP', 'SEM_IMPRESSORA_NB'];
        const bancada = body.bancada != null ? String(body.bancada).trim() : '';
        const equipamento = body.equipamento != null ? String(body.equipamento).toUpperCase().trim() : '';
        if (!bancada) {
            sendErr(res, 400, 'Campo bancada é obrigatório');
            return true;
        }
        if (!validStatus.includes(equipamento)) {
            sendErr(res, 400, 'equipamento deve ser DISPONIVEL, IMPRESSORA, NOTEBOOK, SEM_IMPRESSORA_IMP ou SEM_IMPRESSORA_NB');
            return true;
        }
        let data = { bancadas: {}, updatedAt: null };
        try {
            const raw = readJsonSync(BANCADAS_STATUS_FILE, {});
            data.bancadas = raw.bancadas && typeof raw.bancadas === 'object' ? raw.bancadas : {};
        } catch (e) {
            data.bancadas = {};
        }
        data.bancadas[bancada] = equipamento;
        data.updatedAt = new Date().toISOString();
        try {
            await writeJson(BANCADAS_STATUS_FILE, data);
            sendJson(res, { ok: true, message: 'Status atualizado', bancada, equipamento });
        } catch (e) {
            sendErr(res, 500, 'Erro ao salvar: ' + (e.message || ''));
        }
        return true;
    }

    // ---- Inventário de Peças (API para site e WhatsApp) ----
    if (urlPath === '/api/pecas/estoque' && method === 'GET') {
        let list = [];
        try {
            const raw = readJsonSync(PECAS_ESTOQUE_FILE, []);
            list = Array.isArray(raw) ? raw : (raw.estoque || []);
        } catch (e) {
            list = [];
        }
        sendJson(res, { ok: true, estoque: list });
        return true;
    }
    if (urlPath === '/api/pecas/estoque' && method === 'POST') {
        const body = await parseBody(req);
        const { estoque } = body;
        const list = Array.isArray(estoque) ? estoque : [];
        try {
            await writeJson(PECAS_ESTOQUE_FILE, list);
            sendJson(res, { ok: true, message: 'Estoque salvo', count: list.length });
        } catch (e) {
            sendErr(res, 500, 'Erro ao salvar: ' + (e.message || ''));
        }
        return true;
    }
    if (urlPath === '/api/pecas/movimentos' && method === 'GET') {
        let list = [];
        try {
            const raw = readJsonSync(PECAS_MOVIMENTOS_FILE, []);
            list = Array.isArray(raw) ? raw : (raw.movimentos || []);
        } catch (e) {
            list = [];
        }
        sendJson(res, { ok: true, movimentos: list });
        return true;
    }
    if (urlPath === '/api/pecas/movimentos' && method === 'POST') {
        const body = await parseBody(req);
        const { movimentos } = body;
        const list = Array.isArray(movimentos) ? movimentos : [];
        try {
            await writeJson(PECAS_MOVIMENTOS_FILE, list);
            sendJson(res, { ok: true, message: 'Movimentos salvos', count: list.length });
        } catch (e) {
            sendErr(res, 500, 'Erro ao salvar: ' + (e.message || ''));
        }
        return true;
    }
    if (urlPath === '/api/pecas/entrada' && method === 'POST') {
        const body = await parseBody(req);
        const { pecaId, produto, quantidade, observacao, categoria } = body;
        const qtd = Math.max(1, parseInt(String(quantidade || 1), 10) || 1);
        let estoque = [];
        try {
            estoque = readJsonSync(PECAS_ESTOQUE_FILE, []);
            if (!Array.isArray(estoque)) estoque = [];
        } catch (e) {
            estoque = [];
        }
        const idx = pecaId ? estoque.findIndex(p => p && p.id === pecaId) : -1;
        if (idx >= 0) {
            estoque[idx].quantidade = (estoque[idx].quantidade || 0) + qtd;
        } else {
            const nome = String(produto || '').trim() || 'Item';
            estoque.unshift({
                id: 'peca-' + Date.now(),
                categoria: categoria || 'peca',
                produto: nome,
                nome: nome,
                fabricante: '',
                conteudo: '',
                lote: '',
                validade: '',
                quantidade: qtd,
                dataRecebimento: new Date().toISOString(),
                dataCadastro: new Date().toISOString(),
                local: '',
                observacao: observacao || '',
                historico: [{ acao: 'criacao', data: new Date().toISOString(), usuario: body.usuario || 'WhatsApp' }]
            });
        }
        const mov = {
            id: 'mov-' + Date.now(),
            pecaId: pecaId || (estoque[0] && estoque[0].id),
            tipo: 'entrada',
            produto: String(produto || '').trim() || 'Item',
            quantidade: qtd,
            observacao: observacao || 'Entrada via WhatsApp',
            dataHora: new Date().toISOString()
        };
        let movimentos = [];
        try {
            movimentos = readJsonSync(PECAS_MOVIMENTOS_FILE, []);
            if (!Array.isArray(movimentos)) movimentos = [];
        } catch (e) {
            movimentos = [];
        }
        movimentos.unshift(mov);
        try {
            await writeJson(PECAS_ESTOQUE_FILE, estoque);
            await writeJson(PECAS_MOVIMENTOS_FILE, movimentos);
            sendJson(res, { ok: true, message: 'Entrada registrada', quantidade: qtd });
        } catch (e) {
            sendErr(res, 500, 'Erro ao salvar: ' + (e.message || ''));
        }
        return true;
    }
    if (urlPath === '/api/pecas/saida' && method === 'POST') {
        const body = await parseBody(req);
        const { pecaId, produto, quantidade, observacao } = body;
        const qtd = Math.max(1, parseInt(String(quantidade || 1), 10) || 1);
        let estoque = [];
        try {
            estoque = readJsonSync(PECAS_ESTOQUE_FILE, []);
            if (!Array.isArray(estoque)) estoque = [];
        } catch (e) {
            estoque = [];
        }
        const idx = estoque.findIndex(p => p && p.id === pecaId);
        if (idx < 0) {
            sendErr(res, 404, 'Item não encontrado no estoque');
            return true;
        }
        const disponivel = estoque[idx].quantidade || 0;
        if (qtd > disponivel) {
            sendErr(res, 400, 'Quantidade maior que o estoque (' + disponivel + ')');
            return true;
        }
        estoque[idx].quantidade = disponivel - qtd;
        const mov = {
            id: 'mov-' + Date.now(),
            pecaId: pecaId,
            tipo: 'saída',
            produto: estoque[idx].produto || estoque[idx].nome || produto,
            quantidade: qtd,
            observacao: observacao || 'Saída via WhatsApp',
            dataHora: new Date().toISOString()
        };
        let movimentos = [];
        try {
            movimentos = readJsonSync(PECAS_MOVIMENTOS_FILE, []);
            if (!Array.isArray(movimentos)) movimentos = [];
        } catch (e) {
            movimentos = [];
        }
        movimentos.unshift(mov);
        try {
            await writeJson(PECAS_ESTOQUE_FILE, estoque);
            await writeJson(PECAS_MOVIMENTOS_FILE, movimentos);
            sendJson(res, { ok: true, message: 'Saída registrada', quantidade: qtd });
        } catch (e) {
            sendErr(res, 500, 'Erro ao salvar: ' + (e.message || ''));
        }
        return true;
    }

    // ---- Status e QR do WhatsApp (Baileys integrado) ----
    if (urlPath === '/whatsapp-connect' || urlPath === '/whatsapp-connect.html') {
        const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AXIS - Conectar WhatsApp Bot</title><style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;min-height:100vh;margin:0;display:flex;align-items:center;justify-content:center;padding:20px}.card{background:rgba(255,255,255,.08);border-radius:16px;padding:32px;max-width:400px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.3)}h1{font-size:24px;margin:0 0 8px}.sub{color:#94a3b8;margin-bottom:24px;font-size:14px}#qr{max-width:280px;margin:16px auto;padding:16px;background:#fff;border-radius:12px}#qr img{width:100%;height:auto}.status{font-size:14px;margin-top:16px;padding:12px;border-radius:8px;background:rgba(37,211,102,.2);color:#25D366}.status.warn{background:rgba(253,126,20,.2);color:#fd7e14}.status.err{background:rgba(239,68,68,.2);color:#ef4444}a{color:#00e5ff;text-decoration:none}a:hover{text-decoration:underline}</style></head><body><div class="card"><h1>🤖 Bot WhatsApp - AXIS</h1><p class="sub">Troca de Cabeça (Packing Machine)</p><div id="qr"></div><div id="status" class="status"></div><p style="margin-top:24px;font-size:13px"><a href="/">← Voltar ao AXIS</a></p></div><script>
var s=document.getElementById('status');
var qr=document.getElementById('qr');
function poll(){fetch('/api/whatsapp/status').then(r=>r.json()).then(d=>{
if(d.connected){qr.innerHTML='';s.textContent='✅ Conectado! Envie "troca" no WhatsApp para registrar.';s.className='status';return}
if(d.qr){qr.innerHTML='<img src="'+d.qr+'" alt="QR Code">';s.textContent='Escaneie o QR Code no WhatsApp (Aparelho conectado > Vincular dispositivo)';s.className='status warn';}else{qr.innerHTML='';s.textContent='Aguardando QR... Iniciando bot.';s.className='status warn'}
}).catch(()=>{s.textContent='Erro ao conectar. O servidor está rodando?';s.className='status err'})}
poll();setInterval(poll,3000);
</script></body></html>`;
        res.writeHead(200, { ...HEADERS, 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html, 'utf-8');
        return true;
    }

    // ---- QR Code AXIS (wa.me) – sempre disponível, não depende do connector ----
    if ((urlPath === '/api/whatsapp/qr-axis' || urlPath === '/api/whatsapp/qr') && method === 'GET') {
        try {
            const QRCode = require('qrcode');
            const { AXIS_BOT_NUMBER } = require('./config');
            const num = (AXIS_BOT_NUMBER || '5548991578172').replace(/\D/g, '');
            const waMe = 'https://wa.me/' + num;
            const waMeQr = await new Promise((resolve, reject) => {
                QRCode.toDataURL(waMe, { margin: 2, width: 300 }, (err, url) => {
                    if (err) reject(err);
                    else resolve(url);
                });
            });
            sendJson(res, { ok: true, qr: waMeQr, number: num });
        } catch (e) {
            sendJson(res, { ok: false, error: e.message });
        }
        return true;
    }

    if (urlPath === '/api/whatsapp/status' && method === 'GET') {
        const QRCode = require('qrcode');
        const { AXIS_BOT_NUMBER } = require('./config');
        let connected = false;
        let hasQR = false;
        let qrBase64 = null;
        let botNumber = null;
        let cloudApi = false;
        try {
            const cloud = require('./whatsapp-cloud-api');
            if (cloud.isConfigured()) {
                connected = true;
                cloudApi = true;
                botNumber = AXIS_BOT_NUMBER;
            }
        } catch (e) {}
        if (!cloudApi) {
            try {
                const connector = require('./whatsapp-connector');
                const status = connector.getConnectionStatus();
                connected = status.connected;
                hasQR = status.hasQR;
                const qrStr = connector.getQR();
                botNumber = connector.getBotNumber ? connector.getBotNumber() : null;
                if (qrStr) {
                    qrBase64 = await new Promise((resolve, reject) => {
                        QRCode.toDataURL(qrStr, { margin: 2, width: 300 }, (err, url) => {
                            if (err) reject(err);
                            else resolve(url);
                        });
                    });
                }
            } catch (e) {
                connected = false;
                hasQR = false;
            }
        }
        let waMeQr = null;
        try {
            const waMe = 'https://wa.me/' + (AXIS_BOT_NUMBER || '5548991578172').replace(/\D/g, '');
            waMeQr = await new Promise((resolve, reject) => {
                QRCode.toDataURL(waMe, { margin: 2, width: 300 }, (err, url) => {
                    if (err) reject(err);
                    else resolve(url);
                });
            });
        } catch (e) {}
        function formatarNumeroBR(n) {
            if (!n) return '';
            var d = String(n).replace(/\D/g, '');
            if (!d.startsWith('55')) d = '55' + d;
            if (d.length === 13) return '+55 ' + d.slice(2, 4) + ' ' + d.slice(4, 9) + '-' + d.slice(9);
            if (d.length === 12) return '+55 ' + d.slice(2, 4) + ' ' + d.slice(4, 8) + '-' + d.slice(8);
            return n;
        }
        sendJson(res, { ok: true, connected, hasQR, qr: qrBase64, waMeQr, botNumber, axisBotNumber: AXIS_BOT_NUMBER, axisBotNumberFormatado: formatarNumeroBR(AXIS_BOT_NUMBER), cloudApi, numeroConectado: botNumber, numeroConectadoFormatado: formatarNumeroBR(botNumber) });
        return true;
    }

    if ((urlPath === '/api/whatsapp/logout' || urlPath === '/api/whatsapp/desconectar') && (method === 'POST' || method === 'GET')) {
        try {
            const connector = require('./whatsapp-connector');
            if (connector.disconnectAndLogout) {
                await connector.disconnectAndLogout();
                sendJson(res, { ok: true, message: 'Desconectado. Escaneie o novo QR com um número DEDICADO (chip secundário ou linha da empresa).' });
            } else {
                sendJson(res, { ok: false, error: 'Função não disponível' });
            }
        } catch (e) {
            sendJson(res, { ok: false, error: e.message || 'Erro ao desconectar' });
        }
        return true;
    }

    // ---- Webhook: WhatsApp Cloud API (Meta oficial) - 24/7 sem QR ----
    const WEBHOOK_VERIFY_TOKEN = process.env.WA_WEBHOOK_VERIFY_TOKEN || process.env.WEBHOOK_VERIFY_TOKEN || 'axis-packing-bot';
    if (urlPath === '/api/whatsapp/cloud-webhook' && method === 'GET') {
        const fullUrl = req.url || '';
        const query = fullUrl.includes('?') ? new URLSearchParams(fullUrl.split('?')[1]) : new Map();
        const mode = query.get('hub.mode');
        const token = query.get('hub.verify_token');
        const challenge = query.get('hub.challenge');
        if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN && challenge) {
            res.writeHead(200, { 'Content-Type': 'text/plain', ...HEADERS });
            res.end(challenge, 'utf-8');
        } else {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('Forbidden', 'utf-8');
        }
        return true;
    }
    if (urlPath === '/api/whatsapp/cloud-webhook' && method === 'POST') {
        const cloudApi = require('./whatsapp-cloud-api');
        if (!cloudApi.isConfigured()) {
            res.writeHead(200, { 'Content-Type': 'application/json', ...HEADERS });
            res.end(JSON.stringify({ ok: false, error: 'Cloud API não configurada' }), 'utf-8');
            return true;
        }
        const body = await parseBody(req);
        res.writeHead(200, { 'Content-Type': 'application/json', ...HEADERS });
        res.end(JSON.stringify({ ok: true }), 'utf-8');
        setImmediate(async () => {
            const messages = cloudApi.parseWebhookMessages(body);
            const { handleIncoming } = require('./whatsapp-packing-bot');
            for (const { from, text, id } of messages) {
                if (!text) continue;
                if (id && CLOUD_WEBHOOK_PROCESSED_IDS.has(id)) continue; // já processada = não responder de novo
                if (id) {
                    if (CLOUD_WEBHOOK_PROCESSED_IDS.size >= CLOUD_WEBHOOK_MAX_IDS) CLOUD_WEBHOOK_PROCESSED_IDS.clear();
                    CLOUD_WEBHOOK_PROCESSED_IDS.add(id);
                }
                try {
                    const reply = await handleIncoming(
                        { from, body: text },
                        (phone, msg) => msg,
                        async (troca) => {
                            let trocas = [];
                            try {
                                const data = readJsonSync(PACKING_TROCAS_FILE, []);
                                trocas = Array.isArray(data) ? data : (data.trocas || []);
                            } catch (e) { trocas = []; }
                            trocas.unshift({
                                id: 'pm_wa_' + Date.now(),
                                dataHora: troca.dataHora || new Date().toISOString(),
                                numeroPm: troca.numeroPm,
                                quantidadeImpressoes: troca.quantidadeImpressoes || 0,
                                tecnico: String(troca.tecnico || '').substring(0, 100),
                                origem: 'whatsapp',
                                phone: troca.phone
                            });
                            await writeJson(PACKING_TROCAS_FILE, trocas);
                        }
                    );
                    if (reply) {
                        const r = await cloudApi.sendMessage(from, reply);
                        if (!r.ok) console.error('Cloud API send:', r.error);
                    }
                } catch (e) {
                    console.error('Erro webhook Cloud API:', e.message);
                    try { await cloudApi.sendMessage(from, '❌ Ocorreu um erro. Digite *troca* para recomeçar.'); } catch (_) {}
                }
            }
        });
        return true;
    }

    // ---- Webhook: WhatsApp Bot - mensagem recebida (fluxo conversacional) ----
    if (urlPath === '/api/whatsapp/packing-webhook' && method === 'POST') {
        const body = await parseBody(req);
        let from = body.from || body.phone || (body.data && body.data.key && body.data.key.remoteJid) || '';
        let text = body.body || body.text || (body.data && body.data.message && (body.data.message.conversation || (body.data.message.extendedTextMessage && body.data.message.extendedTextMessage.text))) || '';
        from = String(from).split('@')[0].replace(/\D/g, '').substring(0, 20) || 'unknown';
        text = String(text || '').trim();

        try {
            const { handleIncoming } = require('./whatsapp-packing-bot');
            const { readJsonSync, writeJson } = require('./data');
            const reply = await handleIncoming(
                { from: from, body: text },
                (phone, msg) => msg,
                async (troca) => {
                    let trocas = [];
                    try {
                        const data = readJsonSync(PACKING_TROCAS_FILE, []);
                        trocas = Array.isArray(data) ? data : (data.trocas || []);
                    } catch (e) { trocas = []; }
                    trocas.unshift({
                        id: 'pm_wa_' + Date.now(),
                        dataHora: troca.dataHora || new Date().toISOString(),
                        numeroPm: troca.numeroPm,
                        quantidadeImpressoes: troca.quantidadeImpressoes || 0,
                        tecnico: String(troca.tecnico || '').substring(0, 100),
                        origem: 'whatsapp',
                        phone: troca.phone
                    });
                    await writeJson(PACKING_TROCAS_FILE, trocas);
                }
            );
            sendJson(res, { ok: true, reply: reply || 'Ok.', from });
        } catch (e) {
            sendJson(res, { ok: false, error: (e.message || String(e)), reply: 'Desculpe, ocorreu um erro. Digite *troca* para recomeçar.' });
        }
        return true;
    }

    // ---- Webhook: WhatsApp Bot → Packing (troca completa) ----
    if (urlPath === '/api/whatsapp/packing-registro' && method === 'POST') {
        const body = await parseBody(req);
        const { numeroPm, quantidadeImpressoes, tecnico, dataHora, phone } = body;
        if (!numeroPm || tecnico == null || tecnico === '') {
            sendErr(res, 400, 'Faltam numeroPm ou tecnico');
            return true;
        }
        const pm = /^PM\s*([1-6])$/i.test(String(numeroPm).trim())
            ? 'PM ' + String(numeroPm).match(/([1-6])/)[1]
            : (/^[1-6]$/.test(String(numeroPm).trim()) ? 'PM ' + String(numeroPm).trim() : 'PM 1');
        const qtd = Math.max(0, parseInt(String(quantidadeImpressoes || 0), 10) || 0);
        const troca = {
            id: 'pm_wa_' + Date.now(),
            dataHora: dataHora || new Date().toISOString(),
            numeroPm: pm,
            quantidadeImpressoes: qtd,
            tecnico: String(tecnico || '').trim().substring(0, 100),
            origem: 'whatsapp',
            phone: phone ? String(phone).replace(/\D/g, '').substring(0, 20) : undefined
        };
        let trocas = [];
        try {
            const data = readJsonSync(PACKING_TROCAS_FILE, []);
            trocas = Array.isArray(data) ? data : (data.trocas || []);
        } catch (e) {
            trocas = [];
        }
        trocas.unshift(troca);
        try {
            await writeJson(PACKING_TROCAS_FILE, trocas);
            sendJson(res, { ok: true, message: 'Troca registrada via WhatsApp', troca });
        } catch (e) {
            sendErr(res, 500, 'Erro ao salvar');
        }
        return true;
    }

    // ---- Assistente IA (robô holograma) ----
    if (urlPath === '/api/assistant' && method === 'POST') {
        let body;
        try {
            body = await parseBody(req);
        } catch (e) {
            sendErr(res, 400, 'Corpo inválido');
            return true;
        }
        const message = typeof body.message === 'string' ? body.message.trim() : '';
        const history = Array.isArray(body.history) ? body.history : [];
        const userName = typeof body.userName === 'string' ? body.userName.trim() : '';
        if (!message) {
            sendErr(res, 400, 'Campo message é obrigatório');
            return true;
        }
        try {
            const { chat } = require('./assistant');
            const result = await chat(message, history, userName);
            sendJson(res, result);
        } catch (e) {
            console.error('API /api/assistant:', e);
            sendErr(res, 500, 'Erro no assistente');
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
                'POST /api/manutencoes/salvar-pdf',
                'GET  /api/packing/trocas',
                'POST /api/packing/troca',
                'GET  /api/bancadas/status',
                'POST /api/bancadas/status',
                'POST /api/whatsapp/packing-registro',
                'POST /api/whatsapp/packing-webhook',
                'POST /api/assistant'
            ]
        });
        return true;
    }

    // Pedidos /api/* não tratados: responder 404 JSON em vez de cair em serveFile (evita "404 - Arquivo não encontrado")
    if (String(urlPath || '').indexOf('/api/') === 0 || String(urlPath || '').replace(/^\/+/, '').indexOf('api/') === 0) {
        sendErr(res, 404, 'Endpoint não encontrado');
        return true;
    }

    return false;
}

module.exports = { handleApi };
