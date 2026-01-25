# 🌐 Configurar Domínio axisintegracao.com.br no GitHub

## 📋 Passo a Passo Completo

### 1. Fazer Upload dos Arquivos para o GitHub

1. Acesse: **https://github.com/FilipedaSilva25/mylife-os**
2. Faça upload de **TODA a pasta** do projeto
3. Certifique-se de que o arquivo `CNAME` está na raiz do repositório

### 2. Ativar GitHub Pages

1. No repositório, vá em **Settings** (Configurações)
2. No menu lateral, clique em **Pages**
3. Em **Source** (Origem), selecione:
   - **Branch:** `main` (ou `master`)
   - **Folder:** `/ (root)` (raiz)
4. Clique em **Save** (Salvar)

### 3. Configurar Domínio Customizado

1. Ainda na página **Settings > Pages**
2. Role até a seção **Custom domain** (Domínio personalizado)
3. Digite: `axisintegracao.com.br`
4. Clique em **Save** (Salvar)
5. Marque a opção **Enforce HTTPS** (Forçar HTTPS) - aparecerá depois de configurar

### 4. Configurar DNS no Provedor do Domínio

⚠️ **IMPORTANTE:** Você precisa configurar o DNS do domínio `axisintegracao.com.br` para apontar para o GitHub Pages.

#### Opção A: Configuração com Registros A (Recomendado)

Adicione estes registros A no seu provedor de domínio:

```
Tipo: A
Nome: @
Valor: 185.199.108.153
TTL: 3600

Tipo: A
Nome: @
Valor: 185.199.109.153
TTL: 3600

Tipo: A
Nome: @
Valor: 185.199.110.153
TTL: 3600

Tipo: A
Nome: @
Valor: 185.199.111.153
TTL: 3600
```

#### Opção B: Configuração com CNAME (Alternativa)

Se preferir usar CNAME:

```
Tipo: CNAME
Nome: @
Valor: FilipedaSilva25.github.io
TTL: 3600
```

**OU** para subdomínio www:

```
Tipo: CNAME
Nome: www
Valor: FilipedaSilva25.github.io
TTL: 3600
```

### 5. Verificar Configuração

Após configurar o DNS:

1. Aguarde alguns minutos (pode levar até 24 horas)
2. No GitHub, em **Settings > Pages**, você verá:
   - ✅ "DNS check successful" (Verificação DNS bem-sucedida)
   - ✅ "Certificate issued" (Certificado emitido)
3. Marque **Enforce HTTPS** (Forçar HTTPS)

### 6. Testar o Site

1. Acesse: **https://axisintegracao.com.br**
2. O site deve carregar normalmente
3. Teste o login: `admin_filipe_silva` / `123456`

## 📝 Arquivos Importantes

Os seguintes arquivos já foram criados na raiz do projeto:

- ✅ `CNAME` - Contém o domínio `axisintegracao.com.br`
- ✅ `.nojekyll` - Garante que o GitHub Pages não processe como Jekyll

## ⚠️ Importante

1. **DNS:** A configuração do DNS deve ser feita no provedor onde você registrou o domínio `axisintegracao.com.br`
2. **Tempo:** Pode levar de alguns minutos até 24 horas para o DNS propagar
3. **HTTPS:** O GitHub fornece certificado SSL gratuito automaticamente
4. **CNAME:** O arquivo `CNAME` deve estar na raiz do repositório

## 🔍 Como Verificar se Está Funcionando

1. Acesse: https://axisintegracao.com.br
2. Se aparecer o site AXIS, está funcionando! ✅
3. Se não funcionar, verifique:
   - DNS está configurado corretamente?
   - GitHub Pages está ativado?
   - Arquivo CNAME está na raiz do repositório?

## 🆘 Problemas Comuns

### Site não carrega
- Verifique se o DNS está configurado corretamente
- Aguarde até 24 horas para propagação do DNS
- Verifique se GitHub Pages está ativado

### Erro de certificado SSL
- Aguarde alguns minutos após configurar o domínio
- O GitHub gera o certificado automaticamente
- Marque "Enforce HTTPS" após o certificado ser gerado

### Domínio não reconhecido
- Verifique se o arquivo `CNAME` está na raiz
- Verifique se o conteúdo do `CNAME` está correto: `axisintegracao.com.br`
- Certifique-se de que não há espaços ou linhas extras no arquivo

---

**Status:** ✅ Arquivos de configuração criados e prontos para upload!
