import { QueryInterface, DataTypes } from "sequelize";

/** @type {import("sequelize-cli").Migration} */
export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable("users", {
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
      });
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("users");
    });
  },
};
