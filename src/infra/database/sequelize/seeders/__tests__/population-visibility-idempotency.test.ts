import assert from 'node:assert/strict';
import test from 'node:test';
import seed from '../20251029125003-population-db-permissions-visibilities.js';

test('population seed preserves existing sector/service visibility with a different surrogate id', async () => {
  const visibilities = Array.from({ length: 7 }, (_, index) => ({ id: index + 1, setor_id: 1, service_id: index + 1, visibility: index === 6 ? false : true }));
  const original = structuredClone(visibilities);
  const qi: any = {
    rawSelect: async (table: string, { where }: any) => {
      if (table !== 'service_visibilities') return 1;
      return visibilities.find(row => Object.entries(where).every(([key, value]) => (row as any)[key] === value))?.id ?? null;
    },
    bulkInsert: async (table: string, rows: any[]) => {
      if (table === 'service_visibilities') visibilities.push(...rows);
    },
  };
  await seed.up(qi);
  await seed.up(qi);
  assert.deepEqual(visibilities, original);
  assert.equal(visibilities.filter(row => row.setor_id === 1 && row.service_id === 7).length, 1);
  assert.equal(visibilities.find(row => row.service_id === 7)?.visibility, false);
});
