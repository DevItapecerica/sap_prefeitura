import { QueryInterface, DataTypes } from "sequelize";

/** @type {import("sequelize-cli").Migration} */
export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn("services", "createdAt", {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    });
    await queryInterface.addColumn("services", "updatedAt", {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    });
    await queryInterface.addColumn("services", "deletedAt", {
      type: DataTypes.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn("services", "createdAt");
    await queryInterface.removeColumn("services", "updatedAt");
    await queryInterface.removeColumn("services", "deletedAt");
  },
};
