import { QueryInterface, DataTypes } from "sequelize";

/** @type {import("sequelize-cli").Migration} */
export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn("users", "createdAt", {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: queryInterface.sequelize.literal("CURRENT_TIMESTAMP"),
      });
      await queryInterface.addColumn("users", "updatedAt", {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: queryInterface.sequelize.literal("CURRENT_TIMESTAMP"),
      });
      await queryInterface.addColumn("users", "deletedAt", {
        type: DataTypes.DATE,
        allowNull: true,
      });
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn("users", "createdAt");
      await queryInterface.removeColumn("users", "updatedAt");
      await queryInterface.removeColumn("users", "deletedAt");
    });
  },
};
