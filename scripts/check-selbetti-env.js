#!/usr/bin/env node
/**
 * Verifica se as variáveis Selbetti chegam ao processo Node (sem mostrar senhas).
 * Uso: npm run check-selbetti-env
 */

const path = require('path');
const fs = require('fs');
const rootDir = path.resolve(__dirname, '..');
const { loadAxisDotenv, logAxisDotenvSummary } = require(path.join(rootDir, 'backend', 'axis-load-dotenv'));

const r = loadAxisDotenv(rootDir);
console.log('\n--- axis-load-dotenv (ficheiros tentados) ---');
for (const row of r.results) {
    const st = row.loaded ? `OK ${row.keys} chaves` : row.err ? `ERRO ${row.err}` : '— (não existe)';
    console.log(`  ${row.label}: ${st}`);
}
logAxisDotenvSummary(r.results);
const u = (process.env.SELBETTI_PORTAL_USER || '').trim();
const p = (process.env.SELBETTI_PORTAL_PASSWORD || process.env.SELBETTI_PORTAL_PASS || '').trim();
const pwFile = path.join(rootDir, 'config', 'data', 'selbetti-portal-password.txt');
const pwFileExists = fs.existsSync(pwFile);
console.log('\nResumo:');
console.log('  SELBETTI_PORTAL_USER     →', u ? `"${u.substring(0, 3)}…" (${u.length} caracteres)` : '(vazio)');
console.log(
    '  SELBETTI_PORTAL_PASSWORD →',
    p ? `definida (${p.length} caracteres)` : '(vazio — preencha no .env ou use config/data/selbetti-portal-password.txt)'
);
console.log('  Ficheiro senha (1 linha) →', pwFileExists ? pwFile : '(não existe — opcional)');
console.log('  SELBETTI_USE_PLAYWRIGHT  →', process.env.SELBETTI_USE_PLAYWRIGHT || '(omisso = Playwright ligado se houver user+pass)');
console.log('');
