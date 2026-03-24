/**
 * Reduz avisos "Unchecked runtime.lastError" no consola quando extensões Chrome
 * chamam chrome.runtime.sendMessage sem tratar o callback.
 */
(function () {
    'use strict';
    try {
        if (typeof chrome === 'undefined' || !chrome.runtime || typeof chrome.runtime.sendMessage !== 'function') {
            return;
        }
        if (chrome.runtime.__axisLastErrorShim) {
            return;
        }
        chrome.runtime.__axisLastErrorShim = true;
        var orig = chrome.runtime.sendMessage.bind(chrome.runtime);
        chrome.runtime.sendMessage = function () {
            var args = Array.prototype.slice.call(arguments);
            var last = args[args.length - 1];
            if (typeof last === 'function') {
                var userCb = last;
                args[args.length - 1] = function () {
                    try {
                        void chrome.runtime.lastError;
                    } catch (e1) {}
                    userCb.apply(null, arguments);
                };
                return orig.apply(null, args);
            }
            args.push(function () {
                try {
                    void chrome.runtime.lastError;
                } catch (e2) {}
            });
            return orig.apply(null, args);
        };
    } catch (e) {}
})();
