/**
 * REGISTRO DE CHAMADOS (MERCADO LIVRE) - AXIS
 * PÁGINA 100% CONCLUÍDA E DECLARADA FINAL (2026-02-09)
 * Referência: docs/REGISTRO_CHAMADOS_REFERENCIA.md
 * Blindagem: docs/BLINDAGEM_REGISTRO_CHAMADOS.md
 * NÃO ALTERAR sem autorização do usuário ou documentação prévia.
 *
 * Mapeamento BRSC02: formulário na página Sauron; lista e gráficos em registro_chamados.html.
 * Filtro por período, exportação PDF/Excel/CSV/Google, modo escuro na lista, busca.
 * Dados: localStorage (axis_registro_chamados); lixeira legada mantida no código mas sem UI.
 */

(function () {
    'use strict';

const STORAGE_KEY = 'axis_registro_chamados';
const STORAGE_LIXEIRA = 'axis_registro_chamados_lixeira';
const LIXEIRA_DIAS = 30;
var RC_SYNC_INTERVAL = null;

/** Uma linha por pessoa: nome, usuário ML e e-mail corporativo Mercado Livre (BRSC02). */
var MAPEAMENTO_PESSOAS = [
    { nome: 'Jesus David Espinoza Granado', usuarioMl: 'jedgranado', email: 'jesus.jdgranado@mercadolivre.com' },
    { nome: 'Henrique Marafigo da Costa', usuarioMl: 'hencosta', email: 'henriquemar.costa@mercadolivre.com' },
    { nome: 'Michel Mendes Miranda', usuarioMl: 'micmiranda', email: 'michel.miranda@mercadolivre.com' },
    { nome: 'Cleber Augusto Fontoura Schenckel', usuarioMl: 'caschenckel', email: 'cleber.aschenckel@mercadolivre.com' },
    { nome: 'Gabriel Platt', usuarioMl: 'gpratt', email: 'gabriel.platt@mercadolivre.com' },
    { nome: 'Adalbino Caunora Fernandes Gomes', usuarioMl: 'adalbinofergomes', email: 'adalbino.fergomes@mercadolivre.com' },
    { nome: 'Nitay De Lima Rabelo', usuarioMl: 'nitaynilma', email: 'nitay.nlima@mercadolivre.com' },
    { nome: 'Beatriz Silva da Conceição', usuarioMl: 'ext_siconbea', email: 'ext_siconbea@mercadolivre.com' },
    { nome: 'Filipe da Silva', usuarioMl: 'ext_sifilipe', email: 'ext_sifilipe@mercadolivre.com' }
];

/** Preenche campos do mapeamento a partir do texto da observação (registos antigos sem objeto mapeamento). */
function parseMapeamentoDaObservacao(obs) {
    if (!obs || typeof obs !== 'string' || obs.indexOf('BRSC02') === -1) return null;
    var parts = obs.split(' · ');
    var email = '';
    var bancada = '';
    var usuarioMl = '';
    for (var i = 0; i < parts.length; i++) {
        var s = parts[i].trim();
        if (/^ML:\s*/i.test(s)) usuarioMl = s.replace(/^ML:\s*/i, '').trim();
        else if (/^Bancada\s+/i.test(s)) bancada = s.replace(/^Bancada\s+/i, '').trim();
        else if (s.indexOf('@') !== -1 && !email) email = s;
    }
    if (!usuarioMl && !bancada && !email) return null;
    return { usuarioMl: usuarioMl, bancada: bancada, emailCorporativo: email };
}

function getMapeamentoFields(c) {
    var m = c && c.mapeamento && typeof c.mapeamento === 'object' ? c.mapeamento : null;
    var fromObs = parseMapeamentoDaObservacao(c && c.observacao);
    var nome = m && m.nomeCompleto ? String(m.nomeCompleto) : '';
    var usuarioMl = m && m.usuarioMl ? String(m.usuarioMl) : '';
    var bancada = m && m.bancada ? String(m.bancada) : '';
    var email = m && m.emailCorporativo ? String(m.emailCorporativo) : '';
    if (fromObs) {
        if (!usuarioMl && fromObs.usuarioMl) usuarioMl = fromObs.usuarioMl;
        if (!bancada && fromObs.bancada) bancada = fromObs.bancada;
        if (!email && fromObs.emailCorporativo) email = fromObs.emailCorporativo;
    }
    if (!nome && usuarioMl) {
        var p = MAPEAMENTO_PESSOAS.filter(function (x) { return x.usuarioMl === usuarioMl; })[0];
        if (p) nome = p.nome;
    }
    return {
        nome: nome,
        usuarioMl: usuarioMl,
        bancada: bancada,
        email: email
    };
}

/** Status canónico (operador / administração). */
var RC_STATUS_EXIBICAO = {
    aberto: 'CHAMADO ABERTO',
    'em-andamento': 'CHAMADO EM ANDAMENTO',
    finalizado: 'CHAMADO FINALIZADO',
    pendente: 'CHAMADO PENDENTE'
};

function normalizeChamadoStatus(raw) {
    if (raw == null || raw === '') return 'aberto';
    var s = String(raw).toLowerCase().replace(/_/g, '-').replace(/\s+/g, '').trim();
    if (s === 'fechado' || s === 'finalizado') return 'finalizado';
    if (s === 'emandamento' || s === 'em-andamento') return 'em-andamento';
    if (s === 'pendente') return 'pendente';
    if (s === 'aberto') return 'aberto';
    return 'aberto';
}

function statusTituloPlanilha(c) {
    var k = normalizeChamadoStatus(c && c.status);
    return RC_STATUS_EXIBICAO[k] || 'CHAMADO ABERTO';
}

function statusPillClassFromKey(key) {
    return 'rc-status-pill rc-status-pill--' + key;
}

function statusPillClassForChamado(c) {
    return statusPillClassFromKey(normalizeChamadoStatus(c && c.status));
}

function isLinhaMapeamentoUsuario(c) {
    if (!c) return false;
    if (c.mapeamento && typeof c.mapeamento === 'object') return true;
    var og = c.origem && String(c.origem).toLowerCase();
    if (og && og.indexOf('sauron') !== -1) return true;
    if (og && og.indexOf('admin_mapeamento_manual') !== -1) return true;
    return false;
}

/** Linhas que entram nas estatísticas ML / mês (alinha à tabela: inclui dados inferidos de observação BRSC02). */
function incluirNaEstatisticaMapeamento(c) {
    if (!c || !c.chave) return false;
    if (isLinhaMapeamentoUsuario(c)) return true;
    var mf = getMapeamentoFields(c);
    if (mf.usuarioMl || mf.nome) return true;
    return false;
}

/** ano null = qualquer ano; mes null com ano definido = todo o ano; mes 1–12 = mês específico. */
function chamadoCorrespondePeriodo(c, ano, mes) {
    if (ano == null) return true;
    if (!c || !c.data) return false;
    var d = new Date(c.data);
    if (isNaN(d.getTime())) return false;
    if (d.getFullYear() !== ano) return false;
    if (mes != null && (d.getMonth() + 1) !== mes) return false;
    return true;
}

function listChamadosSomenteMes(todos, ano, mes) {
    if (!Array.isArray(todos)) return [];
    return todos.filter(function (c) { return chamadoCorrespondePeriodo(c, ano, mes); });
}

/** Igual ao servidor: um IS = uma linha (preserva data/status do registo mais recente e agrega mapeamento). */
function dedupeRegistroChamadosPorIsLocal(list) {
    if (!Array.isArray(list)) return [];
    var semChave = [];
    var comChave = [];
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        if (!item || typeof item !== 'object') continue;
        var ch = item.chave != null ? String(item.chave).trim() : '';
        if (!ch) {
            semChave.push(item);
            continue;
        }
        comChave.push(item);
    }
    var grupos = {};
    for (var j = 0; j < comChave.length; j++) {
        var it = comChave[j];
        var k = String(it.chave).trim().toLowerCase();
        if (!grupos[k]) grupos[k] = [];
        grupos[k].push(it);
    }
    var fundidos = [];
    for (var key in grupos) {
        if (!Object.prototype.hasOwnProperty.call(grupos, key)) continue;
        var arr = grupos[key];
        arr.sort(function (a, b) { return new Date(b.data || 0) - new Date(a.data || 0); });
        var novo = {};
        try {
            for (var p in arr[0]) if (Object.prototype.hasOwnProperty.call(arr[0], p)) novo[p] = arr[0][p];
        } catch (e) { novo = arr[0]; }
        for (var x = 1; x < arr.length; x++) {
            var o = arr[x];
            if (!novo.mapeamento && o.mapeamento) novo.mapeamento = o.mapeamento;
            if ((!novo.observacao || !String(novo.observacao).trim()) && o.observacao) novo.observacao = o.observacao;
            if (!novo.tipos || !novo.tipos.length) novo.tipos = o.tipos || [];
        }
        fundidos.push(novo);
    }
    fundidos.sort(function (a, b) { return new Date(b.data || 0) - new Date(a.data || 0); });
    return fundidos.concat(semChave);
}

/**
 * Sincronização: preserva no cliente registo que ainda não veio no GET (ex.: POST em curso ou falhou rede).
 * Depois aplica dedupe por IS como no resto da app.
 */
function mergeRegistroChamadosServerLocal(serverList, prevLocalList) {
    if (!Array.isArray(serverList)) serverList = [];
    if (!Array.isArray(prevLocalList)) prevLocalList = [];
    var seen = {};
    var i;
    for (i = 0; i < serverList.length; i++) {
        var s = serverList[i];
        if (s && s.id != null && String(s.id).trim() !== '') seen[String(s.id)] = true;
    }
    var out = serverList.slice();
    for (i = 0; i < prevLocalList.length; i++) {
        var p = prevLocalList[i];
        if (!p || p.id == null || String(p.id).trim() === '') continue;
        var pid = String(p.id);
        if (seen[pid]) continue;
        seen[pid] = true;
        out.push(p);
    }
    return dedupeRegistroChamadosPorIsLocal(out);
}

function getChamados() {
    try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw == null) return [];
        var arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return [];
        var d = dedupeRegistroChamadosPorIsLocal(arr);
        if (d.length !== arr.length) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
            } catch (e2) {}
        }
        return d;
    } catch (e) {
        return [];
    }
}

function saveChamados(arr) {
    if (!Array.isArray(arr)) return;
    try {
        arr = dedupeRegistroChamadosPorIsLocal(arr);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {
        console.error('Erro ao salvar chamados:', e);
    }
}

function getLixeira() {
    try {
        var raw = localStorage.getItem(STORAGE_LIXEIRA);
        if (raw == null) return [];
        var arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch (e) {
        return [];
    }
}

function saveLixeira(arr) {
    if (!Array.isArray(arr)) return;
    try {
        localStorage.setItem(STORAGE_LIXEIRA, JSON.stringify(arr));
    } catch (e) {
        console.error('Erro ao salvar lixeira:', e);
    }
}

function purgeLixeiraAntiga() {
    var agora = Date.now();
    var limite = LIXEIRA_DIAS * 24 * 60 * 60 * 1000;
    var arr = getLixeira();
    arr = arr.filter(function (item) {
        if (!item || !item.deletedAt) return false;
        try {
            return (agora - new Date(item.deletedAt).getTime()) < limite;
        } catch (e) {
            return false;
        }
    });
    saveLixeira(arr);
}

function moveParaLixeira(chamado) {
    if (!chamado || typeof chamado !== 'object') return;
    var arr = getLixeira();
    var copy = {};
    try {
        for (var k in chamado) if (Object.prototype.hasOwnProperty.call(chamado, k)) copy[k] = chamado[k];
    } catch (e) { return; }
    copy.deletedAt = new Date().toISOString();
    arr.unshift(copy);
    saveLixeira(arr);
}

function restaurarDaLixeira(id) {
    if (!id) return;
    var lixeira = getLixeira();
    var item = lixeira.filter(function (c) { return c && c.id === id; })[0];
    if (!item) return;
    var chamado = {};
    try {
        for (var k in item) if (Object.prototype.hasOwnProperty.call(item, k) && k !== 'deletedAt') chamado[k] = item[k];
    } catch (e) { return; }
    var chamados = getChamados();
    chamados.unshift(chamado);
    saveChamados(chamados);
    saveLixeira(lixeira.filter(function (c) { return c && c.id !== id; }));
    renderTabela();
    renderLixeira();
}

function apagarDefinitivamente(id) {
    if (!id) return;
    var lixeira = getLixeira().filter(function (c) { return c && c.id !== id; });
    saveLixeira(lixeira);
    renderLixeira();
}

/** null = todos os anos (sem filtro de data na tabela). */
function getAno() {
    var el = document.getElementById('rc-ano');
    if (!el || el.value === '' || el.value == null) return null;
    var n = parseInt(el.value, 10);
    return isNaN(n) ? null : n;
}

/** null = todos os meses do ano escolhido (só faz sentido se getAno() != null). */
function getMes() {
    var el = document.getElementById('rc-mes');
    if (!el || el.disabled || el.value === '' || el.value == null) return null;
    var n = parseInt(el.value, 10);
    return (n >= 1 && n <= 12) ? n : null;
}

function getFiltro() {
    const btn = document.querySelector('.rc-filter-btn.active[data-filter]');
    return (btn && btn.dataset.filter) ? btn.dataset.filter : 'todos';
}

function getSearchText() {
    const el = document.getElementById('rc-search');
    return el ? (el.value || '').trim().toLowerCase() : '';
}

function filtrarChamados(chamados) {
    if (!Array.isArray(chamados)) return [];
    var ano = getAno();
    var mes = getMes();
    var filtro = getFiltro();
    var busca = getSearchText();
    var list = chamados.slice();
    list = list.filter(function (c) { return chamadoCorrespondePeriodo(c, ano, mes); });
    if (filtro !== 'todos') {
        list = list.filter(function (c) { return normalizeChamadoStatus(c.status) === filtro; });
    }
    if (busca) {
        list = list.filter(function (c) {
            var tiposStr = getChamadoTipos(c).map(tipoLabel).join(' ').toLowerCase();
            var mf = getMapeamentoFields(c);
            var st = statusTituloPlanilha(c).toLowerCase();
            var blob = [
                c.chave || '',
                c.observacao || '',
                tiposStr,
                mf.nome,
                mf.usuarioMl,
                mf.bancada,
                mf.email,
                st
            ].join(' ').toLowerCase();
            return blob.indexOf(busca) !== -1;
        });
    }
    list.sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));
    return list;
}

var TIPO_OPCOES = [
    { value: 'manutencao', label: 'Manutenção' },
    { value: 'manutencao-preventiva', label: 'Manutenção Preventiva' },
    { value: 'troca-peca', label: 'Troca de peça' },
    { value: 'limpeza', label: 'Limpeza / Higienização' },
    { value: 'calibracao', label: 'Calibração' },
    { value: 'painel', label: 'Painel / Hardware' },
    { value: 'placa-wireless', label: 'Placa Wireless' },
    { value: 'antena-wireless', label: 'Antena Wireless' },
    { value: 'rebobinador', label: 'Rebobinador' },
    { value: 'peel-off', label: 'Peel Off' },
    { value: 'carcaca', label: 'Carcaça' },
    { value: 'cabeca-impressao', label: 'Cabeça de Impressão' },
    { value: 'rolo-plastico', label: 'Rolo Plástico' },
    { value: 'sensor-midia-peel-off', label: 'Sensor de Mídia (Peel Off)' },
    { value: 'sensor-midia-acessorio', label: 'Sensor de Mídia (Acessório)' },
    { value: 'sensor-midia-painel', label: 'Sensor de Mídia (Painel)' },
    { value: 'placa-mae', label: 'Placa Mãe' },
    { value: 'sistema', label: 'Sistema / Software' }
];

function tipoLabel(tipo) {
    if (!tipo) return '—';
    var opt = TIPO_OPCOES.find(function (o) { return o.value === tipo; });
    return opt ? opt.label : tipo;
}

function getChamadoTipos(chamado) {
    if (chamado.tipos && Array.isArray(chamado.tipos)) return chamado.tipos;
    if (chamado.tipo) return [chamado.tipo];
    return [];
}

function formatarData(iso) {
    if (iso == null || iso === '') return '—';
    try {
        var d = new Date(iso);
        if (isNaN(d.getTime())) return '—';
        var data = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        var hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        return data + ' | ' + hora;
    } catch (e) {
        return '—';
    }
}

/** Data/hora do registro (fuso America/Sao_Paulo) com segundos, sem milissegundos. */
function formatarDataHoraEnvio(iso) {
    if (iso == null || iso === '') return '—';
    try {
        var d = new Date(iso);
        if (isNaN(d.getTime())) return '—';
        var data = d.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: 'America/Sao_Paulo'
        });
        var hora = d.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: 'America/Sao_Paulo'
        });
        return data + ' - ' + hora;
    } catch (e) {
        return '—';
    }
}

function formatarDataDia(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function statusLabel(status) {
    var k = normalizeChamadoStatus(status);
    return RC_STATUS_EXIBICAO[k] || (status || '—');
}

/** Contadores por status (estilo inventário), mesmo critério do gráfico antigo. */
function updateRcStatusCounterCards(listMes) {
    var map = {
        aberto: 'rc-st-aberto',
        'em-andamento': 'rc-st-em',
        pendente: 'rc-st-pendente',
        finalizado: 'rc-st-finalizado'
    };
    for (var k in map) {
        if (!Object.prototype.hasOwnProperty.call(map, k)) continue;
        var n = listMes.filter(function (c) { return normalizeChamadoStatus(c.status) === k; }).length;
        var el = document.getElementById(map[k]);
        if (el) el.textContent = String(n);
    }
}

function renderCharts() {
    var todos = getChamados();
    var ano = getAno();
    var mes = getMes();
    var listMes = listChamadosSomenteMes(todos, ano, mes);
    updateRcStatusCounterCards(listMes);

    var ctxMl = document.getElementById('rc-chart-ml');
    var ctxMes = document.getElementById('rc-chart-mes');

    try {
        if (window.rcChartMl) {
            window.rcChartMl.destroy();
            window.rcChartMl = null;
        }
        if (window.rcChartMes) {
            window.rcChartMes.destroy();
            window.rcChartMes = null;
        }
    } catch (e) {}

    if (typeof Chart === 'undefined') return;

    var statsRowsMes = listMes.filter(incluirNaEstatisticaMapeamento);
    var countMl = {};
    statsRowsMes.forEach(function (c) {
        var mf = getMapeamentoFields(c);
        var ml = mf.usuarioMl ? String(mf.usuarioMl) : '';
        if (!ml) return;
        countMl[ml] = (countMl[ml] || 0) + 1;
    });
    var labelsMl = Object.keys(countMl);
    var valsMl = labelsMl.map(function (k) { return countMl[k]; });
    if (labelsMl.length === 0) {
        labelsMl = ['Sem dados no período'];
        valsMl = [0];
    }
    var coresPal = ['#007aff', '#34c759', '#ff9500', '#af52de', '#ff2d55', '#5ac8fa', '#8e8e93', '#5856d6'];
    var bgMl = labelsMl.map(function (_, i) { return coresPal[i % coresPal.length]; });
    if (ctxMl) {
        try {
            window.rcChartMl = new Chart(ctxMl, {
                type: 'doughnut',
                data: {
                    labels: labelsMl,
                    datasets: [{
                        data: valsMl,
                        backgroundColor: bgMl,
                        borderWidth: 2,
                        hoverOffset: 6
                    }]
                },
                options: {
                    animation: false,
                    responsive: true,
                    maintainAspectRatio: true,
                    cutout: '52%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            align: 'center',
                            labels: { padding: 12, boxWidth: 11, usePointStyle: true, font: { size: 10 } }
                        }
                    }
                }
            });
        } catch (e1) { console.error('Chart ML:', e1); }
    }

    var mesesAbr = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    var todosMap = todos.filter(incluirNaEstatisticaMapeamento);
    var now = new Date();
    var mesLabels = [];
    var mesCounts = [];
    var anoGraf = getAno();
    if (anoGraf == null) {
        for (var i = 11; i >= 0; i--) {
            var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            var y = d.getFullYear();
            var mo = d.getMonth() + 1;
            mesLabels.push(mesesAbr[d.getMonth()] + '/' + String(y).slice(-2));
            var idx = mesCounts.push(0) - 1;
            todosMap.forEach(function (c) {
                if (!c.data) return;
                var dt = new Date(c.data);
                if (dt.getFullYear() === y && (dt.getMonth() + 1) === mo) mesCounts[idx]++;
            });
        }
    } else {
        for (var mo2 = 1; mo2 <= 12; mo2++) {
            mesLabels.push(mesesAbr[mo2 - 1] + '/' + String(anoGraf).slice(-2));
            var idx2 = mesCounts.push(0) - 1;
            todosMap.forEach(function (c) {
                if (!c.data) return;
                var dt = new Date(c.data);
                if (dt.getFullYear() === anoGraf && (dt.getMonth() + 1) === mo2) mesCounts[idx2]++;
            });
        }
    }
    if (ctxMes) {
        try {
            window.rcChartMes = new Chart(ctxMes, {
                type: 'bar',
                data: {
                    labels: mesLabels,
                    datasets: [{
                        label: 'Inseridos',
                        data: mesCounts,
                        backgroundColor: 'rgba(0, 122, 255, 0.78)',
                        borderColor: 'rgba(0, 61, 128, 0.9)',
                        borderWidth: 1,
                        borderRadius: 8,
                        borderSkipped: false
                    }]
                },
                options: {
                    animation: false,
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1, font: { size: 10 } },
                            grid: { color: 'rgba(0,0,0,0.06)' }
                        },
                        x: {
                            ticks: { font: { size: 9 }, maxRotation: 40 },
                            grid: { display: false }
                        }
                    }
                }
            });
        } catch (e3) { console.error('Chart mês:', e3); }
    }
}

function renderTabela() {
    var tbody = document.getElementById('rc-tbody');
    if (!tbody) {
        purgeLixeiraAntiga();
        renderCharts();
        return;
    }

    purgeLixeiraAntiga();

    var todos = getChamados();
    var list = filtrarChamados(todos);

    renderCharts();

    var tableWrap = document.querySelector('.rc-table-wrap');
    if (list.length === 0) {
        tbody.innerHTML =
            '<tr class="rc-table-empty-row">' +
            '<td colspan="7" class="rc-table-empty-cell">' +
            '<div class="rc-empty-icon" aria-hidden="true"><i class="fas fa-print"></i></div>' +
            '<h4 class="rc-empty-title">Nenhum chamado de mapeamento</h4>' +
            '<p class="rc-empty-desc">Não há chamados com os filtros atuais. Em <strong>Período</strong>, use <strong>Todos os anos</strong> para ver todos os registos; escolha um <strong>ano</strong> para filtrar esse ano inteiro ou também um <strong>mês</strong> para afunilar. Ajuste status ou pesquisa, ou envie registo pelo <strong>Sauron</strong> / <strong>Administração</strong> (planilha).</p>' +
            '</td></tr>';
        if (tableWrap) tableWrap.style.display = 'block';
        return;
    }
    if (tableWrap) tableWrap.style.display = 'block';

    var html = '';
    list.forEach(function (c) {
        var mf = getMapeamentoFields(c);
        var nomeC = mf.nome ? escapeHtml(mf.nome) : '—';
        var mlC = mf.usuarioMl ? escapeHtml(mf.usuarioMl) : '—';
        var emC = mf.email ? escapeHtml(mf.email) : '—';
        var banC = mf.bancada ? escapeHtml(mf.bancada) : '—';
        var quando = formatarDataHoraEnvio(c.data);
        var stTit = escapeHtml(statusTituloPlanilha(c));
        var stCls = statusPillClassForChamado(c);
        html += '<tr data-id="' + escapeHtml(c.id || '') + '">' +
            '<td>' + nomeC + '</td>' +
            '<td>' + mlC + '</td>' +
            '<td class="rc-td-email">' + emC + '</td>' +
            '<td>' + banC + '</td>' +
            '<td><strong>' + escapeHtml(c.chave || '—') + '</strong></td>' +
            '<td class="rc-td-datetime" title="' + escapeHtml(String(c.data || '')) + '">' + escapeHtml(quando) + '</td>' +
            '<td class="rc-td-status"><span class="' + escapeHtml(stCls) + '">' + stTit + '</span></td>' +
            '</tr>';
    });
    tbody.innerHTML = html;
}

function openModalObs(observacao) {
    var overlay = document.getElementById('rc-modal-obs-overlay');
    var content = document.getElementById('rc-modal-obs-content');
    var closeBtn = document.getElementById('rc-modal-obs-close');
    if (!overlay || !content) return;
    content.textContent = observacao || '—';
    overlay.style.display = 'flex';
    if (closeBtn) closeBtn.onclick = function () { overlay.style.display = 'none'; };
    overlay.onclick = function (e) {
        if (e.target === overlay) overlay.style.display = 'none';
    };
}

function openModalDelete(id, chamado) {
    const overlay = document.getElementById('rc-modal-delete-overlay');
    const cancel = document.getElementById('rc-modal-delete-cancel');
    const confirm = document.getElementById('rc-modal-delete-confirm');
    if (!overlay || !confirm) return;
    overlay.style.display = 'flex';
    confirm.onclick = function () {
        const arr = getChamados().filter(c => c.id !== id);
        moveParaLixeira(chamado);
        saveChamados(arr);
        overlay.style.display = 'none';
        renderTabela();
    };
    cancel.onclick = function () {
        overlay.style.display = 'none';
    };
    overlay.onclick = function (e) {
        if (e.target === overlay) overlay.style.display = 'none';
    };
}

function openModalEdit(id) {
    if (!id) return;
    var chamados = getChamados();
    var chamado = null;
    for (var i = 0; i < chamados.length; i++) { if (chamados[i] && chamados[i].id === id) { chamado = chamados[i]; break; } }
    if (!chamado) return;
    var overlay = document.getElementById('rc-modal-edit-overlay');
    var form = document.getElementById('rc-form-edit');
    var editId = document.getElementById('rc-edit-id');
    var editChave = document.getElementById('rc-edit-chave');
    var editStatus = document.getElementById('rc-edit-status');
    var editObs = document.getElementById('rc-edit-obs');
    var editCancel = document.getElementById('rc-modal-edit-cancel');
    if (!overlay || !form || !editId || !editChave || !editStatus || !editObs) return;
    editId.value = id;
    editChave.value = chamado.chave || '';
    editStatus.value = chamado.status || '';
    editObs.value = chamado.observacao || '';
    setTiposSelecionados('edit', getChamadoTipos(chamado));
    syncGlassSelect('rc-edit-status');
    overlay.style.display = 'flex';
    if (editCancel) editCancel.onclick = function () { overlay.style.display = 'none'; };
    overlay.onclick = function (e) {
        if (e.target === overlay) overlay.style.display = 'none';
    };
    form.onsubmit = function (e) {
        e.preventDefault();
        var chave = (document.getElementById('rc-edit-chave') && document.getElementById('rc-edit-chave').value || '').trim();
        var status = document.getElementById('rc-edit-status') && document.getElementById('rc-edit-status').value;
        var tipos = getTiposSelecionados('edit');
        var observacao = (document.getElementById('rc-edit-obs') && document.getElementById('rc-edit-obs').value || '').trim();
        if (!chave || !status) return;
        var arr = getChamados();
        var idx = -1;
        for (var j = 0; j < arr.length; j++) { if (arr[j] && arr[j].id === id) { idx = j; break; } }
        if (idx === -1) return;
        var prev = arr[idx];
        arr[idx] = Object.assign({}, prev, { chave: chave, status: status, tipos: tipos, observacao: observacao });
        saveChamados(arr);
        overlay.style.display = 'none';
        renderTabela();
    };
}

function openModalLixeira() {
    const overlay = document.getElementById('rc-modal-lixeira-overlay');
    const listEl = document.getElementById('rc-lixeira-list');
    const closeBtn = document.getElementById('rc-modal-lixeira-close');
    if (!overlay || !listEl) return;
    renderLixeira();
    overlay.style.display = 'flex';
    closeBtn.onclick = function () {
        overlay.style.display = 'none';
    };
    overlay.onclick = function (e) {
        if (e.target === overlay) overlay.style.display = 'none';
    };
}

function renderLixeira() {
    const listEl = document.getElementById('rc-lixeira-list');
    if (!listEl) return;
    purgeLixeiraAntiga();
    const lixeira = getLixeira();
    if (lixeira.length === 0) {
        listEl.innerHTML = '<div class="rc-lixeira-empty">Nenhum item na lixeira. Itens excluídos são removidos após 30 dias.</div>';
        return;
    }
    listEl.innerHTML = lixeira.map(item => {
        const deleted = formatarData(item.deletedAt);
        const expira = new Date(item.deletedAt);
        expira.setDate(expira.getDate() + LIXEIRA_DIAS);
        return `
            <div class="rc-lixeira-item" data-id="${item.id}">
                <div class="rc-lixeira-item-info">
                    <strong>${escapeHtml(item.chave || '—')}</strong>
                    <span>${statusLabel(item.status)} · Excluído em ${deleted} · Expira em ${formatarData(expira.toISOString())}</span>
                </div>
                <div class="rc-lixeira-item-actions">
                    <button type="button" class="rc-lixeira-item-btn" data-id="${item.id}" title="Restaurar"><i class="fas fa-undo"></i> Restaurar</button>
                    <button type="button" class="rc-lixeira-item-btn-delete" data-id="${item.id}" title="Apagar definitivamente"><i class="fas fa-trash-alt"></i> Apagar definitivamente</button>
                </div>
            </div>
        `;
    }).join('');
    listEl.querySelectorAll('.rc-lixeira-item-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            restaurarDaLixeira(this.dataset.id);
        });
    });
    listEl.querySelectorAll('.rc-lixeira-item-btn-delete').forEach(btn => {
        btn.addEventListener('click', function () {
            apagarDefinitivamente(this.dataset.id);
        });
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getExportData() {
    var list = filtrarChamados(getChamados());
    if (!Array.isArray(list) || list.length === 0) return null;
    var headers = [
        'Nome completo',
        'Usuário Mercado Livre',
        'E-mail corporativo',
        'Bancada',
        'IS do chamado',
        'Data e hora do envio',
        'Status',
        'Unidade'
    ];
    var rows = list.map(function (c) {
        var mf = getMapeamentoFields(c);
        var unidade = c.mapeamento && c.mapeamento.unidade ? String(c.mapeamento.unidade) : '';
        return [
            mf.nome || '',
            mf.usuarioMl || '',
            mf.email || '',
            mf.bancada || '',
            c.chave || '',
            formatarDataHoraEnvio(c.data),
            statusTituloPlanilha(c),
            unidade
        ];
    });
    return { headers: headers, rows: rows, list: list };
}

function exportCSV() {
    const data = getExportData();
    if (!data) {
        showInfoModal('Nenhum registro', 'Nenhum registro para exportar.');
        return;
    }
    const csv = [data.headers.join(';'), ...data.rows.map(r => r.map(c => `"${c}"`).join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'registro_chamados_' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
}

function exportExcel() {
    const data = getExportData();
    if (!data) {
        showInfoModal('Nenhum registro', 'Nenhum registro para exportar.');
        return;
    }
    const csv = [data.headers.join(';'), ...data.rows.map(r => r.map(c => `"${c}"`).join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'registro_chamados_' + new Date().toISOString().slice(0, 10) + '.xls';
    a.click();
    URL.revokeObjectURL(url);
}

function showInfoModal(title, text) {
    const overlay = document.getElementById('rc-modal-info-overlay');
    const titleEl = document.getElementById('rc-modal-info-title');
    const textEl = document.getElementById('rc-modal-info-text');
    const okBtn = document.getElementById('rc-modal-info-ok');
    if (!overlay || !titleEl || !textEl || !okBtn) return;
    titleEl.textContent = title;
    textEl.textContent = text;
    overlay.style.display = 'flex';
    okBtn.onclick = function () {
        overlay.style.display = 'none';
    };
    overlay.onclick = function (e) {
        if (e.target === overlay) overlay.style.display = 'none';
    };
}

function exportGooglePlanilhas() {
    const data = getExportData();
    if (!data) {
        showInfoModal('Nenhum registro', 'Nenhum registro para exportar.');
        return;
    }
    const csv = [data.headers.join(';'), ...data.rows.map(r => r.map(c => `"${c}"`).join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'registro_chamados_google_' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(function () {
        showInfoModal(
            'Arquivo baixado',
            'Arquivo CSV baixado. Para importar no Google Planilhas: Arquivo > Importar > Fazer upload do arquivo.'
        );
    }, 300);
}

function exportPDF() {
    const data = getExportData();
    if (!data) {
        showInfoModal('Nenhum registro', 'Nenhum registro para exportar.');
        return;
    }
    if (typeof window.jspdf === 'undefined') {
        showInfoModal('PDF indisponível', 'Biblioteca de PDF não carregada. Recarregue a página.');
        return;
    }
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        doc.setFontSize(14);
        doc.text('Mapeamento de Chamados de Impressoras · UNIDADE BRSC02', 14, 12);
        doc.setFontSize(10);
        doc.autoTable({
            head: [data.headers],
            body: data.rows,
            startY: 18,
            styles: { fontSize: 5.5 },
            headStyles: { fillColor: [0, 122, 255] }
        });
        doc.save('registro_chamados_' + new Date().toISOString().slice(0, 10) + '.pdf');
    } catch (e) {
        console.error(e);
        showInfoModal('Erro ao gerar PDF', 'Tente exportar em CSV.');
    }
}

function toggleExportDropdown() {
    const dd = document.getElementById('rc-export-dropdown');
    if (!dd) return;
    dd.classList.toggle('open');
}

function closeExportDropdown() {
    const dd = document.getElementById('rc-export-dropdown');
    if (dd) dd.classList.remove('open');
}

function togglePeriodDropdown() {
    const dd = document.getElementById('rc-period-dropdown');
    if (!dd) return;
    dd.classList.toggle('open');
    closeExportDropdown();
}

function closePeriodDropdown() {
    const dd = document.getElementById('rc-period-dropdown');
    if (dd) dd.classList.remove('open');
}

var MESES_NOME = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

/** Com "Todos os anos", o mês fica bloqueado (valor = todos). */
function updateRcPeriodMesLock() {
    var anoEl = document.getElementById('rc-ano');
    var mesEl = document.getElementById('rc-mes');
    var mesWrap = document.getElementById('rc-period-mes-glass');
    if (!anoEl || !mesEl) return;
    var todosAnos = anoEl.value === '';
    var mesTrigger = mesWrap ? mesWrap.querySelector('.rc-select-glass-trigger') : null;
    var mesDd = mesWrap ? mesWrap.querySelector('.rc-select-glass-dropdown') : null;
    if (todosAnos) {
        mesEl.value = '';
        mesEl.disabled = true;
        if (mesTrigger) {
            mesTrigger.disabled = true;
            mesTrigger.setAttribute('aria-disabled', 'true');
        }
        if (mesDd) {
            mesDd.classList.remove('open');
            if (mesTrigger) mesTrigger.setAttribute('aria-expanded', 'false');
        }
        if (mesWrap) mesWrap.classList.add('rc-period-mes--locked');
    } else {
        mesEl.disabled = false;
        if (mesTrigger) {
            mesTrigger.disabled = false;
            mesTrigger.removeAttribute('aria-disabled');
        }
        if (mesWrap) mesWrap.classList.remove('rc-period-mes--locked');
    }
    try {
        syncGlassSelect('rc-mes');
    } catch (eL) {}
}

function setupGlassSelects() {
    document.querySelectorAll('.rc-select-glass').forEach(function (wrap) {
        if (wrap.getAttribute('data-rc-glass-bound') === '1') return;
        var select = wrap.querySelector('.rc-select-native');
        var trigger = wrap.querySelector('.rc-select-glass-trigger');
        var dropdown = wrap.querySelector('.rc-select-glass-dropdown');
        var valueSpan = wrap.querySelector('.rc-select-glass-value');
        if (!select || !trigger || !dropdown || !valueSpan) return;
        wrap.setAttribute('data-rc-glass-bound', '1');

        function getSelectedText() {
            var opt = select.options[select.selectedIndex];
            return opt ? opt.textContent : '';
        }
        function updateTrigger() {
            valueSpan.textContent = getSelectedText();
            valueSpan.classList.toggle('rc-select-glass-placeholder', select.value === '');
            dropdown.querySelectorAll('.rc-select-glass-option').forEach(function (el) {
                el.classList.toggle('selected', el.dataset.value === select.value);
            });
        }
        function closeDropdown() {
            trigger.setAttribute('aria-expanded', 'false');
            dropdown.classList.remove('open');
        }

        dropdown.innerHTML = '';
        for (var i = 0; i < select.options.length; i++) {
            var opt = select.options[i];
            var div = document.createElement('div');
            div.className = 'rc-select-glass-option' + (opt.value === select.value ? ' selected' : '');
            div.setAttribute('role', 'option');
            div.dataset.value = opt.value;
            div.textContent = opt.textContent;
            div.addEventListener('click', function () {
                select.value = this.dataset.value;
                updateTrigger();
                closeDropdown();
                select.dispatchEvent(new Event('change', { bubbles: true }));
            });
            dropdown.appendChild(div);
        }
        updateTrigger();

        trigger.addEventListener('click', function (e) {
            e.stopPropagation();
            if (trigger.disabled || select.disabled) return;
            var isOpen = dropdown.classList.toggle('open');
            trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            document.querySelectorAll('.rc-select-glass-dropdown.open').forEach(function (d) {
                if (d !== dropdown) {
                    d.classList.remove('open');
                    var t = d.closest('.rc-select-glass').querySelector('.rc-select-glass-trigger');
                    if (t) t.setAttribute('aria-expanded', 'false');
                }
            });
        });
        dropdown.addEventListener('click', function (e) {
            e.stopPropagation();
        });
    });
    document.addEventListener('click', function () {
        document.querySelectorAll('.rc-select-glass-dropdown.open').forEach(function (d) {
            d.classList.remove('open');
            var t = d.closest('.rc-select-glass').querySelector('.rc-select-glass-trigger');
            if (t) t.setAttribute('aria-expanded', 'false');
        });
    });
}

function syncGlassSelect(selectId) {
    var wrap = document.querySelector('.rc-select-glass[data-select-id="' + selectId + '"]');
    if (!wrap) return;
    var select = wrap.querySelector('.rc-select-native');
    var valueSpan = wrap.querySelector('.rc-select-glass-value');
    if (!select || !valueSpan) return;
    var opt = select.options[select.selectedIndex];
    valueSpan.textContent = opt ? opt.textContent : '';
    valueSpan.classList.toggle('rc-select-glass-placeholder', select.value === '');
    wrap.querySelectorAll('.rc-select-glass-option').forEach(function (el) {
        el.classList.toggle('selected', el.dataset.value === select.value);
    });
}

function renderTipoTags(selectedValues, containerId, inputId) {
    var container = document.getElementById(containerId);
    var inputEl = document.getElementById(inputId);
    if (!container || !inputEl) return;
    try {
        var arr = Array.isArray(selectedValues) ? selectedValues : (selectedValues ? [selectedValues] : []);
    } catch (e) {
        arr = [];
    }
    inputEl.value = JSON.stringify(arr);
    var content = container.closest('.rc-tipo-tags-trigger-content');
    if (content) {
        var ph = content.querySelector('.rc-tipo-tags-placeholder');
        if (ph) ph.style.display = arr.length ? 'none' : 'block';
    }
    container.style.display = arr.length ? 'flex' : 'none';
    container.innerHTML = arr.map(function (value) {
        var label = tipoLabel(value);
        return '<span class="rc-tipo-tag" data-value="' + escapeHtml(value) + '">' + escapeHtml(label) + '<i class="fas fa-times rc-tipo-tag-remove" aria-label="Remover"></i></span>';
    }).join('');
    container.querySelectorAll('.rc-tipo-tag-remove').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var tag = this.closest('.rc-tipo-tag');
            var value = tag && tag.dataset.value;
            if (!value) return;
            var arr = JSON.parse(inputEl.value || '[]');
            arr = arr.filter(function (v) { return v !== value; });
            inputEl.value = JSON.stringify(arr);
            renderTipoTags(arr, containerId, inputId);
        });
    });
}

function openTipoTagsDropdown(which, forceClose) {
    var prefix = which === 'edit' ? 'rc-edit' : 'rc';
    var trigger = document.getElementById(prefix + '-tipo-tags-trigger');
    var dropdown = document.getElementById(prefix + '-tipo-tags-dropdown');
    if (!trigger || !dropdown) return;
    var isOpen = dropdown.classList.contains('open');
    if (forceClose) {
        dropdown.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
        return;
    }
    if (isOpen) {
        dropdown.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
    } else {
        dropdown.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
    }
}

function initTipoTags(which) {
    var prefix = which === 'edit' ? 'rc-edit' : 'rc';
    var field = document.getElementById(prefix + '-tipo-tags-field');
    var selectedContainer = document.getElementById(prefix + '-tipo-tags-selected');
    var trigger = document.getElementById(prefix + '-tipo-tags-trigger');
    var dropdown = document.getElementById(prefix + '-tipo-tags-dropdown');
    var inputId = prefix + '-tipos-json';
    var inputEl = document.getElementById(inputId);
    if (!field || !selectedContainer || !trigger || !dropdown || !inputEl) return;

    dropdown.innerHTML = TIPO_OPCOES.map(function (o) {
        return '<div class="rc-tipo-tags-option" data-value="' + escapeHtml(o.value) + '" role="option">' + escapeHtml(o.label) + '</div>';
    }).join('');

    dropdown.querySelectorAll('.rc-tipo-tags-option').forEach(function (opt) {
        opt.addEventListener('click', function () {
            var value = this.dataset.value;
            if (!value) return;
            var arr = [];
            try {
                arr = JSON.parse(inputEl.value || '[]');
            } catch (e) {}
            var idx = arr.indexOf(value);
            if (idx === -1) arr.push(value);
            else arr.splice(idx, 1);
            inputEl.value = JSON.stringify(arr);
            renderTipoTags(arr, prefix + '-tipo-tags-selected', inputId);
            this.classList.toggle('selected', arr.indexOf(value) !== -1);
        });
    });

    trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        openTipoTagsDropdown(which, false);
        var arr = getTiposSelecionados(which);
        dropdown.querySelectorAll('.rc-tipo-tags-option').forEach(function (opt) {
            opt.classList.toggle('selected', arr.indexOf(opt.dataset.value) !== -1);
        });
    });

    dropdown.addEventListener('click', function (e) {
        e.stopPropagation();
    });

    document.addEventListener('click', function closeTipoTags(e) {
        if (!field.contains(e.target)) {
            dropdown.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
        }
    });
}

function getTiposSelecionados(which) {
    var prefix = which === 'edit' ? 'rc-edit' : 'rc';
    var inputEl = document.getElementById(prefix + '-tipos-json');
    if (!inputEl) return [];
    try {
        var arr = JSON.parse(inputEl.value || '[]');
        return Array.isArray(arr) ? arr : [];
    } catch (e) {
        return [];
    }
}

function setTiposSelecionados(which, arr) {
    var prefix = which === 'edit' ? 'rc-edit' : 'rc';
    var containerId = prefix + '-tipo-tags-selected';
    var inputId = prefix + '-tipos-json';
    renderTipoTags(Array.isArray(arr) ? arr : [], containerId, inputId);
    var dropdown = document.getElementById(prefix + '-tipo-tags-dropdown');
    if (dropdown) {
        dropdown.querySelectorAll('.rc-tipo-tags-option').forEach(function (opt) {
            opt.classList.toggle('selected', (arr || []).indexOf(opt.dataset.value) !== -1);
        });
    }
}

function populateAnoMes() {
    var anoEl = document.getElementById('rc-ano');
    var mesEl = document.getElementById('rc-mes');
    if (!anoEl || !mesEl) return;
    var anoAtual = new Date().getFullYear();
    var anoMinNosDados = anoAtual;
    try {
        var todos = getChamados();
        if (Array.isArray(todos)) {
            todos.forEach(function (c) {
                if (!c || !c.data) return;
                var d = new Date(c.data);
                if (isNaN(d.getTime())) return;
                var y = d.getFullYear();
                if (y < anoMinNosDados) anoMinNosDados = y;
            });
        }
    } catch (e0) {}
    var anosMinimosNaLista = 5;
    var anoInicio = Math.min(anoMinNosDados, anoAtual - (anosMinimosNaLista - 1));
    if (anoInicio > anoAtual) anoInicio = anoAtual;
    anoEl.innerHTML = '';
    var optAnoTodos = document.createElement('option');
    optAnoTodos.value = '';
    optAnoTodos.textContent = 'Todos os anos';
    optAnoTodos.selected = true;
    anoEl.appendChild(optAnoTodos);
    for (var a = anoAtual; a >= anoInicio; a--) {
        var opt = document.createElement('option');
        opt.value = a;
        opt.textContent = a;
        anoEl.appendChild(opt);
    }
    mesEl.innerHTML = '';
    var optMesTodos = document.createElement('option');
    optMesTodos.value = '';
    optMesTodos.textContent = 'Todos os meses';
    optMesTodos.selected = true;
    mesEl.appendChild(optMesTodos);
    for (var m = 1; m <= 12; m++) {
        var optM = document.createElement('option');
        optM.value = m;
        optM.textContent = MESES_NOME[m - 1];
        mesEl.appendChild(optM);
    }
    updateRcPeriodMesLock();
}

var RC_THEME_KEY = 'axis_registro_chamados_theme';

function getRcTheme() {
    try {
        return localStorage.getItem(RC_THEME_KEY) || 'light';
    } catch (e) {
        return 'light';
    }
}

function setRcTheme(theme) {
    theme = theme === 'dark' ? 'dark' : 'light';
    try {
        localStorage.setItem(RC_THEME_KEY, theme);
    } catch (e) {}
    document.documentElement.setAttribute('data-theme', theme);
    var btn = document.getElementById('rc-theme-toggle');
    if (btn) {
        var icon = btn.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        btn.setAttribute('title', theme === 'dark' ? 'Modo escuro (clique para claro)' : 'Modo claro (clique para escuro)');
    }
}

function syncFromServer() {
    var base = window.location.origin || '';
    fetch(base + '/api/registro-chamados')
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
            if (!j || !j.ok || !Array.isArray(j.chamados)) return;
            var prev = [];
            try {
                var raw = localStorage.getItem(STORAGE_KEY);
                if (raw) {
                    var parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) prev = parsed;
                }
            } catch (e1) { prev = []; }
            var merged = mergeRegistroChamadosServerLocal(j.chamados, prev);
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
                renderTabela();
            } catch (e) {}
        })
        .catch(function () {});
}

/**
 * Wizard de mapeamento BRSC02. `ns` = prefixo de ids, ex.: 'rc-map-' (Sauron) ou 'admin-rc-map-' (página admin).
 * Nomes dos radios: ns + 'nome' | 'ml' | 'email' (ex.: admin-rc-map-nome).
 */
function initMapeamentoWizard(ns) {
    ns = ns || 'rc-map-';
    var root = document.getElementById(ns + 'wizard');
    if (!root) return;
    if (root._rcMapWizardInited) return;
    root._rcMapWizardInited = true;

    var maxStep = (ns === 'admin-rc-map-') ? 6 : 5;

    function pad2(n) {
        return (n < 10 ? '0' : '') + n;
    }

    function normalizeChaveIsBrsc(v) {
        var raw = String(v || '').trim();
        var num = raw.replace(/^IS-/i, '').trim();
        if (!num) return '';
        return 'IS-' + num;
    }

    function fillTimeSelect(suffix, maxVal) {
        var sel = document.getElementById(ns + suffix);
        if (!sel || sel.options.length > 0) return;
        var i;
        for (i = 0; i <= maxVal; i++) {
            var o = document.createElement('option');
            o.value = String(i);
            o.textContent = pad2(i);
            sel.appendChild(o);
        }
    }

    if (maxStep === 6) {
        fillTimeSelect('hh', 23);
        fillTimeSelect('mm', 59);
        fillTimeSelect('ss', 59);
    }

    var nameNome = ns + 'nome';
    var nameMl = ns + 'ml';
    var nameEmail = ns + 'email';

    var nomesEl = document.getElementById(ns + 'nomes-list');
    var mlEl = document.getElementById(ns + 'ml-list');
    var emailsEl = document.getElementById(ns + 'emails-list');

    function syncTodosPeloIndice(i) {
        if (i < 0 || i >= MAPEAMENTO_PESSOAS.length) return;
        var n = document.getElementById(ns + 'nome-' + i);
        var m = document.getElementById(ns + 'ml-' + i);
        var e = document.getElementById(ns + 'email-' + i);
        if (n) n.checked = true;
        if (m) m.checked = true;
        if (e) e.checked = true;
    }

    if (nomesEl && nomesEl.children.length === 0) {
        MAPEAMENTO_PESSOAS.forEach(function (p, i) {
            var id = ns + 'nome-' + i;
            var lab = document.createElement('label');
            lab.className = 'rc-map-radio-item';
            var inp = document.createElement('input');
            inp.type = 'radio';
            inp.name = nameNome;
            inp.value = p.nome;
            inp.id = id;
            var sp = document.createElement('span');
            sp.textContent = p.nome;
            lab.appendChild(inp);
            lab.appendChild(sp);
            nomesEl.appendChild(lab);
        });
    }
    if (mlEl && mlEl.children.length === 0) {
        MAPEAMENTO_PESSOAS.forEach(function (p, i) {
            var id = ns + 'ml-' + i;
            var lab = document.createElement('label');
            lab.className = 'rc-map-radio-item';
            var inp = document.createElement('input');
            inp.type = 'radio';
            inp.name = nameMl;
            inp.value = p.usuarioMl;
            inp.id = id;
            var sp = document.createElement('span');
            sp.textContent = p.usuarioMl;
            lab.appendChild(inp);
            lab.appendChild(sp);
            mlEl.appendChild(lab);
        });
    }
    if (emailsEl && emailsEl.children.length === 0) {
        MAPEAMENTO_PESSOAS.forEach(function (p, i) {
            var id = ns + 'email-' + i;
            var lab = document.createElement('label');
            lab.className = 'rc-map-radio-item rc-map-radio-item-email';
            var inp = document.createElement('input');
            inp.type = 'radio';
            inp.name = nameEmail;
            inp.value = p.email;
            inp.id = id;
            var sp = document.createElement('span');
            sp.className = 'rc-map-email-span';
            sp.textContent = p.email;
            lab.appendChild(inp);
            lab.appendChild(sp);
            emailsEl.appendChild(lab);
        });
    }

    if (nomesEl && !nomesEl._rcMapSync) {
        nomesEl._rcMapSync = true;
        nomesEl.addEventListener('change', function (e) {
            var t = e.target;
            if (!t || t.name !== nameNome) return;
            var i = MAPEAMENTO_PESSOAS.findIndex(function (p) { return p.nome === t.value; });
            syncTodosPeloIndice(i);
        });
    }
    if (mlEl && !mlEl._rcMapSync) {
        mlEl._rcMapSync = true;
        mlEl.addEventListener('change', function (e) {
            var t = e.target;
            if (!t || t.name !== nameMl) return;
            var i = MAPEAMENTO_PESSOAS.findIndex(function (p) { return p.usuarioMl === t.value; });
            syncTodosPeloIndice(i);
        });
    }
    if (emailsEl && !emailsEl._rcMapSync) {
        emailsEl._rcMapSync = true;
        emailsEl.addEventListener('change', function (e) {
            var t = e.target;
            if (!t || t.name !== nameEmail) return;
            var i = MAPEAMENTO_PESSOAS.findIndex(function (p) { return p.email === t.value; });
            syncTodosPeloIndice(i);
        });
    }

    var step = 1;
    var stepNumEl = document.getElementById(ns + 'step-num');
    var btnBack = document.getElementById(ns + 'back');
    var btnNext = document.getElementById(ns + 'next');
    var btnSubmit = document.getElementById(ns + 'submit');
    var fb = document.getElementById(ns + 'feedback');

    function showStep(n) {
        step = n;
        var s;
        for (s = 1; s <= maxStep; s++) {
            var el = document.getElementById(ns + 'step-' + s);
            if (el) el.hidden = s !== n;
        }
        if (stepNumEl) stepNumEl.textContent = String(n);
        var totalEl = document.getElementById(ns + 'step-total');
        if (totalEl) totalEl.textContent = String(maxStep);
        if (btnBack) btnBack.hidden = n <= 1;
        if (btnNext) btnNext.hidden = n >= maxStep;
        if (btnSubmit) btnSubmit.hidden = n < maxStep;
        if (fb) {
            fb.textContent = '';
            fb.className = 'rc-map-feedback';
        }
        if (n === 6) {
            try {
                root.dispatchEvent(new CustomEvent('rc-map-admin-step6-open', { bubbles: true }));
            } catch (eEv) {}
        }
    }

    function validateCurrentStep() {
        if (!fb) return true;
        fb.textContent = '';
        fb.className = 'rc-map-feedback';
        if (step === 1) {
            if (!root.querySelector('input[name="' + nameNome + '"]:checked')) {
                fb.textContent = 'Selecione o nome completo.';
                fb.classList.add('rc-map-err');
                return false;
            }
        }
        if (step === 2) {
            if (!root.querySelector('input[name="' + nameMl + '"]:checked')) {
                fb.textContent = 'Selecione o usuário Mercado Livre.';
                fb.classList.add('rc-map-err');
                return false;
            }
        }
        if (step === 3) {
            if (!root.querySelector('input[name="' + nameEmail + '"]:checked')) {
                fb.textContent = 'Selecione o e-mail corporativo.';
                fb.classList.add('rc-map-err');
                return false;
            }
        }
        if (step === 4) {
            var bEl = document.getElementById(ns + 'bancada');
            var b = (bEl && bEl.value || '').trim();
            if (!b) {
                fb.textContent = 'Informe o número da bancada.';
                fb.classList.add('rc-map-err');
                return false;
            }
        }
        if (step === 5 && maxStep === 6) {
            var isEl5 = document.getElementById(ns + 'is');
            var ch5 = normalizeChaveIsBrsc(isEl5 && isEl5.value != null ? isEl5.value : '');
            if (isEl5) isEl5.value = ch5 || 'IS-';
            if (!ch5) {
                fb.textContent = 'Informe o número do IS após IS-.';
                fb.classList.add('rc-map-err');
                return false;
            }
        }
        return true;
    }

    function resetWizardForm() {
        root.querySelectorAll('input[name="' + nameNome + '"]').forEach(function (r) { r.checked = false; });
        root.querySelectorAll('input[name="' + nameMl + '"]').forEach(function (r) { r.checked = false; });
        root.querySelectorAll('input[name="' + nameEmail + '"]').forEach(function (r) { r.checked = false; });
        var b = document.getElementById(ns + 'bancada');
        var is = document.getElementById(ns + 'is');
        if (b) b.value = '';
        if (is) is.value = 'IS-';
        if (maxStep === 6) {
            var dEl = document.getElementById(ns + 'data');
            if (dEl) dEl.value = '';
            var hhEl = document.getElementById(ns + 'hh');
            var mmEl = document.getElementById(ns + 'mm');
            var ssEl = document.getElementById(ns + 'ss');
            if (hhEl) hhEl.selectedIndex = 0;
            if (mmEl) mmEl.selectedIndex = 0;
            if (ssEl) ssEl.selectedIndex = 0;
            var rs = document.getElementById(ns + 'reg-status');
            if (rs) rs.value = '';
            try {
                root.dispatchEvent(new CustomEvent('rc-map-admin-step6-reset', { bubbles: true }));
            } catch (eR) {}
        }
    }

    if (btnNext) {
        btnNext.addEventListener('click', function () {
            if (step >= maxStep) return;
            if (!validateCurrentStep()) return;
            showStep(step + 1);
        });
    }
    if (btnBack) {
        btnBack.addEventListener('click', function () {
            if (step > 1) showStep(step - 1);
        });
    }
    if (btnSubmit) {
        btnSubmit.addEventListener('click', function () {
            var isEl = document.getElementById(ns + 'is');
            var chave = normalizeChaveIsBrsc(isEl && isEl.value != null ? isEl.value : '');
            if (isEl) isEl.value = chave || 'IS-';
            if (!chave) {
                if (fb) {
                    fb.textContent = 'Informe o número do IS após IS-.';
                    fb.className = 'rc-map-feedback rc-map-err';
                }
                showStep(maxStep === 6 ? 5 : 1);
                return;
            }
            var nomeR = root.querySelector('input[name="' + nameNome + '"]:checked');
            var mlR = root.querySelector('input[name="' + nameMl + '"]:checked');
            var emailR = root.querySelector('input[name="' + nameEmail + '"]:checked');
            var bancadaEl = document.getElementById(ns + 'bancada');
            var bancada = (bancadaEl && bancadaEl.value || '').trim();
            if (!nomeR || !mlR || !emailR || !bancada) {
                if (fb) {
                    fb.textContent = 'Preencha todas as seções anteriores.';
                    fb.className = 'rc-map-feedback rc-map-err';
                }
                showStep(1);
                return;
            }

            var dataIso;
            var statusFinal;
            var origem;
            if (maxStep === 6) {
                var dataEl = document.getElementById(ns + 'data');
                var dataVal = dataEl && dataEl.value;
                if (!dataVal) {
                    if (fb) {
                        fb.textContent = 'Informe a data do registo (como na planilha).';
                        fb.className = 'rc-map-feedback rc-map-err';
                    }
                    showStep(6);
                    return;
                }
                var stReg = document.getElementById(ns + 'reg-status');
                var stVal = stReg && stReg.value;
                if (!stVal) {
                    if (fb) {
                        fb.textContent = 'Selecione o status do chamado na planilha.';
                        fb.className = 'rc-map-feedback rc-map-err';
                    }
                    showStep(6);
                    return;
                }
                var hhEl = document.getElementById(ns + 'hh');
                var mmEl = document.getElementById(ns + 'mm');
                var ssEl = document.getElementById(ns + 'ss');
                var hhV = parseInt(hhEl && hhEl.value !== '' ? hhEl.value : '0', 10);
                var mmV = parseInt(mmEl && mmEl.value !== '' ? mmEl.value : '0', 10);
                var ssV = parseInt(ssEl && ssEl.value !== '' ? ssEl.value : '0', 10);
                if (hhV < 0 || hhV > 23 || mmV < 0 || mmV > 59 || ssV < 0 || ssV > 59) {
                    if (fb) {
                        fb.textContent = 'Hora, minuto ou segundo inválidos.';
                        fb.className = 'rc-map-feedback rc-map-err';
                    }
                    showStep(6);
                    return;
                }
                var dp = dataVal.split('-');
                if (dp.length !== 3) {
                    if (fb) {
                        fb.textContent = 'Data inválida.';
                        fb.className = 'rc-map-feedback rc-map-err';
                    }
                    showStep(6);
                    return;
                }
                var dtObj = new Date(Number(dp[0]), Number(dp[1]) - 1, Number(dp[2]), hhV, mmV, ssV, 0);
                if (isNaN(dtObj.getTime())) {
                    if (fb) {
                        fb.textContent = 'Data ou hora inválida.';
                        fb.className = 'rc-map-feedback rc-map-err';
                    }
                    showStep(6);
                    return;
                }
                dataIso = dtObj.toISOString();
                statusFinal = stVal;
                origem = 'admin_mapeamento_manual_planilha';
            } else {
                dataIso = new Date().toISOString();
                statusFinal = 'aberto';
                origem = 'sauron_mapeamento_brsc02';
            }

            var mapeamento = {
                unidade: 'BRSC02',
                nomeCompleto: nomeR.value,
                usuarioMl: mlR.value,
                emailCorporativo: emailR.value,
                bancada: bancada
            };
            var observacao = 'BRSC02 · ' + emailR.value + ' · Bancada ' + bancada + ' · ML: ' + mlR.value;
            var chamados = getChamados();
            var novo = {
                id: 'rc-' + Date.now(),
                data: dataIso,
                chave: chave,
                status: statusFinal,
                tipos: [],
                observacao: observacao,
                mapeamento: mapeamento
            };
            chamados.unshift(novo);
            saveChamados(chamados);
            var base = window.location.origin || '';
            fetch(base + '/api/registro-chamados', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: novo.id,
                    data: novo.data,
                    chave: chave,
                    status: statusFinal,
                    tipos: [],
                    observacao: observacao,
                    origem: origem,
                    mapeamento: mapeamento
                })
            }).then(function () {}).catch(function () {});

            resetWizardForm();
            showStep(1);
            if (fb) {
                fb.textContent = maxStep === 6 ? 'Registo manual gravado com sucesso.' : 'Mapeamento enviado com sucesso.';
                fb.className = 'rc-map-feedback rc-map-ok';
            }
            renderTabela();
        });
    }

    showStep(1);
}

function init() {
    var hasTable = !!document.getElementById('rc-tbody');
    var hasForm = !!document.getElementById('rc-form');
    var hasMapWizard = !!document.getElementById('rc-map-wizard');

    syncFromServer();
    if (!RC_SYNC_INTERVAL) {
        var syncMs = hasTable ? 3000 : 15000;
        RC_SYNC_INTERVAL = setInterval(syncFromServer, syncMs);
    }

    if (document.getElementById('rc-theme-toggle')) {
        setRcTheme(getRcTheme());
        var themeBtn = document.getElementById('rc-theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', function () {
                setRcTheme(getRcTheme() === 'dark' ? 'light' : 'dark');
            });
        }
    }

    purgeLixeiraAntiga();

    if (hasTable) {
        window.addEventListener('storage', function (e) {
            if (e.key === STORAGE_KEY) renderTabela();
        });
        populateAnoMes();
        var anoEl = document.getElementById('rc-ano');
        var mesEl = document.getElementById('rc-mes');
        if (anoEl) anoEl.addEventListener('change', function () {
            updateRcPeriodMesLock();
            renderTabela();
        });
        if (mesEl) mesEl.addEventListener('change', renderTabela);

        document.querySelectorAll('.rc-filter-btn[data-filter]').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.rc-filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                renderTabela();
            });
        });

        var searchEl = document.getElementById('rc-search');
        var searchExpand = document.getElementById('rc-search-expandable');
        var searchToggle = document.getElementById('rc-search-toggle');
        if (searchExpand && searchToggle) {
            searchToggle.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var exp = searchExpand.classList.toggle('rc-search-expanded');
                searchToggle.setAttribute('aria-expanded', exp ? 'true' : 'false');
                if (exp && searchEl) setTimeout(function () { try { searchEl.focus(); } catch (er) {} }, 60);
            });
        }
        if (searchEl) {
            searchEl.addEventListener('input', renderTabela);
            searchEl.addEventListener('keyup', renderTabela);
        }

        var exportBtn = document.getElementById('rc-btn-export');
        var exportDropdown = document.getElementById('rc-export-dropdown');
        if (exportBtn && exportDropdown) {
            exportBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                toggleExportDropdown();
            });
            document.addEventListener('click', function (e) {
                closeExportDropdown();
                closePeriodDropdown();
                var se = document.getElementById('rc-search-expandable');
                var stg = document.getElementById('rc-search-toggle');
                if (se && se.classList.contains('rc-search-expanded')) {
                    if (!se.contains(e.target)) {
                        if (!searchEl || !String(searchEl.value || '').trim()) {
                            se.classList.remove('rc-search-expanded');
                            if (stg) stg.setAttribute('aria-expanded', 'false');
                        }
                    }
                }
            });
            exportDropdown.addEventListener('click', function (e) {
                e.stopPropagation();
            });
            exportDropdown.querySelectorAll('.rc-export-option').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var format = this.dataset.format;
                    closeExportDropdown();
                    if (format === 'pdf') exportPDF();
                    else if (format === 'excel') exportExcel();
                    else if (format === 'csv') exportCSV();
                    else if (format === 'google') exportGooglePlanilhas();
                });
            });
        }

        var periodBtn = document.getElementById('rc-btn-period');
        var periodDropdown = document.getElementById('rc-period-dropdown');
        if (periodBtn && periodDropdown) {
            periodBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                togglePeriodDropdown();
            });
            periodDropdown.addEventListener('click', function (e) {
                e.stopPropagation();
            });
        }
    } else {
        document.addEventListener('click', function () {
            closeExportDropdown();
            closePeriodDropdown();
        });
    }

    if (hasForm) {
        initTipoTags('form');
        var form = document.getElementById('rc-form');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                var chaveEl = document.getElementById('rc-chave');
                var statusEl = document.getElementById('rc-status');
                var obsEl = document.getElementById('rc-obs');
                var chave = (chaveEl && chaveEl.value != null ? chaveEl.value : '').trim();
                var status = statusEl && statusEl.value != null ? statusEl.value : '';
                var tipos = getTiposSelecionados('form');
                var observacao = (obsEl && obsEl.value != null ? obsEl.value : '').trim();
                if (!chave || !status) return;
                var chamados = getChamados();
                var novo = {
                    id: 'rc-' + Date.now(),
                    data: new Date().toISOString(),
                    chave: chave,
                    status: status,
                    tipos: Array.isArray(tipos) ? tipos : [],
                    observacao: observacao
                };
                chamados.unshift(novo);
                saveChamados(chamados);
                var base = window.location.origin || '';
                fetch(base + '/api/registro-chamados', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chave: chave, status: status, tipos: novo.tipos, observacao: observacao, origem: 'site' })
                }).then(function () {}).catch(function () {});
                if (chaveEl) chaveEl.value = '';
                if (statusEl) statusEl.value = '';
                if (obsEl) obsEl.value = '';
                setTiposSelecionados('form', []);
                syncGlassSelect('rc-status');
                renderTabela();
            });
        }
    }

    if (document.getElementById('rc-edit-tipo-tags-field')) {
        initTipoTags('edit');
    }

    if (hasMapWizard) {
        initMapeamentoWizard('rc-map-');
    }
    if (document.getElementById('admin-rc-map-wizard')) {
        initMapeamentoWizard('admin-rc-map-');
    }

    if (hasForm || hasTable) {
        setupGlassSelects();
    }

    renderTabela();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

})();
