import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "user_sessions",
        {
          id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
          },
          user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
              model: "users",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          refresh_token_hash: {
            type: DataTypes.STRING(64),
            allowNull: false,
            unique: true,
          },
          expires_at: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          revoked_at: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
          },
          created_at: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addIndex("user_sessions", ["user_id"], {
        name: "idx_user_sessions_user_id",
        transaction,
      });
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("user_sessions", { transaction });
    });
  },
};
