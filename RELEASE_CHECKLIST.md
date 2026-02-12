# Release Checklist

## Pre-release validation

- [x] `npm install`
- [x] `npm test` passes
- [x] `node --check src/server.mjs` passes
- [x] `.env.example` matches runtime-required env vars
- [x] README setup steps are accurate end-to-end

## Security checks

- [x] Meta webhook signature validation enabled (`WHATSAPP_APP_SECRET`)
- [x] Rooaak webhook signature validation enabled
- [x] No secrets/tokens logged
- [x] Replay/idempotency guard for inbound events verified

## Deployment checks

- [x] Health endpoint responds (`/healthz`)
- [ ] Webhook routes reachable via HTTPS
- [ ] Meta webhook verification callback configured
- [ ] Rooaak webhook registered for `message.responded`

## Release ops

- [x] Tag release (`v0.1.0`)
- [x] Publish changelog entry
- [ ] Smoke test with real WhatsApp Cloud sandbox

## Verification notes (2026-02-12)

- Local checks passed: install, tests, syntax, and `/healthz`.
- Remaining unchecked items require deployed infrastructure and live Meta/Rooaak credentials.
