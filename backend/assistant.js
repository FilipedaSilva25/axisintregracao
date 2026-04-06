/**
 * Assistente IA - Integração com OpenAI (modelo mais capaz)
 * Sem chave API: usa modo local (respostas do conhecimento AXIS). Com OPENAI_API_KEY: usa GPT.
 * Retry automático em 429 (rate limit). Reconhece o usuário pelo nome.
 */

const getSystemPrompt = require('./assistant-knowledge');

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-3-5-sonnet-20241022';
const GEMINI_MODEL = 'gemini-1.5-flash';
const MAX_RETRIES_429 = 2;
const RETRY_DELAYS_MS = [2000, 5000];

function isPlaceholderKey(k) {
    const s = (k || '').trim();
    return !s || s.length < 20 || s === 'sua-chave' || /^sk-\.\.\.|sua_api_key|exemplo|example/i.test(s);
}

function buildMessagesForOpenAI(systemPrompt, history, userMessage) {
    return [
        { role: 'system', content: systemPrompt },
        ...history.slice(-12).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage }
    ];
}

async function chatOpenAI(apiKey, systemPrompt, history, userMessage) {
    const messages = buildMessagesForOpenAI(systemPrompt, history, userMessage);
    for (let attempt = 0; attempt <= MAX_RETRIES_429; attempt++) {
        try {
            const res = await fetch(OPENAI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: MODEL,
                    messages,
                    max_tokens: 600,
                    temperature: 0.7
                })
            });
            if (res.status === 429 && attempt < MAX_RETRIES_429) {
                const delay = RETRY_DELAYS_MS[attempt] || 5000;
                await new Promise(r => setTimeout(r, delay));
                continue;
            }
            if (!res.ok) {
                const t = await res.text();
                if (res.status === 401) return { reply: null, skip: true };
                return { reply: 'Não foi possível obter resposta da IA (OpenAI). Tente novamente.', error: 'api_error' };
            }
            const data = await res.json();
            const choice = data.choices && data.choices[0];
            const reply = choice && choice.message && choice.message.content
                ? choice.message.content.trim()
                : 'Resposta não disponível.';
            return { reply };
        } catch (e) {
            console.error('Assistente AXIS OpenAI:', e.message);
            return { reply: null, skip: true };
        }
    }
    return { reply: 'Muitas requisições no momento. Aguarde e tente de novo.', error: 'api_error' };
}

async function chatAnthropic(apiKey, systemPrompt, history, userMessage) {
    const msgs = [];
    for (const h of history.slice(-12)) {
        if (h.role === 'user' || h.role === 'assistant') {
            msgs.push({ role: h.role, content: h.content });
        }
    }
    msgs.push({ role: 'user', content: userMessage });
    try {
        const res = await fetch(ANTHROPIC_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: ANTHROPIC_MODEL,
                max_tokens: 600,
                system: systemPrompt,
                messages: msgs
            })
        });
        if (!res.ok) {
            if (res.status === 401) return { reply: null, skip: true };
            return { reply: 'Não foi possível obter resposta da IA (Anthropic). Tente novamente.', error: 'api_error' };
        }
        const data = await res.json();
        const block = data.content && data.content[0];
        const text = block && block.text ? String(block.text).trim() : 'Resposta não disponível.';
        return { reply: text };
    } catch (e) {
        console.error('Assistente AXIS Anthropic:', e.message);
        return { reply: null, skip: true };
    }
}

async function chatGemini(apiKey, systemPrompt, history, userMessage) {
    var blob = systemPrompt + '\n\n--- Histórico recente ---\n';
    for (const h of history.slice(-12)) {
        if (h.role === 'user' || h.role === 'assistant') {
            blob += (h.role === 'assistant' ? 'Assistente' : 'Utilizador') + ': ' + h.content + '\n';
        }
    }
    blob += '\nUtilizador: ' + userMessage;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: blob }] }],
                generationConfig: { maxOutputTokens: 600, temperature: 0.7 }
            })
        });
        if (!res.ok) {
            if (res.status === 401 || res.status === 403) return { reply: null, skip: true };
            return { reply: 'Não foi possível obter resposta da IA (Google Gemini). Tente novamente.', error: 'api_error' };
        }
        const data = await res.json();
        const cand = data.candidates && data.candidates[0];
        const txt = cand && cand.content && cand.content.parts && cand.content.parts[0] && cand.content.parts[0].text
            ? String(cand.content.parts[0].text).trim()
            : 'Resposta não disponível.';
        return { reply: txt };
    } catch (e) {
        console.error('Assistente AXIS Gemini:', e.message);
        return { reply: null, skip: true };
    }
}

function formatLiveContext(meta) {
    if (!meta || typeof meta !== 'object') return '';
    const parts = [];
    const cc = meta.clientContext || {};
    const ss = meta.serverSnapshot || {};
    if (cc.currentPage) parts.push('Página/hash atual no browser: ' + String(cc.currentPage));
    if (cc.pathname) parts.push('URL path: ' + String(cc.pathname));
    if (cc.userLogin) parts.push('Login do utilizador: ' + String(cc.userLogin));
    if (ss.axisVersion) parts.push('Versão AXIS (servidor): ' + String(ss.axisVersion));
    if (ss.bancadasCount != null) {
        parts.push('Bancadas com registo no servidor: ' + String(ss.bancadasCount) + '; última atualização: ' + String(ss.bancadasUpdatedAt || '—'));
    }
    if (ss.bancadasPreview) {
        const prev = String(ss.bancadasPreview);
        parts.push('Amostra de status (bancada=equipamento): ' + prev.substring(0, 900) + (prev.length > 900 ? '…' : ''));
    }
    if (!parts.length) return '';
    return '\n\n=== CONTEXTO EM TEMPO REAL (use quando for útil; dados deste pedido) ===\n' + parts.join('\n');
}

/** Respostas locais (sem API) para o AXIS Bot funcionar sempre – leitura completa do site */
function fallbackReply(userMessage, userName = '', meta = {}) {
    const m = meta && typeof meta === 'object' ? meta : {};
    const snap = m.serverSnapshot || {};
    const cc = m.clientContext || {};
    const nome = (userName || '').trim().split(/\s+/)[0] || '';
    const cumprimento = nome ? `Olá, ${nome}! ` : 'Olá! ';
    const t = String(userMessage || '').toLowerCase().trim();

    if (/oi|olá|ola|bom dia|boa tarde|boa noite|hey|preciso de ajuda|me ajude|ajuda\s*$/.test(t)) {
        return cumprimento + 'Sou o AXIS Bot. Posso ajudar com o sistema (Inventário, Rondas, Packing, MeliHelp, etc.) e, quando as chaves de IA estiverem configuradas no servidor, também com perguntas gerais. O que precisa?';
    }
    if (/cadastrar|adicionar|criar\s+dispositivo|registrar\s+impressora|nova\s+impressora|zt411|zd421|zq630/.test(t) && /inventario|inventário|impressora|zebra|dispositivo/.test(t)) {
        return 'Para *cadastrar uma impressora*: menu ☰ → Inventário → botão "Criar Dispositivo". Preencha serial, IP, modelo (ZT411, ZD421 ou ZQ630 PLUS), setor e alocação.';
    }
    if (/exportar|baixar|csv|excel|pdf/.test(t) && /inventario|inventário|impressora/.test(t)) {
        return 'Para *exportar o inventário*: menu → Inventário. Na página use os botões de download para CSV, Excel ou PDF.';
    }
    if (/filtrar|filtro/.test(t) && /inventario|inventário|impressora/.test(t)) {
        return 'Para *filtrar* no Inventário: menu → Inventário. Use os filtros por modelo e setor na própria página.';
    }
    if (/inventário|inventario|impressoras|zebra/.test(t)) {
        return 'O *Inventário* fica no menu → "Inventário" ou no card "Inventário" na página inicial. Lá você vê as impressoras Zebra (ZT411, ZD421, ZQ630), pode filtrar por modelo e setor, baixar CSV/Excel/PDF e criar dispositivo.';
    }
    if (/atualizar\s+status|mudar\s+status|enviar\s+status|alterar\s+bancada/.test(t)) {
        return 'Para *atualizar o status de bancada* use o *Sauron*: menu → "Sauron" ou card "Sauron" na home. Lá fica o formulário para enviar ou alterar o status.';
    }
    if (/\bver\s+status\b|consultar\s+bancada|status\s+de\s+bancada|grids\s+bancada/.test(t)) {
        return 'Para *ver o status de bancada* (só visualização): menu → "Status de Bancada" ou card na home. A página mostra os grids (PACKING MONO, PTW, REJEITOS, PACKING MACHINE, RETIROS, RETURNS, etc.). Use o menu hambúrguer na página para filtrar por seção.';
    }
    if (/status de bancada|bancada|sauron/.test(t)) {
        return 'O *Status de Bancada* (só ver) está no menu → "Status de Bancada". Para *atualizar* status use o *Sauron* (menu ou card "Sauron"). Ambos aparecem na home.';
    }
    if (/troca\s+de\s+cabeça|trocar\s+cabeça|cabeça\s+de\s+impressão|pm\s*[1-6]/.test(t)) {
        return 'Para *registrar troca de cabeça*: no site, menu → "PACKING MACHINE" (ou card na home). Pelo celular use o *Bot WhatsApp* do AXIS (envie "menu" no número do bot).';
    }
    if (/ronda|rondas|vistoria/.test(t)) {
        return 'As *Rondas* ficam no menu → "Rondas" ou no card "Rondas" na home. Você pode criar Nova Ronda, ver Rondas Pendentes e Histórico.';
    }
    if (/nova\s+ronda|criar\s+ronda/.test(t)) {
        return 'Para *criar uma ronda*: menu → Rondas → use o botão "Nova Ronda" (ou equivalente) na página de Rondas.';
    }
    if (/preventiv/.test(t) && /packing|pm\s*[1-6]|cabeca|cabe[cç]a|rolo|trac/.test(t)) {
        return 'As *PREVENTIVAS DE PACKING MACHINE* estão na página *PACKING MACHINE*: menu → PACKING MACHINE, separador *Preventivas*. Use *Registrar* para o formulário (usuário, PM, cabeça/rolos, observação) e *Painel* para histórico e gráfico. No *WhatsApp*, envie *preventiva* ou escolha *2* no menu do bot.';
    }
    if (/manutenção|manutencao|preventiva/.test(t)) {
        return 'A *Manutenção Preventiva* (módulo geral de manutenções e PDFs) está no menu → "Manutenções Preventivas" ou no card "Manutenção Preventiva" na home. Para *preventiva só de Packing Machine* (cabeça/rolos PM 1–6), use PACKING MACHINE → separador Preventivas ou o bot com a palavra *preventiva*.';
    }
    if (/packing|packing machine/.test(t)) {
        return 'O *PACKING MACHINE* fica no menu → "PACKING MACHINE" ou no card na home. Há *Trocas de cabeça* (PM 1 a 6) e o separador *Preventivas* (registro e painel). Pelo WhatsApp: *troca* para troca de cabeça; *preventiva* ou menu opção *2* para preventiva de packing.';
    }
    if (/jovem\s+aprendiz|aprendiz|biblioteca\s+aprendiz/.test(t)) {
        return 'O módulo *Jovem Aprendiz* fica no menu → "Jovem Aprendiz" ou no card "Jovem Aprendiz" na home. Inclui a biblioteca para jovens aprendizes.';
    }
    if (/menu|onde fica|como acesso|navegação|navegar/.test(t)) {
        return 'O *menu* é o ícone ☰ (três riscos) no canto superior esquerdo. Itens: Início, Inventário, Rondas, Manutenções, Suporte, Bloco de Notas, Registro de Chamados, Peças, PACKING MACHINE, Notas Fiscais, Status de Bancada, Sauron, Selbetti, MeliHelp, Jovem Aprendiz, Configurações e Sair. Clique num item para ir à página.';
    }
    if (/configuração|configuracoes|tema|escuro|claro|dark|modo\s+escuro/.test(t)) {
        return 'As *Configurações* ficam no menu → "Configurações" ou no card "Configurações" na home. Lá você altera tema (claro/escuro), itens por página, exportar dados, etc.';
    }
    if (/perfil|alterar\s+nome|mudar\s+foto|minha\s+foto|expiração\s+senha/.test(t)) {
        return 'Para editar *perfil* (nome, setor, foto, ver expiração de senha): clique no seu *nome ou foto* no canto superior direito. Abre o dropdown do perfil com as opções.';
    }
    if (/suporte|ticket|abrir\s+ticket/.test(t)) {
        return 'O *Suporte Técnico* está no menu → "Suporte Técnico" ou no card na home. Você pode abrir novo ticket, ver meus tickets, documentação e FAQ.';
    }
    if (/notas fiscais|nota fiscal|nf\b/.test(t)) {
        return 'As *Notas Fiscais* ficam no menu → "Notas Fiscais" ou no card "Notas Fiscais" na home.';
    }
    if (/bloco de notas|bloco\s+notas|rascunho/.test(t)) {
        return 'O *Bloco de Notas* está no menu → "Bloco de Notas" ou no card na home. Abre a página de notas e rascunhos.';
    }
    if (/peças|pecas|peça\b/.test(t)) {
        return 'O módulo *Peças* fica no menu → "Peças" ou no card "Peças" na home.';
    }
    if (/registro de chamados|registro\s+chamados|chamados\b/.test(t)) {
        return 'O *Registro de Chamados* está no menu → "Registro de Chamados" ou no card na home.';
    }
    if (/whatsapp|bot whatsapp|qr\s+code|conectar\s+whatsapp/.test(t)) {
        return 'O *Bot WhatsApp* do AXIS permite *Troca de Cabeça* (Packing), *Preventivas de Packing Machine*, *Status de Bancada*, peças, chamados e *ajuda/suporte* (opção *6* no menu). Conecte em "QR Code WhatsApp" (menu ou /pages/whatsapp-qr.html). Colaboradores enviam *oi*, *menu*, *troca*, *preventiva* ou *ajuda*.';
    }
    if (/administração|admin|criar\s+usuário|gerenciar\s+usuário/.test(t)) {
        return 'A *Administração* (criar/gerenciar usuários, estatísticas, logs) fica no menu → "Administração". Só aparece para usuários com perfil de administrador.';
    }
    if (/sair|logout|desconectar|sair\s+do\s+axis/.test(t)) {
        return 'Para *sair* do AXIS: abra o menu lateral (☰) e clique em "Sair do AXIS". Confirme para voltar à tela de login.';
    }
    if (/o\s+que\s+é\s+axis|para\s+que\s+serve|o\s+que\s+faz\s+o\s+axis/.test(t)) {
        return 'O *AXIS* é o sistema de gestão técnica da Projeto Vida: inventário de impressoras Zebra, rondas, manutenção preventiva, suporte, packing machine, status de bancada, notas fiscais, chamados, peças e mais. O menu lateral (☰) dá acesso a todos os módulos.';
    }
    if (/vers[aã]o|n[uú]mero da vers[aã]o|qual.*vers[aã]o.*axis/i.test(t) && snap.axisVersion) {
        return cumprimento + 'A versão desta instalação do AXIS é *' + snap.axisVersion + '* (reportada pelo servidor). Em *Configurações* também pode ver a versão.';
    }
    if (/onde estou|em que p[aá]gina|p[aá]gina atual|m[oó]dulo atual|estou em que/i.test(t) && cc.currentPage) {
        return cumprimento + 'Pelo seu navegador, você está na área *' + cc.currentPage + '*. Use o menu ☰ para mudar de módulo.';
    }
    if (/quantas bancadas|resumo.*bancada|lista.*bancada|estado das bancadas|dados das bancadas/i.test(t) && snap.bancadasCount > 0) {
        return cumprimento + 'No servidor há *' + snap.bancadasCount + '* bancada(s) com registo. Última atualização: ' + (snap.bancadasUpdatedAt || '—') + '. Resumo: ' + (snap.bancadasPreview || '—') + '. Para ver os grids completos, abra *Status de Bancada* no menu.';
    }
    return cumprimento + 'Posso orientar no AXIS (módulos, menus, fluxos). Para assuntos gerais fora desta lista, configure OPENAI_API_KEY, ANTHROPIC_API_KEY ou GOOGLE_AI_API_KEY no servidor para a IA responder. O que você precisa?';
}

async function chat(userMessage, history = [], userName = '', meta = {}) {
    const m = meta && typeof meta === 'object' ? meta : {};
    const systemPrompt = getSystemPrompt(userName) + formatLiveContext(m);

    const openaiKey = (process.env.OPENAI_API_KEY || '').trim();
    const anthropicKey = (process.env.ANTHROPIC_API_KEY || '').trim();
    const geminiKey = (process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || '').trim();
    const orderRaw = (process.env.AXIS_AI_PROVIDER_ORDER || 'openai,anthropic,gemini').trim();
    const order = orderRaw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

    const providers = [];
    for (const p of order) {
        if (p === 'openai' && !isPlaceholderKey(openaiKey)) providers.push({ name: 'openai', key: openaiKey });
        if (p === 'anthropic' && !isPlaceholderKey(anthropicKey)) providers.push({ name: 'anthropic', key: anthropicKey });
        if ((p === 'gemini' || p === 'google') && !isPlaceholderKey(geminiKey)) providers.push({ name: 'gemini', key: geminiKey });
    }

    if (providers.length === 0) {
        return { reply: fallbackReply(userMessage, userName, m) };
    }

    let lastFallback = null;
    for (const pr of providers) {
        let out;
        if (pr.name === 'openai') {
            out = await chatOpenAI(pr.key, systemPrompt, history, userMessage);
        } else if (pr.name === 'anthropic') {
            out = await chatAnthropic(pr.key, systemPrompt, history, userMessage);
        } else {
            out = await chatGemini(pr.key, systemPrompt, history, userMessage);
        }
        if (out && out.reply && !out.skip) {
            return { reply: out.reply };
        }
        if (out && out.error) {
            return { reply: out.reply, error: out.error };
        }
        lastFallback = out;
    }

    if (lastFallback && lastFallback.skip) {
        return { reply: fallbackReply(userMessage, userName, m) };
    }
    return { reply: fallbackReply(userMessage, userName, m) };
}

module.exports = { chat };
