/* ==========================================================
   0. RUÍDO DE EXTENSÕES NO CONSOLE (NÃO É BUG DO AXIS)
   ========================================================== */
window.addEventListener('unhandledrejection', function (ev) {
    try {
        var msg = (ev.reason && (ev.reason.message || String(ev.reason))) || '';
        if (typeof msg === 'string' && msg.toLowerCase().indexOf('message channel closed') !== -1) {
            ev.preventDefault();
        }
    } catch (_) {}
});

/* ==========================================================
   1. MOTOR DE GERAÇÃO DE PDF + AVISO MODERNO (UNIFICADO)
   ========================================================== */
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('preventiva-form');
    if (!form) {
        console.error('❌ Formulário preventiva-form não encontrado!');
        return;
    }
    
    form.addEventListener('submit', function(e) {
    e.preventDefault();

    // Validação básica
    if (!this.checkValidity()) {
        showAlert("Atenção", "Por favor, preencha todos os campos obrigatórios.");
        return;
    }

    const serial = document.getElementById('serial_id').value || 'SEM_SERIAL';
    const dataVal = document.getElementById('data_id')?.value || new Date().toISOString().slice(0, 10);
    const dataAtual = dataVal ? new Date(dataVal + 'T00:00:00').toLocaleDateString('pt-BR').replace(/\//g, '-') : new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const btn = document.getElementById('btn-gerar');
    
    // Ano e mês vêm da DATA da preventiva (campo Data do formulário) – pastas automáticas
    const dataPreventiva = dataVal ? new Date(dataVal + 'T00:00:00') : new Date();
    const anoSelecionado = dataPreventiva.getFullYear().toString();
    const mesSelecionado = String(dataPreventiva.getMonth() + 1).padStart(2, '0');
    
    const mesesNomes = {
        '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
        '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
        '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
    };
    const nomeMes = mesesNomes[mesSelecionado] || 'Mes';
    
    const nomeArquivo = `AXIS_PV_${serial}_${anoSelecionado}_${nomeMes}_${dataAtual}.pdf`;
    
    console.log('📁 PDF será salvo em: Manutenções Preventivas/' + anoSelecionado + '/' + nomeMes);
    console.log('📄 Nome do arquivo:', nomeArquivo);

    // Feedback visual e desabilita o botão
    btn.disabled = true;
    btn.textContent = "PROCESSANDO RELATÓRIO...";
    btn.style.opacity = '0.5';

    showAlert("Processando...", "Gerando relatório PDF e salvando em Manutenções Preventivas.");

    try {
        const blob = gerarPDFPreventivaJsPDF();
        if (!blob) throw new Error('PDF não gerado');
        // 1) Download no navegador
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nomeArquivo;
        a.click();
        URL.revokeObjectURL(url);
        
        // 2) Enviar para o backend: Manutenções Preventivas / Ano / Mês
        const reader = new FileReader();
        reader.onloadend = function () {
            const base64 = (reader.result || '').split(',')[1] || '';
            fetch('/api/manutencoes/salvar-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ano: anoSelecionado,
                    mes: mesSelecionado,
                    nomeArquivo: nomeArquivo,
                    pdfBase64: base64
                })
            }).then(function (r) { return r.json(); }).then(function (data) {
                if (data.ok) console.log('✅ PDF salvo em Manutenções Preventivas/' + anoSelecionado + '/' + nomeMes);
                else console.warn('⚠️ Servidor:', data.error || data);
            }).catch(function (e) { console.warn('⚠️ Erro ao enviar PDF para servidor:', e); });
        };
        reader.readAsDataURL(blob);
        
        // Reseta o botão
        btn.disabled = false;
        btn.textContent = "FINALIZAR E GERAR RELATÓRIO PDF";
        btn.style.opacity = '1';
        
        // ========== INTEGRAÇÃO COM WHATSAPP ALERTS ==========
        try {
            if (typeof window.whatsAppAlerts !== 'undefined') {
                const dadosPreventiva = {
                    tecnico: document.getElementById('tecnico_id')?.value || 'FILIPE DA SILVA',
                    modelo: document.getElementById('modelo_id')?.value || 'ZT411',
                    serial: serial,
                    selb: document.getElementById('selb_id')?.value || 'N/D',
                    status: 'Preventiva concluída - PDF gerado',
                    data: dataVal || new Date().toLocaleDateString('pt-BR')
                };
                setTimeout(function () { window.whatsAppAlerts.alertarPreventivaConcluida(dadosPreventiva); }, 1000);
                console.log('✅ Alerta WhatsApp agendado');
            }
        } catch (error) { console.error('❌ WhatsApp:', error); }

        // ========== REGISTRAR NA BIBLIOTECA (localStorage) - dados completos ==========
        try {
            const KEY = 'axis_manutencoes_biblioteca';
            let bib = {};
            try { bib = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (_) {}
            if (!bib[anoSelecionado]) bib[anoSelecionado] = {};
            if (!bib[anoSelecionado][mesSelecionado]) bib[anoSelecionado][mesSelecionado] = [];

            // Coletar checklist (itens marcados)
            const checklist = [];
            document.querySelectorAll('.checklist-grid .ios-check').forEach(function(label) {
                const input = label.querySelector('input[type="checkbox"]');
                const span = label.querySelector('span');
                const grupo = (label.closest('.glass-card') && label.closest('.glass-card').querySelector('h3')) ? label.closest('.glass-card').querySelector('h3').textContent.trim() : '';
                const item = span ? span.textContent.trim() : '';
                checklist.push({ grupo: grupo, item: item, checked: input ? input.checked : false });
            });

            bib[anoSelecionado][mesSelecionado].push({
                id: Date.now(),
                data: dataVal,
                serial: serial,
                modelo: document.getElementById('modelo_id')?.value || '',
                tecnico: document.getElementById('tecnico_id')?.value || '',
                setor: document.getElementById('setor_id')?.value || '',
                unidade: document.getElementById('unidade_id')?.value || '',
                ip: document.getElementById('ip_id')?.value || '',
                macRede: document.getElementById('mac_rede_id')?.value || '',
                macBt: document.getElementById('mac_bt_id')?.value || '',
                selb: document.getElementById('selb_id')?.value || '',
                observacoes: document.getElementById('obs_id')?.value || '',
                checklist: checklist,
                arquivo: nomeArquivo
            });
            localStorage.setItem(KEY, JSON.stringify(bib));
        } catch (_) {}
        
        showAlert("Relatório Concluído", "O checklist foi gerado, o download iniciado e o PDF salvo em Manutenções Preventivas/" + anoSelecionado + "/" + nomeMes + ".");

    } catch (err) {
        btn.disabled = false;
        btn.textContent = "FINALIZAR E GERAR RELATÓRIO PDF";
        btn.style.opacity = '1';
        console.error("Erro crítico:", err);
        showAlert("Erro", "Não foi possível gerar o PDF. Tente novamente.");
    }
    });
});

/* Gera PDF de manutenção preventiva com jsPDF - design em vidro (glassmorphism) */
function gerarPDFPreventivaJsPDF() {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
        console.error('jsPDF não carregado');
        return null;
    }
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.width;
    const pageH = doc.internal.pageSize.height;
    const margin = 18;
    const sectionGap = 14;
    const COL_GREEN = [40, 167, 69];
    const COL_ORANGE = [253, 126, 20];
    const GLASS_FILL = [255, 255, 255];
    const GLASS_BORDER = [230, 234, 239];
    const GLASS_ACCENT = [241, 245, 249];

    function glassCard(x, y, w, h, accentColor) {
        doc.setFillColor(GLASS_FILL[0], GLASS_FILL[1], GLASS_FILL[2]);
        doc.setDrawColor(accentColor ? accentColor[0] : GLASS_BORDER[0], accentColor ? accentColor[1] : GLASS_BORDER[1], accentColor ? accentColor[2] : GLASS_BORDER[2]);
        doc.setLineWidth(accentColor ? 0.5 : 0.3);
        doc.roundedRect(x, y, w, h, 3, 3, 'FD');
    }

    function checkPageBreak(needed) {
        if (y + needed > pageH - 22) {
            doc.addPage();
            y = margin;
        }
    }

    let y = margin;

    // ===== HEADER EM VIDRO =====
    doc.setFillColor(250, 252, 254);
    doc.roundedRect(0, 0, pageW, 26, 0, 0, 'F');
    doc.setFillColor(COL_GREEN[0], COL_GREEN[1], COL_GREEN[2]);
    doc.roundedRect(0, 0, pageW * 0.4, 26, 0, 0, 'F');
    doc.setFillColor(COL_ORANGE[0], COL_ORANGE[1], COL_ORANGE[2]);
    doc.roundedRect(pageW * 0.38, 0, pageW * 0.62, 26, 0, 0, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text('MANUTENÇÃO', margin + 2, 11);
    doc.text('PREVENTIVA', margin + 2, 18);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('AXIS • Relatório de Inspeção', pageW - margin - 2, 16, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    y = 34;

    // ===== IDENTIFICAÇÃO - CARD EM VIDRO =====
    const idItems = [
        ['Setor', document.getElementById('setor_id')?.value || ''],
        ['Unidade', document.getElementById('unidade_id')?.value || ''],
        ['Técnico', document.getElementById('tecnico_id')?.value || ''],
        ['Data', document.getElementById('data_id')?.value || ''],
        ['Serial Number', document.getElementById('serial_id')?.value || ''],
        ['Modelo', document.getElementById('modelo_id')?.value || ''],
        ['Patrimônio (SELB)', document.getElementById('selb_id')?.value || ''],
        ['IP', document.getElementById('ip_id')?.value || ''],
        ['MAC Rede', document.getElementById('mac_rede_id')?.value || ''],
        ['MAC Bluetooth', document.getElementById('mac_bt_id')?.value || '']
    ];
    const labelW = 32;
    const colGap = 8;
    const rowH = 5.5;
    const idPadding = 10;
    const idColW = (pageW - 2 * margin - 2 * idPadding - colGap) / 2;
    const valW = idColW - labelW - 2;
    var idBoxH = 14;
    var col0Y = 0, col1Y = 0;
    idItems.forEach(function(item, i) {
        var val = (item[1] || '—').toString();
        var lines = doc.splitTextToSize(val, valW);
        var lineCount = Math.min(lines.length, 3);
        if (i % 2 === 0) { col0Y += lineCount * rowH + 1; } else { col1Y += lineCount * rowH + 1; }
    });
    idBoxH += Math.max(col0Y, col1Y) + 6;
    checkPageBreak(idBoxH + sectionGap);
    glassCard(margin, y, pageW - 2 * margin, idBoxH, COL_GREEN);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(COL_GREEN[0], COL_GREEN[1], COL_GREEN[2]);
    doc.text('IDENTIFICAÇÃO DO ATIVO', margin + idPadding, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    let rowY = y + 12;
    var leftY = rowY, rightY = rowY;
    idItems.forEach(function(item, i) {
        const col = i % 2;
        const xLabel = margin + idPadding + col * (idColW + colGap);
        const xVal = xLabel + labelW + 2;
        const isLeft = col === 0;
        const yy = isLeft ? leftY : rightY;
        doc.setTextColor(100, 116, 139);
        doc.text(item[0] + ':', xLabel, yy);
        doc.setTextColor(30, 41, 59);
        var val = (item[1] || '—').toString();
        var valLines = doc.splitTextToSize(val, valW);
        var useLines = valLines.slice(0, 3);
        if (!useLines.length) useLines = ['—'];
        useLines.forEach(function(line, L) {
            doc.text(line, xVal, yy + L * rowH);
        });
        var advance = useLines.length * rowH + 1;
        if (isLeft) leftY += advance; else rightY += advance;
    });
    y = Math.max(leftY, rightY) + 5;
    y += sectionGap;

    // ===== CHECKLIST - PÁGINA 1: só os 3 primeiros cards (Estado Geral, Alimentação de Papel, Cabeçote) =====
    const cards = Array.from(document.querySelectorAll('.checklist-grid .glass-card'));
    const nCol = 3;
    const gap = 5;
    const cardPad = 10;
    const cardW = (pageW - 2 * margin - (nCol - 1) * gap) / nCol;
    const cardTextW = cardW - cardPad * 2 - 2;
    var boxS = 2.0;

    function drawChecklistRow(rowCards, startY) {
        var drawY = startY;
        const rowHeights = [];
        rowCards.forEach(function(card) {
            const h3 = card.querySelector('h3');
            const titulo = (h3 ? h3.textContent.trim() : '').toUpperCase();
            const checks = card.querySelectorAll('.ios-check');
            let h = 10;
            const tituloLines = doc.splitTextToSize(titulo, cardTextW);
            h += tituloLines.length * 4.5 + 4;
            checks.forEach(function(label) {
                const span = label.querySelector('span');
                const texto = span ? span.textContent.trim() : '';
                const linhas = doc.splitTextToSize(texto, cardTextW - 6);
                h += linhas.length * 4.5 + 2;
            });
            rowHeights.push(h + 10);
        });
        const rowHContent = rowHeights.length ? Math.max.apply(null, rowHeights) : 20;
        rowCards.forEach(function(card, colIdx) {
            const h3 = card.querySelector('h3');
            const titulo = (h3 ? h3.textContent.trim() : '').toUpperCase();
            const isGreen = h3 && h3.classList.contains('txt-green');
            const x0 = margin + colIdx * (cardW + gap);
            const cardY = drawY;

            glassCard(x0, cardY, cardW, rowHContent, isGreen ? COL_GREEN : COL_ORANGE);

            let cy = cardY + 10;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(isGreen ? COL_GREEN[0] : COL_ORANGE[0], isGreen ? COL_GREEN[1] : COL_ORANGE[1], isGreen ? COL_GREEN[2] : COL_ORANGE[2]);
            const tituloLines = doc.splitTextToSize(titulo, cardTextW);
            tituloLines.forEach(function(line) {
                if (cy < cardY + rowHContent - 6) doc.text(line, x0 + cardPad, cy);
                cy += 4.5;
            });
            cy += 4;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(51, 65, 85);
            const checks = card.querySelectorAll('.ios-check');
            checks.forEach(function(label) {
                const input = label.querySelector('input[type="checkbox"]');
                const span = label.querySelector('span');
                const texto = span ? span.textContent.trim() : '';
                const checked = input ? input.checked : false;
                const textoLines = doc.splitTextToSize(texto, cardTextW - 6);
                textoLines.forEach(function(line, idx) {
                    if (cy > cardY + rowHContent - 4) return;
                    if (idx === 0) {
                        var boxX = x0 + cardPad, boxY = cy - 2.4;
                        if (checked) {
                            doc.setFillColor(COL_GREEN[0], COL_GREEN[1], COL_GREEN[2]);
                            doc.roundedRect(boxX, boxY, boxS, boxS, 0.5, 0.5, 'F');
                            doc.setDrawColor(255, 255, 255);
                            doc.setLineWidth(0.28);
                            doc.line(boxX + 0.4, boxY + 1.0, boxX + 0.9, boxY + 1.45);
                            doc.line(boxX + 0.9, boxY + 1.45, boxX + 1.75, boxY + 0.55);
                        } else {
                            doc.setDrawColor(200, 208, 220);
                            doc.roundedRect(boxX, boxY, boxS, boxS, 0.5, 0.5, 'S');
                        }
                        doc.setTextColor(51, 65, 85);
                        doc.text(line, x0 + cardPad + 5, cy);
                    } else {
                        doc.text(line, x0 + cardPad + 5, cy);
                    }
                    cy += 4.5;
                });
                cy += 1.5;
            });
        });
        return drawY + rowHContent + gap;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('CHECKLIST DE INSPEÇÃO', margin, y + 6);
    doc.setFont('helvetica', 'normal');
    y += 10;

    var firstRowCards = cards.slice(0, 3);
    y = drawChecklistRow(firstRowCards, y);
    y += sectionGap;

    // ===== PÁGINA 2: demais cards do checklist (SENSOR DE ETIQUETA, PLACA ELETRÔNICA, CONEXÃO COM O SISTEMA, etc.) =====
    doc.addPage();
    y = margin;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('CHECKLIST DE INSPEÇÃO (continuação)', margin, y + 6);
    doc.setFont('helvetica', 'normal');
    y += 10;

    var remainingCards = cards.slice(3);
    var rowSize = 3;
    for (var r = 0; r < remainingCards.length; r += rowSize) {
        var rowCards = remainingCards.slice(r, r + rowSize);
        if (rowCards.length === 0) break;
        var neededH = 50;
        if (y + neededH > pageH - 28) {
            doc.addPage();
            y = margin;
        }
        y = drawChecklistRow(rowCards, y);
    }
    y += sectionGap;

    // ===== OBSERVAÇÕES - CARD EM VIDRO =====
    const obs = document.getElementById('obs_id')?.value || '(Nenhuma observação registrada)';
    const obsTextW = pageW - 2 * margin - 24;
    const obsLines = doc.splitTextToSize(obs, obsTextW);
    const obsLineH = 5.5;
    const obsTitleH = 18;
    const obsMaxH = 72;
    const obsMaxLines = Math.floor((obsMaxH - obsTitleH - 8) / obsLineH);
    const obsLinesToShow = obsLines.slice(0, obsMaxLines);
    const obsBoxH = obsTitleH + obsLinesToShow.length * obsLineH + 10;
    checkPageBreak(obsBoxH + sectionGap);
    glassCard(margin, y, pageW - 2 * margin, obsBoxH, COL_GREEN);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(COL_GREEN[0], COL_GREEN[1], COL_GREEN[2]);
    doc.text('DESCRIÇÃO DOS PROBLEMAS | OBSERVAÇÕES', margin + 12, y + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    obsLinesToShow.forEach(function(line, i) {
        doc.text(line, margin + 12, y + obsTitleH + 4 + i * obsLineH);
    });
    if (obsLines.length > obsMaxLines) {
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('... (texto truncado)', margin + 12, y + obsBoxH - 5);
    }
    y += obsBoxH + sectionGap;

    // ===== REGISTRO FOTOGRÁFICO - CARD EM VIDRO (moldes no meio do card, encaixe completo) =====
    var fotoCell = 18;
    var fotoGap = 4;
    var fotoGridW = 3 * fotoCell + 2 * fotoGap;
    var fotoGridH = 2 * fotoCell + fotoGap;
    var headerFotoH = 14;   // título + labels compactos
    var fotoBoxH = headerFotoH + fotoGridH + 8; // margem 8mm abaixo da grelha
    var fotoSep = 8;
    var fotoColW = (pageW - 2 * margin - fotoSep - 24) / 2;
    var fotoGrid1X = margin + 12 + Math.max(0, (fotoColW - fotoGridW) / 2);
    var fotoGrid2X = margin + 12 + fotoColW + fotoSep + Math.max(0, (fotoColW - fotoGridW) / 2);
    var fotoGridY = y + headerFotoH; // grelha logo abaixo do cabeçalho = mais para cima no card
    checkPageBreak(fotoBoxH + sectionGap);
    glassCard(margin, y, pageW - 2 * margin, fotoBoxH, COL_ORANGE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(COL_ORANGE[0], COL_ORANGE[1], COL_ORANGE[2]);
    doc.text('REGISTRO FOTOGRÁFICO', margin + 10, y + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COL_ORANGE[0], COL_ORANGE[1], COL_ORANGE[2]);
    doc.text('SITUAÇÃO ANTES', fotoGrid1X, y + 12);
    doc.text('SITUAÇÃO DEPOIS', fotoGrid2X, y + 12);
    doc.setFont('helvetica', 'normal');
    doc.setDrawColor(200, 208, 220);
    doc.setLineWidth(0.3);
    var photoPlaceholders = document.querySelectorAll('.photo-system .photo-placeholder');
    for (var fr = 0; fr < 2; fr++) {
        for (var fc = 0; fc < 3; fc++) {
            var fx = fotoGrid1X + fc * (fotoCell + fotoGap);
            var fy = fotoGridY + fr * (fotoCell + fotoGap);
            var idx = fr * 3 + fc;
            var ph = photoPlaceholders[idx];
            if (ph && ph.getAttribute('data-photo-src')) {
                try {
                    var src = ph.getAttribute('data-photo-src');
                    var fmt = src.indexOf('image/png') !== -1 ? 'PNG' : 'JPEG';
                    doc.addImage(src, fmt, fx + 0.5, fy + 0.5, fotoCell - 1, fotoCell - 1);
                } catch (e) { console.warn('PDF: foto não incluída', e); }
            }
            doc.roundedRect(fx, fy, fotoCell, fotoCell, 2, 2, 'S');
        }
    }
    for (var fr = 0; fr < 2; fr++) {
        for (var fc = 0; fc < 3; fc++) {
            var fx = fotoGrid2X + fc * (fotoCell + fotoGap);
            var fy = fotoGridY + fr * (fotoCell + fotoGap);
            var idx = 6 + fr * 3 + fc;
            var ph = photoPlaceholders[idx];
            if (ph && ph.getAttribute('data-photo-src')) {
                try {
                    var src = ph.getAttribute('data-photo-src');
                    var fmt = src.indexOf('image/png') !== -1 ? 'PNG' : 'JPEG';
                    doc.addImage(src, fmt, fx + 0.5, fy + 0.5, fotoCell - 1, fotoCell - 1);
                } catch (e) { console.warn('PDF: foto não incluída', e); }
            }
            doc.roundedRect(fx, fy, fotoCell, fotoCell, 2, 2, 'S');
        }
    }
    doc.setDrawColor(230, 234, 239);
    doc.line(margin + 12 + fotoColW + fotoSep / 2, y + 4, margin + 12 + fotoColW + fotoSep / 2, y + fotoBoxH - 4);

    // ===== RODAPÉ EM VIDRO =====
    const totalPages = doc.internal.getNumberOfPages();
    const footerH = 12;
    const footerY = pageH - footerH;
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(248, 250, 254);
        doc.rect(0, footerY - 1, pageW, footerH + 2, 'F');
        doc.setDrawColor(230, 234, 239);
        doc.setLineWidth(0.2);
        doc.line(margin, footerY - 1, pageW - margin, footerY - 1);
        doc.setFillColor(COL_GREEN[0], COL_GREEN[1], COL_GREEN[2]);
        doc.roundedRect(margin, footerY + 1, 52, 6, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text('AXIS', margin + 4, footerY + 5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text('Manutenção Preventiva', margin + 13, footerY + 5);
        doc.setTextColor(71, 85, 105);
        doc.setFont('helvetica', 'bold');
        doc.text('Página ' + i + ' de ' + totalPages, pageW / 2 - 10, footerY + 5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text('Gerado em ' + new Date().toLocaleString('pt-BR'), pageW - margin - 2, footerY + 5, { align: 'right' });
    }

    return doc.output('blob');
}

/* ==========================================================
   2. LÓGICA DE UPLOAD DE FOTOS (OTIMIZADA)
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const placeholders = document.querySelectorAll('.photo-placeholder');
    
    placeholders.forEach(card => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        card.addEventListener('click', () => input.click());
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            
            if (file && file.size > 5 * 1024 * 1024) {
                showAlert("Arquivo muito grande", "Escolha uma foto de até 5MB.");
                return;
            }

            if (file) {
                const reader = new FileReader();
                card.textContent = '...'; 

                reader.onload = (event) => {
                    const imgUrl = event.target.result;
                    card.setAttribute('data-photo-src', imgUrl);
                    card.style.backgroundImage = `url('${imgUrl}')`;
                    card.style.backgroundSize = 'cover';
                    card.style.backgroundPosition = 'center';
                    card.textContent = ''; 
                    card.style.border = '2px solid #28a745';
                    card.classList.add('has-photo');
                };
                reader.readAsDataURL(file);
            }
        });
    });

    // Data automática
    const dataInput = document.getElementById('data_id');
    if (dataInput) {
        const today = new Date().toISOString().split('T')[0];
        dataInput.value = today;
        
        // Atualizar menu organizador quando a data mudar
        dataInput.addEventListener('change', function() {
            const dataSelecionada = new Date(this.value + 'T00:00:00');
            const ano = dataSelecionada.getFullYear();
            const mes = String(dataSelecionada.getMonth() + 1).padStart(2, '0');
            
            const anoSelect = document.getElementById('organizer-ano');
            const mesSelect = document.getElementById('organizer-mes');
            
            if (anoSelect) {
                anoSelect.value = ano.toString();
            }
            if (mesSelect) {
                mesSelect.value = mes;
            }
        });
    }
    
    // Inicializar menu organizador com data atual
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');
    
    const anoSelect = document.getElementById('organizer-ano');
    const mesSelect = document.getElementById('organizer-mes');
    
    // Preencher select de anos (de 2020 até 2030)
    if (anoSelect) {
        // Limpar opções existentes
        anoSelect.innerHTML = '';
        
        // Gerar anos de 2020 até 2030
        for (let ano = 2020; ano <= 2030; ano++) {
            const option = document.createElement('option');
            option.value = ano.toString();
            option.textContent = ano.toString();
            if (ano === anoAtual) {
                option.selected = true;
            }
            anoSelect.appendChild(option);
        }
        
        // Se não tiver valor selecionado, usar ano atual
        if (!anoSelect.value || anoSelect.value === '') {
            anoSelect.value = anoAtual.toString();
        }
    }
    
    if (mesSelect) {
        // Se não tiver valor selecionado, usar mês atual
        if (!mesSelect.value || mesSelect.value === '') {
            mesSelect.value = mesAtual;
        }
    }
});

/* ==========================================================
   3. AUTO-SAVE LOCAL E CONTROLE DO AVISO GLASS
   ========================================================== */
const inputsAutoSave = document.querySelectorAll('input[type="text"], input[type="date"], textarea');
inputsAutoSave.forEach(input => {
    if (localStorage.getItem(input.id)) {
        input.value = localStorage.getItem(input.id);
    }
    input.addEventListener('input', () => {
        localStorage.setItem(input.id, input.value);
    });
});

// Funções do Modal de Vidro (Apple Style)
function showAlert(titulo, mensagem) {
    document.getElementById('alert-title').innerText = titulo;
    document.getElementById('alert-message').innerText = mensagem;
    document.getElementById('custom-alert').style.display = 'flex';
}

function closeAlert() {
    document.getElementById('custom-alert').style.display = 'none';
}

// ============================================
// 🔒 FUNÇÃO PROTEGIDA: voltarParaHome
// NÃO MODIFICAR - ESSENCIAL PARA NAVEGAÇÃO
// Garante que sempre permanece no mesmo site
// ============================================
function voltarParaHome(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    // Sempre usa caminho absoluto a partir da raiz do site: evita "sair" do site
    const target = '/index.html#page-home';
    try {
        const dest = new URL(target, window.location.origin);
        if (dest.origin !== window.location.origin) {
            window.location.href = window.location.origin + target;
        } else {
            window.location.href = target;
        }
    } catch (_) {
        window.location.href = target;
    }
    return false;
}

// Garante que a função esteja disponível globalmente
if (typeof window !== 'undefined') {
    window.voltarParaHome = voltarParaHome;
}

// Torna a função global
window.voltarParaHome = voltarParaHome;

// Menu Hambúrguer
function toggleHamburgerMenu() {
    const menu = document.getElementById('hamburger-menu');
    const btn = document.getElementById('hamburger-btn');
    
    if (menu && btn) {
        menu.classList.toggle('show');
        btn.classList.toggle('active');
    }
}

// Fechar menu ao clicar fora
document.addEventListener('click', function(e) {
    const menu = document.getElementById('hamburger-menu');
    const btn = document.getElementById('hamburger-btn');
    
    if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
        menu.classList.remove('show');
        btn.classList.remove('active');
    }
});

window.toggleHamburgerMenu = toggleHamburgerMenu;