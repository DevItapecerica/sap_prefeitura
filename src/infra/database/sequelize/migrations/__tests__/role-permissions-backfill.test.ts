import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSnapshot, catalogForServices, snapshot, rollbackSnapshot, strictTrue, permissionTableNames } from '../helpers/action-permissions.js';
import { accessFixture } from './action-permissions.fixture.js';
import migration from '../20261021091000-backfill-role-action-permissions.js';

test('backfill migration entry points preserve legacy and run the verified snapshot path', async () => {
  const f = accessFixture();
  await migration.up(f.qi);
  assert.equal(f.data.permission_migration_state[0].completed, true);
  await migration.down(f.qi);
  assert.equal(f.data.permission_migration_state[0].completed, false);
  assert.equal(f.data.permissions.length, 1);
});

test('rollback detects divergence when MariaDB returns schema-qualified table descriptors', async () => {
  const f = accessFixture();
  f.qi.showAllTables = async () => Object.keys(f.data).map(tableName => ({ tableName, schema: 'sap_permissions_test' }));
  await snapshot(f.qi);
  f.data.role_permissions[0].allowed = false;
  const before = structuredClone(f.data);
  await assert.rejects(rollbackSnapshot(f.qi), /Unsafe rollback/);
  assert.deepEqual(f.data, before);
});

test('table descriptor normalization refuses invalid metadata and supports both driver representations', async () => {
  assert.deepEqual(await permissionTableNames({ showAllTables: async () => ['roles', { tableName: 'permission_actions', schema: 'sap_permissions_test' }] } as any), ['roles', 'permission_actions']);
  for (const invalid of [null, 1, {}, { tableName: null }]) {
    await assert.rejects(permissionTableNames({ showAllTables: async () => [invalid] } as any), /unsupported table descriptor/);
  }
});

test('strict SQL booleans never treat strings as permission', () => {
  for (const value of ['0', '1', 'false', 'true', null, undefined, 2]) assert.equal(strictTrue(value), false);
  assert.equal(strictTrue(1), true);
  assert.equal(strictTrue(true), true);
});

test('snapshot persists exact matrix once and completed marker prevents resurrection or grants to new roles', async () => {
  const f = accessFixture();
  await snapshot(f.qi);
  assert.equal(f.data.permission_migration_state[0].completed, true);
  const actions = f.data.permission_actions;
  assert.equal(f.data.role_permissions.length, actions.length * 2);
  const cancel = actions.find(a => a.action === 'remover_bolsista');
  const grant = f.data.role_permissions.find(g => g.role_id === 1 && g.permission_action_id === cancel.id);
  assert.equal(grant.allowed, true);
  grant.allowed = false;
  f.data.roles.push({ id: 3 });
  const before = structuredClone(f.data.role_permissions);
  await snapshot(f.qi);
  assert.deepEqual(f.data.role_permissions, before);
  assert.ok(!f.data.role_permissions.some(g => g.role_id === 3));
  assert.equal(f.operations.filter(op => op === 'commit').length, 2);
});

for (const empty of ['services', 'permissions']) test(`migration defers marker when ${empty} have not been seeded`, async () => {
  const f = accessFixture(); f.data[empty] = [];
  await snapshot(f.qi);
  assert.equal(f.data.permission_migration_state[0].completed, false);
  assert.equal(f.data.role_permissions.length, 0);
});

for (const failure of ['insert:role_permissions', 'update:permission_migration_state']) test(`transaction rolls back catalog, grants and marker on ${failure}`, async () => {
  const f = accessFixture(); const before = structuredClone(f.data);
  f.fail(failure);
  await assert.rejects(snapshot(f.qi), /injected/);
  assert.deepEqual(f.data, before);
  assert.equal(f.operations.at(-1), 'rollback');
});

test('resume fills null module keys and reuses matching snapshot rows', async () => {
  const f = accessFixture();
  f.data.services[0].module_key = null;
  f.data.permission_actions.push({ id: 1, service_id: 6, module_key: 'ft', action: 'acessar' });
  f.data.role_permissions.push({ role_id: 1, permission_action_id: 1, allowed: true });
  await snapshot(f.qi);
  assert.equal(f.data.services[0].module_key, 'ft');
  assert.equal(f.data.role_permissions.length, f.data.permission_actions.length * 2);
});

test('snapshot refuses incompatible partial grants instead of overwriting', async () => {
  const f = accessFixture();
  f.data.permission_actions.push({ id: 1, service_id: 6, module_key: 'ft', action: 'acessar' });
  f.data.role_permissions.push({ role_id: 1, permission_action_id: 1, allowed: false });
  await assert.rejects(snapshot(f.qi), /incomplete snapshot differs/);
  assert.equal(f.data.role_permissions[0].allowed, false);
});

test('rollback validates before DELETE, then is repeatable', async () => {
  const f = accessFixture(); await snapshot(f.qi);
  const legacy = structuredClone(f.data.permissions);
  await rollbackSnapshot(f.qi);
  assert.equal(f.data.role_permissions.length, 0);
  assert.equal(f.data.permission_actions.length, 0);
  assert.equal(f.data.permission_migration_state[0].completed, false);
  assert.deepEqual(f.data.permissions, legacy);
  await rollbackSnapshot(f.qi);
});

for (const change of ['grant', 'new action', 'missing action', 'new role', 'grants without marker']) test(`rollback refuses ${change} without DELETE`, async () => {
  const f = accessFixture(); await snapshot(f.qi);
  if (change === 'grant') f.data.role_permissions[0].allowed = false;
  if (change === 'new action') f.data.permission_actions.push({ id: 999, service_id: 6, module_key: 'ft', action: 'futura' });
  if (change === 'missing action') f.data.permission_actions.pop();
  if (change === 'new role') f.data.roles.push({ id: 3 });
  if (change === 'grants without marker') f.data.permission_migration_state[0].completed = false;
  const before = structuredClone(f.data);
  await assert.rejects(rollbackSnapshot(f.qi), /Unsafe rollback/);
  assert.deepEqual(f.data, before);
  assert.ok(!f.operations.some(op => op.startsWith('delete:')));
});

test('snapshot is role based including roles without users; cancellation is edit, deletion is del', () => {
  const actions = catalogForServices([{ id: 6, module_key: 'ft' }, { id: 99, module_key: 'legado_99' }]);
  const grants = buildSnapshot([1, 2, 3], actions.map((a, i) => ({ ...a, id: i + 1 })), [
    { role_id: 1, service_id: 6, read: 1, write: 0, edit: 1, del: 0, deletedAt: null },
    { role_id: 3, service_id: 6, read: 1, write: 0, edit: 1, del: 0, deletedAt: null },
  ]);
  for (const role of [1, 3]) {
    const allowed = (action: string) => grants.find(g => g.role_id === role && actions[g.permission_action_id - 1].action === action)?.allowed;
    assert.equal(allowed('remover_bolsista'), true);
    assert.equal(allowed('excluir_bolsista'), false);
  }
  assert.equal(grants.length, actions.length * 3);
  assert.ok(grants.filter(g => g.role_id === 2).every(g => g.allowed === false));
  assert.ok(grants.every(g => !('user_id' in g)));
  assert.deepEqual(actions.filter(a => a.service_id === 99).map(a => a.action), ['acessar']);
});

test('deleted legacy flags never grant; duplicate active flags and write without read block', () => {
  const a = [{ id: 1, service_id: 6, module_key: 'ft', action: 'remover_bolsista', legacyFlag: 'edit' as const }];
  const p = { role_id: 1, service_id: 6, read: 1, write: 0, edit: 1, del: 0, deletedAt: null };
  assert.equal(buildSnapshot([1], a, [{ ...p, deletedAt: new Date() }])[0].allowed, false);
  assert.throws(() => buildSnapshot([1], a, [p, p]), /duplicate/);
  assert.throws(() => buildSnapshot([1], a, [{ ...p, read: 0 }]), /without read/);
  assert.throws(() => buildSnapshot([1], a, [{ ...p, edit: null }]), /flags/);
});
