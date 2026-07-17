import assert from "node:assert/strict";
import test from "node:test";
import {
  auditRequestRegistryTesting,
  consumeAuditRequestHandled,
  markAuditRequestHandled,
} from "../audit-request-registry.js";

test("audit request registry consumes marks and expires abandoned entries", () => {
  auditRequestRegistryTesting.clear();
  const now = 1_000;

  markAuditRequestHandled("consumed", now);
  assert.equal(consumeAuditRequestHandled("consumed", now), true);
  assert.equal(consumeAuditRequestHandled("consumed", now), false);

  markAuditRequestHandled("expired", now);
  assert.equal(
    consumeAuditRequestHandled(
      "expired",
      now + auditRequestRegistryTesting.ttlMs + 1,
    ),
    false,
  );
  assert.equal(auditRequestRegistryTesting.size(), 0);
});
