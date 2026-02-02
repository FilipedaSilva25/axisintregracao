# Backend completo – Projeto Vida / AXIS

Este documento explica como o backend está organizado e como colocá-lo no ar (local e online).

---

## Estrutura do backend

```
backend/
  config.js   → Porta, pastas, MIME, headers (usa process.env.PORT)
  data.js     → readJson / writeJson para arquivos JSON
  routes.js   → Todas as rotas da API
  static.js   → Servir HTML, CSS, JS e fallback para pasta pages
server.js     → Entrada do servidor (usa backend/)
config/data/  → axis-seed.json, axis-backup.json
.env.example  → Exemplo de variáveis (PORT, NODE_ENV)
```

---

## API disponível

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` ou `/ping` | Status do servidor |
| GET | `/api` | Lista de endpoints |
| GET | `/data/axis-seed` ou `/data/axis-seed.json` | Dados de demonstração (usuários, inventário) |
| GET | `/api/backup` | Backup armazenado no servidor |
| POST | `/api/backup` | Salvar backup (body JSON) |
| GET | `/api/config/alertas` | Config de alertas (Novos Módulos) |
| POST/PUT | `/api/config/alertas` | Salvar config de alertas |
| GET | `/api/config/tecnicos` | Config de técnicos (Novos Módulos) |
| POST/PUT | `/api/config/tecnicos` | Salvar config de técnicos |

O restante das URLs é tratado como **arquivo estático** (index.html, pages/*, css, js, imagens).

---

## Rodar localmente

1. **Porta padrão 3006**
   ```bash
   node server.js
   ```
   Ou:
   ```bash
   npm start
   ```

2. **Outra porta (opcional)**  
   No Windows (PowerShell):
   ```powershell
   $env:PORT=8080; node server.js
   ```
   No Linux/Mac:
   ```bash
   PORT=8080 node server.js
   ```

3. **Variáveis em arquivo (opcional)**  
   Se quiser usar um arquivo `.env`:
   - Instale: `npm install dotenv`
   - Crie `.env` a partir do `.env.example`
   - No topo de `server.js` (antes de carregar o backend): `require('dotenv').config();`

---

## Deploy online (servidor no ar)

O **GitHub Pages** só entrega arquivos estáticos (HTML, CSS, JS). Ele **não** executa Node.js. Por isso:

- **Frontend (site estático)** → pode ficar no GitHub Pages (ou em qualquer hospedagem estática).
- **Backend (API + arquivos)** → precisa rodar em um serviço que execute Node.js.

### Opção 1: Render (recomendado)

1. Crie conta em [render.com](https://render.com).
2. **New → Web Service**.
3. Conecte o repositório do GitHub do projeto.
4. Configuração:
   - **Build command:** (vazio ou `npm install`)
   - **Start command:** `node server.js`
   - **Root directory:** (deixe em branco se o projeto estiver na raiz)
5. Em **Environment** (opcional): `NODE_ENV=production`.  
   A variável `PORT` é definida automaticamente pelo Render.
6. Deploy. A URL será algo como `https://seu-app.onrender.com`.

Se o **frontend** estiver no GitHub Pages em outro repositório, configure no frontend a **URL base da API** (ex.: `https://seu-app.onrender.com`) e faça as chamadas para `/api/...`, `/data/...` nesse domínio.

### Opção 2: Railway

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub.
2. Selecione o repositório.
3. Railway detecta Node e usa `npm start` ou `node server.js`.  
   Confirme no `package.json`: `"start": "node server.js"`.
4. Gere um domínio público no painel. A porta é definida pela variável `PORT` que o Railway injeta.

### Opção 3: Hospedagem própria (VPS)

- Instale Node.js no servidor.
- Envie o projeto (git clone ou upload).
- Rode com `node server.js` ou use **PM2**:  
  `pm2 start server.js --name "projeto-vida"`.
- Use um proxy reverso (Nginx/Apache) para HTTPS e apontar para a porta onde o Node está escutando.

---

## Resumo

- **Backend completo** = `server.js` + pasta `backend/` + `config/data/` + (opcional) `.env`.
- **Local:** `node server.js` (porta 3006 ou `PORT` no ambiente).
- **Online:** coloque o backend em Render, Railway ou VPS; o GitHub Pages pode servir só o frontend e chamar a API na URL do backend.

Se quiser, na próxima etapa podemos definir no frontend uma variável única para a URL da API (local vs produção) e trocar as chamadas `fetch` para usar essa base.
