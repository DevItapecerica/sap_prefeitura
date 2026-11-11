import assert from "node:assert/strict";
import test from "node:test";
import { QueryInterface } from "sequelize";
import core from "../20261106090000-create-core-schema.js";
import municipes from "../20261106091000-create-municipes-schema.js";
import esporte from "../20261106092000-create-esporte-schema.js";
import peead from "../20261106093000-create-peaad-schema.js";
import payroll from "../20261106094000-create-payroll-schema.js";
import stock from "../20261106095000-create-stock-schema.js";
import audit from "../20261106100000-create-audit-schema.js";
import {
  assertNewDatabase,
  assertEmptyTables,
} from "../helpers/fresh-schema.js";

const migrations = [core, municipes, esporte, peead, payroll, stock, audit];
function fixture(initial: unknown[] = [], count = 0) {
  const statements: string[] = [];
  const columns = new Map<
    string,
    Record<string, { type: string; allowNull: boolean; defaultValue?: unknown }>
  >();
  const indices: {
    table: string;
    fields: string[];
    options: { name: string; unique: boolean };
  }[] = [];
  const constraints: {
    table: string;
    fields: string[];
    references: { table: string; field: string; fields?: string[] };
    onDelete: string;
  }[] = [];
  const qi = {
    showAllTables: async () => [...initial, ...columns.keys()],
    createTable: async (
      table: string,
      definitions: Record<string, { type: string; allowNull: boolean }>,
    ) => {
      assert.ok(!columns.has(table));
      columns.set(table, definitions);
    },
    addIndex: async (
      table: string,
      fields: string[],
      options: { name: string; unique: boolean },
    ) => {
      indices.push({ table, fields, options });
    },
    addConstraint: async (
      table: string,
      options: {
        fields: string[];
        references: { table: string; field: string };
        onDelete: string;
      },
    ) => {
      assert.ok(columns.has(options.references.table));
      constraints.push({ table, ...options });
    },
    dropTable: async (table: string) => {
      columns.delete(table);
    },
    sequelize: {
      query: async (sql: string) => {
        statements.push(sql);
        return [{ count }];
      },
    },
  } as unknown as QueryInterface;
  return { qi, columns, indices, constraints, statements };
}

test("initial migrations create 38 final tables with the required relational constraints", async () => {
  const f = fixture();
  for (const migration of migrations) await migration.up(f.qi);
  assert.equal(f.columns.size, 38);
  for (const retired of [
    "permissions",
    "permission_migration_state",
    "bolsistas_legacy_archive",
    "bolsistas_migration_divergences",
    "pagadores_migration_pending",
    "payment_info_pagador_legacy",
  ])
    assert.ok(!f.columns.has(retired));
  assert.equal(f.columns.get("edital")!.idade_maxima.allowNull, false);
  assert.equal(f.columns.get("edital")!.idade_maxima.defaultValue, undefined);
  assert.equal(
    f.columns.get("ft_estoque_entregas")!.total_centavos.type,
    "BIGINT(20) UNSIGNED",
  );
  assert.equal(f.columns.get("ft_folhas_fechadas")!.snapshot.type, "LONGTEXT");
  for (const [table, fields] of [
    ["ft_inscricoes", ["edital_id", "bolsista_id"]],
    ["ft_folhas_fechadas", ["edital_id", "mes"]],
    ["ft_estoque_entregas", ["kit_ativo_participacao_id"]],
    ["service_visibilities", ["setor_id", "service_id"]],
  ] as const) {
    assert.ok(
      f.indices.some(
        (index) =>
          index.table === table &&
          index.options.unique &&
          JSON.stringify(index.fields) === JSON.stringify(fields),
      ),
    );
  }
  assert.ok(
    f.statements.some((sql) =>
      sql.includes(
        "FOREIGN KEY (`service_id`, `module_key`) REFERENCES `services` (`id`, `module_key`) ON UPDATE CASCADE ON DELETE RESTRICT",
      ),
    ),
  );
  for (const migration of [...migrations].reverse()) await migration.down(f.qi);
  assert.equal(f.columns.size, 0);
});

test("fresh bootstrap refuses existing schema, old migration history and unsupported metadata without DDL", async () => {
  for (const initial of [["users"], [{ tableName: "services" }]]) {
    const f = fixture(initial);
    await assert.rejects(core.up(f.qi), /empty database/);
    assert.equal(f.columns.size, 0);
  }
  await assert.rejects(assertNewDatabase(fixture([{}]).qi), /Unsupported/);
  await assert.rejects(
    assertNewDatabase(fixture(["SequelizeMeta"], 1).qi),
    /history/,
  );
  await assertNewDatabase(fixture([{ tableName: "SequelizeMeta" }], 0).qi);
  await assertNewDatabase(fixture(["SequelizeData"], 0).qi);
  await assertNewDatabase(fixture(["sequelizemeta"], 0).qi);
});

test("rollback refuses populated tables and never interpolates an invalid table name", async () => {
  const f = fixture([], 1);
  await assert.rejects(stock.down(f.qi), /Rollback refused/);
  await assert.rejects(
    assertEmptyTables(f.qi, ["users; DROP TABLE users"]),
    /Invalid schema table/,
  );
});
