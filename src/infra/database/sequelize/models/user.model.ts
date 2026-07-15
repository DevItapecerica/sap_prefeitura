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
   ramal: string | null;
   password: string;

   setor_id: number | null;
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
        references: {
          model: "setors",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "roles",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
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

  (UserDB as any).associate = (models: any) => {
    UserDB.belongsTo(models.SetorModel, {
      foreignKey: "setor_id",
      as: "setor",
    });
    UserDB.belongsTo(models.RolesModel, {
      foreignKey: "role_id",
      as: "role",
    });
    UserDB.hasMany(models.UserSessionModel, {
      foreignKey: "userId",
      as: "sessions",
    });
  };

  return UserDB;
};
