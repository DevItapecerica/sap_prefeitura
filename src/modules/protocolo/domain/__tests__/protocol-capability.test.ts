import assert from "node:assert/strict";
import test from "node:test";
import { assertProtocolCapabilitiesMutable, assertProtocolCapability, normalizeProtocolCapabilities } from "../protocol-capability.js";

test("capacidade específica permite somente a ação configurada", () => {
  const permissions = { route: true, decide: false };
  assert.doesNotThrow(() => assertProtocolCapability(3, permissions, "route"));
  assert.throws(
    () => assertProtocolCapability(3, permissions, "decide"),
    (error: any) => error.code === "PROTOCOL_CAPABILITY_DENIED" && error.statusCode === 403,
  );
});

test("administrador mantém acesso de contingência e ausência nega por padrão", () => {
  assert.doesNotThrow(() => assertProtocolCapability(1, null, "manageCatalog"));
  assert.throws(() => assertProtocolCapability(4, null, "viewSector"));
});

test("normalização cobre papéis novos e impede rebaixar o administrador", () => {
  assert.equal(normalizeProtocolCapabilities(9).viewSector, false);
  assert.equal(normalizeProtocolCapabilities(9).viewRestricted, false);
  assert.equal(normalizeProtocolCapabilities(9).viewOperations, false);
  assert.equal(normalizeProtocolCapabilities(1).export, true);
  assert.equal(normalizeProtocolCapabilities(1).viewRestricted, true);
  assert.equal(normalizeProtocolCapabilities(1).viewOperations, true);
  assert.throws(
    () => assertProtocolCapabilitiesMutable(1, { ...normalizeProtocolCapabilities(1), decide: false }),
    (error: any) => error.code === "PROTOCOL_ADMIN_CAPABILITIES_IMMUTABLE",
  );
});
