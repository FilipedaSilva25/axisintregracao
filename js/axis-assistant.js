/* ============================================
   ASSISTENTE AXIS - Automação e IA no sistema
   - Preenchimento inteligente a partir do inventário
   - Preencher com último relatório (preventiva)
   - Dicas contextuais
   ============================================ */

(function() {
    'use strict';

    const INVENTARIO_KEY = 'axis_inventario_equipamentos';
    const BIBLIOTECA_KEY = 'axis_manutencoes_biblioteca';

    /**
     * Busca equipamento no inventário pelo serial (case-insensitive, trim).
     */
    function buscarEquipamentoPorSerial(serial) {
        if (!serial || typeof serial !== 'string') return null;
        var s = serial.trim();
        if (!s) return null;
        try {
            var raw = localStorage.getItem(INVENTARIO_KEY);
            var arr = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(arr)) return null;
            var lower = s.toLowerCase();
            for (var i = 0; i < arr.length; i++) {
                var eq = arr[i];
                var eqSerial = (eq.serial || eq.id || '').toString().trim().toLowerCase();
                if (eqSerial === lower) return eq;
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Preenche o formulário de Manutenção Preventiva com dados do inventário (quando o serial for reconhecido).
     */
    function preencherDoInventario(serial) {
        var eq = buscarEquipamentoPorSerial(serial);
        if (!eq) return false;

        var fields = [
            { id: 'setor_id', value: eq.setor },
            { id: 'modelo_id', value: eq.modelo },
            { id: 'ip_id', value: eq.ip },
            { id: 'mac_rede_id', value: eq.macRede },
            { id: 'mac_bt_id', value: eq.macBluetooth || eq.macBt },
            { id: 'selb_id', value: eq.selb }
        ];

        var filled = 0;
        fields.forEach(function(f) {
            var el = document.getElementById(f.id);
            if (el && (f.value || '').toString().trim() !== '') {
                el.value = (f.value || '').toString().trim();
                filled++;
            }
        });

        if (filled > 0 && typeof showToast === 'function') {
            showToast('Dados preenchidos automaticamente pelo inventário.', 'success');
        }
        return filled > 0;
    }

    /**
     * Retorna o último relatório salvo na biblioteca (ano/mês/último item).
     */
    function obterUltimoRelatorio() {
        try {
            var raw = localStorage.getItem(BIBLIOTECA_KEY);
            var bib = raw ? JSON.parse(raw) : {};
            if (!bib || typeof bib !== 'object') return null;

            var anos = Object.keys(bib).filter(function(a) { return /^\d{4}$/.test(a); }).sort(function(a, b) { return parseInt(b, 10) - parseInt(a, 10); });
            for (var ai = 0; ai < anos.length; ai++) {
                var meses = Object.keys(bib[anos[ai]]).sort(function(a, b) { return parseInt(b, 10) - parseInt(a, 10); });
                for (var mi = 0; mi < meses.length; mi++) {
                    var lista = bib[anos[ai]][meses[mi]];
                    if (Array.isArray(lista) && lista.length > 0) {
                        return lista[lista.length - 1];
                    }
                }
            }
        } catch (e) {}
        return null;
    }

    /**
     * Preenche o formulário de Manutenção Preventiva com o último relatório (identificação apenas).
     */
    function preencherComUltimoRelatorio() {
        var m = obterUltimoRelatorio();
        if (!m) {
            if (typeof showToast === 'function') showToast('Nenhum relatório anterior encontrado.', 'info');
            if (typeof showAlert === 'function') showAlert('Assistente', 'Ainda não há relatórios salvos. Preencha o formulário e gere o PDF para usar esta função depois.');
            return false;
        }

        var fields = [
            { id: 'setor_id', value: m.setor },
            { id: 'unidade_id', value: m.unidade },
            { id: 'tecnico_id', value: m.tecnico },
            { id: 'serial_id', value: m.serial },
            { id: 'modelo_id', value: m.modelo },
            { id: 'selb_id', value: m.selb },
            { id: 'ip_id', value: m.ip },
            { id: 'mac_rede_id', value: m.macRede },
            { id: 'mac_bt_id', value: m.macBt },
            { id: 'obs_id', value: m.observacoes }
        ];

        fields.forEach(function(f) {
            var el = document.getElementById(f.id);
            if (el && (f.value || '').toString().trim() !== '') {
                el.value = (f.value || '').toString().trim();
            }
        });

        var dataEl = document.getElementById('data_id');
        if (dataEl) dataEl.value = (m.data || '').toString().slice(0, 10) || new Date().toISOString().slice(0, 10);

        if (typeof showToast === 'function') {
            showToast('Formulário preenchido com o último relatório. Ajuste serial/data se necessário.', 'success');
        }
        return true;
    }

    /**
     * Inicializa o assistente na página de Manutenção Preventiva.
     */
    function initAssistentePreventiva() {
        var form = document.getElementById('preventiva-form');
        var serialEl = document.getElementById('serial_id');
        if (!form || !serialEl) return;

        var debounceTimer = null;
        var lastSerial = '';

        function tryAutofillFromInventario() {
            var serial = (serialEl.value || '').toString().trim();
            if (!serial || serial === lastSerial) return;
            lastSerial = serial;
            preencherDoInventario(serial);
        }

        serialEl.addEventListener('blur', function() {
            tryAutofillFromInventario();
        });

        serialEl.addEventListener('input', function() {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(tryAutofillFromInventario, 600);
        });

        var containerCard = form.querySelector('.glass-card');
        if (containerCard) {
            var dica = document.createElement('p');
            dica.className = 'axis-assistant-tip';
            dica.style.cssText = 'margin:10px 0 0 0;font-size:12px;color:#64748b;display:flex;align-items:center;gap:8px;flex-wrap:wrap;';
            dica.innerHTML = '<span style="color:#28a745;">💡</span> <span>Digite o <strong>Serial</strong> e saia do campo para preencher automaticamente pelo inventário.</span> ' +
                '<button type="button" id="axis-btn-ultimo-relatorio" class="axis-btn-sm" style="background:#fd7e14;color:#fff;border:none;padding:6px 12px;border-radius:8px;font-size:11px;cursor:pointer;font-weight:600;">Preencher com último relatório</button>';
            containerCard.appendChild(dica);

            var btnUltimo = document.getElementById('axis-btn-ultimo-relatorio');
            if (btnUltimo) {
                btnUltimo.addEventListener('click', function() {
                    preencherComUltimoRelatorio();
                });
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAssistentePreventiva);
    } else {
        initAssistentePreventiva();
    }

    window.AxisAssistant = {
        buscarEquipamentoPorSerial: buscarEquipamentoPorSerial,
        preencherDoInventario: preencherDoInventario,
        obterUltimoRelatorio: obterUltimoRelatorio,
        preencherComUltimoRelatorio: preencherComUltimoRelatorio
    };
})();
