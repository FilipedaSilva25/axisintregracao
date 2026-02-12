# Blindagem – Status como Badge e Seletores Bancada/Status no Cadastro

**Não remover ou alterar** os trechos descritos abaixo sem revisar este documento. Eles garantem o visual unificado de status (EM USO, DEFEITO, BACKUP OPERACIONAL) como badges e os seletores customizados de Bancada e Status no formulário Cadastrar Nova Impressora.

**Data da blindagem:** 2026-02-11

---

## 1. Objetivo

1. **Status como badge** – Exibir EM USO, DEFEITO e BACKUP OPERACIONAL como botões sem ação (badges estilizados), no mesmo padrão visual dos botões Editar, Ver Detalhes e Excluir, em:
   - Tabela do inventário (coluna STATUS)
   - Passo 3 de confirmação do cadastro (resumo antes de finalizar)
   - Modal Ver Detalhes do equipamento

2. **Seletores customizados no cadastro** – Modernizar os campos Bancada e Status em "Dados Técnicos" (passo 2), usando o mesmo design do Setor:
   - Bancada: dropdown com B01 a B200 (trigger + lista rolável com destaque azul)
   - Status: dropdown com EM USO, DEFEITO, BACKUP OPERACIONAL

---

## 2. Arquivos envolvidos

| Arquivo | O que foi alterado/criado |
|---------|---------------------------|
| `css/style.css` | `.ucs-status-badge`, `.ucs-status-em-uso`, `.ucs-status-defeito`, `.ucs-status-backup-operacional`; dark mode para badges; `.setor-selector` em `.form-row-bancada-status`. |
| `js/script.js` | `renderizarStatusBadge(status)`; uso do badge em `renderizarTabela`, `proximoPassoCadastro` (confirm-status), `verDetalhes` (detail-status); `populateBancadaDropdown()`; `initSetorSelector` para cad-bancada e cad-status; `closeOtherFilterDropdowns` estendido para `#cadastro-modal`; sync em `abrirCadastroRapido` e `abrirCadastroParaEditar`. |
| `index.html` | Estrutura `setor-selector` para Bancada e Status (select oculto + trigger + dropdown); opções de Status no dropdown. |

---

## 3. Pontos críticos (não remover)

### 3.1 Status como badge

- **Função `renderizarStatusBadge(status)`**  
  Retorna HTML do span com classes `ucs-status-badge ucs-status-{em-uso|defeito|backup-operacional}` conforme o valor. Valores: "EM USO", "DEFEITO", "BACKUP OPERACIONAL".

- **Onde é usado:**
  - **Tabela:** `renderizarTabela()` – coluna STATUS renderiza o badge em vez de texto plano.
  - **Cadastro passo 3:** `proximoPassoCadastro()` – `confirm-status` recebe innerHTML com o badge.
  - **Modal Ver Detalhes:** `verDetalhes()` – `detail-status` recebe innerHTML com o badge.

- **CSS:** As classes `.ucs-status-badge`, `.ucs-status-em-uso` (verde), `.ucs-status-defeito` (vermelho), `.ucs-status-backup-operacional` (laranja) devem permanecer com `cursor: default` e `pointer-events: none` (badge sem ação).

### 3.2 Seletor Bancada (cadastro)

- **Estrutura HTML:** `#bancada-selector-wrap` contém:
  - `<select id="cad-bancada" class="setor-selector-native-hidden">` (opções B01–B200)
  - `#cad-bancada-trigger` (botão que mostra o valor selecionado)
  - `#cad-bancada-dropdown` com `.setor-selector-option` (Selecione uma bancada + B01 a B200)

- **JS:** `populateBancadaDropdown()` – preenche o select e o dropdown com B01 a B200 no `initSetorSelectors()`. `initSetorSelector('cad-bancada', 'cad-bancada-trigger', 'cad-bancada-dropdown', 'Selecione uma bancada')`.

### 3.3 Seletor Status (cadastro)

- **Estrutura HTML:** `#status-selector-wrap` contém:
  - `<select id="cad-status" class="setor-selector-native-hidden">` (EM USO, DEFEITO, BACKUP OPERACIONAL)
  - `#cad-status-trigger` (valor padrão EM USO)
  - `#cad-status-dropdown` com opções EM USO, DEFEITO, BACKUP OPERACIONAL

- **JS:** `initSetorSelector('cad-status', 'cad-status-trigger', 'cad-status-dropdown', 'EM USO')`.

### 3.4 Sincronização e fechamento de dropdowns

- **`closeOtherFilterDropdowns(exceptDropdown)`** – Agora considera `#cadastro-modal` além de `#ucs-filter-panel`. Ao abrir um dropdown no cadastro (Setor, Bancada ou Status), os outros fecham.

- **Sync após reset/edição:** Em `abrirCadastroRapido` e `abrirCadastroParaEditar`, após preencher os selects, chamar `syncSetorSelectorFromSelect` para cad-bancada e cad-status, para o trigger exibir o valor correto.

---

## 4. Alterações que quebram a blindagem

- Remover `renderizarStatusBadge` ou o uso dela na tabela, confirm-status ou detail-status.
- Voltar a usar texto plano em vez de badge para os status.
- Remover a estrutura `setor-selector` de Bancada ou Status e voltar ao `<select class="cadastro-select">` nativo.
- Remover `populateBancadaDropdown` ou a chamada em `initSetorSelectors`.
- Remover `closeOtherFilterDropdowns` do escopo de `#cadastro-modal`.
- Deixar de sincronizar os triggers em `abrirCadastroRapido` e `abrirCadastroParaEditar`.

---

## 5. Como restaurar a partir do backup

1. Use a pasta do backup (ex.: `backups\Projeto-Vida-BACKUP-2026-02-11_*` ou Downloads).
2. Copie todo o conteúdo sobre o projeto atual ou use a pasta do backup como projeto.
3. Se necessário: `npm install` e `npm start` (ou `.\start.bat`).

---

**Última atualização:** 2026-02-11 – Status como badge; Bancada e Status com seletores customizados no cadastro.
