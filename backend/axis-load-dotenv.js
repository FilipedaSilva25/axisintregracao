/**
 * Carrega variáveis de ambiente em cadeia (sobrescreve na ordem).
 *
 * Resolve casos comuns no Windows:
 * - Ficheiro " (2).env" com ESPAÇO no início do nome (Explorer / cópia do .env.example).
 * - BOM UTF-8 no início do ficheiro.
 * - Caminho extra AXIS_EXTRA_ENV_PATH ou config/selbetti.env
 *
 * Não regista valores — só nomes de ficheiro e contagem de chaves.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

function stripBom(s) {
    if (!s || typeof s !== 'string') return s;
    if (s.charCodeAt(0) === 0xfeff) return s.slice(1);
    return s;
}

/**
 * @param {string} rootDir - pasta raiz do projeto (onde está server.js)
 * @returns {{ results: Array<{path:string,label:string,loaded:boolean,keys?:number,err?:string}> }}
 */
function loadAxisDotenv(rootDir) {
    const results = [];

    const extraPathRaw = (process.env.AXIS_EXTRA_ENV_PATH || '').trim();
    const extraAbs = extraPathRaw
        ? path.isAbsolute(extraPathRaw)
            ? extraPathRaw
            : path.join(rootDir, extraPathRaw)
        : '';

    /** Ordem: genéricos primeiro, segredos Selbetti por último (sobrescrevem). */
    const candidates = [
        { abs: path.join(rootDir, '.env'), label: '.env' },
        { abs: path.join(rootDir, '.env.local'), label: '.env.local' },
        { abs: path.join(rootDir, '.env.2'), label: '.env.2' },
        { abs: path.join(rootDir, '(2).env'), label: '(2).env' },
        { abs: path.join(rootDir, ' (2).env'), label: ' (2).env' },
        { abs: path.join(rootDir, 'config', 'selbetti.env'), label: 'config/selbetti.env' }
    ];

    if (extraAbs) {
        candidates.push({ abs: extraAbs, label: 'AXIS_EXTRA_ENV_PATH' });
    }

    for (const { abs, label } of candidates) {
        if (!fs.existsSync(abs)) {
            results.push({ path: abs, label, loaded: false });
            continue;
        }
        try {
            const raw = stripBom(fs.readFileSync(abs, 'utf8'));
            const parsed = dotenv.parse(raw);
            const keys = Object.keys(parsed);
            for (const k of keys) {
                const rawVal = parsed[k];
                const newStr = rawVal == null ? '' : String(rawVal);
                const newTrim = newStr.trim();
                const prev = process.env[k];
                const prevTrim = prev == null ? '' : String(prev).trim();
                /**
                 * Crítico: ficheiros como " (2).env" copiados do exemplo trazem
                 * SELBETTI_PORTAL_USER= e SELBETTI_PORTAL_PASSWORD= vazios.
                 * Se aplicarmos por cima do .env, apagamos credenciais já definidas.
                 */
                if (newTrim === '' && prevTrim !== '') {
                    continue;
                }
                process.env[k] = newStr;
            }
            results.push({ path: abs, label, loaded: true, keys: keys.length });
        } catch (e) {
            results.push({ path: abs, label, loaded: false, err: String(e.message || e) });
        }
    }

    /** Senha só numa linha — evita # e caracteres estranhos no .env */
    const pwFile = path.join(rootDir, 'config', 'data', 'selbetti-portal-password.txt');
    try {
        if (fs.existsSync(pwFile)) {
            const firstLine = stripBom(fs.readFileSync(pwFile, 'utf8')).split(/\r?\n/)[0];
            if (firstLine != null && String(firstLine).trim() !== '') {
                const hasPass =
                    String(process.env.SELBETTI_PORTAL_PASSWORD || '').trim() ||
                    String(process.env.SELBETTI_PORTAL_PASS || '').trim();
                if (!hasPass) {
                    process.env.SELBETTI_PORTAL_PASSWORD = String(firstLine).replace(/\r$/, '').trimEnd();
                    results.push({
                        path: pwFile,
                        label: 'config/data/selbetti-portal-password.txt',
                        loaded: true,
                        keys: 1
                    });
                }
            }
        }
    } catch (_) {}

    return { results };
}

function logAxisDotenvSummary(results) {
    const loaded = results.filter((r) => r.loaded);
    const missing = results.filter((r) => !r.loaded && !r.err);
    if (loaded.length) {
        console.log(
            '[axis-env] Ficheiros carregados: ' +
                loaded.map((r) => `${r.label} (${r.keys} chaves)`).join(' → ')
        );
    }
    const selbUser = !!(process.env.SELBETTI_PORTAL_USER || '').trim();
    const selbPass = !!(process.env.SELBETTI_PORTAL_PASSWORD || process.env.SELBETTI_PORTAL_PASS || '').trim();
    if (selbUser && selbPass) {
        console.log('[axis-env] Selbetti: SELBETTI_PORTAL_USER e senha presentes no processo.');
    } else {
        const spaceFile = results.find((r) => r.label === ' (2).env');
        console.warn(
            '[axis-env] Selbetti: falta utilizador ou senha no processo. ' +
                'Defina em .env ou config/selbetti.env, ou coloque a senha só na 1.ª linha de config/data/selbetti-portal-password.txt (ver selbetti-portal-password.example.txt).'
        );
        if (spaceFile && spaceFile.loaded && !selbUser && !selbPass) {
            console.warn(
                '[axis-env] ` (2).env` carregado sem credenciais Selbetti — defina-as no .env ou em config/data/selbetti-portal-password.txt.'
            );
        } else if (!spaceFile || !spaceFile.loaded) {
            console.warn(
                '[axis-env] Dica Windows: pode existir " (2).env" com ESPAÇO antes do ( — também é carregado.'
            );
        }
    }
}

module.exports = { loadAxisDotenv, logAxisDotenvSummary };
