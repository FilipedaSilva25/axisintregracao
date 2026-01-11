/* ==========================================================
   1. MOTOR DE GERAÇÃO DE PDF + AVISO MODERNO (UNIFICADO)
   ========================================================== */
document.getElementById('preventiva-form').addEventListener('submit', function(e) {
    e.preventDefault();

    // Validação básica
    if (!this.checkValidity()) {
        showAlert("Atenção", "Por favor, preencha todos os campos obrigatórios.");
        return;
    }

    const serial = document.getElementById('serial_id').value || 'SEM_SERIAL';
    const dataAtual = new Date().toLocaleDateString('pt-BR').replaceAll('/', '-');
    const element = document.getElementById('pdf-content');
    const btn = document.getElementById('btn-gerar');

    // Feedback visual e desabilita o botão
    btn.disabled = true;
    btn.textContent = "PROCESSANDO RELATÓRIO...";
    btn.style.opacity = '0.5';

    // Configurações otimizadas para PDF
    const opt = {
        margin: [10, 0, 10, 0],
        filename: `AXIS_PV_${serial}_${dataAtual}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { 
            scale: 2, 
            useCORS: true,
            windowWidth: 2383, 
            scrollY: 0,
            logging: false
        },
        // MODO DE QUEBRA ESPECÍFICO
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // GERAÇÃO DO PDF + NUMERAÇÃO DE PÁGINA
    html2pdf().set(opt).from(element).toPdf().get('pdf').then(function (pdf) {
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(10);
            pdf.setTextColor(150);
            pdf.text(`Página ${i} de ${totalPages}`, pdf.internal.pageSize.width / 2 - 20, pdf.internal.pageSize.height - 10);
        }
    }).save().then(() => {
        // Reseta o botão após salvar
        btn.disabled = false;
        btn.textContent = "FINALIZAR E GERAR RELATÓRIO PDF";
        btn.style.opacity = '1';
        
        // ========== INTEGRAÇÃO COM WHATSAPP ALERTS ==========
        // (Adicionado aqui para funcionar APÓS o PDF ser salvo)
        try {
            if (typeof window.whatsAppAlerts !== 'undefined') {
                const dadosPreventiva = {
                    tecnico: document.getElementById('tecnico_id')?.value || 'FILIPE DA SILVA',
                    modelo: document.getElementById('modelo_id')?.value || 'ZT411',
                    serial: document.getElementById('serial_id')?.value || 'N/D',
                    selb: document.getElementById('selb_id')?.value || 'N/D',
                    status: 'Preventiva concluída - PDF gerado',
                    data: document.getElementById('data_id')?.value || new Date().toLocaleDateString('pt-BR')
                };
                
                // Enviar alerta após 1 segundo (tempo para processar)
                setTimeout(() => {
                    window.whatsAppAlerts.alertarPreventivaConcluida(dadosPreventiva);
                }, 1000);
                
                console.log('✅ Alerta WhatsApp agendado para envio');
            } else {
                console.warn('⚠️ WhatsApp Alerts não está disponível');
            }
        } catch (error) {
            console.error('❌ Erro na integração WhatsApp:', error);
        }
        // ========== FIM DA INTEGRAÇÃO ==========

    }).catch(err => {
        btn.disabled = false;
        btn.style.opacity = '1';
        console.error("Erro crítico:", err);
    });

    // DISPARA O AVISO MODERNO (Substitui o alert preto do navegador)
    showAlert("Relatório Concluído", "O checklist da AXIS foi gerado e o download iniciado!");
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