import assert from "node:assert/strict";
import test from "node:test";
import turnosMigration from "../20261015130000-create-turnos-and-add-to-vinculos.js";
import ocorrenciasMigration from "../20261015131000-create-bolsista-ocorrencias.js";
import snapshotMigration from "../20261015132000-add-turno-snapshot-to-vinculos.js";

const fakeTransaction = async (callback: (transaction: object) => Promise<void>) => callback({});

test("migration de turnos cria tabela e coluna reversivel", async () => {
  const calls: string[] = [];
  let hasColumn = false;
  let hasTable = false;
  let hasIndex = false;
  let hasConstraint = false;
  const queryInterface: any = {
    sequelize: { transaction: fakeTransaction },
    showAllTables: async () => hasTable ? ["turnos"] : [],
    describeTable: async () => hasColumn ? { turno_id: {} } : {},
    createTable: async () => { calls.push("createTable"); hasTable = true; },
    addColumn: async () => { calls.push("addColumn"); hasColumn = true; },
    showIndex: async () => hasIndex ? [{ name: "idx_bolsistas_edital_turno" }] : [],
    showConstraint: async () => hasConstraint ? [{ constraintName: "fk_bolsistas_edital_turno_id" }] : [],
    addConstraint: async () => { calls.push("addConstraint"); hasConstraint = true; },
    addIndex: async () => { calls.push("addIndex"); hasIndex = true; },
    removeIndex: async () => { calls.push("removeIndex"); hasIndex = false; },
    removeConstraint: async () => { calls.push("removeConstraint"); hasConstraint = false; },
    removeColumn: async () => { calls.push("removeColumn"); hasColumn = false; },
    dropTable: async () => { calls.push("dropTable"); hasTable = false; },
  };
  await turnosMigration.up(queryInterface);
  await turnosMigration.up(queryInterface);
  assert.deepEqual(calls.slice(0, 4), ["createTable", "addColumn", "addConstraint", "addIndex"]);
  await turnosMigration.down(queryInterface);
  assert.deepEqual(calls.slice(-4), ["removeIndex", "removeConstraint", "removeColumn", "dropTable"]);
});

test("migration de snapshot preenche horarios e permite rollback", async () => {
  const columns: Record<string, object> = {};
  const calls: string[] = [];
  const queryInterface: any = {
    sequelize: {
      transaction: fakeTransaction,
      query: async (sql: string) => calls.push(sql.includes("UPDATE bolsistas_edital") ? "backfill" : "query"),
    },
    describeTable: async () => columns,
    addColumn: async (_table: string, name: string) => { columns[name] = {}; calls.push(`add:${name}`); },
    removeColumn: async (_table: string, name: string) => { delete columns[name]; calls.push(`remove:${name}`); },
  };
  await snapshotMigration.up(queryInterface);
  await snapshotMigration.up(queryInterface);
  assert.equal(calls.filter((call) => call.startsWith("add:")).length, 3);
  assert.equal(calls.filter((call) => call === "backfill").length, 2);
  await snapshotMigration.down(queryInterface);
  assert.equal(Object.keys(columns).length, 0);
});

test("migration de ocorrencias cria indices e permite rollback", async () => {
  const calls: string[] = [];
  let hasTable = false;
  const indexes = new Set<string>();
  const queryInterface: any = {
    sequelize: { transaction: fakeTransaction },
    showAllTables: async () => hasTable ? ["bolsista_ocorrencias"] : [],
    showIndex: async () => [...indexes].map((name) => ({ name })),
    createTable: async (name: string) => { calls.push(`create:${name}`); hasTable = true; },
    addIndex: async (_table: string, _columns: string[], options: any) => { calls.push(`index:${options.name}`); indexes.add(options.name); },
    dropTable: async (name: string) => { calls.push(`drop:${name}`); hasTable = false; },
  };
  await ocorrenciasMigration.up(queryInterface);
  await ocorrenciasMigration.up(queryInterface);
  await ocorrenciasMigration.down(queryInterface);
  assert.deepEqual(calls, [
    "create:bolsista_ocorrencias",
    "index:idx_bolsista_ocorrencias_vinculo",
    "index:idx_bolsista_ocorrencias_data",
    "drop:bolsista_ocorrencias",
  ]);
});
