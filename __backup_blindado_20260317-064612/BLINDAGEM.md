# Blindagem e backup – AXIS

**Data:** 16/02/2026  
**Atualização (backup/ blindagem):** 18/02/2026  
**Atualização (Status de Bancada):** 15/03/2026  
**Atualização (Modal perfil e foto):** 15/03/2026  

## O que foi blindado

### MODAL DE PERFIL E FOTO – blindado (15/03/2026)

O **modal de perfil** (card com nome, setor, Fechar, Salvar) e o **modal de atualização da foto** (Atualizar Imagem, Visualizar, Salvar Imagem) estão concluídos e protegidos.

**Comportamento garantido:** (1) Perfil: card centralizado no meio da página, fundo borrado, card em vidro estilo Apple. (2) Modal da foto: card exatamente ao centro da viewport; modal movido para `document.body` ao abrir para o `position: fixed` funcionar; fundo borrado e card em vidro.

**Ficheiros protegidos (regra Cursor: `.cursor/rules/BLINDAGEM_MODAL_PERFIL_FOTO.mdc`):** trechos em `index.html` (estrutura do overlay e modais), `css/style.css` (overlay, modal-center, estilos vidro e centralização), `js/script.js` (`abrirPerfilNav`, `fecharPerfilNav`, `abrirModalFotoPerfil` com movimento para body, `fecharModalFotoPerfil`).

**Regra:** Não alterar posicionamento, centralização, vidro ou blur destes modais sem autorização explícita; não remover a lógica de mover o modal da foto para `document.body`; documentar qualquer alteração em BLINDAGEM.md.

---

### STATUS DE BANCADA – blindado (15/03/2026)

A área **STATUS DE BANCADA** foi concluída e está protegida para não se perder nada.

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
