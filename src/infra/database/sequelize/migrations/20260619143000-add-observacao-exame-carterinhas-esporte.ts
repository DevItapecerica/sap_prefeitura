import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        "carterinhas_esporte",
        "observacao",
        {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        "carterinhas_esporte",
        "validade_exame",
        {
          type: DataTypes.DATE,
          allowNull: true,
        },
        { transaction },
      );
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn("carterinhas_esporte", "validade_exame", {
        transaction,
      });
      await queryInterface.removeColumn("carterinhas_esporte", "observacao", {
        transaction,
      });
    });
  },
};
