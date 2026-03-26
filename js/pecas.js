/**
 * PEÇAS - Inventário Entrada e Saída | AXIS
 * Dados: localStorage (axis_pecas_estoque, axis_pecas_movimentos)
 * Campos alinhados à planilha: PRODUTO, FABRICANTE, CONTEÚDO, LOTE, VALIDADE, QUANTIDADE, DATA DE RECEBIMENTO
 */
(function() {
    'use strict';

    const STORAGE_ESTOQUE = 'axis_pecas_estoque';
    const STORAGE_MOVIMENTOS = 'axis_pecas_movimentos';
    const STORAGE_UTILIZADAS = 'axis_pecas_utilizadas';
    const THEME_KEY = 'axis_pecas_theme';
    const VARIANT_KEY = 'axis_pecas_variant';
    var estoqueViewMode = 'lista'; /* 'lista' | 'cards' */

    /* 32 temas (versões) — cores aplicadas ao design em vidro */
    var PECAS_VARIANTS = [
        { id: 'ocean', name: 'Ocean', primary: '#0ea5e9', primaryDark: '#0284c7', glow: 'rgba(14,165,233,0.25)' },
        { id: 'sunset', name: 'Sunset', primary: '#f97316', primaryDark: '#ea580c', glow: 'rgba(249,115,22,0.25)' },
        { id: 'forest', name: 'Forest', primary: '#22c55e', primaryDark: '#16a34a', glow: 'rgba(34,197,94,0.25)' },
        { id: 'arctic', name: 'Arctic', primary: '#06b6d4', primaryDark: '#0891b2', glow: 'rgba(6,182,212,0.25)' },
        { id: 'neon', name: 'Neon', primary: '#a855f7', primaryDark: '#9333ea', glow: 'rgba(168,85,247,0.35)' },
        { id: 'lavender', name: 'Lavender', primary: '#8b5cf6', primaryDark: '#7c3aed', glow: 'rgba(139,92,246,0.25)' },
        { id: 'coral', name: 'Coral', primary: '#f43f5e', primaryDark: '#e11d48', glow: 'rgba(244,63,94,0.25)' },
        { id: 'mint', name: 'Mint', primary: '#10b981', primaryDark: '#059669', glow: 'rgba(16,185,129,0.25)' },
        { id: 'gold', name: 'Gold', primary: '#eab308', primaryDark: '#ca8a04', glow: 'rgba(234,179,8,0.25)' },
        { id: 'slate', name: 'Slate', primary: '#64748b', primaryDark: '#475569', glow: 'rgba(100,116,139,0.2)' },
        { id: 'rose', name: 'Rose', primary: '#fb7185', primaryDark: '#f43f5e', glow: 'rgba(251,113,133,0.25)' },
        { id: 'cyan', name: 'Cyan', primary: '#22d3ee', primaryDark: '#06b6d4', glow: 'rgba(34,211,238,0.25)' },
        { id: 'amber', name: 'Amber', primary: '#f59e0b', primaryDark: '#d97706', glow: 'rgba(245,158,11,0.25)' },
        { id: 'violet', name: 'Violet', primary: '#7c3aed', primaryDark: '#6d28d9', glow: 'rgba(124,58,237,0.25)' },
        { id: 'teal', name: 'Teal', primary: '#14b8a6', primaryDark: '#0d9488', glow: 'rgba(20,184,166,0.25)' },
        { id: 'peach', name: 'Peach', primary: '#fb923c', primaryDark: '#f97316', glow: 'rgba(251,146,60,0.25)' },
        { id: 'navy', name: 'Navy', primary: '#3b82f6', primaryDark: '#2563eb', glow: 'rgba(59,130,246,0.25)' },
        { id: 'emerald', name: 'Emerald', primary: '#34d399', primaryDark: '#10b981', glow: 'rgba(52,211,153,0.25)' },
        { id: 'crimson', name: 'Crimson', primary: '#dc2626', primaryDark: '#b91c1c', glow: 'rgba(220,38,38,0.25)' },
        { id: 'indigo', name: 'Indigo', primary: '#6366f1', primaryDark: '#4f46e5', glow: 'rgba(99,102,241,0.25)' },
        { id: 'lime', name: 'Lime', primary: '#84cc16', primaryDark: '#65a30d', glow: 'rgba(132,204,22,0.25)' },
        { id: 'fuchsia', name: 'Fuchsia', primary: '#d946ef', primaryDark: '#c026d3', glow: 'rgba(217,70,239,0.25)' },
        { id: 'sky', name: 'Sky', primary: '#0ea5e9', primaryDark: '#0284c7', glow: 'rgba(14,165,233,0.2)' },
        { id: 'pink', name: 'Pink', primary: '#ec4899', primaryDark: '#db2777', glow: 'rgba(236,72,153,0.25)' },
        { id: 'orange', name: 'Orange', primary: '#f97316', primaryDark: '#ea580c', glow: 'rgba(249,115,22,0.2)' },
        { id: 'jade', name: 'Jade', primary: '#0d9488', primaryDark: '#0f766e', glow: 'rgba(13,148,136,0.25)' },
        { id: 'berry', name: 'Berry', primary: '#be185d', primaryDark: '#9d174d', glow: 'rgba(190,24,93,0.25)' },
        { id: 'steel', name: 'Steel', primary: '#0f172a', primaryDark: '#020617', glow: 'rgba(15,23,42,0.15)' },
        { id: 'aurora', name: 'Aurora', primary: '#2dd4bf', primaryDark: '#14b8a6', glow: 'rgba(45,212,191,0.3)' },
        { id: 'flame', name: 'Flame', primary: '#ef4444', primaryDark: '#dc2626', glow: 'rgba(239,68,68,0.25)' },
        { id: 'iris', name: 'Iris', primary: '#5b21b6', primaryDark: '#4c1d95', glow: 'rgba(91,33,182,0.25)' },
        { id: 'sage', name: 'Sage', primary: '#65a30d', primaryDark: '#4d7c0f', glow: 'rgba(101,163,13,0.25)' }
    ];
    const MAX_PRODUTO = 200;
    const MAX_FABRICANTE = 120;
    const MAX_CONTEUDO = 100;
    const MAX_LOTE = 80;
    const MAX_VALIDADE = 50;
    const MAX_LOCAL = 100;
    const MAX_OBS = 500;
    const MAX_QUANTIDADE = 99999;
    const ID_SAFE_REGEX = /^[a-zA-Z0-9\-_]+$/;

    function sanitizeString(val, maxLen) {
        if (val == null || typeof val !== 'string') return '';
        var s = val.trim();
        if (maxLen && s.length > maxLen) s = s.substring(0, maxLen);
        return s;
    }

    function safeId(id) {
        if (id == null) return '';
        var s = String(id).trim();
        return (s && ID_SAFE_REGEX.test(s)) ? s : '';
    }

    function safeInt(val, def, min, max) {
        var n = parseInt(String(val || 0), 10);
        if (isNaN(n)) return def;
        if (min != null && n < min) return min;
        if (max != null && n > max) return max;
        return n;
    }

    function getProdutoNome(peca) {
        if (!peca) return '';
        return (peca.produto != null && peca.produto !== '') ? String(peca.produto) : (peca.nome != null ? String(peca.nome) : '');
    }

    var CATEGORIA_LABELS = { peca: 'Peça', acessorio: 'Acessório', limpeza: 'Produto de limpeza' };
    function getCategoriaLabel(cat) {
        return CATEGORIA_LABELS[cat] || 'Peça';
    }

    function getEstoque() {
        try {
            var raw = localStorage.getItem(STORAGE_ESTOQUE);
            if (!raw) return [];
            var arr = JSON.parse(raw);
            if (!Array.isArray(arr)) return [];
            return arr.map(function(p) {
                if (!p) return p;
                var q = Object.assign({}, p);
                if (q.produto == null && q.nome != null) q.produto = q.nome;
                if (q.dataRecebimento == null && q.dataCadastro != null) q.dataRecebimento = q.dataCadastro;
                if (q.categoria == null) q.categoria = 'peca';
                return q;
            });
        } catch (e) {
            return [];
        }
    }

    function saveEstoque(arr) {
        if (!Array.isArray(arr)) return false;
        try {
            localStorage.setItem(STORAGE_ESTOQUE, JSON.stringify(arr));
            syncToServer();
            return true;
        } catch (e) {
            console.error('Erro ao salvar estoque:', e);
            return false;
        }
    }

    function getMovimentos() {
        try {
            var raw = localStorage.getItem(STORAGE_MOVIMENTOS);
            if (!raw) return [];
            var arr = JSON.parse(raw);
            return Array.isArray(arr) ? arr : [];
        } catch (e) {
            return [];
        }
    }

    function saveMovimentos(arr) {
        if (!Array.isArray(arr)) return;
        try {
            localStorage.setItem(STORAGE_MOVIMENTOS, JSON.stringify(arr));
            syncToServer();
        } catch (e) {
            console.error('Erro ao salvar movimentos:', e);
        }
    }

    function loadFromServer() {
        var base = window.location.origin || '';
        Promise.all([
            fetch(base + '/api/pecas/estoque').then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; }),
            fetch(base + '/api/pecas/movimentos').then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; })
        ]).then(function(results) {
            var est = results[0];
            var mov = results[1];
            if (est && est.ok && Array.isArray(est.estoque) && est.estoque.length > 0) {
                saveEstoque(est.estoque);
            }
            if (mov && mov.ok && Array.isArray(mov.movimentos)) {
                saveMovimentos(mov.movimentos);
            }
            if (est && est.ok && Array.isArray(est.estoque)) {
                renderEstoque();
                renderMovimentos();
                updateDashboards();
            }
        });
    }

    function syncToServer() {
        var base = window.location.origin || '';
        var estoque = getEstoque();
        var movimentos = getMovimentos();
        fetch(base + '/api/pecas/estoque', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estoque: estoque })
        }).catch(function() {});
        fetch(base + '/api/pecas/movimentos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ movimentos: movimentos })
        }).catch(function() {});
    }

    function migrateUtilizadasToMovimentos() {
        try {
            var raw = localStorage.getItem(STORAGE_UTILIZADAS);
            if (!raw) return;
            var utilizadas = JSON.parse(raw);
            if (!Array.isArray(utilizadas) || utilizadas.length === 0) return;
            var movimentos = getMovimentos();
            utilizadas.forEach(function(u) {
                movimentos.unshift({
                    id: 'mov-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
                    pecaId: u.idEstoque || '',
                    tipo: 'saída',
                    produto: u.nome || '',
                    quantidade: u.quantidade || 0,
                    observacao: u.observacao || '',
                    dataHora: u.dataUso || new Date().toISOString()
                });
            });
            saveMovimentos(movimentos);
            localStorage.removeItem(STORAGE_UTILIZADAS);
        } catch (e) { console.warn('Migração utilizadas:', e); }
    }

    function formatarDataHora(iso) {
        if (!iso) return '—';
        try {
            var d = new Date(iso);
            if (isNaN(d.getTime())) return '—';
            var opts = { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' };
            var data = d.toLocaleDateString('pt-BR', opts);
            var hora = d.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
            return data + ' ' + hora;
        } catch (e) {
            return '—';
        }
    }

    function formatarData(iso) {
        if (!iso) return '—';
        try {
            var d = new Date(iso);
            if (isNaN(d.getTime())) return '—';
            return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch (e) {
            return '—';
        }
    }

    function formatarDataHoraCriacao(iso) {
        if (!iso) return '—';
        try {
            var d = new Date(iso);
            if (isNaN(d.getTime())) return '—';
            var opts = { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' };
            var dataParts = d.toLocaleDateString('pt-BR', opts).split('/');
            var data = (dataParts[0] || '') + '|' + (dataParts[1] || '') + '|' + (dataParts[2] || '');
            var hora = d.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
            return data + ' às ' + hora;
        } catch (e) {
            return '—';
        }
    }

    function escapeHtml(text) {
        if (text == null) return '';
        if (typeof text !== 'string') text = String(text);
        try {
            var div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        } catch (_) { return ''; }
    }

    function getTheme() {
        try {
            return localStorage.getItem(THEME_KEY) || 'light';
        } catch (e) {
            return 'light';
        }
    }

    function setTheme(theme) {
        theme = theme === 'dark' ? 'dark' : 'light';
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (e) {}
        document.documentElement.setAttribute('data-theme', theme);
        var btn = document.getElementById('pecas-theme-toggle');
        if (btn) {
            var icon = btn.querySelector('i');
            if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            btn.setAttribute('title', theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro');
        }
        try {
            updateDashboards();
        } catch (e) { /* init antes de dados */ }
    }

    function getVariant() {
        try {
            var id = localStorage.getItem(VARIANT_KEY);
            if (id && PECAS_VARIANTS.some(function(v) { return v.id === id; })) return id;
        } catch (e) {}
        return 'ocean';
    }

    function applyVariant(id) {
        var v = PECAS_VARIANTS.find(function(x) { return x.id === id; });
        if (!v) return;
        try { localStorage.setItem(VARIANT_KEY, id); } catch (e) {}
        var root = document.documentElement.style;
        root.setProperty('--pecas-primary', v.primary);
        root.setProperty('--pecas-primary-dark', v.primaryDark);
        root.setProperty('--pecas-glow', '0 0 40px -8px ' + (v.glow || 'rgba(14,165,233,0.25)'));
        root.setProperty('--pecas-primary-glow', v.glow || 'rgba(14,165,233,0.15)');
        root.setProperty('--pecas-success-glow', 'rgba(16,185,129,0.08)');
        var grid = document.getElementById('pecas-variant-grid');
        if (grid) {
            [].forEach.call(grid.querySelectorAll('.pecas-variant-swatch'), function(sw) {
                sw.classList.toggle('active', sw.getAttribute('data-variant') === id);
            });
        }
    }

    function initVariantPicker() {
        var btn = document.getElementById('pecas-variant-btn');
        var picker = document.getElementById('pecas-variant-picker');
        var grid = document.getElementById('pecas-variant-grid');
        if (!btn || !picker || !grid) return;
        PECAS_VARIANTS.forEach(function(v) {
            var sw = document.createElement('button');
            sw.type = 'button';
            sw.className = 'pecas-variant-swatch' + (v.id === getVariant() ? ' active' : '');
            sw.setAttribute('data-variant', v.id);
            sw.style.background = v.primary;
            sw.title = v.name;
            sw.addEventListener('click', function() {
                applyVariant(v.id);
                picker.classList.remove('open');
            });
            grid.appendChild(sw);
        });
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            picker.classList.toggle('open');
        });
        document.addEventListener('click', function() {
            picker.classList.remove('open');
        });
        picker.addEventListener('click', function(e) { e.stopPropagation(); });
    }

    function initAutocomplete() {
        var produtoInput = document.getElementById('pecas-produto');
        var fabricanteInput = document.getElementById('pecas-fabricante');
        var listProduto = document.getElementById('pecas-autocomplete-produto');
        var listFabricante = document.getElementById('pecas-autocomplete-fabricante');

        function showSuggestions(input, list, getItems) {
            var q = (input && input.value) ? input.value.trim().toLowerCase() : '';
            if (!list) return;
            list.classList.remove('open');
            list.innerHTML = '';
            if (q.length < 1) return;
            var items = getItems();
            if (items.length === 0) return;
            items.forEach(function(text) {
                var div = document.createElement('div');
                div.className = 'pecas-autocomplete-item';
                div.textContent = text;
                div.addEventListener('click', function() {
                    if (input) input.value = text;
                    list.classList.remove('open');
                });
                list.appendChild(div);
            });
            list.classList.add('open');
        }

        function hideSuggestions(list) {
            if (list) list.classList.remove('open');
        }

        if (produtoInput && listProduto) {
            produtoInput.addEventListener('input', function() {
                showSuggestions(produtoInput, listProduto, function() {
                    var estoque = getEstoque();
                    var seen = {};
                    return estoque
                        .map(function(p) { return getProdutoNome(p); })
                        .filter(function(n) {
                            if (!n || seen[n]) return false;
                            if (produtoInput.value.trim() && n.toLowerCase().indexOf(produtoInput.value.trim().toLowerCase()) < 0) return false;
                            seen[n] = true;
                            return true;
                        })
                        .slice(0, 8);
                });
            });
            produtoInput.addEventListener('blur', function() { setTimeout(function() { hideSuggestions(listProduto); }, 150); });
            produtoInput.addEventListener('focus', function() {
                if (produtoInput.value.trim()) produtoInput.dispatchEvent(new Event('input'));
            });
        }
        if (fabricanteInput && listFabricante) {
            fabricanteInput.addEventListener('input', function() {
                showSuggestions(fabricanteInput, listFabricante, function() {
                    var estoque = getEstoque();
                    var seen = {};
                    return estoque
                        .map(function(p) { return (p.fabricante || '').trim(); })
                        .filter(function(n) {
                            if (!n || seen[n]) return false;
                            if (fabricanteInput.value.trim() && n.toLowerCase().indexOf(fabricanteInput.value.trim().toLowerCase()) < 0) return false;
                            seen[n] = true;
                            return true;
                        })
                        .slice(0, 8);
                });
            });
            fabricanteInput.addEventListener('blur', function() { setTimeout(function() { hideSuggestions(listFabricante); }, 150); });
            fabricanteInput.addEventListener('focus', function() {
                if (fabricanteInput.value.trim()) fabricanteInput.dispatchEvent(new Event('input'));
            });
        }
    }

    function updateAssistente() {
        var list = document.getElementById('pecas-assistente-list');
        var empty = document.getElementById('pecas-assistente-empty');
        if (!list) return;
        var estoque = getEstoque();
        var movimentos = getMovimentos();
        var totalEstoque = estoque.reduce(function(a, p) { return a + (p.quantidade || 0); }, 0);
        var alertas = estoque.filter(function(p) { var q = p.quantidade || 0; return q > 0 && q <= 5; });
        var entradasMes = movimentos.filter(function(m) {
            if ((m.tipo || '') !== 'entrada') return false;
            var d = new Date(m.dataHora);
            var now = new Date();
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        }).length;
        var saidasMes = movimentos.filter(function(m) {
            if ((m.tipo || '') !== 'saída') return false;
            var d = new Date(m.dataHora);
            var now = new Date();
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        }).length;

        var html = '';
        if (estoque.length === 0) {
            html = '<div class="pecas-assistente-item"><i class="fas fa-lightbulb"></i><span>Cadastre a primeira peça para ver recomendações inteligentes.</span></div>';
        } else {
            var movimentosUlt90 = getMovimentos().filter(function(m) {
                var d = new Date(m.dataHora);
                if (isNaN(d.getTime())) return false;
                var hoje = new Date();
                var limite = new Date(hoje);
                limite.setDate(limite.getDate() - 90);
                return d >= limite;
            });
            var criticosProj = [];
            estoque.forEach(function(p) {
                var proj = calcularProjecaoDias(p, movimentosUlt90);
                if (proj.dias > 0 && proj.dias <= 30) criticosProj.push({ peca: p, proj: proj.dias });
            });

            if (alertas.length > 0) {
                alertas.forEach(function(p) {
                    var nome = getProdutoNome(p) || '—';
                    var q = p.quantidade || 0;
                    html += '<div class="pecas-assistente-item"><i class="fas fa-exclamation-triangle"></i><span><strong>Repor em breve:</strong> ' + escapeHtml(nome) + ' (' + q + ' un.)</span></div>';
                });
            }
            if (criticosProj.length > 0) {
                criticosProj.sort(function(a, b) { return a.proj - b.proj; });
                criticosProj.slice(0, 3).forEach(function(x) {
                    var nome = getProdutoNome(x.peca) || '—';
                    html += '<div class="pecas-assistente-item"><i class="fas fa-hourglass-half"></i><span><strong>Consumo projetado:</strong> ' + escapeHtml(nome) + ' pode zerar em ~' + x.proj + ' dia(s).</span></div>';
                });
            }
            if (entradasMes > 0) {
                html += '<div class="pecas-assistente-item"><i class="fas fa-arrow-up"></i><span><strong>Este mês:</strong> ' + entradasMes + ' entrada(s) registrada(s).</span></div>';
            }
            if (saidasMes > 0) {
                html += '<div class="pecas-assistente-item"><i class="fas fa-arrow-down"></i><span><strong>Este mês:</strong> ' + saidasMes + ' saída(s) registrada(s).</span></div>';
            }
            if (totalEstoque > 0 && html === '') {
                html = '<div class="pecas-assistente-item"><i class="fas fa-check-circle"></i><span>Estoque em dia. Total: ' + totalEstoque + ' unidades.</span></div>';
            }
        }
        list.innerHTML = html;
        if (empty) empty.style.display = html ? 'none' : 'block';
    }

    function renderEstoque() {
        try {
            var tbody = document.getElementById('pecas-tbody-estoque');
            var empty = document.getElementById('pecas-empty-estoque');
            var search = document.getElementById('pecas-search-estoque');
            if (!tbody) return;

            var estoque = getEstoque();
            var movimentos = getMovimentos();
            var q = (search && search.value) ? search.value.trim().toLowerCase() : '';
            var filterCat = (document.getElementById('pecas-filter-categoria') && document.getElementById('pecas-filter-categoria').value) || '';
            var list = estoque.filter(function(p) {
                if (!p || (p.quantidade || 0) < 0) return false;
                if (filterCat && (p.categoria || 'peca') !== filterCat) return false;
                if (!q) return true;
                var produto = getProdutoNome(p);
                var fab = (p.fabricante || '').toLowerCase();
                var conteudo = (p.conteudo || '').toLowerCase();
                var lote = (p.lote || '').toLowerCase();
                var validade = (p.validade || '').toLowerCase();
                var cat = (p.categoria || 'peca').toLowerCase();
                return produto.toLowerCase().indexOf(q) >= 0 || fab.indexOf(q) >= 0 || lote.indexOf(q) >= 0 || conteudo.indexOf(q) >= 0 || validade.indexOf(q) >= 0 || cat.indexOf(q) >= 0;
            });

            if (list.length === 0) {
                tbody.innerHTML = '';
                if (empty) empty.classList.add('visible');
            } else {
                if (empty) empty.classList.remove('visible');

                tbody.innerHTML = list.map(function(p) {
                var produto = getProdutoNome(p);
                var cat = p.categoria || 'peca';
                var proj = calcularProjecaoDias(p, movimentos);
                return '<tr data-id="' + escapeHtml(p.id || '') + '">' +
                    '<td><span class="pecas-badge-cat pecas-cat-' + escapeHtml(cat) + '">' + escapeHtml(getCategoriaLabel(cat)) + '</span></td>' +
                    '<td>' + formatarData(p.dataRecebimento || p.dataCadastro) + '</td>' +
                    '<td><strong>' + escapeHtml(produto || '—') + '</strong></td>' +
                    '<td>' + escapeHtml(p.fabricante || '—') + '</td>' +
                    '<td>' + escapeHtml(p.conteudo || '—') + '</td>' +
                    '<td>' + escapeHtml(p.lote || '—') + '</td>' +
                    '<td>' + escapeHtml(p.validade || '—') + '</td>' +
                    '<td>' + (p.quantidade || 0) + '</td>' +
                    '<td>' + proj.html + '</td>' +
                    '<td class="pecas-actions-cell">' +
                    '<button type="button" class="pecas-btn-action pecas-btn-entrada" data-id="' + escapeHtml(p.id || '') + '" title="Registrar entrada"><i class="fas fa-arrow-up"></i> ENTRADA</button>' +
                    '<button type="button" class="pecas-btn-action" data-id="' + escapeHtml(p.id || '') + '" title="Registrar saída"><i class="fas fa-arrow-down"></i> SAÍDA</button>' +
                    '<button type="button" class="pecas-btn-edit" data-id="' + escapeHtml(p.id || '') + '" title="Editar"><i class="fas fa-edit"></i></button>' +
                    '<button type="button" class="pecas-btn-detalhes" data-id="' + escapeHtml(p.id || '') + '" title="Histórico"><i class="fas fa-history"></i></button>' +
                    '<button type="button" class="pecas-btn-delete" data-id="' + escapeHtml(p.id || '') + '" title="Excluir do inventário">🗑️</button>' +
                    '</td></tr>';
            }).join('');

            tbody.querySelectorAll('.pecas-btn-entrada').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var id = safeId(this.dataset.id);
                    if (id) openModalEntrada(id);
                });
            });
            tbody.querySelectorAll('.pecas-btn-action:not(.pecas-btn-entrada)').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var id = safeId(this.dataset.id);
                    if (id) openModalUso(id);
                });
            });
            tbody.querySelectorAll('.pecas-btn-edit').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var id = safeId(this.dataset.id);
                    if (id) openModalEditar(id);
                });
            });
            tbody.querySelectorAll('.pecas-btn-detalhes').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var id = safeId(this.dataset.id);
                    if (id) openModalDetalhes(id);
                });
            });
            tbody.querySelectorAll('.pecas-btn-delete').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var id = safeId(this.dataset.id);
                    if (!id) return;
                    if (!confirm('Remover esta peça do inventário e todos os movimentos associados?')) return;
                    var estoque = getEstoque().filter(function(p) { return p && p.id !== id; });
                    var movimentos = getMovimentos().filter(function(m) { return !m || m.pecaId !== id; });
                    saveEstoque(estoque);
                    saveMovimentos(movimentos);
                    renderEstoque();
                    renderMovimentos();
                    updateDashboards();
                    updateAssistente();
                    updateAvencer();
                });
            });
            }
            var tableWrap = document.getElementById('pecas-table-wrap');
            var cardsContainer = document.getElementById('pecas-estoque-cards');
            if (estoqueViewMode === 'cards') {
                renderEstoqueCards(list, movimentos);
                if (tableWrap) tableWrap.style.display = 'none';
                if (cardsContainer) { cardsContainer.style.display = 'grid'; }
            } else {
                if (tableWrap) tableWrap.style.display = '';
                if (cardsContainer) cardsContainer.style.display = 'none';
            }
            document.querySelectorAll('.pecas-view-btn[data-view]').forEach(function(b) {
                b.classList.toggle('active', (b.dataset.view || '') === estoqueViewMode);
            });
        } catch (err) { console.error('Erro ao renderizar estoque:', err); }
    }

    function renderEstoqueCards(list, movimentos) {
        try {
            var container = document.getElementById('pecas-estoque-cards');
            if (!container) return;
            if (!Array.isArray(list) || list.length === 0) {
                container.innerHTML = '';
                return;
            }
            var html = list.map(function(p) {
                var produto = getProdutoNome(p);
                var cat = p.categoria || 'peca';
                var proj = calcularProjecaoDias(p, movimentos);
                var id = escapeHtml(p.id || '');
                return '<div class="pecas-estoque-card-item" data-id="' + id + '">' +
                    '<div class="pecas-estoque-card-header">' +
                    '<p class="pecas-estoque-card-produto">' + escapeHtml(produto || '—') + '</p>' +
                    '<span class="pecas-badge-cat pecas-cat-' + escapeHtml(cat) + ' pecas-estoque-card-cat">' + escapeHtml(getCategoriaLabel(cat)) + '</span>' +
                    '</div>' +
                    '<div class="pecas-estoque-card-meta">' +
                    (p.fabricante ? '<span><i class="fas fa-industry"></i> ' + escapeHtml(p.fabricante) + '</span>' : '') +
                    (p.conteudo ? '<span><i class="fas fa-vial"></i> ' + escapeHtml(p.conteudo) + '</span>' : '') +
                    (p.validade ? '<span><i class="fas fa-calendar"></i> ' + escapeHtml(p.validade) + '</span>' : '') +
                    '</div>' +
                    '<div class="pecas-estoque-card-qtd">' + (p.quantidade || 0) + ' un.</div>' +
                    '<div class="pecas-estoque-card-projec">' + proj.html + '</div>' +
                    '<div class="pecas-estoque-card-actions">' +
                    '<div class="pecas-estoque-card-actions-primary">' +
                    '<button type="button" class="pecas-btn-action pecas-btn-entrada pecas-card-btn-flow" data-id="' + id + '" title="Registrar entrada"><i class="fas fa-arrow-up" aria-hidden="true"></i> ENTRADA</button>' +
                    '<button type="button" class="pecas-btn-action pecas-btn-saida pecas-card-btn-flow" data-id="' + id + '" title="Registrar saída"><i class="fas fa-arrow-down" aria-hidden="true"></i> SAÍDA</button>' +
                    '</div>' +
                    '<div class="pecas-estoque-card-actions-secondary">' +
                    '<button type="button" class="pecas-btn-edit pecas-card-tool-btn" data-id="' + id + '" title="Editar"><span class="pecas-sr-only">Editar</span><i class="fas fa-edit" aria-hidden="true"></i></button>' +
                    '<button type="button" class="pecas-btn-detalhes pecas-card-tool-btn" data-id="' + id + '" title="Histórico"><span class="pecas-sr-only">Histórico</span><i class="fas fa-history" aria-hidden="true"></i></button>' +
                    '<button type="button" class="pecas-btn-delete pecas-card-tool-btn pecas-card-tool-btn-danger" data-id="' + id + '" title="Excluir"><span class="pecas-sr-only">Excluir</span><i class="fas fa-trash-alt" aria-hidden="true"></i></button>' +
                    '</div></div></div>';
            }).join('');
            container.innerHTML = html;
            container.querySelectorAll('.pecas-btn-entrada').forEach(function(btn) {
                btn.addEventListener('click', function() { var id = safeId(this.dataset.id); if (id) openModalEntrada(id); });
            });
            container.querySelectorAll('.pecas-btn-action:not(.pecas-btn-entrada)').forEach(function(btn) {
                btn.addEventListener('click', function() { var id = safeId(this.dataset.id); if (id) openModalUso(id); });
            });
            container.querySelectorAll('.pecas-btn-edit').forEach(function(btn) {
                btn.addEventListener('click', function() { var id = safeId(this.dataset.id); if (id) openModalEditar(id); });
            });
            container.querySelectorAll('.pecas-btn-detalhes').forEach(function(btn) {
                btn.addEventListener('click', function() { var id = safeId(this.dataset.id); if (id) openModalDetalhes(id); });
            });
            container.querySelectorAll('.pecas-btn-delete').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var id = safeId(this.dataset.id);
                    if (!id || !confirm('Remover esta peça do inventário e todos os movimentos associados?')) return;
                    var estoque = getEstoque().filter(function(p) { return p && p.id !== id; });
                    var movimentosFiltered = getMovimentos().filter(function(m) { return !m || m.pecaId !== id; });
                    saveEstoque(estoque);
                    saveMovimentos(movimentosFiltered);
                    renderEstoque();
                    renderMovimentos();
                    updateDashboards();
                    updateAssistente();
                    updateAvencer();
                });
            });
        } catch (err) { console.error('Erro ao renderizar cards de estoque:', err); }
    }

    function renderMovimentos() {
        try {
            var tbody = document.getElementById('pecas-tbody-movimentos');
            var empty = document.getElementById('pecas-empty-movimentos');
            var search = document.getElementById('pecas-search-movimentos');
            if (!tbody) return;

            var movimentos = getMovimentos();
            var q = (search && search.value) ? search.value.trim().toLowerCase() : '';
            var list = movimentos.filter(function(m) {
                if (!q) return true;
                var produto = (m.produto || '').toLowerCase();
                var obs = (m.observacao || '').toLowerCase();
                return produto.indexOf(q) >= 0 || obs.indexOf(q) >= 0;
            });

            list.sort(function(a, b) {
                return new Date(b.dataHora || 0) - new Date(a.dataHora || 0);
            });

            if (list.length === 0) {
                tbody.innerHTML = '';
                if (empty) empty.classList.add('visible');
                return;
            }
            if (empty) empty.classList.remove('visible');

            tbody.innerHTML = list.map(function(m) {
                var tipo = (m.tipo || 'saída') === 'entrada' ? 'Entrada' : 'Saída';
                var cls = (m.tipo || '') === 'entrada' ? 'pecas-mov-entrada' : 'pecas-mov-saida';
                return '<tr><td>' + formatarDataHora(m.dataHora) + '</td>' +
                    '<td><span class="pecas-badge ' + cls + '">' + escapeHtml(tipo) + '</span></td>' +
                    '<td><strong>' + escapeHtml(m.produto || '—') + '</strong></td>' +
                    '<td>' + (m.quantidade || 0) + '</td>' +
                    '<td>' + escapeHtml(m.observacao || '—') + '</td></tr>';
            }).join('');
        } catch (err) { console.error('Erro ao renderizar movimentos:', err); }
    }

    function openModalEntrada(id) {
        id = safeId(id);
        if (!id) return;
        try {
            var estoque = getEstoque();
            var peca = estoque.find(function(p) { return p && p.id === id; });
            if (!peca) return;

            var overlay = document.getElementById('pecas-modal-entrada');
            var form = document.getElementById('pecas-form-entrada');
            var idInput = document.getElementById('pecas-entrada-id');
            var nomeEl = document.getElementById('pecas-entrada-nome');
            var qtdInput = document.getElementById('pecas-entrada-qtd');
            var obsInput = document.getElementById('pecas-entrada-obs');
            var cancelBtn = document.getElementById('pecas-modal-entrada-cancel');

            if (!overlay || !form) return;

            idInput.value = id;
            nomeEl.textContent = getProdutoNome(peca) || '—';
            qtdInput.value = 1;
            qtdInput.min = 1;
            obsInput.value = '';

            overlay.style.display = 'flex';
            cancelBtn.onclick = function() { overlay.style.display = 'none'; };
            overlay.onclick = function(e) {
                if (e.target === overlay) overlay.style.display = 'none';
            };

            form.onsubmit = function(e) {
                e.preventDefault();
                try {
                    var qtd = safeInt(qtdInput.value, 1, 1, MAX_QUANTIDADE);
                    var obsVal = sanitizeString(obsInput.value, MAX_OBS);

                    var arr = getEstoque();
                    var idx = arr.findIndex(function(p) { return p && p.id === id; });
                    if (idx < 0) return;

                    arr[idx].quantidade = (arr[idx].quantidade || 0) + qtd;
                    saveEstoque(arr);

                    var movimentos = getMovimentos();
                    movimentos.unshift({
                        id: 'mov-' + Date.now(),
                        pecaId: id,
                        tipo: 'entrada',
                        produto: getProdutoNome(peca),
                        quantidade: qtd,
                        observacao: obsVal,
                        dataHora: new Date().toISOString()
                    });
                    saveMovimentos(movimentos);

                    overlay.style.display = 'none';
                    renderEstoque();
                    renderMovimentos();
                    updateDashboards();
                } catch (err) { console.error('Erro ao registrar entrada:', err); }
            };
        } catch (err) { console.error('Erro ao abrir modal entrada:', err); }
    }

    function openModalUso(id) {
        id = safeId(id);
        if (!id) return;
        try {
            var estoque = getEstoque();
            var peca = estoque.find(function(p) { return p && p.id === id; });
            if (!peca) return;

            var overlay = document.getElementById('pecas-modal-uso');
            var form = document.getElementById('pecas-form-uso');
            var idInput = document.getElementById('pecas-uso-id');
            var nomeEl = document.getElementById('pecas-uso-nome');
            var qtdInput = document.getElementById('pecas-uso-qtd');
            var obsInput = document.getElementById('pecas-uso-obs');
            var cancelBtn = document.getElementById('pecas-modal-uso-cancel');

            if (!overlay || !form) return;

            idInput.value = id;
            nomeEl.textContent = getProdutoNome(peca) || '—';
            qtdInput.value = 0;
            qtdInput.min = 0;
            qtdInput.max = peca.quantidade || 1;
            obsInput.value = '';

            overlay.style.display = 'flex';
            cancelBtn.onclick = function() { overlay.style.display = 'none'; };
            overlay.onclick = function(e) {
                if (e.target === overlay) overlay.style.display = 'none';
            };

            form.onsubmit = function(e) {
                e.preventDefault();
                try {
                    var qtd = safeInt(qtdInput.value, 0, 1, peca.quantidade || 1);
                    if (qtd < 1) return;

                    var obsVal = sanitizeString(obsInput.value, MAX_OBS);
                    var movimentos = getMovimentos();
                    movimentos.unshift({
                        id: 'mov-' + Date.now(),
                        pecaId: id,
                        tipo: 'saída',
                        produto: getProdutoNome(peca),
                        quantidade: qtd,
                        observacao: obsVal,
                        dataHora: new Date().toISOString()
                    });
                    saveMovimentos(movimentos);

                    var arr = getEstoque();
                    var idx = arr.findIndex(function(p) { return p && p.id === id; });
                    if (idx >= 0) {
                        arr[idx].quantidade = Math.max(0, (arr[idx].quantidade || 0) - qtd);
                        saveEstoque(arr);
                    }

                    overlay.style.display = 'none';
                    renderEstoque();
                    renderMovimentos();
                    updateDashboards();
                } catch (err) { console.error('Erro ao registrar saída:', err); }
            };
        } catch (err) { console.error('Erro ao abrir modal uso:', err); }
    }

    function getCurrentUser() {
        try {
            return localStorage.getItem('current_user') || localStorage.getItem('axis_pecas_usuario') || '';
        } catch (_) { return ''; }
    }

    function openModalEditar(id) {
        id = safeId(id);
        if (!id) return;
        try {
            var estoque = getEstoque();
            var peca = estoque.find(function(p) { return p && p.id === id; });
            if (!peca) return;

            var overlay = document.getElementById('pecas-modal-editar');
            var form = document.getElementById('pecas-form-editar');
            var idInput = document.getElementById('pecas-editar-id');
            var produtoInput = document.getElementById('pecas-editar-produto');
            var fabricanteInput = document.getElementById('pecas-editar-fabricante');
            var conteudoInput = document.getElementById('pecas-editar-conteudo');
            var loteInput = document.getElementById('pecas-editar-lote');
            var validadeInput = document.getElementById('pecas-editar-validade');
            var qtdInput = document.getElementById('pecas-editar-quantidade');
            var dataRecInput = document.getElementById('pecas-editar-data-recebimento');
            var localInput = document.getElementById('pecas-editar-local');
            var obsInput = document.getElementById('pecas-editar-obs');
            var cancelBtn = document.getElementById('pecas-modal-editar-cancel');

            if (!overlay || !form) return;

            idInput.value = id;
            var catInput = document.getElementById('pecas-editar-categoria');
            if (catInput) catInput.value = peca.categoria || 'peca';
            produtoInput.value = getProdutoNome(peca) || '';
            fabricanteInput.value = peca.fabricante || '';
            conteudoInput.value = peca.conteudo || '';
            loteInput.value = peca.lote || '';
            validadeInput.value = peca.validade || '';
            qtdInput.value = peca.quantidade || 0;
            var dr = peca.dataRecebimento || peca.dataCadastro;
            if (dr) {
                try {
                    var d = new Date(dr);
                    if (!isNaN(d.getTime())) dataRecInput.value = d.toISOString().slice(0, 10);
                } catch (_) {}
            }
            localInput.value = peca.local || '';
            obsInput.value = peca.observacao || '';

            overlay.style.display = 'flex';
            cancelBtn.onclick = function() { overlay.style.display = 'none'; };
            overlay.onclick = function(e) { if (e.target === overlay) overlay.style.display = 'none'; };

            form.onsubmit = function(e) {
                e.preventDefault();
                try {
                    var arr = getEstoque();
                    var idx = arr.findIndex(function(p) { return p && p.id === id; });
                    if (idx < 0) return;

                    var produtoVal = sanitizeString(produtoInput && produtoInput.value, MAX_PRODUTO);
                    if (!produtoVal) return;

                    var catVal = (catInput && catInput.value) ? catInput.value : 'peca';
                    arr[idx].categoria = catVal;
                    arr[idx].produto = produtoVal;
                    arr[idx].nome = produtoVal;
                    arr[idx].fabricante = sanitizeString(fabricanteInput && fabricanteInput.value, MAX_FABRICANTE);
                    arr[idx].conteudo = sanitizeString(conteudoInput && conteudoInput.value, MAX_CONTEUDO);
                    arr[idx].lote = sanitizeString(loteInput && loteInput.value, MAX_LOTE);
                    arr[idx].validade = sanitizeString(validadeInput && validadeInput.value, MAX_VALIDADE);
                    arr[idx].quantidade = safeInt(qtdInput && qtdInput.value, 0, 0, MAX_QUANTIDADE);
                    var dataVal = dataRecInput && dataRecInput.value;
                    if (dataVal) arr[idx].dataRecebimento = new Date(dataVal).toISOString();
                    arr[idx].local = sanitizeString(localInput && localInput.value, MAX_LOCAL);
                    arr[idx].observacao = sanitizeString(obsInput && obsInput.value, MAX_OBS);

                    if (!Array.isArray(arr[idx].historico)) arr[idx].historico = [];
                    arr[idx].historico.push({
                        data: new Date().toISOString(),
                        acao: 'edicao',
                        alteracoes: [{ campo: 'Edição', de: '', para: 'atualizado' }],
                        usuario: getCurrentUser() || null
                    });

                    saveEstoque(arr);
                    overlay.style.display = 'none';
                    renderEstoque();
                    updateDashboards();
                } catch (err) { console.error('Erro ao editar peça:', err); }
            };
        } catch (err) { console.error('Erro ao abrir modal editar:', err); }
    }

    function openModalDetalhes(id) {
        id = safeId(id);
        if (!id) return;
        try {
            var estoque = getEstoque();
            var peca = estoque.find(function(p) { return p && p.id === id; });
            if (!peca) return;

            var overlay = document.getElementById('pecas-modal-detalhes');
            var content = document.getElementById('pecas-detalhes-conteudo');
            var closeBtn = document.getElementById('pecas-modal-detalhes-close');

            if (!overlay || !content) return;

            var criadoPor = (peca.historico && peca.historico[0] && peca.historico[0].acao === 'criacao' && peca.historico[0].usuario) ? peca.historico[0].usuario : getCurrentUser();
            var html = '<div class="pecas-detalhes-section pecas-detalhes-colorido">';
            html += '<div class="pecas-detalhes-card pecas-detalhes-criado">';
            html += '<h4>CRIADO EM:</h4><p class="pecas-detalhes-valor">' + formatarDataHoraCriacao(peca.dataCadastro || peca.dataRecebimento) + '</p>';
            if (criadoPor) html += '<h4>POR:</h4><p class="pecas-detalhes-valor pecas-detalhes-usuario-nome">' + escapeHtml((criadoPor || '').toUpperCase()) + '</p>';
            html += '</div>';

            var historicoEdicoes = (peca.historico || []).filter(function(h) { return h.acao !== 'criacao'; });
            if (historicoEdicoes.length > 0) {
                html += '<h4>HISTÓRICO DE ALTERAÇÕES</h4>';
                historicoEdicoes.forEach(function(h) {
                    var usuarioNome = (h.usuario || getCurrentUser() || '').toString().toUpperCase();
                    html += '<div class="pecas-detalhes-card pecas-detalhes-criado">';
                    html += '<h4>ALTERADO EM:</h4><p class="pecas-detalhes-valor">' + formatarDataHoraCriacao(h.data) + '</p>';
                    if (usuarioNome) html += '<h4>POR:</h4><p class="pecas-detalhes-valor pecas-detalhes-usuario-nome">' + escapeHtml(usuarioNome) + '</p>';
                    if (h.alteracoes && h.alteracoes.length > 0) {
                        html += '<ul class="pecas-detalhes-historico-lista">';
                        h.alteracoes.forEach(function(a) {
                            html += '<li>' + escapeHtml(a.campo) + ': "' + escapeHtml(String(a.de)) + '" → "' + escapeHtml(String(a.para)) + '"</li>';
                        });
                        html += '</ul>';
                    }
                    html += '</div>';
                });
            } else {
                html += '<p class="pecas-detalhes-empty">Nenhuma edição registrada.</p>';
            }
            html += '</div>';

            content.innerHTML = html;
            overlay.style.display = 'flex';
            closeBtn.onclick = function() { overlay.style.display = 'none'; };
            overlay.onclick = function(e) { if (e.target === overlay) overlay.style.display = 'none'; };
        } catch (err) { console.error('Erro ao abrir modal detalhes:', err); }
    }

    function updateDashboards() {
        try {
            var estoque = getEstoque();
            var movimentos = getMovimentos();
            var agora = new Date();
            var anoAtual = agora.getFullYear();
            var mesAtual = agora.getMonth();

            var totalEstoque = estoque.reduce(function(a, p) { return a + (p.quantidade || 0); }, 0);
            var elTotal = document.getElementById('pecas-dash-estoque-total');
            if (elTotal) elTotal.textContent = totalEstoque;

            var entradasMes = movimentos.filter(function(m) {
                if ((m.tipo || '') !== 'entrada') return false;
                try {
                    var d = new Date(m.dataHora);
                    return d.getFullYear() === anoAtual && d.getMonth() === mesAtual;
                } catch (_) { return false; }
            });
            var totalEntradas = entradasMes.reduce(function(a, m) { return a + (m.quantidade || 0); }, 0);
            var elEnt = document.getElementById('pecas-dash-entradas-mes');
            if (elEnt) elEnt.textContent = totalEntradas;

            var saidasMes = movimentos.filter(function(m) {
                if ((m.tipo || '') !== 'saída') return false;
                try {
                    var d = new Date(m.dataHora);
                    return d.getFullYear() === anoAtual && d.getMonth() === mesAtual;
                } catch (_) { return false; }
            });
            var totalSaidas = saidasMes.reduce(function(a, m) { return a + (m.quantidade || 0); }, 0);
            var elSai = document.getElementById('pecas-dash-saidas-mes');
            if (elSai) elSai.textContent = totalSaidas;

            var totalItens = estoque.filter(function(p) { return (p.quantidade || 0) > 0; }).length;
            var elSkus = document.getElementById('pecas-dash-skus');
            if (elSkus) elSkus.textContent = totalItens;

            var movsMesList = movimentos.filter(function(m) {
                try {
                    var d = new Date(m.dataHora);
                    return d.getFullYear() === anoAtual && d.getMonth() === mesAtual;
                } catch (_) { return false; }
            });
            var elMovs = document.getElementById('pecas-dash-movs-mes');
            if (elMovs) elMovs.textContent = movsMesList.length;

            var ultE = movsMesList.filter(function(m) { return (m.tipo || '') === 'entrada'; })
                .sort(function(a, b) { return new Date(b.dataHora) - new Date(a.dataHora); })[0];
            var elUe = document.getElementById('pecas-dash-ultima-entrada');
            if (elUe) elUe.textContent = ultE ? formatarDataHora(ultE.dataHora) : '—';

            var ultS = movsMesList.filter(function(m) { return (m.tipo || '') === 'saída'; })
                .sort(function(a, b) { return new Date(b.dataHora) - new Date(a.dataHora); })[0];
            var elUs = document.getElementById('pecas-dash-ultima-saida');
            if (elUs) elUs.textContent = ultS ? formatarDataHora(ultS.dataHora) : '—';

            var elTm = document.getElementById('pecas-dash-total-movs');
            if (elTm) elTm.textContent = String(movimentos.length);

            var catsAtivas = {};
            estoque.forEach(function(p) {
                if ((p.quantidade || 0) > 0) catsAtivas[p.categoria || 'peca'] = true;
            });
            var elCats = document.getElementById('pecas-dash-cats');
            if (elCats) elCats.textContent = Object.keys(catsAtivas).length;

            updateChart(totalEstoque, totalEntradas, totalSaidas);
            updateChartBars();
            updateChartCategoria();
            updateAlertas();
            updateAssistente();
            updateAvencer();
            var countEl = document.getElementById('pecas-count-itens');
            if (countEl) countEl.textContent = totalItens + (totalItens === 1 ? ' item' : ' itens');
        } catch (err) { console.error('Erro ao atualizar dashboards:', err); }
    }

    var pecasChartInstance = null;
    function updateChart(totalEstoque, totalEntradas, totalSaidas) {
        try {
            var canvas = document.getElementById('pecas-chart');
            if (!canvas || typeof Chart === 'undefined') return;
            var ctx = canvas.getContext('2d');
            if (totalEstoque == null || totalEntradas == null || totalSaidas == null) {
                var estoque = getEstoque();
                var movimentos = getMovimentos();
                var agora = new Date();
                totalEstoque = estoque.reduce(function(a, p) { return a + (p.quantidade || 0); }, 0);
                totalEntradas = movimentos.filter(function(m) {
                    if ((m.tipo || '') !== 'entrada') return false;
                    try { var d = new Date(m.dataHora); return d.getFullYear() === agora.getFullYear() && d.getMonth() === agora.getMonth(); } catch (_) { return false; }
                }).reduce(function(a, m) { return a + (m.quantidade || 0); }, 0);
                totalSaidas = movimentos.filter(function(m) {
                    if ((m.tipo || '') !== 'saída') return false;
                    try { var d = new Date(m.dataHora); return d.getFullYear() === agora.getFullYear() && d.getMonth() === agora.getMonth(); } catch (_) { return false; }
                }).reduce(function(a, m) { return a + (m.quantidade || 0); }, 0);
            }
            var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            var textColor = isDark ? '#94a3b8' : '#64748b';
            if (pecasChartInstance) {
                pecasChartInstance.data.datasets[0].data = [totalEstoque, totalEntradas, totalSaidas];
                pecasChartInstance.options.plugins.legend.labels.color = textColor;
                pecasChartInstance.update('none');
                return;
            }
            var baseColors = ['#0ea5e9', '#10b981', '#ef4444'];
            var highlightColors = ['#38bdf8', '#34d399', '#f87171'];
            pecasChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Em estoque', 'Entradas (mês)', 'Saídas (mês)'],
                    datasets: [{
                        data: [totalEstoque, totalEntradas, totalSaidas],
                        backgroundColor: baseColors.map(function(_, i) {
                            var g = ctx.createLinearGradient(0, 0, 0, 220);
                            g.addColorStop(0, highlightColors[i]);
                            g.addColorStop(0.5, baseColors[i]);
                            g.addColorStop(1, baseColors[i]);
                            return g;
                        }),
                        borderWidth: 2,
                        borderColor: 'rgba(255,255,255,0.5)',
                        hoverBorderWidth: 3,
                        hoverShadowBlur: 12,
                        hoverShadowOffsetY: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '58%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: textColor, font: { size: 11 }, padding: 12 }
                        }
                    }
                }
            });
        } catch (e) { console.warn('Chart peças:', e); }
    }

    var pecasChartBarsInstance = null;
    function updateChartBars() {
        try {
            var canvas = document.getElementById('pecas-chart-bars');
            if (!canvas || typeof Chart === 'undefined') return;
            var estoque = getEstoque();
            var top5 = estoque
                .filter(function(p) { return (p.quantidade || 0) > 0; })
                .sort(function(a, b) { return (b.quantidade || 0) - (a.quantidade || 0); })
                .slice(0, 5);
            var labels = top5.map(function(p) {
                var nome = getProdutoNome(p);
                return nome.length > 18 ? nome.substring(0, 16) + '…' : nome;
            });
            var data = top5.map(function(p) { return p.quantidade || 0; });
            var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            var gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
            if (pecasChartBarsInstance) {
                pecasChartBarsInstance.data.labels = labels;
                pecasChartBarsInstance.data.datasets[0].data = data;
                pecasChartBarsInstance.update('none');
                return;
            }
            var barCtx = canvas.getContext('2d');
            pecasChartBarsInstance = new Chart(barCtx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: [
                            '#0ea5e9',
                            '#10b981',
                            '#8b5cf6',
                            '#f97316',
                            '#ec4899'
                        ],
                        borderWidth: 2,
                        borderColor: 'rgba(255,255,255,0.7)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 11 } }
                        }
                    },
                    cutout: '55%'
                }
            });
        } catch (e) { console.warn('Chart bars:', e); }
    }

    var pecasChartCategoriaInstance = null;
    function updateChartCategoria() {
        try {
            var canvas = document.getElementById('pecas-chart-categoria');
            if (!canvas || typeof Chart === 'undefined') return;
            var estoque = getEstoque();
            var byCat = { peca: 0, acessorio: 0, limpeza: 0 };
            estoque.forEach(function(p) {
                var c = p.categoria || 'peca';
                if (byCat[c] != null) byCat[c] += (p.quantidade || 0); else byCat[c] = (p.quantidade || 0);
            });
            var labels = ['Peça', 'Acessório', 'Produto de limpeza'];
            var data = [byCat.peca, byCat.acessorio, byCat.limpeza];
            var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            var textColor = isDark ? '#94a3b8' : '#64748b';
            var colors = ['#0ea5e9', '#10b981', '#8b5cf6'];
            if (pecasChartCategoriaInstance) {
                pecasChartCategoriaInstance.data.datasets[0].data = data;
                pecasChartCategoriaInstance.options.plugins.legend.labels.color = textColor;
                pecasChartCategoriaInstance.update('none');
                return;
            }
            pecasChartCategoriaInstance = new Chart(canvas.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colors,
                        borderWidth: 2,
                        borderColor: 'rgba(255,255,255,0.7)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '55%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: textColor, font: { size: 11 } }
                        }
                    }
                }
            });
        } catch (e) { console.warn('Chart categoria:', e); }
    }

    function updateAlertas() {
        try {
            var list = document.getElementById('pecas-alertas-list');
            if (!list) return;
            var estoque = getEstoque();
            var baixo = 5;
            var alertas = estoque.filter(function(p) {
                var q = p.quantidade || 0;
                return q > 0 && q <= baixo;
            });
            if (alertas.length === 0) {
                list.innerHTML = '<p class="pecas-alertas-empty" id="pecas-alertas-empty">Nenhum alerta.</p>';
                return;
            }
            var html = '';
            alertas.forEach(function(p) {
                var nome = getProdutoNome(p) || '—';
                var qtd = p.quantidade || 0;
                var cls = qtd <= 2 ? 'danger' : '';
                html += '<div class="pecas-alerta-item ' + cls + '"><span><strong>' + escapeHtml(nome.length > 25 ? nome.substring(0, 23) + '…' : nome) + '</strong> — ' + qtd + ' un.</span></div>';
            });
            list.innerHTML = html;
        } catch (e) { console.warn('Alertas:', e); }
    }

    function exportarMovimentos() {
        try {
            var movimentos = getMovimentos();
            if (!Array.isArray(movimentos) || movimentos.length === 0) {
                alert('Nenhum movimento para exportar.');
                return;
            }
            var base = 'pecas-movimentos-' + new Date().toISOString().slice(0, 10);
            var bom = '\uFEFF';
            var csv = 'DATA/HORA;TIPO;PRODUTO;UNIDADES;OBSERVAÇÃO\n';
            movimentos.forEach(function(m) {
                var data = formatarDataHora(m.dataHora);
                var tipo = (m.tipo || 'saída') === 'entrada' ? 'Entrada' : 'Saída';
                var prod = (m.produto || '').replace(/;/g, ',');
                var obs = (m.observacao || '').replace(/;/g, ',').replace(/\n/g, ' ');
                csv += data + ';' + tipo + ';' + prod + ';' + (m.quantidade || 0) + ';' + obs + '\n';
            });
            var blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = base + '.csv';
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) { console.error('Erro ao exportar:', err); }
    }

    var MESES_PT = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    function parseValidade(str) {
        if (!str || typeof str !== 'string') return null;
        var s = str.trim().toLowerCase();
        if (!s) return null;
        var match = s.match(/^(\d{1,2})\s*[\/\-]\s*(\d{2,4})$/);
        if (match) {
            var mes = parseInt(match[1], 10) - 1;
            var ano = parseInt(match[2], 10);
            if (ano < 100) ano += 2000;
            if (mes >= 0 && mes <= 11 && ano >= 2000) {
                var d = new Date(ano, mes + 1, 0);
                return isNaN(d.getTime()) ? null : d;
            }
        }
        for (var i = 0; i < MESES_PT.length; i++) {
            if (s.indexOf(MESES_PT[i]) >= 0) {
                var rest = s.replace(MESES_PT[i], '').replace(/[\/\-\s]/g, '').trim();
                var ano = parseInt(rest, 10);
                if (ano && ano >= 2000) {
                    var d = new Date(ano, i + 1, 0);
                    return isNaN(d.getTime()) ? null : d;
                }
                if (ano && ano < 100) {
                    var d = new Date(2000 + ano, i + 1, 0);
                    return isNaN(d.getTime()) ? null : d;
                }
            }
        }
        return null;
    }

    function getAvencer(dias) {
        var estoque = getEstoque();
        var hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        var limite = new Date(hoje);
        limite.setDate(limite.getDate() + (dias || 90));
        return estoque.filter(function(p) {
            if ((p.quantidade || 0) <= 0) return false;
            var d = parseValidade(p.validade);
            if (!d) return false;
            d.setHours(0, 0, 0, 0);
            return d <= limite;
        }).map(function(p) {
            var d = parseValidade(p.validade);
            return { peca: p, dataValidade: d };
        }).sort(function(a, b) {
            return (a.dataValidade ? a.dataValidade.getTime() : 0) - (b.dataValidade ? b.dataValidade.getTime() : 0);
        });
    }

    // Projeção: média de saídas diárias nos últimos 90 dias e dias até zerar
    function calcularProjecaoDias(peca, movimentos) {
        if (!peca || (peca.quantidade || 0) <= 0) {
            return { dias: 0, html: '<span class="pecas-projec-badge pecas-projec-none">—</span>' };
        }
        var qtdAtual = peca.quantidade || 0;
        var todosMov = Array.isArray(movimentos) ? movimentos : getMovimentos();
        var hoje = new Date();
        var limite = new Date(hoje);
        limite.setDate(limite.getDate() - 90);
        var saidas = todosMov.filter(function(m) {
            if ((m.tipo || '') !== 'saída') return false;
            if (m.pecaId !== peca.id) return false;
            var d = new Date(m.dataHora);
            if (isNaN(d.getTime())) return false;
            return d >= limite;
        });
        if (saidas.length === 0) {
            return { dias: 0, html: '<span class="pecas-projec-badge pecas-projec-none">sem histórico</span>' };
        }
        var totalSaido = saidas.reduce(function(a, m) { return a + (m.quantidade || 0); }, 0);
        if (totalSaido <= 0) {
            return { dias: 0, html: '<span class="pecas-projec-badge pecas-projec-none">sem histórico</span>' };
        }
        var diasPeriodo = 90;
        var mediaDia = totalSaido / diasPeriodo;
        if (mediaDia <= 0.01) {
            return { dias: 0, html: '<span class="pecas-projec-badge pecas-projec-none">baixo uso</span>' };
        }
        var diasRestantes = Math.round(qtdAtual / mediaDia);
        var cls;
        if (diasRestantes > 60) cls = 'pecas-projec-safe';
        else if (diasRestantes > 30) cls = 'pecas-projec-att';
        else cls = 'pecas-projec-critical';
        var label = diasRestantes + ' d';
        return { dias: diasRestantes, html: '<span class="pecas-projec-badge ' + cls + '">' + label + '</span>' };
    }

    function updateAvencer() {
        try {
            var list = document.getElementById('pecas-avencer-list');
            var empty = document.getElementById('pecas-avencer-empty');
            if (!list) return;
            var itens = getAvencer(90);
            if (empty) empty.style.display = itens.length === 0 ? 'block' : 'none';
            if (itens.length === 0) {
                list.innerHTML = '';
                return;
            }
            var hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            var html = '';
            itens.slice(0, 10).forEach(function(x) {
                var p = x.peca;
                var nome = getProdutoNome(p) || '—';
                var valStr = (p.validade || '').trim() || '—';
                var d = x.dataValidade;
                var vencido = d && d.getTime() < hoje.getTime();
                var cls = vencido ? 'pecas-avencer-item vencido' : 'pecas-avencer-item';
                html += '<div class="' + cls + '"><span><strong>' + escapeHtml(nome.length > 22 ? nome.substring(0, 20) + '…' : nome) + '</strong> — ' + escapeHtml(valStr) + (vencido ? ' (vencido)' : '') + '</span></div>';
            });
            list.innerHTML = html;
        } catch (e) { console.warn('A vencer:', e); }
    }

    function exportarEstoqueCSV() {
        try {
            var estoque = getEstoque();
            if (!Array.isArray(estoque) || estoque.length === 0) {
                alert('Nenhum item no estoque para exportar.');
                return;
            }
            var bom = '\uFEFF';
            var csv = 'PRODUTO;FABRICANTE;CONTEÚDO;LOTE;VALIDADE;UNIDADES;DATA RECEBIDA;LOCAL;OBSERVAÇÃO\n';
            estoque.forEach(function(p) {
                var prod = (getProdutoNome(p) || '').replace(/;/g, ',');
                var fab = (p.fabricante || '').replace(/;/g, ',');
                var cont = (p.conteudo || '').replace(/;/g, ',');
                var lote = (p.lote || '').replace(/;/g, ',');
                var val = (p.validade || '').replace(/;/g, ',');
                var qtd = p.quantidade || 0;
                var data = formatarData(p.dataRecebimento || p.dataCadastro || '');
                var local = (p.local || '').replace(/;/g, ',');
                var obs = (p.observacao || '').replace(/;/g, ',').replace(/\n/g, ' ');
                csv += prod + ';' + fab + ';' + cont + ';' + lote + ';' + val + ';' + qtd + ';' + data + ';' + local + ';' + obs + '\n';
            });
            var blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'pecas-estoque-' + new Date().toISOString().slice(0, 10) + '.csv';
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) { console.error('Erro ao exportar estoque:', err); }
    }

    function backupDados() {
        try {
            var dados = { estoque: getEstoque(), movimentos: getMovimentos(), exportadoEm: new Date().toISOString() };
            var json = JSON.stringify(dados, null, 2);
            var blob = new Blob([json], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'pecas-backup-' + new Date().toISOString().slice(0, 10) + '.json';
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) { console.error('Erro no backup:', err); }
    }

    function restaurarDados(file) {
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function() {
            try {
                var dados = JSON.parse(reader.result);
                if (!dados) return;
                var estoque = Array.isArray(dados.estoque) ? dados.estoque : [];
                var movimentos = Array.isArray(dados.movimentos) ? dados.movimentos : [];
                saveEstoque(estoque);
                saveMovimentos(movimentos);
                renderEstoque();
                renderMovimentos();
                updateDashboards();
                updateAssistente();
                updateAvencer();
                alert('Dados restaurados com sucesso. Estoque: ' + estoque.length + ' itens. Movimentos: ' + movimentos.length + '.');
            } catch (e) {
                alert('Ficheiro inválido. Use um JSON exportado por "Backup".');
            }
        };
        reader.readAsText(file, 'UTF-8');
    }

    function setupTabs() {
        try {
            var validTabs = ['estoque', 'movimentos'];
            document.querySelectorAll('.pecas-tab[data-tab]').forEach(function(tab) {
                tab.addEventListener('click', function() {
                    var target = (this.dataset && this.dataset.tab) ? String(this.dataset.tab) : '';
                    if (!target || validTabs.indexOf(target) < 0) return;
                    document.querySelectorAll('.pecas-tab[data-tab]').forEach(function(t) { t.classList.remove('active'); });
                    document.querySelectorAll('.pecas-tab-panel').forEach(function(c) { c.classList.remove('active'); });
                    document.querySelectorAll('.pecas-tab-content').forEach(function(c) { c.classList.remove('active'); });
                    this.classList.add('active');
                    var content = document.getElementById('pecas-tab-' + target);
                    if (content) content.classList.add('active');
                    var searchEst = document.getElementById('pecas-search-estoque');
                    var searchMov = document.getElementById('pecas-search-movimentos');
                    if (searchEst && searchMov) {
                        searchEst.style.display = target === 'estoque' ? '' : 'none';
                        searchMov.style.display = target === 'movimentos' ? '' : 'none';
                    }
                    var viewToggleWrap = document.getElementById('pecas-view-toggle-wrap');
                    if (viewToggleWrap) viewToggleWrap.style.display = target === 'estoque' ? '' : 'none';
                    if (target === 'movimentos') renderMovimentos();
                });
            });
        } catch (err) { console.error('Erro ao configurar tabs:', err); }
    }

    function setupEstoqueViewToggle() {
        try {
            document.querySelectorAll('.pecas-view-btn[data-view]').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var v = (this.dataset && this.dataset.view) ? String(this.dataset.view) : '';
                    if (v !== 'lista' && v !== 'cards') return;
                    estoqueViewMode = v;
                    document.querySelectorAll('.pecas-view-btn[data-view]').forEach(function(b) { b.classList.remove('active'); });
                    this.classList.add('active');
                    renderEstoque();
                });
            });
        } catch (err) { console.error('Erro ao configurar toggle de vista:', err); }
    }

    function pecasSetViewHash(target) {
        try {
            if (target === 'tabela') {
                history.replaceState(null, '', '#tabela');
            } else if (target === 'cadastro') {
                history.replaceState(null, '', '#cadastro');
            } else {
                history.replaceState(null, '', window.location.pathname + window.location.search);
            }
        } catch (e) { /* ignore */ }
    }

    function pecasViewFromHash() {
        var h = (window.location.hash || '').replace(/^#/, '').toLowerCase().trim();
        if (h === 'tabela' || h === 'inventario-em-linha' || h === 'linha') return 'tabela';
        if (h === 'cadastro') return 'cadastro';
        return 'inventario';
    }

    function toggleView(target) {
        var inv = document.getElementById('pecas-view-inventario');
        var cad = document.getElementById('pecas-view-cadastro');
        var tbl = document.getElementById('pecas-view-tabela');
        if (!inv || !cad) return;
        if (target === 'tabela' && !tbl) target = 'inventario';
        document.body.classList.toggle('pecas-body-tabela-page', target === 'tabela');
        inv.style.display = 'none';
        cad.style.display = 'none';
        if (tbl) tbl.style.display = 'none';
        if (target === 'cadastro') {
            cad.style.display = 'flex';
        } else if (target === 'tabela' && tbl) {
            tbl.style.display = 'flex';
            var vtw = document.getElementById('pecas-view-toggle-wrap');
            if (vtw) {
                var activeTab = document.querySelector('.pecas-tab.active[data-tab]');
                var tabId = activeTab && activeTab.getAttribute('data-tab');
                vtw.style.display = tabId === 'movimentos' ? 'none' : '';
            }
        } else {
            inv.style.display = 'flex';
        }
    }

    function cloneCadastroFormIntoStandalone() {
        var origem = document.querySelector('.pecas-card-form form#pecas-form');
        var destino = document.getElementById('pecas-form-clone');
        if (!origem || !destino || destino.dataset.cloned === '1') return;
        destino.innerHTML = origem.innerHTML;
        destino.dataset.cloned = '1';
        // Conectar submit do clone ao mesmo handler do original
        destino.addEventListener('submit', function(e) {
            e.preventDefault();
            var origForm = document.getElementById('pecas-form');
            if (origForm) {
                // Copiar valores de destino para origem pelos mesmos IDs
                ['pecas-categoria','pecas-produto','pecas-fabricante','pecas-conteudo','pecas-lote','pecas-validade','pecas-quantidade','pecas-data-recebimento','pecas-local','pecas-obs'].forEach(function(id) {
                    var from = destino.querySelector('#' + id);
                    var to = document.getElementById(id);
                    if (from && to) to.value = from.value;
                });
                origForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            }
        });
    }

    function initPecasFiltroCategoriaModern() {
        var wrap = document.getElementById('pecas-filtro-cat-modern');
        var sel = document.getElementById('pecas-filter-categoria');
        var trigger = document.getElementById('pecas-filtro-cat-trigger');
        var panel = document.getElementById('pecas-filtro-cat-panel');
        var labelEl = document.getElementById('pecas-filtro-cat-trigger-label');
        if (!wrap || !sel || !trigger || !panel || !labelEl) return;
        if (wrap.dataset.pecasFiltroCatInited === '1') return;
        wrap.dataset.pecasFiltroCatInited = '1';

        function syncLabel() {
            var v = sel.value || '';
            labelEl.textContent = v === '' ? 'Todas as categorias' : getCategoriaLabel(v);
            panel.querySelectorAll('.pecas-filtro-cat-item').forEach(function(el) {
                var on = (el.getAttribute('data-value') || '') === v;
                el.classList.toggle('is-active', on);
                el.setAttribute('aria-selected', on ? 'true' : 'false');
            });
        }

        function placePanelFixed() {
            var r = trigger.getBoundingClientRect();
            var w = Math.max(220, r.width);
            var left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8);
            panel.style.position = 'fixed';
            panel.style.top = (r.bottom + 6) + 'px';
            panel.style.left = left + 'px';
            panel.style.width = w + 'px';
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
            panel.style.zIndex = '2500';
        }

        function closePanel() {
            panel.hidden = true;
            trigger.setAttribute('aria-expanded', 'false');
            wrap.classList.remove('is-open');
            if (panel.parentNode === document.body) {
                wrap.insertBefore(panel, sel);
            }
            panel.style.position = '';
            panel.style.top = '';
            panel.style.left = '';
            panel.style.width = '';
            panel.style.right = '';
            panel.style.bottom = '';
            panel.style.zIndex = '';
        }

        function openPanel() {
            document.body.appendChild(panel);
            panel.hidden = false;
            trigger.setAttribute('aria-expanded', 'true');
            wrap.classList.add('is-open');
            requestAnimationFrame(function() {
                placePanelFixed();
            });
        }

        function togglePanel() {
            if (panel.hidden) openPanel();
            else closePanel();
        }

        function onScrollOrResize() {
            if (wrap.classList.contains('is-open')) placePanelFixed();
        }

        trigger.addEventListener('click', function(e) {
            e.stopPropagation();
            togglePanel();
        });

        panel.querySelectorAll('.pecas-filtro-cat-item').forEach(function(item) {
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                var val = item.getAttribute('data-value') || '';
                sel.value = val;
                syncLabel();
                sel.dispatchEvent(new Event('change', { bubbles: true }));
                closePanel();
            });
        });

        document.addEventListener('click', function(e) {
            var t = e.target;
            if (wrap.contains(t) || panel.contains(t)) return;
            closePanel();
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && wrap.classList.contains('is-open')) {
                closePanel();
                try { trigger.focus(); } catch (_) {}
            }
        });

        window.addEventListener('resize', onScrollOrResize);
        window.addEventListener('scroll', onScrollOrResize, true);

        sel.addEventListener('change', syncLabel);
        syncLabel();
    }

    function initMenu() {
        var btn = document.getElementById('pecas-menu-toggle');
        var dropdown = document.getElementById('pecas-menu-dropdown');
        if (!btn || !dropdown) return;
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });
        document.addEventListener('click', function() {
            dropdown.classList.remove('open');
        });
        dropdown.addEventListener('click', function(e) { e.stopPropagation(); });
        dropdown.querySelectorAll('.pecas-menu-item').forEach(function(item) {
            item.addEventListener('click', function() {
                var view = this.getAttribute('data-view');
                var action = this.getAttribute('data-action');
                dropdown.classList.remove('open');
                if (action === 'dashboard') {
                    window.location.href = '../index.html#page-home';
                    return;
                }
                if (view === 'cadastro') {
                    cloneCadastroFormIntoStandalone();
                    toggleView('cadastro');
                    pecasSetViewHash('cadastro');
                } else if (view === 'tabela') {
                    toggleView('tabela');
                    pecasSetViewHash('tabela');
                } else if (view === 'inventario') {
                    toggleView('inventario');
                    pecasSetViewHash('inventario');
                }
            });
        });
        window.addEventListener('hashchange', function() {
            var v = pecasViewFromHash();
            if (v === 'cadastro') {
                cloneCadastroFormIntoStandalone();
            }
            toggleView(v);
        });
    }

    function init() {
        try {
            migrateUtilizadasToMovimentos();
            loadFromServer();
            setTheme(getTheme());

            var themeBtn = document.getElementById('pecas-theme-toggle');
            if (themeBtn) {
                themeBtn.addEventListener('click', function() {
                    setTheme(getTheme() === 'dark' ? 'light' : 'dark');
                });
            }

            var dataRec = document.getElementById('pecas-data-recebimento');
            if (dataRec) {
                var hoje = new Date();
                dataRec.value = hoje.toISOString().slice(0, 10);
            }

            setupTabs();
            setupEstoqueViewToggle();

            var form = document.getElementById('pecas-form');
            if (form) {
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    try {
                        var produtoEl = document.getElementById('pecas-produto');
                        var fabricanteEl = document.getElementById('pecas-fabricante');
                        var conteudoEl = document.getElementById('pecas-conteudo');
                        var loteEl = document.getElementById('pecas-lote');
                        var validadeEl = document.getElementById('pecas-validade');
                        var qtdEl = document.getElementById('pecas-quantidade');
                        var dataRecEl = document.getElementById('pecas-data-recebimento');
                        var localEl = document.getElementById('pecas-local');
                        var obsEl = document.getElementById('pecas-obs');

                        var produto = sanitizeString(produtoEl && produtoEl.value, MAX_PRODUTO);
                        var fabricante = sanitizeString(fabricanteEl && fabricanteEl.value, MAX_FABRICANTE);
                        var conteudo = sanitizeString(conteudoEl && conteudoEl.value, MAX_CONTEUDO);
                        var lote = sanitizeString(loteEl && loteEl.value, MAX_LOTE);
                        var validade = sanitizeString(validadeEl && validadeEl.value, MAX_VALIDADE);
                        var qtd = safeInt(qtdEl && qtdEl.value, 1, 1, MAX_QUANTIDADE);
                        var dataRecVal = dataRecEl && dataRecEl.value;
                        var dataRecebimento = dataRecVal ? new Date(dataRecVal).toISOString() : new Date().toISOString();
                        var local = sanitizeString(localEl && localEl.value, MAX_LOCAL);
                        var obs = sanitizeString(obsEl && obsEl.value, MAX_OBS);

                        if (!produto || qtd < 1) {
                            alert('Preencha o produto e a quantidade (mínimo 1).');
                            if (produtoEl) produtoEl.focus();
                            return;
                        }

                        var catEl = document.getElementById('pecas-categoria');
                        var categoria = (catEl && catEl.value) ? catEl.value : 'peca';
                        var estoque = getEstoque();
                        var existe = estoque.find(function(p) {
                            var np = getProdutoNome(p);
                            return np.toLowerCase() === produto.toLowerCase() &&
                                (p.fabricante || '').trim() === fabricante &&
                                (p.lote || '').trim() === lote &&
                                (p.categoria || 'peca') === categoria;
                        });

                        if (existe) {
                            existe.quantidade = (existe.quantidade || 0) + qtd;
                            var movimentos = getMovimentos();
                            movimentos.unshift({
                                id: 'mov-' + Date.now(),
                                pecaId: existe.id,
                                tipo: 'entrada',
                                produto: produto,
                                quantidade: qtd,
                                observacao: 'Cadastro/entrada',
                                dataHora: new Date().toISOString()
                            });
                            saveMovimentos(movimentos);
                        } else {
                            var peca = {
                                id: 'peca-' + Date.now(),
                                categoria: categoria,
                                produto: produto,
                                nome: produto,
                                fabricante: fabricante,
                                conteudo: conteudo,
                                lote: lote,
                                validade: validade,
                                quantidade: qtd,
                                dataRecebimento: dataRecebimento,
                                dataCadastro: new Date().toISOString(),
                                local: local,
                                observacao: obs,
                                historico: [{ acao: 'criacao', data: new Date().toISOString(), usuario: getCurrentUser() || null }]
                            };
                            estoque.unshift(peca);
                            var movimentos = getMovimentos();
                            movimentos.unshift({
                                id: 'mov-' + Date.now(),
                                pecaId: peca.id,
                                tipo: 'entrada',
                                produto: produto,
                                quantidade: qtd,
                                observacao: 'Cadastro inicial',
                                dataHora: new Date().toISOString()
                            });
                            saveMovimentos(movimentos);
                        }

                        var ok = saveEstoque(estoque);
                        if (!ok) {
                            alert('Não foi possível salvar. Verifique o armazenamento local.');
                            return;
                        }

                        if (produtoEl) produtoEl.value = '';
                        if (fabricanteEl) fabricanteEl.value = '';
                        if (conteudoEl) conteudoEl.value = '';
                        if (loteEl) loteEl.value = '';
                        if (validadeEl) validadeEl.value = '';
                        if (qtdEl) qtdEl.value = '1';
                        if (dataRec) dataRec.value = new Date().toISOString().slice(0, 10);
                        if (localEl) localEl.value = '';
                        if (obsEl) obsEl.value = '';
                        var catEl = document.getElementById('pecas-categoria');
                        if (catEl) catEl.value = 'peca';

                        renderEstoque();
                        renderMovimentos();
                        updateDashboards();
                        alert('Peça cadastrada / entrada registrada com sucesso.');
                    } catch (err) {
                        console.error('Erro ao cadastrar:', err);
                        alert('Ocorreu um erro. Tente novamente.');
                    }
                });
            }

            var searchEstoque = document.getElementById('pecas-search-estoque');
            if (searchEstoque) {
                searchEstoque.addEventListener('input', renderEstoque);
                searchEstoque.addEventListener('keyup', renderEstoque);
            }
            var filterCat = document.getElementById('pecas-filter-categoria');
            if (filterCat) filterCat.addEventListener('change', renderEstoque);
            initPecasFiltroCategoriaModern();

            var searchMov = document.getElementById('pecas-search-movimentos');
            if (searchMov) {
                searchMov.addEventListener('input', renderMovimentos);
                searchMov.addEventListener('keyup', renderMovimentos);
            }

            var btnExport = document.getElementById('pecas-btn-export');
            if (btnExport) btnExport.addEventListener('click', exportarMovimentos);
            var btnExportEstoque = document.getElementById('pecas-btn-export-estoque');
            if (btnExportEstoque) btnExportEstoque.addEventListener('click', exportarEstoqueCSV);
            var btnBackup = document.getElementById('pecas-btn-backup');
            if (btnBackup) btnBackup.addEventListener('click', backupDados);
            var inputRestore = document.getElementById('pecas-input-restore');
            if (inputRestore) inputRestore.addEventListener('change', function() {
                var f = inputRestore.files && inputRestore.files[0];
                if (f) { restaurarDados(f); inputRestore.value = ''; }
            });

            applyVariant(getVariant());
            initVariantPicker();
            initAutocomplete();
            renderEstoque();
            renderMovimentos();
            updateDashboards();
            updateAssistente();
            if (document.getElementById('pecas-chart')) updateChart();
            /* Gráficos como hologramas vivos — atualização contínua */
            setInterval(function() {
                updateDashboards();
            }, 3000);

            // Inicializar views e menu (hash #tabela | #cadastro)
            var startView = pecasViewFromHash();
            if (startView === 'cadastro') {
                cloneCadastroFormIntoStandalone();
            }
            toggleView(startView);
            var viewToggleWrap = document.getElementById('pecas-view-toggle-wrap');
            if (viewToggleWrap) {
                var st = document.querySelector('.pecas-tab.active[data-tab]');
                var stTab = st && st.getAttribute('data-tab');
                viewToggleWrap.style.display = stTab === 'movimentos' ? 'none' : '';
            }
            initMenu();
        } catch (err) { console.error('Erro ao inicializar peças:', err); }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
