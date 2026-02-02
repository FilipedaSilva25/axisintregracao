# Blindagem "Voltar para Dashboard" (Manutenções Preventivas)

**Não remover ou alterar** os trechos marcados com `BLINDAGEM VOLTAR` sem revisar este documento.

## Objetivo

Garantir que, ao clicar em **"← Voltar para Dashboard"** nas páginas de Manutenções Preventivas (formulário ou dashboard), o usuário **sempre** volte para a **Home do AXIS** **sem** cair na tela de login.

## Pontos críticos (não remover)

### 1. `index.html` – Início do `<body>`

- **Comentário:** `BLINDAGEM VOLTAR MANUTENÇÕES - NÃO REMOVER`
- **Script:** Detecta `?axis_voltar=1` na URL **ou** `sessionStorage.axis_voltar_force_main === '1'`.
- Se houver `current_user` no `localStorage`:
  - Seta `user_logged_in` e `axis-current-page` (page-home).
  - Seta `axis_voltar_force_main` no `sessionStorage`.
  - Faz `history.replaceState` para `#page-home` (remove o `?axis_voltar=1`).

### 2. `index.html` – Antes do `script.js`

- **Comentário:** `BLINDAGEM VOLTAR MANUTENÇÕES: esconde login, mostra Home, retries...`
- **Script:** Se `axis_voltar_force_main === '1'`:
  - Esconde `#auth-screen` e `#loading-screen`, mostra `#main-content`.
  - Mostra a seção `#page-home`, atualiza nome do usuário e menu admin.
  - Executa **retries** (0ms, 80ms, 250ms, 500ms) para evitar que outro script volte a exibir o login.

### 3. `manutenção_preventiva.html` e `manutencoes-dashboard.html`

- **Link "Voltar para Dashboard":**
  - `href="../index.html?axis_voltar=1#page-home"` (obrigatório).
  - `onclick` que chama `sessionStorage.setItem('axis_voltar_force_main','1')` (obrigatório).
- **Comentário:** `BLINDAGEM VOLTAR: link deve ter href=... e onclick...`

## Fluxo resumido

1. Usuário clica em "Voltar para Dashboard" → `onclick` seta a flag → navega para `../index.html?axis_voltar=1#page-home`.
2. Index carrega → primeiro script vê param ou flag + `current_user` → restaura sessão e seta flag → `replaceState` para `#page-home`.
3. Script "force main" vê a flag → esconde login, mostra main e Home → limpa a flag → retries garantem que login não volte.

## Alterações permitidas

- Ajustes de texto/comentários, desde que o sentido acima seja mantido.
- Mudanças de estilo (CSS) ou IDs/classes **desde que** os seletores usados nos scripts (`#auth-screen`, `#main-content`, `#page-home`, etc.) continuem corretos.

## Alterações que quebram a blindagem

- Remover `?axis_voltar=1` do `href` do link "Voltar para Dashboard".
- Remover o `onclick` que seta `axis_voltar_force_main`.
- Remover ou alterar o primeiro script no `body` do `index.html` (detecção de param/flag e restauração de sessão).
- Remover ou alterar o script "force main" (esconder login, mostrar main, retries).
- Trocar o link por um `window.location` que não use `?axis_voltar=1` nem a flag.
