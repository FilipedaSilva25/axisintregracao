# Blindagem – STATUS DE BANCADA

**Data:** 15/03/2026  
**Estado:** Concluído e blindado.

## Ficheiros que não devem ser alterados sem autorização

| Ficheiro | Função |
|----------|--------|
| `pages/status_bancada.html` | Página STATUS DE BANCADA: grids + cards de estatísticas |
| `pages/sauron.html` | Página SAURON: formulário para atualizar status |
| `css/status_bancada.css` | Estilos (vidro, zoom, scroll) |
| `js/status_bancada.js` | Lógica dos grids, API, resumos |

## Backend / dados

- **API:** `GET /api/bancadas/status` e `POST /api/bancadas/status` em `backend/routes.js`
- **Dados:** ficheiro de estado das bancadas (ex. `config/data/bancadas-status.json` ou definido em `backend/routes.js`)

## Comportamento blindado (não perder)

1. **Zoom:** Os grids de PACKING PTW e PACKING MONO ficam sempre dentro do card branco; barra de rolagem horizontal na área da página e dentro de cada card.
2. **Vidro:** Cards de estatísticas com um único degradé (âmbar); estilo vidro sem bordas multicoloridas.
3. **Formulário:** Só na página SAURON; na página Status de Bancada só se vêem os grids e as estatísticas.
4. **Scroll:** `.sb-grid-wrap` com `min-width: 0` e `overflow-x: auto`; cards com `overflow: hidden`; grids com `min-width: 0`, `max-width: 100%`, `overflow-x: auto`.

## Regra Cursor

- Ficheiros listados acima estão em `.cursor/rules/BLINDAGEM_STATUS_BANCADA.mdc`.
- Não alterar sem autorização explícita do utilizador.
- Documentar alterações em `BLINDAGEM.md`.
