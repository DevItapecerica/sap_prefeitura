import assert from "node:assert/strict";
import test from "node:test";
import { ProtocolReadinessService } from "../protocol-readiness.service.js";

const up = async () => undefined;

test("readiness exige banco, antivirus e PDF simultaneamente", async () => {
  const service = new ProtocolReadinessService({ database: up, antivirus: up, pdf: up });
  const checkedAt = new Date("2026-08-12T12:00:00.000Z");

  assert.deepEqual(await service.check(checkedAt), {
    ready: true,
    checkedAt,
    checks: { database: "UP", antivirus: "UP", pdf: "UP" },
  });
});

test("readiness falha fechada sem expor a causa interna", async () => {
  const service = new ProtocolReadinessService({
    database: up,
    antivirus: async () => { throw new Error("clamav.internal:3310 secret"); },
    pdf: async () => { throw new Error("http://pdf.internal/health"); },
  });

  const snapshot = await service.check();
  assert.equal(snapshot.ready, false);
  assert.deepEqual(snapshot.checks, { database: "UP", antivirus: "DOWN", pdf: "DOWN" });
  assert.equal(JSON.stringify(snapshot).includes("internal"), false);
  assert.equal(JSON.stringify(snapshot).includes("secret"), false);
});
