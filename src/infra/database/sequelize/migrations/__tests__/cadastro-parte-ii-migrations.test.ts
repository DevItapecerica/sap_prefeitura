import assert from "node:assert/strict";
import test from "node:test";
import turnosMigration from "../20261015130000-create-turnos-and-add-to-vinculos.js";
import ocorrenciasMigration from "../20261015131000-create-bolsista-ocorrencias.js";

const fakeTransaction = async (callback: (transaction: object) => Promise<void>) => callback({});

test("migration de turnos cria tabela e coluna reversivel", async () => {
  const calls: string[] = [];
  let hasColumn = false;
  let hasTable = false;
  const queryInterface: any = {
    sequelize: { transaction: fakeTransaction },
    showAllTables: async () => hasTable ? ["turnos"] : [],
    describeTable: async () => hasColumn ? { turno_id: {} } : {},
    createTable: async () => { calls.push("createTable"); hasTable = true; },
    addColumn: async () => { calls.push("addColumn"); hasColumn = true; },
    addIndex: async () => calls.push("addIndex"),
    removeIndex: async () => calls.push("removeIndex"),
    removeColumn: async () => { calls.push("removeColumn"); hasColumn = false; },
    dropTable: async () => { calls.push("dropTable"); hasTable = false; },
  };
  await turnosMigration.up(queryInterface);
  await turnosMigration.up(queryInterface);
  assert.deepEqual(calls.slice(0, 3), ["createTable", "addColumn", "addIndex"]);
  await turnosMigration.down(queryInterface);
  assert.deepEqual(calls.slice(-3), ["removeIndex", "removeColumn", "dropTable"]);
});

test("migration de ocorrencias cria indices e permite rollback", async () => {
  const calls: string[] = [];
  const queryInterface: any = {
    createTable: async (name: string) => calls.push(`create:${name}`),
    addIndex: async (_table: string, _columns: string[], options: any) => calls.push(`index:${options.name}`),
    dropTable: async (name: string) => calls.push(`drop:${name}`),
  };
  await ocorrenciasMigration.up(queryInterface);
  await ocorrenciasMigration.down(queryInterface);
  assert.deepEqual(calls, [
    "create:bolsista_ocorrencias",
    "index:idx_bolsista_ocorrencias_vinculo",
    "index:idx_bolsista_ocorrencias_data",
    "drop:bolsista_ocorrencias",
  ]);
});
