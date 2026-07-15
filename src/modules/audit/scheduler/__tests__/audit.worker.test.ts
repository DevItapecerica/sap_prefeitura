import assert from "node:assert/strict";
import test from "node:test";
import { __testing } from "../audit.worker.js";

test("audit worker keeps recovery polling and daily retention intervals", () => {
  assert.equal(__testing.POLLING_INTERVAL_MS, 5_000);
  assert.equal(__testing.RETENTION_INTERVAL_MS, 24 * 60 * 60_000);
});
