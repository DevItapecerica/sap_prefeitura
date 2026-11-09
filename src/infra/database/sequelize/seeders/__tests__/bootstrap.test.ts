import assert from "node:assert/strict";
import test from "node:test";
import { randomBytes } from "node:crypto";
import { compare } from "bcryptjs";
import catalogs from "../20261106100000-system-catalogs.js";
import actions from "../20261106101000-permission-actions.js";
import admin, {
  getBootstrapCredentials,
  runAdminSeed,
} from "../20261106102000-bootstrap-admin.js";
import { PERMISSION_CATALOG } from "../../../../../modules/acess-controll/domain/permission-catalog.js";
import { bootstrapFixture } from "./bootstrap.fixture.js";

const credentials = () => ({
  BOOTSTRAP_ADMIN_EMAIL: "bootstrap@example.invalid",
  BOOTSTRAP_ADMIN_PASSWORD: randomBytes(24).toString("hex"),
});
async function fixtureWithCatalog() {
  const f = bootstrapFixture();
  await catalogs.up(f.query);
  await actions.up(f.query);
  return f;
}

test("fresh seeds create only active services, technical state and the permission catalog", async () => {
  const f = await fixtureWithCatalog();
  assert.deepEqual(
    f.rows("services").map((row) => row.id),
    [1, 2, 3, 4, 6, 7, 9, 10, 11],
  );
  assert.equal(f.rows("roles").length, 4);
  assert.equal(f.rows("permission_actions").length, PERMISSION_CATALOG.length);
  assert.equal(f.rows("service_visibilities").length, 9);
  assert.equal(f.rows("ft_estoque_controle")[0].versao, 0);
  assert.equal(f.rows("users").length, 0);
  assert.equal(f.rows("role_permissions").length, 0);
  const before = f.snapshot();
  await catalogs.up(f.query);
  await actions.up(f.query);
  assert.deepEqual(f.snapshot(), before);
});

test("bootstrap administrator hashes its password and initializes only the administrator role", async () => {
  const f = await fixtureWithCatalog(),
    env = credentials();
  await runAdminSeed(f.query, env);
  assert.equal(f.rows("users").length, 1);
  const user = f.rows("users")[0];
  assert.equal(user.role_id, 1);
  assert.equal(user.setor_id, 1);
  assert.equal(user.firstLogin, true);
  assert.ok(await compare(env.BOOTSTRAP_ADMIN_PASSWORD, String(user.password)));
  assert.equal(f.rows("role_permissions").length, PERMISSION_CATALOG.length);
  assert.ok(
    f
      .rows("role_permissions")
      .every((row) => row.role_id === 1 && row.allowed === true),
  );
  f.rows("role_permissions")[0].allowed = false;
  f.rows("service_visibilities")[0].visibility = false;
  f.rows("ft_estoque_controle")[0].versao = 7;
  f.rows("services")[0].name = "Nome alterado";
  f.rows("permission_actions").push({
    id: 999,
    service_id: 6,
    module_key: "ft",
    action: "future_action",
  });
  const before = f.snapshot();
  await catalogs.up(f.query);
  await actions.up(f.query);
  await runAdminSeed(f.query, {});
  assert.deepEqual(f.snapshot(), before);
});

test("bootstrap credentials are explicit in every environment and are trimmed without changing the password", () => {
  for (const env of [
    {},
    { NODE_ENV: "development" },
    { BOOTSTRAP_ADMIN_EMAIL: "mail@example.invalid" },
    { BOOTSTRAP_ADMIN_PASSWORD: randomBytes(24).toString("hex") },
  ])
    assert.throws(() => getBootstrapCredentials(env), /required/);
  const env = credentials();
  assert.deepEqual(
    getBootstrapCredentials({
      ...env,
      BOOTSTRAP_ADMIN_EMAIL: " " + env.BOOTSTRAP_ADMIN_EMAIL + " ",
    }),
    {
      email: env.BOOTSTRAP_ADMIN_EMAIL,
      password: env.BOOTSTRAP_ADMIN_PASSWORD,
    },
  );
});

test("bootstrap refuses missing dependencies and an email already assigned to another active account", async () => {
  const f = bootstrapFixture();
  await assert.rejects(runAdminSeed(f.query, credentials()), /role before/);
  await assert.rejects(actions.up(f.query), /services before/);
  f.rows("roles").push({ id: 1, name: "admin" });
  await assert.rejects(runAdminSeed(f.query, credentials()), /sector before/);
  f.rows("setors").push({ id: 1 });
  const env = credentials();
  await assert.rejects(runAdminSeed(f.query, env), /actions before/);
  f.rows("users").push({
    id: 2,
    role_id: 2,
    email: env.BOOTSTRAP_ADMIN_EMAIL,
    deletedAt: null,
  });
  await assert.rejects(runAdminSeed(f.query, env), /already associated/);
});

test("catalog identity conflicts abort atomically instead of reassigning IDs or replacing actions", async () => {
  const f = await fixtureWithCatalog();
  f.rows("services")[0].module_key = "wrong_module";
  const before = f.snapshot();
  await assert.rejects(catalogs.up(f.query), /different module/);
  assert.deepEqual(f.snapshot(), before);
  await assert.rejects(actions.up(f.query), /services before/);
  f.rows("services")[0].module_key = "usuarios";
  f.rows("permission_actions")[0].service_id = 6;
  await assert.rejects(actions.up(f.query), /unexpected service/);
});

test("initial account and grants roll back together and seed rollback never deletes configured access", async () => {
  const f = await fixtureWithCatalog();
  const before = f.snapshot();
  f.failOn("role_permissions");
  await assert.rejects(runAdminSeed(f.query, credentials()), /SYNTHETIC/);
  assert.deepEqual(f.snapshot(), before);
  for (const seed of [catalogs, actions, admin])
    await assert.rejects(seed.down(), /rollback refused/);
});

test("bootstrap preserves explicit grants already configured before creating the first account", async () => {
  const f = await fixtureWithCatalog();
  f.rows("role_permissions").push({
    id: 1,
    role_id: 1,
    permission_action_id: 1,
    allowed: false,
  });
  await runAdminSeed(f.query, credentials());
  assert.equal(
    f.rows("role_permissions").find((row) => row.permission_action_id === 1)!
      .allowed,
    false,
  );
  assert.equal(f.rows("role_permissions").length, PERMISSION_CATALOG.length);
});
