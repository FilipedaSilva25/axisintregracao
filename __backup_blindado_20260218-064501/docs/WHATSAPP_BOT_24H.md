# Bot WhatsApp AXIS – 24 horas por dia

O bot de troca de cabeça (Packing Machine) pode funcionar de duas formas.

## Opção 1: WhatsApp Cloud API (Meta) – 24/7 sem QR

**Funciona sem QR, sem pareamento, 24 horas por dia.** Use a página de setup:

**👉 [Configurar na Meta](/pages/whatsapp-meta-setup.html)** – passo a passo completo

### Resumo da configuração

1. **Meta for Developers:** [developers.facebook.com/apps](https://developers.facebook.com/apps) → criar app → adicionar WhatsApp
2. **Webhook:** URL `https://SEU-DOMINIO.com/api/whatsapp/cloud-webhook`, token `axis-packing-bot`, campo `messages`
3. **Variáveis de ambiente** no `.env`:
   ```
   WA_CLOUD_API_ACCESS_TOKEN=seu_token
   WA_PHONE_NUMBER_ID=id_do_numero
   WA_WEBHOOK_VERIFY_TOKEN=axis-packing-bot
   ```
4. O servidor precisa de **HTTPS** e URL pública (Render, Railway, VPS).

---

## Opção 2: Baileys (uso local)

Funciona com pareamento por QR. Depois de escanear uma vez, a sessão persiste e o bot reconecta automaticamente.

1. Inicie o servidor: `npm start`
2. Acesse `/pages/whatsapp-qr.html?admin=1`
3. Escaneie o QR com o celular AXIS (+55 48 99157-8172)
4. Após conectar, o bot responde 24h enquanto o servidor estiver rodando

**Importante:** O número usado no pareamento deve ser exclusivo para o bot (linha da empresa ou chip secundário).
