import assert from "node:assert/strict";
import test from "node:test";
import { QueryInterface } from "sequelize";
import rolesMigration from "../20251029120028-roles-model-creation.js";
import constraintsMigration from "../20251029121000-add-core-access-foreign-keys.js";
import setorMigration from "../20251028174623-create-setors.js";
import municipeResourceConstraintsMigration from "../20260715122000-add-municipe-resource-foreign-keys.js";
import bolsistaEditalPrimaryKeyMigration from "../20251202125717-Adicionando_pk_para_bolsista_edital.js";
import bolsistaEditalObservacaoMigration from "../20260827120000-add-observacao-bolsistas-edital.js";
import usersEmailUniqueMigration from "../20261009120000-remove-unique-users-email.js";

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

test("bolsistas edital observacao migration is reversible and idempotent", async () => {
  let hasObservacao = false;
  let columnsAdded = 0;
  let columnsRemoved = 0;
  const queryInterface = {
    describeTable: async () => hasObservacao ? { observacao: { type: "TEXT" } } : {},
    addColumn: async () => { hasObservacao = true; columnsAdded += 1; },
    removeColumn: async () => { hasObservacao = false; columnsRemoved += 1; },
  } as unknown as QueryInterface;

  await bolsistaEditalObservacaoMigration.up(queryInterface);
  await bolsistaEditalObservacaoMigration.up(queryInterface);
  await bolsistaEditalObservacaoMigration.down(queryInterface);
  await bolsistaEditalObservacaoMigration.down(queryInterface);

  assert.equal(columnsAdded, 1);
  assert.equal(columnsRemoved, 1);
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

test("users email migration replaces only the unique email index with a regular index", async () => {
  const indexes = new Map([
    ["PRIMARY", { nonUnique: 0, columns: ["id"] }],
    ["email", { nonUnique: 0, columns: ["email"] }],
    ["idx_users_role_id", { nonUnique: 1, columns: ["role_id"] }],
  ]);
  const added: Array<{ name: string; unique: boolean }> = [];
  const removed: string[] = [];
  const queryInterface = {
    showIndex: async () => [...indexes].map(([name, index]) => ({
      name,
      primary: name === "PRIMARY",
      unique: index.nonUnique === 0,
      fields: index.columns.map((attribute) => ({ attribute })),
    })),
    addIndex: async (
      _table: string,
      columns: string[],
      options: { name: string; unique?: boolean },
    ) => {
      indexes.set(options.name, {
        nonUnique: options.unique ? 0 : 1,
        columns,
      });
      added.push({ name: options.name, unique: options.unique === true });
    },
    removeIndex: async (_table: string, name: string) => {
      indexes.delete(name);
      removed.push(name);
    },
  } as unknown as QueryInterface;

  await usersEmailUniqueMigration.up(queryInterface);

  assert.deepEqual(added, [{ name: "idx_users_email", unique: false }]);
  assert.deepEqual(removed, ["email"]);
  assert.deepEqual(indexes.get("idx_users_email"), {
    nonUnique: 1,
    columns: ["email"],
  });
  assert.deepEqual(indexes.get("idx_users_role_id"), {
    nonUnique: 1,
    columns: ["role_id"],
  });

  await usersEmailUniqueMigration.down(queryInterface);

  assert.deepEqual(removed, ["email", "idx_users_email"]);
  assert.deepEqual(added.at(-1), {
    name: "unique_users_email",
    unique: true,
  });
  assert.deepEqual(indexes.get("unique_users_email"), {
    nonUnique: 0,
    columns: ["email"],
  });
  assert.ok(indexes.has("idx_users_role_id"));
});
