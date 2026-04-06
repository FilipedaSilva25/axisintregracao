/**
 * MeliHelp — menu numérico no AXIS Bot (fluxo tipo WhatsApp).
 * Integra com axis-robot-assistant.js via window.axisMelihelpChatDispatch.
 */
(function () {
    'use strict';

    var STORAGE = 'axis_mh_chat_v1_state';

    function loadState() {
        try {
            var raw = sessionStorage.getItem(STORAGE);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return { step: 'menu', data: {} };
    }

    function saveState(s) {
        try {
            sessionStorage.setItem(STORAGE, JSON.stringify(s));
        } catch (e) {}
    }

    function normalizeCmd(texto) {
        return String(texto || '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function parseNumero(texto) {
        var n = parseInt(String(texto || '').replace(/\D/g, ''), 10);
        return isNaN(n) || n < 0 ? null : n;
    }

    function pad2Mes(n) {
        var x = parseInt(String(n).replace(/\D/g, ''), 10);
        if (isNaN(x) || x < 1 || x > 12) return null;
        return String(x).padStart(2, '0');
    }

    function stripAccMh(s) {
        return String(s || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }

    /** Mês em português ou 1–12 (igual ao bot WhatsApp). */
    function parseMelihelpMesBr(input) {
        var raw = String(input || '').trim();
        if (!raw) return null;
        var t = stripAccMh(raw).replace(/\./g, ' ');
        var MAP = {
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

    function pageUrlNoHash() {
        return location.origin + location.pathname + (location.search || '');
    }

    function menuTexto() {
        return (
            'MENU MELIHELP — digite o número:\n\n' +
            '1 – Retirada de cordão\n' +
            '2 – Recebimento de cordão\n' +
            '3 – Links do hub\n' +
            '4 – Colar linha\n' +
            '5 – Cartão avulso (número W no mês)\n' +
            '0 – Só perguntas à IA (AXIS ou assuntos gerais)\n\n' +
            'Ou escreva uma pergunta em texto (fora dos números do menu) para a IA ajudar.'
        );
    }

    function linksTexto() {
        var u = pageUrlNoHash();
        return (
            'Links do MeliHelp (abra no navegador):\n\n' +
            '• Página: ' +
            u +
            '\n• Crachás: ' +
            u +
            '#/certificados\n• Emissão de crachá (editor): ' +
            u +
            '#/emissao-cracha\n• Cordão: ' +
            u +
            '#/cordao\n• Cartão avulso: ' +
            u +
            '#/atas\n• Recebimento (ex. mar/2026): ' +
            u +
            '#/cordao/recebimento/2026/03'
        );
    }

    function isMenuKeyword(t, bn) {
        if (bn === 'menu' || bn === 'melihelp' || bn === 'meli help' || bn === 'oi' || bn === 'ola' || bn === 'olá') return true;
        if (t.length < 20 && (bn === 'iniciar' || bn === 'ajuda')) return true;
        return false;
    }

    /**
     * @returns {boolean} true se consumiu a mensagem (não chamar /api/assistant)
     */
    window.axisMelihelpChatDispatch = function (rawText, api) {
        if (!document.body || !document.body.classList.contains('melihelp-hub-body')) return false;
        if (!window.melihelpCordao || typeof api.appendBot !== 'function') return false;

        var appendBot = api.appendBot;
        var t = String(rawText || '').trim();
        var bn = normalizeCmd(t);
        var C = window.melihelpCordao;
        var st = loadState();
        var step = st.step || 'menu';
        var d = st.data || {};

        function go(newStep, newData) {
            st.step = newStep;
            st.data = newData || {};
            saveState(st);
        }

        /* Voltar ao menu explícito */
        if (
            isMenuKeyword(t, bn) &&
            step !== 'mh_ret_re' &&
            step !== 'mh_ret_nome' &&
            step !== 'mh_rec_qtd' &&
            step !== 'mh_rec_ano' &&
            step !== 'mh_rec_mes' &&
            step !== 'mh_linha' &&
            step !== 'mh_avulso_ano' &&
            step !== 'mh_avulso_mes' &&
            step !== 'mh_avulso_w'
        ) {
            go('menu', {});
            appendBot(menuTexto());
            return true;
        }

        /* Durante passos guiados, "menu" cancela e mostra menu */
        if (isMenuKeyword(t, bn) && step !== 'menu' && step !== 'free') {
            go('menu', {});
            appendBot(menuTexto());
            return true;
        }

        if (step === 'free') {
            if (isMenuKeyword(t, bn)) {
                go('menu', {});
                appendBot(menuTexto());
                return true;
            }
            return false;
        }

        if (step === 'menu') {
            if (t === '0' || t === '0.') {
                go('free', {});
                appendBot('Modo livre: perguntas sobre o MeliHelp/AXIS ou assuntos gerais — a IA responde. Envie *menu* para voltar ao menu numérico.');
                return true;
            }
            if (t === '1' || t === '1.') {
                go('mh_ret_re', {});
                appendBot('Retirada de cordão — digite o RE ou CPF.');
                return true;
            }
            if (t === '2' || t === '2.') {
                go('mh_rec_qtd', {});
                appendBot('Recebimento — digite a quantidade (número inteiro).');
                return true;
            }
            if (t === '3' || t === '3.') {
                appendBot(linksTexto());
                return true;
            }
            if (t === '4' || t === '4.') {
                go('mh_linha', {});
                appendBot(
                    'Cole uma linha com separador ; ou |\n• retirada;RE;Nome\n• recebimento;quantidade;ano;mês (mês 2 dígitos, ex. 03)\n• cartaoavulso;ano;mês;W (ex.: cartaoavulso;2026;01;069.56178)'
                );
                return true;
            }
            if (t === '5' || t === '5.') {
                go('mh_avulso_ano', {});
                appendBot('Cartão avulso — digite o *ano* (4 dígitos, ex.: 2026). Depois poderá escolher o mês por *número* ou *nome* (JANEIRO a DEZEMBRO).');
                return true;
            }
            /* Número inválido no menu: deixar IA tentar ajudar */
            if (/^[0-9]+\.?$/.test(t)) {
                appendBot('Opção inválida. Envie 1, 2, 3, 4, 5 ou 0 — ou *menu* para ver a lista.');
                return true;
            }
            return false;
        }

        if (step === 'mh_ret_re') {
            if (!t) {
                appendBot('Informe o RE ou CPF.');
                return true;
            }
            d.mh_re = t;
            go('mh_ret_nome', d);
            appendBot('Digite o nome completo.');
            return true;
        }

        if (step === 'mh_ret_nome') {
            if (t.length < 2) {
                appendBot('Nome muito curto.');
                return true;
            }
            var re = String(d.mh_re || '')
                .replace(/;/g, ' ')
                .trim();
            var nome = t.replace(/;/g, ' ').trim();
            var ok = C.registrar(re, nome, new Date().toISOString(), false, 'saida');
            go('menu', {});
            if (ok) {
                appendBot(
                    'Retirada registada neste navegador (data/hora atual).\n\n' +
                        'Para data no mês do carimbo, use o menu → CORDÃO ou envie *menu* e siga outro fluxo com a linha gerada:\n' +
                        'retirada;' +
                        re +
                        ';' +
                        nome
                );
            } else {
                appendBot('Não foi possível guardar. Confira RE e nome.');
            }
            return true;
        }

        if (step === 'mh_rec_qtd') {
            var qtd = parseNumero(t);
            if (qtd === null || qtd < 1) {
                appendBot('Digite um número válido (ex.: 50).');
                return true;
            }
            d.mh_qtd = qtd;
            go('mh_rec_ano', d);
            appendBot('Digite o ano (4 dígitos, ex.: 2026).');
            return true;
        }

        if (step === 'mh_rec_ano') {
            if (!/^\d{4}$/.test(t)) {
                appendBot('Ano inválido. Use 4 dígitos.');
                return true;
            }
            d.mh_ano = t;
            go('mh_rec_mes', d);
            appendBot('Digite o mês (1 a 12).');
            return true;
        }

        if (step === 'mh_rec_mes') {
            var mm = parseMelihelpMesBr(t);
            if (!mm) {
                appendBot('Mês inválido.');
                return true;
            }
            var iso = C.stampIsoParaMesAno(d.mh_ano, mm);
            var ok = C.registrarRecebimento(String(d.mh_qtd), iso, false);
            go('menu', {});
            if (ok) appendBot('Recebimento guardado no MeliHelp.');
            else appendBot('Não foi possível guardar. Confira a quantidade.');
            return true;
        }

        if (step === 'mh_avulso_ano') {
            if (!/^\d{4}$/.test(t)) {
                appendBot('Ano inválido. Use 4 dígitos.');
                return true;
            }
            d.mh_ano = t;
            go('mh_avulso_mes', d);
            appendBot(
                'Qual é o *mês* do registo?\n\nPode usar *1* a *12* (ou *01*…*12*) ou o *nome*: JANEIRO, FEVEREIRO, MARÇO… (também *jan*, *fev*, *mar*…).\n\n' +
                    '*1* JANEIRO · *2* FEVEREIRO · *3* MARÇO · *4* ABRIL\n' +
                    '*5* MAIO · *6* JUNHO · *7* JULHO · *8* AGOSTO\n' +
                    '*9* SETEMBRO · *10* OUTUBRO · *11* NOVEMBRO · *12* DEZEMBRO'
            );
            return true;
        }

        if (step === 'mh_avulso_mes') {
            var mm0 = parseMelihelpMesBr(t);
            if (!mm0) {
                appendBot('Mês inválido. Use 1 a 12, 01 a 12, ou o nome (ex.: abril, ABR, maio).');
                return true;
            }
            d.mh_mes = mm0;
            go('mh_avulso_w', d);
            var mLab = mm0;
            var meta = window.melihelpHubMeta && window.melihelpHubMeta.meses;
            if (meta && Array.isArray(meta)) {
                var found = meta.find(function (x) {
                    return x.id === mm0;
                });
                if (found) mLab = found.label;
            }
            appendBot(
                'Mês confirmado: *' +
                    mLab +
                    '* (' +
                    mm0 +
                    ') de *' +
                    d.mh_ano +
                    '*. O W ficará *só* neste mês na tabela (não noutro). Digite o *número W* (ex.: 069.56178).'
            );
            return true;
        }

        if (step === 'mh_avulso_w') {
            var line = 'cartaoavulso;' + d.mh_ano + ';' + d.mh_mes + ';' + t.replace(/;/g, ' ').trim();
            var res = C.interpretarLinha(line);
            go('menu', {});
            if (res.ok) appendBot('Número W guardado no MeliHelp para ' + d.mh_ano + '/' + d.mh_mes + '.');
            else if (res.reason === 'avulso_w') appendBot('Não foi possível guardar. Confira o número W.');
            else appendBot('Não foi possível guardar.');
            return true;
        }

        if (step === 'mh_linha') {
            var res = C.interpretarLinha(t);
            go('menu', {});
            if (res.ok) appendBot('Linha interpretada e registo guardado.');
            else if (res.reason === 'vazio') appendBot('Cole uma linha.');
            else if (res.reason === 'qty') appendBot('Quantidade inválida no recebimento.');
            else if (res.reason === 'ano') appendBot('Ano inválido na linha (use 4 dígitos após cartaoavulso).');
            else if (res.reason === 'mes') appendBot('Mês inválido na linha.');
            else if (res.reason === 'avulso_w') appendBot('Número W inválido ou não foi possível guardar o cartão avulso.');
            else if (res.reason === 'formato')
                appendBot('Formato não reconhecido. Use retirada;re;nome, recebimento;qtd;ano;mês ou cartaoavulso;ano;mês;W');
            else appendBot('Não foi possível guardar.');
            return true;
        }

        return false;
    };

    function setPlaceholder() {
        var inp = document.getElementById('axis-robot-input');
        if (inp && document.body.classList.contains('melihelp-hub-body')) {
            inp.setAttribute('placeholder', '1–5, menu, ou pergunta (AXIS ou geral)…');
        }
    }

    if (document.body && document.body.classList.contains('melihelp-hub-body')) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                setTimeout(setPlaceholder, 300);
                setTimeout(setPlaceholder, 1200);
            });
        } else {
            setTimeout(setPlaceholder, 300);
            setTimeout(setPlaceholder, 1200);
        }
    }
})();
