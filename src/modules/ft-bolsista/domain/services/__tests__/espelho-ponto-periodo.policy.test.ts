import assert from "node:assert/strict";
import test from "node:test";
import { EspelhoPontoPeriodoPolicy } from "../espelho-ponto-periodo.policy.js";

const policy = new EspelhoPontoPeriodoPolicy();
test("current month includes today and historical months keep their full period", () => {
  const now = new Date("2026-11-13T15:00:00Z");
  assert.deepEqual(policy.resolve("2026-11", now), {
    inicio: "2026-11-01",
    fim: "2026-11-13",
    fimMes: "2026-11-30",
  });
  assert.deepEqual(policy.resolve("2026-10", now), {
    inicio: "2026-10-01",
    fim: "2026-10-31",
    fimMes: "2026-10-31",
  });
  assert.deepEqual(policy.resolve("2024-02", now), {
    inicio: "2024-02-01",
    fim: "2024-02-29",
    fimMes: "2024-02-29",
  });
  assert.deepEqual(policy.resolve("2025-02", now), {
    inicio: "2025-02-01",
    fim: "2025-02-28",
    fimMes: "2025-02-28",
  });
  assert.deepEqual(
    policy.resolve("2026-11", new Date("2026-12-01T02:59:59Z")),
    { inicio: "2026-11-01", fim: "2026-11-30", fimMes: "2026-11-30" },
  );
});
test("Brasília midnight and month changes do not follow the UTC date", () => {
  assert.equal(
    policy.resolve("2026-11", new Date("2026-11-14T02:59:59.999Z")).fim,
    "2026-11-13",
  );
  assert.equal(
    policy.resolve("2026-11", new Date("2026-11-14T03:00:00Z")).fim,
    "2026-11-14",
  );
  assert.throws(
    () => policy.resolve("2026-11", new Date("2026-11-01T02:59:59Z")),
    { code: "REPORT_MONTH_FUTURE" },
  );
  assert.equal(
    policy.resolve("2026-11", new Date("2026-11-01T03:00:00Z")).fim,
    "2026-11-01",
  );
});
test("future or malformed months are domain errors", () => {
  const now = new Date("2026-11-13T12:00:00Z");
  for (const mes of ["", "2026-00", "2026-13", "2026-1", "invalid"])
    assert.throws(() => policy.resolve(mes, now), {
      code: "REPORT_MONTH_INVALID",
    });
  for (const mes of ["2026-12", "2027-01"])
    assert.throws(() => policy.resolve(mes, now), {
      code: "REPORT_MONTH_FUTURE",
    });
});
