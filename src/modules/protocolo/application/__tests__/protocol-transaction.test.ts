import assert from "node:assert/strict";
import test from "node:test";
import { isProtocolTransactionConflict, withProtocolTransactionRetry } from "../protocol-transaction.js";

test("identifica conflitos transitórios do MariaDB inclusive quando encapsulados", () => {
  assert.equal(isProtocolTransactionConflict({ parent: { errno: 1020 } }), true);
  assert.equal(isProtocolTransactionConflict({ original: { code: "ER_LOCK_DEADLOCK" } }), true);
  assert.equal(isProtocolTransactionConflict({ sqlState: "40001" }), true);
  assert.equal(isProtocolTransactionConflict({ parent: { errno: 1062 } }), false);
});

test("repete a transação inteira até o limite e não repete erro permanente", async () => {
  let attempts = 0;
  const result = await withProtocolTransactionRetry(async () => {
    attempts += 1;
    if (attempts < 3) throw { parent: { errno: 1020 } };
    return "ok";
  });
  assert.equal(result, "ok");
  assert.equal(attempts, 3);

  let permanentAttempts = 0;
  await assert.rejects(withProtocolTransactionRetry(async () => { permanentAttempts += 1; throw new Error("permanente"); }));
  assert.equal(permanentAttempts, 1);
});
