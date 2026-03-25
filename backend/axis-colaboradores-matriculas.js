/**
 * Matrículas AXIS (colaboradores) — usado pelo bot WhatsApp e API do site.
 * Ficheiro: config/data/axis-colaboradores-matriculas.json
 */
const path = require('path');
const fs = require('fs');
const { DATA_DIR } = require('./config');
const { readJsonSync, writeJson } = require('./data');

const FILE = path.join(DATA_DIR, 'axis-colaboradores-matriculas.json');

const SEED_NOMES = [
    'FILIPE DA SILVA',
    'THIAGO LEONARDO SILVA',
    'JOÃO VICTOR MACHADO CORREA',
    'RAFFAEL DOS SANTOS PEREIRA',
    'JESUS DAVID ESPINOZA GRANADO',
    'HENRIQUE MARAFIGO DA COSTA',
    'CLEBER AUGUSTO FONTORA SCHENCKEL',
    'GABRIEL PLATT',
    'ADALBINO CAUNCRA FERNANDES GOMES',
    'NITAY DE LIMA RABELO',
    'BEATRIZ SILVA DA CONCEIÇÃO',
    'RAFAELA DO SOCORRO DA SILVA PIRES',
    'TAINA DALCHIAVON MARCOS'
];

function normalizeNome(s) {
    return String(s || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ');
}

function seedIfEmpty(data) {
    if (data.colaboradores && data.colaboradores.length > 0) return data;
    const colaboradores = SEED_NOMES.map((nome, i) => ({
        matricula: String(i + 1).padStart(4, '0'),
        nome
    }));
    const next = { nextSeq: SEED_NOMES.length + 1, colaboradores };
    writeJson(FILE, next).catch(() => {});
    return next;
}

function loadStateSync() {
    let data = readJsonSync(FILE, null);
    if (!data || typeof data !== 'object' || !Array.isArray(data.colaboradores)) {
        data = { nextSeq: 1, colaboradores: [] };
    }
    if (!data.nextSeq || data.nextSeq < 1) data.nextSeq = (data.colaboradores && data.colaboradores.length) ? data.colaboradores.length + 1 : 1;
    if (!fs.existsSync(FILE) || !data.colaboradores.length) {
        data = seedIfEmpty(data);
    }
    return data;
}

function getColaboradoresList() {
    return loadStateSync().colaboradores;
}

function formatListaWhatsapp() {
    const list = getColaboradoresList();
    return list.map((c, i) => `*${i + 1}* – *${c.matricula}* – ${c.nome}`).join('\n');
}

/**
 * Aceita número da lista (1..N), matrícula (ex: 1, 01, 0001) ou só dígitos que casem com matrícula.
 */
function resolveSelecaoMatricula(texto) {
    const list = getColaboradoresList();
    const raw = String(texto || '').trim();
    if (!raw || !list.length) return null;

    const digits = raw.replace(/\D/g, '');
    if (digits) {
        const n = parseInt(digits, 10);
        if (n >= 1 && n <= 9999) {
            const pad = String(n).padStart(4, '0');
            const byMat = list.find((c) => c.matricula === pad);
            if (byMat) return byMat;
        }
    }

    const idx = parseInt(raw.replace(/\s/g, ''), 10);
    if (!isNaN(idx) && idx >= 1 && idx <= list.length && /^\d{1,2}$/.test(raw.trim())) {
        return list[idx - 1];
    }
    return null;
}

async function garantirMatriculaPorNome(nome) {
    const trimmed = String(nome || '').trim();
    if (!trimmed) return { ok: false, error: 'nome_vazio' };
    const norm = normalizeNome(trimmed);
    let data = loadStateSync();
    for (let i = 0; i < data.colaboradores.length; i++) {
        if (normalizeNome(data.colaboradores[i].nome) === norm) {
            return { ok: true, matricula: data.colaboradores[i].matricula, novo: false };
        }
    }
    const matricula = String(data.nextSeq).padStart(4, '0');
    data.colaboradores.push({ matricula, nome: trimmed });
    data.nextSeq = (parseInt(data.nextSeq, 10) || 1) + 1;
    await writeJson(FILE, data);
    return { ok: true, matricula, novo: true };
}

module.exports = {
    FILE,
    getColaboradoresList,
    formatListaWhatsapp,
    resolveSelecaoMatricula,
    garantirMatriculaPorNome,
    loadStateSync
};