import assert from 'node:assert/strict';
import test from 'node:test';
import migration from '../20261021090000-create-action-permissions.js';
import { ddlFixture } from './action-permissions-ddl.fixture.js';

test('clean migration defers only composite CASCADE FK while module_key is nullable, including reruns', async () => {
  const f = ddlFixture(); f.setServices([]);
  await migration.up(f.qi);
  assert.equal(f.tables.services.find(c => c.Field === 'module_key').Null, 'YES');
  assert.equal(f.fks.fk_permission_actions_service_module, undefined);
  assert.deepEqual(Object.keys(f.fks).sort(), ['fk_role_permissions_action', 'fk_role_permissions_role']);
  assert.ok(!f.operations.includes('changeColumn:module_key'));
  const before = f.operations.length;
  await migration.up(f.qi);
  assert.equal(f.operations.length, before);
});

test('populated migration closes module_key nullability before composite CASCADE FK', async () => {
  const f = ddlFixture(); await migration.up(f.qi);
  assert.ok(f.operations.indexOf('changeColumn:module_key') < f.operations.indexOf('addConstraint:fk_permission_actions_service_module'));
  assert.ok(f.fks.fk_permission_actions_service_module.every(c => c.update_rule === 'CASCADE' && c.delete_rule === 'RESTRICT'));
});

test('DDL resume and down handle MariaDB schema-qualified table descriptors', async () => {
  const f = ddlFixture();
  f.qi.showAllTables = async () => Object.keys(f.tables).map(tableName => ({ tableName, schema: 'sap_permissions_test' }));
  await migration.up(f.qi);
  const before = f.operations.length;
  await migration.up(f.qi);
  assert.equal(f.operations.length, before);
  f.setState([{ id: 1, completed: true }]);
  await assert.rejects(migration.down(f.qi), /snapshot completed/);
  f.setState([{ id: 1, completed: false }]);
  await migration.down(f.qi);
  assert.ok(!('permission_actions' in f.tables));
});

test('DDL creates exact tables/indexes/composite FK and resumes every compatible partial object', async () => {
  const f = ddlFixture(); await migration.up(f.qi);
  assert.deepEqual(Object.keys(f.tables), ['services', 'roles', 'permission_actions', 'role_permissions', 'permission_migration_state']);
  assert.equal(f.indexes.services.length, 2);
  assert.deepEqual(f.fks.fk_permission_actions_service_module.map(c => c.column_name), ['service_id', 'module_key']);
  assert.deepEqual(f.fks.fk_permission_actions_service_module.map(c => c.referenced_column_name), ['id', 'module_key']);
  const before = f.operations.length;
  await migration.up(f.qi);
  assert.equal(f.operations.length, before);
  f.indexes.role_permissions.pop();
  delete f.fks.fk_role_permissions_role;
  await migration.up(f.qi);
  assert.ok(f.operations.slice(before).includes('addIndex:idx_role_permissions_action'));
  assert.ok(f.operations.slice(before).includes('addConstraint:fk_role_permissions_role'));
});

for (const divergence of ['column', 'collation', 'nullability', 'default', 'null default', 'primary key', 'index fields', 'index unique', 'fk target', 'fk delete', 'extra column', 'singleton']) test(`DDL rejects existing ${divergence} divergence`, async () => {
  const f = ddlFixture(); await migration.up(f.qi);
  if (divergence === 'column') f.tables.role_permissions[1].Type = 'bigint';
  if (divergence === 'collation') f.tables.permission_actions[2].Collation = 'ascii_general_ci';
  if (divergence === 'nullability') f.tables.permission_actions[2].Null = 'YES';
  if (divergence === 'default') f.tables.role_permissions.find(c => c.Field === 'allowed').Default = 1;
  if (divergence === 'null default') f.tables.role_permissions.find(c => c.Field === 'allowed').Default = null;
  if (divergence === 'primary key') f.tables.role_permissions[1].Key = 'PRI';
  if (divergence === 'index fields') f.indexes.services[0].fields = [{ attribute: 'id' }];
  if (divergence === 'index unique') f.indexes.services[0].unique = false;
  if (divergence === 'fk target') f.fks.fk_permission_actions_service_module[0].referenced_table_name = 'roles';
  if (divergence === 'fk delete') f.fks.fk_role_permissions_role[0].delete_rule = 'CASCADE';
  if (divergence === 'extra column') f.tables.role_permissions.push({ Field: 'user_id' });
  if (divergence === 'singleton') f.setState([{ id: 2, completed: false }]);
  await assert.rejects(migration.up(f.qi), /mismatch|unexpected|invalid singleton/);
});

test('structural down refuses data before any DROP and is repeatable after snapshot down', async () => {
  const f = ddlFixture(); await migration.up(f.qi);
  f.setState([{ id: 1, completed: true }]);
  await assert.rejects(migration.down(f.qi), /snapshot completed/);
  assert.ok(!f.operations.some(op => op.startsWith('dropTable:')));
  f.setState([{ id: 1, completed: false }]);
  await migration.down(f.qi);
  assert.deepEqual(f.operations.filter(op => op.startsWith('dropTable:')), ['dropTable:role_permissions', 'dropTable:permission_actions', 'dropTable:permission_migration_state']);
  await migration.down(f.qi);
});

test('duplicate visibility diagnostic points to read-only SQL and stops before DDL', async () => {
  let ddl = 0;
  const qi: any = {
    sequelize: { query: async (sql: string) => [{ count: sql.includes('GROUP BY setor_id,service_id') ? 1 : 0 }] },
    describeTable: async () => ({}),
    addColumn: async () => { ddl++; },
  };
  await assert.rejects(migration.up(qi), /service_visibilities conflicting duplicate; count=1; read-only diagnostic: scripts\/sql\/diagnose-permission-visibilities\.sql/);
  assert.equal(ddl, 0);
});

test('prechecks abort on technical counts before any DDL; never echo returned data', async () => {
  let ddl = 0;
  const qi: any = {
    describeTable: async () => ({}),
    sequelize: { query: async () => [{ count: 2, email: 'private@example.test' }] },
    addColumn: async () => ddl++, createTable: async () => ddl++,
  };
  await assert.rejects(migration.up(qi), e => {
    assert.match(String(e), /permissions.*2/);
    assert.doesNotMatch(String(e), /private/);
    return true;
  });
  assert.equal(ddl, 0);
});
