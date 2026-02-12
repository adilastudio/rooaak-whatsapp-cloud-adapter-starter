# Release Checklist

## Pre-release validation

- [ ] `npm install`
- [ ] `npm test` passes
- [ ] `node --check src/server.mjs` passes
- [ ] `.env.example` matches runtime-required env vars
- [ ] README setup steps are accurate end-to-end

## Security checks

- [ ] Meta webhook signature validation enabled (`WHATSAPP_APP_SECRET`)
- [ ] Rooaak webhook signature validation enabled
- [ ] No secrets/tokens logged
- [ ] Replay/idempotency guard for inbound events verified

## Deployment checks

- [ ] Health endpoint responds (`/healthz`)
- [ ] Webhook routes reachable via HTTPS
- [ ] Meta webhook verification callback configured
- [ ] Rooaak webhook registered for `message.responded`

## Release ops

- [ ] Tag release (for example `v0.1.0`)
- [ ] Publish changelog entry
- [ ] Smoke test with real WhatsApp Cloud sandbox
