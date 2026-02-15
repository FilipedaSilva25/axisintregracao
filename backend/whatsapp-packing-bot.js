/**
 * Fluxo do Chatbot WhatsApp - AXIS Packing Machine
 * Saudação inicial + Seleção de atividade + Registro
 * 1. Troca de Cabeça | 2. Manutenção Preventiva (em breve)
 */

const PM_OPCOES = ['PM 1', 'PM 2', 'PM 3', 'PM 4', 'PM 5', 'PM 6'];

// Estado: { step: 'menu'|1|2|3, atividade?: 'troca', numeroPm?, quantidadeImpressoes?, tecnico? }
const estados = new Map();

function normalizarTelefone(phone) {
    return String(phone || '').replace(/\D/g, '').substring(0, 20) || 'unknown';
}

function parsePm(texto) {
    const t = String(texto || '').trim();
    const n = parseInt(t.replace(/\D/g, ''), 10);
    if (n >= 1 && n <= 6) return PM_OPCOES[n - 1];
    if (/^pm\s*[1-6]$/i.test(t)) return 'PM ' + t.match(/([1-6])/)[1];
    return null;
}

function parseNumero(texto) {
    const n = parseInt(String(texto || '').replace(/\D/g, ''), 10);
    return isNaN(n) || n < 0 ? null : n;
}

const MSG = {
    saudacao: `Olá! Bem-vindo ao *AXIS Packing Machine*.

O que você gostaria de fazer?

*1* – Troca de Cabeça de Impressão
*2* – Registro de Manutenção Preventiva

_Digite 1 ou 2 para continuar_`,

    selecaoTroca: `📋 *Troca de Cabeça de Impressão*

Qual máquina? Digite o número:

1️⃣ PM 1  2️⃣ PM 2  3️⃣ PM 3
4️⃣ PM 4  5️⃣ PM 5  6️⃣ PM 6

_Digite apenas o número (1 a 6)_`,

    emBreve: `🔧 *Manutenção Preventiva*

Esta funcionalidade está em desenvolvimento e será liberada em breve.

Para iniciar outra ação, digite *oi* ou *menu*.`,

    passo2: (pm) => `✅ *${pm}* selecionada.

📊 *Quantidade de impressões*

Quantas impressões foram feitas nessa cabeça?

_Exemplo: 70303_`,

    passo3: (pm, qtd) => `✅ Impressões registradas.

👤 *Técnico responsável*

Qual o nome do técnico que fez a troca?

_Digite seu nome completo_`,

    confirmaSucesso: (pm, qtd, tecnico) => `✅ *Troca registrada com sucesso!*

📋 _Resumo do registro:_
• *PM:* ${pm}
• *Impressões:* ${qtd.toLocaleString('pt-BR')}
• *Técnico:* ${tecnico}

O registro já está disponível na página Packing Machine.`,

    erroAtividade: `⚠️ Por favor, digite *1* ou *2* para escolher a atividade.

*1* – Troca de Cabeça
*2* – Manutenção Preventiva`,

    erroPm: `⚠️ Digite um número de 1 a 6 para a PM.

_Escolha: 1, 2, 3, 4, 5 ou 6_`,

    erroQtd: `⚠️ Digite um número válido de impressões.

_Exemplo: 70303_`,

    erroTecnico: `⚠️ Informe o nome completo do técnico (mínimo 2 caracteres).`,

    erroGeral: `❌ Ocorreu um erro. Tente novamente ou use o site.

Digite *oi* ou *menu* para recomeçar.`,

    menu: `Digite *oi*, *menu* ou *troca* para iniciar um novo registro.`
};

async function handleIncoming(msg, sendReply, registerTroca) {
    const from = normalizarTelefone(msg.from);
    const body = (msg.body || '').trim().toLowerCase();

    const comandoInicio = ['troca', 'registrar', 'registro', 'oi', 'ola', 'olá', 'menu', 'iniciar'];
    if (comandoInicio.some(c => body.includes(c)) && body.length < 35) {
        estados.set(from, { step: 'menu' });
        return sendReply(from, MSG.saudacao);
    }

    let estado = estados.get(from);
    if (!estado) {
        estado = { step: 'menu' };
        estados.set(from, estado);
    }

    if (estado.step === 'menu') {
        const t = String(msg.body || '').trim();
        if (t === '1' || t === '1.') {
            estado.step = 1;
            estado.atividade = 'troca';
            estados.set(from, estado);
            return sendReply(from, MSG.selecaoTroca);
        }
        if (t === '2' || t === '2.') {
            return sendReply(from, MSG.emBreve);
        }
        return sendReply(from, MSG.erroAtividade);
    }

    if (estado.step === 1) {
        const pm = parsePm(msg.body);
        if (pm) {
            estado.numeroPm = pm;
            estado.step = 2;
            estados.set(from, estado);
            return sendReply(from, MSG.passo2(pm));
        }
        return sendReply(from, MSG.erroPm);
    }

    if (estado.step === 2) {
        const qtd = parseNumero(msg.body);
        if (qtd !== null && qtd >= 0) {
            estado.quantidadeImpressoes = qtd;
            estado.step = 3;
            estados.set(from, estado);
            return sendReply(from, MSG.passo3(estado.numeroPm, qtd));
        }
        return sendReply(from, MSG.erroQtd);
    }

    if (estado.step === 3) {
        const tecnico = String(msg.body || '').trim().substring(0, 100);
        if (tecnico.length >= 2) {
            const troca = {
                numeroPm: estado.numeroPm,
                quantidadeImpressoes: estado.quantidadeImpressoes,
                tecnico: tecnico,
                phone: from,
                dataHora: new Date().toISOString()
            };
            estados.delete(from);
            try {
                await registerTroca(troca);
                return sendReply(from, MSG.confirmaSucesso(estado.numeroPm, estado.quantidadeImpressoes, tecnico));
            } catch (e) {
                return sendReply(from, MSG.erroGeral);
            }
        }
        return sendReply(from, MSG.erroTecnico);
    }

    return sendReply(from, MSG.menu);
}

module.exports = {
    handleIncoming,
    normalizarTelefone,
    parsePm,
    parseNumero,
    PM_OPCOES
};
