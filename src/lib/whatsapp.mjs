import crypto from "node:crypto";

export function verifyMetaSignature(headers, rawBody, appSecret) {
  const received = String(headers["x-hub-signature-256"] || "");
  if (!received.startsWith("sha256=")) {
    return false;
  }
  const expected = `sha256=${crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function collectWhatsAppMessages(payload) {
  const entries = Array.isArray(payload?.entry) ? payload.entry : [];
  const output = [];

  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];
    for (const change of changes) {
      const value = change?.value || {};
      const metadata = value?.metadata || {};
      const phoneNumberId = String(metadata.phone_number_id || "");
      const messages = Array.isArray(value?.messages) ? value.messages : [];

      for (const msg of messages) {
        const messageId = String(msg?.id || "");
        const from = String(msg?.from || "");
        const text = typeof msg?.text?.body === "string" ? msg.text.body.trim() : "";
        if (!messageId || !from || !phoneNumberId) {
          continue;
        }
        output.push({ messageId, from, phoneNumberId, text });
      }
    }
  }

  return output;
}
