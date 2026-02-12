# Rooaak WhatsApp Cloud Adapter Starter

Official starter for WhatsApp Cloud API <-> Rooaak message bridging.

## What it does

- Handles Meta webhook verification (`GET /webhooks/whatsapp`).
- Verifies WhatsApp webhook signatures (`X-Hub-Signature-256`).
- Ingests inbound WhatsApp text messages into Rooaak `/v1/agents/:id/messages`.
- Verifies Rooaak webhook signatures on `/webhooks/rooaak`.
- On `message.responded`, fetches response via `GET /v1/messages/:id` and sends outbound WhatsApp text via Graph API.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment template:

```bash
cp .env.example .env
```

3. Generate a verify token (you choose this value):

```bash
openssl rand -hex 24
```

4. Set runtime secrets (example for Fly):

```bash
flyctl secrets set \
  ROOAAK_API_KEY="..." \
  ROOAAK_WEBHOOK_SECRET="..." \
  ROOAAK_AGENT_ID="..." \
  WHATSAPP_VERIFY_TOKEN="..." \
  WHATSAPP_APP_SECRET="..." \
  WHATSAPP_ACCESS_TOKEN="..." \
  -a rooaak-whatsapp-cloud-adapter-starter
```

5. Configure WhatsApp Cloud webhook in Meta dashboard:
- Open [developers.facebook.com/apps](https://developers.facebook.com/apps) and select your app.
- Left nav: `Use cases` (or `Add products`) -> add/select `WhatsApp`.
- Left nav under WhatsApp: `Configuration`.
- In `Webhooks`, click `Edit` or `Manage`.
- Callback URL: `https://<your-host>/webhooks/whatsapp`
- Verify token: exactly the same `WHATSAPP_VERIFY_TOKEN` value from step 3.
- Click `Verify and Save`.
- Subscribe to `messages` field.

6. Meta credential locations:
- `WHATSAPP_APP_SECRET`: `App settings` -> `Basic` -> `App Secret` -> `Show`.
- `WHATSAPP_ACCESS_TOKEN`: WhatsApp product `API Setup` page (use a long-lived/system-user token for production).

7. Register Rooaak webhook (either option):
- API/curl:
  - URL: `https://<your-host>/webhooks/rooaak`
  - Events: `message.responded`
- Console UI:
  - Open `Console > Webhooks` (`/console/webhooks`)
  - Create a webhook with URL `https://<your-host>/webhooks/rooaak`
  - Select event `message.responded`

## Run

```bash
npm run dev
```

## Test

```bash
npm test
```

## Session Mapping

- Rooaak `sessionId`: `whatsapp:<phone_number_id>:<wa_id>`
- Rooaak metadata includes:
- `metadata.correlationId = <whatsapp_message_id>`
- `metadata.channel.type = "whatsapp_cloud"`
- provider identifiers for phone number and WhatsApp user/message

## Deployment

- Docker: `Dockerfile`
- Render: `deploy/render.yaml`
- Any platform that supports long-running Node HTTP servers

See `DEPLOYMENT.md` for production details.

## Production notes

- Replace in-memory dedupe with Redis/Postgres.
- Add retry/backoff queue for outbound Graph API calls.
- Persist provider delivery receipts/status updates if your product needs message state sync.

## License and support

- License: MIT (`LICENSE`)
- Support policy: `SUPPORT.md`
