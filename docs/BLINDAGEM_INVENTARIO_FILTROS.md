# Blindagem – Inventário, Setores, Modelos e Filtros

**Não remover ou alterar** os trechos descritos abaixo sem revisar este documento. Eles garantem a lista completa de setores, o modelo ZQ630 PLUS, os seletores customizados e o comportamento de um único dropdown aberto por vez.

**Data da blindagem:** 2026-01-29

---

## 1. Objetivo

- Lista de **SETOR** com todas as opções (INTERNAL SYSTEMS, LIDERANÇA, MHW, P2M, etc.) no filtro e no cadastro.
- **Modelo ZQ630** exibido e usado em todo o sistema como **ZQ630 PLUS**.
- **Seletores customizados** (trigger + lista rolável com destaque azul) para Setor e Modelo no painel de Filtros e para Setor no formulário de Cadastro.
- **Apenas um dropdown aberto por vez** no painel de Filtros (ao abrir Modelo, Setor fecha, e vice-versa).

---

## 2. Arquivos envolvidos

| Arquivo | O que foi alterado/criado |
|---------|---------------------------|
| `index.html` | Setores no filtro e no cadastro; ZQ630 PLUS no filtro e no card Home; estrutura dos seletores customizados (Modelo e Setor no painel; Setor no cadastro). |
| `js/script.js` | Array `setores`; `formatarSetor()`; ZQ630 → ZQ630 PLUS em dados e lógica; `syncSetorSelectorFromSelect`, `closeOtherFilterDropdowns`, `initSetorSelector`, `initSetorSelectors`; sync ao Limpar e ao inicializar inventário. |
| `css/style.css` | Classes `.setor-selector-*`, `.setor-selector-native-hidden`, `.setor-selector-trigger`, `.setor-selector-dropdown`, `.setor-selector-option`; estilos dark mode para o seletor. |

---

## 3. Pontos críticos (não remover)

### 3.1 Lista completa de setores

- **Onde:** `index.html` (opções do select oculto e das opções do dropdown customizado) e `js/script.js` (array `setores` no loop de equipamentos de exemplo e objeto em `formatarSetor()`).
- **Valores esperados (value → rótulo):**  
  internal-systems → INTERNAL SYSTEMS, lideranca → LIDERANÇA, mhw → MHW, p2m → P2M, check-in → CHECK-IN, reciving → RECIVING, mz1–mz3, inventario → INVENTÁRIO, cx → CX, returns → RETURNS, packing-mono/ptw, sauron, insumos, docas-de-expedicao, linha-de-peixe-1/2, sorter, rk, nt-rk, qualidade, aquario-outbound, adm, gate, ambulatorio-interno/externo, sala-de-epi, er, rr, deposito-de-treinamento, hv.
- **Blindagem:** Manter a mesma lista em: (1) selects ocultos `#ucs-filtro-panel-setor` e `#cad-setor`; (2) divs `.setor-selector-option` dos dropdowns customizados; (3) array `setores` em `script.js`; (4) objeto em `formatarSetor()`.

### 3.2 Modelo ZQ630 PLUS

- **Onde:** `js/script.js` (dados de exemplo, array `modelos`, prefixo PAG, ribbon/ink, contadores, tags, serial) e `index.html` (filtro Modelo, card Home, cadastro).
- **Blindagem:** Em todo o código, o modelo deve ser **"ZQ630 PLUS"** (com espaço), não "ZQ630". Verificar: `equipamentosExemplo`, `modelos`, `if (modelo === 'ZQ630 PLUS')`, `indexOf('ZQ630 PLUS')`, opções do filtro e do cadastro, texto do card Inventário na Home.

### 3.3 Seletores customizados (Setor e Modelo)

- **Estrutura HTML (painel de Filtros):**
  - Modelo: `#modelo-selector-filter-wrap` contém `<select id="ucs-filtro-panel-modelo" class="setor-selector-native-hidden">`, `#ucs-filtro-panel-modelo-trigger`, `#ucs-filtro-panel-modelo-dropdown` com `.setor-selector-option` (Todos, ZT411, ZD421, ZQ630 PLUS).
  - Setor: `#setor-selector-filter-wrap` contém `<select id="ucs-filtro-panel-setor" class="setor-selector-native-hidden">`, `#ucs-filtro-panel-setor-trigger`, `#ucs-filtro-panel-setor-dropdown` com todas as opções de setor.
- **Cadastro:** `#setor-selector-cadastro-wrap` contém `#cad-setor` (oculto), `#cad-setor-trigger`, `#cad-setor-dropdown`.
- **Blindagem:** Não remover os selects ocultos (a lógica de filtro e cadastro usa `getElementById('ucs-filtro-panel-modelo'|'ucs-filtro-panel-setor'|'cad-setor').value`). Manter os IDs dos triggers e dropdowns para o JS.

### 3.4 Funções JS dos seletores

- **`syncSetorSelectorFromSelect(selectId, triggerId, dropdownId, defaultLabel)`**  
  Sincroniza o texto do trigger e o estado “selected” das opções com o valor do select. O 4º parâmetro é opcional; quando não passado, usa "Todos" ou "Selecione um setor" conforme o `selectId`.
- **`closeOtherFilterDropdowns(exceptDropdown)`**  
  Fecha todos os outros `.setor-selector-dropdown.is-open` dentro de `#ucs-filter-panel`, exceto o passado. Usado para que só um dropdown (Modelo ou Setor) fique aberto por vez.
- **`initSetorSelector(selectId, triggerId, dropdownId, placeholderTodos)`**  
  Inicializa um seletor: clique no trigger abre/fecha; clique em opção define valor no select, atualiza trigger e fecha; sync inicial; clique fora fecha.
- **`initSetorSelectors()`**  
  Chama `initSetorSelector` para: (1) setor do painel, (2) setor do cadastro, (3) modelo do painel.
- **Blindagem:** Ao abrir um dropdown, `closeOtherFilterDropdowns(dropdown)` deve ser chamado no início de `open()` dentro de `initSetorSelector`. Ao clicar em Limpar e ao inicializar o inventário, deve ser chamado `syncSetorSelectorFromSelect` para modelo e setor do painel (com default "Todos" para o modelo).

### 3.5 CSS do seletor

- **Classes:** `.setor-selector-native-hidden`, `.setor-selector`, `.setor-selector-trigger`, `.setor-selector-dropdown`, `.setor-selector-option`, `.setor-selector-option:hover`, `.setor-selector-option.selected`.
- **Blindagem:** Manter o dropdown com `max-height` e `overflow-y: auto` para rolagem; manter destaque azul no hover e no `.selected`; manter estilos dark em `[data-theme="dark"]` para o seletor.

---

## 4. Fluxo resumido

1. **Filtro:** Usuário abre Modelo ou Setor → `closeOtherFilterDropdowns` fecha o outro → um único dropdown aberto. Escolhe opção → valor vai para o select oculto → trigger mostra o rótulo.
2. **Limpar:** Valores dos selects do painel são limpos e `syncSetorSelectorFromSelect` é chamado para modelo e setor (trigger mostra "Todos").
3. **Inicializar inventário:** Filtros do painel são resetados e sync é chamado para modelo e setor.

---

## 5. Alterações que quebram a blindagem

- Remover ou esvaziar a lista de setores no HTML ou em `formatarSetor()` / array `setores`.
- Voltar a usar "ZQ630" em vez de "ZQ630 PLUS" em dados ou UI.
- Remover os selects ocultos (`ucs-filtro-panel-modelo`, `ucs-filtro-panel-setor`, `cad-setor`) ou alterar seus IDs.
- Remover `closeOtherFilterDropdowns` ou a chamada no `open()` do seletor (dropdowns voltam a sobrepor).
- Remover a sincronização ao Limpar ou ao inicializar o inventário (trigger fica desatualizado).

---

## 6. Como restaurar a partir do backup

1. Use a pasta do backup (ex.: `backups\Projeto-Vida-BACKUP-AAAA-MM-DD_HH-mm`).
2. Copie todo o conteúdo sobre o projeto atual ou use a pasta do backup como projeto.
3. Se necessário: `npm install` e `npm start` (ou `.\start.bat`).

---

**Última atualização:** 2026-01-29 (backup fim do dia e blindagem inventário/filtros).
