import { QueryInterface, DataTypes } from "sequelize";

/** @type {import("sequelize-cli").Migration} */
export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.createTable("services", {
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
      tag: {
        type: DataTypes.STRING(15),
        allowNull: false,
        defaultValue: "outros",
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable("services");
  },
};
