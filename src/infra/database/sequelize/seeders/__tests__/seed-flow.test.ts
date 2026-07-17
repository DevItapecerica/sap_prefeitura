import assert from "node:assert/strict";
import test from "node:test";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QueryInterface } from "sequelize";
import auditServiceSeed from "../20260715121000-add-audit-service-access.js";
import removeChamadosServiceSeed from "../20260715122000-remove-chamados-service-access.js";

test("seed filenames preserve dependency order", async () => {
  const seedersDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const files = (await readdir(seedersDir)).filter((file) => file.endsWith(".ts")).sort();
  const positions = [
    "20251028174945-admin-setor.ts",
    "20251028194711-create-services.ts",
    "20251029125003-population-db-permissions-visibilities.ts",
    "20251029130000-admin-user.ts",
    "20260602091000-add-municipe-service-access.ts",
    "20260602101000-add-esporte-service-access.ts",
    "20260715121000-add-audit-service-access.ts",
    "20260715122000-remove-chamados-service-access.ts",
  ].map((file) => files.indexOf(file));
  assert.equal(positions.every((position) => position >= 0), true);
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
});

test("audit service seed is idempotent", async () => {
  const services = new Set<number>();
  const permissions = new Set<string>();
  const visibilities = new Set<string>();
  const queryInterface = {
    sequelize: {
      transaction: async (callback: (transaction: object) => Promise<void>) => callback({}),
      query: async (sql: string) => sql.includes("FROM roles")
        ? [{ id: 1, name: "admin" }, { id: 2, name: "user" }]
        : [{ id: 1 }, { id: 2 }],
    },
    rawSelect: async (table: string, options: any) => {
      const where = options.where;
      if (table === "services") return services.has(Number(where.id)) ? where.id : null;
      if (table === "permissions") return permissions.has(`${where.role_id}:${where.service_id}`) ? 1 : null;
      if (table === "service_visibilities") return visibilities.has(`${where.setor_id}:${where.service_id}`) ? 1 : null;
      return null;
    },
    bulkInsert: async (table: string, rows: any[]) => {
      for (const row of rows) {
        if (table === "services") services.add(Number(row.id));
        if (table === "permissions") permissions.add(`${row.role_id}:${row.service_id}`);
        if (table === "service_visibilities") visibilities.add(`${row.setor_id}:${row.service_id}`);
      }
    },
  } as unknown as QueryInterface;

  await auditServiceSeed.up(queryInterface);
  await auditServiceSeed.up(queryInterface);
  assert.equal(services.size, 1);
  assert.equal(permissions.size, 2);
  assert.equal(visibilities.size, 2);
});

test("chamados cleanup removes dependents before the retired service", async () => {
  const deleted: Array<{ table: string; where: object }> = [];
  const queryInterface = {
    sequelize: {
      transaction: async (callback: (transaction: object) => Promise<void>) => callback({}),
    },
    bulkDelete: async (table: string, where: object) => {
      deleted.push({ table, where });
    },
  } as unknown as QueryInterface;

  await removeChamadosServiceSeed.up(queryInterface);
  await removeChamadosServiceSeed.up(queryInterface);

  assert.deepEqual(deleted.map(({ table }) => table), [
    "service_visibilities",
    "permissions",
    "services",
    "service_visibilities",
    "permissions",
    "services",
  ]);
  assert.equal(deleted.every(({ where }) => (where as any).service_id === 8 || (where as any).id === 8), true);
});
