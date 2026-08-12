import { DataTypes, Model, ModelStatic, Sequelize } from "sequelize";

type ProtocolPermissionAssociations = ModelStatic<Model> & {
  associate?: (models: { RolesModel: ModelStatic<Model> }) => void;
};

export default (sequelize: Sequelize) => {
  const ProtocolRolePermission = sequelize.define("ProtocolRolePermissionModel", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    roleId: { type: DataTypes.INTEGER, allowNull: false, unique: true, field: "role_id" },
    manageCatalog: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "manage_catalog" },
    triage: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    route: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    decide: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    viewSector: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "view_sector" },
    export: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    managePrivacy: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "manage_privacy" },
    viewRestricted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "view_restricted" },
    viewOperations: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "view_operations" },
  }, { tableName: "protocol_role_permissions", underscored: true });
  const associableModel = ProtocolRolePermission as ProtocolPermissionAssociations;
  associableModel.associate = (models) => {
    ProtocolRolePermission.belongsTo(models.RolesModel, { foreignKey: "roleId", as: "role" });
  };
  return associableModel;
};
