import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { configurePermissionsTestEnvironment } from './permissions-test-target.js';

try { configurePermissionsTestEnvironment(); }
catch (error) { console.error((error as Error).message); process.exit(1); }

const { default: db } = await import('../src/infra/database/sequelize/index.js');
const { SequelizeActionPermissionRepository } = await import('../src/infra/database/sequelize/repositories/sequelize.action-permission.repository.js');
const { AuthorizationUseCase } = await import('../src/modules/acess-controll/application/authorization.usecase.js');
const { hash } = await import('bcryptjs');
const roles: number[] = [];
let user: any;
let sector: any;
const grants = db.RolePermissionsModel as any;
const originalCreate = grants.create;
const plain = (row: any) => row.get({ plain: true });

try {
  await db.sequelize.authenticate();
  const manager = await db.UserModel.findOne({ where: { email: 'permissions@example.invalid' } });
  assert.ok(manager, 'Requires the synthetic bootstrap administrator from the disposable DB harness');
  const actorId = Number(manager.get('id'));
  const repository = new SequelizeActionPermissionRepository(db);
  const authorization = new AuthorizationUseCase(repository);
  const actions = await db.PermissionActionModel.findAll({ where: { module_key: 'ft' } });
  const actionId = (action: string) => Number(actions.find((row: any) => row.get('action') === action)!.get('id'));
  const role = await db.RolesModel.create({ name: `runtime_${randomUUID().slice(0, 8)}` });
  const roleId = Number(role.get('id')); roles.push(roleId);
  const other = await db.RolesModel.create({ name: `runtime_${randomUUID().slice(0, 8)}` });
  const otherRoleId = Number(other.get('id')); roles.push(otherRoleId);
  const first = actionId('remover_bolsista'); const second = actionId('editar_vinculo');
  const before = await grants.findAll({ where: { role_id: roleId } });
  let writes = 0;
  // Inject an external failure only after a real SQL write. The repository is unchanged.
  grants.create = async function (values: any, options: any) {
    writes += 1;
    if (writes === 2) throw new Error('INJECTED_SECOND_SQL_WRITE_FAILURE');
    assert.ok(options.transaction, 'SQL grant writes must participate in the transaction');
    return originalCreate.call(this, values, options);
  };
  try {
    await assert.rejects(repository.update(actorId, roleId, [
      { permission_action_id: first, allowed: true }, { permission_action_id: second, allowed: true },
    ]), /INJECTED_SECOND_SQL_WRITE_FAILURE/);
    assert.equal(writes, 2);
    assert.deepEqual((await grants.findAll({ where: { role_id: roleId } })).map(plain), before.map(plain));
  } finally { grants.create = originalCreate; }
  console.log('PASS atomicidade administrativa: falha na segunda escrita reverte a primeira SQL real');
  await Promise.all([first, second].map(permission_action_id => repository.update(actorId, roleId, [{ permission_action_id, allowed: true }])));
  const persisted = await grants.findAll({ where: { role_id: roleId } });
  assert.equal(persisted.length, 2);
  assert.ok(persisted.every((row: any) => row.get('allowed') === true));
  const unchanged = await repository.update(actorId, roleId, [{ permission_action_id: first, allowed: true }]);
  assert.deepEqual(unchanged.changes, []);
  console.log('PASS concorrência administrativa: alterações paralelas preservadas sem duplicação; repetição idempotente');
  await repository.update(actorId, roleId, [{ permission_action_id: actionId('acessar'), allowed: true }]);
  user = await db.UserModel.create({
    name: 'Pessoa sintética runtime', email: `runtime_${randomUUID()}@example.invalid`,
    ramal: '0000', password: await hash(randomUUID(), 4), setor_id: manager.get('setor_id'), role_id: roleId, firstLogin: false,
  });
  const id = Number(user.get('id'));
  await authorization.authorize(id, 'ft', 'remover_bolsista');
  await assert.rejects(authorization.authorize(id, 'ft', 'excluir_bolsista'), (error: any) => error.statusCode === 403);
  await user.update({ role_id: otherRoleId });
  assert.deepEqual(await repository.effective(id), []);
  await assert.rejects(authorization.authorize(id, 'ft', 'remover_bolsista'), (error: any) => error.statusCode === 403);
  await user.update({ role_id: roleId });
  await authorization.authorize(id, 'ft', 'remover_bolsista');
  sector = await db.SetorModel.create({ name: `runtime_${randomUUID().slice(0, 8)}` });
  await user.update({ setor_id: sector.get('id') });
  assert.deepEqual(await repository.effective(id), []);
  await assert.rejects(authorization.authorize(id, 'ft', 'remover_bolsista'), (error: any) => error.statusCode === 403);
  const visibility = await db.ServiceVisibilities.create({ setor_id: sector.get('id'), service_id: 6, visibility: false });
  await assert.rejects(authorization.authorize(id, 'ft', 'remover_bolsista'), (error: any) => error.statusCode === 403);
  await visibility.update({ visibility: true });
  await authorization.authorize(id, 'ft', 'remover_bolsista');
  const service = await db.ServiceModel.findByPk(6);
  assert.ok(service);
  try {
    await service.destroy();
    assert.deepEqual(await repository.effective(id), []);
    await assert.rejects(authorization.authorize(id, 'ft', 'remover_bolsista'), (error: any) => error.statusCode === 403);
  } finally { await service.restore(); }
  await authorization.authorize(id, 'ft', 'remover_bolsista');
  assert.equal(await repository.roleExists(2147483647), false);
  console.log('PASS runtime persistido: setor atual, visibilidade ausente/false e serviço excluído negam acesso');
  await repository.update(actorId, roleId, [{ permission_action_id: first, allowed: false }]);
  await assert.rejects(authorization.authorize(id, 'ft', 'remover_bolsista'), (error: any) => error.statusCode === 403);
  await user.destroy();
  await assert.rejects(authorization.authorize(id, 'ft', 'editar_vinculo'), (error: any) => error.statusCode === 401);
  console.log('PASS runtime persistido: role atual, revogação, ações independentes e usuário excluído');
} catch (error) {
  console.error(`PERMISSIONS_RUNTIME_FAILED: ${error instanceof Error ? error.name : 'UnknownError'}`);
  if (error instanceof Error && error.name === 'AssertionError') console.error(error.stack);
  process.exitCode = 1;
} finally {
  grants.create = originalCreate;
  if (user) await user.destroy({ force: true });
  if (sector) {
    await db.ServiceVisibilities.destroy({ where: { setor_id: sector.get('id') } });
    await sector.destroy();
  }
  for (const role_id of roles) {
    await grants.destroy({ where: { role_id } });
    await db.RolesModel.destroy({ where: { id: role_id } });
  }
  await db.sequelize.close();
}
