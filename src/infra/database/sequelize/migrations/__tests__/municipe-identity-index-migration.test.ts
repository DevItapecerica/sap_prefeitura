import assert from "node:assert/strict";
import test from "node:test";
import { QueryInterface } from "sequelize";
import migration from "../20260812130000-add-unique-municipe-cpf-hash.js";

function fixture(duplicates = false) {
  let exists = false;
  const additions: Array<{ table: string; fields: string[]; name: string; unique?: boolean }> = [];
  const drops: string[] = [];
  const queryInterface = {
    sequelize: {
      query: async (sql: string) => {
        if (sql.includes("information_schema.STATISTICS")) return [{ present: exists ? 1 : 0 }];
        if (sql.includes("GROUP BY cpfHash")) return duplicates ? [{ cpfHash: "hash", total: 2 }] : [];
        if (sql.startsWith("DROP INDEX")) {
          drops.push(sql);
          exists = false;
        }
        return [];
      },
    },
    addIndex: async (table: string, fields: string[], options: { name: string; unique?: boolean }) => {
      additions.push({ table, fields, ...options });
      exists = true;
    },
  } as unknown as QueryInterface;
  return { queryInterface, additions, drops };
}

test("migration cria índice único de CPF de forma idempotente e reversível", async () => {
  const { queryInterface, additions, drops } = fixture();
  await migration.up(queryInterface);
  await migration.up(queryInterface);

  assert.deepEqual(additions, [{ table: "municipes", fields: ["cpfHash"], name: "uq_municipes_cpf_hash", unique: true }]);
  await migration.down(queryInterface);
  assert.equal(drops.length, 1);
  assert.match(drops[0], /DROP INDEX `uq_municipes_cpf_hash` ON `municipes`/);
});

test("migration interrompe antes do DDL quando há CPF duplicado", async () => {
  const { queryInterface, additions } = fixture(true);
  await assert.rejects(() => migration.up(queryInterface), /duplicate cpfHash records/);
  assert.equal(additions.length, 0);
});
