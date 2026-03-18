/**
 * Fluxo do Chatbot WhatsApp - AXIS
 * 1. Troca de Cabeça de Impressão (Packing Machine)
 * 2. Manutenção Preventiva (em breve)
 * 3. Status de Bancada
 */

const PM_OPCOES = ['PM 1', 'PM 2', 'PM 3', 'PM 4', 'PM 5', 'PM 6'];

// Setores (ordem igual ao ATUALIZAR STATUS)
const SETORES = [
    { num: 1, id: 'RETIROS', label: 'RETIROS' },
    { num: 2, id: 'PACKING MACHINE', label: 'PACKING MACHINE' },
    { num: 3, id: 'PACKING MONO', label: 'PACKING MONO' },
    { num: 4, id: 'PACKING PTW', label: 'PACKING PTW' },
    { num: 5, id: 'REJEITOS', label: 'REJEITOS' }
];
const BANCADAS_RETIROS = ['R01', 'R02', 'R03', 'R04', 'R05', 'R06'];
const BANCADAS_PM = ['PM01', 'PM02', 'PM03', 'PM04', 'PM05', 'PM06'];
const BANCADAS_REJEITOS = ['100', '101', '102', '103', '104'];
const BANCADAS_MONO = Array.from({ length: 87 }, (_, i) => String(13 + i));
const BANCADAS_PTW = Array.from({ length: 44 }, (_, i) => 'PTW_' + String(i + 1).padStart(2, '0'));
/* Rótulos PTW iguais ao site: A01, D01, A02, D02 … A22, D22 */
const PTW_DISPLAY_LABELS = {
    'PTW_01': 'A01', 'PTW_12': 'D01', 'PTW_23': 'A02', 'PTW_34': 'D02',
    'PTW_02': 'A03', 'PTW_13': 'D03', 'PTW_24': 'A04', 'PTW_35': 'D04',
    'PTW_03': 'A05', 'PTW_14': 'D05', 'PTW_25': 'A06', 'PTW_36': 'D06',
    'PTW_04': 'A07', 'PTW_15': 'D07', 'PTW_26': 'A08', 'PTW_37': 'D08',
    'PTW_05': 'A09', 'PTW_16': 'D09', 'PTW_27': 'A10', 'PTW_38': 'D10',
    'PTW_06': 'A11', 'PTW_17': 'D11', 'PTW_28': 'A12', 'PTW_39': 'D12',
    'PTW_07': 'A13', 'PTW_18': 'D13', 'PTW_29': 'A14', 'PTW_40': 'D14',
    'PTW_08': 'A15', 'PTW_19': 'D15', 'PTW_30': 'A16', 'PTW_41': 'D16',
    'PTW_09': 'A17', 'PTW_20': 'D17', 'PTW_31': 'A18', 'PTW_42': 'D18',
    'PTW_10': 'A19', 'PTW_21': 'D19', 'PTW_32': 'A20', 'PTW_43': 'D20',
    'PTW_11': 'A21', 'PTW_22': 'D21', 'PTW_33': 'A22', 'PTW_44': 'D22'
};
const PTW_DISPLAY_TO_ID = {};
Object.keys(PTW_DISPLAY_LABELS).forEach(function (id) {
    PTW_DISPLAY_TO_ID[PTW_DISPLAY_LABELS[id].toUpperCase()] = id;
});
const SETOR_TO_BANCADAS = {
    'RETIROS': BANCADAS_RETIROS,
    'PACKING MACHINE': BANCADAS_PM,
    'PACKING MONO': BANCADAS_MONO,
    'PACKING PTW': BANCADAS_PTW,
    'REJEITOS': BANCADAS_REJEITOS
};

// Estado: { step: 'menu'|1|2|3|'status_setor'|'status_bancada'|'status_equipamento', atividade?, setor?, bancada?, ... }
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

/** Retorna o id da bancada (ex: R01, 13, PTW_01) ou null se inválido */
function parseBancadaBySetor(setorId, texto) {
    const t = String(texto || '').trim();
    const list = SETOR_TO_BANCADAS[setorId];
    if (!list) return null;
    if (setorId === 'RETIROS') {
        const n = parseInt(t.replace(/\D/g, ''), 10);
        if (n >= 1 && n <= 6) return BANCADAS_RETIROS[n - 1];
        if (/^r?\s*0?([1-6])$/i.test(t)) return BANCADAS_RETIROS[parseInt(t.match(/([1-6])/)[1], 10) - 1];
        return null;
    }
    if (setorId === 'PACKING MACHINE') {
        const n = parseInt(t.replace(/\D/g, ''), 10);
        if (n >= 1 && n <= 6) return BANCADAS_PM[n - 1];
        if (/^pm\s*0?([1-6])$/i.test(t)) return BANCADAS_PM[parseInt(t.match(/([1-6])/)[1], 10) - 1];
        return null;
    }
    if (setorId === 'PACKING MONO') {
        const n = parseInt(t.replace(/\D/g, ''), 10);
        if (n >= 13 && n <= 99) return String(n);
        return null;
    }
    if (setorId === 'PACKING PTW') {
        const code = t.toUpperCase().replace(/\s/g, '').replace(/[^A-Z0-9]/g, '');
        if (code && PTW_DISPLAY_TO_ID[code]) return PTW_DISPLAY_TO_ID[code];
        const n = parseInt(t.replace(/\D/g, ''), 10);
        if (n >= 1 && n <= 44) return 'PTW_' + String(n).padStart(2, '0');
        return null;
    }
    if (setorId === 'REJEITOS') {
        const n = parseInt(t.replace(/\D/g, ''), 10);
        if (n >= 1 && n <= 5) return BANCADAS_REJEITOS[n - 1];
        if (n >= 100 && n <= 104) return String(n);
        return null;
    }
    return null;
}

const MSG = {
    saudacao: `Olá! Bem-vindo ao *AXIS*.

O que você gostaria de fazer?

*1* – Troca de Cabeça de Impressão (Packing Machine)
*2* – Registro de Manutenção Preventiva
*3* – Status de Bancada
*4* – Inventário de peças (entrada/saída rápida)
*5* – Registro de Chamados (Mercado Livre)

_Digite 1, 2, 3, 4 ou 5 para continuar_`,

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

    erroAtividade: `⚠️ Por favor, digite *1*, *2*, *3*, *4* ou *5* para escolher a atividade.

*1* – Troca de Cabeça de Impressão
*2* – Manutenção Preventiva
*3* – Status de Bancada
*4* – Inventário de peças
*5* – Registro de Chamados`,

    pecasSubmenu: `📦 *Inventário de peças, acessórios e limpeza*

*1* – Registrar *entrada* (cadastrar ou adicionar quantidade)
*2* – Registrar *saída* (retirada)
*3* – Consultar estoque

_Digite 1, 2 ou 3_`,

    pecasEntradaProduto: `📥 *Entrada no estoque*

Digite o *nome do produto* (ex: Citrus Limpante, Cabo USB).`,

    pecasEntradaQtd: (produto) => `✅ Produto: *${produto}*

Digite a *quantidade* a dar entrada (número).`,

    pecasEntradaOk: (produto, qtd) => `✅ *Entrada registrada!*

• Produto: *${produto}*
• Quantidade: *${qtd}*

O estoque foi atualizado no AXIS.`,

    pecasSaidaLista: (lista) => `📤 *Saída do estoque*

Itens disponíveis:\n${lista}\n_Digite o *nome do produto* que deseja dar saída (exatamente como na lista)._`,

    pecasSaidaQtd: (produto, max) => `✅ Produto: *${produto}* (máx. ${max} un.)

Digite a *quantidade* a dar saída.`,

    pecasSaidaOk: (produto, qtd) => `✅ *Saída registrada!*

• Produto: *${produto}*
• Quantidade: *${qtd}*`,

    pecasConsulta: (texto) => `📋 *Estoque atual*\n\n${texto}`,

    pecasErroProduto: `⚠️ Digite o nome do produto.`,

    pecasErroQtd: `⚠️ Digite um número válido para a quantidade.`,

    pecasErroItemNaoEncontrado: `⚠️ Produto não encontrado no estoque. Verifique o nome e tente novamente.`,

    erroPm: `⚠️ Digite um número de 1 a 6 para a PM.

_Escolha: 1, 2, 3, 4, 5 ou 6_`,

    erroQtd: `⚠️ Digite um número válido de impressões.

_Exemplo: 70303_`,

    erroTecnico: `⚠️ Informe o nome completo do técnico (mínimo 2 caracteres).`,

    erroGeral: `❌ Ocorreu um erro. Tente novamente ou use o site.

Digite *oi* ou *menu* para recomeçar.`,

    menu: `Digite *oi*, *menu* ou *troca* para iniciar um novo registro.`,

    rcNumero: `📋 *Registro de Chamados (Mercado Livre)*

Digite o *número do chamado* (ex: IS-910791).`,

    rcStatus: `🔎 *Status do Chamado*

Qual o status?

*1* – Aberto
*2* – Em Andamento
*3* – Fechado

_Digite 1, 2 ou 3_`,

    rcObs: `📝 *Observação do Chamado*

Digite uma breve descrição ou contexto do chamado.

_Exemplo: Cliente reclamou de atraso na entrega_`,

    rcOk: (chave, status) => `✅ *Chamado registrado com sucesso!*

• Número: *${chave}*
• Status: *${status === 'FECHADO' ? 'Fechado' : status === 'EM_ANDAMENTO' ? 'Em Andamento' : 'Aberto'}*

O chamado já está disponível no módulo Registro de Chamados.`,

    rcErroNumero: `⚠️ Informe o *número do chamado* (ex: IS-910791).`,
    rcErroStatus: `⚠️ Escolha um status válido: *1* (Aberto), *2* (Em Andamento) ou *3* (Fechado).`,

    statusSetor: `📊 *Atualizar Status de Bancada*

Escolha o *setor* (digite o número):

*1* – RETIROS
*2* – PACKING MACHINE
*3* – PACKING MONO
*4* – PACKING PTW
*5* – REJEITOS

_Digite 1 a 5_`,

    statusBancadaPrompt: (setorLabel) => {
        const d = {
            'RETIROS': 'Digite *1* a *6* (R01 a R06)',
            'PACKING MACHINE': 'Digite *1* a *6* (PM01 a PM06)',
            'PACKING MONO': 'Digite o número da bancada (*13* a *99*)',
            'PACKING PTW': 'Bancadas: *A01*, *D01*, *A02*, *D02* … *A22*, *D22* (igual ao site).\nDigite o código (ex: A01 ou D01) ou o número de *1* a *44*.',
            'REJEITOS': 'Digite *1* a *5* (100 a 104)'
        };
        return `✅ Setor *${setorLabel}* selecionado.\n\nQual *bancada*?\n\n_${d[setorLabel] || 'Escolha a bancada.'}_`;
    },

    statusEquipamento: `✅ Bancada registrada.

Qual *equipamento* nesta bancada?

*1* – Livre
*2* – Defeito impressora
*3* – Defeito notebook
*4* – Bancada sem impressora
*5* – Bancada sem notebook

_Digite 1 a 5_`,

    statusConfirmacaoSucesso: (bancada, equipamento) => {
        const eq = equipamento === 'IMPRESSORA' ? 'Defeito impressora' : equipamento === 'NOTEBOOK' ? 'Defeito notebook' : equipamento === 'SEM_IMPRESSORA_IMP' ? 'Bancada sem impressora' : equipamento === 'SEM_IMPRESSORA_NB' ? 'Sem impressora (nb)' : 'Livre';
        const bancadaExibir = (bancada && bancada.indexOf('PTW_') === 0 && PTW_DISPLAY_LABELS[bancada]) ? PTW_DISPLAY_LABELS[bancada] : bancada;
        return `✅ *Status atualizado com sucesso!*\n\n• Bancada: *${bancadaExibir}*\n• Equipamento: *${eq}*\n\nO status já está salvo no AXIS.`;
    },

    erroStatusSetor: `⚠️ Digite um número de *1* a *5* para escolher o setor.`,
    erroStatusBancada: (setorLabel) => `⚠️ Bancada inválida para *${setorLabel}*. Verifique e digite novamente.`,
    erroStatusEquipamento: `⚠️ Digite *1* a *5* para o equipamento (Livre, Defeito impressora, Defeito notebook, Sem impressora, Sem notebook).`
};

function resumoStatusBancadas(bancadas) {
    if (!bancadas || typeof bancadas !== 'object') return '';
    const counts = { DISPONIVEL: 0, IMPRESSORA: 0, NOTEBOOK: 0, SEM_IMPRESSORA_IMP: 0, SEM_IMPRESSORA_NB: 0 };
    for (const status of Object.values(bancadas)) {
        const s = String(status || '').toUpperCase();
        if (s === 'IMPRESSORA') counts.IMPRESSORA++;
        else if (s === 'NOTEBOOK') counts.NOTEBOOK++;
        else if (s === 'SEM_IMPRESSORA_IMP') counts.SEM_IMPRESSORA_IMP++;
        else if (s === 'SEM_IMPRESSORA_NB') counts.SEM_IMPRESSORA_NB++;
        else counts.DISPONIVEL++;
    }
    const total = counts.DISPONIVEL + counts.IMPRESSORA + counts.NOTEBOOK + counts.SEM_IMPRESSORA_IMP + counts.SEM_IMPRESSORA_NB;
    if (total === 0) return 'Nenhum status registrado ainda.';
    const parts = [];
    if (counts.DISPONIVEL) parts.push(`${counts.DISPONIVEL} livre(s)`);
    if (counts.IMPRESSORA) parts.push(`${counts.IMPRESSORA} defeito impressora`);
    if (counts.NOTEBOOK) parts.push(`${counts.NOTEBOOK} defeito notebook`);
    if (counts.SEM_IMPRESSORA_IMP) parts.push(`${counts.SEM_IMPRESSORA_IMP} sem impressora`);
    if (counts.SEM_IMPRESSORA_NB) parts.push(`${counts.SEM_IMPRESSORA_NB} sem notebook`);
    return 'Resumo: ' + (parts.join(', ') || '—');
}

async function handleIncoming(msg, sendReply, registerTroca, opts) {
    const from = normalizarTelefone(msg.from);
    const body = (msg.body || '').trim().toLowerCase();
    const getBancadasStatus = opts && typeof opts.getBancadasStatus === 'function' ? opts.getBancadasStatus : null;
    const baseUrl = (opts && opts.baseUrl) ? String(opts.baseUrl) : '';

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
        if (t === '3' || t === '3.') {
            estado.step = 'status_setor';
            estado.atividade = 'status_bancada';
            estados.set(from, estado);
            return sendReply(from, MSG.statusSetor);
        }
        if (t === '4' || t === '4.') {
            estado.step = 'pecas_submenu';
            estado.atividade = 'pecas';
            estados.set(from, estado);
            return sendReply(from, MSG.pecasSubmenu);
        }
        if (t === '5' || t === '5.') {
            estado.step = 'rc_numero';
            estado.atividade = 'registro_chamados';
            estados.set(from, estado);
            return sendReply(from, MSG.rcNumero);
        }
        return sendReply(from, MSG.erroAtividade);
    }

    const getPecasEstoque = opts && typeof opts.getPecasEstoque === 'function' ? opts.getPecasEstoque : null;
    const registerPecasEntrada = opts && typeof opts.registerPecasEntrada === 'function' ? opts.registerPecasEntrada : null;
    const registerPecasSaida = opts && typeof opts.registerPecasSaida === 'function' ? opts.registerPecasSaida : null;
    const registerChamado = opts && typeof opts.registerChamado === 'function' ? opts.registerChamado : null;

    if (estado.step === 'pecas_submenu') {
        const t = String(msg.body || '').trim();
        if (t === '1' || t === '1.') {
            estado.step = 'pecas_entrada_produto';
            estados.set(from, estado);
            return sendReply(from, MSG.pecasEntradaProduto);
        }
        if (t === '2' || t === '2.') {
            estado.step = 'pecas_saida_produto';
            estados.set(from, estado);
            const estoque = getPecasEstoque ? await getPecasEstoque() : [];
            const comQtd = (estoque || []).filter(p => (p.quantidade || 0) > 0);
            const lista = comQtd.slice(0, 15).map(p => '• ' + (p.produto || p.nome || '—') + ' (' + (p.quantidade || 0) + ' un.)').join('\n') || 'Nenhum item em estoque.';
            return sendReply(from, MSG.pecasSaidaLista(lista));
        }
        if (t === '3' || t === '3.') {
            const estoque = getPecasEstoque ? await getPecasEstoque() : [];
            const comQtd = (estoque || []).filter(p => (p.quantidade || 0) > 0);
            const lista = comQtd.slice(0, 20).map(p => '• ' + (p.produto || p.nome || '—') + ': *' + (p.quantidade || 0) + '* un.').join('\n') || 'Nenhum item em estoque.';
            estados.delete(from);
            return sendReply(from, MSG.pecasConsulta(lista));
        }
        return sendReply(from, MSG.pecasSubmenu);
    }

    if (estado.step === 'pecas_entrada_produto') {
        const produto = String(msg.body || '').trim();
        if (!produto) return sendReply(from, MSG.pecasErroProduto);
        estado.pecas_produto = produto;
        estado.step = 'pecas_entrada_qtd';
        estados.set(from, estado);
        return sendReply(from, MSG.pecasEntradaQtd(produto));
    }

    if (estado.step === 'pecas_entrada_qtd') {
        const qtd = parseNumero(msg.body);
        if (qtd === null || qtd < 1) return sendReply(from, MSG.pecasErroQtd);
        const produto = estado.pecas_produto || 'Item';
        if (registerPecasEntrada) {
            try {
                await registerPecasEntrada({ produto: produto, quantidade: qtd, observacao: 'Entrada via WhatsApp', usuario: from });
            } catch (e) {
                estados.delete(from);
                return sendReply(from, MSG.erroGeral);
            }
        }
        estados.delete(from);
        return sendReply(from, MSG.pecasEntradaOk(produto, qtd));
    }

    if (estado.step === 'pecas_saida_produto') {
        const nome = String(msg.body || '').trim().toLowerCase();
        if (!nome) return sendReply(from, MSG.pecasErroProduto);
        const estoque = getPecasEstoque ? await getPecasEstoque() : [];
        const peca = (estoque || []).find(p => (p.quantidade || 0) > 0 && ((p.produto || p.nome || '').toLowerCase() === nome || (p.produto || p.nome || '').toLowerCase().indexOf(nome) >= 0));
        if (!peca) return sendReply(from, MSG.pecasErroItemNaoEncontrado);
        estado.pecas_pecaId = peca.id;
        estado.pecas_produto = peca.produto || peca.nome || '—';
        estado.pecas_max = peca.quantidade || 0;
        estado.step = 'pecas_saida_qtd';
        estados.set(from, estado);
        return sendReply(from, MSG.pecasSaidaQtd(estado.pecas_produto, estado.pecas_max));
    }

    if (estado.step === 'pecas_saida_qtd') {
        const qtd = parseNumero(msg.body);
        if (qtd === null || qtd < 1 || qtd > (estado.pecas_max || 0)) return sendReply(from, MSG.pecasErroQtd);
        if (registerPecasSaida) {
            try {
                await registerPecasSaida({ pecaId: estado.pecas_pecaId, quantidade: qtd, observacao: 'Saída via WhatsApp' });
            } catch (e) {
                estados.delete(from);
                return sendReply(from, MSG.erroGeral);
            }
        }
        const produto = estado.pecas_produto || '—';
        estados.delete(from);
        return sendReply(from, MSG.pecasSaidaOk(produto, qtd));
    }

    if (estado.step === 'rc_numero') {
        const chave = String(msg.body || '').trim();
        if (!chave) return sendReply(from, MSG.rcErroNumero);
        estado.rc_chave = chave;
        estado.step = 'rc_status';
        estados.set(from, estado);
        return sendReply(from, MSG.rcStatus);
    }

    if (estado.step === 'rc_status') {
        const t = String(msg.body || '').trim();
        let status = '';
        if (t === '1' || t === '1.') status = 'ABERTO';
        else if (t === '2' || t === '2.') status = 'EM_ANDAMENTO';
        else if (t === '3' || t === '3.') status = 'FECHADO';
        if (!status) return sendReply(from, MSG.rcErroStatus);
        estado.rc_status = status;
        estado.step = 'rc_obs';
        estados.set(from, estado);
        return sendReply(from, MSG.rcObs);
    }

    if (estado.step === 'rc_obs') {
        const obs = String(msg.body || '').trim();
        const chave = estado.rc_chave || '';
        const status = estado.rc_status || 'ABERTO';
        if (registerChamado) {
            try {
                await registerChamado({
                    chave: chave,
                    status: status,
                    observacao: obs,
                    tipos: [],
                    phone: from
                });
            } catch (e) {
                estados.delete(from);
                return sendReply(from, MSG.erroGeral);
            }
        }
        estados.delete(from);
        return sendReply(from, MSG.rcOk(chave || '(sem número)', status));
    }

    if (estado.step === 'status_setor') {
        const t = String(msg.body || '').trim();
        const n = parseInt(t.replace(/\D/g, ''), 10);
        const setor = SETORES.find(s => s.num === n);
        if (setor) {
            estado.setor = setor.id;
            estado.step = 'status_bancada';
            estados.set(from, estado);
            return sendReply(from, MSG.statusBancadaPrompt(setor.label));
        }
        return sendReply(from, MSG.erroStatusSetor);
    }

    if (estado.step === 'status_bancada') {
        const bancadaId = parseBancadaBySetor(estado.setor, msg.body);
        const setorLabel = (SETORES.find(s => s.id === estado.setor) || {}).label || estado.setor;
        if (bancadaId) {
            estado.bancada = bancadaId;
            estado.step = 'status_equipamento';
            estados.set(from, estado);
            return sendReply(from, MSG.statusEquipamento);
        }
        return sendReply(from, MSG.erroStatusBancada(setorLabel));
    }

    if (estado.step === 'status_equipamento') {
        const t = String(msg.body || '').trim();
        let equipamento = '';
        if (t === '1' || t === '1.') equipamento = 'DISPONIVEL';
        else if (t === '2' || t === '2.') equipamento = 'IMPRESSORA';
        else if (t === '3' || t === '3.') equipamento = 'NOTEBOOK';
        else if (t === '4' || t === '4.') equipamento = 'SEM_IMPRESSORA_IMP';
        else if (t === '5' || t === '5.') equipamento = 'SEM_IMPRESSORA_NB';
        if (equipamento) {
            const updateBancadaStatus = opts && typeof opts.updateBancadaStatus === 'function' ? opts.updateBancadaStatus : null;
            if (updateBancadaStatus) {
                try {
                    await updateBancadaStatus(estado.bancada, equipamento);
                } catch (e) {
                    estados.delete(from);
                    return sendReply(from, MSG.erroGeral);
                }
            }
            const bancada = estado.bancada;
            const eq = equipamento;
            estados.delete(from);
            return sendReply(from, MSG.statusConfirmacaoSucesso(bancada, eq));
        }
        return sendReply(from, MSG.erroStatusEquipamento);
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
