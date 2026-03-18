/**
 * Assistente IA - Integração com OpenAI (modelo mais capaz)
 * Sem chave API: usa modo local (respostas do conhecimento AXIS). Com OPENAI_API_KEY: usa GPT.
 * Retry automático em 429 (rate limit). Reconhece o usuário pelo nome.
 */

const getSystemPrompt = require('./assistant-knowledge');

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o';
const MAX_RETRIES_429 = 2;
const RETRY_DELAYS_MS = [2000, 5000];

/** Respostas locais (sem API) para o AXIS Bot funcionar sempre – leitura completa do site */
function fallbackReply(userMessage, userName = '') {
    const nome = (userName || '').trim().split(/\s+/)[0] || '';
    const cumprimento = nome ? `Olá, ${nome}! ` : 'Olá! ';
    const t = String(userMessage || '').toLowerCase().trim();

    if (/oi|olá|ola|bom dia|boa tarde|boa noite|hey|preciso de ajuda|me ajude|ajuda\s*$/.test(t)) {
        return cumprimento + 'Sou o AXIS Bot. Pode perguntar onde fica cada módulo (Inventário, Rondas, Packing Machine, Status de Bancada, etc.) ou como fazer algo no AXIS. Em que posso ajudar?';
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
        return 'Para *atualizar o status de bancada* use o *SAURON*: menu → "SAURON" ou card "SAURON" na home. Lá fica o formulário para enviar ou alterar o status.';
    }
    if (/\bver\s+status\b|consultar\s+bancada|status\s+de\s+bancada|grids\s+bancada/.test(t)) {
        return 'Para *ver o status de bancada* (só visualização): menu → "Status de Bancada" ou card na home. A página mostra os grids (PACKING MONO, PTW, REJEITOS, etc.). Use o menu hambúrguer na página para filtrar por seção.';
    }
    if (/status de bancada|bancada|sauron/.test(t)) {
        return 'O *Status de Bancada* (só ver) está no menu → "Status de Bancada". Para *atualizar* status use o *SAURON* (menu ou card "SAURON"). Ambos aparecem na home.';
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
    if (/manutenção|manutencao|preventiva/.test(t)) {
        return 'A *Manutenção Preventiva* está no menu → "Manutenções Preventivas" ou no card "Manutenção Preventiva" na home. Abre a página de gestão de manutenções e geração de PDFs.';
    }
    if (/packing|packing machine/.test(t)) {
        return 'O *PACKING MACHINE* fica no menu → "PACKING MACHINE" ou no card na home. Lá você registra trocas de cabeça de impressão (PM 1 a 6). Também pode usar o bot no WhatsApp para registrar pelo celular.';
    }
    if (/jovem\s+aprendiz|aprendiz|biblioteca\s+aprendiz/.test(t)) {
        return 'O módulo *Jovem Aprendiz* fica no menu → "Jovem Aprendiz" ou no card "Jovem Aprendiz" na home. Inclui a biblioteca para jovens aprendizes.';
    }
    if (/menu|onde fica|como acesso|navegação|navegar/.test(t)) {
        return 'O *menu* é o ícone ☰ (três riscos) no canto superior esquerdo. Itens: Início, Inventário, Rondas, Manutenções, Suporte, Bloco de Notas, Registro de Chamados, Peças, PACKING MACHINE, Notas Fiscais, Status de Bancada, SAURON, Jovem Aprendiz, Configurações e Sair. Clique num item para ir à página.';
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
        return 'O *Bot WhatsApp* do AXIS serve para registrar Troca de Cabeça (Packing) e Status de Bancada pelo celular. Conecte: abra a página "QR Code WhatsApp" (menu ou /pages/whatsapp-qr.html), escaneie o QR com o número que será o bot. Colaboradores enviam "oi" ou "menu" nesse número.';
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
    return cumprimento + 'Estou aqui para ajudar no AXIS. Pode perguntar onde fica um módulo (Inventário, Rondas, Packing Machine, Status de Bancada, SAURON, Jovem Aprendiz...) ou como fazer algo. Em que posso ajudar?';
}

async function chat(userMessage, history = [], userName = '') {
    const apiKey = (process.env.OPENAI_API_KEY || '').trim();
    if (!apiKey || apiKey.length < 20 || apiKey === 'sua-chave' || /^sk-\.\.\.|sua_api_key|exemplo|example/i.test(apiKey)) {
        return { reply: fallbackReply(userMessage, userName) };
    }

    const systemPrompt = getSystemPrompt(userName);
    const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-12).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage }
    ];

    let lastStatus = 0;
    let lastErrorText = '';

    for (let attempt = 0; attempt <= MAX_RETRIES_429; attempt++) {
        try {
            const res = await fetch(OPENAI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: MODEL,
                    messages,
                    max_tokens: 600,
                    temperature: 0.7
                })
            });

            lastStatus = res.status;

            if (res.status === 429 && attempt < MAX_RETRIES_429) {
                const delay = RETRY_DELAYS_MS[attempt] || 5000;
                console.warn('Assistente AXIS: 429 rate limit, aguardando ' + (delay / 1000) + 's antes de tentar de novo (tentativa ' + (attempt + 1) + '/' + (MAX_RETRIES_429 + 1) + ')');
                await new Promise(r => setTimeout(r, delay));
                continue;
            }

            if (!res.ok) {
                lastErrorText = await res.text();
                if (res.status === 401) {
                    return { reply: fallbackReply(userMessage, userName) };
                }
                let msg = 'Não foi possível obter resposta da IA. Tente novamente.';
                if (res.status === 429) msg = 'Muitas requisições no momento. Aguarde uns 30 segundos e tente de novo.';
                if (res.status >= 500) msg = 'Serviço da IA temporariamente indisponível. Tente em instantes.';
                return { reply: msg, error: 'api_error' };
            }

            const data = await res.json();
            const choice = data.choices && data.choices[0];
            const reply = choice && choice.message && choice.message.content
                ? choice.message.content.trim()
                : 'Resposta não disponível.';

            return { reply };
        } catch (e) {
            console.error('Assistente AXIS:', e.message);
            return { reply: fallbackReply(userMessage, userName) };
        }
    }

    return {
        reply: 'Muitas requisições no momento. Aguarde uns 30 segundos e tente de novo.',
        error: 'api_error'
    };
}

module.exports = { chat };
