/**
 * Números W do cartão avulso (MeliHelp) — persistência no servidor para WhatsApp + sincronização com o site.
 */
const path = require('path');
const { DATA_DIR } = require('./config');
const { readJsonSync, writeJson } = require('./data');

const MELIHELP_ATAS_AVULSO_W_FILE = path.join(DATA_DIR, 'melihelp-atas-avulso-w.json');

function normalizeW(raw) {
    let s = String(raw || '').trim();
    s = s.replace(/^\s*W\s*:\s*/i, '');
    s = s.replace(/\s+/g, '');
    return s;
}

function pad2(n) {
    return n < 10 ? `0${n}` : String(n);
}

/** Igual ao cordão no site: carimbo cai no calendário do mês destino (pasta 1–12), não na data “hoje” se for outro mês. */
function isoStampForBucketYearMonth(yearStr, monthNum) {
    const y = parseInt(String(yearStr), 10);
    const m = monthNum;
    if (Number.isNaN(y) || m < 1 || m > 12) {
        return new Date().toISOString();
    }
    const now = new Date();
    if (now.getFullYear() === y && now.getMonth() + 1 === m) {
        return now.toISOString();
    }
    const lastDay = new Date(y, m, 0).getDate();
    const day = Math.min(now.getDate(), lastDay);
    return new Date(y, m - 1, day, now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds()).toISOString();
}

function loadDoc() {
    const d = readJsonSync(MELIHELP_ATAS_AVULSO_W_FILE, null);
    if (!d || typeof d !== 'object') return { byYearMonth: {}, updatedAt: null };
    if (!d.byYearMonth || typeof d.byYearMonth !== 'object') d.byYearMonth = {};
    return d;
}

async function saveDoc(doc) {
    doc.updatedAt = new Date().toISOString();
    await writeJson(MELIHELP_ATAS_AVULSO_W_FILE, doc);
}

/** Lista plana dos últimos W (para o site avisar “há dados noutro mês”). */
function flattenRecentFromDoc(doc, limit) {
    const by = doc && doc.byYearMonth;
    if (!by || typeof by !== 'object') return [];
    const out = [];
    for (const y of Object.keys(by)) {
        const months = by[y];
        if (!months || typeof months !== 'object') continue;
        for (const moKey of Object.keys(months)) {
            const arr = months[moKey];
            if (!Array.isArray(arr)) continue;
            const mi = parseInt(String(moKey).replace(/\D/g, ''), 10);
            const mo = !Number.isNaN(mi) && mi >= 1 && mi <= 12 ? pad2(mi) : String(moKey).padStart(2, '0');
            for (const e of arr) {
                if (e && typeof e === 'object' && e.id) {
                    out.push({
                        id: e.id,
                        year: String(y),
                        month: mo,
                        wNorm: e.wNorm,
                        wDisplay: e.wDisplay,
                        addedAt: e.addedAt,
                        source: e.source
                    });
                }
            }
        }
    }
    out.sort((a, b) => String(b.addedAt || '').localeCompare(String(a.addedAt || '')));
    return out.slice(0, Math.min(Math.max(limit || 20, 1), 50));
}

function entriesForYearMonth(doc, year, month) {
    const y = String(year || '').trim();
    const mi = parseInt(String(month).replace(/\D/g, ''), 10);
    if (!/^\d{4}$/.test(y) || Number.isNaN(mi) || mi < 1 || mi > 12) return [];
    const mo = pad2(mi);
    const by = doc && doc.byYearMonth;
    if (!by || !by[y]) return [];
    const monthObj = by[y];
    if (Array.isArray(monthObj[mo])) return monthObj[mo];
    const alt = String(mi);
    if (Array.isArray(monthObj[alt])) return monthObj[alt];
    return [];
}

/**
 * @param {{ year: string, month: string, wRaw: string, source?: string, whatsappPhone?: string }} p
 */
async function appendEntry(p) {
    const y = String(p.year || '').trim();
    if (!/^\d{4}$/.test(y)) return { ok: false, reason: 'ano' };
    const mi = parseInt(String(p.month).replace(/\D/g, ''), 10);
    if (Number.isNaN(mi) || mi < 1 || mi > 12) return { ok: false, reason: 'mes' };
    const mo = pad2(mi);
    const norm = normalizeW(p.wRaw);
    if (!norm) return { ok: false, reason: 'w' };
    const doc = loadDoc();
    if (!doc.byYearMonth[y]) doc.byYearMonth[y] = {};
    if (!Array.isArray(doc.byYearMonth[y][mo])) doc.byYearMonth[y][mo] = [];
    const disp = String(p.wRaw || '')
        .replace(/^\s*W\s*:\s*/i, '')
        .trim()
        .replace(/;/g, ' ')
        .trim() || norm;
    const entry = {
        id: `wa_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        wNorm: norm,
        wDisplay: disp,
        addedAt: isoStampForBucketYearMonth(y, mi),
        source: p.source ? String(p.source).substring(0, 32) : 'whatsapp',
        whatsappPhone: p.whatsappPhone != null ? String(p.whatsappPhone).substring(0, 24) : undefined
    };
    doc.byYearMonth[y][mo].push(entry);
    try {
        await saveDoc(doc);
    } catch (e) {
        console.error('[melihelp-atas-avulso-w] appendEntry gravar ficheiro:', e && e.message);
        return { ok: false, reason: 'write' };
    }
    return { ok: true, entry, year: y, month: mo };
}

/**
 * Grava entrada criada no browser (mesmo id) para não duplicar ao sincronizar.
 * @param {string} year
 * @param {string} month
 * @param {{ id: string, wNorm?: string, wDisplay?: string, addedAt?: string, source?: string }} entry
 */
async function putEntry(year, month, entry) {
    const y = String(year || '').trim();
    if (!/^\d{4}$/.test(y)) return { ok: false, reason: 'ano' };
    const mi = parseInt(String(month).replace(/\D/g, ''), 10);
    if (Number.isNaN(mi) || mi < 1 || mi > 12) return { ok: false, reason: 'mes' };
    const mo = pad2(mi);
    if (!entry || typeof entry !== 'object' || !entry.id) return { ok: false, reason: 'entry' };
    const doc = loadDoc();
    if (!doc.byYearMonth[y]) doc.byYearMonth[y] = {};
    if (!Array.isArray(doc.byYearMonth[y][mo])) doc.byYearMonth[y][mo] = [];
    const list = doc.byYearMonth[y][mo];
    if (list.some((r) => r && r.id === entry.id)) return { ok: true, duplicate: true };
    const norm = normalizeW(entry.wDisplay || entry.wNorm || '');
    if (!norm) return { ok: false, reason: 'w' };
    list.push({
        id: String(entry.id).substring(0, 80),
        wNorm: norm,
        wDisplay: String(entry.wDisplay || entry.wNorm || norm).substring(0, 120),
        addedAt: entry.addedAt || isoStampForBucketYearMonth(y, mi),
        source: entry.source ? String(entry.source).substring(0, 32) : 'melihelp_site'
    });
    try {
        await saveDoc(doc);
    } catch (e) {
        console.error('[melihelp-atas-avulso-w] putEntry gravar ficheiro:', e && e.message);
        return { ok: false, reason: 'write' };
    }
    return { ok: true };
}

module.exports = {
    MELIHELP_ATAS_AVULSO_W_FILE,
    loadDoc,
    appendEntry,
    putEntry,
    normalizeW,
    flattenRecentFromDoc,
    entriesForYearMonth
};
