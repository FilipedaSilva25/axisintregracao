# 📦 Guia de Upload Manual para GitHub

## 🎯 Passo a Passo Completo

### 1. Acessar o Repositório no GitHub

1. Abra seu navegador
2. Acesse: **https://github.com/FilipedaSilva25/mylife-os**
3. Certifique-se de estar logado como **FilipedaSilva25**

### 2. Preparar os Arquivos

**IMPORTANTE:** Antes de fazer upload, certifique-se de que está na pasta correta:
```
c:\Users\Filipe da Silva\Downloads\Projeto Vida copia cursor
```

### 3. Fazer Upload dos Arquivos

#### Opção A: Upload de Arquivos Individuais (Para poucos arquivos)

1. No GitHub, clique em **"Add file"** → **"Upload files"**
2. Arraste os arquivos ou clique em **"choose your files"**
3. Selecione os arquivos que deseja enviar
4. Role até o final da página
5. Digite uma mensagem de commit (ex: "Upload manual completo")
6. Clique em **"Commit changes"**

#### Opção B: Upload de Pasta Completa (Recomendado)

⚠️ **Nota:** O GitHub não permite upload direto de pastas pela interface web. Você precisa:

**Método 1: Usar GitHub Desktop (Mais fácil)**
- O GitHub Desktop permite arrastar pastas inteiras
- File → Add Local Repository → Arraste a pasta

**Método 2: Upload arquivo por arquivo**
- Faça upload dos arquivos principais primeiro
- Depois faça upload das pastas (criando os arquivos dentro delas)

**Método 3: Usar Git Bash ou Terminal**
```bash
cd "c:\Users\Filipe da Silva\Downloads\Projeto Vida copia cursor"
git add .
git commit -m "Upload manual completo"
git push origin main
```

### 4. Arquivos Importantes para Enviar

Certifique-se de enviar estes arquivos principais:

#### Arquivos Essenciais:
- ✅ `index.html` - Página principal
- ✅ `script.js` - JavaScript principal (contém login admin)
- ✅ `style.css` - Estilos principais
- ✅ `server.js` - Servidor Node.js
- ✅ `package.json` - Dependências

#### Páginas e Módulos:
- ✅ `manutenção_preventiva.html/css/js`
- ✅ `notas_fiscais.html/css/js`
- ✅ `bloco_de_notas_apple.html/css/js`
- ✅ `ronda/` (pasta completa)
- ✅ `suporte-tecnico.css/js`

#### Pastas:
- ✅ `IMAGENS/` - Todas as imagens
- ✅ `Novos Módulos/` - Módulos adicionais
- ✅ `manuais/` - Documentação
- ✅ `ronda/` - Sistema de rondas

### 5. Verificar o Login

Após fazer upload, o login já estará funcionando:

**Credenciais padrão:**
- **Usuário:** `admin_filipe_silva`
- **Senha:** `123456`

O código do login está no arquivo `script.js` e será enviado junto.

## ⚠️ Arquivos que NÃO devem ser enviados

- ❌ `.git/` (pasta Git - não precisa)
- ❌ `node_modules/` (se existir)
- ❌ `mylife-os/` (pasta duplicada)
- ❌ Arquivos temporários (`.tmp`, `.log`)

## ✅ Checklist Final

Antes de finalizar, verifique:

- [ ] Todos os arquivos HTML foram enviados
- [ ] Todos os arquivos CSS foram enviados
- [ ] Todos os arquivos JS foram enviados
- [ ] A pasta `ronda/` foi enviada completa
- [ ] A pasta `IMAGENS/` foi enviada
- [ ] O arquivo `script.js` foi enviado (contém login)
- [ ] O arquivo `index.html` foi enviado

## 🔍 Como Verificar se Funcionou

1. Acesse: https://github.com/FilipedaSilva25/mylife-os
2. Verifique se todos os arquivos estão lá
3. Clique em `index.html` para ver se o código está correto
4. Clique em `script.js` e procure por `inicializarUsuarioAdmin` - deve estar lá

## 🚀 Depois do Upload

Após fazer upload de tudo:

1. O código do login já estará no GitHub
2. Quando alguém baixar/clonar o repositório, o login funcionará automaticamente
3. O usuário admin será criado na primeira execução
4. Login: `admin_filipe_silva` / Senha: `123456`

---

**Dica:** Se tiver muitos arquivos, faça upload em lotes (10-20 arquivos por vez) para evitar timeout.
