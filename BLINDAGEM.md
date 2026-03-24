# Blindagem e backup – AXIS

**Data:** 16/02/2026  
**Atualização (backup/ blindagem):** 18/02/2026  
**Atualização (Status de Bancada):** 15/03/2026  
**Atualização (Modal perfil e foto):** 15/03/2026  
**Atualização (consola / F12 — expectativas):** 22/03/2026  

## O que foi blindado

### Consola do browser (F12) — mitigação, não bloqueio total (22/03/2026)

**O que é possível e o que não é:** o navegador pertence ao utilizador. **Não é tecnicamente possível** impedir de forma fiável o uso de F12, da aba Elements ou da alteração local do HTML/CSS/JS — qualquer truque em JavaScript pode ser contornado. Quem “desconfigurou” o site pelo F12 alterou **só a vista no próprio PC** (ou cache); o repositório GitHub e o servidor não mudam por isso.

**O que foi implementado no AXIS:**

1. **`js/axis-console-shield.js`** — Em **produção** (hostname que não é `localhost` / `127.0.0.1`), silencia `console.log`, `debug`, `info`, `trace`, `table`, `group*`, etc., mantendo **`console.error`** e **`console.warn`**. Objetivo: menos ruído e menos exploração casual pela consola; **não** impede editar o DOM no inspetor.
2. **Injeção automática** — `backend/static.js` insere o script logo após `<head>` em **todas** as respostas HTML servidas por este Node, exceto se existir `AXIS_CONSOLE_SHIELD=0` no `.env` (desliga a injeção).
3. **Suporte com consola completa:** na consola, uma vez: `sessionStorage.setItem('axis_allow_console','1'); location.reload();`
4. **Cabeçalho `Referrer-Policy`** em `backend/config.js` (`strict-origin-when-cross-origin`) — reforço de privacidade; não relacionado com F12.

**Regra:** alterações a esta política ou ao ficheiro do escudo devem ser documentadas aqui.

---

### MODAL DE PERFIL E FOTO – blindado (15/03/2026)

O **modal de perfil** (card com nome, setor, Fechar, Salvar) e o **modal de atualização da foto** (Atualizar Imagem, Visualizar, Salvar Imagem) estão concluídos e protegidos.

**Comportamento garantido:** (1) Perfil: card centralizado no meio da página, fundo borrado, card em vidro estilo Apple. (2) Modal da foto: card exatamente ao centro da viewport; modal movido para `document.body` ao abrir para o `position: fixed` funcionar; fundo borrado e card em vidro.

**Ficheiros protegidos (regra Cursor: `.cursor/rules/BLINDAGEM_MODAL_PERFIL_FOTO.mdc`):** trechos em `index.html` (estrutura do overlay e modais), `css/style.css` (overlay, modal-center, estilos vidro e centralização), `js/script.js` (`abrirPerfilNav`, `fecharPerfilNav`, `abrirModalFotoPerfil` com movimento para body, `fecharModalFotoPerfil`).

**Regra:** Não alterar posicionamento, centralização, vidro ou blur destes modais sem autorização explícita; não remover a lógica de mover o modal da foto para `document.body`; documentar qualquer alteração em BLINDAGEM.md.

---

### STATUS DE BANCADA – blindado (15/03/2026)

A área **STATUS DE BANCADA** foi concluída e está protegida para não se perder nada.

**Atualização autorizada (20/03/2026):** no card **PACKING MACHINE**, a ordem visual foi ajustada para leitura de baixo para cima, ficando **PM01 em baixo** e **PM06 em cima**, igual ao padrão de **RETIROS** (alteração em `js/status_bancada.js`, `PM_LAYOUT`).

**Atualização autorizada (20/03/2026):** layout dos cinco cards principais do **STATUS DE BANCADA** ajustado para uma única faixa horizontal lado a lado, com ordem visual da esquerda para a direita `REJEITOS → PACKING PTW → PACKING MONO → PACKING MACHINE → RETIROS` (equivalente ao pedido da direita para a esquerda: `RETIROS → PACKING MACHINE → PACKING MONO → PACKING PTW → REJEITOS`). A área principal passou a usar rolagem horizontal da página (`css/status_bancada.css`).

**Ficheiros protegidos (regra Cursor: `.cursor/rules/BLINDAGEM_STATUS_BANCADA.mdc`):**

- `pages/status_bancada.html` – Página com os grids (REJEITOS, PACKING PTW, PACKING MONO, PACKING MACHINE, RETIROS) e cards de estatísticas em vidro.
- `pages/sauron.html` – Página para atualizar status (formulário); único sítio onde se altera status.
- `css/status_bancada.css` – Estilos: vidro (degradé âmbar), zoom, scroll horizontal na página e nos cards PTW/MONO, barras de rolagem.
- `js/status_bancada.js` – Lógica dos grids, chamadas à API `/api/bancadas/status`, resumos e formulário.

**O que ficou garantido (não alterar sem documentar):**

1. Grids sempre **dentro do card branco** ao dar zoom; barra de rolagem na área da página e dentro dos cards PACKING PTW e PACKING MONO.
2. Cards de estatísticas com **vidro em degradé** (uma cor, âmbar); sem formulário na página Status de Bancada (só no SAURON).
3. API e dados: `GET/POST /api/bancadas/status` em `backend/routes.js` e ficheiro de dados (ex.: `config/data/bancadas-status.json`) fazem parte desta funcionalidade.

**Card PACKING PTW – 100% blindado:** O card branco de PACKING PTW está concluído (grid centralizado, sem rolagem, todas as colunas visíveis incluindo A03 e A01). **Não fazer mais alterações** no layout/CSS/HTML deste card; a regra em `.cursor/rules/BLINDAGEM_STATUS_BANCADA.mdc` detalha a proteção.

**Card PACKING MONO – 100% blindado:** O card branco de PACKING MONO está concluído (grid centralizado, rolagem horizontal/vertical, barra vertical invisível). **Não fazer mais alterações** no layout/CSS/HTML deste card; a regra em `.cursor/rules/BLINDAGEM_STATUS_BANCADA.mdc` detalha a proteção.

**Cards REJEITOS, PACKING MACHINE e RETIROS – 100% blindados:** Os três cards da linha de baixo estão concluídos (células 58–72px, fonte 16px, padding como PACKING MONO, todos os grids dentro do card). Em **tela cheia** ficou definido: zoom no grid (scale 1.5), título em cima, grid centralizado no meio da página (`margin-top/bottom: auto`). **Não fazer mais alterações** no layout/CSS/HTML destes três cards nem no comportamento em tela cheia; a regra em `.cursor/rules/BLINDAGEM_STATUS_BANCADA.mdc` detalha a proteção.

**Linha de cards de estatísticas – posição blindada:** Os cards de estatísticas estão na posição definida com `.sb-stats-row` `margin-top: 0`. **Não alterar** sem autorização.

**Bloco de estatísticas e legenda – 100% blindado:** Layout em 3 colunas: (1) PACKING MONO + PACKING PTW; (2) REJEITOS + PACKING MACHINE; (3) RETIROS + LEGENDA. Cards com min-height 300px, mesmo tamanho; Legenda com estilo vidro âmbar. **Não alterar** estrutura, ordem ou estilos; a regra em `.cursor/rules/BLINDAGEM_STATUS_BANCADA.mdc` detalha.

**Página STATUS DE BANCADA – concluída e totalmente blindada (15/03/2026):** A página está finalizada. Nenhuma alteração em status_bancada (HTML, CSS, JS) ou nas áreas descritas acima deve ser feita sem autorização explícita. Pedidos de alteração nesta página devem ser recusados ou confirmados com o utilizador.

**Regra:** Não alterar os ficheiros listados sem autorização explícita; não alterar PACKING PTW; não alterar PACKING MONO; não alterar REJEITOS, PACKING MACHINE e RETIROS; não alterar a posição dos cards de estatísticas; não alterar o bloco de estatísticas/legenda (3 colunas); documentar qualquer alteração noutras áreas neste ficheiro (BLINDAGEM.md).

**Cópia de segurança (opcional):** Para não perder nada, pode guardar uma cópia da pasta `pages/` (status_bancada.html, sauron.html), do `css/status_bancada.css` e do `js/status_bancada.js` noutro sítio (Pen, OneDrive, ou pasta `_scripts_protegidos_axis`).

---

### Configurações (Configurações do Sistema)
- **loadSettings()**  
  - Envolvida em `try/catch`: se algum elemento do DOM ou valor quebrado quebrar a função, o resto do app continua funcionando.  
  - Valores validados com fallback seguro:  
    - **Tema:** só `light` ou `dark`.  
    - **Itens por página:** número entre 5 e 100.  
    - **Página inicial:** só páginas válidas (`page-home`, `page-inventario`, `page-rondas`, `page-administracao`, `page-configuracoes`).  
    - **Cor de destaque:** só `blue`, `green`, `purple`, `orange`.  
    - **Tamanho da fonte:** só `normal`, `large`, `xlarge`.  
  - Em caso de erro, aplica padrões seguros (ex.: 15 itens, azul, fonte normal).

- **Importar configurações**  
  - Apenas chaves conhecidas e valores permitidos são aplicados ao importar um JSON:  
    - `theme`: só `light` ou `dark`.  
    - `itemsPerPage`: número entre 5 e 100.  
    - `fontSize`, `accentColor`, `homePage`: só valores das listas válidas.  
    - Demais opções (boolean/number) tratadas sem executar código do arquivo.

- **Restaurar padrões**  
  - Remove apenas chaves `axis-*` de configuração.  
  - **Não** remove dados de usuários (`db_*`) nem sessão de login.

### Resumo do que está protegido
- Valores vindos do localStorage ou de arquivo importado não quebram a aplicação.  
- Navegação e preferências ficam dentro de opções válidas.  
- Erro em uma parte das configurações não derruba a tela inteira.

---

## Cópia de backup

Foi criada uma cópia completa do projeto em:

### Backup interno (dentro do próprio projeto)

**`C:\Users\Filipe da Silva\Downloads\Projeto Vida copia cursor\__backup_blindado_20260218-064501`**

- Copiado **sem** `.git` e **sem** `node_modules` (para ser leve e confiável).
- Total (aprox.): **916 arquivos**.

### Backup externo (opcional)

**`C:\Users\Filipe da Silva\Downloads\Projeto Vida - backup blindado`**

Se a pasta ainda não aparecer ou estiver vazia, a cópia pode ainda estar em andamento (o projeto é grande). Nesse caso, aguarde ou execute manualmente no PowerShell:

```powershell
Copy-Item -Path "C:\Users\Filipe da Silva\Downloads\Projeto Vida copia cursor" -Destination "C:\Users\Filipe da Silva\Downloads\Projeto Vida - backup blindado" -Recurse -Force
```

---

## Funcionalidades implementadas até esta data (resumo)

- Modal **Editar Usuário**: dropdown de Perfil no lugar certo; Setor com seletor igual ao de Perfil (Internal Systems, Sauron).  
- Modal **Cadastrar Novo Usuário**: seletor de Perfil com o mesmo design do Editar.  
- **Configurações**: Aparência (tema, alto contraste, cor de destaque), Preferências (itens por página, página inicial), Notificações, Acessibilidade (fonte, reduzir animações), Privacidade e Segurança (logout por inatividade, mascarar dados), Idioma e Região (data, hora), Sistema (limpar cache, exportar, importar, restaurar padrões), Sessão (conectado como, página atual), Sobre (versão, termos, política de privacidade).  
- Blindagem das configurações (validação e try/catch) e cópia de backup.

---

## Scripts de início – protegidos

**Script principal em uso:** **`iniciar-site.ps1`** e **`iniciar-site.bat`** (recomendado).  
Também protegidos: **`start.bat`** e **`abrir-site.ps1`**. Não alterar sem autorização explícita.

### Cópia de segurança (nunca perder)
- Pasta **`_scripts_protegidos_axis/`** contém cópias de **iniciar-site.ps1** e **iniciar-site.bat**.
- Se os ficheiros da raiz forem apagados, copie de `_scripts_protegidos_axis/` para a raiz do projeto.
- Recomendação: guardar também essa pasta noutro sítio (Pen, OneDrive, etc.).

### Regras obrigatórias
1. O script **sempre** abre o site na **tela de login** (`?tela=login#login`), nunca dentro de um utilizador.
2. O site usa a **porta 3006** (porta original).
3. O script **não** abre a página do QR Code – abre o site principal.

### Protecção
- **Não alterar** estes ficheiros sem autorização.
- Regra Cursor: `.cursor/rules/SCRIPT_PROTECAO.mdc` (globs: iniciar-site.ps1, iniciar-site.bat, start.bat, abrir-site.ps1).
- Qualquer alteração requer confirmação explícita do utilizador.

---

## Atualização protegida — Auditoria, senha temporária e UI do WhatsApp/Packing

Nesta fase foram implementadas e devem continuar consistentes:

1. **Auditoria com dispositivo (sem dados pessoais extras)**  
   - `login/logout` passam a gravar `device` (categoria: `Computador`, `Tablet`, `Smartphone`).  
   - A tabela “Logs e Auditoria” foi atualizada para exibir a coluna “Dispositivo”.

2. **Senha temporária obrigatória após Bem-vindo**  
   - Usuários criados pelo admin recebem `senhaTemporaria: true` no registo.  
   - O modal em vidro aparece logo depois do `showBemVindoModal`, e só é possível continuar após definir a nova senha.

3. **UI do Conector WhatsApp e avisos da Packing Machine**  
   - `pages/whatsapp-qr.html`: redesenhado no estilo “vidro Apple” sem mudar a lógica do QR.  
   - `pages/packing_machine.html`: cards WhatsApp sem referência ao caminho administrativo **Conector WhatsApp** (colaboradores só veem uso do bot e contacto de suporte).  
   - `css/packing_machine.css`: compatibilizado com o novo texto.

4. **Retorno de Dashboard padronizado**  
   - O destaque azul do menu é apenas visual.  
   - Ao “voltar”, o sistema deve abrir a seção `page-home` (Início).

### Ficheiros extra blindados nesta etapa
- `pages/packing_machine.html`
- `pages/whatsapp-qr.html`
- `css/packing_machine.css`

---

### PACKING MACHINE — Preventivas + bot WhatsApp (20/03/2026)

**Pedido do utilizador:** área *PREVENTIVAS DE PACKING MACHINE* dentro da página Packing Machine, com duas telas (registrar + painel), e fluxo no bot WhatsApp.

**Atualização UI (vidro / estilo Forms):** Hero em glassmorphism, perguntas numeradas, tiles para PM, checkboxes em vidro, chips de contacto; painel com cartões reforçados em `css/packing_machine.css` (estrutura HTML da secção Preventivas em `packing_machine.html`).

**Painel = layout Trocas de cabeça:** O separador *Painel* em Preventivas usa o mesmo `pm-main` (coluna RESUMO, fila de 2 gráficos: preventivas por PM + tempo médio entre preventivas, histórico com busca e filtro por PM), espelhando `js/packing_machine.js` em `js/packing_preventiva.js`.

**Implementação:** Separadores *Trocas de cabeça* | *Preventivas* em `pages/packing_machine.html`. Em Preventivas: subtelas *Registrar* (formulário alinhado ao Google Forms: usuário, PM 01–06, checkboxes cabeça/rolos, observação) e *Painel* (tabela + gráfico tipo donut). Dados em `config/data/packing-preventivas.json`; API `GET /api/packing/preventivas` e `POST /api/packing/preventiva`; lógica partilhada em `backend/packing-preventiva-persist.js`. Frontend: `js/packing_preventiva.js`, estilos em `css/packing_machine.css`. Bot: `backend/whatsapp-packing-bot.js` menu numérico *1–6* (6 = ajuda/suporte com contactos oficiais), opção *2* e palavra *preventiva*; conector e webhooks passam `registerPreventiva`. Card informativo Preventivas: contactos axis.support@icloud.com e WhatsApp (48). Textos de ajuda em `assistant.js`, `assistant-knowledge.js`, `pages/whatsapp-qr.html` e snippet de status em `backend/routes.js`.

---

### start.bat – mensagem porta 3006 (20/03/2026)

**Pedido do utilizador:** deixar explícito no `start.bat` que o site corre na **porta 3006** e qual a URL de login, antes de chamar `abrir-site.ps1` (que já usa `$port = 3006` e inicia `node server.js` + Chrome).

**Alteração:** `echo` com URL `http://localhost:3006/?tela=login#login` e comentário a referir alinhamento com `abrir-site.ps1`. `.env.example` ajustado para `PORT=3006` (antes 3007) para coincidir com o backend (`backend/config.js` default 3006).

### abrir-site.ps1 – Chrome anónimo / portaria (22/03/2026)

**Pedido do utilizador:** ao arrancar pelo `start.bat`, o site deve abrir na **tela de login**, não já dentro da sessão do utilizador no Chrome (localStorage do perfil normal mantinha o login).

**Alteração:** o Chrome passa a abrir com `--incognito` e a URL `?tela=login#login`; fallback Firefox com `-private-window`. Mensagens no `start.bat` explicam janela anónima. O servidor continua com `$env:PORT = 3006` e `node server.js`.

### Home em branco na 1.ª carga + foto de perfil (22/03/2026)

**Problema:** após login, a área principal às vezes ficava branca até recarregar; no modal de foto, «Salvar a Imagem» apenas descarregava um PNG e a chave `db_*` nem sempre coincidia com `axisLoginCanonico`.

**Alteração:** `css/style.css` — animação `fadeIn` só em `.main-section.active`. `js/script.js` — `navigate()` e `showMainPersist` forçam `visibility`/`opacity` na secção ativa; após `showMainContentRestore` um duplo `requestAnimationFrame` chama `navigate` outra vez; funções `axisUserDbStorageKey` / `axisLoadUserJsonByLogin`; perfil e modal usam chave canónica; «Atualizar Imagem» deixa de fechar o modal antes do `<input type=file>`; «Guardar no perfil» grava `foto` no `localStorage`. `index.html` — texto do botão e `title` do clique na foto.

---

### Encerramento blindado (24/03/2026)

**Autorização do utilizador:** encerrar sessão com “blinde tudo e salva tudo”.

**Atualizações protegidas desta sessão:**
- `abrir-site.ps1` e `start.bat`: arranque mantido em `3006`, URL de login preservada, abertura do Chrome ajustada para **perfil normal** (sem anónimo) por pedido explícito.
- `js/axis-face-auth.js`: fluxo de câmara reforçado para pedir permissão no clique do utilizador (login e cadastro facial).
- `js/script.js` e `index.html`: sessão por inatividade fixa em 30 min (sem seletor visível), alertas de senha 5→1 dias, bloqueio por expiração e desbloqueio via admin ao redefinir senha.
- `js/script.js`: preservação de foto/setor no perfil e reforço do submit em “Editar usuário”.
- `backend/assistant.js` + `js/axis-robot-assistant.js`: robô atualizado para cadeia de providers IA (OpenAI/Anthropic/Gemini) com fallback seguro.
- `js/selbetti-hub.js`, `pages/selbetti.html`, `js/selbetti-chrome-runtime-shim.js`, `assets/IMAGENS/O_Patrimonio_Ta_On.png.png`: correção do 404 de imagem e mitigação de `runtime.lastError` no contexto SELBETTI.

**Nota de segurança operacional:** manter `.env`, `config/data/whatsapp-auth/*` e credenciais fora de commits públicos.
