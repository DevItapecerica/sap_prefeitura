import assert from "node:assert/strict";
import test from "node:test";
import { ProtocolOperationsService } from "../protocol-operations.service.js";

test("snapshot operacional agrega somente contagens e emite alertas acionáveis", async () => {
  const repository = {
    protocolsBy: async (field: "state" | "protocolType"): Promise<Record<string, number>> => field === "state" ? { EM_ANALISE: 12 } : { REQUERIMENTO: 9, DENUNCIA: 3 },
    countOverdue: async () => 12,
    countNotifications: async (status: string) => status === "FAILED" ? 2 : 4,
    countPrivacyOpen: async () => 3,
    oldestPrivacyOpen: async () => new Date("2026-07-20T00:00:00.000Z"),
    countAttachments: async (status: string) => status === "QUARANTINED" ? 1 : 5,
  };
  const snapshot = await new ProtocolOperationsService(repository).snapshot(new Date("2026-08-12T00:00:00.000Z"));
  assert.deepEqual(snapshot.protocols.byType, { REQUERIMENTO: 9, DENUNCIA: 3 });
  assert.equal(snapshot.privacy.oldestOpenAgeDays, 23);
  assert.deepEqual(snapshot.alerts.map((alert) => alert.code), ["PROTOCOL_OVERDUE", "PROTOCOL_NOTIFICATION_FAILURE", "PROTOCOL_PRIVACY_REQUEST_AGED", "PROTOCOL_ATTACHMENT_STUCK"]);
  assert.equal(JSON.stringify(snapshot).includes("subject"), false);
});

test("snapshot saudável não fabrica alertas", async () => {
  const repository = {
    protocolsBy: async () => ({}), countOverdue: async () => 0,
    countNotifications: async () => 0, countPrivacyOpen: async () => 0,
    oldestPrivacyOpen: async () => null, countAttachments: async () => 0,
  };
  const snapshot = await new ProtocolOperationsService(repository).snapshot();
  assert.deepEqual(snapshot.alerts, []);
  assert.equal(snapshot.privacy.oldestOpenAgeDays, null);
});
