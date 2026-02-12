/**
 * Service Worker mínimo - Bloco de Notas AXIS
 * Evita erro "Unexpected token '<'" quando o navegador solicita /sw.js
 */
'use strict';

self.addEventListener('install', function () {
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(self.clients.claim());
});
