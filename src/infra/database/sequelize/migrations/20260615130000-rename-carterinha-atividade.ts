import { QueryInterface, DataTypes } from "sequelize";

/** @type {import("sequelize-cli").Migration} */
export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn(
        "carterinhas",
        "atividade_uuid",
        "atividade",
        { transaction },
      );

      await queryInterface.changeColumn(
        "carterinhas",
        "atividade",
        {
          type: DataTypes.STRING,
          allowNull: true,
        },
        { transaction },
      );
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn(
        "carterinhas",
        "atividade",
        "atividade_uuid",
        { transaction },
      );

      await queryInterface.changeColumn(
        "carterinhas",
        "atividade_uuid",
        {
          type: DataTypes.STRING,
          allowNull: true,
        },
        { transaction },
      );
    });
  },
};
