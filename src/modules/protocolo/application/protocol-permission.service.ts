import AppError from "../../../core/appError.js";
import { assertProtocolCapabilitiesMutable, assertProtocolCapability, normalizeProtocolCapabilities, ProtocolCapabilities, ProtocolCapability } from "../domain/protocol-capability.js";
import { protocolModels } from "../infra/protocol-model-registry.js";

export class ProtocolPermissionService {
  async getForRole(roleId: number): Promise<ProtocolCapabilities> {
    if (roleId === 1) return normalizeProtocolCapabilities(roleId);
    const permission = await protocolModels().ProtocolRolePermissionModel.findOne({ where: { roleId }, attributes: ["manageCatalog", "triage", "route", "decide", "viewSector", "export", "managePrivacy", "viewRestricted", "viewOperations"] });
    return normalizeProtocolCapabilities(roleId, permission?.get({ plain: true }) ?? null);
  }

  async authorize(roleId: number, capability: ProtocolCapability): Promise<void> {
    assertProtocolCapability(roleId, await this.getForRole(roleId), capability);
  }

  async list(): Promise<unknown[]> {
    const m = protocolModels();
    const [roles, permissions] = await Promise.all([
      m.RolesModel.findAll({ attributes: ["id", "name"], order: [["id", "ASC"]] }),
      m.ProtocolRolePermissionModel.findAll(),
    ]);
    const byRole = new Map(permissions.map((permission) => [Number(permission.roleId), permission.get({ plain: true })]));
    return roles.map((role) => ({ roleId: Number(role.id), role: role.get({ plain: true }), ...normalizeProtocolCapabilities(Number(role.id), byRole.get(Number(role.id))) }));
  }

  async update(roleId: number, capabilities: ProtocolCapabilities): Promise<unknown> {
    assertProtocolCapabilitiesMutable(roleId, capabilities);
    const role = await protocolModels().RolesModel.findByPk(roleId);
    if (!role) throw new AppError("Papel nao encontrado", 404, "ROLE_NOT_FOUND");
    const [permission] = await protocolModels().ProtocolRolePermissionModel.findOrCreate({ where: { roleId }, defaults: { roleId, ...capabilities } });
    await permission.update(capabilities);
    return permission;
  }
}
