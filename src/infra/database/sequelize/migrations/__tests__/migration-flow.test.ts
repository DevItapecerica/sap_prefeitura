import assert from "node:assert/strict";
import test from "node:test";
import { QueryInterface } from "sequelize";
import rolesMigration from "../20251029120028-roles-model-creation.js";
import constraintsMigration from "../20251029121000-add-core-access-foreign-keys.js";
import setorMigration from "../20251028174623-create-setors.js";
import municipeResourceConstraintsMigration from "../20260715122000-add-municipe-resource-foreign-keys.js";
import bolsistaEditalPrimaryKeyMigration from "../20251202125717-Adicionando_pk_para_bolsista_edital.js";

const transaction = async (callback: (transaction: object) => Promise<void>) => callback({});

test("roles down removes dependent tables first", async () => {
  const dropped: string[] = [];
  const queryInterface = {
    sequelize: { transaction },
    dropTable: async (table: string) => { dropped.push(table); },
  } as unknown as QueryInterface;
  await rolesMigration.down(queryInterface);
  assert.deepEqual(dropped, ["service_visibilities", "permissions", "roles"]);
});

test("core access constraints reject orphaned records before DDL", async () => {
  let constraintsAdded = 0;
  const queryInterface = {
    sequelize: { transaction, query: async () => [{ id: 99 }] },
    addConstraint: async () => { constraintsAdded += 1; },
  } as unknown as QueryInterface;
  await assert.rejects(() => constraintsMigration.up(queryInterface), /orphaned record/);
  assert.equal(constraintsAdded, 0);
});

test("setor migration stays schema-only without timestamp columns", async () => {
  let columns: Record<string, unknown> = {};
  const queryInterface = {
    sequelize: { transaction },
    createTable: async (_table: string, definition: Record<string, unknown>) => { columns = definition; },
  } as unknown as QueryInterface;
  await setorMigration.up(queryInterface);
  assert.deepEqual(Object.keys(columns), ["id", "name", "description"]);
});

test("bolsistas edital primary key migration does not add an existing id column", async () => {
  let columnsAdded = 0;
  const queryInterface = {
    describeTable: async () => ({ id: { type: "CHAR(36)" } }),
    addColumn: async () => { columnsAdded += 1; },
    removeConstraint: async () => {},
    addConstraint: async () => {},
  } as unknown as QueryInterface;

  await bolsistaEditalPrimaryKeyMigration.up(queryInterface);

  assert.equal(columnsAdded, 0);
});

test("bolsistas edital primary key migration adds id when it is missing", async () => {
  let columnsAdded = 0;
  const queryInterface = {
    describeTable: async () => ({ bolsista_id: { type: "CHAR(36)" } }),
    addColumn: async () => { columnsAdded += 1; },
    removeConstraint: async () => {},
    addConstraint: async () => {},
  } as unknown as QueryInterface;

  await bolsistaEditalPrimaryKeyMigration.up(queryInterface);

  assert.equal(columnsAdded, 1);
});

test("municipe resource constraints reject orphaned records before DDL", async () => {
  let constraintsAdded = 0;
  const queryInterface = {
    sequelize: { transaction, query: async () => [{ uuid: "orphan" }] },
    addConstraint: async () => { constraintsAdded += 1; },
  } as unknown as QueryInterface;

  await assert.rejects(
    () => municipeResourceConstraintsMigration.up(queryInterface),
    /orphaned record/,
  );
  assert.equal(constraintsAdded, 0);
});

test("municipe resource constraints are added and removed in dependency order", async () => {
  const added: string[] = [];
  const removed: string[] = [];
  const queryInterface = {
    sequelize: { transaction, query: async () => [] },
    addConstraint: async (table: string) => { added.push(table); },
    removeConstraint: async (table: string) => { removed.push(table); },
  } as unknown as QueryInterface;

  await municipeResourceConstraintsMigration.up(queryInterface);
  await municipeResourceConstraintsMigration.down(queryInterface);

  assert.deepEqual(added, [
    "esporte_atletas",
    "carterinhas",
    "carterinhas_esporte",
  ]);
  assert.deepEqual(removed, [...added].reverse());
});
