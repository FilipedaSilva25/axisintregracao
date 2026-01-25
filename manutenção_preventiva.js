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
    
    // Obter ano e mês selecionados no menu organizador
    const anoSelecionado = document.getElementById('organizer-ano')?.value || new Date().getFullYear().toString();
    const mesSelecionado = document.getElementById('organizer-mes')?.value || String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Nomes dos meses em português
    const mesesNomes = {
        '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
        '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
        '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
    };
    
    const nomeMes = mesesNomes[mesSelecionado] || 'Mes';
    
    // Criar nome do arquivo com estrutura organizada (ano e mês no nome)
    // Nota: Navegadores não podem criar pastas automaticamente, então incluímos no nome
    // Formato: AXIS_PV_SERIAL_ANO_MES_DATA.pdf
    const nomeArquivo = `AXIS_PV_${serial}_${anoSelecionado}_${nomeMes}_${dataAtual}.pdf`;
    
    console.log('📁 Organização do PDF:', `${anoSelecionado}/${nomeMes}`);
    console.log('📄 Nome do arquivo:', nomeArquivo);

    // Feedback visual e desabilita o botão
    btn.disabled = true;
    btn.textContent = "PROCESSANDO RELATÓRIO...";
    btn.style.opacity = '0.5';

    // Configurações otimizadas para PDF com melhor alinhamento
    const opt = {
        margin: [15, 10, 15, 10],
        filename: nomeArquivo,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true,
            windowWidth: 2100, // Largura A4 em pixels (210mm * 10)
            windowHeight: 2970, // Altura A4 em pixels (297mm * 10)
            scrollY: 0,
            scrollX: 0,
            logging: false,
            letterRendering: true,
            allowTaint: false
        },
        // MODO DE QUEBRA ESPECÍFICO
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true
        }
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
    
    if (anoSelect) {
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

// Função para voltar para a home do sistema - VERSÃO DEFINITIVA E FUNCIONAL
function voltarParaHome(e) {
    // Previne comportamento padrão se evento existir
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    console.log('🔄 Botão "Voltar para Dashboard" clicado');
    console.log('📍 URL atual:', window.location.href);
    console.log('📍 Pathname:', window.location.pathname);
    
    try {
        // Abordagem mais simples e direta
        // Sempre usa caminho relativo simples, que funciona tanto em file:// quanto em http://
        
        // Primeiro, tenta o caminho mais comum
        const targetUrl = 'index.html#home';
        
        console.log('🎯 Navegando para:', targetUrl);
        
        // Usa window.location.replace para evitar adicionar ao histórico
        // Isso faz com que o botão "voltar" do navegador não volte para a página de manutenção
        window.location.replace(targetUrl);
        
        // Se replace não funcionar (alguns navegadores), usa href como fallback
        setTimeout(() => {
            if (window.location.pathname.includes('manutenção_preventiva') || 
                window.location.pathname.includes('manutencao')) {
                console.log('⚠️ Replace não funcionou, tentando href...');
                window.location.href = targetUrl;
            }
        }, 100);
        
        return false;
        
    } catch (error) {
        console.error('❌ Erro ao voltar para home:', error);
        
        // Fallbacks progressivos
        const fallbacks = [
            'index.html#home',
            './index.html#home',
            '../index.html#home',
            'index.html',
            './index.html'
        ];
        
        for (let i = 0; i < fallbacks.length; i++) {
            try {
                console.log(`🔄 Tentando fallback ${i + 1}:`, fallbacks[i]);
                window.location.href = fallbacks[i];
                break;
            } catch (e) {
                if (i === fallbacks.length - 1) {
                    console.error('❌ Todos os fallbacks falharam');
                    alert('Erro ao navegar. Por favor, use o menu do navegador para voltar à página inicial.');
                }
            }
        }
        
        return false;
    }
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