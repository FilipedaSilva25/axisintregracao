# REGISTRO DE CHAMADOS (MERCADO LIVRE) – Referência

Página **100% completa**. Código **blindado** para não se perder nada.

---

## Arquivos da página

| Arquivo | Descrição |
|--------|------------|
| `pages/registro_chamados.html` | HTML da página (formulário, tabela, modais) |
| `css/registro_chamados.css` | Estilos (vidro, tema claro/escuro, tabela, gráficos) |
| `js/registro_chamados.js` | Lógica (CRUD, filtros, exportação, gráficos, tema) |

Dependências: `css/style.css`, Font Awesome, Chart.js, jsPDF (para PDF).

---

## Funcionalidades

- **Registro de chamado**: Número (IS, max 9 caracteres), Status, Tipo de Atividade (múltiplas tags), Observação.
- **Tabela**: Colunas DATA, IS DO CHAMADO, STATUS, TIPO DE ATIVIDADE, OBSERVAÇÃO, AÇÕES. Filtro por período (Ano/Mês), busca, filtros por status (Todos/Fechado/Aberto/Em Andamento).
- **Lixeira**: Exclusão vai para lixeira; Restaurar ou Apagar definitivamente; expira em 30 dias.
- **Edição**: Modal para editar chamado (mesmos campos).
- **Exportação**: PDF, Excel, CSV, Google Planilhas (respeitando período).
- **Gráficos**: Chamados por Status (doughnut), Chamados por Tipo (doughnut), abaixo do formulário.
- **Modo escuro**: Botão ao lado de “Voltar ao Dashboard”; preferência salva em `localStorage`.

---

## Dados (localStorage)

- `axis_registro_chamados` – array de chamados (id, data, chave, status, tipos[], observacao).
- `axis_registro_chamados_lixeira` – array de itens excluídos (com `deletedAt`).
- `axis_registro_chamados_theme` – `'light'` ou `'dark'`.

---

## Blindagem aplicada

- **HTML** (`pages/registro_chamados.html`): Comentário no topo com referência a este doc e aviso "Não alterar sem documentar".
- **JS** (`js/registro_chamados.js`): IIFE + `'use strict'`; checagem de array em get/save; `try/catch` em localStorage, JSON, Chart, exportações; checagem de elementos DOM antes de usar; `escapeHtml` em todo conteúdo dinâmico (tabela, lixeira, tags, dropdowns); validação de mês (1–12); datas inválidas retornam "—".
- **CSS** (`css/registro_chamados.css`): Cabeçalho com referência ao arquivo e aviso de não alterar sem documentar.
- **Doc**: Este arquivo para referência futura e novas ideias.

---

## Novas ideias

Quando surgir nova ideia para esta página, usar este doc como base e alterar apenas o necessário, mantendo a blindagem (checagens, try/catch, escapeHtml).

---

*Última blindagem: HTML com comentário de referência e aviso; JS com try/catch correto em renderCharts (Chart status).*
