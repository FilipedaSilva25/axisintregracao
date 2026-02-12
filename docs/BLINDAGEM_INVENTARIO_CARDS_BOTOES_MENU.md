# Blindagem – Inventário: Cards, Botões Baixar/Filtrar e Menu Baixar

**Não remover ou alterar** os trechos descritos abaixo sem revisar este documento. Eles garantem os cards em vidro, setas nos botões, menu de download estilizado e a correção do menu que sumia ao passar o mouse.

**Data da blindagem:** 2026-02-09

---

## 1. Objetivo

- **Card Impressoras:** texto "Impressoras" completo, sem corte.
- **Botões Baixar e Filtrar:** setas em SVG (chevron) em vez de ▼.
- **Menu Baixar:** design em vidro fosco com ícones (CSV, Excel, PDF), hover, tema escuro e **sem sumir ao passar o mouse**.
- **Cards em vidro:** Impressoras, Total, ZT411, ZD421, ZQ630 PLUS, alinhados aos botões.

---

## 2. Arquivos envolvidos

| Arquivo | O que foi alterado |
|---------|--------------------|
| `index.html` | Estrutura dos cards; SVG nas setas dos botões Baixar e Filtrar; estrutura do menu `.ucs-download-menu` com opções CSV/Excel/PDF. |
| `css/style.css` | `.ucs-inv-card`, `.ucs-inv-card-label`, `.ucs-inv-card-text`; `.ucs-download-dropdown`, `.ucs-download-menu`; `.ucs-dropdown-arrow`, `.ucs-filter-arrow`; hover do menu; tema escuro do menu; **padding-bottom no dropdown e margin-top: 0 no menu** (correção do sumiço). |

---

## 3. Pontos críticos (não remover)

### 3.1 Card Impressoras – texto não cortado

- **Problema resolvido:** o texto "Impressoras" era truncado ("Impresso...").
- **Onde:** `css/style.css` – `.ucs-inv-card-label` e `.ucs-inv-card-text`.
- **Blindagem:**
  - `.ucs-inv-card-label`: `min-width: 120px`, `width: auto`.
  - `.ucs-inv-card-text`: **não usar** `overflow: hidden` nem `text-overflow: ellipsis`.

### 3.2 Setas SVG nos botões Baixar e Filtrar

- **Problema resolvido:** seta ▼ simples; substituída por SVG elegante.
- **Onde:** `index.html` – dentro de `.ucs-btn-download` e `.ucs-btn-filter`.
- **Blindagem:** usar este SVG no botão Baixar:
  ```html
  <span class="ucs-dropdown-arrow">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
  </span>
  ```
- **Blindagem:** usar este SVG no botão Filtrar:
  ```html
  <span class="ucs-filter-arrow">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
  </span>
  ```

### 3.3 Menu Baixar – design e correção do sumiço

- **Problema 1:** menu "cru em branco".
- **Problema 2:** menu sumia ao passar o mouse para selecionar CSV/Excel/PDF.
- **Causa do sumiço:** gap de 8px entre botão e menu criava zona morta; o menu é `position: absolute`, então o pai não incluía essa área e o hover era perdido.
- **Solução:** `padding-bottom: 8px` no `.ucs-download-dropdown` cria "ponte" de hover; `margin-top: 0` no `.ucs-download-menu` remove o gap.
- **Onde:** `css/style.css`.
- **Blindagem:**
  - `.ucs-download-dropdown`: **obrigatório** `padding-bottom: 8px`.
  - `.ucs-download-menu`: **obrigatório** `margin-top: 0` (não usar `margin-top: 8px` ou similar).

### 3.4 Menu Baixar – estilos em vidro e tema escuro

- **Onde:** `css/style.css` – `.ucs-download-menu`, `.ucs-download-option`, `[data-theme="dark"] .ucs-download-menu`.
- **Blindagem:** manter `backdrop-filter`, sombras, ícones nas opções (📊 CSV, 📗 Excel, 📄 PDF) e estilos dark para `[data-theme="dark"] .ucs-download-menu` e hover.

---

## 4. Estrutura HTML essencial

```html
<div class="ucs-download-dropdown">
    <button class="ucs-btn-download">
        Baixar
        <span class="ucs-dropdown-arrow">
            <svg ...><polyline points="6 9 12 15 18 9"/></svg>
        </span>
    </button>
    <div class="ucs-download-menu">
        <button class="ucs-download-option" onclick="exportarDados('csv')">
            <span class="ucs-download-option-icon">📊</span>
            <span>CSV</span>
        </button>
        ...
    </div>
</div>
```

**Importante:** o menu `.ucs-download-menu` deve estar **dentro** de `.ucs-download-dropdown` para o hover funcionar.

---

## 5. Alterações que quebram a blindagem

- Remover `padding-bottom: 8px` de `.ucs-download-dropdown` → menu volta a sumir ao mover o mouse.
- Adicionar `margin-top: 8px` (ou > 0) em `.ucs-download-menu` → cria gap e quebra o hover.
- Colocar overflow/text-overflow em `.ucs-inv-card-text` → corta "Impressoras".
- Remover `.ucs-inv-card-label { min-width: 120px; width: auto }` → card pode cortar o texto.
- Trocar os SVG por `▼` nos botões → perde o visual refinado.

---

## 6. Como restaurar a partir do backup

1. Execute o script: `.\scripts\backup-hoje.ps1` ou `.\backup-agora.bat`.
2. Ou use a pasta de backup em `backups\Projeto-Vida-BACKUP-AAAA-MM-DD_HH-mm` ou em `Downloads\`.
3. Copie o conteúdo da pasta de backup sobre o projeto atual.
4. Se necessário: `npm install` e `npm start`.

---

**Última atualização:** 2026-02-09 – cards, botões e menu do inventário blindados.
