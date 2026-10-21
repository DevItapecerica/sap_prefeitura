import { ForeignKeyConstraintError, UniqueConstraintError, Op, Transaction } from 'sequelize';
import db from '../index.js';
import AppError from '../../../../core/appError.js';
import {parseGrantBody, positiveId} from '../../../../modules/permission/application/use-case/action-permissions.js';
import { AuthorizationUseCase, AuthorizationRepository } from '../../../../modules/acess-controll/application/authorization.usecase.js';

export type GrantInput = {permission_action_id: number; allowed: boolean};
export type PermissionPage = {service_id?: number; role_id?: number; page: number; limit: number};
const plain = (row: any) => row.get ? row.get({plain: true}) : row;
export class SequelizeActionPermissionRepository implements AuthorizationRepository {
  constructor(private readonly database: typeof db = db, private readonly transaction?: Transaction) {}
  private options() { return this.transaction ? {transaction: this.transaction, lock: this.transaction.LOCK.UPDATE} : {}; }
  async user(id: number) {
    const row = await this.database.UserModel.findByPk(id, this.options());
    return row ? plain(row) : null;
  }
  async roleExists(id: number) { return Boolean(await this.database.RolesModel.findByPk(id, this.options())); }
  async service(module: string) {
    const row = await this.database.ServiceModel.findOne({where: {module_key: module}, ...this.options()});
    return row ? {id: Number(plain(row).id), module: plain(row).module_key} : null;
  }
  async visible(setorId: number, serviceId: number) {
    const row = await this.database.ServiceVisibilities.findOne({where: {setor_id: setorId, service_id: serviceId}, ...this.options()});
    return !!row && plain(row).visibility === true;
  }
  async actions(roleId: number, serviceId: number): Promise<string[]> {
    const catalog = await this.database.PermissionActionModel.findAll({where: {service_id: serviceId}, order: [['id', 'ASC']], ...this.options()});
    const ids = catalog.map((row: any) => Number(plain(row).id));
    if (!ids.length) return [];
    const rows = await this.database.RolePermissionsModel.findAll({where: {role_id: roleId, permission_action_id: {[Op.in]: ids}}, order: [['permission_action_id','ASC']], ...this.options()});
    const allowed = new Set(rows.filter((r: any) => plain(r).allowed === true).map((r: any) => Number(plain(r).permission_action_id)));
    return catalog.filter((r: any) => allowed.has(Number(plain(r).id))).map((r: any) => plain(r).action);
  }
  private async effectiveServices(userId: number) {
    const user = await this.user(userId);
    if (!user) throw new AppError('Unauthenticated user', 401, 'UNAUTHENTICATED');
    if (!await this.roleExists(user.role_id)) throw new AppError('Not permitted', 403, 'NOT_PERMITTED');
    if (user.setor_id == null) return [];
    const [serviceRows, visibilityRows] = await Promise.all([
      this.database.ServiceModel.findAll({ order: [['id', 'ASC']], ...this.options() }),
      this.database.ServiceVisibilities.findAll({ where: { setor_id: user.setor_id, visibility: true }, ...this.options() }),
    ]);
    const visibleIds = new Set(visibilityRows.filter((row: any) => plain(row).visibility === true).map((row: any) => Number(plain(row).service_id)));
    const services = serviceRows.map(plain).filter((service: any) => visibleIds.has(Number(service.id)));
    const catalog = await this.database.PermissionActionModel.findAll({
      where: { service_id: { [Op.in]: services.map((service: any) => service.id) } },
      order: [['id', 'ASC']], ...this.options(),
    });
    const grants = await this.database.RolePermissionsModel.findAll({
      where: { role_id: user.role_id, permission_action_id: { [Op.in]: catalog.map((row: any) => plain(row).id) }, allowed: true },
      order: [['permission_action_id', 'ASC']], ...this.options(),
    });
    const allowedIds = new Set(grants.filter((row: any) => plain(row).allowed === true).map((row: any) => Number(plain(row).permission_action_id)));
    const actionsByService = new Map<number, string[]>();
    for (const row of catalog) {
      const action = plain(row);
      if (!allowedIds.has(Number(action.id))) continue;
      const serviceId = Number(action.service_id);
      const actions = actionsByService.get(serviceId) ?? [];
      actions.push(action.action);
      actionsByService.set(serviceId, actions);
    }
    return services.flatMap((service: any) => {
      const actions = actionsByService.get(Number(service.id)) ?? [];
      if (!actions.includes('acessar')) return [];
      const { module_key, ...metadata } = service;
      return [{ ...metadata, module: module_key, actions }];
    });
  }
  async effective(userId: number): Promise<{service_id: number; module: string; actions: string[]}[]> {
    return (await this.effectiveServices(userId)).map((service: any) => ({service_id: service.id, module: service.module, actions: service.actions}));
  }
  async visibleServices(userId: number) {
    return this.effectiveServices(userId);
  }
  async catalog(query: PermissionPage) {
    const services = await this.database.ServiceModel.findAll({attributes: ['id'], ...this.options()});
    const ids = services.map((r: any) => Number(plain(r).id)).filter((id: number) => !query.service_id || id === query.service_id);
    const where = {service_id: {[Op.in]: ids}};
    const result = await this.database.PermissionActionModel.findAndCountAll({where, offset: query.page * query.limit, limit: query.limit, order: [['id','ASC']], ...this.options()});
    return {permission: result.rows.map((r: any) => {const a = plain(r); return {id: a.id, service_id: a.service_id, module: a.module_key, action: a.action};}), count: result.count};
  }
  async list(query: PermissionPage) {
    if (!await this.roleExists(query.role_id!)) throw new AppError('Role not found', 404, 'ROLE_NOT_FOUND');
    const catalog = await this.catalog(query);
    const rows = await this.database.RolePermissionsModel.findAll({where: {role_id: query.role_id, permission_action_id: {[Op.in]: catalog.permission.map((a: any) => a.id)}}, ...this.options()});
    const grants = new Map(rows.map((r: any) => { const a = plain(r); return [Number(a.permission_action_id), a.allowed === true]; }));
    return {permission: catalog.permission.map((a: any) => ({permission_action_id: a.id, role_id: query.role_id, service_id: a.service_id, module: a.module, action: a.action, allowed: grants.get(Number(a.id)) === true})), count: catalog.count};
  }
  async update(actorId: number, roleId: number, permissions: GrantInput[]) {
    positiveId(actorId); positiveId(roleId);
    permissions = parseGrantBody({permissions});
    try { return await this.database.sequelize.transaction(async transaction => {
      const repository = new SequelizeActionPermissionRepository(this.database, transaction);
      const actor = await repository.user(actorId);
      if (!actor) throw new AppError('Unauthenticated user', 401, 'UNAUTHENTICATED');
      // All writers lock both affected roles in the same order, including the actor role.
      for (const id of [...new Set([Number(actor.role_id), roleId])].sort((a,b) => a-b)) {
        const exists = await repository.roleExists(id);
        if (!exists) throw new AppError(id === roleId ? 'Role not found' : 'Not permitted', id === roleId ? 404 : 403, id === roleId ? 'ROLE_NOT_FOUND' : 'NOT_PERMITTED');
      }
      await new AuthorizationUseCase(repository).authorize(actorId, 'servicos', 'gerenciar_permissoes');
      const ordered = [...permissions].sort((a,b) => a.permission_action_id - b.permission_action_id);
      const catalog = await this.database.PermissionActionModel.findAll({where: {id: {[Op.in]: ordered.map(p => p.permission_action_id)}}, order: [['id','ASC']], transaction, lock: transaction.LOCK.UPDATE});
      if (catalog.length !== ordered.length) throw new AppError('Unknown permission action', 400, 'INVALID_PERMISSION_ACTION');
      const changes: {permission_action_id: number; before: boolean; after: boolean}[] = [];
      for (const input of ordered) {
        const where = {role_id: roleId, permission_action_id: input.permission_action_id};
        const row = await this.database.RolePermissionsModel.findOne({where, transaction, lock: transaction.LOCK.UPDATE});
        const before = row ? plain(row).allowed === true : false;
        if (before === input.allowed) continue;
        if (row) await row.update({allowed: input.allowed}, {transaction});
        else await this.database.RolePermissionsModel.create({...where, allowed: input.allowed}, {transaction});
        changes.push({permission_action_id: input.permission_action_id, before, after: input.allowed});
      }
      return {role_id: roleId, changes};
    }); } catch (error) {
      if (error instanceof ForeignKeyConstraintError || error instanceof UniqueConstraintError)
        throw new AppError('Permission integrity conflict', 409, 'PERMISSION_CONFLICT');
      throw error;
    }
  }
}
