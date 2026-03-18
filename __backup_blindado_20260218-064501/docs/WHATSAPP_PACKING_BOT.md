# 🤖 Chatbot WhatsApp - Troca de Cabeça de Impressão (Packing Machine)

O sistema AXIS permite registrar trocas de cabeça de impressão **via WhatsApp**. O técnico conversa com o bot, informa os dados, e o registro aparece automaticamente na página Packing Machine.

---

## Fluxo conversacional do bot

O bot deve perguntar, **nesta ordem**:

1. **Número da PM**  
   - "Qual o número da PM? (1 a 6)"  
   - Aceita: `1`, `2`, `3`, `4`, `5`, `6` ou `PM 1`, `PM 2`, etc.

2. **Quantidade de impressões**  
   - "Quantidade de impressões?"  
   - Aceita: número (ex: 70303)

3. **Nome do técnico**  
   - "Nome do técnico responsável?"  
   - Aceita: texto livre

4. **Confirmação**  
   - "✅ Registrado! PM X | Y impressões | Nome do Técnico"

---

## API para registro

Quando o usuário terminar de informar os dados, o bot deve enviar um **POST** para:

```
POST /api/whatsapp/packing-registro
Content-Type: application/json
```

**Corpo da requisição:**
```json
{
  "numeroPm": "PM 1",
  "quantidadeImpressoes": 70303,
  "tecnico": "João Silva",
  "phone": "5548999999999",
  "dataHora": "2026-02-14T15:30:00.000Z"
}
```

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| numeroPm | Sim | `"PM 1"` a `"PM 6"` ou `1` a `6` |
| quantidadeImpressoes | Sim | Número de impressões |
| tecnico | Sim | Nome do técnico |
| phone | Não | Telefone de quem enviou (somente dígitos) |
| dataHora | Não | ISO string; padrão: agora |

**Resposta de sucesso (200):**
```json
{
  "ok": true,
  "message": "Troca registrada via WhatsApp",
  "troca": { "id": "pm_wa_...", "numeroPm": "PM 1", ... }
}
```

---

## Webhook para fluxo conversacional

O backend expõe um webhook que processa as mensagens e mantém o fluxo:

```
POST /api/whatsapp/packing-webhook
Content-Type: application/json
```

**Corpo (formato simples):**
```json
{
  "from": "5548999999999",
  "body": "troca"
}
```

**Corpo (formato Evolution API):**
```json
{
  "data": {
    "key": { "remoteJid": "5548999999999@s.whatsapp.net" },
    "message": { "conversation": "troca" }
  }
}
```

**Resposta:**
```json
{
  "ok": true,
  "reply": "Qual o número da PM? (1 a 6)...",
  "from": "5548999999999"
}
```

O sistema espera que você envie cada nova mensagem do usuário para esse webhook e use o campo `reply` para responder no WhatsApp (via Evolution API ou outro).

---

## Integração com Evolution API

1. Instale e configure o [Evolution API](https://github.com/EvolutionAPI/evolution-api).
2. Conecte uma instância ao WhatsApp.
3. Configure um webhook/chatbot que:
   - Detecte mensagens como "troca", "registrar", "registro" etc.
   - Siga o fluxo (PM → Qtd → Técnico).
   - Ao final, chame `POST /api/whatsapp/packing-registro` com os dados coletados.
   - Envie a confirmação para o usuário.

4. A página **Packing Machine** buscará os registros na API ao carregar e ao voltar ao site, exibindo as trocas feitas pelo WhatsApp.

---

## Integração com n8n / Make / Zapier

- Crie um fluxo que receba mensagens do WhatsApp (via Evolution API ou outro conector).
- Use nós de "Switch" ou "IF" para o fluxo (perguntas e respostas).
- No fim, use o nó **HTTP Request** para fazer `POST` em:
  ```
  https://SEU-DOMINIO/api/whatsapp/packing-registro
  ```
  com o corpo em JSON conforme acima.

---

## Teste manual

Para testar sem bot, use `curl`:

```bash
curl -X POST http://localhost:3006/api/whatsapp/packing-registro \
  -H "Content-Type: application/json" \
  -d '{"numeroPm":"PM 2","quantidadeImpressoes":50000,"tecnico":"Maria Santos"}'
```

Em seguida, abra a página Packing Machine – a troca deve aparecer no histórico.
