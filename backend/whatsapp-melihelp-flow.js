/**
 * MeliHelp no WhatsApp — módulo isolado (passos mh_*).
 * Não mistura com Selbetti (opção 8) nem com Packing troca/preventiva.
 * Padrão semelhante ao fluxo Status de Bancada: códigos claros + passos fixos.
 */

'use strict';

const { PORT: AXIS_SERVER_PORT } = require('./config');
const { appendEntry: melihelpAppendAtasAvulsoW } = require('./melihelp-atas-avulso-w-persist');

/** Passos internos — prefixo mh_ evita colisão com selbetti_*, status_*, prev_*, etc. */
const MH = {
    HUB: 'mh_hub',
    RET_RE: 'mh_ret_re',
    RET_NOME: 'mh_ret_nome',
    REC_QTD: 'mh_rec_qtd',
    REC_ANO: 'mh_rec_ano',
    REC_MES: 'mh_rec_mes',
    LINHA: 'mh_linha',
    W_ANO: 'mh_w_ano',
    W_MES: 'mh_w_mes',
    W_NUM: 'mh_w_numero'
};

const LEGACY_STEP_MAP = {
    melihelp_menu: MH.HUB,
    melihelp_ret_re: MH.RET_RE,
    melihelp_ret_nome: MH.RET_NOME,
    melihelp_rec_qtd: MH.REC_QTD,
    melihelp_rec_ano: MH.REC_ANO,
    melihelp_rec_mes: MH.REC_MES,
    melihelp_linha: MH.LINHA,
    melihelp_avulso_ano: MH.W_ANO,
    melihelp_avulso_mes: MH.W_MES,
    melihelp_avulso_w: MH.W_NUM
};

function melihelpPageUrl(baseUrl) {
    const b = String(baseUrl || '').replace(/\/$/, '');
    if (!b) return `http://localhost:${AXIS_SERVER_PORT}/pages/melihelp.html`;
    return `${b}/pages/melihelp.html`;
}

function sanitizeWhatsappUserText(s) {
    return String(s || '')
        .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '')
        .trim();
}

function stripAcc(s) {
    return String(s || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

function pad2Mes(n) {
    const x = parseInt(String(n).replace(/\D/g, ''), 10);
    if (isNaN(x) || x < 1 || x > 12) return null;
    return String(x).padStart(2, '0');
}

function parseMelihelpMesBr(input) {
    const raw = sanitizeWhatsappUserText(input);
    if (!raw) return null;
    const t = stripAcc(raw).replace(/\./g, ' ');
    const MAP = {
        janeiro: 1,
        jan: 1,
        fevereiro: 2,
        fev: 2,
        marco: 3,
        mar: 3,
        abril: 4,
        abr: 4,
        maio: 5,
        mai: 5,
        junho: 6,
        jun: 6,
        julho: 7,
        jul: 7,
        agosto: 8,
        ago: 8,
        setembro: 9,
        set: 9,
        outubro: 10,
        out: 10,
        novembro: 11,
        nov: 11,
        dezembro: 12,
        dez: 12
    };
    if (MAP[t] != null) return String(MAP[t]).padStart(2, '0');
    return pad2Mes(raw);
}

const MESES_PT_LABEL = [
    '',
    'JANEIRO',
    'FEVEREIRO',
    'MARÇO',
    'ABRIL',
    'MAIO',
    'JUNHO',
    'JULHO',
    'AGOSTO',
    'SETEMBRO',
    'OUTUBRO',
    'NOVEMBRO',
    'DEZEMBRO'
];

function monthLabelPt(mm) {
    const i = parseInt(String(mm || '').replace(/\D/g, ''), 10);
    if (!isNaN(i) && i >= 1 && i <= 12) return MESES_PT_LABEL[i];
    return String(mm || '');
}

/** Migra sessões antigas (melihelp_*) para mh_* e grava no Map. */
function migrateLegacyMelihelpStep(from, estados) {
    const e = estados.get(from);
    if (!e || typeof e.step !== 'string') return;
    const next = LEGACY_STEP_MAP[e.step];
    if (next) {
        e.step = next;
        e.atividade = 'melihelp';
        estados.set(from, e);
    }
}

function isMelihelpFlow(estado) {
    if (!estado) return false;
    if (estado.atividade === 'melihelp') return true;
    return typeof estado.step === 'string' && estado.step.startsWith('mh_');
}

/**
 * No hub: aceita 1–5, MH1–MH5, mh-w, cartão, etc. (não confundir com Selbetti.)
 */
function normalizeMelihelpHubChoice(raw) {
    const s = sanitizeWhatsappUserText(raw);
    const low = stripAcc(s).replace(/\s+/g, '').replace(/-/g, '');
    if (low === 'mh0' || low === 'voltar') return '0';
    if (low === 'mh1' || low === 'm1') return '1';
    if (low === 'mh2' || low === 'm2') return '2';
    if (low === 'mh3' || low === 'm3') return '3';
    if (low === 'mh4' || low === 'm4') return '4';
    if (low === 'mh5' || low === 'm5' || low === 'mhw' || low === 'cartaoavulso' || low === 'numerow' || low === 'cadastrarw') return '5';
    const t = s.trim();
    if (t === '1' || t === '1.') return '1';
    if (t === '2' || t === '2.') return '2';
    if (t === '3' || t === '3.') return '3';
    if (t === '4' || t === '4.') return '4';
    if (t === '5' || t === '5.') return '5';
    if (t === '0' || t === '0.') return '0';
    return t;
}

const MSG = {
    banner: '📦 *MELIHELP* (site AXIS — *não* é Selbetti · Selbetti = opção *8* no menu principal)',

    hub: `📦 *MELIHELP · hub*

${'─'.repeat(22)}
*Cartão avulso (W)* → grava em *config/data* no servidor (igual *Status de Bancada* / Packing).
${'─'.repeat(22)}

Atalhos: *MH1*…*MH5* ou *1*…*5*
*MH5* ou *cartao avulso* = só número W (passo a passo)

*Linha direta (grava já):*
\`cartaoavulso;2026;04;069.56178\`

*1* – Retirada cordão (linha para colar no site)
*2* – Recebimento cordão
*3* – Links do hub (#/atas, cordão, crachás)
*4* – Colar linha (retirada / recebimento / *cartaoavulso* → *grava W*)
*5* – *Cartão W* passo a passo (ano → mês → número)
*0* – Voltar ao menu AXIS

_Digite *0* a *5* ou *MH0*–*MH5*_`,

    retRe: `🎗️ *MELIHELP · retirada*

Digite o *RE ou CPF*.`,
    retReErro: `⚠️ Informe o RE ou CPF.`,
    retNome: `Digite o *nome completo*.`,
    retNomeErro: `⚠️ Nome muito curto.`,
    retOk: (line, pageUrl) => `✅ *Linha retirada*

\`${line}\`

1) ${pageUrl}
2) *AXIS Bot* → *Interpretar linha*`,

    recQtd: `🎗️ *MELIHELP · recebimento*

Digite a *quantidade* (número inteiro).`,
    recQtdErro: `⚠️ Quantidade inválida (ex.: 50).`,
    recAno: `Digite o *ano* (4 dígitos, ex.: 2026).`,
    anoErro: `⚠️ Ano inválido (4 dígitos).`,
    mes: `Digite o *mês* (1–12 ou nome).`,
    mesErro: `⚠️ Mês inválido.`,
    recOk: (line, pageUrl) => `✅ *Linha recebimento*

\`${line}\`

Cole no *AXIS Bot* → *Interpretar*.
🔗 ${pageUrl}`,

    wAno: `📇 *MELIHELP · CARTÃO W · passo 1/3*

${'─'.repeat(18)}
Digite o *ano* (4 dígitos, ex.: *2026*)
${'─'.repeat(18)}`,

    wMes: `📇 *MELIHELP · CARTÃO W · passo 2/3*

Mês do registo (*abril* = *4* ou *04* ou *abr*):

*1*…*12* · nomes · *jan* *fev* *mar*…

⚠️ *4* aqui = *ABRIL* (mês). No *hub*, *4* = colar linha.`,

    wNum: (y, mm, monthLabel) =>
        `📇 *MELIHELP · CARTÃO W · passo 3/3*

✅ *${monthLabel}* (*${mm}*) / *${y}*

Envie só o *número W* (ex.: *069.56178*).`,

    wErro: `⚠️ W inválido ou vazio.`,

    wOkSaved: (line, pageUrl, y, mm, monthLabel, wDisp) => {
        const w = String(wDisp || '').trim() || '(ver linha)';
        const deep = `${pageUrl}#/atas/${y}/${mm}`;
        return `✅ *MELIHELP · W gravado no servidor*

📆 *${monthLabel}* *${y}* · W *${w}*
💾 \`config/data/melihelp-atas-avulso-w.json\`

🔗 Abrir tabela:
${deep}

_Sincroniza no site em ~15 s ou *F5*._

Linha: \`${line}\``;
    },

    wOkFallback: (line, pageUrl) => `⚠️ *MELIHELP · não gravou no servidor*

\`${line}\`

Tente *start.bat* / permissões em *config/data*.
${pageUrl}`,

    links: (pageUrl) => `🔗 *MELIHELP · atalhos*

${pageUrl}

• Cartão W: \`#/atas\`
• Cordão: \`#/cordao\`
• Crachás: \`#/certificados\``,

    linhaPrompt: `📋 *MELIHELP · colar linha*

Separador *;* ou *|*:
• \`retirada;RE;Nome\`
• \`recebimento;qtd;ano;mês\`
• \`cartaoavulso;ano;mês;W\` → *grava no servidor*

*0* = voltar ao hub MeliHelp`,

    linhaOk: (line, pageUrl) => `✅ Formato OK (sem gravação automática neste tipo).

\`${line}\`

🔗 ${pageUrl}`,

    linhaErro: `⚠️ Formato não reconhecido.

• retirada;RE;Nome
• recebimento;50;2026;03
• cartaoavulso;2026;04;069.56178`
};

function parseNumero(texto) {
    const n = parseInt(String(texto || '').replace(/\D/g, ''), 10);
    return isNaN(n) || n < 0 ? null : n;
}

/**
 * Linha cartaoavulso direta — grava e limpa estado.
 */
async function tryDirectCartaoAvulsoLine(rawBody, from, pageUrl, sendReply, estados) {
    const line = sanitizeWhatsappUserText(rawBody);
    const parts = line.split(/[;|]/).map((s) => s.trim()).filter(Boolean);
    if (parts.length < 4) return undefined;
    const cmd = (parts[0] || '').toLowerCase().replace(/\s+/g, '');
    if (cmd !== 'cartaoavulso') return undefined;
    const y = String(parts[1] || '').trim();
    const mi = parseInt(String(parts[2]).replace(/\D/g, ''), 10);
    const wPart = parts.slice(3).join(';').trim().replace(/;/g, ' ');
    if (!/^\d{4}$/.test(y) || Number.isNaN(mi) || mi < 1 || mi > 12 || !wPart) {
        return sendReply(
            from,
            '⚠️ *MELIHELP* — linha *cartaoavulso* inválida.\n\n*cartaoavulso;ANO;MÊS;W*\nEx.: *cartaoavulso;2026;04;069.56178*'
        );
    }
    const mm = String(mi).padStart(2, '0');
    let r;
    try {
        r = await melihelpAppendAtasAvulsoW({
            year: y,
            month: mm,
            wRaw: wPart,
            source: 'whatsapp_line',
            whatsappPhone: from
        });
    } catch (e) {
        console.error('[MeliHelp WA] cartaoavulso direto:', e && e.message ? e.message : e);
        r = { ok: false, reason: 'exception' };
    }
    estados.delete(from);
    const label = monthLabelPt(mm);
    const fullLine = `cartaoavulso;${y};${mm};${wPart}`;
    if (r && r.ok) {
        return sendReply(from, MSG.wOkSaved(fullLine, pageUrl, y, mm, label, wPart));
    }
    const why = r && r.reason ? String(r.reason) : '?';
    console.error('[MeliHelp WA] cartaoavulso direto falhou:', why);
    return sendReply(from, MSG.wOkFallback(fullLine, pageUrl) + `\n\nMotivo: *${why}*`);
}

/**
 * Processa um turno do fluxo MeliHelp. Devolve resposta ou null (não é nosso passo).
 */
async function processMelihelpTurn({ from, msg, pageUrl, estados }) {
    migrateLegacyMelihelpStep(from, estados);
    const st = estados.get(from);
    if (!st || st.atividade === 'selbetti') return null;
    if (!isMelihelpFlow(st)) return null;

    const step = st.step;

    if (step === MH.HUB) {
        const t = normalizeMelihelpHubChoice(msg.body);
        if (t === '0' || t === '0.') {
            estados.set(from, { step: 'menu' });
            return {
                reply:
                    '↩️ *Menu AXIS*\n\nDigite *menu* ou *oi* para ver *1*–*8*. *6* = *MeliHelp* (cartão W, cordão). *8* = *Selbetti* (outro fluxo).'
            };
        }
        if (t === '1' || t === '1.') {
            st.step = MH.RET_RE;
            st.atividade = 'melihelp';
            estados.set(from, st);
            return { reply: MSG.banner + '\n\n' + MSG.retRe };
        }
        if (t === '2' || t === '2.') {
            st.step = MH.REC_QTD;
            st.atividade = 'melihelp';
            estados.set(from, st);
            return { reply: MSG.banner + '\n\n' + MSG.recQtd };
        }
        if (t === '3' || t === '3.') {
            estados.delete(from);
            return { reply: MSG.banner + '\n\n' + MSG.links(pageUrl) };
        }
        if (t === '4' || t === '4.') {
            st.step = MH.LINHA;
            st.atividade = 'melihelp';
            estados.set(from, st);
            return { reply: MSG.banner + '\n\n' + MSG.linhaPrompt };
        }
        if (t === '5' || t === '5.') {
            st.step = MH.W_ANO;
            st.atividade = 'melihelp';
            estados.set(from, st);
            return { reply: MSG.banner + '\n\n' + MSG.wAno };
        }
        return { reply: MSG.hub };
    }

    if (step === MH.RET_RE) {
        const re = sanitizeWhatsappUserText(msg.body);
        if (!re) return { reply: MSG.retReErro };
        st.mh_re = re;
        st.step = MH.RET_NOME;
        estados.set(from, st);
        return { reply: MSG.retNome };
    }

    if (step === MH.RET_NOME) {
        const nome = sanitizeWhatsappUserText(msg.body);
        if (nome.length < 2) return { reply: MSG.retNomeErro };
        const re = (st.mh_re || '').replace(/;/g, ' ').trim();
        const line = `retirada;${re};${nome.replace(/;/g, ' ')}`;
        estados.delete(from);
        return { reply: MSG.retOk(line, pageUrl) };
    }

    if (step === MH.REC_QTD) {
        const qtd = parseNumero(msg.body);
        if (qtd == null || qtd < 1) return { reply: MSG.recQtdErro };
        st.mh_qtd = qtd;
        st.step = MH.REC_ANO;
        estados.set(from, st);
        return { reply: MSG.recAno };
    }

    if (step === MH.REC_ANO) {
        const y = sanitizeWhatsappUserText(msg.body);
        if (!/^\d{4}$/.test(y)) return { reply: MSG.anoErro };
        st.mh_ano = y;
        st.step = MH.REC_MES;
        estados.set(from, st);
        return { reply: MSG.mes };
    }

    if (step === MH.REC_MES) {
        const mm = parseMelihelpMesBr(msg.body);
        if (!mm) return { reply: MSG.mesErro };
        const line = `recebimento;${st.mh_qtd};${st.mh_ano};${mm}`;
        estados.delete(from);
        return { reply: MSG.recOk(line, pageUrl) };
    }

    if (step === MH.W_ANO) {
        const y = sanitizeWhatsappUserText(msg.body);
        if (!/^\d{4}$/.test(y)) return { reply: MSG.anoErro };
        st.mh_ano = y;
        st.step = MH.W_MES;
        estados.set(from, st);
        return { reply: MSG.wMes };
    }

    if (step === MH.W_MES) {
        const mm = parseMelihelpMesBr(msg.body);
        if (!mm) return { reply: MSG.mesErro };
        st.mh_mes = mm;
        st.step = MH.W_NUM;
        estados.set(from, st);
        return { reply: MSG.wNum(st.mh_ano, mm, monthLabelPt(mm)) };
    }

    if (step === MH.W_NUM) {
        const wRaw = sanitizeWhatsappUserText(msg.body).replace(/;/g, ' ');
        if (!wRaw) return { reply: MSG.wErro };
        const y = st.mh_ano;
        const mm = st.mh_mes;
        const line = `cartaoavulso;${y};${mm};${wRaw}`;
        let saved = false;
        let failReason = '';
        try {
            const r = await melihelpAppendAtasAvulsoW({
                year: y,
                month: mm,
                wRaw,
                source: 'whatsapp_mh_flow',
                whatsappPhone: from
            });
            saved = Boolean(r && r.ok);
            if (!saved && r && r.reason) failReason = String(r.reason);
        } catch (e) {
            failReason = e && e.message ? String(e.message) : 'exception';
            console.error('[MeliHelp WA] W_NUM:', failReason);
        }
        estados.delete(from);
        const label = monthLabelPt(mm);
        if (saved) {
            return { reply: MSG.wOkSaved(line, pageUrl, y, mm, label, wRaw) };
        }
        if (failReason) console.error('[MeliHelp WA] append falhou:', failReason);
        return {
            reply:
                MSG.wOkFallback(line, pageUrl) + (failReason ? `\n\n⚠️ *${failReason}*` : '') + '\n\n' + MSG.banner
        };
    }

    if (step === MH.LINHA) {
        const line = sanitizeWhatsappUserText(msg.body);
        const low = line.toLowerCase();
        if (low === '0' || low === 'voltar') {
            st.step = MH.HUB;
            st.atividade = 'melihelp';
            estados.set(from, st);
            return { reply: MSG.hub };
        }
        const parts = line.split(/[;|]/).map((s) => s.trim()).filter(Boolean);
        const cmd = (parts[0] || '').toLowerCase().replace(/\s+/g, '');
        if (cmd === 'cartaoavulso' && parts.length >= 4) {
            const y = String(parts[1] || '').trim();
            const mi = parseInt(String(parts[2]).replace(/\D/g, ''), 10);
            const wPart = parts.slice(3).join(';').trim().replace(/;/g, ' ');
            const okFmt = Boolean(/^\d{4}$/.test(y) && !Number.isNaN(mi) && mi >= 1 && mi <= 12 && wPart);
            if (okFmt) {
                const mm = String(mi).padStart(2, '0');
                let r;
                try {
                    r = await melihelpAppendAtasAvulsoW({
                        year: y,
                        month: mm,
                        wRaw: wPart,
                        source: 'whatsapp_mh_linha',
                        whatsappPhone: from
                    });
                } catch (e) {
                    console.error('[MeliHelp WA] mh_linha:', e && e.message);
                    r = { ok: false, reason: 'exception' };
                }
                estados.delete(from);
                const label = monthLabelPt(mm);
                const fullLine = `cartaoavulso;${y};${mm};${wPart}`;
                if (r && r.ok) {
                    return { reply: MSG.wOkSaved(fullLine, pageUrl, y, mm, label, wPart) };
                }
                const why = r && r.reason ? String(r.reason) : '?';
                return { reply: MSG.wOkFallback(fullLine, pageUrl) + `\n\n*${why}*` };
            }
        }
        let ok = false;
        if (cmd === 'retirada' && parts.length >= 3) ok = true;
        if ((cmd === 'recebimento' || cmd === 'rec') && parts.length >= 4) ok = true;
        estados.delete(from);
        if (ok) return { reply: MSG.linhaOk(line, pageUrl) };
        return { reply: MSG.linhaErro };
    }

    return null;
}

module.exports = {
    MH,
    melihelpPageUrl,
    migrateLegacyMelihelpStep,
    isMelihelpFlow,
    tryDirectCartaoAvulsoLine,
    processMelihelpTurn,
    MSG
};
