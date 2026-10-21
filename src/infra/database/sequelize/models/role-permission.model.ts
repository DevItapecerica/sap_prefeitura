import { Model, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize, DataTypes } from 'sequelize';
export interface RolePermissionDB extends Model<InferAttributes<RolePermissionDB>, InferCreationAttributes<RolePermissionDB>> {
  id: CreationOptional<number>;
  role_id: number;
  permission_action_id: number;
  allowed: CreationOptional<boolean>;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
}
export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const model = sequelize.define<RolePermissionDB>('RolePermissionsModel', {
    id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    role_id: { type: dataTypes.INTEGER, allowNull: false, references: { model: 'roles', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
    permission_action_id: { type: dataTypes.INTEGER, allowNull: false, references: { model: 'permission_actions', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
    allowed: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    createdAt: { type: dataTypes.DATE, allowNull: false },
    updatedAt: { type: dataTypes.DATE, allowNull: false },
  }, { tableName: 'role_permissions', timestamps: true, paranoid: false, indexes: [
    { name: 'uq_role_permissions_role_action', unique: true, fields: ['role_id', 'permission_action_id'] },
    { name: 'idx_role_permissions_action', fields: ['permission_action_id'] },
  ] });
  (model as any).associate = (models: any) => {
    model.belongsTo(models.RolesModel, { foreignKey: 'role_id', as: 'role', onUpdate: 'CASCADE', onDelete: 'RESTRICT' });
    model.belongsTo(models.PermissionActionModel, { foreignKey: 'permission_action_id', as: 'permissionAction', onUpdate: 'CASCADE', onDelete: 'RESTRICT' });
  };
  return model;
};
