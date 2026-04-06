/**
 * Calendário (Flatpickr) e seletor de hora em 3 colunas — NF / filtros AXIS.
 * Depende: flatpickr + l10n/pt (carregados antes deste ficheiro).
 */
(function () {
    'use strict';

    var fpFilterFrom = null;
    var fpFilterTo = null;
    var fpUploadDate = null;

    function ptLocale() {
        if (typeof flatpickr !== 'undefined' && flatpickr.l10ns && flatpickr.l10ns.pt) {
            return flatpickr.l10ns.pt;
        }
        return { firstDayOfWeek: 0 };
    }

    function baseFpConfig() {
        return {
            locale: ptLocale(),
            dateFormat: 'Y-m-d',
            altInput: true,
            altFormat: 'd/m/Y',
            altInputClass: 'axis-fp-alt-input',
            allowInput: false,
            disableMobile: true,
            animate: true,
            monthSelectorType: 'dropdown',
            appendTo: document.body
        };
    }

    /** Filtros Início/Fim: mês em texto + painel AXIS (sem select nativo de meses nem setas prev/next). */
    function filterDateFpConfig() {
        return Object.assign({}, baseFpConfig(), {
            monthSelectorType: 'static',
            onOpen: function (selectedDates, dateStr, instance) {
                if (instance.calendarContainer) {
                    instance.calendarContainer.classList.add('axis-fp-calendar--nf-filters');
                }
            },
            onClose: function (selectedDates, dateStr, instance) {
                if (instance.calendarContainer) {
                    instance.calendarContainer.classList.remove('axis-fp-calendar--nf-filters');
                }
                closeFpMonthPanel();
            },
            onReady: function (selectedDates, dateStr, instance) {
                wireFilterCalendarMonthClick(instance);
            }
        });
    }

    function destroyFp(el) {
        if (el && el._flatpickr) {
            try {
                el._flatpickr.destroy();
            } catch (e) {}
        }
    }

    function initFilterDates() {
        if (typeof flatpickr === 'undefined') return;
        var fromEl = document.getElementById('date-from');
        var toEl = document.getElementById('date-to');
        if (!fromEl || !toEl) return;
        destroyFp(fromEl);
        destroyFp(toEl);
        var cfg = filterDateFpConfig();
        fpFilterTo = flatpickr(toEl, cfg);
        fpFilterFrom = flatpickr(
            fromEl,
            Object.assign({}, cfg, {
                onChange: [
                    function (selectedDates) {
                        if (!fpFilterTo) return;
                        if (selectedDates.length) {
                            fpFilterTo.set('minDate', selectedDates[0]);
                        } else {
                            fpFilterTo.set('minDate', null);
                        }
                    }
                ]
            })
        );
    }

    function initUploadDate() {
        if (typeof flatpickr === 'undefined') return;
        var el = document.getElementById('nf-upload-override-data');
        if (!el) return;
        destroyFp(el);
        fpUploadDate = flatpickr(
            el,
            Object.assign({}, baseFpConfig(), {
                altInputClass: 'axis-fp-alt-input nf-upload-datetime--styled'
            })
        );
    }

    function pad2(n) {
        return String(Math.max(0, n)).padStart(2, '0');
    }

    function parseNativeTime(str) {
        if (!str || String(str).trim() === '') {
            return { h: 0, m: 0, s: 0, empty: true };
        }
        var p = String(str).trim().split(':');
        return {
            h: Math.min(23, Math.max(0, parseInt(p[0], 10) || 0)),
            m: Math.min(59, Math.max(0, parseInt(p[1], 10) || 0)),
            s: Math.min(59, Math.max(0, parseInt(p[2], 10) || 0)),
            empty: false
        };
    }

    function syncTimeDisplay(nativeInput, displayEl) {
        if (!nativeInput || !displayEl) return;
        var v = nativeInput.value;
        if (!v) {
            displayEl.textContent = '-- : -- : --';
            return;
        }
        var t = parseNativeTime(v);
        displayEl.textContent = pad2(t.h) + ' : ' + pad2(t.m) + ' : ' + pad2(t.s);
    }

    var timePopoverEl = null;
    var timeState = { h: 0, m: 0, s: 0 };
    var timeOutsideClose = null;

    function closeTimePopover() {
        var trig = document.getElementById('axis-upload-time-trigger');
        if (timePopoverEl) {
            timePopoverEl.setAttribute('hidden', '');
            timePopoverEl.classList.remove('axis-time-popover--open');
        }
        if (trig) {
            trig.setAttribute('aria-expanded', 'false');
        }
        if (timeOutsideClose) {
            document.removeEventListener('click', timeOutsideClose, true);
            timeOutsideClose = null;
        }
    }

    function positionPopover(trigger, pop) {
        var r = trigger.getBoundingClientRect();
        var pw = 280;
        var ph = 280;
        var left = r.left + r.width / 2 - pw / 2;
        var top = r.bottom + 8;
        if (left < 8) left = 8;
        if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8;
        if (top + ph > window.innerHeight - 8) {
            top = r.top - ph - 8;
        }
        if (top < 8) top = 8;
        pop.style.left = left + 'px';
        pop.style.top = top + 'px';
    }

    function selectCell(col, val) {
        var scroll = col.querySelector('.axis-time-col__scroll');
        if (!scroll) return;
        scroll.querySelectorAll('.axis-time-cell').forEach(function (c) {
            c.classList.toggle('is-selected', parseInt(c.getAttribute('data-val'), 10) === val);
        });
        var sel = scroll.querySelector('.axis-time-cell.is-selected');
        if (sel) {
            try {
                sel.scrollIntoView({ block: 'center', behavior: 'auto' });
            } catch (e) {
                sel.scrollIntoView(true);
            }
        }
    }

    function buildTimePopover() {
        if (timePopoverEl) return timePopoverEl;
        var pop = document.createElement('div');
        pop.id = 'axis-upload-time-popover';
        pop.className = 'axis-time-popover';
        pop.setAttribute('hidden', '');
        pop.setAttribute('role', 'dialog');
        pop.setAttribute('aria-modal', 'true');
        pop.setAttribute('aria-label', 'Selecionar horário');

        var cols = document.createElement('div');
        cols.className = 'axis-time-popover__cols';

        function makeCol(unit, max, label) {
            var wrap = document.createElement('div');
            wrap.className = 'axis-time-col';
            wrap.setAttribute('data-unit', unit);
            var cap = document.createElement('div');
            cap.className = 'axis-time-col__caption';
            cap.textContent = label;
            var scroll = document.createElement('div');
            scroll.className = 'axis-time-col__scroll';
            for (var i = 0; i <= max; i++) {
                (function (ii) {
                    var btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'axis-time-cell';
                    btn.setAttribute('data-val', String(ii));
                    btn.textContent = pad2(ii);
                    btn.addEventListener('click', function (ev) {
                        ev.stopPropagation();
                        if (unit === 'h') timeState.h = ii;
                        if (unit === 'm') timeState.m = ii;
                        if (unit === 's') timeState.s = ii;
                        selectCell(wrap, ii);
                    });
                    scroll.appendChild(btn);
                })(i);
            }
            wrap.appendChild(cap);
            wrap.appendChild(scroll);
            return wrap;
        }

        cols.appendChild(makeCol('h', 23, 'H'));
        cols.appendChild(makeCol('m', 59, 'M'));
        cols.appendChild(makeCol('s', 59, 'S'));

        var foot = document.createElement('div');
        foot.className = 'axis-time-popover__footer';
        var btnClear = document.createElement('button');
        btnClear.type = 'button';
        btnClear.className = 'axis-time-popover__btn axis-time-popover__btn--ghost';
        btnClear.textContent = 'Limpar';
        btnClear.addEventListener('click', function (ev) {
            ev.stopPropagation();
            var nat = document.getElementById('nf-upload-override-hora');
            var disp = document.getElementById('axis-upload-time-display');
            if (nat) nat.value = '';
            if (disp) disp.textContent = '-- : -- : --';
            closeTimePopover();
        });
        var btnOk = document.createElement('button');
        btnOk.type = 'button';
        btnOk.className = 'axis-time-popover__btn axis-time-popover__btn--primary';
        btnOk.textContent = 'OK';
        btnOk.addEventListener('click', function (ev) {
            ev.stopPropagation();
            var nat = document.getElementById('nf-upload-override-hora');
            var disp = document.getElementById('axis-upload-time-display');
            if (nat) {
                nat.value = pad2(timeState.h) + ':' + pad2(timeState.m) + ':' + pad2(timeState.s);
            }
            syncTimeDisplay(nat, disp);
            closeTimePopover();
        });
        foot.appendChild(btnClear);
        foot.appendChild(btnOk);

        pop.appendChild(cols);
        pop.appendChild(foot);
        pop.addEventListener('click', function (e) {
            e.stopPropagation();
        });
        document.body.appendChild(pop);
        timePopoverEl = pop;
        return pop;
    }

    function openTimePopover() {
        var trig = document.getElementById('axis-upload-time-trigger');
        var nat = document.getElementById('nf-upload-override-hora');
        if (!trig || !nat) return;
        var pop = buildTimePopover();
        var t = parseNativeTime(nat.value);
        if (t.empty) {
            timeState = { h: new Date().getHours(), m: new Date().getMinutes(), s: 0 };
        } else {
            timeState = { h: t.h, m: t.m, s: t.s };
        }
        pop.querySelectorAll('.axis-time-col').forEach(function (col) {
            var u = col.getAttribute('data-unit');
            var v = u === 'h' ? timeState.h : u === 'm' ? timeState.m : timeState.s;
            selectCell(col, v);
        });
        if (document.documentElement.getAttribute('data-theme') === 'dark') {
            pop.setAttribute('data-theme', 'dark');
        } else {
            pop.removeAttribute('data-theme');
        }
        pop.removeAttribute('hidden');
        pop.classList.add('axis-time-popover--open');
        trig.setAttribute('aria-expanded', 'true');
        positionPopover(trig, pop);
        timeOutsideClose = function (e) {
            if (!pop.contains(e.target) && !trig.contains(e.target)) {
                closeTimePopover();
            }
        };
        setTimeout(function () {
            document.addEventListener('click', timeOutsideClose, true);
        }, 0);
    }

    function initUploadTimeColumns() {
        var trig = document.getElementById('axis-upload-time-trigger');
        var nat = document.getElementById('nf-upload-override-hora');
        var disp = document.getElementById('axis-upload-time-display');
        if (!trig || !nat || !disp) return;
        syncTimeDisplay(nat, disp);
        trig.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (timePopoverEl && !timePopoverEl.hasAttribute('hidden')) {
                closeTimePopover();
            } else {
                openTimePopover();
            }
        });
    }

    var filterDdOutside = null;

    var fpMonthPanel = null;
    var fpMonthPanelOutside = null;
    var fpMonthPanelTargetFp = null;
    var fpMonthPanelTriggerEl = null;

    function monthNamesLongPt() {
        var loc = ptLocale();
        if (loc.months && loc.months.longhand && Array.isArray(loc.months.longhand)) {
            return loc.months.longhand.slice();
        }
        return [
            'Janeiro',
            'Fevereiro',
            'Março',
            'Abril',
            'Maio',
            'Junho',
            'Julho',
            'Agosto',
            'Setembro',
            'Outubro',
            'Novembro',
            'Dezembro'
        ];
    }

    function positionFpMonthPanel(anchor) {
        if (!fpMonthPanel || !anchor) return;
        var r = anchor.getBoundingClientRect();
        var w = Math.max(r.width, 220);
        fpMonthPanel.style.position = 'fixed';
        fpMonthPanel.style.zIndex = '13060';
        fpMonthPanel.style.minWidth = w + 'px';
        var left = r.left;
        var top = r.bottom + 6;
        if (left + w > window.innerWidth - 12) {
            left = window.innerWidth - w - 12;
        }
        if (left < 8) left = 8;
        fpMonthPanel.style.left = left + 'px';
        fpMonthPanel.style.top = top + 'px';
        var ph = fpMonthPanel.offsetHeight || 300;
        if (top + ph > window.innerHeight - 10) {
            top = Math.max(8, r.top - ph - 6);
            fpMonthPanel.style.top = top + 'px';
        }
    }

    function closeFpMonthPanel() {
        if (!fpMonthPanel) return;
        fpMonthPanel.setAttribute('hidden', '');
        fpMonthPanel.classList.remove('axis-fp-month-panel--open');
        if (fpMonthPanelOutside) {
            document.removeEventListener('click', fpMonthPanelOutside, true);
            fpMonthPanelOutside = null;
        }
        fpMonthPanelTargetFp = null;
        fpMonthPanelTriggerEl = null;
    }

    function applyMonthToFlatpickr(fp, monthIndex) {
        if (!fp) return;
        var y = fp.currentYear;
        var day = 1;
        var sel = fp.selectedDates;
        if (sel.length) {
            day = sel[0].getDate();
        } else {
            var t = new Date();
            if (t.getFullYear() === y && t.getMonth() === monthIndex) {
                day = t.getDate();
            }
        }
        var last = new Date(y, monthIndex + 1, 0).getDate();
        day = Math.min(day, last);
        fp.setDate(new Date(y, monthIndex, day), true);
    }

    function ensureFpMonthPanelBuilt() {
        if (fpMonthPanel) return;
        var panel = document.createElement('div');
        panel.id = 'axis-fp-month-panel';
        panel.className = 'axis-fp-month-panel';
        panel.setAttribute('hidden', '');
        panel.setAttribute('role', 'listbox');
        panel.setAttribute('aria-label', 'Selecionar mês');
        var names = monthNamesLongPt();
        names.forEach(function (label, idx) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'axis-fp-month-opt';
            b.setAttribute('data-month', String(idx));
            b.setAttribute('role', 'option');
            b.textContent = label;
            b.addEventListener('click', function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
                if (fpMonthPanelTargetFp) {
                    applyMonthToFlatpickr(fpMonthPanelTargetFp, idx);
                }
                closeFpMonthPanel();
            });
            panel.appendChild(b);
        });
        document.body.appendChild(panel);
        fpMonthPanel = panel;
    }

    function syncFpMonthPanelActive(fp) {
        if (!fpMonthPanel || !fp) return;
        var m = fp.currentMonth;
        fpMonthPanel.querySelectorAll('.axis-fp-month-opt').forEach(function (btn) {
            var i = parseInt(btn.getAttribute('data-month'), 10);
            btn.classList.toggle('is-active', i === m);
        });
    }

    function openFpMonthPanel(fp, anchorEl) {
        if (!fp || !anchorEl) return;
        closeAllFilterDropdowns();
        fpMonthPanelTargetFp = fp;
        fpMonthPanelTriggerEl = anchorEl;
        ensureFpMonthPanelBuilt();
        if (document.documentElement.getAttribute('data-theme') === 'dark') {
            fpMonthPanel.setAttribute('data-theme', 'dark');
        } else {
            fpMonthPanel.removeAttribute('data-theme');
        }
        syncFpMonthPanelActive(fp);
        fpMonthPanel.removeAttribute('hidden');
        fpMonthPanel.classList.add('axis-fp-month-panel--open');
        positionFpMonthPanel(anchorEl);
        fpMonthPanelOutside = function (e) {
            if (!fpMonthPanel.contains(e.target) && e.target !== anchorEl && !anchorEl.contains(e.target)) {
                closeFpMonthPanel();
            }
        };
        setTimeout(function () {
            document.addEventListener('click', fpMonthPanelOutside, true);
        }, 0);
    }

    function wireFilterCalendarMonthClick(fp) {
        var cal = fp.calendarContainer;
        if (!cal || cal.getAttribute('data-axis-fp-month-wired') === '1') return;
        cal.setAttribute('data-axis-fp-month-wired', '1');
        cal.addEventListener(
            'click',
            function (e) {
                var cm = e.target.closest('.cur-month');
                if (!cm || !cal.contains(cm)) return;
                e.preventDefault();
                e.stopPropagation();
                openFpMonthPanel(fp, cm);
            },
            true
        );
    }

    function closeAllFilterDropdowns() {
        closeFpMonthPanel();
        document.querySelectorAll('.axis-filter-dd-panel').forEach(function (panel) {
            if (!panel.hasAttribute('hidden')) {
                panel.setAttribute('hidden', '');
                panel.classList.remove('axis-filter-dd-panel--open');
            }
        });
        document.querySelectorAll('.axis-filter-dd-trigger').forEach(function (t) {
            t.setAttribute('aria-expanded', 'false');
            t.classList.remove('axis-filter-dd-trigger--open');
        });
        if (filterDdOutside) {
            document.removeEventListener('click', filterDdOutside, true);
            filterDdOutside = null;
        }
    }

    function positionFilterDropdownPanel(trigger, panel) {
        var r = trigger.getBoundingClientRect();
        var w = Math.max(r.width, 236);
        panel.style.position = 'fixed';
        panel.style.zIndex = '13050';
        panel.style.minWidth = w + 'px';
        var left = r.left;
        var top = r.bottom + 6;
        if (left + w > window.innerWidth - 12) {
            left = window.innerWidth - w - 12;
        }
        if (left < 8) left = 8;
        panel.style.left = left + 'px';
        panel.style.top = top + 'px';
        var ph = panel.offsetHeight || 220;
        if (top + ph > window.innerHeight - 10) {
            top = Math.max(8, r.top - ph - 6);
            panel.style.top = top + 'px';
        }
    }

    function syncFilterDropdownActive(selectEl, panel) {
        if (!selectEl || !panel) return;
        var v = selectEl.value;
        panel.querySelectorAll('.axis-filter-dd-opt').forEach(function (b) {
            b.classList.toggle('is-active', b.getAttribute('data-value') === v);
        });
    }

    function updateFilterDropdownLabel(selectEl, trigger) {
        if (!selectEl || !trigger) return;
        var display = trigger.querySelector('.axis-filter-dd-trigger__text');
        var opt = selectEl.options[selectEl.selectedIndex];
        if (display && opt) display.textContent = opt.textContent;
    }

    function wireFilterDropdown(selectId, triggerId, panelId) {
        var sel = document.getElementById(selectId);
        var trig = document.getElementById(triggerId);
        var panel = document.getElementById(panelId);
        if (!sel || !trig || !panel) return;

        if (panel.parentNode !== document.body) {
            document.body.appendChild(panel);
        }

        function openPanel() {
            closeAllFilterDropdowns();
            panel.removeAttribute('hidden');
            panel.classList.add('axis-filter-dd-panel--open');
            trig.setAttribute('aria-expanded', 'true');
            trig.classList.add('axis-filter-dd-trigger--open');
            if (document.documentElement.getAttribute('data-theme') === 'dark') {
                panel.setAttribute('data-theme', 'dark');
            } else {
                panel.removeAttribute('data-theme');
            }
            syncFilterDropdownActive(sel, panel);
            positionFilterDropdownPanel(trig, panel);
            filterDdOutside = function (e) {
                if (!panel.contains(e.target) && !trig.contains(e.target)) {
                    closeAllFilterDropdowns();
                }
            };
            setTimeout(function () {
                document.addEventListener('click', filterDdOutside, true);
            }, 0);
        }

        trig.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (panel.hasAttribute('hidden')) {
                openPanel();
            } else {
                closeAllFilterDropdowns();
            }
        });

        panel.querySelectorAll('.axis-filter-dd-opt').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var v = btn.getAttribute('data-value');
                sel.value = v;
                updateFilterDropdownLabel(sel, trig);
                syncFilterDropdownActive(sel, panel);
                closeAllFilterDropdowns();
                try {
                    sel.dispatchEvent(new Event('change', { bubbles: true }));
                } catch (e2) {}
            });
        });

        updateFilterDropdownLabel(sel, trig);
        syncFilterDropdownActive(sel, panel);
    }

    function initFilterCustomDropdowns() {
        wireFilterDropdown('filter-tipo', 'filter-tipo-trigger', 'filter-tipo-panel');
        wireFilterDropdown('filter-status', 'filter-status-trigger', 'filter-status-panel');
    }

    window.axisCloseFilterDropdowns = closeAllFilterDropdowns;

    window.axisSyncFilterSelectDisplays = function () {
        var s1 = document.getElementById('filter-tipo');
        var t1 = document.getElementById('filter-tipo-trigger');
        var p1 = document.getElementById('filter-tipo-panel');
        if (s1 && t1) updateFilterDropdownLabel(s1, t1);
        if (s1 && p1) syncFilterDropdownActive(s1, p1);
        var s2 = document.getElementById('filter-status');
        var t2 = document.getElementById('filter-status-trigger');
        var p2 = document.getElementById('filter-status-panel');
        if (s2 && t2) updateFilterDropdownLabel(s2, t2);
        if (s2 && p2) syncFilterDropdownActive(s2, p2);
    };

    function repositionOpenFilterDropdowns() {
        document.querySelectorAll('.axis-filter-dd-panel.axis-filter-dd-panel--open').forEach(function (panel) {
            var id = panel.id;
            var tid = id.replace('-panel', '-trigger');
            var trig = document.getElementById(tid);
            if (trig && !panel.hasAttribute('hidden')) {
                positionFilterDropdownPanel(trig, panel);
            }
        });
    }

    function initAll() {
        initFilterDates();
        initUploadDate();
        initUploadTimeColumns();
        initFilterCustomDropdowns();
    }

    window.axisNfResetManualDatePickers = function () {
        if (fpUploadDate) {
            try {
                fpUploadDate.clear();
            } catch (e) {}
        }
        var nat = document.getElementById('nf-upload-override-hora');
        var disp = document.getElementById('axis-upload-time-display');
        if (nat) nat.value = '';
        if (disp) disp.textContent = '-- : -- : --';
        closeTimePopover();
    };

    window.axisClearFilterDatePickers = function () {
        if (fpFilterFrom) {
            try {
                fpFilterFrom.clear();
            } catch (e) {}
        }
        if (fpFilterTo) {
            try {
                fpFilterTo.clear();
            } catch (e) {}
        }
        var fromEl = document.getElementById('date-from');
        var toEl = document.getElementById('date-to');
        if (fromEl && !fromEl._flatpickr) fromEl.value = '';
        if (toEl && !toEl._flatpickr) toEl.value = '';
    };

    window.axisRepositionOpenTimePopover = function () {
        var trig = document.getElementById('axis-upload-time-trigger');
        if (timePopoverEl && trig && !timePopoverEl.hasAttribute('hidden')) {
            positionPopover(trig, timePopoverEl);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }

    window.addEventListener('resize', function () {
        window.axisRepositionOpenTimePopover();
        repositionOpenFilterDropdowns();
        if (fpMonthPanel && !fpMonthPanel.hasAttribute('hidden') && fpMonthPanelTriggerEl) {
            positionFpMonthPanel(fpMonthPanelTriggerEl);
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        if (timePopoverEl && !timePopoverEl.hasAttribute('hidden')) {
            e.preventDefault();
            closeTimePopover();
        }
        if (fpMonthPanel && !fpMonthPanel.hasAttribute('hidden')) {
            e.preventDefault();
            closeFpMonthPanel();
            return;
        }
        var anyDd = document.querySelector('.axis-filter-dd-panel.axis-filter-dd-panel--open');
        if (anyDd) {
            e.preventDefault();
            closeAllFilterDropdowns();
        }
    });
})();
