/**
 * Armazenamento de preventivas Packing Machine (site + WhatsApp).
 */
const path = require('path');
const { DATA_DIR } = require('./config');
const { readJsonSync, writeJson } = require('./data');

const PACKING_PREVENTIVAS_FILE = path.join(DATA_DIR, 'packing-preventivas.json');

async function persistPackingPreventivaReg(reg) {
    let lista = [];
    try {
        const data = readJsonSync(PACKING_PREVENTIVAS_FILE, []);
        lista = Array.isArray(data) ? data : (data.preventivas || []);
    } catch (e) {
        lista = [];
    }
    lista.unshift(reg);
    await writeJson(PACKING_PREVENTIVAS_FILE, lista);
}

async function registerPreventivaFromWhatsApp(payload) {
    const tarefas = Array.isArray(payload.tarefas) ? payload.tarefas.filter(Boolean) : [];
    const reg = {
        id: 'prev_wa_' + Date.now(),
        dataHora: payload.dataHora || new Date().toISOString(),
        usuario: String(payload.usuario || '').substring(0, 120),
        numeroPm: String(payload.numeroPm || '').trim(),
        tarefas,
        preventivaRealizada: tarefas.join(', '),
        observacao: String(payload.observacao || '').substring(0, 500),
        origem: 'whatsapp',
        phone: payload.phone != null ? String(payload.phone).substring(0, 20) : undefined
    };
    if (payload.nomeCompleto) reg.nomeCompleto = String(payload.nomeCompleto).substring(0, 120);
    if (payload.matriculaAxis) reg.matriculaAxis = String(payload.matriculaAxis).replace(/\D/g, '').substring(0, 8);
    if (payload.localidade) reg.localidade = String(payload.localidade).substring(0, 120);
    await persistPackingPreventivaReg(reg);
}

module.exports = {
    PACKING_PREVENTIVAS_FILE,
    persistPackingPreventivaReg,
    registerPreventivaFromWhatsApp
};
