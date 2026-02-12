import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { collectWhatsAppMessages, verifyMetaSignature } from "./whatsapp.mjs";

test("verifyMetaSignature validates signature", () => {
  const rawBody = JSON.stringify({ object: "whatsapp_business_account" });
  const appSecret = "test-secret";
  const sig = `sha256=${crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;

  const valid = verifyMetaSignature(
    {
      "x-hub-signature-256": sig,
    },
    rawBody,
    appSecret,
  );

  assert.equal(valid, true);
});

test("verifyMetaSignature rejects bad signature", () => {
  const valid = verifyMetaSignature(
    {
      "x-hub-signature-256": "sha256=deadbeef",
    },
    "{\"hello\":true}",
    "secret",
  );
  assert.equal(valid, false);
});

test("collectWhatsAppMessages extracts text messages with metadata mapping", () => {
  const messages = collectWhatsAppMessages({
    entry: [
      {
        changes: [
          {
            value: {
              metadata: { phone_number_id: "phone-1" },
              messages: [
                {
                  id: "wamid.1",
                  from: "15551230000",
                  text: { body: " hello " },
                },
                {
                  id: "wamid.2",
                  from: "15551230000",
                },
              ],
            },
          },
        ],
      },
    ],
  });

  assert.deepEqual(messages, [
    {
      messageId: "wamid.1",
      from: "15551230000",
      phoneNumberId: "phone-1",
      text: "hello",
    },
    {
      messageId: "wamid.2",
      from: "15551230000",
      phoneNumberId: "phone-1",
      text: "",
    },
  ]);
});
