// ================= FORNECEDORES: cadastro, tabela, NF-e XML, sincronização automática =================

(function () {
    'use strict';

    function tagLocal(el) {
        if (!el) return '';
        return (el.localName || (el.tagName && el.tagName.split(':').pop()) || '').toLowerCase();
    }

    function primeiroFilhoPorTags(pai, nomes) {
        if (!pai || !pai.children) return '';
        var set = {};
        for (var i = 0; i < nomes.length; i++) set[nomes[i].toLowerCase()] = true;
        for (var j = 0; j < pai.children.length; j++) {
            var c = pai.children[j];
            var t = tagLocal(c);
            if (set[t]) return (c.textContent || '').trim();
        }
        return '';
    }

    function axisExtrairEmitenteNFe(xmlString) {
        if (!xmlString || typeof xmlString !== 'string') return null;
        var doc;
        try {
            doc = new DOMParser().parseFromString(xmlString, 'text/xml');
        } catch (e) {
            return null;
        }
        if (doc.querySelector('parsererror')) return null;
        var all = doc.getElementsByTagName('*');
        var emit = null;
        for (var i = 0; i < all.length; i++) {
            if (tagLocal(all[i]) === 'emit') {
                emit = all[i];
                break;
            }
        }
        if (!emit) return null;
        var cnpj = primeiroFilhoPorTags(emit, ['CNPJ', 'cnpj']);
        var cpf = primeiroFilhoPorTags(emit, ['CPF', 'cpf']);
        var xNome = primeiroFilhoPorTags(emit, ['xNome', 'xnome']);
        var xFant = primeiroFilhoPorTags(emit, ['xFant', 'xfant']);
        var ie = primeiroFilhoPorTags(emit, ['IE', 'ie']);
        var ender = null;
        for (var j = 0; j < emit.children.length; j++) {
            if (tagLocal(emit.children[j]) === 'enderemit') {
                ender = emit.children[j];
                break;
            }
        }
        var xLgr = '';
        var nro = '';
        var xBairro = '';
        var xMun = '';
        var UF = '';
        var CEP = '';
        if (ender) {
            xLgr = primeiroFilhoPorTags(ender, ['xLgr', 'xlgr']);
            nro = primeiroFilhoPorTags(ender, ['nro']);
            xBairro = primeiroFilhoPorTags(ender, ['xBairro', 'xbairro']);
            xMun = primeiroFilhoPorTags(ender, ['xMun', 'xmun']);
            UF = primeiroFilhoPorTags(ender, ['UF', 'uf']);
            CEP = primeiroFilhoPorTags(ender, ['CEP', 'cep']);
        }
        return {
            cnpj: cnpj || cpf || '',
            xNome: xNome,
            xFant: xFant,
            ie: ie,
            xLgr: xLgr,
            nro: nro,
            xBairro: xBairro,
            xMun: xMun,
            uf: UF,
            cep: CEP
        };
    }

    function axisEnriquecerNotaComXmlNFe(nota, xmlString) {
        var e = axisExtrairEmitenteNFe(xmlString);
        if (!e || !nota) return;
        nota.emitenteCnpj = e.cnpj || nota.emitenteCnpj;
        nota.emitenteNome = e.xNome || nota.emitenteNome;
        nota.emitenteFantasia = e.xFant || nota.emitenteFantasia;
        nota.emitenteIE = e.ie || nota.emitenteIE;
        nota.emitenteEndereco = e.xLgr || nota.emitenteEndereco;
        nota.emitenteNumero = e.nro || nota.emitenteNumero;
        nota.emitenteBairro = e.xBairro || nota.emitenteBairro;
        nota.emitenteMunicipio = e.xMun || nota.emitenteMunicipio;
        nota.emitenteUF = e.uf || nota.emitenteUF;
        nota.emitenteCEP = e.cep || nota.emitenteCEP;
        if (e.xNome) {
            nota.cliente = e.xNome;
            nota.fornecedor = e.xNome;
        }
    }

    function somenteDigitos(s) {
        return String(s || '').replace(/\D/g, '');
    }

    function escHtml(s) {
        if (s == null) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function idParaOnclick(id) {
        return String(id == null ? '' : id).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r|\n/g, '');
    }

    function garantirListaFornecedores() {
        if (typeof state === 'undefined') return [];
        if (!state.fornecedores) state.fornecedores = [];
        return state.fornecedores;
    }

    function labelRegimeFornecedor(v) {
        var k = String(v || '');
        var m = {
            '': 'Não informado',
            simples: 'Simples Nacional',
            presumido: 'Lucro presumido',
            real: 'Lucro real',
            mei: 'MEI'
        };
        return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : 'Não informado';
    }

    function axisFecharTodosDropdownsFornecedor() {
        document.querySelectorAll('#fornecedor-cadastro-modal .axis-dd.is-open').forEach(function (w) {
            w.classList.remove('is-open');
            var p = w.querySelector('.axis-dd-panel');
            var t = w.querySelector('.axis-dd-trigger');
            if (p) {
                p.hidden = true;
                p.style.cssText = '';
            }
            if (t) t.setAttribute('aria-expanded', 'false');
        });
    }

    function posicionarPainelDropdownFornecedor(panel, trigger) {
        var r = trigger.getBoundingClientRect();
        var maxH = Math.min(280, Math.max(100, window.innerHeight - r.bottom - 16));
        panel.style.position = 'fixed';
        panel.style.left = r.left + 'px';
        panel.style.top = r.bottom + 4 + 'px';
        panel.style.width = r.width + 'px';
        panel.style.maxHeight = maxH + 'px';
        panel.style.zIndex = '10050';
    }

    function toggleDropdownFornecedor(wrap) {
        var trigger = wrap.querySelector('.axis-dd-trigger');
        var panel = wrap.querySelector('.axis-dd-panel');
        if (!trigger || !panel) return;
        panel.hidden = false;
        wrap.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        posicionarPainelDropdownFornecedor(panel, trigger);
    }

    function preencherListaUfFornecedor() {
        var ufList = document.getElementById('fornecedor-uf-list');
        if (!ufList || ufList.children.length > 0) return;
        var ufs = [
            '',
            'AC',
            'AL',
            'AP',
            'AM',
            'BA',
            'CE',
            'DF',
            'ES',
            'GO',
            'MA',
            'MT',
            'MS',
            'MG',
            'PA',
            'PB',
            'PR',
            'PE',
            'PI',
            'RJ',
            'RN',
            'RS',
            'RO',
            'RR',
            'SC',
            'SP',
            'SE',
            'TO'
        ];
        ufs.forEach(function (u) {
            var li = document.createElement('li');
            li.className = 'axis-dd-option';
            li.setAttribute('role', 'option');
            li.setAttribute('data-value', u);
            li.setAttribute('tabindex', '-1');
            li.textContent = u || '—';
            ufList.appendChild(li);
        });
    }

    function definirValorDropdownFornecedor(fieldId, value, labelText) {
        var hid = document.getElementById(fieldId);
        var txtEl = document.getElementById(fieldId + '-text');
        if (hid) hid.value = value != null ? String(value) : '';
        if (txtEl) txtEl.textContent = labelText != null ? String(labelText) : '—';
    }

    var _axisDdFornGlobalWired = false;

    function wireGlobalDropdownFornecedorHandlers() {
        if (_axisDdFornGlobalWired) return;
        _axisDdFornGlobalWired = true;
        document.addEventListener('click', function () {
            axisFecharTodosDropdownsFornecedor();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') axisFecharTodosDropdownsFornecedor();
        });
        window.addEventListener('resize', axisFecharTodosDropdownsFornecedor);
        document.addEventListener('scroll', axisFecharTodosDropdownsFornecedor, true);
    }

    function initDropdownsFornecedorModal() {
        var modal = document.getElementById('fornecedor-cadastro-modal');
        if (!modal) return;
        wireGlobalDropdownFornecedorHandlers();
        preencherListaUfFornecedor();
        modal.querySelectorAll('.axis-dd').forEach(function (wrap) {
            if (wrap.dataset.axisDdWired === '1') return;
            wrap.dataset.axisDdWired = '1';
            var trig = wrap.querySelector('.axis-dd-trigger');
            var panel = wrap.querySelector('.axis-dd-panel');
            if (!trig || !panel) return;
            trig.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var wasOpen = wrap.classList.contains('is-open');
                axisFecharTodosDropdownsFornecedor();
                if (!wasOpen) toggleDropdownFornecedor(wrap);
            });
            panel.addEventListener('click', function (e) {
                e.stopPropagation();
            });
            panel.querySelectorAll('.axis-dd-option').forEach(function (opt) {
                opt.addEventListener('click', function (e) {
                    e.stopPropagation();
                    var fieldId = wrap.getAttribute('data-axis-dd');
                    var val = opt.getAttribute('data-value');
                    if (val == null) val = '';
                    var label = (opt.textContent || '').trim();
                    var hid = document.getElementById(fieldId);
                    var txt = document.getElementById(fieldId + '-text');
                    if (hid) hid.value = val;
                    if (txt) txt.textContent = label;
                    axisFecharTodosDropdownsFornecedor();
                });
            });
        });
    }

    function encontrarFornecedorPorChave(cnpjDigits, nomeNorm) {
        var lista = garantirListaFornecedores();
        if (cnpjDigits && cnpjDigits.length >= 11) {
            for (var i = 0; i < lista.length; i++) {
                if (somenteDigitos(lista[i].cnpj) === cnpjDigits) return lista[i];
            }
        }
        if (nomeNorm && nomeNorm.length > 1) {
            for (var j = 0; j < lista.length; j++) {
                var r = (lista[j].razaoSocial || '').trim().toLowerCase();
                var f = (lista[j].nomeFantasia || '').trim().toLowerCase();
                if (r === nomeNorm || (f && f === nomeNorm)) return lista[j];
            }
        }
        return null;
    }

    function contarNotasLigadas(f) {
        if (typeof state === 'undefined' || !state.notasFiscais) return 0;
        var cd = somenteDigitos(f.cnpj);
        var raza = (f.razaoSocial || '').trim().toLowerCase();
        var fant = (f.nomeFantasia || '').trim().toLowerCase();
        return state.notasFiscais.filter(function (n) {
            if (cd.length >= 11 && somenteDigitos(n.emitenteCnpj) === cd) return true;
            var nomeNota = (n.cliente || n.fornecedor || '').trim().toLowerCase();
            if (!nomeNota || nomeNota === 'geral') return false;
            return nomeNota === raza || (fant && nomeNota === fant);
        }).length;
    }

    function novoFornecedorDeNota(nota) {
        var nome = (nota.emitenteNome || nota.cliente || nota.fornecedor || '').trim();
        var logr = [nota.emitenteEndereco, nota.emitenteNumero].filter(Boolean).join(', ');
        return {
            id: 'forn_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10),
            cnpj: nota.emitenteCnpj || '',
            razaoSocial: nome,
            nomeFantasia: nota.emitenteFantasia || '',
            email: nota.emitenteEmail || '',
            telefone: nota.emitenteTelefone || '',
            ie: nota.emitenteIE || '',
            endereco: logr || '',
            bairro: nota.emitenteBairro || '',
            cidade: nota.emitenteMunicipio || '',
            uf: nota.emitenteUF || '',
            cep: nota.emitenteCEP || '',
            regimeTributario: '',
            status: 'ativo',
            observacoes: '',
            origemAuto: true
        };
    }

    function mesclarFornecedorComNota(f, nota) {
        if (!f || !nota) return;
        if (!f.cnpj && nota.emitenteCnpj) f.cnpj = nota.emitenteCnpj;
        if (!f.nomeFantasia && nota.emitenteFantasia) f.nomeFantasia = nota.emitenteFantasia;
        if (!f.ie && nota.emitenteIE) f.ie = nota.emitenteIE;
        if (!f.email && nota.emitenteEmail) f.email = nota.emitenteEmail;
        if (!f.telefone && nota.emitenteTelefone) f.telefone = nota.emitenteTelefone;
        if (!f.endereco && (nota.emitenteEndereco || nota.emitenteNumero)) {
            f.endereco = [nota.emitenteEndereco, nota.emitenteNumero].filter(Boolean).join(', ');
        }
        if (!f.bairro && nota.emitenteBairro) f.bairro = nota.emitenteBairro;
        if (!f.cidade && nota.emitenteMunicipio) f.cidade = nota.emitenteMunicipio;
        if (!f.uf && nota.emitenteUF) f.uf = nota.emitenteUF;
        if (!f.cep && nota.emitenteCEP) f.cep = nota.emitenteCEP;
    }

    /** “IA” local: regista ou atualiza fornecedor a partir da nota (deduplica por CNPJ ou nome). */
    function axisSincronizarFornecedorDaNota(nota) {
        if (!nota || typeof state === 'undefined') return;
        garantirListaFornecedores();
        var nome = (nota.emitenteNome || nota.cliente || nota.fornecedor || '').trim();
        if (!nome || nome.toLowerCase() === 'geral') return;
        var cDig = somenteDigitos(nota.emitenteCnpj);
        var nomeK = nome.toLowerCase();
        var exist = encontrarFornecedorPorChave(cDig, nomeK);
        if (exist) {
            mesclarFornecedorComNota(exist, nota);
            return;
        }
        state.fornecedores.push(novoFornecedorDeNota(nota));
    }

    function axisReconstruirFornecedoresDasNotas() {
        if (typeof state === 'undefined' || !state.notasFiscais) return;
        garantirListaFornecedores();
        state.notasFiscais.forEach(function (n) {
            axisSincronizarFornecedorDaNota(n);
        });
    }

    function limparFormularioFornecedor() {
        var textIds = [
            'fornecedor-edit-id',
            'fornecedor-cnpj',
            'fornecedor-ie',
            'fornecedor-razao',
            'fornecedor-fantasia',
            'fornecedor-email',
            'fornecedor-telefone',
            'fornecedor-endereco',
            'fornecedor-bairro',
            'fornecedor-cep',
            'fornecedor-cidade',
            'fornecedor-obs'
        ];
        textIds.forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.value = '';
        });
        definirValorDropdownFornecedor('fornecedor-uf', '', '—');
        definirValorDropdownFornecedor('fornecedor-regime', '', 'Não informado');
        definirValorDropdownFornecedor('fornecedor-status', 'ativo', 'Ativo');
    }

    function abrirCadastroFornecedor(fornecedorId) {
        var modal = document.getElementById('fornecedor-cadastro-modal');
        if (!modal) return;
        initDropdownsFornecedorModal();
        limparFormularioFornecedor();
        var titulo = document.getElementById('fornecedor-modal-titulo');
        if (titulo) {
            titulo.innerHTML =
                '<i class="fas fa-building"></i> ' +
                (fornecedorId ? 'Editar fornecedor' : 'Novo fornecedor');
        }
        if (fornecedorId) {
            var lista = garantirListaFornecedores();
            var f = lista.find(function (x) {
                return String(x.id) === String(fornecedorId);
            });
            if (f) {
                document.getElementById('fornecedor-edit-id').value = f.id;
                document.getElementById('fornecedor-cnpj').value = f.cnpj || '';
                document.getElementById('fornecedor-ie').value = f.ie || '';
                document.getElementById('fornecedor-razao').value = f.razaoSocial || '';
                document.getElementById('fornecedor-fantasia').value = f.nomeFantasia || '';
                document.getElementById('fornecedor-email').value = f.email || '';
                document.getElementById('fornecedor-telefone').value = f.telefone || '';
                document.getElementById('fornecedor-endereco').value = f.endereco || '';
                document.getElementById('fornecedor-bairro').value = f.bairro || '';
                document.getElementById('fornecedor-cep').value = f.cep || '';
                document.getElementById('fornecedor-cidade').value = f.cidade || '';
                var ufV = (f.uf && String(f.uf).trim()) || '';
                definirValorDropdownFornecedor('fornecedor-uf', ufV, ufV || '—');
                definirValorDropdownFornecedor(
                    'fornecedor-regime',
                    f.regimeTributario || '',
                    labelRegimeFornecedor(f.regimeTributario)
                );
                var stVal = f.status === 'inativo' ? 'inativo' : 'ativo';
                definirValorDropdownFornecedor('fornecedor-status', stVal, stVal === 'inativo' ? 'Inativo' : 'Ativo');
                document.getElementById('fornecedor-obs').value = f.observacoes || '';
            }
        }
        modal.style.display = '';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function fecharModalFornecedorCadastro() {
        axisFecharTodosDropdownsFornecedor();
        var modal = document.getElementById('fornecedor-cadastro-modal');
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
        document.body.style.overflow = '';
    }

    function salvarFornecedorCadastroForm() {
        var razao = (document.getElementById('fornecedor-razao') && document.getElementById('fornecedor-razao').value.trim()) || '';
        if (!razao) {
            if (typeof mostrarToast === 'function') mostrarToast('Informe a razão social ou nome', 'error');
            return;
        }
        var editId = (document.getElementById('fornecedor-edit-id') && document.getElementById('fornecedor-edit-id').value) || '';
        var lista = garantirListaFornecedores();
        var cnpjNovo = (document.getElementById('fornecedor-cnpj') && document.getElementById('fornecedor-cnpj').value.trim()) || '';
        var dNovo = somenteDigitos(cnpjNovo);
        if (!editId && dNovo.length >= 11) {
            var dup = encontrarFornecedorPorChave(dNovo, '');
            if (dup) {
                if (typeof mostrarToast === 'function') {
                    mostrarToast('Já existe fornecedor com este CNPJ/CPF — abra para editar.', 'warning');
                }
                return;
            }
        }
        var payload = {
            cnpj: cnpjNovo,
            ie: (document.getElementById('fornecedor-ie') && document.getElementById('fornecedor-ie').value.trim()) || '',
            razaoSocial: razao,
            nomeFantasia: (document.getElementById('fornecedor-fantasia') && document.getElementById('fornecedor-fantasia').value.trim()) || '',
            email: (document.getElementById('fornecedor-email') && document.getElementById('fornecedor-email').value.trim()) || '',
            telefone: (document.getElementById('fornecedor-telefone') && document.getElementById('fornecedor-telefone').value.trim()) || '',
            endereco: (document.getElementById('fornecedor-endereco') && document.getElementById('fornecedor-endereco').value.trim()) || '',
            bairro: (document.getElementById('fornecedor-bairro') && document.getElementById('fornecedor-bairro').value.trim()) || '',
            cep: (document.getElementById('fornecedor-cep') && document.getElementById('fornecedor-cep').value.trim()) || '',
            cidade: (document.getElementById('fornecedor-cidade') && document.getElementById('fornecedor-cidade').value.trim()) || '',
            uf: (document.getElementById('fornecedor-uf') && document.getElementById('fornecedor-uf').value) || '',
            regimeTributario: (document.getElementById('fornecedor-regime') && document.getElementById('fornecedor-regime').value) || '',
            status: (document.getElementById('fornecedor-status') && document.getElementById('fornecedor-status').value) || 'ativo',
            observacoes: (document.getElementById('fornecedor-obs') && document.getElementById('fornecedor-obs').value.trim()) || ''
        };
        if (editId) {
            var idx = lista.findIndex(function (x) {
                return String(x.id) === String(editId);
            });
            if (idx >= 0) {
                lista[idx] = Object.assign({}, lista[idx], payload, { id: lista[idx].id });
            }
        } else {
            lista.push(
                Object.assign(
                    {
                        id: 'forn_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10),
                        origemAuto: false
                    },
                    payload
                )
            );
        }
        if (typeof salvarDados === 'function') salvarDados();
        renderizarTabelaFornecedores();
        fecharModalFornecedorCadastro();
        if (typeof mostrarToast === 'function') mostrarToast('Fornecedor guardado', 'success');
    }

    function excluirFornecedorCadastro(id) {
        if (!confirm('Remover este fornecedor da lista? (As notas fiscais não são apagadas.)')) return;
        var lista = garantirListaFornecedores();
        state.fornecedores = lista.filter(function (x) {
            return String(x.id) !== String(id);
        });
        if (typeof salvarDados === 'function') salvarDados();
        renderizarTabelaFornecedores();
        if (typeof mostrarToast === 'function') mostrarToast('Fornecedor removido', 'success');
    }

    var _fornecedoresFiltrados = [];

    function renderizarTabelaFornecedores() {
        var tbody = document.getElementById('suppliers-table-body');
        if (!tbody) return;
        var lista = garantirListaFornecedores().slice();
        var filtro = '';
        var inp = document.getElementById('supplier-search');
        if (inp && inp.value) filtro = inp.value.trim().toLowerCase();
        if (filtro) {
            lista = lista.filter(function (f) {
                var blob = [
                    f.cnpj,
                    f.razaoSocial,
                    f.nomeFantasia,
                    f.email,
                    f.cidade,
                    f.uf,
                    f.ie
                ]
                    .join(' ')
                    .toLowerCase();
                return blob.indexOf(filtro) !== -1;
            });
        }
        _fornecedoresFiltrados = lista;
        if (lista.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="10" style="text-align:center;padding:32px;color:var(--text-secondary);">Nenhum fornecedor. Use «Novo fornecedor» ou envie uma NF (PDF/XML) — o cadastro automático cria a partir do emitente.</td></tr>';
            return;
        }
        var html = '';
        lista.forEach(function (f) {
            var nNotas = contarNotasLigadas(f);
            var cid = idParaOnclick(f.id);
            var st = (f.status || 'ativo').toLowerCase() === 'inativo' ? 'inativo' : 'ativo';
            var badge = st === 'ativo' ? 'pago' : 'pendente';
            var cidadeUf = [f.cidade, f.uf].filter(Boolean).join(' / ');
            html +=
                '<tr data-fornecedor-id="' +
                escHtml(f.id) +
                '">' +
                '<td>' +
                escHtml(f.cnpj || '—') +
                '</td>' +
                '<td>' +
                escHtml(f.razaoSocial || '—') +
                '</td>' +
                '<td>' +
                escHtml(f.nomeFantasia || '—') +
                '</td>' +
                '<td>' +
                escHtml(f.ie || '—') +
                '</td>' +
                '<td>' +
                escHtml(f.email || '—') +
                '</td>' +
                '<td>' +
                escHtml(f.telefone || '—') +
                '</td>' +
                '<td>' +
                escHtml(cidadeUf || '—') +
                '</td>' +
                '<td><strong>' +
                nNotas +
                '</strong></td>' +
                '<td><span class="status-badge ' +
                badge +
                '">' +
                (st === 'ativo' ? 'ATIVO' : 'INATIVO') +
                '</span></td>' +
                '<td class="col-acoes-forn">' +
                '<button type="button" class="btn-icon" title="Editar" onclick="abrirCadastroFornecedor(\'' +
                cid +
                '\')"><i class="fas fa-edit"></i></button> ' +
                '<button type="button" class="btn-icon btn-trash" title="Excluir" onclick="excluirFornecedorCadastro(\'' +
                cid +
                '\')"><i class="fas fa-trash-alt"></i></button>' +
                '</td>' +
                '</tr>';
        });
        tbody.innerHTML = html;
    }

    function searchSuppliers() {
        renderizarTabelaFornecedores();
    }

    function exportarFornecedores() {
        var lista = garantirListaFornecedores();
        var blob = new Blob([JSON.stringify(lista, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'fornecedores_axis_' + new Date().getTime() + '.json';
        a.click();
        URL.revokeObjectURL(url);
        if (typeof mostrarToast === 'function') mostrarToast('Fornecedores exportados', 'success');
    }

    window.axisExtrairEmitenteNFe = axisExtrairEmitenteNFe;
    window.axisEnriquecerNotaComXmlNFe = axisEnriquecerNotaComXmlNFe;
    window.axisSincronizarFornecedorDaNota = axisSincronizarFornecedorDaNota;
    window.axisReconstruirFornecedoresDasNotas = axisReconstruirFornecedoresDasNotas;
    window.abrirCadastroFornecedor = abrirCadastroFornecedor;
    window.fecharModalFornecedorCadastro = fecharModalFornecedorCadastro;
    window.salvarFornecedorCadastroForm = salvarFornecedorCadastroForm;
    window.excluirFornecedorCadastro = excluirFornecedorCadastro;
    window.renderizarTabelaFornecedores = renderizarTabelaFornecedores;
    window.searchSuppliers = searchSuppliers;
    window.exportarFornecedores = exportarFornecedores;

    function initFornecedoresPosCarga() {
        garantirListaFornecedores();
        axisReconstruirFornecedoresDasNotas();
        if (typeof salvarDados === 'function') salvarDados();
        renderizarTabelaFornecedores();
        initDropdownsFornecedorModal();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            setTimeout(initFornecedoresPosCarga, 400);
        });
    } else {
        setTimeout(initFornecedoresPosCarga, 400);
    }
})();
