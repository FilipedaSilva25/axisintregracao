# Blindagem – Perfil no Nav (Dropdown do usuário)

**Data:** 09/02/2026  
**Objetivo:** Documentar e proteger a funcionalidade do painel de perfil no header (botão "Filipe da Silva" / inicial "F") para que abra em qualquer página e não seja perdida em futuras alterações.

---

## 1. O QUE FOI BLINDADO

- **Dropdown do perfil** no canto superior direito do header (AXIS).
- Ao clicar no **nome do usuário** ou na **inicial (F)** no header, abre um painel com:
  - Foto/inicial, nome, setor
  - Campos editáveis: Nome completo, Setor
  - Dados somente leitura: Usuário (login), Expiração da senha
  - Botões: **Fechar** e **Salvar**
- O painel deve **abrir em qualquer seção** (Início, Inventário, Suporte, Configurações, etc.), não apenas na home.

---

## 2. ARQUIVOS ENVOLVIDOS

| Arquivo | Uso |
|--------|-----|
| `index.html` | Estrutura do `#axis-profile-wrap`, `#axis-profile-trigger`, `#axis-profile-dropdown` e texto "BEM-VINDO AO AXIS, …" (`#nav-welcome-text`). |
| `js/script.js` | `atualizarPerfilNav`, `preencherPerfilMini`, `abrirPerfilNav`, `fecharPerfilNav`, `initAxisProfile`; atribuição em `window`; chamadas em `navigate()`. |
| `css/style.css` | `.axis-profile-wrap`, `.axis-profile-trigger`, `.axis-profile-dropdown`, `.axis-profile-dropdown.open`, `body > .axis-profile-dropdown.open`; z-index e pointer-events do perfil e do header. |

**Não remover** os IDs `axis-profile-wrap`, `axis-profile-trigger`, `axis-profile-dropdown` nem as funções globais `window.abrirPerfilNav` e `window.fecharPerfilNav`.

---

## 3. COMPORTAMENTO OBRIGATÓRIO

1. **Ao abrir o perfil (`abrirPerfilNav`):**
   - O elemento `#axis-profile-dropdown` é **movido para `document.body`** (para não ser cortado por overflow do header).
   - Posição e tamanho são definidos com base em `getBoundingClientRect()` do trigger (fixed, abaixo ou acima do botão).
   - Estilos de exibição são aplicados com **prioridade alta** (`setProperty(..., 'important')`) para `visibility`, `opacity`, `display`, `z-index`.
   - É chamado `preencherPerfilMini()` para preencher dados no painel.
   - É definido `window._axisProfileOpenedAt = Date.now()` para o listener de "clicar fora".
   - Um `requestAnimationFrame` reaplica visibilidade no próximo frame.

2. **Ao fechar (`fecharPerfilNav`):**
   - O dropdown perde a classe `open` e os estilos inline de posição/visibilidade.
   - O dropdown é **recolocado dentro de `#axis-profile-wrap`** se estiver em `document.body`.

3. **Em todas as seções:**
   - Na função `navigate(pageId)`:
     - No início, chama-se `fecharPerfilNav()` para estado limpo.
     - Depois de `atualizarPerfilNav()`, garante-se `#axis-profile-wrap` com `display: flex` e `visibility: visible` quando há `current_user_login` no localStorage.

4. **Clicar fora:**
   - Um listener em `document` fecha o perfil ao clicar fora do wrap e fora do dropdown.
   - Cliques nos primeiros **200 ms** após abrir são ignorados (evita fechar no mesmo clique que abriu).
   - O listener usa `getElementById` atual para `axis-profile-dropdown` e `axis-profile-wrap`.

---

## 4. CSS CRÍTICO (não remover)

- **`.axis-profile-wrap`:** `z-index: 1001`, `pointer-events: auto` (acima do header com z-index 1000).
- **`.axis-profile-trigger`:** `pointer-events: auto`.
- **`.axis-profile-dropdown.open`:** `display: block !important`, `visibility: visible !important`, `opacity: 1 !important`, `pointer-events: auto !important`.
- **`body > .axis-profile-dropdown.open`:** mesma visibilidade e `z-index: 999999 !important` quando o dropdown está no body.
- **`.main-section`:** `position: relative; z-index: 0` para ficar atrás do header e não cobrir o botão do perfil.

---

## 5. INICIALIZAÇÃO

- `initAxisProfile()` é chamado ao carregar a página (se `document.readyState !== 'loading'` ou no `DOMContentLoaded`).
- Depende de existirem no DOM: `#axis-profile-wrap`, `#axis-profile-trigger`, `#axis-profile-dropdown`.
- `atualizarPerfilNav()` é chamado após login e em cada `navigate()`; mostra o wrap (`display: flex`) quando há usuário logado.

---

## 6. SE O PERFIL PARAR DE ABRIR

1. Verificar no console se aparece: `AXIS Perfil: trigger ou dropdown não encontrado` (indica elemento ausente no DOM).
2. Confirmar que `window.abrirPerfilNav` e `window.fecharPerfilNav` existem (F12 → Console: `typeof window.abrirPerfilNav`).
3. Não remover a movimentação do dropdown para `document.body` em `abrirPerfilNav` nem o retorno para o wrap em `fecharPerfilNav`.
4. Manter o `try/catch` no `onclick` do botão no HTML e as chamadas a `setProperty(..., 'important')` em `abrirPerfilNav`.

---

## 7. ERRO NO CONSOLE (extensão Chrome)

A mensagem *"Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received"* costuma vir de **extensão do Chrome**, não do AXIS. O perfil funciona normalmente; pode ignorar ou desativar extensões em `localhost:3006` se quiser limpar o console.

---

**Última atualização:** 09/02/2026 – blindagem completa do perfil no nav.
