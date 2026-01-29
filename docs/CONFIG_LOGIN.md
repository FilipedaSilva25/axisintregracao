# 🔐 Configuração de Login - Sistema AXIS

## 👤 Usuário Administrador Padrão

O sistema já vem com um usuário administrador pré-configurado:

**Credenciais:**
- **Login:** `admin_filipe_silva`
- **Senha:** `123456`
- **Perfil:** Administrador

## 📝 Como Funciona

O sistema cria automaticamente este usuário na primeira vez que é carregado. As credenciais estão no arquivo `script.js` na função `inicializarUsuarioAdmin()`.

## 🔒 Segurança

⚠️ **IMPORTANTE:** Após fazer upload para o GitHub, considere alterar a senha padrão do administrador!

### Para alterar a senha do admin:

1. Faça login com: `admin_filipe_silva` / `123456`
2. Acesse a página de Administração
3. Edite o usuário ADMIN
4. Altere a senha

## 📋 Localização no Código

As credenciais padrão estão em:
- **Arquivo:** `script.js`
- **Linha:** ~577-589
- **Função:** `inicializarUsuarioAdmin()`

```javascript
const adminData = {
    name: 'Filipe da Silva',
    pass: '123456',  // ← Senha padrão
    perfil: 'admin'
};
```

## ✅ Após Upload Manual

Quando você fizer upload manual para o GitHub:

1. ✅ O código do login já está incluído
2. ✅ O usuário admin será criado automaticamente
3. ✅ Você pode fazer login imediatamente com: `admin_filipe_silva` / `123456`
4. ⚠️ Considere alterar a senha depois

## 🚀 Criar Novos Usuários

Após fazer login como admin, você pode:
1. Acessar "👤 Administração" no menu
2. Clicar em "Gerenciar Usuários"
3. Cadastrar novos usuários com diferentes perfis

---

**Nota:** As credenciais estão no código e serão enviadas junto com os arquivos quando você fizer upload manual.
