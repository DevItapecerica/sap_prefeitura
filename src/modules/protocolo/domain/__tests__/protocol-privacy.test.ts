import assert from "node:assert/strict";
import test from "node:test";
import { assessRetentionEligibility, PROTOCOL_PRIVACY_NOTICE, PROTOCOL_PRIVACY_NOTICE_VERSION } from "../protocol-privacy.js";

const now = new Date("2026-08-12T12:00:00.000Z");
const expired = new Date("2025-08-11T12:00:00.000Z");
const policy = { reference: "TTD-2026", days: 365 };

test("aviso de privacidade possui versão estável, finalidade pública e canal do titular", () => {
  assert.equal(PROTOCOL_PRIVACY_NOTICE.version, PROTOCOL_PRIVACY_NOTICE_VERSION);
  assert.match(PROTOCOL_PRIVACY_NOTICE.legalBasis, /art\. 23 da LGPD/i);
  assert.ok(PROTOCOL_PRIVACY_NOTICE.rights.includes("ACCESS"));
  assert.match(PROTOCOL_PRIVACY_NOTICE.contactUrl, /^https:\/\//);
});

test("retenção permanece bloqueada sem política formal ou fora de estado terminal", () => {
  assert.deepEqual(
    assessRetentionEligibility({ state: "CONCLUIDO", updatedAt: expired }, { reference: null, days: null }, now),
    { eligible: false, reason: "POLICY_NOT_APPROVED" },
  );
  assert.deepEqual(
    assessRetentionEligibility({ state: "EM_ANALISE", updatedAt: expired }, policy, now),
    { eligible: false, reason: "PROTOCOL_NOT_TERMINAL" },
  );
});

test("preservação legal, solicitação do titular e prazo vigente impedem revisão", () => {
  assert.equal(assessRetentionEligibility({ state: "CONCLUIDO", updatedAt: expired, legalHoldAt: now }, policy, now).reason, "LEGAL_HOLD");
  assert.equal(assessRetentionEligibility({ state: "INDEFERIDO", updatedAt: expired, openPrivacyRequests: 1 }, policy, now).reason, "OPEN_PRIVACY_REQUEST");
  assert.equal(assessRetentionEligibility({ state: "CANCELADO", updatedAt: new Date("2026-01-01T00:00:00.000Z") }, policy, now).reason, "RETENTION_PERIOD_ACTIVE");
});

test("somente protocolo terminal vencido e sem bloqueios vira candidato à revisão", () => {
  assert.deepEqual(
    assessRetentionEligibility({ state: "CONCLUIDO", updatedAt: expired }, policy, now),
    { eligible: true, reason: "ELIGIBLE_FOR_REVIEW" },
  );
});
