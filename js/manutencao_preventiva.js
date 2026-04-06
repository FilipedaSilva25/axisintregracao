(function () {
    var s = document.createElement('script');
    /* Resolvido em relação ao *documento* (ex.: /pages/…), não ao ficheiro em /js/ — ./ falhava com 404. */
    s.src = '../js/manutenção_preventiva.js?v=10';
    s.defer = true;
    document.head.appendChild(s);
})();
