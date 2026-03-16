# Blindagem das Implementações - AXIS

**Data:** 08/02/2026  
**Objetivo:** Documentar e proteger todas as funcionalidades implementadas até o momento.

---

## 1. INTRODUÇÃO (Apresentação primeira visita)

- **Arquivo:** `css/intro-axis.css`, `index.html`
- **Localização:** Overlay `#intro-axis-overlay` antes da tela de login
- **Funcionamento:**
  - Apresentação em 4 slides (Bem-vindo, Inventário Inteligente, Rondas e Manutenções, Pronto para começar)
  - Fundo branco em vidro, semi-transparente
  - Aparece APENAS na primeira visita (`localStorage.axis_intro_seen`)
  - Botões: Próximo, Voltar, Acessar AXIS
  - Transição especial com animação para a tela de login ao clicar "Acessar AXIS"
- **Para ver novamente:** `localStorage.removeItem('axis_intro_seen'); location.reload();`

---

## 2. MODAL ERRO LOGIN (Usuário não encontrado - Vidro)

- **Arquivos:** `index.html` (modal #modal-erro-login), `css/style.css` (.modal-glass-*), `js/script.js` (showModalErroLogin, fecharModalErroLogin)
- **Substitui:** Alert nativo ("localhost:3006 diz")
- **Uso:** showModalErroLogin(titulo, mensagem) para erros de login
- **Estilo:** Vidro, blur, fundo translúcido

---

## 3. INVENTÁRIO VAZIO

- **Arquivo:** `js/script.js`
- **Variável:** `equipamentosExemplo = []` (array vazio)
- **Objetivo:** Permitir criar inventário do zero, sem dados de exemplo

---

## 4. ADMINISTRAÇÃO - Dados ao entrar

- **Arquivo:** `js/script.js`
- **Função:** `atualizarEstatisticasAdmin()` chamada ao navegar para page-administracao
- **Atualização automática:** setInterval a cada 25 segundos quando usuário admin está logado
- **Função:** `iniciarAtualizacaoAdminStats()` - inicia o intervalo
- **Limpeza:** Intervalo cancelado em `execLogout()`

---

## 5. GERENCIAR USUÁRIOS - admin_filipe_silva

- **Arquivo:** `js/script.js` (carregarUsuarios, excluirUsuario, atualizarEstatisticasAdmin)
- **Regras:**
  - admin_filipe_silva: tem botão Editar, NÃO tem botão Excluir (proteção)
  - ADMIN_FILIPE_SILVA (maiúsculas): excluído da lista e da contagem (duplicata)
  - admin_filipe_silva é o único administrador com permissões completas

---

## 6. PERMISSÕES POR PERFIL

- **Perfis:** Administrador, Técnico, Operador, Visualizador
- **Administração:** apenas perfil admin
- **Cadastrar usuários:** apenas admin
- **Armazenamento:** `localStorage.axis_permissoes_perfil` (checkboxes por perfil e módulo)

---

## 7. SEPARAÇÃO DE MODAIS - Gerenciar e Cadastrar

- **Cards no Painel Administração:**
  - Card 1: **Gerenciar Usuários** → abre modal só com lista "Usuários Cadastrados"
  - Card 2: **Cadastrar Novo Usuário** → abre modal só com formulário de cadastro
- **Modais:** `#modal-gerenciar-usuarios`, `#modal-cadastrar-usuario`
- **Funções:** abrirGerenciarUsuarios(), abrirCadastrarUsuario(), fecharModalCadastrarUsuario()

---

## 8. BOTÃO PERMISSÕES (Engrenagem)

- **Local:** Dentro do modal Usuários Cadastrados (header)
- **Modal:** `#modal-permissoes`
- **Conteúdo:** Grid com cards por perfil (Admin, Técnico, Operador, Visualizador)
- **Cada card:** Checkboxes dos módulos da home (Inventário, Rondas, Manutenção Preventiva, Suporte, Notas Fiscais, Bloco de Notas, Registro de Chamados, Configurações)
- **Funções:** abrirModalPermissoes(), fecharModalPermissoes(), salvarPermissao()
- **Módulos:** Array MODULOS_PERMISSOES em script.js

---

## 9. ESTATÍSTICAS DO SISTEMA - Sem Equipamentos/Rondas

- **Arquivo:** `index.html` - Card Estatísticas
- **Removido:** Equipamentos (0), Rondas Realizadas (0)
- **Mantido:** Apenas título, descrição e botão "Ver Estatísticas" (igual Configurações Avançadas)

---

## 10. BARRA DE ROLAGEM INVISÍVEL

- **Arquivo:** `css/style.css`
- **Regras:** ::-webkit-scrollbar-thumb e track com background: transparent
- **Aplicado:** Global e .model-tabs
- **Função:** Rolagem mantida (mouse wheel, touch), visual invisível

---

## 11. MENU - Destaque animado por página

- **Arquivo:** `index.html` (side-items com data-nav-page), `js/script.js` (navigate)
- **Atributo:** data-nav-page em cada botão (page-home, page-inventario, page-rondas, page-administracao, etc.)
- **Lógica:** navigate() remove .active de todos e adiciona ao item onde data-nav-page === pageId
- **Resultado:** Destaque verde/azul acompanha a página atual

---

## 12. REMOÇÃO PARTE BRANCA EM L (Menu aberto)

- **Arquivo:** `css/style.css`
- **Regras:** body.menu-open .glass-sidebar { border-right: none }, body.menu-open .apple-nav { border-bottom: none }
- **Quando:** Ao abrir o menu lateral (toggleSidebar adiciona menu-open ao body)

---

## 13. REMOÇÃO ESPAÇO BRANCO NO FINAL DA TELA

- **Arquivo:** `css/style.css`
- **Alterações:** content-wrapper padding-bottom: 20px, min-height: auto

---

## 14. REMOÇÃO BOTÃO WHATSAPP

- **Arquivos:** index.html (link e script whatsapp-alerts removidos), js/script.js (whatsappButton display: none, fabContainer display: none)
- **Motivo:** Limitações do WhatsApp, função descontinuada

---

## 15. MODAL GERENCIAR - Rolagem e centralização

- **Arquivo:** `css/style.css`
- **Usuários cadastrados:** .usuarios-table-container max-height: 360px, overflow-y: auto
- **Modal:** Centralizado com flex align-items center, overflow-y: auto no overlay
- **Barra branca:** Removida via estilos

---

## ARQUIVOS PRINCIPAIS ALTERADOS

| Arquivo | Conteúdo relevante |
|---------|-------------------|
| index.html | Intro overlay, modal-erro-login, modais admin, side-nav com data-nav-page |
| js/script.js | introProximoSlide, introIrParaLogin, showModalErroLogin, equipamentosExemplo vazio, atualizarEstatisticasAdmin, carregarUsuarios, excluirUsuario, abrirCadastrarUsuario, abrirModalPermissoes, MODULOS_PERMISSOES, navigate com data-nav-page |
| css/style.css | modal-glass, scrollbar transparent, modal-sair-open/menu-open (remove L), content-wrapper, admin-modal |
| css/intro-axis.css | Intro fundo branco vidro, animações |

---

## JAVASCRIPT — try sempre com catch/finally

- **Regra:** Todo bloco `try { ... }` em ficheiros `.js` deve ter `catch` ou `finally` (evita "Missing catch or finally after try").
- **Regra Cursor:** `.cursor/rules/JS_TRY_CATCH_OBRIGATORIO.mdc` — aplicar em alterações a js/**/*.js.
- **Peças (pecas.js):** Todos os try têm catch; cabeçalho do ficheiro referencia a regra.

---

## NÃO REMOVER

- Atributos `data-nav-page` nos side-items
- Funções showModalErroLogin, fecharModalErroLogin
- localStorage axis_intro_seen, axis_permissoes_perfil
- Proteção admin_filipe_silva em excluirUsuario e carregarUsuarios
- Dois cards separados: Gerenciar Usuários e Cadastrar Novo Usuário
- Botão Permissões no modal Usuários Cadastrados

---

*Documento gerado para blindagem. Atualizar conforme novas implementações.*
