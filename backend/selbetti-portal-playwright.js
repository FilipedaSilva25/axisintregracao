/**
 * Automação Portal do Cliente Selbetti — abertura de chamado.
 * Requer: npm install playwright && npx playwright install chromium
 *
 * Diagnóstico: config/data/selbetti-playwright.log e selbetti-playwright-failure.png
 *
 * Dicas: SELBETTI_PLAYWRIGHT_HEADED=1 (ver o browser), SELBETTI_PLAYWRIGHT_DEBUG=1 (consola),
 *        SELBETTI_PLAYWRIGHT_CHANNEL=chrome (usar Chrome instalado — menos bloqueios que Chromium puro).
 * Login: modal Satelitti "TESTAR DEPOIS" é fechado por dismissPortalPreambles antes do ENTAR.
 */

const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('./config');
const { normalizeSelbettiCodigoTypo } = require('./selbetti-codigo-normalize');

const LOGIN_URL =
    process.env.SELBETTI_PORTAL_LOGIN_URL || 'https://www.selbetti.com.br/canal_cliente_novo/login';
const OPENING_URL =
    process.env.SELBETTI_OPENING_TICKET_URL ||
    'https://www.selbetti.com.br/canal_cliente_novo/opening-ticket';

/** URLs de login a tentar (www e sem www — o DOM por vezes difere). */
function loginUrlsToTry() {
    const custom = (process.env.SELBETTI_PORTAL_LOGIN_FALLBACK_URL || '').trim();
    const list = [LOGIN_URL];
    const noWww = LOGIN_URL.replace(/:\/\/www\./i, '://');
    if (noWww !== LOGIN_URL) list.push(noWww);
    if (custom && !list.includes(custom)) list.push(custom);
    return list;
}

const LOG_FILE = path.join(DATA_DIR, 'selbetti-playwright.log');
const FAIL_IMG = path.join(DATA_DIR, 'selbetti-playwright-failure.png');
const SUCCESS_IMG = path.join(DATA_DIR, 'selbetti-playwright-success.png');

const TIPO_TEXT = {
    consumo: 'Material de consumo',
    equipamento: 'Assistência de equipamento',
    software: 'Assistência de software'
};

function logLine(msg) {
    const line = new Date().toISOString() + ' [SelbettiPW] ' + msg + '\n';
    try {
        if (!fs.existsSync(path.dirname(LOG_FILE))) {
            fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
        }
        fs.appendFileSync(LOG_FILE, line, 'utf8');
    } catch (_) {}
    if (process.env.SELBETTI_PLAYWRIGHT_DEBUG === '1') {
        console.log('[SelbettiPW]', msg);
    }
}

async function snapFailure(page, label) {
    try {
        if (page && !page.isClosed()) {
            await page.screenshot({ path: FAIL_IMG, fullPage: true }).catch(() => {});
            logLine('screenshot: ' + FAIL_IMG + ' (' + label + ')');
        }
    } catch (_) {}
}

async function snapSuccess(page, ticket) {
    try {
        if (page && !page.isClosed()) {
            await page.screenshot({ path: SUCCESS_IMG, fullPage: true }).catch(() => {});
            logLine('screenshot sucesso: ' + SUCCESS_IMG + ' OS=' + ticket);
        }
    } catch (_) {}
}

async function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

/** Número de OS Selbetti (tipicamente 7–9 dígitos, ex. 14019680). */
function isLikelyOsDigits(s) {
    if (!s || !/^\d+$/.test(s)) return false;
    const n = s.length;
    if (n < 7 || n > 10) return false;
    const v = parseInt(s, 10);
    return v >= 1_000_000 && v < 10_000_000_000;
}

function extractTicketNumber(htmlOrText) {
    if (!htmlOrText || typeof htmlOrText !== 'string') return null;
    const patterns = [
        /\bOS\s*[#:Nº.]*\s*(\d{7,10})\b/gi,
        /ordem\s+de\s+servi[cç]o[^0-9]{0,40}(\d{7,10})/gi,
        /chamado[^0-9]{0,60}(\d{7,10})/gi,
        /n[uú]mero[^0-9]{0,40}(\d{7,10})/gi,
        /foi\s+abert[oa][^0-9]{0,50}(\d{7,10})/gi,
        /registrad[oa][^0-9]{0,50}(\d{7,10})/gi,
        /protocolo[^0-9]{0,30}(\d{7,10})/gi
    ];
    for (const re of patterns) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(htmlOrText)) !== null) {
            const cand = m[1] || m[0];
            const digits = String(cand).replace(/\D/g, '');
            if (isLikelyOsDigits(digits)) return digits;
        }
    }
    return null;
}

function deepFindOsInJson(obj, depth) {
    if (depth > 14 || obj == null) return null;
    if (typeof obj === 'number' && Number.isFinite(obj)) {
        const s = String(Math.floor(obj));
        if (isLikelyOsDigits(s)) return s;
        return null;
    }
    if (typeof obj === 'string') {
        const t = extractTicketNumber(obj);
        if (t) return t;
        const digits = obj.replace(/\D/g, '');
        if (isLikelyOsDigits(digits)) return digits;
        return null;
    }
    if (Array.isArray(obj)) {
        for (const x of obj) {
            const r = deepFindOsInJson(x, depth + 1);
            if (r) return r;
        }
        return null;
    }
    if (typeof obj === 'object') {
        for (const k of Object.keys(obj)) {
            const kl = String(k).toLowerCase();
            if (
                /os|chamado|ticket|numero|número|ordem|servico|servi[cç]o|nro|nr_?os|codigo|c[oó]digo/.test(
                    kl
                ) &&
                !/endereco|telefone|cep|cpf|cnpj/.test(kl)
            ) {
                const v = obj[k];
                if (v != null) {
                    if (typeof v === 'number' && Number.isFinite(v)) {
                        const s = String(Math.floor(v));
                        if (isLikelyOsDigits(s)) return s;
                    }
                    const r = deepFindOsInJson(v, depth + 1);
                    if (r) return r;
                }
            }
        }
        for (const k of Object.keys(obj)) {
            const r = deepFindOsInJson(obj[k], depth + 1);
            if (r) return r;
        }
    }
    return null;
}

/**
 * Escuta respostas XHR/fetch da Selbetti e tenta extrair número de OS do JSON/texto.
 */
function attachTicketSniffer(page, state) {
    page.on('response', async (response) => {
        try {
            const u = response.url();
            if (!/selbetti\.com\.br/i.test(u)) return;
            const st = response.status();
            if (st < 200 || st >= 400) return;
            const ct = (response.headers()['content-type'] || '').toLowerCase();
            if (!ct.includes('json') && !ct.includes('text/plain')) return;
            const text = await response.text().catch(() => '');
            if (!text || text.length > 800_000) return;
            const fromRegex = extractTicketNumber(text);
            if (fromRegex) {
                state.ticket = fromRegex;
                logLine('sniffer: OS=' + fromRegex + ' url=' + u.substring(0, 140));
                return;
            }
            try {
                const j = JSON.parse(text);
                const d = deepFindOsInJson(j, 0);
                if (d) {
                    state.ticket = d;
                    logLine('sniffer JSON: OS=' + d + ' url=' + u.substring(0, 140));
                }
            } catch (_) {}
        } catch (_) {}
    });
}

async function dismissOverlays(page) {
    const patterns = [
        /aceitar(\s+todos)?/i,
        /concordo/i,
        /entendi/i,
        /^ok$/i,
        /fechar/i,
        /continuar/i
    ];
    for (const re of patterns) {
        try {
            const b = page.getByRole('button', { name: re }).first();
            if (await b.isVisible({ timeout: 1200 }).catch(() => false)) {
                await b.click({ timeout: 5000 }).catch(() => {});
                logLine('overlay: clicado ' + re.source);
                await sleep(600);
            }
        } catch (_) {}
    }
}

/**
 * Modais de marketing no login (ex.: Satelitti S-SIGN — "TESTAR DEPOIS" antes do ENTAR).
 * Não clica em "TESTAR AGORA" (abre fluxo de trial).
 */
async function dismissPortalPreambles(page) {
    const tryCtx = async (ctx, label) => {
        let any = false;
        try {
            const tb = ctx.locator('button,a[role="button"]').filter({ hasText: /testar depois/i }).first();
            if ((await tb.count()) > 0 && (await tb.isVisible({ timeout: 800 }).catch(() => false))) {
                await tb.click({ timeout: 8000, force: true });
                logLine('preamble (' + label + '): button filter testar depois');
                any = true;
                await sleep(900);
            }
        } catch (_) {}
        const names = [
            /testar depois/i,
            /^depois$/i,
            /agora n[aã]o/i,
            /n[aã]o,? obrigad[oa]/i,
            /fechar/i,
            /pular/i,
            /ignorar/i,
            /continuar sem/i,
            /dispensar/i
        ];
        for (const re of names) {
            try {
                const b = ctx.getByRole('button', { name: re }).first();
                if ((await b.count()) > 0 && (await b.isVisible({ timeout: 900 }).catch(() => false))) {
                    await b.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
                    await b.click({ timeout: 8000, force: true });
                    logLine('preamble (' + label + '): ' + re.source);
                    any = true;
                    await sleep(900);
                }
            } catch (_) {}
        }
        return any;
    };

    for (let round = 0; round < 5; round++) {
        let hit = false;
        hit = (await tryCtx(page, 'main')) || hit;
        for (const fr of page.frames()) {
            if (fr === page.mainFrame()) continue;
            try {
                if (await tryCtx(fr, 'frame')) hit = true;
            } catch (_) {}
        }
        if (!hit) break;
        await sleep(500);
    }
}

/** Preenche login com várias estratégias (placeholder, label, tipo de input). */
async function fillLogin(page, user, pass) {
    logLine('fillLogin: start');
    let userFilled = false;
    let passFilled = false;

    const tryUser = async (loc) => {
        const el = loc.first();
        if ((await el.count()) > 0 && (await el.isVisible().catch(() => false))) {
            await el.click({ timeout: 3000 }).catch(() => {});
            await el.fill('', { timeout: 2000 }).catch(() => {});
            await el.fill(user, { timeout: 5000 });
            return true;
        }
        return false;
    };
    const tryPass = async (loc) => {
        const el = loc.first();
        if ((await el.count()) > 0 && (await el.isVisible().catch(() => false))) {
            await el.click({ timeout: 3000 }).catch(() => {});
            await el.fill(pass, { timeout: 5000 });
            return true;
        }
        return false;
    };

    const userStrategies = [
        () => page.getByPlaceholder(/usu[aá]rio/i),
        () => page.getByLabel(/usu[aá]rio/i),
        () => page.locator('input[name="username"]'),
        () => page.locator('input[name="user"]'),
        () => page.locator('input[name="email"]'),
        () => page.locator('input[type="text"]').first(),
        () => page.locator('input:not([type]):not([type="hidden"])').first()
    ];
    for (const fn of userStrategies) {
        try {
            if (await tryUser(fn())) {
                userFilled = true;
                break;
            }
        } catch (_) {}
    }

    const passStrategies = [
        () => page.getByPlaceholder(/senha/i),
        () => page.getByLabel(/senha/i),
        () => page.locator('input[type="password"]').first(),
        () => page.locator('input[name="password"]')
    ];
    for (const fn of passStrategies) {
        try {
            if (await tryPass(fn())) {
                passFilled = true;
                break;
            }
        } catch (_) {}
    }

    if (!userFilled || !passFilled) {
        throw new Error(
            'Campos de login não encontrados (usuário:' + userFilled + ' senha:' + passFilled + ')'
        );
    }

    await dismissPortalPreambles(page);
    await dismissOverlays(page);
    await sleep(400);
    const submitted = await submitLoginAfterFill(page);
    if (!submitted) {
        throw new Error('Botão Entrar não encontrado');
    }
}

/**
 * Após preencher utilizador/senha: Enter no password, depois vários alvos (MUI, input submit, iframes).
 */
async function submitLoginAfterFill(page) {
    const leftLogin = async () => {
        const u = page.url();
        return u.indexOf('/login') === -1;
    };

    try {
        const pwIn = page.locator('input[type="password"]').first();
        if ((await pwIn.count()) > 0 && (await pwIn.isVisible({ timeout: 3000 }).catch(() => false))) {
            await pwIn.focus().catch(() => {});
            await pwIn.press('Enter').catch(() => {});
            logLine('fillLogin: Enter no campo senha');
            await sleep(2800);
            if (await leftLogin()) {
                logLine('fillLogin: saiu de /login após Enter');
                return true;
            }
        }
    } catch (_) {}

    const tryClickInContext = async (ctx, label) => {
        const strategies = [
            () => ctx.getByRole('button', { name: /entrar/i }),
            () => ctx.getByRole('button', { name: /acessar/i }),
            () => ctx.getByRole('button', { name: /fazer\s+login/i }),
            () => ctx.getByRole('button', { name: /^login$/i }),
            () => ctx.locator('input[type="submit"]'),
            () => ctx.locator('button[type="submit"]'),
            () => ctx.locator('button').filter({ hasText: /entrar|acessar|enviar|login|sign\s*in/i }).first(),
            () => ctx.locator('a').filter({ hasText: /entrar|acessar|login/i }).first(),
            () => ctx.locator('[role="button"]').filter({ hasText: /entrar|acessar/i }).first(),
            () => ctx.locator('form').locator('button, input[type="submit"]').last()
        ];
        for (let si = 0; si < strategies.length; si++) {
            try {
                const loc = strategies[si]();
                const n = await loc.count();
                if (n === 0) continue;
                let target = loc.first();
                for (let i = 0; i < n; i++) {
                    const cand = loc.nth(i);
                    if (await cand.isVisible({ timeout: 2000 }).catch(() => false)) {
                        const dis = await cand.isDisabled().catch(() => false);
                        if (!dis) {
                            target = cand;
                            break;
                        }
                    }
                }
                await target.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
                await target.click({ timeout: 12000, force: true });
                logLine('fillLogin: clique login (' + label + ') estratégia #' + si);
                await sleep(2500);
                if (await leftLogin()) return true;
            } catch (e) {
                logLine('fillLogin: tentativa ' + label + ' #' + si + ' ' + (e.message || e));
            }
        }
        return false;
    };

    if (await tryClickInContext(page, 'main')) return true;

    for (const fr of page.frames()) {
        if (fr === page.mainFrame()) continue;
        try {
            if (await tryClickInContext(fr, 'iframe')) return true;
        } catch (_) {}
    }

    return false;
}

async function waitAfterLogin(page) {
    const deadline = Date.now() + 90000;
    while (Date.now() < deadline) {
        const u = page.url();
        if (u.indexOf('/login') === -1) {
            logLine('waitAfterLogin: saiu de /login url=' + u);
            return;
        }
        await sleep(500);
    }
    throw new Error('Timeout após login — ainda em /login (credenciais ou captcha?)');
}

/** Clica em elemento que contenha o texto (cartão MUI, div, botão). */
async function clickByVisibleText(page, textRegex, desc) {
    const candidates = [
        page.getByRole('button', { name: textRegex }),
        page.getByText(textRegex, { exact: false }).first(),
        page.locator('div,button,a,span').filter({ hasText: textRegex }).first()
    ];
    for (const loc of candidates) {
        try {
            if ((await loc.count()) > 0) {
                await loc.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
                await loc.click({ timeout: 15000, force: true });
                logLine('click: ' + desc);
                return;
            }
        } catch (e) {
            logLine('click retry ' + desc + ': ' + (e.message || e));
        }
    }
    throw new Error('Não encontrado para clicar: ' + desc);
}

async function clickProximo(page, n) {
    const strategies = [
        () => page.getByRole('button', { name: /pr[oó]ximo/i }),
        () => page.getByRole('button', { name: /continuar/i }),
        () => page.locator('button').filter({ hasText: /pr[oó]ximo/i }),
        () => page.locator('button').filter({ hasText: /continuar/i })
    ];
    for (const fn of strategies) {
        try {
            const loc = fn();
            const count = await loc.count();
            let btn = loc.last();
            for (let i = count - 1; i >= 0; i--) {
                const cand = loc.nth(i);
                if (await cand.isVisible().catch(() => false)) {
                    btn = cand;
                    break;
                }
            }
            await btn.waitFor({ state: 'visible', timeout: 25000 });
            let disabled = await btn.isDisabled().catch(() => false);
            let guard = 0;
            while (disabled && guard < 56) {
                logLine('clickProximo #' + n + ': aguardar botão ativar');
                await sleep(800);
                disabled = await btn.isDisabled().catch(() => false);
                guard++;
            }
            await btn.scrollIntoViewIfNeeded().catch(() => {});
            await btn.click({ timeout: 15000 });
            logLine('clickProximo #' + n);
            await sleep(1400);
            return;
        } catch (e) {
            logLine('clickProximo fail #' + n + ': ' + (e.message || e));
        }
    }
    throw new Error('Botão PRÓXIMO/CONTINUAR não disponível (passo ' + n + ')');
}

/** Igual a clickProximo mas não falha — útil quando o fluxo tem número variável de passos. */
async function clickProximoOptional(page, n) {
    try {
        await clickProximo(page, n);
        return true;
    } catch (e) {
        logLine('clickProximo opcional #' + n + ' ignorado: ' + (e.message || e));
        return false;
    }
}

/** Dispara input/change/blur nos campos visíveis para o Angular validar e ativar PRÓXIMO. */
async function refreshEquipmentValidation(page) {
    try {
        const textInputs = page.locator(
            'input:visible:not([type="password"]):not([type="hidden"]):not([type="checkbox"])'
        );
        const n = Math.min(await textInputs.count(), 12);
        for (let i = 0; i < n; i++) {
            const inp = textInputs.nth(i);
            if (!(await inp.isVisible().catch(() => false))) continue;
            const v = (await inp.inputValue().catch(() => '')) || '';
            if (!v.trim()) continue;
            await inp.dispatchEvent('input').catch(() => {});
            await inp.dispatchEvent('change').catch(() => {});
            await inp.dispatchEvent('blur').catch(() => {});
        }
    } catch (_) {}
    await sleep(400);
}

/** Espera até existir um botão Próximo/Continuar visível e habilitado (validação do passo equipamento). */
async function waitForProximoEnabled(page, timeoutMs) {
    const deadline = Date.now() + (timeoutMs || 90000);
    while (Date.now() < deadline) {
        for (const re of [/pr[oó]ximo/i, /continuar/i]) {
            const loc = page.getByRole('button', { name: re });
            const c = await loc.count();
            for (let i = 0; i < c; i++) {
                const b = loc.nth(i);
                if (!(await b.isVisible().catch(() => false))) continue;
                const dis = await b.isDisabled().catch(() => true);
                if (!dis) {
                    logLine('próximo/continuar ativo');
                    return true;
                }
            }
        }
        await sleep(600);
    }
    logLine('timeout aguardando próximo ativo');
    return false;
}

async function setPriority(page, prioridade) {
    const p = String(prioridade || 'NORMAL').toUpperCase();
    const label = p === 'ALTA' ? 'ALTA' : p === 'CRITICA' || p === 'CRÍTICA' ? 'CRITICA' : 'NORMAL';
    try {
        const combo = page.locator('[role="combobox"]').first();
        if ((await combo.count()) > 0 && (await combo.isVisible({ timeout: 4000 }).catch(() => false))) {
            await combo.click();
            await sleep(400);
            await page
                .getByRole('option', { name: new RegExp('^' + label + '$', 'i') })
                .click({ timeout: 8000 });
            logLine('priority select: ' + label);
            return;
        }
    } catch (_) {}
    try {
        const btn = page.getByRole('button', { name: new RegExp(label, 'i') }).first();
        if ((await btn.count()) > 0) {
            await btn.click();
            logLine('priority button: ' + label);
        }
    } catch (_) {}
}

async function fillVisibleInputsEquipment(page, selb, serie) {
    const rawS = String(selb || '').trim();
    const rawSer = String(serie || '').trim();
    const s = normalizeSelbettiCodigoTypo(rawS);
    const ser = normalizeSelbettiCodigoTypo(rawSer);
    if (s !== rawS) logLine('SELB normalizado (O↔0): ' + rawS + ' → ' + s);
    if (ser !== rawSer) logLine('série normalizada (O↔0): ' + rawSer + ' → ' + ser);
    const textInputs = page.locator('input:visible:not([type="password"]):not([type="hidden"]):not([type="checkbox"])');
    const n = await textInputs.count();
    logLine('equipment inputs visíveis: ' + n);

    let idx = 0;
    if (s && s !== '0' && s !== '-') {
        for (let i = 0; i < Math.min(n, 12); i++) {
            const inp = textInputs.nth(i);
            const ph = ((await inp.getAttribute('placeholder')) || '').toLowerCase();
            const aria = ((await inp.getAttribute('aria-label')) || '').toLowerCase();
            const hay = ph + aria;
            if (hay.indexOf('selb') >= 0 || hay.indexOf('identific') >= 0 || (!hay && i === 0)) {
                await inp.fill(s);
                logLine('fill SELB em input #' + i);
                idx = i + 1;
                break;
            }
        }
        if (idx === 0 && n > 0) {
            await textInputs.nth(0).fill(s);
            logLine('fill SELB input #0 fallback');
            idx = 1;
        }
    }
    if (ser && ser !== '0' && ser !== '-') {
        let done = false;
        for (let i = 0; i < Math.min(n, 12); i++) {
            const inp = textInputs.nth(i);
            const ph = ((await inp.getAttribute('placeholder')) || '').toLowerCase();
            if (ph.indexOf('serie') >= 0 || ph.indexOf('série') >= 0 || ph.indexOf('serial') >= 0) {
                await inp.fill(ser);
                done = true;
                logLine('fill série por placeholder');
                break;
            }
        }
        if (!done && n > 1) {
            await textInputs.nth(1).fill(ser);
            logLine('fill série input #1 fallback');
        }
    }
}

async function fillCountersIfPresent(page) {
    try {
        const nums = page.locator('input[type="number"]');
        const c = await nums.count();
        for (let i = 0; i < c; i++) {
            const el = nums.nth(i);
            if (!(await el.isVisible().catch(() => false))) continue;
            const v = (await el.inputValue().catch(() => '')) || '';
            if (v.trim() === '') await el.fill('0').catch(() => {});
        }
        const texts = page.locator('input:visible:not([type="password"]):not([type="hidden"])');
        const n = await texts.count();
        for (let i = 0; i < Math.min(n, 6); i++) {
            const el = texts.nth(i);
            const ph = ((await el.getAttribute('placeholder')) || '').toLowerCase();
            if (ph.indexOf('contador') >= 0 || ph.indexOf('contagem') >= 0) {
                await el.fill('0').catch(() => {});
            }
        }
        logLine('counters step tratado');
    } catch (_) {}
}

async function ticketFromVisibleUi(page) {
    try {
        const inner = await page.evaluate(() => (document.body && document.body.innerText) || '');
        const t = extractTicketNumber(inner);
        if (t) return t;
    } catch (_) {}
    try {
        const html = await page.content();
        return extractTicketNumber(html);
    } catch (_) {
        return null;
    }
}

async function pollForTicket(state, page, maxMs) {
    const t0 = Date.now();
    while (Date.now() - t0 < maxMs) {
        if (state.ticket) return state.ticket;
        const u = await ticketFromVisibleUi(page);
        if (u) return u;
        await sleep(1000);
    }
    return state.ticket || (await ticketFromVisibleUi(page));
}

async function clickFinalActions(page) {
    /* Evitar "Confirmar" genérico no meio do wizard — só ações claras de envio. */
    const primary = [
        /enviar(\s+chamado)?/i,
        /finalizar/i,
        /concluir/i,
        /registrar(\s+chamado)?/i,
        /abrir\s+chamado/i,
        /salvar(\s+chamado)?/i,
        /confirmar\s+pedido/i,
        /confirmar\s+envio/i
    ];
    const dismiss = [/entendi/i, /^ok$/i, /fechar/i];
    for (let round = 0; round < 3; round++) {
        let any = false;
        for (const re of primary) {
            try {
                const btn = page.getByRole('button', { name: re }).first();
                if ((await btn.count()) > 0 && (await btn.isVisible({ timeout: 2000 }).catch(() => false))) {
                    await btn.click({ timeout: 10000 });
                    logLine('clicado botão envio: ' + re.source);
                    any = true;
                    await sleep(2200);
                }
            } catch (_) {}
        }
        if (!any) break;
    }
    for (let round = 0; round < 3; round++) {
        let any = false;
        for (const re of dismiss) {
            try {
                const btn = page.getByRole('button', { name: re }).first();
                if ((await btn.count()) > 0 && (await btn.isVisible({ timeout: 1500 }).catch(() => false))) {
                    await btn.click({ timeout: 8000 });
                    logLine('clicado botão fechar modal: ' + re.source);
                    any = true;
                    await sleep(1500);
                }
            } catch (_) {}
        }
        if (!any) break;
    }
}

async function openTicketViaPortal(payload) {
    let chromium;
    try {
        ({ chromium } = require('playwright'));
    } catch (e) {
        return {
            ok: false,
            error:
                'Playwright não instalado. No servidor: npm install playwright && npx playwright install chromium'
        };
    }

    const user = (process.env.SELBETTI_PORTAL_USER || '').trim();
    const pass = (process.env.SELBETTI_PORTAL_PASSWORD || process.env.SELBETTI_PORTAL_PASS || '').trim();
    if (!user || !pass) {
        return { ok: false, error: 'Defina SELBETTI_PORTAL_USER e SELBETTI_PORTAL_PASSWORD no .env' };
    }

    const headless = process.env.SELBETTI_PLAYWRIGHT_HEADED !== '1';
    const channel =
        (process.env.SELBETTI_PLAYWRIGHT_CHANNEL || '').toLowerCase() === 'chrome' ? 'chrome' : undefined;
    logLine('=== início headless=' + headless + ' channel=' + (channel || 'chromium bundled') + ' ===');

    const launchOpts = {
        headless,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--window-size=1280,900'
        ]
    };
    if (channel) launchOpts.channel = 'chrome';

    const browser = await chromium.launch(launchOpts);

    const context = await browser.newContext({
        locale: 'pt-BR',
        viewport: { width: 1280, height: 900 },
        userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        ignoreHTTPSErrors: true
    });

    const page = await context.newPage();
    const sniffState = { ticket: null };
    attachTicketSniffer(page, sniffState);

    try {
        const loginCandidates = loginUrlsToTry();
        let loginErr = null;
        for (let li = 0; li < loginCandidates.length; li++) {
            const loginU = loginCandidates[li];
            try {
                logLine('login: goto ' + loginU);
                await page.goto(loginU, { waitUntil: 'domcontentloaded', timeout: 120000 });
                await page.waitForLoadState('load', { timeout: 45000 }).catch(() => {});
                await sleep(2000);
                await page
                    .waitForSelector('input[type="password"], input[type="text"], input:not([type="hidden"])', {
                        timeout: 35000
                    })
                    .catch(() => {});
                await sleep(800);
                await dismissPortalPreambles(page);
                await dismissOverlays(page);
                await dismissPortalPreambles(page);
                logLine('url login: ' + page.url());
                await fillLogin(page, user, pass);
                loginErr = null;
                break;
            } catch (e) {
                loginErr = e;
                logLine('login: falha tentativa ' + (li + 1) + '/' + loginCandidates.length + ': ' + (e.message || e));
            }
        }
        if (loginErr) {
            throw loginErr;
        }
        await sleep(1500);
        await waitAfterLogin(page);
        await sleep(2000);
        await dismissOverlays(page);

        await page.goto(OPENING_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await sleep(2500);
        await dismissPortalPreambles(page);
        await dismissOverlays(page);
        logLine('url opening: ' + page.url());

        if (page.url().indexOf('login') >= 0) {
            throw new Error('Redirecionado ao login ao abrir opening-ticket — sessão inválida');
        }

        const tipoKey = payload.tipo || 'equipamento';
        const tipoLabel = TIPO_TEXT[tipoKey] || TIPO_TEXT.equipamento;
        await clickByVisibleText(
            page,
            new RegExp(tipoLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
            'tipo ' + tipoKey
        );
        await sleep(800);

        try {
            await page.getByRole('button', { name: /iniciar.*chamado/i }).first().click({ timeout: 12000 });
        } catch (_) {
            await clickByVisibleText(page, /iniciar.*abertura/i, 'iniciar abertura');
        }
        await sleep(2500);
        await dismissOverlays(page);

        await fillVisibleInputsEquipment(page, payload.selb, payload.serie);
        await setPriority(page, payload.prioridade);
        await sleep(500);
        await refreshEquipmentValidation(page);
        await waitForProximoEnabled(page, 90000);

        await clickProximo(page, 1);

        const nome = String(payload.nome || '').substring(0, 120);
        const email = String(payload.email || '').substring(0, 120);
        const tel = String(payload.telefone || '').substring(0, 30);

        const fillIf = async (re, value) => {
            if (!value) return;
            const byPh = page.getByPlaceholder(re).first();
            if ((await byPh.count()) > 0 && (await byPh.isVisible({ timeout: 2000 }).catch(() => false))) {
                await byPh.fill(value);
                return;
            }
            const byL = page.getByLabel(re).first();
            if ((await byL.count()) > 0 && (await byL.isVisible({ timeout: 2000 }).catch(() => false))) {
                await byL.fill(value);
            }
        };

        await fillIf(/nome/i, nome);
        await fillIf(/telefone/i, tel);
        await fillIf(/e-mail|email/i, email);

        await sleep(400);
        await clickProximo(page, 2);

        await fillCountersIfPresent(page);
        await sleep(500);
        await clickProximo(page, 3);

        const ta = page.locator('textarea:visible').first();
        if ((await ta.count()) > 0 && (await ta.isVisible({ timeout: 8000 }).catch(() => false))) {
            await ta.fill(String(payload.problema || '').substring(0, 4000));
            logLine('problema preenchido');
        }
        await sleep(400);
        await clickProximo(page, 4);

        /* Alguns fluxos não têm 5.º "Próximo"; não falhar por isso. */
        await sleep(1200);
        await clickProximoOptional(page, 5);
        await clickProximoOptional(page, 6);

        await sleep(1500);
        await clickFinalActions(page);

        await sleep(3000);
        let ticket = await pollForTicket(sniffState, page, 20000);

        if (!ticket) {
            const dialogText = await page
                .locator('[role="dialog"], .MuiDialog-root, [class*="modal" i]')
                .first()
                .textContent()
                .catch(() => '');
            if (dialogText) {
                ticket = extractTicketNumber(dialogText);
                if (ticket) logLine('OS no modal: ' + ticket);
            }
        }

        if (ticket) {
            logLine('OS detetada: ' + ticket);
            await snapSuccess(page, ticket);
            await browser.close();
            return { ok: true, ticketNumber: ticket };
        }

        logLine('OS não detetada — fluxo pode ter concluído; ver portal e sniffer no log');
        await snapFailure(page, 'sem_os_no_fim');
        await browser.close();
        return {
            ok: true,
            partial: true,
            message:
                'Automação executou os passos mas o número da OS não foi lido (portal pode ter mudado o texto ou a API não expôs o número). ' +
                'Confira em "Meus chamados" no portal cliente. WAP do técnico pode listar a OS com atraso ou por regras da Selbetti. ' +
                'Ative SELBETTI_PLAYWRIGHT_HEADED=1 e SELBETTI_PLAYWRIGHT_DEBUG=1 para ver o fluxo. Log: ' +
                path.basename(LOG_FILE)
        };
    } catch (e) {
        const err = String(e.message || e);
        logLine('ERRO: ' + err);
        await snapFailure(page, err);
        await browser.close().catch(() => {});
        return { ok: false, error: err };
    }
}

/**
 * Só testa login no portal (útil para API / diagnóstico). Não abre chamado.
 * @returns {Promise<{ ok: boolean, finalUrl?: string, error?: string, triedUrls?: string[] }>}
 */
async function testSelbettiPortalLoginOnly() {
    let chromium;
    try {
        ({ chromium } = require('playwright'));
    } catch (e) {
        return { ok: false, error: 'Playwright não instalado' };
    }
    const user = (process.env.SELBETTI_PORTAL_USER || '').trim();
    const pass = (process.env.SELBETTI_PORTAL_PASSWORD || process.env.SELBETTI_PORTAL_PASS || '').trim();
    if (!user || !pass) {
        return { ok: false, error: 'SELBETTI_PORTAL_USER ou senha em falta no processo' };
    }
    const headless = process.env.SELBETTI_PLAYWRIGHT_HEADED !== '1';
    const channel =
        (process.env.SELBETTI_PLAYWRIGHT_CHANNEL || '').toLowerCase() === 'chrome' ? 'chrome' : undefined;
    const launchOpts = {
        headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,900']
    };
    if (channel) launchOpts.channel = 'chrome';
    const browser = await chromium.launch(launchOpts);
    const context = await browser.newContext({
        locale: 'pt-BR',
        viewport: { width: 1280, height: 900 },
        ignoreHTTPSErrors: true
    });
    const page = await context.newPage();
    const triedUrls = loginUrlsToTry();
    logLine('=== test-login-only triedUrls=' + triedUrls.join(' | ') + ' ===');
    try {
        let lastErr = null;
        for (const loginU of triedUrls) {
            try {
                await page.goto(loginU, { waitUntil: 'domcontentloaded', timeout: 120000 });
                await page.waitForLoadState('load', { timeout: 45000 }).catch(() => {});
                await sleep(2000);
                await dismissPortalPreambles(page);
                await dismissOverlays(page);
                await dismissPortalPreambles(page);
                await fillLogin(page, user, pass);
                await sleep(2000);
                await waitAfterLogin(page);
                const finalUrl = page.url();
                await browser.close();
                return { ok: true, finalUrl, triedUrls };
            } catch (e) {
                lastErr = e;
                logLine('test-login: falha em ' + loginU + ': ' + (e.message || e));
            }
        }
        await snapFailure(page, String(lastErr && lastErr.message));
        await browser.close().catch(() => {});
        return { ok: false, error: String((lastErr && lastErr.message) || lastErr), triedUrls };
    } catch (e) {
        await browser.close().catch(() => {});
        return { ok: false, error: String(e.message || e), triedUrls };
    }
}

module.exports = { openTicketViaPortal, testSelbettiPortalLoginOnly, LOG_FILE, FAIL_IMG };
