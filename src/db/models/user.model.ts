import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Sequelize,
  DataTypes,
} from "sequelize";

// ─── Classe do modelo ────────────────────────────────────────────
export class UserDB extends Model<
  InferAttributes<UserDB>,
  InferCreationAttributes<UserDB>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare email: string;
  declare ramal: string;
  declare password: string;

  declare setor_id: number;
  declare role_id: number;
  declare firstLogin: boolean;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const UserDB = sequelize.define<UserDB>(
    "UserModel",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(70),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      ramal: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      setor_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      firstLogin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      // ➜ incluir os três campos controlados pelo Sequelize
      createdAt: { type: dataTypes.DATE, allowNull: false },
      updatedAt: { type: dataTypes.DATE, allowNull: false },
      deletedAt: { type: dataTypes.DATE, allowNull: true },
    },
    {
      paranoid: true,
      tableName: "users",
      timestamps: true,
    },
  );

  return UserDB;
};
