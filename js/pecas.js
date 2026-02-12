/**
 * PEÇAS - Inventário de peças para manutenção de impressoras | AXIS
 * Dados: localStorage (axis_pecas_estoque, axis_pecas_utilizadas)
 * Código blindado: validação, sanitização, try-catch, limites
 */
(function() {
    'use strict';

    const STORAGE_ESTOQUE = 'axis_pecas_estoque';
    const STORAGE_UTILIZADAS = 'axis_pecas_utilizadas';
    const THEME_KEY = 'axis_pecas_theme';
    const MAX_NOME = 200;
    const MAX_CODIGO = 80;
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

    function getEstoque() {
        try {
            var raw = localStorage.getItem(STORAGE_ESTOQUE);
            if (!raw) return [];
            var arr = JSON.parse(raw);
            return Array.isArray(arr) ? arr : [];
        } catch (e) {
            return [];
        }
    }

    function saveEstoque(arr) {
        if (!Array.isArray(arr)) return;
        try {
            localStorage.setItem(STORAGE_ESTOQUE, JSON.stringify(arr));
        } catch (e) {
            console.error('Erro ao salvar estoque:', e);
        }
    }

    function getUtilizadas() {
        try {
            var raw = localStorage.getItem(STORAGE_UTILIZADAS);
            if (!raw) return [];
            var arr = JSON.parse(raw);
            return Array.isArray(arr) ? arr : [];
        } catch (e) {
            return [];
        }
    }

    function saveUtilizadas(arr) {
        if (!Array.isArray(arr)) return;
        try {
            localStorage.setItem(STORAGE_UTILIZADAS, JSON.stringify(arr));
        } catch (e) {
            console.error('Erro ao salvar utilizadas:', e);
        }
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
        }
    }

    function renderEstoque() {
        try {
            var tbody = document.getElementById('pecas-tbody-estoque');
            var empty = document.getElementById('pecas-empty-estoque');
            var search = document.getElementById('pecas-search-estoque');
            if (!tbody) return;

            var estoque = getEstoque();
        var q = (search && search.value) ? search.value.trim().toLowerCase() : '';
        var filtroModelo = (document.getElementById('pecas-filter-modelo') && document.getElementById('pecas-filter-modelo').value) || '';
        var list = estoque.filter(function(p) {
            if (!p || p.quantidade <= 0) return false;
            if (filtroModelo) {
                var mod = (p.modelo || '').trim();
                if (filtroModelo === 'Outro') {
                    if (mod !== '' && mod !== 'Outro') return false;
                } else if (mod !== filtroModelo) return false;
            }
            if (!q) return true;
            var nome = (p.nome || '').toLowerCase();
            var codigo = (p.codigo || '').toLowerCase();
            var modelo = (p.modelo || '').toLowerCase();
            return nome.indexOf(q) >= 0 || codigo.indexOf(q) >= 0 || modelo.indexOf(q) >= 0;
        });

        if (list.length === 0) {
            tbody.innerHTML = '';
            if (empty) empty.classList.add('visible');
            return;
        }
        if (empty) empty.classList.remove('visible');

        tbody.innerHTML = list.map(function(p) {
            return '<tr data-id="' + escapeHtml(p.id || '') + '">' +
                '<td>' + formatarDataHora(p.dataCadastro) + '</td>' +
                '<td><strong>' + escapeHtml(p.nome || '—') + '</strong></td>' +
                '<td>' + escapeHtml(p.codigo || '—') + '</td>' +
                '<td>' + escapeHtml(p.modelo || '—') + '</td>' +
                '<td>' + (p.quantidade || 0) + '</td>' +
                '<td>' + escapeHtml(p.local || '—') + '</td>' +
                '<td class="pecas-actions-cell">' +
                    '<button type="button" class="pecas-btn-action" data-id="' + escapeHtml(p.id || '') + '" title="Marcar como utilizada"><i class="fas fa-hand-holding"></i> USAR</button>' +
                    '<button type="button" class="pecas-btn-edit" data-id="' + escapeHtml(p.id || '') + '" title="Editar"><i class="fas fa-edit"></i> EDITAR</button>' +
                    '<button type="button" class="pecas-btn-detalhes" data-id="' + escapeHtml(p.id || '') + '" title="Ver histórico"><i class="fas fa-history"></i> HISTÓRICO</button>' +
                '</td>' +
                '</tr>';
        }).join('');

        tbody.querySelectorAll('.pecas-btn-action').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = safeId(this.dataset.id);
                if (!id) return;
                openModalUso(id);
            });
        });
        tbody.querySelectorAll('.pecas-btn-edit').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = safeId(this.dataset.id);
                if (!id) return;
                openModalEditar(id);
            });
        });
        tbody.querySelectorAll('.pecas-btn-detalhes').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = safeId(this.dataset.id);
                if (!id) return;
                openModalDetalhes(id);
            });
        });
        } catch (err) { console.error('Erro ao renderizar estoque:', err); }
    }

    function renderUtilizadas() {
        try {
            var tbody = document.getElementById('pecas-tbody-utilizadas');
            var empty = document.getElementById('pecas-empty-utilizadas');
            var search = document.getElementById('pecas-search-utilizadas');
            if (!tbody) return;

            var utilizadas = getUtilizadas();
        var q = (search && search.value) ? search.value.trim().toLowerCase() : '';
        var list = utilizadas.filter(function(p) {
            if (!q) return true;
            var nome = (p.nome || '').toLowerCase();
            var codigo = (p.codigo || '').toLowerCase();
            var obs = (p.observacao || '').toLowerCase();
            return nome.indexOf(q) >= 0 || codigo.indexOf(q) >= 0 || obs.indexOf(q) >= 0;
        });

        if (list.length === 0) {
            tbody.innerHTML = '';
            if (empty) empty.classList.add('visible');
            return;
        }
        if (empty) empty.classList.remove('visible');

        list.sort(function(a, b) {
            return new Date(b.dataUso || 0) - new Date(a.dataUso || 0);
        });

        tbody.innerHTML = list.map(function(p) {
            return '<tr>' +
                '<td>' + formatarDataHora(p.dataUso) + '</td>' +
                '<td><strong>' + escapeHtml(p.nome || '—') + '</strong></td>' +
                '<td>' + escapeHtml(p.codigo || '—') + '</td>' +
                '<td>' + (p.quantidade || 0) + '</td>' +
                '<td>' + escapeHtml(p.observacao || '—') + '</td>' +
                '</tr>';
        }).join('');
        } catch (err) { console.error('Erro ao renderizar utilizadas:', err); }
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
        nomeEl.textContent = peca.nome || '—';
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
                var utilizadas = getUtilizadas();
                utilizadas.unshift({
                    id: 'pu-' + Date.now(),
                    idEstoque: id,
                    nome: peca.nome || '',
                    codigo: peca.codigo || '',
                    modelo: peca.modelo || '',
                    quantidade: qtd,
                    observacao: obsVal,
                    dataUso: new Date().toISOString()
                });
                saveUtilizadas(utilizadas);

                var arr = getEstoque();
                var idx = arr.findIndex(function(p) { return p && p.id === id; });
                if (idx >= 0) {
                    arr[idx].quantidade = Math.max(0, (arr[idx].quantidade || 0) - qtd);
                    saveEstoque(arr);
                }

                overlay.style.display = 'none';
                renderEstoque();
                renderUtilizadas();
                updateDashboards();
            } catch (err) { console.error('Erro ao registrar uso:', err); }
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
        var nomeInput = document.getElementById('pecas-editar-nome');
        var codigoInput = document.getElementById('pecas-editar-codigo');
        var qtdInput = document.getElementById('pecas-editar-quantidade');
        var modeloInput = document.getElementById('pecas-editar-modelo');
        var modeloLabel = document.getElementById('pecas-editar-modelo-label');
        var localInput = document.getElementById('pecas-editar-local');
        var obsInput = document.getElementById('pecas-editar-obs');
        var cancelBtn = document.getElementById('pecas-modal-editar-cancel');

        if (!overlay || !form) return;

        idInput.value = id;
        nomeInput.value = peca.nome || '';
        codigoInput.value = peca.codigo || '';
        qtdInput.value = peca.quantidade || 0;
        var mod = peca.modelo || '';
        modeloInput.value = mod;
        if (modeloLabel) modeloLabel.textContent = mod ? mod : 'TODOS';
        localInput.value = peca.local || '';
        obsInput.value = peca.observacao || '';

        overlay.style.display = 'flex';
        cancelBtn.onclick = function() { overlay.style.display = 'none'; };
        overlay.onclick = function(e) {
            if (e.target === overlay) overlay.style.display = 'none';
        };

        form.onsubmit = function(e) {
            e.preventDefault();
            try {
                var arr = getEstoque();
                var idx = arr.findIndex(function(p) { return p && p.id === id; });
                if (idx < 0) return;

                var antigo = arr[idx];
                var nomeVal = sanitizeString(nomeInput && nomeInput.value, MAX_NOME);
                var codigoVal = sanitizeString(codigoInput && codigoInput.value, MAX_CODIGO);
                var qtdVal = safeInt(qtdInput && qtdInput.value, 0, 0, MAX_QUANTIDADE);
                var modeloVal = sanitizeString(modeloInput && modeloInput.value, 50);
                var localVal = sanitizeString(localInput && localInput.value, MAX_LOCAL);
                var obsVal = sanitizeString(obsInput && obsInput.value, MAX_OBS);

                var novo = {
                    nome: nomeVal,
                    codigo: codigoVal,
                    quantidade: qtdVal,
                    modelo: modeloVal,
                    local: localVal,
                    observacao: obsVal
                };
                if (!novo.nome) return;

                var alteracoes = [];
                if ((antigo.nome || '') !== novo.nome) alteracoes.push({ campo: 'Nome', de: antigo.nome || '—', para: novo.nome });
                if ((antigo.codigo || '') !== novo.codigo) alteracoes.push({ campo: 'Código', de: antigo.codigo || '—', para: novo.codigo });
                if (String(antigo.quantidade || 0) !== String(novo.quantidade)) alteracoes.push({ campo: 'Quantidade', de: antigo.quantidade, para: novo.quantidade });
                if ((antigo.modelo || '') !== novo.modelo) alteracoes.push({ campo: 'Modelo', de: antigo.modelo || '—', para: novo.modelo });
                if ((antigo.local || '') !== novo.local) alteracoes.push({ campo: 'Local', de: antigo.local || '—', para: novo.local });
                if ((antigo.observacao || '') !== novo.observacao) alteracoes.push({ campo: 'Observação', de: antigo.observacao || '—', para: novo.observacao });

                arr[idx].nome = novo.nome;
                arr[idx].codigo = novo.codigo;
                arr[idx].quantidade = novo.quantidade;
                arr[idx].modelo = novo.modelo;
                arr[idx].local = novo.local;
                arr[idx].observacao = novo.observacao;

                if (!Array.isArray(arr[idx].historico)) arr[idx].historico = [];
                if (alteracoes.length > 0) {
                    arr[idx].historico.push({
                        data: new Date().toISOString(),
                        acao: 'edicao',
                        alteracoes: alteracoes,
                        usuario: getCurrentUser() || null
                    });
                }

                saveEstoque(arr);
                overlay.style.display = 'none';
                renderEstoque();
                updateDashboards();
            } catch (err) {
                console.error('Erro ao editar peça:', err);
            }
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
        html += '<h4>CRIADO EM:</h4><p class="pecas-detalhes-valor">' + formatarDataHoraCriacao(peca.dataCadastro) + '</p>';
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
        overlay.onclick = function(e) {
            if (e.target === overlay) overlay.style.display = 'none';
        };
        } catch (err) { console.error('Erro ao abrir modal detalhes:', err); }
    }

    function limparDados() {
        if (!confirm('Tem certeza que deseja excluir TODOS os dados de peças (estoque e utilizadas)?')) return;
        try {
            localStorage.removeItem(STORAGE_ESTOQUE);
            localStorage.removeItem(STORAGE_UTILIZADAS);
            var filterInput = document.getElementById('pecas-filter-modelo');
            var filterLabel = document.getElementById('pecas-filter-modelo-label');
            if (filterInput) filterInput.value = '';
            if (filterLabel) filterLabel.textContent = 'TODOS';
            renderEstoque();
            renderUtilizadas();
            updateDashboards();
        } catch (e) {
            console.error('Erro ao limpar:', e);
        }
    }

    function updateDashboards() {
        try {
            var utilizadas = getUtilizadas();
            var estoque = getEstoque();
        var agora = new Date();
        var anoAtual = agora.getFullYear();
        var mesAtual = agora.getMonth() + 1;

        var qtdPorPecaUtilizada = {};
        utilizadas.forEach(function(u) {
            var nome = (u.nome || '').trim();
            var k = nome.toLowerCase();
            if (!k) return;
            if (!qtdPorPecaUtilizada[k]) qtdPorPecaUtilizada[k] = { nome: nome || '—', total: 0 };
            qtdPorPecaUtilizada[k].total += (u.quantidade || 0);
        });
        var listEl = document.getElementById('pecas-dash-list-utilizadas');
        if (listEl) {
            var itens = Object.values(qtdPorPecaUtilizada).sort(function(a, b) { return b.total - a.total; });
            listEl.innerHTML = itens.length ? itens.map(function(i) {
                return '<li><strong>' + escapeHtml(i.nome) + '</strong> <span class="pecas-dash-qty">' + i.total + '</span></li>';
            }).join('') : '<li style="color:var(--pecas-text-sec)">Nenhuma peça utilizada</li>';
        }

        var utilizadasMes = utilizadas.filter(function(u) {
            try {
                var d = new Date(u.dataUso);
                return d.getFullYear() === anoAtual && d.getMonth() + 1 === mesAtual;
            } catch (_) { return false; }
        });
        var totalItensMes = utilizadasMes.reduce(function(a, u) { return a + (u.quantidade || 0); }, 0);
        var el2 = document.getElementById('pecas-dash-utilizadas-mes');
        if (el2) el2.textContent = totalItensMes;

        var porMes = {};
        utilizadas.forEach(function(u) {
            try {
                var d = new Date(u.dataUso);
                var k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
                porMes[k] = (porMes[k] || 0) + (u.quantidade || 0);
            } catch (_) {}
        });
        var totalPorMes = Object.values(porMes).reduce(function(a, v) { return a + v; }, 0);
        var el3 = document.getElementById('pecas-dash-por-mes');
        if (el3) el3.textContent = totalPorMes;

        var elBadge = document.getElementById('pecas-dash-total-mes-badge');
        if (elBadge) elBadge.textContent = totalItensMes;

        var totalEntradas = estoque.reduce(function(a, p) { return a + (p.quantidade || 0); }, 0);
        var el4 = document.getElementById('pecas-dash-entradas');
        if (el4) el4.textContent = totalEntradas;
        } catch (err) { console.error('Erro ao atualizar dashboards:', err); }
    }

    function openModalMes() {
        try {
            var utilizadas = getUtilizadas();
        var porMes = {};
        utilizadas.forEach(function(u) {
            try {
                var d = new Date(u.dataUso);
                var k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
                var mesNome = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                if (!porMes[k]) porMes[k] = { label: mesNome, qtd: 0 };
                porMes[k].qtd += (u.quantidade || 0);
            } catch (_) {}
        });
        var itens = Object.entries(porMes).sort(function(a, b) { return b[0].localeCompare(a[0]); });
        var list = document.getElementById('pecas-modal-mes-list');
        if (list) list.innerHTML = itens.length ? itens.map(function(e) {
            var lab = (e[1].label || '').replace(/^\w/, function(c) { return c.toUpperCase(); });
            return '<div class="pecas-modal-mes-item"><span>' + lab + '</span><strong>' + e[1].qtd + '</strong></div>';
        }).join('') : '<p style="color:var(--pecas-text-sec)">Nenhum dado</p>';
        document.getElementById('pecas-modal-mes').style.display = 'flex';
    }

    function exportarUtilizadas(format) {
        try {
            var utilizadas = getUtilizadas();
            if (!Array.isArray(utilizadas) || utilizadas.length === 0) {
                alert('Nenhum dado para exportar.');
                return;
            }
            var base = 'pecas-utilizadas-' + new Date().toISOString().slice(0, 10);
        var bom = '\uFEFF';
        var csv = 'DATA USO;NOME;CÓDIGO;QTD;OBSERVAÇÃO\n';
        utilizadas.forEach(function(u) {
            var data = formatarDataHora(u.dataUso);
            var nome = (u.nome || '').replace(/;/g, ',');
            var cod = (u.codigo || '').replace(/;/g, ',');
            var obs = (u.observacao || '').replace(/;/g, ',').replace(/\n/g, ' ');
            csv += data + ';' + nome + ';' + cod + ';' + (u.quantidade || 0) + ';' + obs + '\n';
        });
        var txt = csv.replace(/;/g, '\t');
        var mime, ext, content;
        if (format === 'txt') {
            mime = 'text/plain;charset=utf-8';
            ext = '.txt';
            content = bom + txt;
        } else {
            mime = 'text/csv;charset=utf-8';
            ext = '.csv';
            content = bom + csv;
        }
        var blob = new Blob([content], { type: mime });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = base + ext;
        a.click();
        URL.revokeObjectURL(url);
        } catch (err) { console.error('Erro ao exportar:', err); }
    }

    function openModalSistema() {
        try {
            var estoque = getEstoque();
        var porPeca = {};
        estoque.forEach(function(p) {
            var q = p.quantidade || 0;
            if (q <= 0) return;
            var k = (p.nome || '') + '|' + (p.codigo || '');
            porPeca[k] = (porPeca[k] || { nome: p.nome || '—', total: 0 });
            porPeca[k].total += q;
        });
        var itens = Object.values(porPeca).sort(function(a, b) { return b.total - a.total; });
        var chart = document.getElementById('pecas-modal-sistema-chart');
        if (chart) chart.innerHTML = itens.length ? itens.map(function(i) {
            return '<div class="pecas-modal-sistema-item"><span class="valor">' + i.total + '</span><span class="nome">' + escapeHtml(i.nome) + '</span></div>';
        }).join('') : '<p style="color:var(--pecas-text-sec)">Nenhuma peça no sistema</p>';
            var modalSist = document.getElementById('pecas-modal-sistema');
            if (modalSist) modalSist.style.display = 'flex';
        } catch (err) { console.error('Erro ao abrir modal sistema:', err); }
    }

    function setupTabs() {
        try {
            var validTabs = ['estoque', 'utilizadas'];
            document.querySelectorAll('.pecas-tab[data-tab]').forEach(function(tab) {
                tab.addEventListener('click', function() {
                    var target = (this.dataset && this.dataset.tab) ? String(this.dataset.tab) : '';
                    if (!target || validTabs.indexOf(target) < 0) return;
                    document.querySelectorAll('.pecas-tab[data-tab]').forEach(function(t) { t.classList.remove('active'); });
                    document.querySelectorAll('.pecas-tab-content').forEach(function(c) { c.classList.remove('active'); });
                    this.classList.add('active');
                    var content = document.getElementById('pecas-tab-' + target);
                    if (content) content.classList.add('active');
                });
            });
        } catch (err) { console.error('Erro ao configurar tabs:', err); }
    }

    function init() {
        try {
            setTheme(getTheme());

        var themeBtn = document.getElementById('pecas-theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', function() {
                setTheme(getTheme() === 'dark' ? 'light' : 'dark');
            });
        }

        setupTabs();

        var form = document.getElementById('pecas-form');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                try {
                    var nomeEl = document.getElementById('pecas-nome');
                    var codigoEl = document.getElementById('pecas-codigo');
                    var modeloEl = document.getElementById('pecas-modelo');
                    var qtdEl = document.getElementById('pecas-quantidade');
                    var localEl = document.getElementById('pecas-local');
                    var obsEl = document.getElementById('pecas-obs');

                    var nome = sanitizeString(nomeEl && nomeEl.value, MAX_NOME);
                    var codigo = sanitizeString(codigoEl && codigoEl.value, MAX_CODIGO);
                    var modelo = sanitizeString(modeloEl && modeloEl.value, 50);
                    var qtd = safeInt(qtdEl && qtdEl.value, 1, 1, MAX_QUANTIDADE);
                    var local = sanitizeString(localEl && localEl.value, MAX_LOCAL);
                    var obs = sanitizeString(obsEl && obsEl.value, MAX_OBS);

                    if (!nome || qtd < 1) return;

                    var estoque = getEstoque();
                var existe = estoque.find(function(p) {
                    return (p.nome || '').toLowerCase() === nome.toLowerCase() && (p.codigo || '') === codigo;
                });
                var peca;
                if (existe) {
                    existe.quantidade = (existe.quantidade || 0) + qtd;
                    if (modelo) existe.modelo = modelo;
                    peca = existe;
                } else {
                    peca = {
                        id: 'peca-' + Date.now(),
                        nome: nome,
                        codigo: codigo,
                        modelo: modelo,
                        quantidade: qtd,
                        local: local,
                        observacao: obs,
                        dataCadastro: new Date().toISOString(),
                        historico: [{ acao: 'criacao', data: new Date().toISOString(), usuario: getCurrentUser() || null }]
                    };
                    estoque.unshift(peca);
                }
                saveEstoque(estoque);

                    if (nomeEl) nomeEl.value = '';
                    if (codigoEl) codigoEl.value = '';
                    var mInput = document.getElementById('pecas-modelo');
                    if (mInput) mInput.value = '';
                    var mLab = document.getElementById('pecas-modelo-label');
                    if (mLab) mLab.textContent = 'TODOS';
                    if (qtdEl) qtdEl.value = '1';
                    if (localEl) localEl.value = '';
                    if (obsEl) obsEl.value = '';

                    renderEstoque();
                    updateDashboards();
                } catch (err) { console.error('Erro ao cadastrar peça:', err); }
            });
        }

        var searchEstoque = document.getElementById('pecas-search-estoque');
        if (searchEstoque) {
            searchEstoque.addEventListener('input', renderEstoque);
            searchEstoque.addEventListener('keyup', renderEstoque);
        }

        var searchUtilizadas = document.getElementById('pecas-search-utilizadas');
        if (searchUtilizadas) {
            searchUtilizadas.addEventListener('input', renderUtilizadas);
            searchUtilizadas.addEventListener('keyup', renderUtilizadas);
        }

        var modeloTrigger = document.getElementById('pecas-modelo-trigger');
        var modeloDropdown = document.getElementById('pecas-modelo-dropdown');
        var modeloInput = document.getElementById('pecas-modelo');
        var modeloLabel = document.getElementById('pecas-modelo-label');
        if (modeloTrigger && modeloDropdown && modeloInput) {
            modeloTrigger.addEventListener('click', function(e) {
                e.stopPropagation();
                modeloDropdown.classList.toggle('open');
            });
            modeloDropdown.querySelectorAll('.pecas-cadastro-modelo-opt').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var val = this.dataset.modelo || '';
                    modeloInput.value = val;
                    if (modeloLabel) modeloLabel.textContent = val ? this.textContent : 'TODOS';
                    modeloDropdown.classList.remove('open');
                });
            });
            document.addEventListener('click', function() { modeloDropdown.classList.remove('open'); });
        }

        var filterModelo = document.getElementById('pecas-filter-modelo-trigger');
        var filterDropdown = document.getElementById('pecas-filter-modelo-dropdown');
        if (filterModelo && filterDropdown) {
            filterModelo.addEventListener('click', function(e) {
                e.stopPropagation();
                filterDropdown.classList.toggle('open');
            });
            filterDropdown.querySelectorAll('.pecas-filter-opt').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var hiddenInput = document.getElementById('pecas-filter-modelo');
                    if (hiddenInput) hiddenInput.value = this.dataset.modelo || '';
                    var label = document.getElementById('pecas-filter-modelo-label');
                    if (label) label.textContent = (this.dataset.modelo && this.dataset.modelo !== '') ? this.dataset.modelo : 'TODOS';
                    filterDropdown.classList.remove('open');
                    renderEstoque();
                });
            });
            document.addEventListener('click', function() { filterDropdown.classList.remove('open'); });
        }

        var btnMes = document.getElementById('pecas-dash-btn-mes');
        if (btnMes) btnMes.addEventListener('click', openModalMes);
        var btnSistema = document.getElementById('pecas-dash-btn-sistema');
        if (btnSistema) btnSistema.addEventListener('click', openModalSistema);
        var closeMes = document.getElementById('pecas-modal-mes-close');
        if (closeMes) closeMes.addEventListener('click', function() { document.getElementById('pecas-modal-mes').style.display = 'none'; });
        var closeSistema = document.getElementById('pecas-modal-sistema-close');
        if (closeSistema) closeSistema.addEventListener('click', function() { document.getElementById('pecas-modal-sistema').style.display = 'none'; });
        var overlayMes = document.getElementById('pecas-modal-mes');
        if (overlayMes) overlayMes.addEventListener('click', function(e) { if (e.target === overlayMes) overlayMes.style.display = 'none'; });
        var overlaySistema = document.getElementById('pecas-modal-sistema');
        if (overlaySistema) overlaySistema.addEventListener('click', function(e) { if (e.target === overlaySistema) overlaySistema.style.display = 'none'; });

        var editModeloTrigger = document.getElementById('pecas-editar-modelo-trigger');
        var editModeloDropdown = document.getElementById('pecas-editar-modelo-dropdown');
        var editModeloInput = document.getElementById('pecas-editar-modelo');
        var editModeloLabel = document.getElementById('pecas-editar-modelo-label');
        if (editModeloTrigger && editModeloDropdown && editModeloInput) {
            editModeloTrigger.addEventListener('click', function(e) {
                e.stopPropagation();
                editModeloDropdown.classList.toggle('open');
            });
            editModeloDropdown.querySelectorAll('.pecas-cadastro-modelo-opt').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var val = this.dataset.modelo || '';
                    editModeloInput.value = val;
                    if (editModeloLabel) editModeloLabel.textContent = val ? this.textContent : 'TODOS';
                    editModeloDropdown.classList.remove('open');
                });
            });
            document.addEventListener('click', function() { editModeloDropdown.classList.remove('open'); });
        }

        var btnExport = document.getElementById('pecas-btn-export');
        var exportDropdown = document.getElementById('pecas-export-dropdown');
        if (btnExport && exportDropdown) {
            btnExport.addEventListener('click', function(e) {
                e.stopPropagation();
                exportDropdown.classList.toggle('open');
            });
            exportDropdown.querySelectorAll('.pecas-export-opt').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var fmt = this.dataset.format || '';
                    exportarUtilizadas(fmt);
                    exportDropdown.classList.remove('open');
                });
            });
            document.addEventListener('click', function() { exportDropdown.classList.remove('open'); });
        }

        renderEstoque();
        renderUtilizadas();
        updateDashboards();
        } catch (err) { console.error('Erro ao inicializar peças:', err); }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
