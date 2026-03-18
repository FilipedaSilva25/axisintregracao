/**
 * Assistente IA - Integração com OpenAI (modelo mais capaz)
 * Retry automático em 429 (rate limit). Reconhece o usuário pelo nome.
 */

const getSystemPrompt = require('./assistant-knowledge');

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o';
const MAX_RETRIES_429 = 2;
const RETRY_DELAYS_MS = [2000, 5000];

async function chat(userMessage, history = [], userName = '') {
    const apiKey = (process.env.OPENAI_API_KEY || '').trim();
    if (!apiKey) {
        return {
            reply: 'O assistente AXIS ainda não está configurado. Para ativar, adicione OPENAI_API_KEY no arquivo .env do servidor (chave da OpenAI). Assim que configurado, poderei responder dúvidas sobre o sistema.',
            error: 'no_api_key'
        };
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
                let msg = 'Não foi possível obter resposta da IA. Tente novamente.';
                if (res.status === 401) msg = 'Chave de API inválida. Verifique OPENAI_API_KEY no .env.';
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
            return {
                reply: 'Erro de conexão com o assistente. Verifique se o servidor tem acesso à internet e se OPENAI_API_KEY está correta no .env.',
                error: 'network'
            };
        }
    }

    return {
        reply: 'Muitas requisições no momento. Aguarde uns 30 segundos e tente de novo.',
        error: 'api_error'
    };
}

module.exports = { chat };
