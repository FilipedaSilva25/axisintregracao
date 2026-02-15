# Blindagem – Bot WhatsApp + Página QR (Packing Machine)

**Commit:** `Blindagem: Packing Machine + Bot WhatsApp AXIS`

## O que está protegido

### Bot WhatsApp
- **backend/whatsapp-connector.js** – Conexão Baileys (QR), sessão em `config/data/whatsapp-auth/`
- **backend/whatsapp-packing-bot.js** – Fluxo do bot: saudação → escolha (1 Troca / 2 Manutenção em breve) → PM → quantidade → técnico → registro
- **backend/whatsapp-cloud-api.js** – Opção Cloud API (24/7 sem QR)
- **backend/routes.js** – Rotas `/api/whatsapp/status`, `/api/whatsapp/logout`; número AXIS e formatação BR
- **backend/config.js** – `AXIS_BOT_NUMBER = 5548991578172` (+55 48 99157-8172)

### Página QR (whatsapp-qr.html)
- Dois QR: **Administrador** (conexão do bot) e **Técnicos** (abrir chat wa.me)
- Por perfil: admin vê só bloco esquerda; técnicos veem só bloco direita
- Layout compacto, texto em maiúsculas, instruções em linhas
- Comparação de número com normalização BR (9 móvel): 5548991578172 = 554891578172

### Packing Machine
- **pages/packing_machine.html** – Dashboard, formulário, histórico, gráficos
- **pages/whatsapp-qr.html** – Página dos QRs
- Link **Escanear QR do bot WhatsApp** visível só para técnicos (não admin) na Packing Machine
- **css/packing_machine.css** – Estilos
- **js/packing_machine.js** – Lógica da página

### Segurança
- **.gitignore** – `config/data/whatsapp-auth/` não é versionado (sessão local do WhatsApp).

## Como recuperar

- Código: `git log -1` para ver o commit; `git show` para o diff.
- Para rodar: `npm start` (porta 3006); QR em `http://localhost:3006/pages/whatsapp-qr.html`.
