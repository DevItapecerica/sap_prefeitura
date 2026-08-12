import assert from "node:assert/strict";
import test from "node:test";
import { ProtocolNotificationRow, ProtocolNotificationWorker } from "../protocol-notification.worker.js";

type TestNotificationRow = ProtocolNotificationRow & { status?: string; lastError?: string; nextAttemptAt?: Date; updates: Array<Record<string, unknown>> };
const row = (): TestNotificationRow => ({ id: 1, attempts: 0, encryptedRecipient: "encrypted", subject: "Assunto", payload: { text: "Mensagem" }, updates: [], async update(value) { this.updates.push(value); Object.assign(this, value); } });

test("worker processa notificacao reivindicada", async () => {
  const item = row(); const sent: string[][] = []; const model = { findAll: async () => [item], update: async (): Promise<[number]> => [1] };
  const worker = new ProtocolNotificationWorker({ sendNotification: async (...args: string[]) => { sent.push(args); } }, { decrypt: async () => "cidadao@example.gov.br" }, model);
  assert.equal(await worker.runBatch(), 1); assert.equal(sent.length, 1); assert.equal(item.status, "PROCESSED");
});

test("worker registra falha e agenda retentativa", async () => {
  const item = row(); const model = { findAll: async () => [item], update: async (): Promise<[number]> => [1] };
  const worker = new ProtocolNotificationWorker({ sendNotification: async () => { throw new Error("SMTP offline"); } }, { decrypt: async () => "cidadao@example.gov.br" }, model);
  await worker.runBatch(); assert.equal(item.status, "FAILED"); assert.equal(item.attempts, 1); assert.match(item.lastError || "", /SMTP offline/); assert.ok(item.nextAttemptAt instanceof Date);
});
