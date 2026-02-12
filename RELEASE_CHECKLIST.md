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
- [x] Webhook routes reachable via HTTPS
- [ ] Meta webhook verification callback configured
- [x] Rooaak webhook registered for `message.responded`

## Release ops

- [x] Tag release (`v0.1.0`)
- [x] Publish changelog entry
- [ ] Smoke test with real WhatsApp Cloud sandbox

## Verification notes (2026-02-12)

- Local checks passed: install, tests, syntax, and `/healthz`.
- Deployed webhook routes are live over HTTPS and return expected auth behavior (`/webhooks/whatsapp` verify endpoint rejects wrong token, `/webhooks/rooaak` rejects unsigned payloads).
- Rooaak webhook is registered for `message.responded` at `https://rooaak-whatsapp-cloud-adapter-starter.fly.dev/webhooks/rooaak` (id: `c9f3c2d9-a085-449f-a6b1-3d2ead073a04`).
- Remaining unchecked items require Meta app callback configuration + live WhatsApp sandbox smoke test.
