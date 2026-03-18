/**
 * Módulo TOTP (2FA) para AXIS - Google Authenticator
 * Requer: npm install speakeasy
 */

const path = require('path');
const speakeasy = require('speakeasy');
const { DATA_DIR } = require('./config');
const { readJson, writeJson } = require('./data');

// Permite apontar para um caminho persistente em produção (ex.: Render Disk)
const TOTP_FILE = process.env.TOTP_FILE || path.join(DATA_DIR, 'totp-secrets.json');
const ISSUER = 'AXIS';

/** Mesma normalização do frontend (axisLoginCanonico): trim, lowercase, espaços e pontos → _ */
function canonKey(login) {
    return String(login || '').trim().toLowerCase().replace(/\s+/g, '_').replace(/\./g, '_');
}

function loadSecrets() {
    return readJson(TOTP_FILE, {}).then(data => typeof data === 'object' ? data : {});
}

function saveSecrets(data) {
    return writeJson(TOTP_FILE, data);
}

async function getDataForLogin(login) {
    if (!login || typeof login !== 'string') return null;
    const key = canonKey(login);
    const data = await loadSecrets();
    return data[key] || null;
}

function getSecretForLoginSync(login) {
    try {
        const fs = require('fs');
        const data = JSON.parse(fs.readFileSync(TOTP_FILE, 'utf8') || '{}');
        const key = canonKey(login);
        if (data[key] && data[key].secret) return String(data[key].secret).trim();
        for (const k in data) {
            if (data[k] && data[k].secret && canonKey(k) === key) return String(data[k].secret).trim();
        }
        return null;
    } catch (e) {
        return null;
    }
}

function getSecretForLogin(login) {
    // Versão síncrona usada pelas rotas (verify-totp/reset/confirm)
    return getSecretForLoginSync(login);
}

function isTotpEnabled(login) {
    return getDataForLogin(login).then(d => !!(d && d.enabled === true));
}

function buildOtpauthUrl(login, secret) {
    if (!secret) return null;
    const label = encodeURIComponent(ISSUER + ':' + (login || 'user'));
    return 'otpauth://totp/' + label + '?secret=' + secret + '&issuer=' + encodeURIComponent(ISSUER);
}

function generateSecret(login) {
    const key = canonKey(login || 'user');
    const gen = speakeasy.generateSecret({
        length: 20,
        name: ISSUER + ' (' + key + ')',
        issuer: ISSUER
    });
    const secret = (gen.base32 || gen.ascii || gen.hex) ? (gen.base32 || gen.ascii) : null;
    if (!secret) throw new Error('Falha ao gerar segredo');
    const otpauthUrl = gen.otpauth_url || buildOtpauthUrl(key, secret);
    return { secret, otpauthUrl };
}

async function saveSecret(login, secret) {
    if (!login || !secret) return;
    const key = canonKey(login);
    const data = await loadSecrets();
    if (!data[key]) data[key] = {};
    data[key].secret = String(secret).trim();
    data[key].enabled = data[key].enabled === true;
    await saveSecrets(data);
}

async function removeTotp(login) {
    if (!login) return;
    const key = canonKey(login);
    const data = await loadSecrets();
    delete data[key];
    await saveSecrets(data);
}

function verifyToken(secret, code) {
    if (!secret || !code) return false;
    try {
        var raw = String(code).replace(/\D/g, '').trim();
        if (raw.length < 6) return false;
        var token = raw.length > 6 ? raw.slice(-6) : raw;
        var sec = String(secret).trim();
        return speakeasy.totp.verify({
            secret: sec,
            encoding: 'base32',
            token: token,
            window: 6
        });
    } catch (e) {
        return false;
    }
}

async function setLastVerifiedAt(login) {
    const key = canonKey(login);
    if (!key) return;
    const data = await loadSecrets();
    if (data[key]) {
        data[key].lastVerifiedAt = new Date().toISOString();
        await saveSecrets(data);
    }
}

async function resetTotpRequire(login) {
    const key = canonKey(login);
    if (!key) return;
    const data = await loadSecrets();
    if (data[key]) {
        data[key].requireEveryEntry = false;
        data[key].lastVerifiedAt = new Date().toISOString();
        await saveSecrets(data);
    }
}

async function enableTotp(login) {
    const key = canonKey(login);
    if (!key) return;
    const data = await loadSecrets();
    if (data[key]) {
        data[key].enabled = true;
        // Ao ativar 2FA, força pedir código no próximo login (sem lastVerifiedAt)
        if (data[key].lastVerifiedAt) delete data[key].lastVerifiedAt;
        await saveSecrets(data);
    }
}

// Regra: se enabled=true, pedir TOTP quando:
// - nunca foi verificado (sem lastVerifiedAt), OU
// - requireEveryEntry=true (modo \"mais rígido\"), OU
// - já passou mais de MAX_AGE_MIN minutos desde a última verificação
const MAX_TOTP_AGE_MINUTES = 60;

function shouldRequireTotp(login) {
    return getDataForLogin(login).then(d => {
        if (!d || d.enabled !== true) return false;
        if (d.requireEveryEntry === true) return true;
        if (!d.lastVerifiedAt) return true;
        try {
            const last = new Date(d.lastVerifiedAt).getTime();
            if (!last || isNaN(last)) return true;
            const now = Date.now();
            const diffMin = (now - last) / 60000;
            return diffMin >= MAX_TOTP_AGE_MINUTES;
        } catch (e) {
            return true;
        }
    });
}

function requireTotpEveryEntry(login) {
    return getDataForLogin(login).then(function (d) { return !!(d && d.requireEveryEntry === true); });
}

module.exports = {
    getSecretForLogin,
    getSecretForLoginSync,
    isTotpEnabled,
    buildOtpauthUrl,
    generateSecret,
    saveSecret,
    removeTotp,
    verifyToken,
    setLastVerifiedAt,
    resetTotpRequire,
    enableTotp,
    shouldRequireTotp,
    requireTotpEveryEntry
};
