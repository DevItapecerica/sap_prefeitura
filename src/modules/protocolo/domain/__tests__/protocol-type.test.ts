import assert from "node:assert/strict";
import test from "node:test";
import { assertProtocolTypeOpening, protocolTypePolicy, PROTOCOL_TYPE_POLICY_VERSION } from "../protocol-type.js";

const terminal = { id: "target", citizenId: "citizen-a", state: "INDEFERIDO" };

test("denúncia permanece identificada e restrita por padrão", () => {
  const policy = protocolTypePolicy("DENUNCIA");
  assert.equal(policy.requiresIdentification, true);
  assert.equal(policy.anonymousOpening, false);
  assert.equal(policy.confidentiality, "RESTRICTED");
  assert.match(PROTOCOL_TYPE_POLICY_VERSION, /^\d{4}-\d{2}-\d{2}\.\d+$/);
});

test("recurso exige protocolo terminal do mesmo titular", () => {
  assert.throws(() => assertProtocolTypeOpening("RECURSO", "citizen-a"), (error: any) => error.code === "RELATED_PROTOCOL_REQUIRED");
  assert.throws(() => assertProtocolTypeOpening("RECURSO", "citizen-a", "missing"), (error: any) => error.code === "RELATED_PROTOCOL_NOT_FOUND");
  assert.throws(() => assertProtocolTypeOpening("RECURSO", "citizen-b", terminal.id, terminal), (error: any) => error.code === "RELATED_PROTOCOL_NOT_FOUND");
  assert.throws(
    () => assertProtocolTypeOpening("RECURSO", "citizen-a", terminal.id, { ...terminal, state: "EM_ANALISE" }),
    (error: any) => error.code === "RELATED_PROTOCOL_NOT_TERMINAL",
  );
  assert.doesNotThrow(() => assertProtocolTypeOpening("RECURSO", "citizen-a", terminal.id, terminal));
});

test("outros tipos rejeitam vínculo usado fora da política", () => {
  assert.throws(() => assertProtocolTypeOpening("REQUERIMENTO", "citizen-a", terminal.id, terminal), (error: any) => error.code === "RELATED_PROTOCOL_FORBIDDEN");
  assert.doesNotThrow(() => assertProtocolTypeOpening("SOLICITACAO_SERVICO", "citizen-a"));
});
