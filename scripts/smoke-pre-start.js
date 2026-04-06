#!/usr/bin/env node
/**
 * Testes rápidos antes de subir o servidor (sem abrir porta HTTP).
 * Uso: npm run smoke
 * Opcional (demora ~1–3 min, abre browser se HEADED=1): npm run smoke -- --playwright-login
 */

const path = require('path');
const fs = require('fs');
const root = path.resolve(__dirname, '..');

process.chdir(root);

const errors = [];
function ok(m) {
    console.log('✓', m);
}
function fail(m) {
    console.error('✗', m);
    errors.push(m);
}

const { loadAxisDotenv } = require(path.join(root, 'backend', 'axis-load-dotenv'));
loadAxisDotenv(root);

const modules = [
    ['backend/config.js', 'config'],
    ['backend/routes.js', 'routes'],
    ['backend/whatsapp-packing-bot.js', 'whatsapp-packing-bot'],
    ['backend/whatsapp-connector.js', 'whatsapp-connector'],
    ['backend/selbetti-chamado-submit.js', 'selbetti-chamado-submit'],
    ['backend/selbetti-chamado-api.js', 'selbetti-chamado-api'],
    ['backend/selbetti-portal-playwright.js', 'selbetti-portal-playwright'],
    ['backend/axis-load-dotenv.js', 'axis-load-dotenv']
];

for (const [rel, label] of modules) {
    try {
        const p = path.join(root, rel);
        delete require.cache[require.resolve(p)];
        require(p);
        ok('require ' + label);
    } catch (e) {
        fail(label + ': ' + (e.message || e));
    }
}

const u = String(process.env.SELBETTI_PORTAL_USER || '').trim();
const p = String(process.env.SELBETTI_PORTAL_PASSWORD || process.env.SELBETTI_PORTAL_PASS || '').trim();
if (!u) fail('SELBETTI_PORTAL_USER vazio');
else ok('SELBETTI_PORTAL_USER definido');

if (!p) fail('SELBETTI_PORTAL_PASSWORD / ficheiro senha vazio');
else ok('SELBETTI senha definida no processo');

try {
    require.resolve('playwright');
    ok('npm: pacote playwright');
} catch (e) {
    fail('npm: instale playwright (npm install playwright)');
}

const { handleIncoming } = require(path.join(root, 'backend', 'whatsapp-packing-bot'));
if (typeof handleIncoming !== 'function') fail('handleIncoming não é função');
else ok('handleIncoming exportado');

async function runPlaywrightLoginProbe() {
    const want = process.argv.includes('--playwright-login');
    if (!want) {
        ok('Playwright login (omitido — use npm run smoke -- --playwright-login)');
        return;
    }
    if (!u || !p) {
        fail('--playwright-login ignorado: sem credenciais');
        return;
    }
    console.log('\n⏳ Teste Playwright login (pode demorar até ~2 min)…');
    try {
        const { testSelbettiPortalLoginOnly } = require(path.join(root, 'backend', 'selbetti-portal-playwright'));
        const r = await testSelbettiPortalLoginOnly();
        if (r.ok) {
            ok('Playwright login: OK — URL final: ' + (r.finalUrl || '').substring(0, 80));
        } else {
            fail('Playwright login: ' + (r.error || 'falhou'));
        }
    } catch (e) {
        fail('Playwright login exceção: ' + (e.message || e));
    }
}

(async () => {
    await runPlaywrightLoginProbe();

    if (errors.length) {
        console.error('\n❌ Smoke falhou (' + errors.length + ' problema(s)). Corrija antes do start.bat.\n');
        process.exit(1);
    }
    console.log('\n✅ Smoke OK — pode subir o servidor (npm start / start.bat).\n');
    process.exit(0);
})();
