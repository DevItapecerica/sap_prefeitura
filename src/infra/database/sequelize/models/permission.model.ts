import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Sequelize,
  DataTypes,
} from "sequelize";

// ─── Classe do modelo ────────────────────────────────────────────

interface PermissionsDB extends Model<
  InferAttributes<PermissionsDB>,
  InferCreationAttributes<PermissionsDB>
> {
  id: CreationOptional<number>;
  role_id: number;
  service_id: number;
  read: boolean;
  write: boolean;
  edit: boolean;
  del: boolean;

  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
  deletedAt?: CreationOptional<Date>;
}

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const Permissions = sequelize.define<PermissionsDB>(
    "PermissionsModel",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      // Role do usuário
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "roles",
          key: "id",
        },
      },

      // Serviço ao qual as permissões se aplicam
      service_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      // Permissões individuais
      read: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },

      write: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      edit: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      del: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      // ➜ incluir os três campos controlados pelo Sequelize
      createdAt: { type: dataTypes.DATE, allowNull: false },
      updatedAt: { type: dataTypes.DATE, allowNull: false },
      deletedAt: { type: dataTypes.DATE, allowNull: true },
    },
    {
      tableName: "permissions",
      timestamps: true, // Adiciona createdAt e updatedAt
      paranoid: true, // Habilita soft delete
    },
  );

  ( Permissions as any ).associate = (models: any) => {
    Permissions.belongsTo(models.RolesModel, {
      foreignKey: "role_id",
      as: "role",
    });
    
    // Permissions.belongsTo(models.Services, {
    //   foreignKey: "service_id",
    //   as: "service",
    // });
  };
  return Permissions;
};
