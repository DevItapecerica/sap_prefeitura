import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeAuditValue } from "../utils/audit-sanitizer.js";

test("remove secrets recursively and preserves functional fields", () => {
  const input = {
    id: 10,
    password: "secret",
    nested: { authorization: "Bearer token", name: "Allowed", refresh_token: "secret" },
    rows: [{ api_key: "secret", status: "active" }],
  };
  assert.deepEqual(sanitizeAuditValue(input), {
    id: 10,
    nested: { name: "Allowed" },
    rows: [{ status: "active" }],
  });
});

test("omits binary content and handles circular values", () => {
  const input: Record<string, unknown> = { id: 1, payload: Buffer.from("private") };
  input.self = input;
  assert.deepEqual(sanitizeAuditValue(input), { id: 1, payload: "[OMITTED_BINARY]", self: "[CIRCULAR]" });
});

test("removes password and file suffixes regardless of casing", () => {
  assert.deepEqual(sanitizeAuditValue({ temporaryPassword: "x", PROFILE_IMAGE: "x", displayName: "ok" }), { displayName: "ok" });
});
