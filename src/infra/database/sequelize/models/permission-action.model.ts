import { Model, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize, DataTypes } from 'sequelize';
export interface PermissionActionDB extends Model<InferAttributes<PermissionActionDB>, InferCreationAttributes<PermissionActionDB>> {
  id: CreationOptional<number>;
  service_id: number;
  module_key: string;
  action: string;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
}
export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const model = sequelize.define<PermissionActionDB>('PermissionActionModel', {
    id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    service_id: { type: dataTypes.INTEGER, allowNull: false },
    module_key: { type: dataTypes.STRING(64), allowNull: false, validate: { is: /^[a-z][a-z0-9_]*$/ } },
    action: { type: dataTypes.STRING(96), allowNull: false, validate: { is: /^[a-z][a-z0-9_]*$/ } },
    createdAt: { type: dataTypes.DATE, allowNull: false },
    updatedAt: { type: dataTypes.DATE, allowNull: false },
  }, { tableName: 'permission_actions', timestamps: true, paranoid: false, charset: 'ascii', collate: 'ascii_bin', indexes: [
    { name: 'uq_permission_actions_service_action', unique: true, fields: ['service_id', 'action'] },
    { name: 'uq_permission_actions_module_action', unique: true, fields: ['module_key', 'action'] },
  ] });
  // Composite FK is defined by the migration; Sequelize associations cannot express it.
  (model as any).associate = (models: any) => {
    model.belongsTo(models.ServiceModel, { foreignKey: 'service_id', as: 'service', constraints: false });
    model.hasMany(models.RolePermissionsModel, { foreignKey: 'permission_action_id', as: 'rolePermissions' });
  };
  return model;
};
