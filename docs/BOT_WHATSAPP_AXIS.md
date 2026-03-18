# AXIS BOT WhatsApp – Integração com colaboradores

O AXIS BOT permite que os colaboradores usem o WhatsApp para:
- **Troca de Cabeça de Impressão** (Packing Machine) – registrar PM 1 a 6, quantidade de impressões e técnico
- **Status de Bancada** – atualizar status (Disponível / Impressora / Notebook) por setor e bancada
- **Manutenção Preventiva** – em desenvolvimento

Há **duas formas** de o bot funcionar: por **QR Code** (rápido, sem custo) ou por **WhatsApp Cloud API** (24/7, requer conta Meta).

---

## Opção 1: Bot por QR Code (recomendado para começar)

Não precisa de API keys. O bot usa uma sessão ligada a um número de WhatsApp (recomendado: chip/linha da empresa).

### Passos

1. **Iniciar o servidor**
   - Execute `start.bat` ou `npm start` (porta 3006).

2. **Abrir a página do QR**
   - No navegador: **http://localhost:3006/pages/whatsapp-qr.html**  
   - Ou pelo menu AXIS: link para “QR Code WhatsApp” / “Conectar bot”.

3. **Conectar o número do bot**
   - No telemóvel que será o bot: WhatsApp → **Menu (⋮)** → **Aparelhos conectados** → **Conectar um aparelho**.
   - Escaneie o **QR Code** que aparece na página (secção “Administrador”).
   - Quando aparecer “Bot conectado”, o bot está ativo.

4. **Colaboradores**
   - Colaboradores escaneiam o **segundo QR** (secção “Técnicos”) para abrir o chat com o bot.
   - Ou enviam mensagem para o número conectado.
   - No chat, enviam **oi** ou **menu** e seguem as opções (1 – Troca, 2 – Manutenção, 3 – Status de Bancada).

### Manutenção

- Se o bot desconectar, abra de novo **whatsapp-qr.html** e escaneie o novo QR com o mesmo número.
- Para usar **outro número** como bot: na página, use **“Desconectar bot”** e depois escaneie o novo QR com o novo número.

---

## Opção 2: Bot 24/7 com WhatsApp Cloud API

Funciona sem QR e sem ter o telemóvel ligado. Requer uma **App** na Meta (Facebook Developers) e um número de telefone aprovado para WhatsApp Business API.

### Requisitos

- Conta em [developers.facebook.com](https://developers.facebook.com)
- App com produto **WhatsApp** configurado
- Número de telefone para negócios (pode ser o mesmo que usa no dia a dia, conforme políticas da Meta)
- Servidor com URL pública (ex.: Render, Railway, seu próprio servidor) para receber o **webhook**

### Configuração na Meta

1. Em **WhatsApp** → **Configuração** (Configuration):
   - **URL de callback (webhook):** `https://SEU_DOMINIO/api/whatsapp/cloud-webhook`
   - **Token de verificação:** escolha um segredo (ex.: `axis-packing-bot`) e guarde para o `.env`

2. Em **WhatsApp** → **Números de telefone**, associe o número e copie o **ID do número** (Phone Number ID).

3. Em **Configurações** → **Básico** da App, crie um **Token de utilizador** com permissão **whatsapp_business_messaging** e copie o token.

### Variáveis de ambiente (.env)

Crie ou edite o ficheiro `.env` na raiz do projeto (pode copiar de `.env.example`):

```env
WA_CLOUD_API_ACCESS_TOKEN=seu_token_permanente
WA_PHONE_NUMBER_ID=id_do_numero_copiado_na_meta
WA_WEBHOOK_VERIFY_TOKEN=axis-packing-bot
WA_CLOUD_API_VERSION=v21.0
```

Reinicie o servidor. Se estas variáveis estiverem definidas, o AXIS usa a **Cloud API** em vez do QR; a página whatsapp-qr.html mostrará “Bot conectado” (Cloud API).

### Webhook

- **GET** `.../api/whatsapp/cloud-webhook?hub.mode=subscribe&hub.verify_token=...`  
  - Resposta: o servidor devolve `hub.challenge` para a Meta validar o URL.

- **POST** `.../api/whatsapp/cloud-webhook`  
  - O servidor recebe as mensagens, processa com o mesmo fluxo do packing-bot (Troca, Status de Bancada) e responde via API.

---

## Resumo para colaboradores

1. Abrir chat com o número do AXIS BOT (o que foi conectado por QR ou o número da Cloud API).
2. Enviar **oi** ou **menu**.
3. Escolher:
   - **1** – Troca de Cabeça (PM 1–6, impressões, nome do técnico)
   - **2** – Manutenção Preventiva (em breve)
   - **3** – Status de Bancada (setor → bancada → Disponível/Impressora/Notebook)

Os dados são guardados no AXIS (packing-trocas, status de bancadas) e ficam disponíveis nas páginas Packing Machine e Status de Bancada.

---

## Resolução de problemas

- **“Servidor offline”** na página do QR  
  - Inicie o servidor (`start.bat` ou `npm start`) e recarregue a página.

- **Bot não responde**  
  - Se for QR: confirme que o QR foi escaneado e que aparece “Bot conectado”. Se desconectou, escaneie de novo.
  - Se for Cloud API: confirme que o webhook está correto na Meta e que o `.env` tem o token e o Phone Number ID certos.

- **Número errado**  
  - Na página do QR, se aparecer “Número errado”, use “Desconectar bot” e escaneie com o número correto (ex.: celular AXIS).

- **Dependências**  
  - Se ao iniciar aparecer erro de módulo (Baileys, etc.): na pasta do projeto execute `npm install` e reinicie o servidor.
