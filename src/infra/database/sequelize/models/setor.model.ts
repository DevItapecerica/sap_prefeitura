import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Sequelize,
  DataTypes,
} from "sequelize";

// ─── Classe do modelo ────────────────────────────────────────────
export interface SetorDB extends Model<
  InferAttributes<SetorDB>,
  InferCreationAttributes<SetorDB>
> {
  id: CreationOptional<number>;
  name: string;
  description: CreationOptional<string | null>;
}

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const SetorDB = sequelize.define<SetorDB>(
    "SetorModel",
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
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "setors",
      timestamps: false,
    },
  );

  (SetorDB as any).associate = (models: any) => {
    SetorDB.hasMany(models.UserModel, {
      foreignKey: "setor_id",
      as: "users",
    });
    SetorDB.hasMany(models.ServiceVisibilities, {
      foreignKey: "setor_id",
      as: "visibilities",
    });
  };

  return SetorDB;
};
