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

3. Configure WhatsApp Cloud webhook URL:
- Verification URL: `https://<your-host>/webhooks/whatsapp`
- Verify token: `WHATSAPP_VERIFY_TOKEN`

4. Register Rooaak webhook:
- URL: `https://<your-host>/webhooks/rooaak`
- Events: `message.responded`

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
