import assert from "node:assert/strict";
import test from "node:test";
import { compare } from "bcryptjs";
import { QueryInterface } from "sequelize";
import { getBootstrapCredentials, runAdminSeed } from "../20251029130000-admin-user.js";

const makeQueryInterface = (existingAdmin: number | null = null) => {
  const inserted: any[] = [];
  const queryInterface = {
    sequelize: { transaction: async (callback: (transaction: object) => Promise<void>) => callback({}) },
    rawSelect: async (table: string) => {
      if (table === "roles") return 1;
      if (table === "users") return existingAdmin;
      if (table === "setors") return 1;
      return null;
    },
    bulkInsert: async (_table: string, rows: any[]) => { inserted.push(...rows); },
  } as unknown as QueryInterface;
  return { queryInterface, inserted };
};

test("bootstrap creates an admin when only common users exist", async () => {
  const { queryInterface, inserted } = makeQueryInterface(null);
  await runAdminSeed(queryInterface, { NODE_ENV: "production", BOOTSTRAP_ADMIN_EMAIL: "root@example.gov.br", BOOTSTRAP_ADMIN_PASSWORD: "strong-password" });
  assert.equal(inserted[0]?.email, "root@example.gov.br");
  assert.equal(await compare("strong-password", inserted[0]?.password), true);
});

test("bootstrap skips creation when an active admin exists", async () => {
  const { queryInterface, inserted } = makeQueryInterface(42);
  await runAdminSeed(queryInterface, { NODE_ENV: "production" });
  assert.equal(inserted.length, 0);
});

test("bootstrap requires credentials in production", async () => {
  const { queryInterface } = makeQueryInterface(null);
  await assert.rejects(() => runAdminSeed(queryInterface, { NODE_ENV: "production" }), /BOOTSTRAP_ADMIN_EMAIL/);
});

test("bootstrap keeps development-only fallback", () => {
  assert.deepEqual(getBootstrapCredentials({ NODE_ENV: "dev" }), { email: "admin@admin.com", password: "admin" });
});
