# 🤖 Bot WhatsApp - Como Usar (Hoje!)

O bot já está integrado ao seu AXIS. Siga estes passos:

---

## 1. Instalar dependências (se ainda não fez)

```bash
npm install
```

---

## 2. Subir o servidor

```bash
npm start
```

ou

```bash
node server.js
```

---

## 3. Conectar o WhatsApp

1. **Abra no navegador:** `http://SEU-SITE.com/whatsapp-connect`
   - Se estiver local: `http://localhost:3006/whatsapp-connect`

2. **Escaneie o QR Code** com o WhatsApp no celular:
   - Abra o WhatsApp
   - Menu (⋮) → **Aparelhos conectados** → **Conectar um aparelho**
   - Aponte a câmera para o QR da tela

3. Quando aparecer **"✅ Conectado!"**, está pronto.

---

## 4. Usar o bot

1. Envie uma mensagem para o número conectado (o mesmo do QR) com: **troca**

2. O bot perguntará:
   - Qual o número da PM? (1 a 6)
   - Quantidade de impressões?
   - Nome do técnico responsável?

3. Responda em sequência. Ao final, o bot confirma e **o registro aparece automaticamente na página Packing Machine**.

---

## 5. Se o site está online (Render, VPS, etc.)

- Acesse `https://seu-dominio.com/whatsapp-connect`
- Escaneie o QR com o celular
- A sessão fica salva – não precisa escanear de novo toda vez (a menos que desconecte ou troque de celular)

---

## Resumo rápido

| Passo | O que fazer |
|-------|-------------|
| 1 | `npm install` |
| 2 | `npm start` |
| 3 | Abrir `/whatsapp-connect` e escanear QR |
| 4 | Enviar **troca** no WhatsApp e responder as 3 perguntas |
| 5 | Ver o registro na página Packing Machine |
