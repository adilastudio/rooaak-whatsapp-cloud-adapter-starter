import "dotenv/config";
import express from "express";
import { RooaakClient, verifyWebhookSignature } from "rooaak";
import { TimeboxedSet, bufferToString, loadEnv } from "./lib/shared.mjs";
import { collectWhatsAppMessages, verifyMetaSignature } from "./lib/whatsapp.mjs";

const env = loadEnv([
  "ROOAAK_API_KEY",
  "ROOAAK_WEBHOOK_SECRET",
  "ROOAAK_AGENT_ID",
  "WHATSAPP_VERIFY_TOKEN",
  "WHATSAPP_ACCESS_TOKEN",
]);

const port = Number(process.env.PORT || "8788");
const rooaak = new RooaakClient({
  apiKey: env.ROOAAK_API_KEY,
  baseUrl: process.env.ROOAAK_BASE_URL || "https://www.rooaak.com",
});

const app = express();
const seenWhatsAppMessages = new TimeboxedSet(10 * 60 * 1000);
const seenRooaakDeliveries = new TimeboxedSet(10 * 60 * 1000);

app.get("/healthz", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get("/webhooks/whatsapp", (req, res) => {
  const mode = String(req.query["hub.mode"] || "");
  const token = String(req.query["hub.verify_token"] || "");
  const challenge = String(req.query["hub.challenge"] || "");

  if (mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN) {
    res.status(200).send(challenge);
    return;
  }

  res.status(403).send("forbidden");
});

app.post("/webhooks/whatsapp", express.raw({ type: "application/json" }), async (req, res) => {
  const rawBody = bufferToString(req.body);

  // WHATSAPP_APP_SECRET is optional for local testing, but recommended for production.
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (appSecret && !verifyMetaSignature(req.headers, rawBody, appSecret)) {
    res.status(401).json({ error: "invalid whatsapp signature" });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    res.status(400).json({ error: "invalid json" });
    return;
  }

  res.status(200).json({ received: true });

  const messages = collectWhatsAppMessages(payload);
  for (const message of messages) {
    if (!message.text) {
      continue;
    }
    if (seenWhatsAppMessages.has(message.messageId)) {
      continue;
    }
    seenWhatsAppMessages.add(message.messageId);

    const sessionId = `whatsapp:${message.phoneNumberId}:${message.from}`;

    try {
      const sendResult = await rooaak.messages.send(
        {
          agentId: env.ROOAAK_AGENT_ID,
          sessionId,
          message: message.text,
          metadata: {
            correlationId: message.messageId,
            channel: {
              type: "whatsapp_cloud",
              externalChannelId: message.phoneNumberId,
              externalUserId: message.from,
              externalMessageId: message.messageId,
            },
          },
        },
        `wa-${message.messageId}`,
      );

      // Fast-path when Rooaak responds synchronously.
      if (sendResult.status === "responded" && sendResult.response) {
        await postWhatsAppText({
          phoneNumberId: message.phoneNumberId,
          to: message.from,
          text: sendResult.response,
          accessToken: env.WHATSAPP_ACCESS_TOKEN,
        });
      }
    } catch (error) {
      console.error("[whatsapp-starter] inbound handling failed", {
        messageId: message.messageId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
});

app.post("/webhooks/rooaak", express.raw({ type: "application/json" }), async (req, res) => {
  const rawBody = bufferToString(req.body);
  const signature = String(req.header("x-rooaak-signature") || "");
  const deliveryId = String(req.header("x-rooaak-delivery") || "");

  const valid = await verifyWebhookSignature(rawBody, signature, env.ROOAAK_WEBHOOK_SECRET);
  if (!valid) {
    res.status(401).json({ error: "invalid rooaak signature" });
    return;
  }

  if (deliveryId && seenRooaakDeliveries.has(deliveryId)) {
    res.status(200).json({ ok: true, duplicate: true });
    return;
  }
  if (deliveryId) {
    seenRooaakDeliveries.add(deliveryId);
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    res.status(400).json({ error: "invalid json" });
    return;
  }

  if (event.type !== "message.responded") {
    res.status(200).json({ ok: true, ignored: true });
    return;
  }

  const messageId = String(event?.data?.messageId || "");
  if (!messageId) {
    res.status(200).json({ ok: true, ignored: "missing messageId" });
    return;
  }

  try {
    const message = await rooaak.messages.get(messageId);
    if (!message.response) {
      res.status(200).json({ ok: true, ignored: "missing response" });
      return;
    }

    const channel = event?.data?.channel || event?.data?.metadata?.channel || {};
    const phoneNumberId = String(channel.externalChannelId || "");
    const to = String(channel.externalUserId || "");

    if (!phoneNumberId || !to) {
      res.status(200).json({ ok: true, ignored: "missing whatsapp mapping" });
      return;
    }

    await postWhatsAppText({
      phoneNumberId,
      to,
      text: message.response,
      accessToken: env.WHATSAPP_ACCESS_TOKEN,
    });

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[whatsapp-starter] rooaak webhook handling failed", {
      messageId,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: "failed to deliver whatsapp response" });
  }
});

app.listen(port, () => {
  console.log(`[whatsapp-starter] listening on :${port}`);
});

async function postWhatsAppText({ phoneNumberId, to, text, accessToken }) {
  const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok || body?.error) {
    const errorMessage = body?.error?.message || `HTTP ${response.status}`;
    throw new Error(`WhatsApp Graph API error: ${errorMessage}`);
  }
}
