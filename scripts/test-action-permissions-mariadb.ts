import assert from "node:assert/strict";
import { configurePermissionsTestEnvironment } from "./permissions-test-target.js";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { Sequelize, QueryTypes, type QueryInterface } from "sequelize";

// Deliberately do not import env.ts or dotenv before validating the explicit target.
const raw = process.env.DATABASE_URL;
let target: URL;
try {
  target = configurePermissionsTestEnvironment();
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}

const database = new Sequelize(raw!, { dialect: "mariadb", logging: false });
const qi = database.getQueryInterface();
const directory = resolve("dist/infra/database/sequelize");
type Migration = { up: (qi: QueryInterface) => Promise<void>; down: (qi: QueryInterface) => Promise<void> };
const load = async (kind: "migrations" | "seeders", file: string): Promise<Migration> =>
  (await import(pathToFileURL(resolve(directory, kind, file)).href)).default;
const files = async (kind: "migrations" | "seeders") =>
  (await readdir(resolve(directory, kind))).filter((name) => /^\d.*\.js$/.test(name)).sort();
const rows = <T extends object>(sql: string) => database.query<T>(sql, { type: QueryTypes.SELECT });
const snapshot = () => rows("SELECT role_id, permission_action_id, allowed FROM role_permissions ORDER BY role_id, permission_action_id");

async function reset() {
  assert.equal((await rows<{ db: string }>("SELECT DATABASE() AS db"))[0].db, target.pathname.slice(1));
  await database.query("SET FOREIGN_KEY_CHECKS = 0");
  try {
    for (const table of await qi.showAllTables()) await qi.dropTable(table);
  } finally {
    await database.query("SET FOREIGN_KEY_CHECKS = 1");
  }
}

async function migrate(until = "99999999999999") {
  // Execute exactly the built migrations selected by .sequelizerc, in timestamp order.
  for (const name of await files("migrations")) {
    if (name.slice(0, 14) > until) break;
    console.log(`RUN migration ${name}`);
    await (await load("migrations", name)).up(qi);
  }
}
async function seed() {
  for (const name of await files("seeders")) {
    console.log(`RUN seed ${name}`);
    await (await load("seeders", name)).up(qi);
  }
}

async function main() {
  await database.authenticate();
  await reset();
  await migrate();
  await seed();
  assert.ok((await rows("SELECT id FROM permission_actions")).length > 0);
  assert.ok((await rows("SELECT id FROM role_permissions WHERE allowed=1")).length > 0);
  assert.equal(Number((await rows<{ completed: number }>("SELECT completed FROM permission_migration_state WHERE id=1"))[0].completed), 1);
  console.log("PASS instalação limpa: migrations e seeds reais completos");

  const structure = await load("migrations", "20261021090000-create-action-permissions.js");
  const backfill = await load("migrations", "20261021091000-backfill-role-action-permissions.js");
  const actionSeed = await load("seeders", "20261021092000-ensure-action-permissions.js");
  const original = await snapshot();
  await structure.up(qi);
  await backfill.up(qi);
  await actionSeed.up(qi);
  assert.deepEqual(await snapshot(), original);
  console.log("PASS reexecução: estrutura, backfill e seed idempotentes");

  const [cancel] = await rows<{ id: number }>("SELECT id FROM permission_actions WHERE module_key='ft' AND action='remover_bolsista'");
  const [remove] = await rows<{ id: number }>("SELECT id FROM permission_actions WHERE module_key='ft' AND action='excluir_bolsista'");
  assert.ok(cancel && remove && cancel.id !== remove.id);
  const [grant] = await rows<{ role_id: number }>(`SELECT role_id FROM role_permissions WHERE permission_action_id=${Number(cancel.id)} AND allowed=1 LIMIT 1`);
  assert.ok(grant);
  await database.query("UPDATE role_permissions SET allowed=0 WHERE role_id=:role AND permission_action_id=:action", { replacements: { role: grant.role_id, action: cancel.id } });
  await actionSeed.up(qi);
  await backfill.up(qi);
  assert.equal(Number((await rows<{ allowed: number }>(`SELECT allowed FROM role_permissions WHERE role_id=${Number(grant.role_id)} AND permission_action_id=${Number(cancel.id)}`))[0].allowed), 0);
  console.log("PASS revogação: seed/backfill não restauram acesso");

  const [beforeNew] = await rows<{ count: number }>("SELECT COUNT(*) AS count FROM role_permissions");
  await database.query("INSERT INTO roles (name) VALUES ('permissions_integration_new_role')");
  const [newRole] = await rows<{ id: number }>("SELECT id FROM roles WHERE name='permissions_integration_new_role'");
  await actionSeed.up(qi);
  assert.equal(Number((await rows<{ count: number }>("SELECT COUNT(*) AS count FROM role_permissions"))[0].count), Number(beforeNew.count));
  assert.equal(Number((await rows<{ count: number }>(`SELECT COUNT(*) AS count FROM role_permissions WHERE role_id=${Number(newRole.id)} AND allowed=1`))[0].count), 0);
  console.log("PASS role nova: sem herança das flags legadas e sem auto-grant");

  await assert.rejects(database.query("INSERT INTO role_permissions (role_id, permission_action_id, allowed, createdAt, updatedAt) VALUES (:role,:action,0,NOW(),NOW())", { replacements: { role: grant.role_id, action: cancel.id } }));
  await assert.rejects(database.query("INSERT INTO role_permissions (role_id, permission_action_id, allowed, createdAt, updatedAt) VALUES (2147483647,:action,0,NOW(),NOW())", { replacements: { action: cancel.id } }));
  await assert.rejects(database.query("INSERT INTO permission_actions (service_id,module_key,action,createdAt,updatedAt) VALUES (6,'usuarios','invalid_module_pair',NOW(),NOW())"));
  console.log("PASS FKs/índices: duplicidade, órfão e módulo divergente rejeitados");

  await Promise.all([true, false].map((allowed) => database.query(
    "INSERT INTO role_permissions (role_id,permission_action_id,allowed,createdAt,updatedAt) VALUES (:role,:action,:allowed,NOW(),NOW()) ON DUPLICATE KEY UPDATE allowed=VALUES(allowed),updatedAt=NOW()",
    { replacements: { role: newRole.id, action: cancel.id, allowed } },
  )));
  assert.equal(Number((await rows<{ count: number }>(`SELECT COUNT(*) AS count FROM role_permissions WHERE role_id=${Number(newRole.id)} AND permission_action_id=${Number(cancel.id)}`))[0].count), 1);
  console.log("PASS concorrência persistida: UNIQUE impede duplicação do mesmo par role/ação");

  const beforeRollback = await snapshot();
  await assert.rejects(backfill.down(qi));
  assert.deepEqual(await snapshot(), beforeRollback);
  console.log("PASS rollback após configuração: recusa sem perda de dados");

  // Restore a fresh, populated legacy database to exercise upgrade and reversible rollback.
  await reset();
  await migrate("20261020235959");
  for (const name of await files("seeders")) {
    if (name.startsWith("20261021")) continue;
    await (await load("seeders", name)).up(qi);
  }
  await database.query("UPDATE permissions SET `read`=1,edit=1,del=0 WHERE service_id=6 AND deletedAt IS NULL");
  const [visibility] = await rows<{ id: number; setor_id: number; service_id: number; visibility: unknown }>("SELECT id,setor_id,service_id,visibility FROM service_visibilities ORDER BY id LIMIT 1");
  const duplicateId = visibility.id + 100000;
  for (const [left, right] of [[1, 0], [1, null], [0, null], [null, -1]]) {
    await qi.bulkUpdate('service_visibilities', { visibility: left }, { id: visibility.id });
    await qi.bulkInsert('service_visibilities', [{ ...visibility, id: duplicateId, visibility: right }]);
    const beforeDuplicateCheck = await rows("SELECT id,setor_id,service_id,visibility FROM service_visibilities ORDER BY id");
    await assert.rejects(structure.up(qi), /service_visibilities conflicting duplicate; count=1/);
    assert.deepEqual(await rows("SELECT id,setor_id,service_id,visibility FROM service_visibilities ORDER BY id"), beforeDuplicateCheck);
    assert.ok(!(await qi.describeTable('services')).module_key);
    // Remove only the deliberate conflict fixture, never repair application data.
    await qi.bulkDelete('service_visibilities', { id: duplicateId });
  }
  await qi.bulkUpdate('service_visibilities', { visibility: visibility.visibility }, { id: visibility.id });
  await qi.bulkInsert('service_visibilities', [{ ...visibility, id: duplicateId }]);
  console.log("PASS duplicidade conflitante: true/false e NULL/booleano são recusados antes de DDL sem alteração de linhas");
  // Simulate interruption immediately after the first DDL of this feature.
  await qi.addColumn('services', 'module_key', { type: 'VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin', allowNull: true });
  await structure.up(qi);
  await qi.removeConstraint('role_permissions', 'fk_role_permissions_role');
  await qi.removeIndex('role_permissions', 'uq_role_permissions_role_action');
  await structure.up(qi);
  assert.ok((await qi.showIndex('role_permissions') as any[]).some(index => index.name === 'uq_role_permissions_role_action' && index.unique));
  assert.equal((await rows("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='role_permissions' AND CONSTRAINT_NAME='fk_role_permissions_role'")).length, 1);
  console.log("PASS retomada parcial: coluna inicial e FK/índice ausentes são retomados com definições verificadas");
  for (const value of [1, 0, null]) {
    await qi.bulkUpdate('service_visibilities', { visibility: value }, { id: visibility.id });
    await qi.bulkUpdate('service_visibilities', { visibility: value }, { id: duplicateId });
    const preserved = await rows("SELECT id,setor_id,service_id,visibility FROM service_visibilities ORDER BY id");
    await structure.up(qi);
    await backfill.up(qi);
    await actionSeed.up(qi);
    await structure.up(qi);
    await backfill.up(qi);
    await actionSeed.up(qi);
    assert.deepEqual(await rows("SELECT id,setor_id,service_id,visibility FROM service_visibilities ORDER BY id"), preserved);
    console.log(`PASS duplicidade equivalente ${value}: migration/backfill/seed e reexecução preservam todos os registros`);
  }
  // Restore only synthetic fixture data after validating that migrations never changed it.
  await qi.bulkDelete('service_visibilities', { id: duplicateId });
  await qi.bulkUpdate('service_visibilities', { visibility: visibility.visibility }, { id: visibility.id });
  const converted = await rows<{ action: string; allowed: number }>("SELECT a.action,p.allowed FROM role_permissions p JOIN permission_actions a ON a.id=p.permission_action_id WHERE a.module_key='ft' AND a.action IN ('remover_bolsista','excluir_bolsista')");
  assert.ok(converted.length > 0);
  for (const item of converted) assert.equal(Boolean(item.allowed), item.action === "remover_bolsista");
  console.log("PASS atualização populada: remover vínculo herda edit, excluir cadastro herda del");
  await backfill.down(qi);
  await structure.down(qi);
  await structure.down(qi);
  await structure.up(qi);
  await structure.up(qi);
  await backfill.up(qi);
  console.log("PASS rollback sem uso e retomada estrutural: down/up e reexecução reais");
  console.log("NOTE testes runtime de JWT/role/setor e HTTP são executados pela suíte de aplicação e integração específica");
}

try {
  await main();
} catch (error) {
  // Never print Sequelize errors with connection data or arbitrary query payloads.
  const code = (error as { original?: { code?: unknown } })?.original?.code;
  const ddlMessage = code === "ER_CANT_CREATE_TABLE" ? String((error as any).original?.sqlMessage ?? (error as any).original?.text ?? (error as any).original?.message ?? "").replace(/mariadb:\/\/[^\s]+/g, "<redacted>") : "";
  if (error instanceof Error && error.name === "AssertionError") console.error(error.stack);
  console.error(`PERMISSIONS_TEST_FAILED: ${error instanceof Error ? error.name : "UnknownError"}; code=${typeof code === "string" ? code : "unknown"}; ${ddlMessage}`);
  process.exitCode = 1;
} finally {
  await database.close();
}
