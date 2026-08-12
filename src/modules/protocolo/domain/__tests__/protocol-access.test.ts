import assert from "node:assert/strict";
import test from "node:test";
import { assertInternalProtocolAccess, requiresRestrictedCapability } from "../protocol-access.js";

const protocol = { currentSectorId: 8, assigneeId: 21, state: "EM_ANALISE" };
const responsible = { id: 21, role_id: 3, setor_id: 8 };

test("acesso interno permite leitura no setor e mutação pelo responsável", () => {
  assert.doesNotThrow(() => assertInternalProtocolAccess(protocol, responsible, "VIEW"));
  assert.doesNotThrow(() => assertInternalProtocolAccess(protocol, responsible, "MUTATE"));
});

test("acesso interno rejeita outro setor e outro responsável", () => {
  assert.throws(
    () => assertInternalProtocolAccess(protocol, { ...responsible, setor_id: 9 }, "VIEW"),
    (error: any) => error.code === "PROTOCOL_SECTOR_DENIED",
  );
  assert.throws(
    () => assertInternalProtocolAccess(protocol, { ...responsible, id: 22 }, "MUTATE"),
    (error: any) => error.code === "PROTOCOL_ASSIGNEE_DENIED",
  );
});

test("triagem sem responsável pode encaminhar, mas não concluir", () => {
  const unassigned = { currentSectorId: 8, assigneeId: null, state: "EM_TRIAGEM" };
  assert.doesNotThrow(() => assertInternalProtocolAccess(unassigned, responsible, "FORWARD"));
  assert.throws(() => assertInternalProtocolAccess(unassigned, responsible, "MUTATE"));
});

test("protocolo atribuído não pode ser assumido por outro usuário", () => {
  assert.throws(() => assertInternalProtocolAccess(protocol, { ...responsible, id: 22 }, "ASSUME"));
  assert.doesNotThrow(() => assertInternalProtocolAccess(protocol, responsible, "ASSUME"));
  assert.doesNotThrow(() => assertInternalProtocolAccess(protocol, { id: 999, role_id: 1, setor_id: null }, "MUTATE"));
});

test("preservação legal possui escopo global após a capacidade de privacidade ser autorizada", () => {
  const protocol = { currentSectorId: 20, assigneeId: 8, state: "CONCLUIDO" };
  const privacyOfficer = { id: 99, role_id: 7, setor_id: 30 };
  assert.doesNotThrow(() => assertInternalProtocolAccess(protocol, privacyOfficer, "PRIVACY"));
});

test("sigilo exige capacidade dedicada, exceto para preservação de privacidade", () => {
  assert.equal(requiresRestrictedCapability("RESTRICTED", "VIEW"), true);
  assert.equal(requiresRestrictedCapability("RESTRICTED", "MUTATE"), true);
  assert.equal(requiresRestrictedCapability("RESTRICTED", "PRIVACY"), false);
  assert.equal(requiresRestrictedCapability("NORMAL", "VIEW"), false);
});
