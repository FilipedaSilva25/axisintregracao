# Blindagem e backup – AXIS

**Data:** 16/02/2026  

## O que foi blindado

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
