import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Sequelize,
  DataTypes,
} from "sequelize";

// ─── Classe do modelo ────────────────────────────────────────────
export interface UserDB extends Model<
  InferAttributes<UserDB>,
  InferCreationAttributes<UserDB>
> {
   id: CreationOptional<number>;
   name: string;
   email: string;
   ramal: string;
   password: string;

   setor_id: number;
   role_id: number;
   firstLogin: boolean;

   createdAt: CreationOptional<Date>;
   updatedAt: CreationOptional<Date>;
   deletedAt: CreationOptional<Date | null>;
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
