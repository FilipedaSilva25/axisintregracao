/**
 * AXIS — Consola em produção (primeiro script a carregar quando injetado pelo servidor)
 *
 * LIMITAÇÃO IMPORTANTE: Não existe forma fiável de impedir F12, Consola ou alteração do HTML/CSS
 * no próprio computador do utilizador. Qualquer "bloqueio" em JavaScript pode ser contornado
 * (desativar JS, outro browser, extensões). A segurança real do AXIS está no servidor (validação
 * de API, sessão, dados em disco) — nunca confiar só no que corre no browser.
 *
 * O que este ficheiro faz em ambiente "produção" (não localhost):
 * - Silencia console.log / debug / info / trace / table / group* para reduzir ruído e
 *   dificultar exploração casual via consola (não impede alteração do DOM no Elements).
 * - Mantém console.error e console.warn (erros e avisos).
 *
 * Para suporte técnico com consola completa na mesma máquina, na consola executar UMA vez:
 *   sessionStorage.setItem('axis_allow_console','1'); location.reload();
 */
(function () {
    'use strict';

    function isLocalDevHost() {
        var h = String(location.hostname || '').toLowerCase();
        return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '' || h.endsWith('.local');
    }

    try {
        if (sessionStorage.getItem('axis_allow_console') === '1') return;
    } catch (e) {}

    if (isLocalDevHost()) return;

    var noop = function () {};

    console.log = noop;
    console.debug = noop;
    console.info = noop;
    console.trace = noop;
    console.table = noop;
    console.dir = noop;
    console.dirxml = noop;
    console.group = noop;
    console.groupCollapsed = noop;
    console.groupEnd = noop;
    console.time = noop;
    console.timeEnd = noop;
    console.timeLog = noop;
    console.count = noop;
    console.countReset = noop;

    try {
        console.warn(
            '%cAXIS%c Produção: logs informativos estão ocultos. Erros e avisos continuam visíveis. ' +
                'Alterações em F12 só afetam o seu browser; dados críticos devem estar validados no servidor.',
            'font-weight:700;color:#2ecc71;',
            'color:#86868b;font-weight:500;'
        );
    } catch (e) {}
})();
