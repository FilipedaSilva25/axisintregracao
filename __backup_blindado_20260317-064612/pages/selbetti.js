/**
 * SELBETTI - Biblioteca do Técnico | AXIS
 * Navegação, formulários e assistente
 */
(function () {
    'use strict';

    var STORAGE_PREFIX = 'axis_selbetti_';
    var currentAtaTab = 'semanais';

    function getStorageKey(key) {
        return STORAGE_PREFIX + key;
    }

    function loadJSON(key, def) {
        try {
            var raw = localStorage.getItem(getStorageKey(key));
            return raw ? JSON.parse(raw) : (def || []);
        } catch (e) {
            return def || [];
        }
    }

    function saveJSON(key, data) {
        try {
            localStorage.setItem(getStorageKey(key), JSON.stringify(data));
        } catch (e) {
            console.warn('Selbetti: erro ao gravar', e);
        }
    }

    function showToast(msg, type) {
        if (typeof window.showToast === 'function') {
            window.showToast(msg, type || 'info');
        } else {
            alert(msg);
        }
    }

    // --- Tema (Dark mode) ---
    function initTheme() {
        var body = document.getElementById('selbetti-body');
        var toggle = document.getElementById('selbetti-theme-toggle');
        var icon = toggle ? toggle.querySelector('i') : null;
        var isDark = localStorage.getItem(getStorageKey('dark')) === '1';

        function applyTheme(dark) {
            if (!body) return;
            if (dark) {
                body.classList.add('dark');
                if (icon) {
                    icon.className = 'fas fa-sun';
                    toggle.setAttribute('aria-label', 'Ativar tema claro');
                }
            } else {
                body.classList.remove('dark');
                if (icon) {
                    icon.className = 'fas fa-moon';
                    toggle.setAttribute('aria-label', 'Ativar tema escuro');
                }
            }
            try {
                localStorage.setItem(getStorageKey('dark'), dark ? '1' : '0');
            } catch (e) {}
        }

        applyTheme(isDark);
        if (toggle) {
            toggle.addEventListener('click', function () {
                isDark = !body.classList.contains('dark');
                applyTheme(isDark);
            });
        }
    }

    // --- Dashboard (cards de status + Biblioteca de Dados + API) ---
    function estimateStorageUsed() {
        var total = 0;
        try {
            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if (key && key.indexOf(STORAGE_PREFIX) === 0) {
                    var raw = localStorage.getItem(key);
                    if (raw) total += (key.length + raw.length) * 2;
                }
            }
        } catch (e) { return 0; }
        return total;
    }

    function initDashboard() {
        var pedidosN = document.getElementById('selbetti-dash-pedidos-n');
        var certText = document.getElementById('selbetti-dash-cert-text');
        var ataText = document.getElementById('selbetti-dash-ata-text');
        var backupList = loadJSON('backup_pedidos', []);
        var certList = loadJSON('certificados_ficheiros', []);
        var atasList = loadJSON('atas', []);
        var orcList = loadJSON('orcamento_ficheiros', []);
        var ferramentasList = loadJSON('ferramentas', []);

        var pendentes = backupList.filter(function (p) {
            var s = (p.statusEntrega || 'pendente');
            return s === 'pendente' || !s;
        }).length;
        if (pedidosN) {
            pedidosN.textContent = pendentes + ' / ' + backupList.length;
        }

        if (certText) {
            if (certList.length === 0) {
                certText.textContent = 'Nenhum registado';
            } else {
                var nextDue = null;
                certList.forEach(function (c) {
                    if (c.dataValidade) {
                        var d = new Date(c.dataValidade);
                        if (!nextDue || d < nextDue) nextDue = d;
                    }
                });
                if (nextDue) {
                    certText.textContent = nextDue.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });
                } else {
                    certText.textContent = certList.length + ' certificado(s)';
                }
            }
        }

        if (ataText && atasList.length > 0) {
            var last = atasList[atasList.length - 1];
            var titulo = (last.titulo || 'Ata').substring(0, 40);
            if ((last.titulo || '').length > 40) titulo += '…';
            ataText.textContent = titulo + ' · ' + (last.data || '—');
        } else if (ataText) {
            ataText.textContent = 'Nenhuma ata';
        }

        // Biblioteca de Dados: contagens por fonte
        var dsOrc = document.getElementById('selbetti-ds-orcamento');
        var dsCert = document.getElementById('selbetti-ds-certificados');
        var dsBackup = document.getElementById('selbetti-ds-backup');
        var dsAtas = document.getElementById('selbetti-ds-atas');
        var dsFerr = document.getElementById('selbetti-ds-ferramentas');
        if (dsOrc) dsOrc.textContent = orcList.length;
        if (dsCert) dsCert.textContent = certList.length;
        if (dsBackup) dsBackup.textContent = backupList.length;
        if (dsAtas) dsAtas.textContent = atasList.length;
        if (dsFerr) dsFerr.textContent = ferramentasList.length;

        // Storage usado (estimativa em KB) + aviso quota (ideia 5)
        var storageBadge = document.getElementById('selbetti-storage-badge');
        var quotaWarning = document.getElementById('selbetti-quota-warning');
        if (storageBadge) {
            var bytes = estimateStorageUsed();
            var kb = (bytes / 1024).toFixed(1);
            var code = storageBadge.querySelector('code');
            if (code) code.textContent = kb + ' KB';
            if (quotaWarning && bytes > 4 * 1024 * 1024) quotaWarning.style.display = 'inline-flex';
        }
        if (document.getElementById('selbetti-quota-help')) {
            document.getElementById('selbetti-quota-help').addEventListener('click', function (e) {
                e.preventDefault();
                var sec = document.getElementById('section-inicio');
                if (sec) sec.classList.add('active');
                showToast('Use Exportar biblioteca para guardar os dados e limpar localmente se necessário.', 'info');
            });
        }

        document.querySelectorAll('.selbetti-dash-action').forEach(function (btn) {
            var section = btn.getAttribute('data-section');
            if (!section) return;
            btn.addEventListener('click', function () {
                var sec = document.getElementById('section-' + section);
                if (!sec) return;
                document.querySelectorAll('.selbetti-section').forEach(function (s) { s.classList.remove('active'); });
                document.querySelectorAll('.selbetti-nav-item').forEach(function (n) { n.classList.remove('active'); });
                sec.classList.add('active');
                var navBtn = document.querySelector('.selbetti-nav-item[data-section="' + section + '"]');
                if (navBtn) navBtn.classList.add('active');
                if (window.selbettiUpdateBreadcrumb) window.selbettiUpdateBreadcrumb(section);
                if (section === 'inicio' && window.selbettiRefreshDashboard) window.selbettiRefreshDashboard();
            });
        });

    }

    window.selbettiRefreshDashboard = initDashboard;

    // --- Navegação ---
    function initNav() {
        var nav = document.getElementById('selbetti-nav');
        var items = document.querySelectorAll('.selbetti-nav-item[data-section]');
        var main = document.querySelector('.selbetti-main');
        var menuToggle = document.getElementById('selbetti-menu-toggle');
        var navAtas = document.getElementById('selbetti-nav-atas');
        var submenuAtas = document.getElementById('selbetti-submenu-atas');

        var sectionTitles = {
            'inicio': 'Início',
            'orcamento': 'Orçamento de Peças',
            'ferramentas': 'Ferramentas Anotadas',
            'certificados': 'Certificados',
            'backup': 'Pedido Backup Operacional',
            'atas': 'Atas e Reuniões',
            'atas-semanais': 'Atas · Semanais',
            'atas-mensais': 'Atas · Mensais',
            'atas-anuais': 'Atas · Anuais'
        };
        function updateBreadcrumb(sectionId) {
            var breadcrumb = document.getElementById('selbetti-breadcrumb');
            if (!breadcrumb) return;
            var title = sectionTitles[sectionId] || sectionId;
            breadcrumb.innerHTML = '<span class="selbetti-breadcrumb-item">' + title + '</span>';
        }
        function goTo(sectionId) {
            if (!sectionId) return;
            var section = document.getElementById('section-' + sectionId);
            if (!section) return;
            document.querySelectorAll('.selbetti-section').forEach(function (s) {
                s.classList.remove('active');
            });
            document.querySelectorAll('.selbetti-nav-item').forEach(function (n) {
                n.classList.remove('active');
            });
            section.classList.add('active');
            var btn = document.querySelector('.selbetti-nav-item[data-section="' + sectionId + '"]');
            if (btn) btn.classList.add('active');
            if (nav) nav.classList.remove('open');
            updateBreadcrumb(sectionId);
            if (sectionId === 'inicio' && window.selbettiRefreshDashboard) window.selbettiRefreshDashboard();
        }

        items.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var section = this.getAttribute('data-section');
                if (section === 'atas-semanais' || section === 'atas-mensais' || section === 'atas-anuais') {
                    currentAtaTab = section.replace('atas-', '');
                    document.querySelectorAll('.selbetti-tab').forEach(function (t) {
                        t.classList.toggle('active', t.getAttribute('data-ata') === currentAtaTab);
                    });
                    goTo('atas');
                    var parentAtas = document.querySelector('.selbetti-nav-item[data-section="atas"]');
                    if (parentAtas) parentAtas.classList.add('active');
                    if (submenuAtas) submenuAtas.closest('.selbetti-nav-sub').classList.add('open');
                    renderAtas();
                    return;
                }
                goTo(section);
            });
        });

        document.querySelectorAll('.selbetti-quick-card').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var s = this.getAttribute('data-section');
                if (s) goTo(s);
            });
        });

        document.querySelectorAll('.selbetti-ds-item[data-section]').forEach(function (el) {
            el.addEventListener('click', function () {
                var s = this.getAttribute('data-section');
                if (s) goTo(s);
                if (nav) nav.classList.remove('open');
            });
        });

        if (menuToggle && nav) {
            menuToggle.addEventListener('click', function () {
                nav.classList.toggle('open');
            });
        }

        if (navAtas && submenuAtas) {
            navAtas.addEventListener('click', function () {
                navAtas.closest('.selbetti-nav-sub').classList.toggle('open');
            });
        }
        window.selbettiUpdateBreadcrumb = updateBreadcrumb;
        window.selbettiGoTo = goTo;
        document.addEventListener('keydown', function (e) {
            if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT' || e.target.isContentEditable)) return;
            var key = (e.key || '').toLowerCase();
            if (key === 'g') { goTo('inicio'); e.preventDefault(); return; }
            if (key === 'o') { goTo('orcamento'); e.preventDefault(); return; }
            if (key === 'b') { goTo('backup'); e.preventDefault(); return; }
            if (key === 'f') { goTo('ferramentas'); e.preventDefault(); return; }
            if (key === 'c') { goTo('certificados'); e.preventDefault(); return; }
            if (key === 'a') { goTo('atas'); e.preventDefault(); return; }
        });
    }

    // --- Orçamento de Peças (biblioteca de imagens/PDF com pré-visualização) ---
    var MAX_DATAURL_LEN = 800000; // ~800KB por item para não estourar localStorage

    function initOrcamento() {
        var lista = loadJSON('orcamento_ficheiros', []);
        var dropZone = document.getElementById('selbetti-orcamento-drop');
        var fileInput = document.getElementById('selbetti-orcamento-file');
        var emptyEl = document.getElementById('selbetti-orcamento-empty');
        var inner = document.getElementById('selbetti-orcamento-inner');

        function render() {
            if (!inner || !emptyEl) return;
            var displayList = typeof getFilteredOrcamentoList === 'function' ? getFilteredOrcamentoList() : lista;
            inner.innerHTML = '';
            if (displayList.length === 0) {
                emptyEl.style.display = 'block';
                return;
            }
            emptyEl.style.display = 'none';
            displayList.forEach(function (item) {
                var i = lista.indexOf(item);
                if (i === -1) return;
                var div = document.createElement('div');
                div.className = 'selbetti-preview-item';
                var status = item.statusOrcamento || 'pendente';
                var statusClass = 'selbetti-status-orcamento ' + status;
                var statusHtml = '<span class="' + statusClass + '" data-i="' + i + '">' + (status === 'aprovado' ? 'Aprovado' : status === 'rejeitado' ? 'Rejeitado' : 'Pendente') + '</span>';
                var noteIcon = (item.nota || item.comentario) ? '<i class="fas fa-sticky-note" title="' + (item.nota || item.comentario) + '"></i>' : '<i class="fas fa-comment-dots selbetti-note-empty" data-i="' + i + '" title="Adicionar nota"></i>';
                if (item.type === 'pdf') {
                    div.innerHTML = '<div class="selbetti-preview-pdf"><i class="fas fa-file-pdf"></i><span>' + (item.name || 'PDF') + '</span>' + statusHtml + noteIcon + '</div><button type="button" class="selbetti-preview-del" data-i="' + i + '" title="Remover">&times;</button>';
                } else {
                    div.innerHTML = '<img src="' + (item.dataUrl || '') + '" alt=""><div class="selbetti-preview-meta">' + statusHtml + noteIcon + '</div><button type="button" class="selbetti-preview-del" data-i="' + i + '" title="Remover">&times;</button>';
                }
                inner.appendChild(div);
            });
            inner.querySelectorAll('.selbetti-status-orcamento').forEach(function (el) {
                el.addEventListener('click', function () {
                    var i = parseInt(this.getAttribute('data-i'), 10);
                    if (lista[i]) {
                        var next = (lista[i].statusOrcamento || 'pendente') === 'pendente' ? 'aprovado' : (lista[i].statusOrcamento || '') === 'aprovado' ? 'rejeitado' : 'pendente';
                        lista[i].statusOrcamento = next;
                        saveJSON('orcamento_ficheiros', lista);
                        render();
                    }
                });
            });
            inner.querySelectorAll('.selbetti-note-empty').forEach(function (el) {
                el.addEventListener('click', function (e) {
                    e.stopPropagation();
                    var i = parseInt(this.getAttribute('data-i'), 10);
                    if (lista[i]) {
                        var n = prompt('Nota / comentário para este ficheiro:', lista[i].nota || lista[i].comentario || '');
                        if (n !== null) { lista[i].nota = n; saveJSON('orcamento_ficheiros', lista); render(); }
                    }
                });
            });
            inner.querySelectorAll('.selbetti-preview-del').forEach(function (b) {
                b.addEventListener('click', function () {
                    var i = parseInt(this.getAttribute('data-i'), 10);
                    if (!confirm('Tem a certeza que deseja remover este item do orçamento?')) return;
                    lista.splice(i, 1);
                    saveJSON('orcamento_ficheiros', lista);
                    render();
                    showToast('Item removido.', 'success');
                });
            });
        }

        function addFiles(files) {
            if (!files || !files.length) return;
            var added = 0;
            for (var f = 0; f < files.length; f++) {
                var file = files[f];
                var isPdf = (file.type || '').toLowerCase().indexOf('pdf') !== -1;
                var isImage = (file.type || '').indexOf('image') === 0;
                if (!isPdf && !isImage) continue;
                var entry = { name: file.name, type: isPdf ? 'pdf' : 'image' };
                if (isImage) {
                    var reader = new FileReader();
                    reader.onload = (function (ent) {
                        return function (e) {
                            var dataUrl = e.target.result;
                            if (dataUrl.length > MAX_DATAURL_LEN) {
                                showToast('Imagem muito grande: ' + (ent.name || ''), 'warning');
                                return;
                            }
                            ent.dataUrl = dataUrl;
                            lista.push(ent);
                            saveJSON('orcamento_ficheiros', lista);
                            render();
                            showToast('Ficheiro adicionado à biblioteca.', 'success');
                        };
                    })(entry);
                    reader.readAsDataURL(file);
                    added++;
                } else {
                    var r = new FileReader();
                    r.onload = (function (ent) {
                        return function (e) {
                            var dataUrl = e.target.result;
                            if (dataUrl.length > MAX_DATAURL_LEN) {
                                ent.dataUrl = null;
                                showToast('PDF grande: guardado só o nome. Preview em sessão.', 'info');
                            } else {
                                ent.dataUrl = dataUrl;
                            }
                            lista.push(ent);
                            saveJSON('orcamento_ficheiros', lista);
                            render();
                            showToast('PDF adicionado.', 'success');
                        };
                    })(entry);
                    r.readAsDataURL(file);
                    added++;
                }
            }
        }

        if (fileInput) {
            fileInput.addEventListener('change', function () {
                addFiles(this.files);
                this.value = '';
            });
        }
        if (dropZone) {
            dropZone.addEventListener('dragover', function (e) {
                e.preventDefault();
                this.classList.add('dragover');
            });
            dropZone.addEventListener('dragleave', function () {
                this.classList.remove('dragover');
            });
            dropZone.addEventListener('drop', function (e) {
                e.preventDefault();
                this.classList.remove('dragover');
                addFiles(e.dataTransfer.files);
            });
        }

        var previewGrid = document.getElementById('selbetti-orcamento-preview');
        var orcamentoViewMode = 'list';
        var viewBtns = document.querySelectorAll('.selbetti-view-btn');
        viewBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var v = this.getAttribute('data-view');
                if (!v) return;
                orcamentoViewMode = v;
                viewBtns.forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-view') === v); });
                if (previewGrid) {
                    previewGrid.classList.remove('selbetti-view-grid', 'selbetti-view-timeline');
                    if (v === 'grid') previewGrid.classList.add('selbetti-view-grid');
                    if (v === 'timeline') previewGrid.classList.add('selbetti-view-timeline');
                }
            });
        });

        var filterSelb = document.getElementById('selbetti-orc-filter-selb');
        var filterDateFrom = document.getElementById('selbetti-orc-filter-date-from');
        var filterDateTo = document.getElementById('selbetti-orc-filter-date-to');
        var filterType = document.getElementById('selbetti-orc-filter-type');
        function getFilteredOrcamentoList() {
            var out = lista.slice();
            if (filterSelb && filterSelb.value.trim()) {
                var s = filterSelb.value.trim().toLowerCase();
                out = out.filter(function (item) { return (item.selb || '').toLowerCase().indexOf(s) !== -1 || (item.name || '').toLowerCase().indexOf(s) !== -1; });
            }
            if (filterDateFrom && filterDateFrom.value) {
                var from = new Date(filterDateFrom.value);
                out = out.filter(function (item) {
                    var d = item.createdAt ? new Date(item.createdAt) : null;
                    return d && !isNaN(d.getTime()) && d >= from;
                });
            }
            if (filterDateTo && filterDateTo.value) {
                var to = new Date(filterDateTo.value);
                to.setHours(23, 59, 59, 999);
                out = out.filter(function (item) {
                    var d = item.createdAt ? new Date(item.createdAt) : null;
                    return d && !isNaN(d.getTime()) && d <= to;
                });
            }
            if (filterType && filterType.value) {
                out = out.filter(function (item) { return (item.type || '') === filterType.value; });
            }
            return out;
        }

        [filterSelb, filterDateFrom, filterDateTo, filterType].forEach(function (el) {
            if (el) {
                el.addEventListener('change', render);
                if (el.tagName === 'INPUT') el.addEventListener('input', render);
            }
        });

        var batchOcrBtn = document.getElementById('selbetti-orcamento-ocr-batch');
        if (batchOcrBtn && typeof Tesseract !== 'undefined') {
            batchOcrBtn.addEventListener('click', function () {
                var images = lista.filter(function (item) { return item.dataUrl && item.type === 'image'; });
                if (images.length === 0) {
                    showToast('Nenhuma imagem para OCR em lote.', 'warning');
                    return;
                }
                batchOcrBtn.disabled = true;
                var idx = 0;
                function next() {
                    if (idx >= images.length) {
                        batchOcrBtn.disabled = false;
                        showToast('OCR em lote concluído.', 'success');
                        if (ocrResult && ocrTextEl) {
                            ocrResult.style.display = 'block';
                            ocrTextEl.textContent = 'OCR em lote: ' + images.length + ' imagem(ns) processada(s). Veja cada item ou use OCR num único para ver texto aqui.';
                        }
                        return;
                    }
                    Tesseract.recognize(images[idx].dataUrl, 'por').then(function (out) {
                        images[idx].ocrText = out.data.text || '';
                        idx++;
                        next();
                    }).catch(function () { idx++; next(); });
                }
                next();
            });
        }

        var shareLinkBtn = document.getElementById('selbetti-orc-share-link');
        if (shareLinkBtn) {
            shareLinkBtn.addEventListener('click', function () {
                if (lista.length === 0) { showToast('Adicione orçamentos primeiro.', 'warning'); return; }
                var token = 'selbetti_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
                try { localStorage.setItem(getStorageKey('share_token'), token); } catch (e) {}
                showToast('Link de partilha (válido 24h): ' + window.location.origin + window.location.pathname + '?partilha=' + token, 'info');
            });
        }
        var sendEmailBtn = document.getElementById('selbetti-orc-send-email');
        if (sendEmailBtn) {
            sendEmailBtn.addEventListener('click', function () {
                if (lista.length === 0) { showToast('Adicione orçamentos primeiro.', 'warning'); return; }
                var nome = (lista[lista.length - 1].name || 'Orçamento') + '';
                var subj = encodeURIComponent('Orçamento Selbetti: ' + nome);
                var body = encodeURIComponent('Segue em anexo o orçamento.\n\n(Enviado pela Biblioteca Selbetti AXIS)');
                window.location.href = 'mailto:?subject=' + subj + '&body=' + body;
            });
        }

        var ocrBtn = document.getElementById('selbetti-orcamento-ocr');
        var ocrResult = document.getElementById('selbetti-orcamento-ocr-result');
        var ocrTextEl = document.getElementById('selbetti-orcamento-ocr-text');
        if (ocrBtn && ocrResult && ocrTextEl && typeof Tesseract !== 'undefined') {
            ocrBtn.addEventListener('click', function () {
                var firstImage = null;
                for (var o = 0; o < lista.length; o++) {
                    if (lista[o].dataUrl && lista[o].type === 'image') {
                        firstImage = lista[o].dataUrl;
                        break;
                    }
                }
                if (!firstImage) {
                    showToast('Adicione pelo menos uma imagem para extrair texto (OCR).', 'warning');
                    return;
                }
                ocrBtn.disabled = true;
                ocrTextEl.textContent = 'A processar OCR...';
                ocrResult.style.display = 'block';
                Tesseract.recognize(firstImage, 'por', { logger: function (m) { if (m.status === 'recognizing text') ocrTextEl.textContent = 'A ler...'; } })
                    .then(function (out) {
                        ocrTextEl.textContent = out.data.text || '(Nenhum texto detectado)';
                        if (out.data.text) lista[0].ocrText = out.data.text;
                        showToast('Texto extraído com sucesso.', 'success');
                    })
                    .catch(function (err) {
                        ocrTextEl.textContent = 'Erro: ' + (err.message || err);
                        showToast('Erro no OCR.', 'warning');
                    })
                    .finally(function () {
                        ocrBtn.disabled = false;
                    });
            });
        }

        render();
    }

    // --- Ferramentas Anotadas (ideias 51-60: estado, localização, categoria, código, export PDF) ---
    function initFerramentas() {
        var lista = loadJSON('ferramentas', []);
        var addBtn = document.getElementById('selbetti-ferramenta-add');
        var nomeInput = document.getElementById('selbetti-ferramenta-nome');
        var notaInput = document.getElementById('selbetti-ferramenta-nota');
        var estadoInput = document.getElementById('selbetti-ferramenta-estado');
        var localInput = document.getElementById('selbetti-ferramenta-local');
        var categoriaInput = document.getElementById('selbetti-ferramenta-categoria');
        var codigoInput = document.getElementById('selbetti-ferramenta-codigo');
        var container = document.getElementById('selbetti-ferramentas-itens');
        var estadoLabels = { 'disponivel': 'Disponível', 'em-uso': 'Em uso', 'manutencao': 'Em manutenção' };
        var categoriaLabels = { 'geral': 'Geral', 'eletrica': 'Elétrica', 'pneumatica': 'Pneumática', 'medicao': 'Medição' };

        function render() {
            if (!container) return;
            container.innerHTML = '';
            if (lista.length === 0) {
                container.innerHTML = '<li class="selbetti-empty">Nenhuma ferramenta. Adicione acima.</li>';
                return;
            }
            lista.forEach(function (item, i) {
                var li = document.createElement('li');
                var estado = (item.estado && estadoLabels[item.estado]) ? estadoLabels[item.estado] : '';
                var cat = (item.categoria && categoriaLabels[item.categoria]) ? categoriaLabels[item.categoria] : '';
                var meta = [estado, item.local || '', cat, item.codigo || ''].filter(Boolean).join(' · ');
                var txt = '<span><strong>' + (item.nome || '—') + '</strong>';
                if (meta) txt += ' <small class="selbetti-ferramenta-meta">' + meta + '</small>';
                if (item.nota) txt += ' · ' + item.nota;
                txt += '</span><button type="button" class="selbetti-item-del" data-i="' + i + '">Remover</button>';
                li.innerHTML = txt;
                container.appendChild(li);
            });
            container.querySelectorAll('.selbetti-item-del').forEach(function (b) {
                b.addEventListener('click', function () {
                    var i = parseInt(this.getAttribute('data-i'), 10);
                    if (!confirm('Tem a certeza que deseja remover esta ferramenta?')) return;
                    lista.splice(i, 1);
                    saveJSON('ferramentas', lista);
                    render();
                    showToast('Ferramenta removida.', 'success');
                });
            });
        }

        if (addBtn && nomeInput) {
            addBtn.addEventListener('click', function () {
                var nome = (nomeInput.value || '').trim();
                if (!nome) {
                    showToast('Indique o nome da ferramenta.', 'warning');
                    return;
                }
                var estado = estadoInput ? (estadoInput.value || 'disponivel') : 'disponivel';
                var local = localInput ? (localInput.value || '').trim() : '';
                var categoria = categoriaInput ? (categoriaInput.value || 'geral') : 'geral';
                var codigo = codigoInput ? (codigoInput.value || '').trim() : '';
                lista.push({
                    nome: nome,
                    nota: (notaInput && notaInput.value) ? notaInput.value.trim() : '',
                    estado: estado,
                    local: local,
                    categoria: categoria,
                    codigo: codigo
                });
                saveJSON('ferramentas', lista);
                nomeInput.value = '';
                if (notaInput) notaInput.value = '';
                if (localInput) localInput.value = '';
                if (codigoInput) codigoInput.value = '';
                render();
                showToast('Ferramenta adicionada.', 'success');
            });
        }

        var exportPdfBtn = document.getElementById('selbetti-ferramentas-export-pdf');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', function () {
                if (lista.length === 0) {
                    showToast('Adicione ferramentas para exportar.', 'warning');
                    return;
                }
                try {
                    if (typeof jspdf !== 'undefined' && jspdf.jsPDF) {
                        var doc = new jspdf.jsPDF();
                        doc.setFontSize(14);
                        doc.text('Lista de Ferramentas – Selbetti', 14, 16);
                        doc.setFontSize(10);
                        var y = 24;
                        lista.forEach(function (item, idx) {
                            if (y > 270) { doc.addPage(); y = 16; }
                            doc.text((idx + 1) + '. ' + (item.nome || '—'), 14, y);
                            y += 5;
                            var meta = [estadoLabels[item.estado] || item.estado, item.local, categoriaLabels[item.categoria] || item.categoria, item.codigo].filter(Boolean).join(' | ');
                            if (meta) { doc.text(meta, 18, y); y += 5; }
                            if (item.nota) { doc.text(item.nota, 18, y); y += 5; }
                            y += 4;
                        });
                        doc.save('ferramentas-selbetti-' + new Date().toISOString().slice(0, 10) + '.pdf');
                        showToast('PDF exportado.', 'success');
                    } else {
                        window.print();
                        showToast('Use a impressão do browser para guardar como PDF.', 'info');
                    }
                } catch (err) {
                    window.print();
                    showToast('Use a impressão do browser para guardar como PDF.', 'info');
                }
            });
        }

        render();
    }

    // --- Certificados (biblioteca de imagens/PDF com pré-visualização) ---
    function initCertificados() {
        var lista = loadJSON('certificados_ficheiros', []);
        var dropZone = document.getElementById('selbetti-cert-drop');
        var fileInput = document.getElementById('selbetti-cert-file');
        var emptyEl = document.getElementById('selbetti-cert-empty');
        var inner = document.getElementById('selbetti-cert-inner');

        function render() {
            if (!inner || !emptyEl) return;
            inner.innerHTML = '';
            if (lista.length === 0) {
                emptyEl.style.display = 'block';
                return;
            }
            emptyEl.style.display = 'none';
            lista.forEach(function (item, i) {
                var div = document.createElement('div');
                div.className = 'selbetti-preview-item';
                if (item.type === 'pdf') {
                    div.innerHTML = '<div class="selbetti-preview-pdf"><i class="fas fa-file-pdf"></i><span>' + (item.name || 'PDF') + '</span></div><button type="button" class="selbetti-preview-del" data-i="' + i + '" title="Remover">&times;</button>';
                } else {
                    div.innerHTML = '<img src="' + (item.dataUrl || '') + '" alt=""><button type="button" class="selbetti-preview-del" data-i="' + i + '" title="Remover">&times;</button>';
                }
                inner.appendChild(div);
            });
            inner.querySelectorAll('.selbetti-preview-del').forEach(function (b) {
                b.addEventListener('click', function () {
                    var i = parseInt(this.getAttribute('data-i'), 10);
                    if (!confirm('Tem a certeza que deseja remover este certificado?')) return;
                    lista.splice(i, 1);
                    saveJSON('certificados_ficheiros', lista);
                    render();
                    showToast('Certificado removido.', 'success');
                });
            });
        }

        function addFiles(files) {
            if (!files || !files.length) return;
            for (var f = 0; f < files.length; f++) {
                var file = files[f];
                var isPdf = (file.type || '').toLowerCase().indexOf('pdf') !== -1;
                var isImage = (file.type || '').indexOf('image') === 0;
                if (!isPdf && !isImage) continue;
                var entry = { name: file.name, type: isPdf ? 'pdf' : 'image' };
                if (isImage) {
                    var reader = new FileReader();
                    reader.onload = (function (ent) {
                        return function (e) {
                            var dataUrl = e.target.result;
                            if (dataUrl.length > MAX_DATAURL_LEN) {
                                showToast('Imagem muito grande: ' + (ent.name || ''), 'warning');
                                return;
                            }
                            ent.dataUrl = dataUrl;
                            lista.push(ent);
                            saveJSON('certificados_ficheiros', lista);
                            render();
                            showToast('Certificado adicionado.', 'success');
                        };
                    })(entry);
                    reader.readAsDataURL(file);
                } else {
                    var r = new FileReader();
                    r.onload = (function (ent) {
                        return function (e) {
                            var dataUrl = e.target.result;
                            if (dataUrl.length > MAX_DATAURL_LEN) ent.dataUrl = null;
                            lista.push(ent);
                            saveJSON('certificados_ficheiros', lista);
                            render();
                            showToast('Certificado (PDF) adicionado.', 'success');
                        };
                    })(entry);
                    r.readAsDataURL(file);
                }
            }
        }

        if (fileInput) {
            fileInput.addEventListener('change', function () {
                addFiles(this.files);
                this.value = '';
            });
        }
        if (dropZone) {
            dropZone.addEventListener('dragover', function (e) {
                e.preventDefault();
                this.classList.add('dragover');
            });
            dropZone.addEventListener('dragleave', function () {
                this.classList.remove('dragover');
            });
            dropZone.addEventListener('drop', function (e) {
                e.preventDefault();
                this.classList.remove('dragover');
                addFiles(e.dataTransfer.files);
            });
        }

        var certReminderDays = document.getElementById('selbetti-cert-reminder-days');
        var certGroupBy = document.getElementById('selbetti-cert-group-by-course');
        if (certReminderDays) {
            try {
                var saved = localStorage.getItem(getStorageKey('cert_reminder_days'));
                if (saved) certReminderDays.value = saved;
            } catch (e) {}
            certReminderDays.addEventListener('change', function () {
                try { localStorage.setItem(getStorageKey('cert_reminder_days'), this.value); } catch (e) {}
            });
        }
        if (certGroupBy) {
            try {
                certGroupBy.checked = localStorage.getItem(getStorageKey('cert_group_by')) !== '0';
            } catch (e) {}
            certGroupBy.addEventListener('change', function () {
                try { localStorage.setItem(getStorageKey('cert_group_by'), this.checked ? '1' : '0'); } catch (e) {}
                render();
            });
        }

        var certOcrBtn = document.getElementById('selbetti-cert-ocr');
        var certOcrResult = document.getElementById('selbetti-cert-ocr-result');
        var certOcrText = document.getElementById('selbetti-cert-ocr-text');
        if (certOcrBtn && certOcrResult && certOcrText && typeof Tesseract !== 'undefined') {
            certOcrBtn.addEventListener('click', function () {
                var firstImg = null;
                for (var c = 0; c < lista.length; c++) {
                    if (lista[c].dataUrl && lista[c].type === 'image') {
                        firstImg = lista[c].dataUrl;
                        break;
                    }
                }
                if (!firstImg) {
                    showToast('Adicione pelo menos uma imagem de certificado para OCR.', 'warning');
                    return;
                }
                certOcrBtn.disabled = true;
                certOcrText.textContent = 'A processar...';
                certOcrResult.style.display = 'block';
                Tesseract.recognize(firstImg, 'por')
                    .then(function (out) {
                        certOcrText.textContent = out.data.text || '(Nenhum texto)';
                        showToast('Texto extraído.', 'success');
                    })
                    .catch(function (err) {
                        certOcrText.textContent = 'Erro: ' + (err.message || err);
                    })
                    .finally(function () { certOcrBtn.disabled = false; });
            });
        }

        render();
    }

    // --- Pedido Backup Operacional (OS + código peça + SELB + data) ---
    function initBackup() {
        var lista = loadJSON('backup_pedidos', []);
        var pedidoBtn = document.getElementById('selbetti-backup-pedido');
        var osInput = document.getElementById('selbetti-backup-os');
        var codigoInput = document.getElementById('selbetti-backup-codigo');
        var selbInput = document.getElementById('selbetti-backup-selb');
        var dataInput = document.getElementById('selbetti-backup-data');
        var tagsInput = document.getElementById('selbetti-backup-tags');
        var container = document.getElementById('selbetti-backup-itens');
        var filterOs = document.getElementById('selbetti-backup-filter-os');
        var filterSelb = document.getElementById('selbetti-backup-filter-selb');
        var filterFrom = document.getElementById('selbetti-backup-filter-from');
        var filterTo = document.getElementById('selbetti-backup-filter-to');
        var filterStatus = document.getElementById('selbetti-backup-filter-status');

        var predictionCard = document.getElementById('selbetti-backup-prediction');
        var predictionText = document.getElementById('selbetti-backup-prediction-text');

        function getFilteredList() {
            var out = lista.slice();
            if (filterOs && filterOs.value.trim()) {
                var os = filterOs.value.trim().toLowerCase();
                out = out.filter(function (item) { return (item.os || '').toLowerCase().indexOf(os) !== -1; });
            }
            if (filterSelb && filterSelb.value.trim()) {
                var selb = filterSelb.value.trim().toLowerCase();
                out = out.filter(function (item) { return (item.selb || '').toLowerCase().indexOf(selb) !== -1; });
            }
            if (filterFrom && filterFrom.value) {
                var from = new Date(filterFrom.value);
                out = out.filter(function (item) {
                    var d = new Date(item.dataSolicitacao || item.data || 0);
                    return !isNaN(d.getTime()) && d >= from;
                });
            }
            if (filterTo && filterTo.value) {
                var to = new Date(filterTo.value);
                to.setHours(23, 59, 59, 999);
                out = out.filter(function (item) {
                    var d = new Date(item.dataSolicitacao || item.data || 0);
                    return !isNaN(d.getTime()) && d <= to;
                });
            }
            if (filterStatus && filterStatus.value) {
                var st = filterStatus.value;
                out = out.filter(function (item) {
                    var s = item.statusEntrega || 'pendente';
                    return (st === 'transito' && s === 'transito') || (st === 'entregue' && s === 'entregue') || (st === 'pendente' && (s === 'pendente' || !s));
                });
            }
            var sortBy = (document.getElementById('selbetti-backup-sort') && document.getElementById('selbetti-backup-sort').value) || 'data-desc';
            out.sort(function (a, b) {
                if (sortBy === 'data-desc') {
                    var da = new Date(a.dataSolicitacao || a.data || 0).getTime();
                    var db = new Date(b.dataSolicitacao || b.data || 0).getTime();
                    return db - da;
                }
                if (sortBy === 'data-asc') {
                    var da = new Date(a.dataSolicitacao || a.data || 0).getTime();
                    var db = new Date(b.dataSolicitacao || b.data || 0).getTime();
                    return da - db;
                }
                if (sortBy === 'os') return (a.os || '').localeCompare(b.os || '');
                if (sortBy === 'selb') return (a.selb || '').localeCompare(b.selb || '');
                if (sortBy === 'codigo') return (a.codigo || '').localeCompare(b.codigo || '');
                return 0;
            });
            return out;
        }

        function render() {
            if (!container) return;
            container.innerHTML = '';
            var displayList = getFilteredList();
            if (displayList.length === 0) {
                if (predictionCard) predictionCard.style.display = 'none';
                container.innerHTML = '<li class="selbetti-empty">Nenhum pedido (ou nenhum coincide com os filtros).</li>';
                updateBackupChart();
                updateBackupReminder();
                return;
            }
            var now = new Date();
            var sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
            var byCodigo = {};
            lista.forEach(function (item) {
                var d = new Date(item.dataSolicitacao || item.data || 0);
                if (isNaN(d.getTime())) return;
                if (d < sixMonthsAgo) return;
                var cod = (item.codigo || item.selb || '').trim() || '—';
                byCodigo[cod] = (byCodigo[cod] || 0) + 1;
            });
            var suggestion = [];
            Object.keys(byCodigo).forEach(function (cod) {
                if (cod !== '—' && byCodigo[cod] >= 2) {
                    suggestion.push('A peça/código «' + cod + '» foi pedida ' + byCodigo[cod] + ' vezes nos últimos 6 meses. Considere verificar o estoque de backup.');
                }
            });
            if (predictionCard && predictionText) {
                if (suggestion.length > 0) {
                    predictionCard.style.display = 'block';
                    predictionText.textContent = suggestion.join(' ');
                } else {
                    predictionCard.style.display = 'none';
                }
            }

            displayList.forEach(function (item) {
                var i = lista.indexOf(item);
                if (i === -1) return;
                var li = document.createElement('li');
                var status = item.statusEntrega || 'pendente';
                var statusLabel = status === 'transito' ? 'Em trânsito' : status === 'entregue' ? 'Entregue' : 'Pendente';
                var tagsHtml = (item.tags && item.tags.length) ? item.tags.map(function (t) { return '<span class="selbetti-tag">' + t + '</span>'; }).join('') : '';
                li.innerHTML = '<span><strong>OS ' + (item.os || '—') + '</strong> · Cód. ' + (item.codigo || '—') + ' · SELB ' + (item.selb || '—') + ' · ' + (item.dataSolicitacao || (item.data || '').slice(0, 10)) + (tagsHtml ? ' · ' + tagsHtml : '') + '</span>' +
                    '<select class="selbetti-status-select" data-i="' + i + '" title="Status de entrega"><option value="pendente"' + (status === 'pendente' ? ' selected' : '') + '>Pendente</option><option value="transito"' + (status === 'transito' ? ' selected' : '') + '>Em trânsito</option><option value="entregue"' + (status === 'entregue' ? ' selected' : '') + '>Entregue</option></select>' +
                    '<button type="button" class="selbetti-btn-duplicate" data-i="' + i + '" title="Duplicar (ideia 36)"><i class="fas fa-copy"></i></button>' +
                    '<button type="button" class="selbetti-item-del" data-i="' + i + '">Remover</button>';
                container.appendChild(li);
            });
            container.querySelectorAll('.selbetti-item-del').forEach(function (b) {
                b.addEventListener('click', function () {
                    var i = parseInt(this.getAttribute('data-i'), 10);
                    if (!confirm('Tem a certeza que deseja remover este pedido de backup?')) return;
                    lista.splice(i, 1);
                    saveJSON('backup_pedidos', lista);
                    render();
                    showToast('Pedido removido.', 'success');
                });
            });
            container.querySelectorAll('.selbetti-btn-duplicate').forEach(function (b) {
                b.addEventListener('click', function () {
                    var i = parseInt(this.getAttribute('data-i'), 10);
                    if (lista[i]) {
                        var copy = JSON.parse(JSON.stringify(lista[i]));
                        copy.data = new Date().toISOString();
                        copy.dataSolicitacao = new Date().toISOString().slice(0, 10);
                        copy.statusEntrega = 'pendente';
                        copy.history = [];
                        lista.splice(i + 1, 0, copy);
                        saveJSON('backup_pedidos', lista);
                        render();
                        showToast('Pedido duplicado.', 'success');
                    }
                });
            });
            container.querySelectorAll('.selbetti-status-select').forEach(function (sel) {
                sel.addEventListener('change', function () {
                    var i = parseInt(this.getAttribute('data-i'), 10);
                    if (lista[i]) {
                        var oldStatus = lista[i].statusEntrega || 'pendente';
                        lista[i].statusEntrega = this.value;
                        if (!lista[i].history) lista[i].history = [];
                        lista[i].history.push({ what: 'status', from: oldStatus, to: this.value, when: new Date().toISOString() });
                        saveJSON('backup_pedidos', lista);
                        if (this.value === 'entregue') showToast('Pedido marcado como Entregue.', 'success');
                    }
                });
            });
            updateBackupChart();
            updateBackupReminder();
        }

        var sortSelect = document.getElementById('selbetti-backup-sort');
        if (sortSelect) sortSelect.addEventListener('change', render);

        function updateBackupChart() {
            var wrap = document.getElementById('selbetti-backup-chart-wrap');
            var canvas = document.getElementById('selbetti-backup-chart');
            if (!wrap || !canvas || lista.length === 0) return;
            var byMonth = {};
            lista.forEach(function (item) {
                var d = new Date(item.dataSolicitacao || item.data || 0);
                if (isNaN(d.getTime())) return;
                var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
                byMonth[key] = (byMonth[key] || 0) + 1;
            });
            var keys = Object.keys(byMonth).sort();
            var ctx = canvas.getContext('2d');
            var w = canvas.width;
            var h = canvas.height;
            ctx.clearRect(0, 0, w, h);
            if (keys.length === 0) return;
            var max = Math.max.apply(null, keys.map(function (k) { return byMonth[k]; }));
            if (max === 0) max = 1;
            var barW = Math.max(12, (w - 40) / keys.length - 8);
            keys.forEach(function (k, idx) {
                var val = byMonth[k];
                var x = 30 + idx * (barW + 8);
                var barH = (val / max) * (h - 40);
                ctx.fillStyle = 'rgba(41, 121, 255, 0.7)';
                ctx.fillRect(x, h - 25 - barH, barW, barH);
                ctx.fillStyle = '#64748b';
                ctx.font = '10px Inter, sans-serif';
                ctx.fillText(k, x, h - 8);
            });
        }

        function updateBackupReminder() {
            var reminderEl = document.getElementById('selbetti-backup-reminder');
            var textEl = document.getElementById('selbetti-backup-reminder-text');
            if (!reminderEl || !textEl) return;
            var days = 7;
            try { days = parseInt(localStorage.getItem(getStorageKey('backup_reminder_transito_days')) || '7', 10); } catch (e) {}
            var now = new Date();
            var inTransito = lista.filter(function (item) {
                if ((item.statusEntrega || '') !== 'transito') return false;
                var d = new Date(item.dataSolicitacao || item.data || 0);
                return !isNaN(d.getTime()) && (now - d) / (24 * 60 * 60 * 1000) > days;
            });
            if (inTransito.length === 0) {
                reminderEl.style.display = 'none';
                return;
            }
            textEl.textContent = inTransito.length + ' pedido(s) em trânsito há mais de ' + days + ' dias.';
            reminderEl.style.display = 'flex';
        }

        var exportPdfBtn = document.getElementById('selbetti-backup-export-pdf');
        var exportExcelBtn = document.getElementById('selbetti-backup-export-excel');
        var JsPDF = typeof jspdf !== 'undefined' && jspdf.jsPDF ? jspdf.jsPDF : (typeof window !== 'undefined' && window.jspdf && window.jspdf.jsPDF ? window.jspdf.jsPDF : null);
        if (exportPdfBtn && JsPDF) {
            exportPdfBtn.addEventListener('click', function () {
                if (lista.length === 0) {
                    showToast('Nenhum pedido para exportar.', 'warning');
                    return;
                }
                var doc = new JsPDF();
                doc.setFontSize(14);
                doc.text('Pedidos de Peças - Backup Operacional', 14, 16);
                doc.setFontSize(10);
                var y = 24;
                lista.forEach(function (p) {
                    doc.text('OS ' + (p.os || '—') + ' | Cód. ' + (p.codigo || '—') + ' | SELB ' + (p.selb || '—') + ' | ' + (p.dataSolicitacao || '') + ' | ' + (p.statusEntrega || 'pendente'), 14, y);
                    y += 6;
                });
                doc.save('backup_pedidos_' + new Date().toISOString().slice(0, 10) + '.pdf');
                showToast('PDF guardado.', 'success');
            });
        }
        if (exportExcelBtn && typeof XLSX !== 'undefined') {
            exportExcelBtn.addEventListener('click', function () {
                if (lista.length === 0) {
                    showToast('Nenhum pedido para exportar.', 'warning');
                    return;
                }
                var rows = [['OS', 'Código peça', 'SELB', 'Data solicitação', 'Status entrega']];
                lista.forEach(function (p) {
                    rows.push([p.os || '', p.codigo || '', p.selb || '', p.dataSolicitacao || '', p.statusEntrega || 'pendente']);
                });
                var wb = XLSX.utils.book_new();
                var ws = XLSX.utils.aoa_to_sheet(rows);
                XLSX.utils.book_append_sheet(wb, ws, 'Backup');
                XLSX.writeFile(wb, 'backup_pedidos_' + new Date().toISOString().slice(0, 10) + '.xlsx');
                showToast('Excel guardado.', 'success');
            });
        }
        var exportCsvBtn = document.getElementById('selbetti-backup-export-csv');
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', function () {
                if (lista.length === 0) {
                    showToast('Nenhum pedido para exportar.', 'warning');
                    return;
                }
                var header = 'OS;Código;SELB;Data;Status\n';
                var body = lista.map(function (p) {
                    return [p.os || '', p.codigo || '', p.selb || '', p.dataSolicitacao || '', p.statusEntrega || 'pendente'].map(function (cell) {
                        return '"' + String(cell).replace(/"/g, '""') + '"';
                    }).join(';');
                }).join('\n');
                var blob = new Blob(['\ufeff' + header + body], { type: 'text/csv;charset=utf-8' });
                var a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'backup_pedidos_' + new Date().toISOString().slice(0, 10) + '.csv';
                a.click();
                URL.revokeObjectURL(a.href);
                showToast('CSV guardado.', 'success');
            });
        }

        if (pedidoBtn) {
            pedidoBtn.addEventListener('click', function () {
                var os = (osInput && osInput.value || '').trim();
                var codigo = (codigoInput && codigoInput.value || '').trim();
                var selb = (selbInput && selbInput.value || '').trim();
                var dataSolicitacao = (dataInput && dataInput.value) || new Date().toISOString().slice(0, 10);
                if (!os && !codigo && !selb) {
                    showToast('Preencha pelo menos OS, código da peça ou SELB.', 'warning');
                    return;
                }
                var tags = [];
                if (tagsInput && tagsInput.value.trim()) {
                    tags = tagsInput.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
                }
                lista.push({
                    os: os,
                    codigo: codigo,
                    selb: selb,
                    dataSolicitacao: dataSolicitacao,
                    statusEntrega: 'pendente',
                    data: new Date().toISOString(),
                    tags: tags
                });
                saveJSON('backup_pedidos', lista);
                if (osInput) osInput.value = '';
                if (codigoInput) codigoInput.value = '';
                if (selbInput) selbInput.value = '';
                if (dataInput) dataInput.value = '';
                if (tagsInput) tagsInput.value = '';
                render();
                showToast('Pedido anotado.', 'success');
            });
        }

        [filterOs, filterSelb, filterFrom, filterTo, filterStatus].forEach(function (el) {
            if (el) el.addEventListener('change', render);
            if (el && el.tagName === 'INPUT') el.addEventListener('input', render);
        });
        render();
    }

    // --- Atas e Reuniões (gravação por microfone + transcrição em tempo real) ---
    function initAtas() {
        var lista = loadJSON('atas', []);
        var addBtn = document.getElementById('selbetti-ata-add');
        var tituloInput = document.getElementById('selbetti-ata-titulo');
        var dataInput = document.getElementById('selbetti-ata-data');
        var resumoInput = document.getElementById('selbetti-ata-resumo');
        var container = document.getElementById('selbetti-atas-itens');
        var tabs = document.querySelectorAll('.selbetti-tab');
        var micStart = document.getElementById('selbetti-ata-mic-start');
        var micStop = document.getElementById('selbetti-ata-mic-stop');
        var transcriptEl = document.getElementById('selbetti-ata-transcript');
        var saveTranscriptBtn = document.getElementById('selbetti-ata-save-transcript');

        var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        var recognition = null;
        var isRecording = false;
        var currentHighlights = [];
        var highlightsWrap = document.getElementById('selbetti-ata-highlights');
        var highlightsList = document.getElementById('selbetti-ata-highlights-list');

        function detectVoiceCommand(text) {
            var t = (text || '').toLowerCase();
            if (t.indexOf('anote que') !== -1 || t.indexOf('anotar que') !== -1 || t.indexOf('ia, anote') !== -1) {
                var extract = t.replace(/^(ia[,\s]*)?(anote\s+que|anotar\s+que)\s*/i, '').trim();
                if (extract.length > 3) return extract;
            }
            if (t.indexOf('precisa de troca urgente') !== -1 || t.indexOf('troca urgente') !== -1) {
                var part = t.split(/troca urgente|precisa de troca urgente/i)[0].trim();
                var peca = part.split(/\s+(?:a\s+)?peça\s+/i).pop() || part;
                if (peca.length > 2) return 'Peça ' + peca + ' – troca urgente';
            }
            return null;
        }

        if (SpeechRecognition) {
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'pt-PT';
            recognition.onresult = function (event) {
                if (!transcriptEl) return;
                var final = '';
                for (var i = event.resultIndex; i < event.results.length; i++) {
                    var transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        final += transcript;
                        var cmd = detectVoiceCommand(transcript);
                        if (cmd && highlightsList) {
                            currentHighlights.push(cmd);
                            highlightsWrap.style.display = 'block';
                            var li = document.createElement('li');
                            li.textContent = cmd;
                            highlightsList.appendChild(li);
                        }
                    }
                }
                if (final) {
                    transcriptEl.value += final;
                }
            };
            recognition.onerror = function (e) {
                if (e.error === 'no-speech') return;
                showToast('Erro no reconhecimento de voz: ' + (e.error || 'desconhecido'), 'warning');
            };
            recognition.onend = function () {
                if (isRecording && recognition) {
                    try { recognition.start(); } catch (err) {}
                }
            };
        }

        if (micStart) {
            micStart.addEventListener('click', function () {
                if (!recognition) {
                    showToast('O seu browser não suporta reconhecimento de voz. Use Chrome.', 'warning');
                    return;
                }
                isRecording = true;
                micStart.disabled = true;
                if (micStop) micStop.disabled = false;
                try {
                    recognition.start();
                    showToast('A gravar… Fale para transcrever.', 'info');
                } catch (e) {
                    isRecording = false;
                    micStart.disabled = false;
                    if (micStop) micStop.disabled = true;
                    showToast('Não foi possível iniciar o microfone.', 'warning');
                }
            });
        }
        if (micStop) {
            micStop.addEventListener('click', function () {
                isRecording = false;
                if (recognition) try { recognition.stop(); } catch (err) {}
                if (micStart) micStart.disabled = false;
                micStop.disabled = true;
                showToast('Gravação parada. Pode editar e guardar como ata.', 'success');
            });
        }
        function updateAtaStats() {
            var text = (transcriptEl && transcriptEl.value) || '';
            var words = text.trim() ? text.trim().split(/\s+/).length : 0;
            var readMins = Math.max(1, Math.ceil(words / 200));
            var wcEl = document.getElementById('selbetti-ata-word-count');
            var rtEl = document.getElementById('selbetti-ata-read-time');
            if (wcEl) wcEl.textContent = words + ' palavras';
            if (rtEl) rtEl.textContent = '~' + readMins + ' min leitura';
        }
        if (transcriptEl) {
            transcriptEl.addEventListener('input', updateAtaStats);
            transcriptEl.addEventListener('paste', function () { setTimeout(updateAtaStats, 0); });
        }

        var presentationBtn = document.getElementById('selbetti-ata-presentation');
        var presentationOverlay = document.getElementById('selbetti-presentation-overlay');
        var presentationContent = document.getElementById('selbetti-presentation-content');
        var presentationClose = document.getElementById('selbetti-presentation-close');
        if (presentationBtn && presentationOverlay && presentationContent) {
            presentationBtn.addEventListener('click', function () {
                var text = (transcriptEl && transcriptEl.value) || '';
                if (!text.trim()) { showToast('Escreva ou grave texto primeiro.', 'warning'); return; }
                presentationContent.textContent = text;
                presentationOverlay.style.display = 'flex';
            });
            if (presentationClose) presentationClose.addEventListener('click', function () { presentationOverlay.style.display = 'none'; });
            presentationOverlay.addEventListener('click', function (e) { if (e.target === presentationOverlay) presentationOverlay.style.display = 'none'; });
        }

        var templateSelect = document.getElementById('selbetti-ata-template');
        if (templateSelect && transcriptEl) {
            templateSelect.addEventListener('change', function () {
                if (this.value === 'padrao') {
                    transcriptEl.value = 'Ordem do dia:\n\nParticipantes:\n\nConclusões:\n\n';
                    updateAtaStats();
                }
            });
        }

        var resumirBtn = document.getElementById('selbetti-ata-resumir');
        if (resumirBtn && transcriptEl) {
            resumirBtn.addEventListener('click', function () {
                var texto = (transcriptEl.value || '').trim();
                if (!texto) {
                    showToast('Não há texto para resumir. Grave ou escreva primeiro.', 'warning');
                    return;
                }
                var paras = texto.split(/\n\n+/);
                var lines = [];
                paras.forEach(function (p) {
                    var first = (p.trim().split(/[.!?]/)[0] || p.trim().slice(0, 80)).trim();
                    if (first) lines.push(first + (first.length >= 80 ? '…' : ''));
                });
                var resumo = lines.join('\n\n');
                transcriptEl.value = '--- Resumo ---\n\n' + resumo + '\n\n--- Texto completo (abaixo) ---\n\n' + texto;
                showToast('Resumo inserido no início do texto.', 'success');
            });
        }
        if (saveTranscriptBtn && transcriptEl && tituloInput) {
            saveTranscriptBtn.addEventListener('click', function () {
                var texto = (transcriptEl.value || '').trim();
                if (!texto) {
                    showToast('Não há texto para guardar. Grave primeiro ou escreva na caixa.', 'warning');
                    return;
                }
                var titulo = (tituloInput.value || '').trim() || 'Ata de reunião (voz)';
                var ata = {
                    titulo: titulo,
                    data: (dataInput && dataInput.value) || new Date().toLocaleDateString('pt-BR'),
                    resumo: texto,
                    tipo: currentAtaTab
                };
                if (currentHighlights.length > 0) {
                    ata.destaques = currentHighlights.slice();
                }
                lista.push(ata);
                saveJSON('atas', lista);
                transcriptEl.value = '';
                tituloInput.value = '';
                if (dataInput) dataInput.value = '';
                currentHighlights = [];
                if (highlightsWrap) highlightsWrap.style.display = 'none';
                if (highlightsList) highlightsList.innerHTML = '';
                if (window.renderAtas) window.renderAtas();
                if (window.selbettiRefreshDashboard) window.selbettiRefreshDashboard();
                showToast('Ata guardada com o texto da reunião.', 'success');
                saveTranscriptBtn.classList.add('success');
                saveTranscriptBtn.innerHTML = '<i class="fas fa-check"></i> Guardado';
                setTimeout(function () {
                    saveTranscriptBtn.classList.remove('success');
                    saveTranscriptBtn.innerHTML = '<i class="fas fa-save"></i> Guardar como ata';
                }, 2500);
            });
        }

        function renderAtas() {
            if (!container) return;
            var filtro = currentAtaTab;
            var filtrados = lista.filter(function (a) {
                return (a.tipo || 'semanais') === filtro;
            });
            container.innerHTML = '';
            if (filtrados.length === 0) {
                container.innerHTML = '<li class="selbetti-empty">Nenhuma ata nesta categoria. Adicione acima e escolha o tipo pela aba.</li>';
                return;
            }
            filtrados.forEach(function (item, i) {
                var idx = lista.indexOf(item);
                var dest = (item.destaques && item.destaques.length) ? ' [' + item.destaques.length + ' destaque(s)]' : '';
                var resumoShort = item.resumo ? (item.resumo.substring(0, 60) + (item.resumo.length > 60 ? '…' : '')) : '';
                var li = document.createElement('li');
                li.innerHTML = '<span><strong>' + (item.titulo || '—') + '</strong> · ' + (item.data || '—') + dest + (resumoShort ? ' · ' + resumoShort : '') + '</span><button type="button" class="selbetti-item-del" data-idx="' + idx + '">Remover</button>';
                container.appendChild(li);
            });
            container.querySelectorAll('.selbetti-item-del').forEach(function (b) {
                b.addEventListener('click', function () {
                    var idx = parseInt(this.getAttribute('data-idx'), 10);
                    if (!confirm('Tem a certeza que deseja remover esta ata?')) return;
                    lista.splice(idx, 1);
                    saveJSON('atas', lista);
                    renderAtas();
                    showToast('Ata removida.', 'success');
                });
            });
        }

        window.renderAtas = renderAtas;

        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                currentAtaTab = this.getAttribute('data-ata');
                tabs.forEach(function (t) {
                    t.classList.toggle('active', t.getAttribute('data-ata') === currentAtaTab);
                });
                renderAtas();
            });
        });

        if (addBtn && tituloInput) {
            addBtn.addEventListener('click', function () {
                var titulo = (tituloInput.value || '').trim();
                if (!titulo) {
                    showToast('Indique o título da reunião / ata.', 'warning');
                    return;
                }
                lista.push({
                    titulo: titulo,
                    data: (dataInput && dataInput.value || '').trim() || new Date().toLocaleDateString('pt-BR'),
                    resumo: (resumoInput && resumoInput.value || '').trim(),
                    tipo: currentAtaTab
                });
                saveJSON('atas', lista);
                tituloInput.value = '';
                if (dataInput) dataInput.value = '';
                if (resumoInput) resumoInput.value = '';
                renderAtas();
                if (window.selbettiRefreshDashboard) window.selbettiRefreshDashboard();
                showToast('Ata / print registada.', 'success');
            });
        }

        var atasExportPdf = document.getElementById('selbetti-atas-export-pdf');
        var atasExportExcel = document.getElementById('selbetti-atas-export-excel');
        var calendarLink = document.getElementById('selbetti-atas-calendar-link');
        var JsPDFAtas = typeof jspdf !== 'undefined' && jspdf.jsPDF ? jspdf.jsPDF : (typeof window !== 'undefined' && window.jspdf && window.jspdf.jsPDF ? window.jspdf.jsPDF : null);
        if (atasExportPdf && JsPDFAtas) {
            atasExportPdf.addEventListener('click', function () {
                var filtrados = lista.filter(function (a) { return (a.tipo || 'semanais') === currentAtaTab; });
                if (filtrados.length === 0) {
                    showToast('Nenhuma ata para exportar nesta aba.', 'warning');
                    return;
                }
                var doc = new JsPDFAtas();
                doc.setFontSize(14);
                doc.text('Atas e Reuniões - ' + currentAtaTab, 14, 16);
                doc.setFontSize(10);
                var y = 24;
                filtrados.forEach(function (a) {
                    doc.text((a.titulo || '—') + ' | ' + (a.data || '—'), 14, y);
                    y += 6;
                    if (a.resumo) {
                        var lines = doc.splitTextToSize(a.resumo, 170);
                        lines.forEach(function (line) {
                            doc.text(line, 14, y);
                            y += 5;
                        });
                        y += 4;
                    }
                });
                doc.save('atas_' + currentAtaTab + '_' + new Date().toISOString().slice(0, 10) + '.pdf');
                showToast('PDF guardado.', 'success');
            });
        }
        if (atasExportExcel && typeof XLSX !== 'undefined') {
            atasExportExcel.addEventListener('click', function () {
                var filtrados = lista.filter(function (a) { return (a.tipo || 'semanais') === currentAtaTab; });
                if (filtrados.length === 0) {
                    showToast('Nenhuma ata para exportar nesta aba.', 'warning');
                    return;
                }
                var rows = [['Título', 'Data', 'Resumo', 'Destaques']];
                filtrados.forEach(function (a) {
                    rows.push([
                        a.titulo || '',
                        a.data || '',
                        (a.resumo || '').substring(0, 500),
                        (a.destaques && a.destaques.length) ? a.destaques.join('; ') : ''
                    ]);
                });
                var wb = XLSX.utils.book_new();
                var ws = XLSX.utils.aoa_to_sheet(rows);
                XLSX.utils.book_append_sheet(wb, ws, 'Atas');
                XLSX.writeFile(wb, 'atas_' + currentAtaTab + '_' + new Date().toISOString().slice(0, 10) + '.xlsx');
                showToast('Excel guardado.', 'success');
            });
        }
        if (calendarLink) {
            function updateCalendarLink() {
                var filtrados = lista.filter(function (a) { return (a.tipo || 'semanais') === currentAtaTab; });
                var last = filtrados.length ? filtrados[filtrados.length - 1] : null;
                if (!last) {
                    calendarLink.href = '#';
                    calendarLink.style.opacity = '0.5';
                    return;
                }
                var title = encodeURIComponent(last.titulo || 'Reunião');
                var dateStr = (last.data || '').replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1');
                var d = dateStr ? new Date(dateStr) : new Date();
                if (isNaN(d.getTime())) d = new Date();
                var Y = d.getFullYear();
                var M = String(d.getMonth() + 1).padStart(2, '0');
                var D = String(d.getDate()).padStart(2, '0');
                calendarLink.href = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + title + '&dates=' + Y + M + D + '/' + Y + M + D;
                calendarLink.style.opacity = '1';
            }
            updateCalendarLink();
            tabs.forEach(function (t) {
                t.addEventListener('click', function () {
                    setTimeout(updateCalendarLink, 0);
                });
            });
        }
        var atasExportMd = document.getElementById('selbetti-atas-export-md');
        if (atasExportMd) {
            atasExportMd.addEventListener('click', function () {
                var filtrados = lista.filter(function (a) { return (a.tipo || 'semanais') === currentAtaTab; });
                if (filtrados.length === 0) {
                    showToast('Nenhuma ata para exportar nesta aba.', 'warning');
                    return;
                }
                var md = '# Atas e Reuniões - ' + currentAtaTab + '\n\n';
                filtrados.forEach(function (a) {
                    md += '## ' + (a.titulo || '—') + ' (' + (a.data || '') + ')\n\n';
                    md += (a.resumo || '') + '\n\n';
                    if (a.destaques && a.destaques.length) {
                        md += '**Destaques:**\n';
                        a.destaques.forEach(function (d) { md += '- ' + d + '\n'; });
                        md += '\n';
                    }
                });
                var blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
                var a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'atas_' + currentAtaTab + '_' + new Date().toISOString().slice(0, 10) + '.md';
                a.click();
                URL.revokeObjectURL(a.href);
                showToast('Markdown guardado.', 'success');
            });
        }
        var atasEmailSend = document.getElementById('selbetti-atas-email-send');
        if (atasEmailSend) {
            atasEmailSend.addEventListener('click', function () {
                var filtrados = lista.filter(function (a) { return (a.tipo || 'semanais') === currentAtaTab; });
                var last = filtrados.length ? filtrados[filtrados.length - 1] : null;
                if (!last) {
                    showToast('Nenhuma ata para enviar.', 'warning');
                    return;
                }
                var subj = encodeURIComponent('Ata: ' + (last.titulo || 'Reunião'));
                var body = encodeURIComponent((last.resumo || '') + '\n\n— Enviado pela Biblioteca Selbetti AXIS');
                window.location.href = 'mailto:?subject=' + subj + '&body=' + body;
            });
        }

        var recordAudioBtn = document.getElementById('selbetti-ata-record-audio');
        var mediaRecorder = null;
        var audioChunks = [];
        if (recordAudioBtn) {
            recordAudioBtn.addEventListener('click', function () {
                if (mediaRecorder && mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                    recordAudioBtn.innerHTML = '<i class="fas fa-file-audio"></i> Gravar áudio';
                    recordAudioBtn.classList.remove('recording');
                    return;
                }
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    showToast('Gravação de áudio não suportada neste browser.', 'warning');
                    return;
                }
                navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
                    audioChunks = [];
                    mediaRecorder = new MediaRecorder(stream);
                    mediaRecorder.ondataavailable = function (e) { if (e.data.size > 0) audioChunks.push(e.data); };
                    mediaRecorder.onstop = function () {
                        stream.getTracks().forEach(function (t) { t.stop(); });
                        if (audioChunks.length === 0) return;
                        var blob = new Blob(audioChunks, { type: 'audio/webm' });
                        var url = URL.createObjectURL(blob);
                        var a = document.createElement('a');
                        a.href = url;
                        a.download = 'ata_audio_' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.webm';
                        a.click();
                        URL.revokeObjectURL(url);
                        showToast('Áudio guardado.', 'success');
                    };
                    mediaRecorder.start();
                    recordAudioBtn.innerHTML = '<i class="fas fa-stop"></i> Parar áudio';
                    recordAudioBtn.classList.add('recording');
                }).catch(function () {
                    showToast('Não foi possível aceder ao microfone.', 'warning');
                });
            });
        }

        if (typeof updateAtaStats === 'function') updateAtaStats();

        renderAtas();
    }

    // --- Assistente (ideias 17, 20: comandos de voz já no HTML; chat sobre dados) ---
    function initAssistant() {
        var panel = document.getElementById('selbetti-assistant-panel');
        var fab = document.getElementById('selbetti-assistant-fab');
        var closeBtn = document.getElementById('selbetti-assistant-close');
        var queryInput = document.getElementById('selbetti-assistant-query');
        var askBtn = document.getElementById('selbetti-assistant-ask');
        var answerEl = document.getElementById('selbetti-assistant-answer');

        if (fab && panel) {
            fab.addEventListener('click', function () {
                panel.classList.toggle('open');
            });
        }
        if (closeBtn && panel) {
            closeBtn.addEventListener('click', function () {
                panel.classList.remove('open');
            });
        }
        function answerFromData(question) {
            var q = (question || '').toLowerCase();
            var backup = loadJSON('backup_pedidos', []);
            var pendentes = backup.filter(function (p) {
                var s = (p.statusEntrega || 'pendente');
                return s === 'pendente' || !s;
            }).length;
            if (q.indexOf('pedido') !== -1 && (q.indexOf('pendente') !== -1 || q.indexOf('quantos') !== -1)) {
                return 'Há ' + pendentes + ' pedido(s) pendente(s) de um total de ' + backup.length + '.';
            }
            if (q.indexOf('certificado') !== -1) {
                var certs = loadJSON('certificados_ficheiros', []);
                return 'Tem ' + certs.length + ' certificado(s) registados.';
            }
            if (q.indexOf('ata') !== -1 || q.indexOf('atas') !== -1) {
                var atas = loadJSON('atas', []);
                return 'Tem ' + atas.length + ' ata(s) registadas.';
            }
            if (q.indexOf('orçamento') !== -1 || q.indexOf('orcamento') !== -1) {
                var orc = loadJSON('orcamento_ficheiros', []);
                return 'Tem ' + orc.length + ' ficheiro(s) de orçamento.';
            }
            return 'Pode perguntar: "Quantos pedidos pendentes?", "Quantos certificados?", "Quantas atas?"';
        }
        if (askBtn && queryInput && answerEl) {
            askBtn.addEventListener('click', function () {
                var text = queryInput.value.trim();
                answerEl.textContent = text ? answerFromData(text) : 'Escreva uma pergunta sobre os seus dados.';
            });
            queryInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') askBtn.click();
            });
        }
    }

    // --- Fase 1: Pesquisa global (9), Sync (1), Export/Import (2), Configurações (6), Compare (22), Versões (3) ---
    function initPhase1() {
        var searchInput = document.getElementById('selbetti-global-search');
        var searchOverlay = document.getElementById('selbetti-search-overlay');
        var searchResults = document.getElementById('selbetti-search-results');

        if (searchInput && searchOverlay && searchResults) {
            function runGlobalSearch(term) {
                term = (term || '').trim().toLowerCase();
                searchResults.innerHTML = '';
                if (!term || term.length < 2) {
                    searchOverlay.style.display = 'none';
                    return;
                }
                var items = [];
                ['orcamento_ficheiros', 'certificados_ficheiros', 'backup_pedidos', 'atas', 'ferramentas'].forEach(function (key) {
                    var list = loadJSON(key, []);
                    list.forEach(function (item, i) {
                        var str = JSON.stringify(item);
                        if (str.toLowerCase().indexOf(term) !== -1) {
                            var label = (item.name || item.titulo || item.os || item.nome || 'Item') + ' (' + key.replace('_', ' ') + ')';
                            items.push({ label: label, key: key, index: i, section: key === 'orcamento_ficheiros' ? 'orcamento' : key === 'certificados_ficheiros' ? 'certificados' : key === 'backup_pedidos' ? 'backup' : key === 'atas' ? 'atas' : 'ferramentas' });
                        }
                    });
                });
                if (items.length === 0) {
                    searchResults.innerHTML = '<p class="selbetti-desc">Nenhum resultado para "' + term + '".</p>';
                } else {
                    items.slice(0, 20).forEach(function (it) {
                        var a = document.createElement('button');
                        a.type = 'button';
                        a.className = 'selbetti-search-item';
                        a.textContent = it.label;
                        a.addEventListener('click', function () {
                            searchOverlay.style.display = 'none';
                            searchInput.value = '';
                            var sec = document.getElementById('section-' + it.section);
                            if (sec) {
                                document.querySelectorAll('.selbetti-section').forEach(function (s) { s.classList.remove('active'); });
                                document.querySelectorAll('.selbetti-nav-item').forEach(function (n) { n.classList.remove('active'); });
                                sec.classList.add('active');
                                var navBtn = document.querySelector('.selbetti-nav-item[data-section="' + it.section + '"]');
                                if (navBtn) navBtn.classList.add('active');
                            }
                            if (window.selbettiRefreshDashboard) window.selbettiRefreshDashboard();
                        });
                        searchResults.appendChild(a);
                    });
                }
                searchOverlay.style.display = 'block';
            }
            searchInput.addEventListener('input', function () { runGlobalSearch(this.value); });
            searchInput.addEventListener('focus', function () { if (this.value.trim().length >= 2) runGlobalSearch(this.value); });
            searchOverlay.addEventListener('click', function (e) {
                if (e.target === searchOverlay) searchOverlay.style.display = 'none';
            });
        }

        var syncBtn = document.getElementById('selbetti-sync-btn');
        var syncStatus = document.getElementById('selbetti-sync-status');
        if (syncBtn && syncStatus) {
            syncBtn.addEventListener('click', function () {
                syncStatus.textContent = '…';
                setTimeout(function () {
                    syncStatus.textContent = '';
                    showToast('Sincronização com backend em breve. Por agora os dados ficam no navegador.', 'info');
                }, 800);
            });
        }

        var exportToggle = document.getElementById('selbetti-export-import-toggle');
        var exportMenu = document.getElementById('selbetti-export-import-menu');
        if (exportToggle && exportMenu) {
            exportToggle.addEventListener('click', function () { exportMenu.classList.toggle('open'); });
            document.addEventListener('click', function (e) {
                if (!exportMenu.contains(e.target) && e.target !== exportToggle) exportMenu.classList.remove('open');
            });
        }
        var exportAll = document.getElementById('selbetti-export-all');
        if (exportAll) {
            exportAll.addEventListener('click', function () {
                var data = {};
                for (var i = 0; i < localStorage.length; i++) {
                    var k = localStorage.key(i);
                    if (k && k.indexOf(STORAGE_PREFIX) === 0) {
                        try {
                            data[k] = localStorage.getItem(k);
                        } catch (err) {}
                    }
                }
                var blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
                var a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'selbetti-biblioteca-' + new Date().toISOString().slice(0, 10) + '.json';
                a.click();
                URL.revokeObjectURL(a.href);
                showToast('Biblioteca exportada.', 'success');
                if (exportMenu) exportMenu.classList.remove('open');
            });
        }
        var importFile = document.getElementById('selbetti-import-file');
        if (importFile) {
            importFile.addEventListener('change', function () {
                var f = this.files[0];
                if (!f) return;
                var r = new FileReader();
                r.onload = function () {
                    try {
                        var data = JSON.parse(r.result);
                        var count = 0;
                        for (var k in data) {
                            if (k.indexOf(STORAGE_PREFIX) === 0) {
                                localStorage.setItem(k, data[k]);
                                count++;
                            }
                        }
                        showToast('Importados ' + count + ' conjuntos de dados.', 'success');
                        if (window.selbettiRefreshDashboard) window.selbettiRefreshDashboard();
                        document.querySelectorAll('.selbetti-section').forEach(function (s) { s.classList.remove('active'); });
                        document.getElementById('section-inicio').classList.add('active');
                        setTimeout(function () {
                            window.location.reload();
                        }, 500);
                    } catch (err) {
                        showToast('Ficheiro inválido.', 'error');
                    }
                };
                r.readAsText(f);
                this.value = '';
            });
        }

        var settingsBtn = document.getElementById('selbetti-settings-btn');
        var settingsModal = document.getElementById('selbetti-settings-modal');
        var settingsClose = document.getElementById('selbetti-settings-close');
        if (settingsBtn && settingsModal) {
            settingsBtn.addEventListener('click', function () { settingsModal.style.display = 'flex'; });
            if (settingsClose) settingsClose.addEventListener('click', function () { settingsModal.style.display = 'none'; });
            settingsModal.addEventListener('click', function (e) {
                if (e.target === settingsModal) settingsModal.style.display = 'none';
            });
        }
        ['selbetti-sync-orcamento', 'selbetti-sync-certificados', 'selbetti-sync-backup', 'selbetti-sync-atas', 'selbetti-sync-ferramentas'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) {
                var key = getStorageKey('sync_' + id.replace('selbetti-sync-', ''));
                try {
                    el.checked = localStorage.getItem(key) !== '0';
                } catch (e) {}
                el.addEventListener('change', function () {
                    try {
                        localStorage.setItem(key, this.checked ? '1' : '0');
                    } catch (e) {}
                });
            }
        });
        var bodyEl = document.getElementById('selbetti-body') || document.body;
        var accentKey = getStorageKey('accent');
        try {
            var savedAccent = localStorage.getItem(accentKey) || 'blue';
            if (bodyEl) bodyEl.setAttribute('data-accent', savedAccent);
        } catch (e) {
            if (bodyEl) bodyEl.setAttribute('data-accent', 'blue');
        }
        document.querySelectorAll('.selbetti-accent-dot').forEach(function (dot) {
            dot.addEventListener('click', function () {
                var accent = this.getAttribute('data-accent');
                if (accent && bodyEl) {
                    bodyEl.setAttribute('data-accent', accent);
                    document.querySelectorAll('.selbetti-accent-dot').forEach(function (d) { d.classList.remove('active'); });
                    this.classList.add('active');
                    try { localStorage.setItem(accentKey, accent); } catch (e) {}
                    showToast('Cor de destaque alterada.', 'success');
                }
            });
            if (bodyEl && dot.getAttribute('data-accent') === (bodyEl.getAttribute('data-accent') || 'blue')) dot.classList.add('active');
        });
        var compactCheck = document.getElementById('selbetti-compact-mode');
        var compactKey = getStorageKey('compact');
        try {
            if (localStorage.getItem(compactKey) === '1' && bodyEl) bodyEl.classList.add('selbetti-compact');
            if (compactCheck) compactCheck.checked = localStorage.getItem(compactKey) === '1';
        } catch (e) {}
        if (compactCheck && bodyEl) {
            compactCheck.addEventListener('change', function () {
                bodyEl.classList.toggle('selbetti-compact', this.checked);
                try { localStorage.setItem(compactKey, this.checked ? '1' : '0'); } catch (e) {}
                showToast(this.checked ? 'Modo compacto ativado.' : 'Modo compacto desativado.', 'info');
            });
        }

        var compareModal = document.getElementById('selbetti-compare-modal');
        var compareClose = document.getElementById('selbetti-compare-close');
        if (compareClose && compareModal) {
            compareClose.addEventListener('click', function () { compareModal.style.display = 'none'; });
            compareModal.addEventListener('click', function (e) {
                if (e.target === compareModal) compareModal.style.display = 'none';
            });
        }
        var compareBtn = document.getElementById('selbetti-orcamento-compare-btn');
        if (compareBtn && compareModal) {
            compareBtn.addEventListener('click', function () {
                var list = loadJSON('orcamento_ficheiros', []);
                if (list.length < 2) {
                    showToast('Adicione pelo menos 2 orçamentos para comparar.', 'info');
                    return;
                }
                var left = document.getElementById('selbetti-compare-left');
                var right = document.getElementById('selbetti-compare-right');
                if (left && right) {
                    left.innerHTML = '<p>' + (list[list.length - 1].name || 'Orçamento 1') + '</p>';
                    right.innerHTML = '<p>' + (list[list.length - 2].name || 'Orçamento 2') + '</p>';
                    if (list[list.length - 1].dataUrl) {
                        var img1 = document.createElement('img');
                        img1.src = list[list.length - 1].dataUrl;
                        img1.style.maxWidth = '100%';
                        img1.style.borderRadius = '8px';
                        left.appendChild(img1);
                    }
                    if (list[list.length - 2].dataUrl) {
                        var img2 = document.createElement('img');
                        img2.src = list[list.length - 2].dataUrl;
                        img2.style.maxWidth = '100%';
                        img2.style.borderRadius = '8px';
                        right.appendChild(img2);
                    }
                }
                compareModal.style.display = 'flex';
            });
        }

        var versionModal = document.getElementById('selbetti-version-modal');
        var versionClose = document.getElementById('selbetti-version-close');
        if (versionClose && versionModal) {
            versionClose.addEventListener('click', function () { versionModal.style.display = 'none'; });
            versionModal.addEventListener('click', function (e) {
                if (e.target === versionModal) versionModal.style.display = 'none';
            });
        }
        var versionList = document.getElementById('selbetti-version-list');
        if (versionList) {
            versionList.innerHTML = '<li>Nenhuma versão anterior guardada. (Em desenvolvimento.)</li>';
        }
    }

    // --- Inicialização ---
    function init() {
        initTheme();
        initDashboard();
        initNav();
        initOrcamento();
        initFerramentas();
        initCertificados();
        initBackup();
        initAtas();
        initAssistant();
        initPhase1();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
