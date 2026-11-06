import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";
import { Sequelize, QueryTypes } from "sequelize";
import { configurePermissionsTestEnvironment } from "./permissions-test-target.js";

// Validate the explicit disposable target before loading application configuration.
let target: URL;
try {
  target = configurePermissionsTestEnvironment();
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}
const database = new Sequelize(target.toString(), {
  dialect: "mariadb",
  logging: false,
});
const query = database.getQueryInterface();
const execute = promisify(execFile);
const cli = resolve("node_modules/sequelize-cli/lib/sequelize");
const rows = <T extends object>(sql: string) =>
  database.query<T>(sql, { type: QueryTypes.SELECT });
async function command(name: "db:migrate" | "db:seed:all") {
  try {
    await execute(process.execPath, [cli, name], {
      cwd: process.cwd(),
      env: process.env,
    });
  } catch (error) {
    const details = error as { stderr?: string };
    console.error(
      details.stderr
        ?.split("\n")
        .filter((line) => line.startsWith("ERROR:"))
        .join("\n"),
    );
    throw error;
  }
}
async function snapshot() {
  const tables = [
    "roles",
    "setors",
    "services",
    "users",
    "permission_actions",
    "role_permissions",
    "service_visibilities",
    "ft_estoque_controle",
  ];
  return Promise.all(
    tables.map((table) => rows("SELECT * FROM " + table + " ORDER BY id")),
  );
}

try {
  await database.authenticate();
  assert.equal(
    (await rows<{ db: string }>("SELECT DATABASE() AS db"))[0].db,
    target.pathname.slice(1),
  );
  const initialTables = (await query.showAllTables()).map((table) =>
    typeof table === "string"
      ? table
      : (table as { tableName: string }).tableName,
  );
  assert.ok(
    initialTables.every((name) =>
      ["sequelizemeta", "sequelizedata"].includes(name.toLowerCase()),
    ),
    "Use an EMPTY disposable database; this harness never resets an existing schema",
  );
  await command("db:migrate");
  await command("db:seed:all");
  assert.equal((await rows("SELECT name FROM SequelizeMeta")).length, 7);
  assert.equal((await rows("SELECT id FROM services")).length, 9);
  assert.equal(
    (await rows("SELECT id FROM services WHERE id IN (5,8)")).length,
    0,
  );
  assert.equal((await rows("SELECT id FROM users")).length, 1);
  assert.equal((await rows("SELECT id FROM permission_actions")).length, 108);
  const tables = (await query.showAllTables()).map((table) =>
    typeof table === "string"
      ? table
      : (table as { tableName: string }).tableName,
  );
  for (const retired of [
    "permissions",
    "permission_migration_state",
    "bolsistas_legacy_archive",
    "pagadores_migration_pending",
  ])
    assert.ok(!tables.includes(retired));
  assert.equal(
    (
      await rows(
        "SELECT id FROM role_permissions WHERE role_id<>1 AND allowed=1",
      )
    ).length,
    0,
  );
  console.log(
    "PASS real CLI bootstrap: seven migrations, three seeds, final schema, active services and isolated initial administrator",
  );

  const [action] = await rows<{ id: number }>(
    "SELECT id FROM permission_actions WHERE module_key='ft' AND action='fechar_folha_pagamento'",
  );
  assert.ok(action);
  await database.query(
    "UPDATE role_permissions SET allowed=0 WHERE role_id=1 AND permission_action_id=:id",
    { replacements: { id: action.id } },
  );
  await database.query(
    "UPDATE service_visibilities SET visibility=0 WHERE service_id=1 AND setor_id=1",
  );
  const before = await snapshot();
  await command("db:migrate");
  await command("db:seed:all");
  assert.deepEqual(await snapshot(), before);
  console.log(
    "PASS CLI rerun preserves accounts/passwords, revoked grants, hidden services and technical catalog IDs",
  );

  await database.query(
    "INSERT INTO roles (name) VALUES ('fresh_role_without_grants')",
  );
  const [role] = await rows<{ id: number }>(
    "SELECT id FROM roles WHERE name='fresh_role_without_grants'",
  );
  await command("db:seed:all");
  assert.equal(
    (
      await rows<{ count: number }>(
        "SELECT COUNT(*) AS count FROM role_permissions WHERE role_id=" +
          Number(role.id),
      )
    )[0].count,
    0,
  );
  await assert.rejects(
    database.query(
      "INSERT INTO permission_actions(service_id,module_key,action,createdAt,updatedAt) VALUES(6,'usuarios','invalid_pair',NOW(),NOW())",
    ),
  );
  await assert.rejects(
    database.query(
      "INSERT INTO role_permissions(role_id,permission_action_id,allowed,createdAt,updatedAt) VALUES(2147483647,:id,1,NOW(),NOW())",
      { replacements: { id: action.id } },
    ),
  );
  await assert.rejects(
    database.query(
      "INSERT INTO service_visibilities(setor_id,service_id,visibility) VALUES(1,6,1)",
    ),
  );
  await Promise.all(
    [true, false].map((allowed) =>
      database.query(
        "INSERT INTO role_permissions(role_id,permission_action_id,allowed,createdAt,updatedAt) VALUES(:role,:action,:allowed,NOW(),NOW()) ON DUPLICATE KEY UPDATE allowed=VALUES(allowed)",
        { replacements: { role: role.id, action: action.id, allowed } },
      ),
    ),
  );
  const concurrent = await rows<{ count: number }>(
    "SELECT COUNT(*) AS count FROM role_permissions WHERE role_id=" +
      Number(role.id) +
      " AND permission_action_id=" +
      Number(action.id),
  );
  assert.equal(Number(concurrent[0].count), 1);
  console.log(
    "PASS composite FK, orphan rejection, unique visibility and concurrent role/action uniqueness",
  );
  const beforeRollback = await snapshot();
  await assert.rejects(
    database.transaction(async (transaction) => {
      await database.query(
        "UPDATE role_permissions SET allowed=1 WHERE role_id=1 AND permission_action_id=:id",
        { replacements: { id: action.id }, transaction },
      );
      throw new Error("SYNTHETIC_ROLLBACK");
    }),
  );
  assert.deepEqual(await snapshot(), beforeRollback);
  console.log("PASS grant update rollback without partial writes");
} catch (error) {
  if (error instanceof Error && error.name === "AssertionError")
    console.error(error.message);
  const code = (error as { original?: { code?: unknown } }).original?.code;
  console.error(
    "PERMISSIONS_TEST_FAILED: " +
      (typeof code === "string"
        ? code
        : error instanceof Error
          ? error.name
          : "UnknownError"),
  );
  process.exitCode = 1;
} finally {
  await database.close();
}
