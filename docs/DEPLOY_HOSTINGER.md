# Deploy AXIS na Hostinger (até produção)

O AXIS é uma **aplicação Node.js** (`server.js`): API + ficheiros estáticos + dados em `config/data/`.  
Na Hostinger precisas de um plano que **execute Node de forma contínua** — em geral **VPS** (KVM) ou **Cloud** com acesso SSH. Alojamento partilhado “só PHP” **não** serve para este projeto.

---

## O que fazer tu (checklist até quinta-feira)

### 1. Contratar e preparar o servidor

- [ ] VPS ou cloud com **Ubuntu 22.04/24.04** (ou Debian), **mínimo ~2 GB RAM** (Baileys/WhatsApp e vários módulos pesam um pouco).
- [ ] Apontar o **domínio** para o IP do VPS (registos A / AAAA no hPanel).
- [ ] No painel da Hostinger: firewall a permitir **22** (SSH), **80** e **443** (HTTP/HTTPS).

### 2. No servidor (SSH)

Substitui `seu-dominio.com` pelo teu domínio real.

```bash
# Node.js 20 LTS (exemplo com NodeSource — confirma a doc atual)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git

# Clonar ou enviar o projeto (Git é o ideal)
cd /var/www
sudo git clone https://github.com/SEU_USUARIO/SEU_REPO.git axis
cd axis
sudo chown -R $USER:$USER .

npm ci --omit=dev   # ou: npm install --omit=dev
```

### 3. Variáveis de ambiente

```bash
cp .env.example .env
nano .env
```

- `NODE_ENV=production`
- `PORT=3006` (ou outra porta interna; o Nginx encaminha para ela)
- Se usares **WhatsApp Cloud API**: preenche `WA_*` conforme `.env.example`
- Opcional: `PUBLIC_URL=https://seu-dominio.com` (útil para lembrar a URL do webhook nas notas)

**Não commits** o `.env` para o Git.

### 4. Manter o Node a correr (PM2)

Na pasta do projeto:

```bash
sudo npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # segue as instruções que o comando imprimir
```

### 5. HTTPS com Nginx (recomendado)

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Cria um site em `/etc/nginx/sites-available/axis` que faça **proxy_pass** para `http://127.0.0.1:3006` (ou o `PORT` que definiste).

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    location / {
        proxy_pass http://127.0.0.1:3006;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/axis /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

### 6. Verificar

- Abre `https://seu-dominio.com/health` — deve responder JSON com `ok: true`.
- Login, inventário, packing, perfil: testar no browser.
- **Dados:** a pasta `config/data/` no servidor é a “base de dados” em ficheiros; faz **backup** regular (cópia da pasta ou do VPS).

---

## WhatsApp em produção (importante)

| Modo | Produção |
|------|----------|
| **QR (Baileys)** | Funciona no VPS, mas a sessão fica em ficheiros no disco. Se apagares dados ou mudares de máquina, **volta a escanear o QR** em `https://seu-dominio.com/pages/whatsapp-qr.html`. |
| **Cloud API (Meta)** | Melhor para **24/7** estável: webhook HTTPS público (`/api/whatsapp/cloud-webhook`), variáveis `WA_*` no `.env`. |

---

## Problemas frequentes

- **502 Bad Gateway** — Node não está a correr (`pm2 status`) ou `proxy_pass` com porta errada.
- **Site em branco / 404 em rotas** — O AXIS serve o SPA pelo Node; o proxy deve enviar **todo** o tráfego para o Node, não só `/api`.
- **CORS** — Com o mesmo domínio para site e API, não precisas de alterar CORS no código.

---

## Documentação relacionada

- Visão geral de deploy: [BACKEND_DEPLOY.md](./BACKEND_DEPLOY.md)
- Roteiro para vídeo de apresentação: [APRESENTACAO_VIDEO_ROTEIRO.md](./APRESENTACAO_VIDEO_ROTEIRO.md)
