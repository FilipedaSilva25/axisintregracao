# Ideias de tecnologias para a página de Estoque (Peças)

## Já implementado
- Design em vidro (glassmorphism) + 32 temas
- Gráficos 3D/holográficos com atualização a cada 3s
- Autocomplete inteligente (Produto/Fabricante)
- Assistente com recomendações (estoque baixo, entradas/saídas do mês)
- Exportar movimentos em CSV

---

## Ideias recomendadas (melhores tecnologias)

### 1. **Alertas de validade ("A vencer")**
- Interpretar o campo Validade (ex: "agosto/2027", "08/2027") e destacar itens que vencem em 30, 60 ou 90 dias.
- Card "A vencer" na coluna esquerda, integrado aos alertas.
- **Tecnologia:** parsing de datas em JS, sem biblioteca externa.

### 2. **Exportar estoque completo**
- Botão para baixar todo o estoque em CSV/Excel (não só movimentos).
- Útil para backup, auditoria e análise em planilha.
- **Tecnologia:** Blob + download no browser (igual ao export de movimentos).

### 3. **Backup e restauração**
- **Backup:** download de um ficheiro JSON com estoque + movimentos.
- **Restaurar:** carregar um ficheiro JSON e substituir/restaurar dados.
- **Tecnologia:** File Reader API + localStorage.

### 4. **Leitura por código de barras**
- Usar a câmara para ler código de barras e preencher automaticamente o produto (ou abrir o item no estoque).
- **Tecnologia:** BarcodeDetector API (Chrome) ou QuaggaJS como fallback.

### 5. **PWA (Progressive Web App)**
- Manifest + Service Worker para usar a página offline (consultar e, se quiser, sincronizar depois).
- "Instalar app" no telemóvel ou desktop.
- **Tecnologia:** Web App Manifest, Service Worker, Cache API.

### 6. **Gráfico de tendência (entradas/saídas ao longo do tempo)**
- Gráfico de linhas com os últimos 6–12 meses (entradas e saídas por mês).
- **Tecnologia:** Chart.js (já usado) com tipo `line`.

### 7. **Filtros avançados na tabela**
- Filtros por Fabricante, Local/Armário, "A vencer em X dias".
- **Tecnologia:** filtros em JS sobre o array de estoque antes de renderizar.

### 8. **Notificações no browser**
- Avisos de "estoque baixo" ou "item a vencer" via Push API (com permissão do utilizador).
- **Tecnologia:** Push API, Service Worker, backend opcional para envio.

### 9. **Atalhos de teclado**
- Ex.: Ctrl+K para focar a busca, Ctrl+N para novo cadastro, Escape para fechar modais.
- **Tecnologia:** `keydown` + `preventDefault` quando aplicável.

### 10. **Importação em lote (CSV)**
- Upload de um CSV com colunas (Produto, Fabricante, Conteúdo, Lote, Validade, Qtd, etc.) para criar várias peças de uma vez.
- **Tecnologia:** File API + parsing de CSV em JS.

---

## Ordem sugerida de implementação
1. A vencer + Exportar estoque + Backup/Restaurar (rápido e muito útil).
2. Gráfico de tendência + Filtros avançados.
3. PWA + Atalhos de teclado.
4. Código de barras + Importação CSV (quando fizer sentido no fluxo).

Este ficheiro pode ser removido ou mantido como referência. As funcionalidades 1–3 estão a ser implementadas na página.
