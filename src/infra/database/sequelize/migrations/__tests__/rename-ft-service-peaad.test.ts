import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { QueryInterface } from 'sequelize';
import migration from '../20261027120000-rename-ft-service-peaad.js';

test('PEAAD migration renames only the ft service without changing identity or grants and can run twice', async () => {
  const fullName = 'PEAAD - PROGRAMA EMERGENCIAL E ASSISTENCIAL DE AUXÍLIO DESEMPREGO';
  const services = [
    { id: 42, module_key: 'ft', name: 'PEEAD - PROGRAMA EMERGENCIAL E ASSISTENCIAL DE AUXÍLIO DESEMPREGO', url: '/services/42/ft-app', tag: 'FT-App', deletedAt: null },
    { id: 6, module_key: 'esporte', name: 'Esporte', url: '/esporte', tag: 'Esporte', deletedAt: null },
  ];
  const before = structuredClone(services);
  const transaction = {};
  const q = {
    sequelize: { transaction: async (run: (t: object) => Promise<void>) => run(transaction) },
    bulkUpdate: async (table: string, values: object, where: Record<string, unknown>, options: { transaction: object }) => {
      assert.equal(table, 'services');
      assert.equal(options.transaction, transaction);
      assert.deepEqual(Object.keys(values), ['name']);
      for (const row of services) {
        if (Object.entries(where).every(([key, value]) => row[key as keyof typeof row] === value)) Object.assign(row, values);
      }
    },
  } as unknown as QueryInterface;
  await migration.up(q);
  await migration.up(q);
  assert.deepEqual(services, [{ ...before[0], name: fullName }, before[1]]);
  await migration.down(q);
  assert.deepEqual(services, before);
  services[0]!.name = 'Nome personalizado posterior';
  await migration.down(q);
  assert.equal(services[0]!.name, 'Nome personalizado posterior');
});
