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
