import assert from "node:assert/strict";
import test from "node:test";
import { DataTypes, Sequelize } from "sequelize";
import permissionModel from "../models/permission.model.js";
import permissionActionModel from "../models/permission-action.model.js";
import rolePermissionModel from "../models/role-permission.model.js";
import rolesModel from "../models/roles.model.js";
import serviceVisibilityModel from "../models/service-visibility.model.js";
import serviceModel from "../models/service.model.js";
import setorModel from "../models/setor.model.js";
import userSessionModel from "../models/user-session.model.js";
import userModel from "../models/user.model.js";
import atletaModel from "../models/atleta.model.js";
import carterinhaEsporteModel from "../models/carterinhaEsporte.model.js";
import carterinhaModel from "../models/carterinhas.model.js";

test("access models expose the database relationships", async () => {
  const sequelize = new Sequelize("database", "username", "password", {
    dialect: "mariadb",
    logging: false,
  });

  const models: any = {};
  for (const defineModel of [
    permissionModel,
    permissionActionModel,
    rolePermissionModel,
    rolesModel,
    serviceVisibilityModel,
    serviceModel,
    setorModel,
    userSessionModel,
    userModel,
  ]) {
    const model = defineModel(sequelize, DataTypes);
    models[model.name] = model;
  }

  for (const model of Object.values(models) as any[]) {
    model.associate?.(models);
  }

  assert.ok(models.ServiceModel.options.indexes.some((i: any) => i.unique && JSON.stringify(i.fields) === JSON.stringify(['id', 'module_key'])));
  assert.equal(models.PermissionActionModel.rawAttributes.id.primaryKey, true);
  assert.equal(models.PermissionActionModel.rawAttributes.service_id.allowNull, false);
  assert.equal(models.PermissionActionModel.getTableName(), 'permission_actions');
  assert.equal(models.RolePermissionsModel.getTableName(), 'role_permissions');
  for (const field of ['role_id', 'permission_action_id']) {
    assert.equal(models.RolePermissionsModel.rawAttributes[field].onDelete, 'RESTRICT');
    assert.equal(models.RolePermissionsModel.rawAttributes[field].onUpdate, 'CASCADE');
    assert.equal(models.RolePermissionsModel.rawAttributes[field].allowNull, false);
  }
  assert.equal(models.PermissionActionModel.options.paranoid, false);
  assert.equal(models.RolePermissionsModel.options.paranoid, false);
  assert.equal(models.PermissionActionModel.rawAttributes.module_key.allowNull, false);
  assert.equal(models.ServiceModel.rawAttributes.module_key.allowNull, false);
  assert.equal(models.RolePermissionsModel.rawAttributes.allowed.defaultValue, false);
  assert.equal(models.RolePermissionsModel.associations.role.target, models.RolesModel);
  assert.equal(models.RolePermissionsModel.associations.permissionAction.target, models.PermissionActionModel);
  assert.equal(models.ServiceModel.associations.permissionActions.target, models.PermissionActionModel);
  assert.equal(models.RolesModel.associations.rolePermissions.target, models.RolePermissionsModel);
  assert.equal(models.UserModel.associations.setor.target, models.SetorModel);
  assert.equal(models.UserModel.associations.role.target, models.RolesModel);
  assert.equal(models.UserModel.associations.sessions.target, models.UserSessionModel);
  assert.equal(models.PermissionsModel.associations.service.target, models.ServiceModel);
  assert.equal(models.ServiceVisibilities.associations.setor.target, models.SetorModel);
  assert.equal(models.ServiceVisibilities.associations.service.target, models.ServiceModel);
  assert.deepEqual(models.UserModel.rawAttributes.setor_id.references, {
    model: "setors",
    key: "id",
  });
  assert.deepEqual(models.PermissionsModel.rawAttributes.service_id.references, {
    model: "services",
    key: "id",
  });

  await sequelize.close();
});

test("municipe resource models mirror FK and date metadata", async () => {
  const sequelize = new Sequelize("database", "username", "password", {
    dialect: "mariadb",
    logging: false,
  });

  const AtletaModel = atletaModel(sequelize, DataTypes);
  const CarteirinhaModel = carterinhaModel(sequelize, DataTypes);
  const CarteirinhaEsporteModel = carterinhaEsporteModel(sequelize, DataTypes);

  for (const model of [AtletaModel, CarteirinhaModel, CarteirinhaEsporteModel]) {
    assert.deepEqual(model.rawAttributes.municipe_uuid.references, {
      model: "municipes",
      key: "uuid",
    });
    assert.equal(model.rawAttributes.municipe_uuid.onDelete, "RESTRICT");
    assert.equal(model.rawAttributes.municipe_uuid.onUpdate, "CASCADE");
  }

  assert.equal((CarteirinhaModel.rawAttributes.emissao.type as any).key, "DATE");
  assert.equal((CarteirinhaModel.rawAttributes.validade.type as any).key, "DATE");

  await sequelize.close();
});
