/**
 * Corrige confusão comum no WhatsApp: zero (0) escrito como letra O.
 * Ex.: "6O86" → "6086". Só altera O/o quando adjacente a dígito.
 */
function normalizeSelbettiCodigoTypo(s) {
    const t = String(s || '').trim();
    if (!t) return t;
    return t.replace(/[Oo]/g, (ch, i, str) => {
        const prev = str.charAt(i - 1);
        const next = str.charAt(i + 1);
        if ((prev && /\d/.test(prev)) || (next && /\d/.test(next))) return '0';
        return ch;
    });
}

module.exports = { normalizeSelbettiCodigoTypo };
