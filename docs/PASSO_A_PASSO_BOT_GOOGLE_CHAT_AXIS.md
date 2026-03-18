# Passo a passo: Bot AXIS no Google Chat

Este guia explica como criar e configurar o bot do AXIS no Google Chat, para oferecer as mesmas opções que o bot do WhatsApp (Troca de Cabeça, Manutenção Preventiva, Status de Bancada).

---

## Pré-requisitos

- Conta **Google** (pessoal ou Google Workspace).
- Para usar o bot numa **organização** (ex.: Mercado Livre), é preciso que um administrador do Google Workspace autorize ou instale o app.
- O servidor AXIS precisa estar acessível por uma **URL HTTPS pública** (para o Google enviar os eventos). Em desenvolvimento pode usar **ngrok** ou similar.

---

## Parte 1: Google Cloud – Projeto e API

### 1.1 Criar projeto no Google Cloud

1. Aceda a: **[Google Cloud Console](https://console.cloud.google.com/)**
2. No topo, clique no seletor de projeto → **Novo projeto**.
3. Nome do projeto: por exemplo **AXIS Chat Bot**.
4. Clique em **Criar** e aguarde. Anote o **ID do projeto** (ex.: `axis-chat-bot-123456`).

### 1.2 Ativar a Google Chat API

1. No menu lateral: **APIs e serviços** → **Biblioteca** (ou abra: [API Library – Workspace](https://console.cloud.google.com/apis/library/browse?filter=category:gsuite)).
2. Pesquise por **Google Chat API**.
3. Clique em **Google Chat API** → **Ativar**.

### 1.3 Configurar a tela de consentimento OAuth (mínimo)

1. Menu: **APIs e serviços** → **Tela de consentimento OAuth**.
2. Se for a primeira vez, escolha **Externo** (ou **Interno** se for só para o seu Workspace) → **Criar**.
3. Preencha apenas o obrigatório:
   - **Nome do app**: AXIS
   - **E-mail de suporte do usuário**: o seu e-mail
   - **E-mail do desenvolvedor**: o seu e-mail
4. Clique em **Guardar e continuar** até concluir (pode avançar sem preencher campos opcionais).

---

## Parte 2: Configurar o app no Google Chat

### 2.1 Abrir a página de configuração do Chat

1. Abra diretamente a página de configuração do Chat API (substitua `SEU_PROJECT_ID` pelo ID do seu projeto):
   - **URL:** `https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat?project=SEU_PROJECT_ID`
2. Ou: Menu → **APIs e serviços** → **Ativar APIs e serviços** → pesquise **Google Chat API** → clique → no painel, clique em **Configurar** / **Configuration** (ou link para Hangouts Chat).

### 2.2 Informações do app (Application info)

Preencha:

| Campo          | Exemplo / valor |
|----------------|------------------|
| **App name**   | `AXIS` (até 25 caracteres alfanuméricos) |
| **Avatar URL** | Uma imagem quadrada em HTTPS (PNG ou JPEG, recomendado 256x256 px). Pode usar um logo do AXIS hospedado num site ou no seu servidor. Ex.: `https://seudominio.com/axis-logo.png` |
| **Description**| `Bot AXIS: Troca de Cabeça, Status de Bancada e mais.` (até 40 caracteres) |

### 2.3 Funcionalidades interativas (Interactive features)

1. Ative **Enable interactive features** (ou equivalente).
2. Em **Connection settings** (Configurações de conexão):
   - **Tipo de endpoint:** **HTTP endpoint URL**.
   - **URL:** a URL **HTTPS pública** onde o seu servidor recebe os eventos do Chat.
     - Em **produção**: ex. `https://axis.seudominio.com/google-chat/webhook` (rota que vamos criar no AXIS).
     - Em **teste local**: use **ngrok** (ver secção 3) e coloque aqui a URL do ngrok, ex.: `https://abc123.ngrok.io/google-chat/webhook`.
3. **Authentication audience** (recomendado para endpoint próprio):
   - Selecione **HTTP endpoint URL** e use **exatamente** a mesma URL que colocou acima (ex.: `https://abc123.ngrok.io/google-chat/webhook`).
4. **Join spaces and group conversations**: marque para permitir que o bot seja adicionado a salas e conversas em grupo.

### 2.4 Visibilidade (para teste)

Em **Visibility** (Visibilidade):

- Para testes: adicione o seu e-mail ou um **Google Group** com as pessoas que podem ver e instalar o app.
- Assim só essas pessoas conseguem encontrar e usar o bot no Chat.

### 2.5 Guardar

Clique em **Save** (Guardar). O app fica disponível para os utilizadores que definiu na visibilidade.

---

## Parte 3: URL pública em desenvolvimento (ngrok)

O Google Chat envia eventos por **POST** para uma URL **HTTPS**. Em localhost isso não funciona; use um túnel.

### 3.1 Usar ngrok

1. Registe-se em [ngrok](https://ngrok.com/) e instale o ngrok.
2. Inicie o servidor AXIS em localhost (ex.: porta 3006).
3. Noutro terminal:
   ```bash
   ngrok http 3006
   ```
4. O ngrok mostra uma URL HTTPS (ex.: `https://abc123.ngrok-free.app`).
5. No Google Cloud, em **Connection settings**, use:
   - **URL:** `https://abc123.ngrok-free.app/google-chat/webhook`
   - **Authentication audience:** a mesma URL.
6. Sempre que reiniciar o ngrok, a URL pode mudar; terá de atualizar essa URL na configuração do Chat.

### 3.2 Produção

Em produção, use o domínio e o servidor onde o AXIS está hospedado (ex.: `https://axis.empresa.com/google-chat/webhook`), com SSL válido.

---

## Parte 4: O que falta no projeto AXIS (resumo técnico)

Para o bot responder no Google Chat, o backend do AXIS precisa de:

1. **Rota HTTP POST** (ex.: `/google-chat/webhook`) que:
   - Recebe o JSON do evento (campo `type`: `MESSAGE`, `ADDED_TO_SPACE`, etc.).
   - Para `type === 'MESSAGE'`, lê o texto da mensagem.
   - Reutiliza a mesma lógica do bot WhatsApp (`whatsapp-packing-bot.js`: menu, setor, bancada, equipamento, troca de cabeça, etc.) para decidir a resposta.
   - Responde com um objeto no formato esperado pelo Chat API (ex.: `{ "text": "..." }`).
2. **Verificação do token** (recomendado): validar o header `Authorization: Bearer <token>` com o audience igual à URL do endpoint, para garantir que o pedido veio do Google Chat.
3. **Resposta em até ~30 segundos** para a resposta aparecer na mesma conversa (resposta síncrona).

Quando quiser, podemos implementar esta rota e a integração com a lógica existente do bot no seu repositório.

---

## Parte 5: Usar o bot no Google Chat

1. Abra [Google Chat](https://chat.google.com/) (com a conta que colocou em **Visibility**).
2. Nova conversa → **Encontrar apps** / **Find apps**.
3. Procure por **AXIS** (nome do app).
4. Inicie uma conversa com o app ou adicione-o a uma sala.
5. Envie mensagens como **oi**, **menu**, **1**, **2**, **3** (Status de Bancada), etc., conforme o fluxo do bot.

---

## Links úteis

- [Configurar a Google Chat API](https://developers.google.com/workspace/chat/configure-chat-api)
- [Receber e responder a eventos (interações)](https://developers.google.com/workspace/chat/receive-respond-interactions)
- [Ativar APIs no projeto](https://developers.google.com/workspace/guides/enable-apis)
- [Verificar pedidos do Google Chat (token)](https://developers.google.com/workspace/chat/verify-requests-from-chat)
- [Referência da API – Eventos](https://developers.google.com/workspace/chat/api/reference/rest/v1/Event)

---

## Resumo rápido

| Passo | Onde | O quê |
|-------|------|--------|
| 1 | Google Cloud | Criar projeto, ativar Chat API, configurar OAuth (mínimo) |
| 2 | Chat API → Configuration | Nome AXIS, avatar, descrição, URL HTTPS do webhook, audience, visibilidade |
| 3 | Servidor + ngrok | Expor servidor por HTTPS (ngrok em dev) e colocar essa URL no passo 2 |
| 4 | Backend AXIS | Rota POST que recebe eventos e responde com a lógica do bot (a implementar) |
| 5 | Google Chat | Encontrar o app AXIS e testar |

Quando a rota `/google-chat/webhook` e a lógica estiverem implementadas no AXIS, o bot passará a responder no Google Chat da mesma forma que no WhatsApp (menu, setor, bancada, equipamento, troca de cabeça, etc.).
