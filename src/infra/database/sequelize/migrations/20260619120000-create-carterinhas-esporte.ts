import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "carterinhas_esporte",
        {
          uuid: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
          },
          emissao: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          validade: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
          },
          municipe_uuid: {
            type: DataTypes.UUID,
            allowNull: false,
          },
          modalidade: {
            type: DataTypes.STRING,
            allowNull: false,
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
      await queryInterface.dropTable("carterinhas_esporte", { transaction });
    });
  },
};
