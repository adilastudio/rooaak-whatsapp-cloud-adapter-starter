# Deployment Guide

## Required env vars

- `ROOAAK_API_KEY`
- `ROOAAK_WEBHOOK_SECRET`
- `ROOAAK_AGENT_ID`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_ACCESS_TOKEN`
- Optional: `WHATSAPP_APP_SECRET`, `ROOAAK_BASE_URL`, `PORT`

## Webhook URLs

- WhatsApp verification and inbound: `GET/POST /webhooks/whatsapp`
- Rooaak inbound: `POST /webhooks/rooaak`
- Health: `GET /healthz`

## Meta Dashboard Setup

1. Open [developers.facebook.com/apps](https://developers.facebook.com/apps) and select your app.
2. Left nav: `Use cases` or `Add products` -> add/select `WhatsApp`.
3. Go to `WhatsApp` -> `Configuration` -> `Webhooks` (`Edit`/`Manage`).
4. Configure:
- Callback URL: `https://<your-host>/webhooks/whatsapp`
- Verify token: same value as your `WHATSAPP_VERIFY_TOKEN` env var
5. Click `Verify and Save` and subscribe to `messages`.

## Token And Secret Sources

- `WHATSAPP_VERIFY_TOKEN`: generate yourself (example: `openssl rand -hex 24`), then set the same value in Meta + env.
- `WHATSAPP_APP_SECRET`: Meta app `App settings` -> `Basic` -> `App Secret`.
- `WHATSAPP_ACCESS_TOKEN`: WhatsApp `API Setup` page. Use a long-lived/system-user token in production.

## Render

Use `deploy/render.yaml` and set env vars in dashboard or IaC secret management.

## Docker

```bash
docker build -t rooaak-whatsapp-cloud-adapter-starter .
docker run --rm -p 8788:8788 --env-file .env rooaak-whatsapp-cloud-adapter-starter
```

## Security checklist

- Enforce HTTPS at edge.
- Enable `WHATSAPP_APP_SECRET` in production for request signature verification.
- Do not log raw provider tokens or webhook secrets.
- Keep replay protection and move dedupe store to Redis/Postgres.
