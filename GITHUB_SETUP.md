# 🚀 Configuração do GitHub - Projeto AXIS

## ✅ Status Atual

Todos os arquivos foram commitados com sucesso no repositório local!

**Commit realizado:**
- 58 arquivos alterados
- 39.864 inserções
- 7.864 deleções
- Mensagem: "Reformulação completa: Restauração de páginas, administração, cards da home e todas as funcionalidades"

## 📋 Próximos Passos para Subir para o GitHub

### 1. Criar Repositório no GitHub

1. Acesse [github.com](https://github.com)
2. Clique em "New repository" (ou "Novo repositório")
3. Nome sugerido: `projeto-axis` ou `axis-sistema-gestao`
4. Escolha se será público ou privado
5. **NÃO** marque "Initialize with README" (já temos arquivos)
6. Clique em "Create repository"

### 2. Conectar Repositório Local ao GitHub

Após criar o repositório no GitHub, execute os seguintes comandos:

```bash
# Adicionar o repositório remoto (substitua SEU_USUARIO e NOME_REPOSITORIO)
git remote add origin https://github.com/SEU_USUARIO/NOME_REPOSITORIO.git

# Verificar se foi adicionado corretamente
git remote -v

# Enviar todos os commits para o GitHub
git push -u origin master
```

### 3. Alternativa: Usar SSH (se preferir)

Se você tem SSH configurado no GitHub:

```bash
git remote add origin git@github.com:SEU_USUARIO/NOME_REPOSITORIO.git
git push -u origin master
```

## 📦 Arquivos Incluídos no Commit

### Arquivos Principais:
- ✅ `index.html` - Página principal com todos os módulos
- ✅ `script.js` - JavaScript principal
- ✅ `style.css` - Estilos principais
- ✅ Página de Administração completa
- ✅ Todos os cards da home restaurados

### Módulos Restaurados:
- ✅ `ronda/` - Sistema de rondas (todos os arquivos restaurados)
- ✅ `notas_fiscais.*` - Sistema de notas fiscais
- ✅ `bloco_de_notas_apple.*` - Bloco de notas estilo Apple
- ✅ `manutenção_preventiva.*` - Manutenções preventivas
- ✅ `suporte-tecnico.*` - Sistema de suporte

### Novos Arquivos Adicionados:
- ✅ Documentação (arquivos .md)
- ✅ Configurações e integrações
- ✅ Módulos adicionais

## 🔧 Comandos Úteis

### Ver status do repositório:
```bash
git status
```

### Ver histórico de commits:
```bash
git log --oneline
```

### Adicionar mais arquivos no futuro:
```bash
git add .
git commit -m "Sua mensagem de commit"
git push
```

### Criar uma nova branch para desenvolvimento:
```bash
git checkout -b desenvolvimento
git push -u origin desenvolvimento
```

## ⚠️ Importante

- Certifique-se de ter configurado seu usuário Git:
  ```bash
  git config --global user.name "Seu Nome"
  git config --global user.email "seu.email@exemplo.com"
  ```

- Se precisar de autenticação, o GitHub pode pedir token de acesso pessoal ao invés de senha.

## 📝 Notas

Todos os arquivos estão prontos para serem enviados ao GitHub. Após configurar o repositório remoto, você poderá começar a reformulação do site oficial diretamente no GitHub!
