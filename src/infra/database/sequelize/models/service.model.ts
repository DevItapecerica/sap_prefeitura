import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Sequelize,
  DataTypes,
} from "sequelize";

// ─── Classe do modelo ────────────────────────────────────────────

export interface ServiceDB extends Model<
  InferAttributes<ServiceDB>,
  InferCreationAttributes<ServiceDB>
> {
  id: CreationOptional<number>;
  name: string;
  module_key: string;
  description: string | null;
  tag: string;
  url: string;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
  deletedAt: CreationOptional<Date | null>;
}

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const ServiceDB = sequelize.define<ServiceDB>(
    "ServiceModel",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      module_key: { type: DataTypes.STRING(64), allowNull: false, unique: 'uq_services_module_key', validate: { is: /^[a-z][a-z0-9_]*$/ } },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tag: {
        type: DataTypes.STRING(15),
        allowNull: false,
        defaultValue: "outros",
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "services",
      timestamps: true,
      paranoid: true,
      indexes: [{ name: 'uq_services_id_module_key', unique: true, fields: ['id', 'module_key'] }],
    },
  );

  (ServiceDB as any).associate = (models: any) => {
    ServiceDB.hasMany(models.PermissionActionModel, { foreignKey: 'service_id', as: 'permissionActions', constraints: false });
    ServiceDB.hasMany(models.PermissionsModel, {
      foreignKey: "service_id",
      as: "permissions",
    });
    ServiceDB.hasMany(models.ServiceVisibilities, {
      foreignKey: "service_id",
      as: "visibilities",
    });
  };

  return ServiceDB;
};
