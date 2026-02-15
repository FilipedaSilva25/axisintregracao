# Blindagem – Página de Inventário Completa

**Não remover ou alterar** os itens descritos abaixo sem revisar este documento. A página de inventário está concluída e blindada para não perder funcionalidades nem visual.

**Data da blindagem:** 2026-02-13

---

## 1. Objetivo

Este documento consolida **toda a blindagem da página de Inventário** (AXIS Integração). Ao alterar qualquer parte do inventário, consulte também os documentos específicos listados na seção 2.

---

## 2. Documentos de blindagem relacionados

| Documento | Conteúdo |
|-----------|----------|
| `BLINDAGEM_INVENTARIO_FILTROS.md` | Setores, modelo ZQ630 PLUS, seletores Modelo/Setor no filtro, um dropdown aberto por vez. |
| `BLINDAGEM_INVENTARIO_CARDS_BOTOES_MENU.md` | Cards em vidro, botões Baixar/Filtrar com setas SVG, menu Baixar (CSV/Excel/PDF), correção do hover. |
| `BLINDAGEM_INVENTARIO_STATUS_SELECTORES_CADASTRO.md` | Status como badge; seletores Bancada e Status no cadastro; placeholder "Selecione um Status"; campo IP único; maxlength 14. |

---

## 3. Resumo do que está blindado na página de Inventário

### 3.1 Filtros e listagem
- Painel de filtros: Modelo (Todos, ZT411, ZD421, ZQ630 PLUS) e Setor (lista completa).
- Seletores customizados (trigger + dropdown com destaque azul); apenas um dropdown aberto por vez.
- Tabela com colunas: Serial, Tag, Modelo, IP, MAC Rede, MAC Bluetooth, SELB, Patrimônio, Setor, **Status (badge)**, Última Checagem, Responsável, Ações.

### 3.2 Cadastro “Cadastrar Nova Impressora”
- **Passo 1 – Modelo:** ZT411, ZD421, ZQ630 PLUS; campo Serial com prefixo por modelo (99J, D6J, XXZ).
- **Passo 2 – Dados Técnicos:**
  - **Endereço IP ***: campo **único** (como Número do Patrimônio), **sem prefixo 10.201.**; placeholder `Ex: 10.201.131.222`; **maxlength="14"**.
  - Setor *, Bancada (B01–B200), **Status** (placeholder **"Selecione um Status"**; opções: EM USO, DEFEITO, BACKUP OPERACIONAL em **uma linha**; dropdown com min-width para não quebrar texto).
  - MAC Rede *, MAC Bluetooth, SELB, Número do Patrimônio.
- **Passo 3 – Confirmação:** resumo com Status em badge; botões Voltar, Próximo, Finalizar Cadastro.

### 3.3 Status como badge
- Valores: EM USO (verde), DEFEITO (vermelho), BACKUP OPERACIONAL (laranja).
- Exibição: tabela do inventário, passo 3 do cadastro, modal Ver Detalhes.
- Função JS: `renderizarStatusBadge(status)`.

### 3.4 Campo IP (cadastro)
- **Sem prefixo fixo:** usuário digita o IP completo (ex.: 10.201.131.222).
- **Um único input**, mesmo padrão visual do campo Número do Patrimônio.
- **maxlength="14"** no `#cad-ip`.
- **getIpCompleto()** retorna apenas o valor do input (trim); não há concatenação com prefixo nem `initIpMask`.

### 3.5 Seletor Status (cadastro)
- Primeira opção: **"Selecione um Status"** (value vazio); depois EM USO, DEFEITO, BACKUP OPERACIONAL.
- Trigger e placeholder: **"Selecione um Status"** (não "EM USO").
- Opção "BACKUP OPERACIONAL" em **uma linha** no dropdown: CSS `min-width` e `white-space: nowrap` em `.setor-selector-dropdown-status` e nas opções.

### 3.6 Exportação (PDF, Excel, CSV e Impressão)
- **Colunas únicas** em todas as exportações e na impressão (sem Tag, Status, Última Checagem, Responsável):
  1. **Serial Number** (eqp.serial)
  2. **Modelo** (eqp.modelo)
  3. **Endereço de IP** (eqp.ip)
  4. **MAC Rede** (eqp.macRede)
  5. **MAC Bluetooth** (eqp.macBluetooth)
  6. **Selb** (eqp.selb)
  7. **Patrimônio** (eqp.patrimonio)
  8. **Setor** (formatarSetor(eqp.setor))
  9. **Alocação** (eqp.bancada)
- **Funções:** `exportarCSV`, `exportarExcel`, `exportarPDF`, `imprimirInventario` – todas usam exatamente esses cabeçalhos e essa ordem.
- **Blindagem:** não adicionar colunas removidas (Tag, Status, Última Checagem, Responsável) nas exportações nem na tabela de impressão.

---

## 4. Arquivos críticos da página de Inventário

| Arquivo | Uso |
|---------|-----|
| `index.html` | Estrutura da página inventário (#page-inventario), modal cadastro, filtros, tabela, seletores Setor/Bancada/Status, campo IP único. |
| `js/script.js` | renderizarStatusBadge, renderizarTabela, cadastro (abrirCadastroRapido, abrirCadastroParaEditar, proximoPassoCadastro, finalizarCadastro), getIpCompleto, populateBancadaDropdown, initSetorSelector, syncSetorSelectorFromSelect, closeOtherFilterDropdowns; **exportarCSV, exportarExcel, exportarPDF, imprimirInventario** (9 colunas fixas). |
| `css/style.css` | Badges de status, setor-selector (cadastro e status), form-row-bancada-status, setor-selector-status / setor-selector-dropdown-status (min-width, white-space: nowrap). |

---

## 5. O que não remover ou alterar sem revisar

- Placeholder **"Selecione um Status"** e opção vazia no select/dropdown de Status.
- Campo **Endereço IP** como **único input** com **maxlength="14"** e **sem prefixo**.
- Função **getIpCompleto()** retornando somente o valor do `#cad-ip`.
- **renderizarStatusBadge** e uso na tabela, confirm-status e detail-status.
- Estrutura **setor-selector** para Bancada e Status no cadastro.
- CSS que mantém **"BACKUP OPERACIONAL"** em uma linha (min-width + white-space: nowrap no dropdown de Status).
- **Exportação (PDF, Excel, CSV, Impressão):** apenas as 9 colunas (Serial Number, Modelo, Endereço de IP, MAC Rede, MAC Bluetooth, Selb, Patrimônio, Setor, Alocação); não voltar a incluir Tag, Status, Última Checagem ou Responsável.
- Documentos listados na seção 2: não remover trechos descritos neles.

---

## 6. Como restaurar

1. Use backup em `backups\Projeto-Vida-BACKUP-AAAA-MM-DD_*` ou em `Downloads\Projeto-Vida-BACKUP-*`.
2. Ou use tag Git de backup, se existir (ex.: `git checkout backup-inventario-completo`).
3. Consulte `BACKUP_HOJE.md` para o script de backup (`.\scripts\backup-hoje.ps1` ou `.\backup-agora.bat`).

---

**Página de inventário 100% concluída e blindada. Próximos passos: outras páginas do sistema.**

**Última atualização:** 2026-02-14 – Exportação (PDF, Excel, CSV, Impressão) com 9 colunas fixas (Serial Number, Modelo, Endereço de IP, MAC Rede, MAC Bluetooth, Selb, Patrimônio, Setor, Alocação). Inventário finalizado 100%.
