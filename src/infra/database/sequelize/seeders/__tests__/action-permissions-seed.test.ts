import assert from 'node:assert/strict';
import test from 'node:test';
import seed from '../20261021092000-ensure-action-permissions.js';
import { accessFixture } from '../../migrations/__tests__/action-permissions.fixture.js';

test('clean migrations defer completion; final seed fills module keys, snapshots and closes nullable bootstrap', async () => {
  const f = accessFixture();
  f.data.services[0].module_key = null;
  await seed.up(f.qi);
  assert.equal(f.data.services[0].module_key, 'ft');
  assert.equal(f.data.permission_migration_state[0].completed, true);
  assert.equal(f.columns.module_key.allowNull, false);
  assert.deepEqual(f.fks.fk_permission_actions_service_module.map(c => c.referenced_column_name), ['id', 'module_key']);
  assert.ok(f.fks.fk_permission_actions_service_module.every(c => c.update_rule === 'CASCADE' && c.delete_rule === 'RESTRICT'));
  assert.ok(f.operations.indexOf('commit') < f.operations.indexOf('changeColumn'));
  assert.ok(f.operations.indexOf('changeColumn') < f.operations.indexOf('addConstraint:fk_permission_actions_service_module'));
  const trueGrant = f.data.role_permissions.find(g => g.allowed);
  trueGrant.allowed = false;
  f.data.roles.push({ id: 3 });
  const before = structuredClone(f.data.role_permissions);
  await seed.up(f.qi);
  assert.deepEqual(f.data.role_permissions, before);
});

test('final seed resumes interrupted FK creation after NOT NULL without resetting revoked grants', async () => {
  const f = accessFixture();
  f.fail('constraint:fk_permission_actions_service_module');
  await assert.rejects(seed.up(f.qi), /injected failure/);
  assert.equal(f.columns.module_key.allowNull, false);
  assert.equal(f.data.permission_migration_state[0].completed, true);
  f.data.role_permissions.find(g => g.allowed).allowed = false;
  const before = structuredClone(f.data.role_permissions);
  f.fail('');
  await seed.up(f.qi);
  assert.deepEqual(f.data.role_permissions, before);
  assert.equal(f.operations.filter(op => op === 'changeColumn').length, 1);
  assert.ok(f.fks.fk_permission_actions_service_module);
});

test('final seed rejects existing FK rules instead of weakening the final schema', async () => {
  const f = accessFixture(); await seed.up(f.qi);
  f.fks.fk_permission_actions_service_module[0].update_rule = 'RESTRICT';
  await assert.rejects(seed.up(f.qi), /FK mismatch/);
});

test('final seed snapshots absent legacy flags as false without user-based conditions', async () => {
  const f = accessFixture(); f.data.permissions = [];
  await seed.up(f.qi);
  assert.equal(f.data.permission_migration_state[0].completed, true);
  assert.ok(f.data.role_permissions.length > 0);
  assert.ok(f.data.role_permissions.every(g => g.allowed === false));
});

test('seed leaves inactive services inactive and includes only acessar for unmapped services', async () => {
  const f = accessFixture();
  f.data.services.push({ id: 99, module_key: null, deletedAt: new Date('2026-01-01') });
  await seed.up(f.qi);
  assert.deepEqual(f.data.permission_actions.filter(a => a.service_id === 99).map(a => a.action), ['acessar']);
  assert.equal(f.data.services[1].deletedAt.getTime(), new Date('2026-01-01').getTime());
});

test('seed down uses safe snapshot comparison, not wholesale deletion', async () => {
  const f = accessFixture(); await seed.up(f.qi);
  f.data.role_permissions[0].allowed = false;
  await assert.rejects(seed.down(f.qi), /Unsafe rollback/);
  assert.ok(f.data.role_permissions.length > 0);
});

test('final seed performs no destructive grant reset in its entry point', async () => {
  let connected = false;
  await assert.rejects(seed.up({ sequelize: { query: async () => { connected = true; throw new Error('stop at precheck'); } } } as any), /stop at precheck/);
  assert.equal(connected, true);
});
