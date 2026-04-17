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
  description: CreationOptional<string>;
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

  return SetorDB;
};
