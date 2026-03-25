/**
 * Extração de ZPL de ficheiros .lbl / .nlbl (binário, UTF-16, ZIP interno)
 * e renderização PNG via Labelary (HTTP).
 */
'use strict';

const http = require('http');
const zlib = require('zlib');

const ZPL_MAX_CHARS = 450000;

function extractZplAsciiBytes(buf) {
    if (!buf || buf.length < 8) return null;
    const n = buf.length;
    const isStart = (i) => i <= n - 3 && buf[i] === 0x5e && (
        (buf[i + 1] === 0x58 && buf[i + 2] === 0x41) ||
        (buf[i + 1] === 0x78 && buf[i + 2] === 0x61)
    );
    const isEnd = (i) => i <= n - 3 && buf[i] === 0x5e && (
        (buf[i + 1] === 0x58 && buf[i + 2] === 0x5a) ||
        (buf[i + 1] === 0x78 && buf[i + 2] === 0x7a)
    );
    let start = -1;
    for (let i = 0; i <= n - 3; i++) {
        if (isStart(i)) {
            start = i;
            break;
        }
    }
    if (start < 0) return null;
    let endPos = -1;
    for (let j = start + 3; j <= n - 3; j++) {
        if (isEnd(j)) endPos = j + 3;
    }
    if (endPos <= start || endPos - start > ZPL_MAX_CHARS) return null;
    const z = buf.subarray(start, endPos).toString('latin1').replace(/\0/g, '').trim();
    return z.length >= 8 ? z : null;
}

function extractZplUtf16LEBytes(buf) {
    if (!buf || buf.length < 12) return null;
    const n = buf.length;
    const isStart16 = (i) => {
        if (i > n - 6) return false;
        if (buf[i] !== 0x5e || buf[i + 1] !== 0) return false;
        const x = buf[i + 2];
        if (x !== 0x58 && x !== 0x78) return false;
        if (buf[i + 3] !== 0) return false;
        const a = buf[i + 4];
        if (a !== 0x41 && a !== 0x61) return false;
        return buf[i + 5] === 0;
    };
    const isEnd16 = (i) => {
        if (i > n - 6) return false;
        if (buf[i] !== 0x5e || buf[i + 1] !== 0) return false;
        const x = buf[i + 2];
        if (x !== 0x58 && x !== 0x78) return false;
        if (buf[i + 3] !== 0) return false;
        const z = buf[i + 4];
        if (z !== 0x5a && z !== 0x7a) return false;
        return buf[i + 5] === 0;
    };
    let start = -1;
    for (let i = 0; i <= n - 6; i++) {
        if (isStart16(i)) {
            start = i;
            break;
        }
    }
    if (start < 0) return null;
    let endPos = -1;
    for (let j = start + 6; j <= n - 6; j++) {
        if (isEnd16(j)) endPos = j + 6;
    }
    if (endPos <= start || (endPos - start) > ZPL_MAX_CHARS * 2) return null;
    try {
        const z = buf.subarray(start, endPos).toString('utf16le').replace(/\0/g, '').trim();
        return z.length >= 8 ? z : null;
    } catch (_) {
        return null;
    }
}

/** ^ X A em UTF-16 BE: 00 5E 00 58 00 41 */
function extractZplUtf16BEBytes(buf) {
    if (!buf || buf.length < 12) return null;
    const n = buf.length;
    const isStart16 = (i) => {
        if (i > n - 6) return false;
        if (buf[i] !== 0 || buf[i + 1] !== 0x5e) return false;
        if (buf[i + 2] !== 0) return false;
        const x = buf[i + 3];
        if (x !== 0x58 && x !== 0x78) return false;
        if (buf[i + 4] !== 0) return false;
        const a = buf[i + 5];
        return a === 0x41 || a === 0x61;
    };
    const isEnd16 = (i) => {
        if (i > n - 6) return false;
        if (buf[i] !== 0 || buf[i + 1] !== 0x5e) return false;
        if (buf[i + 2] !== 0) return false;
        const x = buf[i + 3];
        if (x !== 0x58 && x !== 0x78) return false;
        if (buf[i + 4] !== 0) return false;
        const z = buf[i + 5];
        return z === 0x5a || z === 0x7a;
    };
    let start = -1;
    for (let i = 0; i <= n - 6; i++) {
        if (isStart16(i)) {
            start = i;
            break;
        }
    }
    if (start < 0) return null;
    let endPos = -1;
    for (let j = start + 6; j <= n - 6; j++) {
        if (isEnd16(j)) endPos = j + 6;
    }
    if (endPos <= start || (endPos - start) > ZPL_MAX_CHARS * 2) return null;
    try {
        let z = '';
        for (let k = start; k + 1 < endPos; k += 2) {
            z += String.fromCharCode((buf[k] << 8) | buf[k + 1]);
        }
        z = z.replace(/\0/g, '').trim();
        return z.length >= 8 ? z : null;
    } catch (_) {
        return null;
    }
}

function extractZplFromBuffer(buf) {
    return extractZplAsciiBytes(buf) || extractZplUtf16LEBytes(buf) || extractZplUtf16BEBytes(buf);
}

function isPkZip(buf) {
    return buf && buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
}

function extractZplFromZip(buf) {
    let o = 0;
    while (o <= buf.length - 30) {
        if (buf[o] !== 0x50 || buf[o + 1] !== 0x4b || buf[o + 2] !== 0x03 || buf[o + 3] !== 0x04) {
            o++;
            continue;
        }
        const flags = buf.readUInt16LE(o + 6);
        const method = buf.readUInt16LE(o + 8);
        const compSize = buf.readUInt32LE(o + 18);
        const nameLen = buf.readUInt16LE(o + 26);
        const extraLen = buf.readUInt16LE(o + 28);
        const dataStart = o + 30 + nameLen + extraLen;
        const dataEnd = dataStart + compSize;
        if (dataEnd > buf.length || compSize === 0xffffffff) {
            break;
        }
        o = dataEnd;
        if (flags & 1) continue;
        if (flags & 8) continue;
        const compData = buf.subarray(dataStart, dataEnd);
        let ucd;
        try {
            if (method === 0) {
                ucd = Buffer.from(compData);
            } else if (method === 8) {
                ucd = zlib.inflateRawSync(compData);
            } else {
                continue;
            }
        } catch (_) {
            continue;
        }
        const zpl = extractZplFromBuffer(ucd);
        if (zpl) return zpl;
    }
    return null;
}

function zipHasEncryptedEntry(buf) {
    if (!isPkZip(buf)) return false;
    let o = 0;
    while (o <= buf.length - 30) {
        if (buf[o] !== 0x50 || buf[o + 1] !== 0x4b || buf[o + 2] !== 0x03 || buf[o + 3] !== 0x04) {
            o++;
            continue;
        }
        const flags = buf.readUInt16LE(o + 6);
        const compSize = buf.readUInt32LE(o + 18);
        const nameLen = buf.readUInt16LE(o + 26);
        const extraLen = buf.readUInt16LE(o + 28);
        const dataStart = o + 30 + nameLen + extraLen;
        const dataEnd = dataStart + compSize;
        if (dataEnd > buf.length || compSize === 0xffffffff) break;
        o = dataEnd;
        if (flags & 1) return true;
    }
    return false;
}

function extractZplFromLabelBinary(buf) {
    const direct = extractZplFromBuffer(buf);
    if (direct) return direct;
    if (isPkZip(buf)) {
        return extractZplFromZip(buf);
    }
    return null;
}

/**
 * @returns {Promise<Buffer|null>}
 */
function getLabelPreviewFailure(buf) {
    if (zipHasEncryptedEntry(buf)) {
        return {
            code: 'ENCRYPTED_ZIP',
            message: 'Este .nlbl/.lbl está encriptado pelo ZebraDesigner (ZIP com proteção). O AXIS não consegue ler o desenho da etiqueta nem gerar imagem.',
            hint: 'No ZebraDesigner: Ficheiro → Imprimir para ficheiro ou Exportar → escolha ZPL (.zpl). Carregue o .zpl na Documentação AXIS para ver a pré-visualização em imagem, como nos outros ficheiros.'
        };
    }
    if (isPkZip(buf)) {
        return {
            code: 'ZIP_NO_ZPL',
            message: 'O ficheiro é um arquivo ZIP (formato ZebraDesigner), mas não foi encontrado ZPL (^XA…^XZ) nas partes legíveis.',
            hint: 'Exporte o rótulo como .zpl no ZebraDesigner e envie esse ficheiro.'
        };
    }
    return {
        code: 'NO_ZPL',
        message: 'Não foi encontrado um bloco ZPL (^XA…^XZ) neste ficheiro.',
        hint: 'Exporte para .zpl no ZebraDesigner ou envie uma imagem (PNG/JPEG) se só precisar de consulta visual.'
    };
}

function renderZplToPngBuffer(zpl) {
    const zplBuf = Buffer.from(zpl, 'utf8');
    return new Promise((resolve) => {
        const opt = {
            hostname: 'api.labelary.com',
            port: 80,
            path: '/v1/printers/8dpmm/labels/4x6/0/',
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Content-Length': String(zplBuf.length),
                Accept: 'image/png'
            }
        };
        const preq = http.request(opt, (pres) => {
            const chunks = [];
            pres.on('data', (c) => chunks.push(c));
            pres.on('end', () => {
                if (pres.statusCode !== 200) {
                    resolve(null);
                    return;
                }
                resolve(Buffer.concat(chunks));
            });
        });
        preq.setTimeout(22000, () => {
            try {
                preq.destroy();
            } catch (e) { /* ignore */ }
            resolve(null);
        });
        preq.on('error', () => resolve(null));
        preq.write(zplBuf);
        preq.end();
    });
}

module.exports = {
    ZPL_MAX_CHARS,
    extractZplFromLabelBinary,
    zipHasEncryptedEntry,
    isPkZip,
    getLabelPreviewFailure,
    renderZplToPngBuffer
};
