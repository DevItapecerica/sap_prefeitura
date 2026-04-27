import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Sequelize,
  DataTypes,
} from "sequelize";

// ─── Classe do modelo ────────────────────────────────────────────

interface RolesDB extends Model<InferAttributes<RolesDB>, InferCreationAttributes<RolesDB>> {
  id: CreationOptional<number>;
  name: string;
}

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const Roles = sequelize.define<RolesDB>(
    "RolesModel",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "roles",
      timestamps: false,
    }
  );

  return Roles;
};
