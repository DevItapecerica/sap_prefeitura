import { QueryInterface, DataTypes } from "sequelize";

/** @type {import("sequelize-cli").Migration} */
export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "esporte_atletas",
        {
          uuid: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
          },
          municipe_uuid: {
            type: DataTypes.UUID,
            allowNull: false,
          },
          ativo: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
          },
          author: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
          },
        },
        { transaction },
      );
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("esporte_atletas", { transaction });
    });
  },
};
