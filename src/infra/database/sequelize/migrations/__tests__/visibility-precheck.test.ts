import assert from 'node:assert/strict';
import test from 'node:test';
import { precheck } from '../helpers/action-permissions.js';

type Visibility = { id: number; setor_id: number; service_id: number; visibility: number | null };
function fixture(values: Visibility[]) {
  const rows = structuredClone(values);
  let writes = 0;
  const qi: any = {
    describeTable: async () => ({}),
    bulkInsert: async () => { writes++; },
    bulkUpdate: async () => { writes++; },
    bulkDelete: async () => { writes++; },
    sequelize: { query: async (sql: string) => {
      if (!sql.includes('FROM service_visibilities GROUP BY')) return [{ count: 0 }];
      const groups = new Map<string, Visibility[]>();
      for (const row of rows) {
        const key = `${row.setor_id}:${row.service_id}`;
        groups.set(key, [...(groups.get(key) ?? []), row]);
      }
      // Mirror the old aggregate unless SQL explicitly distinguishes conflicting values.
      const conflictsOnly = sql.includes('COUNT(DISTINCT');
      return [{ count: [...groups.values()].filter(group => group.length > 1 &&
        (!conflictsOnly || new Set(group.map(row => row.visibility)).size > 1)).length }];
    } },
  };
  return { qi, rows, writes: () => writes };
}
const row = (id: number, visibility: number | null, service_id = 6, setor_id = 1): Visibility => ({ id, setor_id, service_id, visibility });

for (const value of [1, 0, null]) test(`equivalent visibility duplicates ${value} do not block or mutate legacy rows`, async () => {
  const data = [row(1, value), row(13, value)];
  const f = fixture(data);
  await precheck(f.qi);
  assert.deepEqual(f.rows, data);
  assert.equal(f.writes(), 0);
});

for (const [left, right] of [[0, 1], [null, 1], [null, 0], [null, -1]] as const) test(`conflicting duplicate ${left}/${right} blocks without modifying rows`, async () => {
  const data = [row(1, left), row(13, right)];
  const f = fixture(data);
  await assert.rejects(precheck(f.qi), /service_visibilities conflicting duplicate; count=1; read-only diagnostic/);
  assert.deepEqual(f.rows, data);
  assert.equal(f.writes(), 0);
});

test('count reports conflicting pairs, not redundant pairs or excess rows', async () => {
  const f = fixture([row(1, 1), row(2, 1), row(3, 1, 7), row(4, 0, 7), row(5, null, 7), row(6, null, 8), row(7, null, 8)]);
  await assert.rejects(precheck(f.qi), /service_visibilities conflicting duplicate; count=1/);
  assert.equal(f.writes(), 0);
});
