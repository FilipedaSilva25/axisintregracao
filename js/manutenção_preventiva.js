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
    const element = document.getElementById('pdf-content');
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

    // Garantir que o conteúdo esteja visível antes de capturar
    window.scrollTo(0, 0);
    element.scrollTop = 0;

    // Configurações otimizadas para PDF - captura todo o conteúdo
    const opt = {
        margin: [15, 10, 15, 10],
        filename: nomeArquivo,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true,
            logging: false,
            letterRendering: true,
            allowTaint: false,
            width: element.scrollWidth,
            height: element.scrollHeight,
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight,
            scrollX: 0,
            scrollY: 0,
            onclone: function(clonedDoc, clone) {
                var clonedEl = clonedDoc.getElementById('pdf-content');
                if (clonedEl) {
                    clonedEl.style.overflow = 'visible';
                    clonedEl.style.height = 'auto';
                    clonedEl.style.display = 'block';
                }
            }
        },
        pagebreak: { mode: ['css', 'legacy'], before: '.pdf-page-break' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
    };

    // GERAÇÃO DO PDF + NUMERAÇÃO DE PÁGINA + DOWNLOAD + ENVIO PARA PASTAS ANO/MÊS
    html2pdf().set(opt).from(element).toPdf().get('pdf').then(function (pdf) {
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(10);
            pdf.setTextColor(150);
            pdf.text(`Página ${i} de ${totalPages}`, pdf.internal.pageSize.width / 2 - 20, pdf.internal.pageSize.height - 10);
        }
    }).outputPdf('blob').then(function (blob) {
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
    }).catch(function (err) {
        btn.disabled = false;
        btn.textContent = "FINALIZAR E GERAR RELATÓRIO PDF";
        btn.style.opacity = '1';
        console.error("Erro crítico:", err);
        showAlert("Erro", "Não foi possível gerar o PDF. Tente novamente.");
    });

    showAlert("Processando...", "Gerando relatório PDF e salvando em Manutenções Preventivas.");
    });
});

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