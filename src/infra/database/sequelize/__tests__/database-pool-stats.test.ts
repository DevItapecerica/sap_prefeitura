import assert from "node:assert/strict";
import test from "node:test";
import { readDatabasePoolStats } from "../database-pool-stats.js";

test("pool metrics usa somente os getters publicos", () => {
  let reads = 0;
  const pool = {
    get size() {
      reads += 1;
      return 6;
    },
    get available() {
      reads += 1;
      return 2;
    },
    get using() {
      reads += 1;
      return 4;
    },
    get waiting() {
      reads += 1;
      return 1;
    },
  };

  assert.deepEqual(readDatabasePoolStats({ pool }), {
    total: 6,
    available: 2,
    in_use: 4,
    pending: 1,
  });
  assert.equal(reads, 4);
});

test("pool metrics omite provider incompatível", () => {
  assert.equal(readDatabasePoolStats(undefined), undefined);
  assert.equal(readDatabasePoolStats({ pool: { size: 1 } }), undefined);
});
