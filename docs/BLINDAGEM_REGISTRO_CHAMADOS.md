# Blindagem – Registro de Chamados (Mercado Livre)

**PÁGINA OFICIALMENTE CONCLUÍDA E BLINDADA.**

**Não remover, alterar ou modificar** os arquivos desta página sem autorização explícita do usuário ou sem documentar as alterações neste documento.

**Data da blindagem:** 2026-02-09

---

## 1. Objetivo

A área de Registro de Chamados (Mercado Livre) está **100% completa**. Layout, estrutura e funcionalidades foram validados e aprovados. Qualquer alteração futura deve ser solicitada pelo usuário ou documentada aqui antes de ser aplicada.

---

## 2. Arquivos envolvidos

| Arquivo | Descrição |
|---------|-----------|
| `pages/registro_chamados.html` | HTML da página (formulário, tabela, modais) |
| `css/registro_chamados.css` | Estilos (vidro, tema claro/escuro, tabela, gráficos) |
| `js/registro_chamados.js` | Lógica (CRUD, filtros, exportação, gráficos, tema) |
| `docs/REGISTRO_CHAMADOS_REFERENCIA.md` | Referência funcional |
| `docs/BLINDAGEM_REGISTRO_CHAMADOS.md` | Este documento |

---

## 3. Estrutura aprovada (não alterar sem documentar)

### 3.1 Layout da tabela

- **Colunas (ordem):** DATA | IS DO CHAMADO | STATUS | TIPO DE ATIVIDADE | OBSERVAÇÃO | AÇÕES
- **Coluna DATA:** Data e hora na mesma linha (ex: "09/02/2026 | 01:52:47"). `min-width: 180px`, `white-space: nowrap` para não quebrar.
- **Coluna IS DO CHAMADO:** Estendida. `min-width: 200px`.
- **Coluna OBSERVAÇÃO:** Apenas texto (preview ou "—"). **Não incluir botão "Ver" aqui.**
- **Coluna AÇÕES:** Ordem fixa – **Ver** | **Editar** | **Excluir** (botão Ver à esquerda do Editar)
- **Tags (STATUS e TIPO DE ATIVIDADE):** Centralizadas verticalmente no meio da célula (`vertical-align: middle`, `display: flex` com `align-items: center` em rc-cell-tipos)

### 3.2 Botões de filtro (ordem e cores)

- **Ordem fixa:** Todos | Aberto | Em Andamento | Fechado | Lixeira | Período | Exportar
- **Cores iguais ao STATUS:**
  - Aberto: vermelho (#e74c3c / #c0392b)
  - Em Andamento: laranja (#ff9500 / #c87a0a)
  - Fechado: verde (#2ecc71 / #1e8449)
  - Todos: azul (padrão)
  - Lixeira: vermelho (mantido)

### 3.3 Layout geral

- Painel esquerdo: formulário de registro + gráficos (CHAMADOS POR STATUS, CHAMADOS POR TIPO)
- Painel direito: tabela de chamados (cresce dinamicamente com os dados)
- Sem altura fixa na tabela; sem barra de rolagem interna no card
- Cards em vidro (glass), tema claro/escuro

### 3.4 IDs e classes críticos (JS e CSS)

- `#rc-form`, `#rc-chave`, `#rc-status`, `#rc-tipo-tags-*`, `#rc-obs`, `#rc-form-edit`
- `#rc-table`, `#rc-tbody`, `#rc-empty`, `#rc-search`, `#rc-filter-btn`, `#rc-btn-period`, `#rc-btn-export`
- Classes: `.rc-obs-cell`, `.rc-actions-cell`, `.rc-cell-tipos`, `.rc-pill`, `.rc-tipo-tag`, `.rc-btn-ver-obs`, `.rc-btn-edit`, `.rc-btn-delete`

---

## 4. Pontos críticos (não remover)

1. **Botão Ver na coluna AÇÕES** – O botão "Ver" (observação) deve ficar na coluna AÇÕES, à esquerda de Editar e Excluir. Não voltar para a coluna OBSERVAÇÃO.
2. **Tags centralizadas** – rc-cell-tipos e rc-pill devem ter `vertical-align: middle` / `align-items: center` para centralização vertical na célula.
3. **Tabela dinâmica** – O card da tabela deve crescer com o conteúdo; sem `min-height` ou `overflow` que criem barra interna.
4. **Ordem dos filtros** – Todos | Aberto | Em Andamento | Fechado (não alterar a ordem).
5. **Cores dos filtros** – Aberto=vermelho, Em Andamento=laranja, Fechado=verde (iguais ao STATUS).
6. **EscapeHtml** – Todo conteúdo dinâmico (tabela, lixeira, tags) deve usar escapeHtml antes de inserir no DOM.
7. **localStorage** – Chaves: `axis_registro_chamados`, `axis_registro_chamados_lixeira`, `axis_registro_chamados_theme`.

---

## 5. Como alterar no futuro

1. **Usuário solicita alteração** – Executar conforme pedido.
2. **Correção de bug** – Documentar aqui a alteração e o motivo.
3. **Nova funcionalidade** – Atualizar REGISTRO_CHAMADOS_REFERENCIA.md e este doc antes de implementar.

---

*Última blindagem: 2026-02-09 – **PÁGINA 100% CONCLUÍDA E DECLARADA FINAL.** DATA e hora na mesma linha; IS DO CHAMADO estendido (200px); botões Aberto/Em Andamento/Fechado com cores do STATUS; ordem: Aberto, Em Andamento, Fechado. NÃO MODIFICAR sem autorização do usuário.*
