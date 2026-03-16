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

    // --- Dashboard (cards de status) ---
    function initDashboard() {
        var pedidosN = document.getElementById('selbetti-dash-pedidos-n');
        var certText = document.getElementById('selbetti-dash-cert-text');
        var ataText = document.getElementById('selbetti-dash-ata-text');
        var backupList = loadJSON('backup_pedidos', []);
        var certList = loadJSON('certificados_ficheiros', []);
        var atasList = loadJSON('atas', []);

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
                    lista.splice(i, 1);
                    saveJSON('orcamento_ficheiros', lista);
                    render();
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

    // --- Ferramentas Anotadas ---
    function initFerramentas() {
        var lista = loadJSON('ferramentas', []);
        var addBtn = document.getElementById('selbetti-ferramenta-add');
        var nomeInput = document.getElementById('selbetti-ferramenta-nome');
        var notaInput = document.getElementById('selbetti-ferramenta-nota');
        var container = document.getElementById('selbetti-ferramentas-itens');

        function render() {
            if (!container) return;
            container.innerHTML = '';
            if (lista.length === 0) {
                container.innerHTML = '<li class="selbetti-empty">Nenhuma ferramenta. Adicione acima.</li>';
                return;
            }
            lista.forEach(function (item, i) {
                var li = document.createElement('li');
                li.innerHTML = '<span><strong>' + (item.nome || '—') + '</strong>' + (item.nota ? ' · ' + item.nota : '') + '</span><button type="button" class="selbetti-item-del" data-i="' + i + '">Remover</button>';
                container.appendChild(li);
            });
            container.querySelectorAll('.selbetti-item-del').forEach(function (b) {
                b.addEventListener('click', function () {
                    var i = parseInt(this.getAttribute('data-i'), 10);
                    lista.splice(i, 1);
                    saveJSON('ferramentas', lista);
                    render();
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
                lista.push({ nome: nome, nota: (notaInput.value || '').trim() });
                saveJSON('ferramentas', lista);
                nomeInput.value = '';
                notaInput.value = '';
                render();
                showToast('Ferramenta adicionada.', 'success');
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
                    lista.splice(i, 1);
                    saveJSON('certificados_ficheiros', lista);
                    render();
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
        var container = document.getElementById('selbetti-backup-itens');

        var predictionCard = document.getElementById('selbetti-backup-prediction');
        var predictionText = document.getElementById('selbetti-backup-prediction-text');

        function render() {
            if (!container) return;
            container.innerHTML = '';
            if (lista.length === 0) {
                if (predictionCard) predictionCard.style.display = 'none';
                container.innerHTML = '<li class="selbetti-empty">Nenhum pedido anotado. Preencha OS, código da peça, SELB e data acima.</li>';
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

            lista.forEach(function (item, i) {
                var li = document.createElement('li');
                var status = item.statusEntrega || 'pendente';
                var statusLabel = status === 'transito' ? 'Em trânsito' : status === 'entregue' ? 'Entregue' : 'Pendente';
                li.innerHTML = '<span><strong>OS ' + (item.os || '—') + '</strong> · Cód. ' + (item.codigo || '—') + ' · SELB ' + (item.selb || '—') + ' · ' + (item.dataSolicitacao || (item.data || '').slice(0, 10)) + '</span>' +
                    '<select class="selbetti-status-select" data-i="' + i + '" title="Status de entrega"><option value="pendente"' + (status === 'pendente' ? ' selected' : '') + '>Pendente</option><option value="transito"' + (status === 'transito' ? ' selected' : '') + '>Em trânsito</option><option value="entregue"' + (status === 'entregue' ? ' selected' : '') + '>Entregue</option></select>' +
                    '<button type="button" class="selbetti-item-del" data-i="' + i + '">Remover</button>';
                container.appendChild(li);
            });
            container.querySelectorAll('.selbetti-item-del').forEach(function (b) {
                b.addEventListener('click', function () {
                    var i = parseInt(this.getAttribute('data-i'), 10);
                    lista.splice(i, 1);
                    saveJSON('backup_pedidos', lista);
                    render();
                });
            });
            container.querySelectorAll('.selbetti-status-select').forEach(function (sel) {
                sel.addEventListener('change', function () {
                    var i = parseInt(this.getAttribute('data-i'), 10);
                    if (lista[i]) {
                        lista[i].statusEntrega = this.value;
                        saveJSON('backup_pedidos', lista);
                    }
                });
            });
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
                lista.push({
                    os: os,
                    codigo: codigo,
                    selb: selb,
                    dataSolicitacao: dataSolicitacao,
                    statusEntrega: 'pendente',
                    data: new Date().toISOString()
                });
                saveJSON('backup_pedidos', lista);
                if (osInput) osInput.value = '';
                if (codigoInput) codigoInput.value = '';
                if (selbInput) selbInput.value = '';
                if (dataInput) dataInput.value = '';
                render();
                showToast('Pedido anotado.', 'success');
            });
        }

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
                    lista.splice(idx, 1);
                    saveJSON('atas', lista);
                    renderAtas();
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

        renderAtas();
    }

    // --- Assistente ---
    function initAssistant() {
        var panel = document.getElementById('selbetti-assistant-panel');
        var fab = document.getElementById('selbetti-assistant-fab');
        var closeBtn = document.getElementById('selbetti-assistant-close');

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
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
