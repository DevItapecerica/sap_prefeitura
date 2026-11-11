import { QueryInterface, DataTypes } from "sequelize";

const TABLE_NAME = "carterinhas_esporte";

const hasColumn = async (
  queryInterface: QueryInterface,
  columnName: string,
): Promise<boolean> => {
  const table = await queryInterface.describeTable(TABLE_NAME);
  return Boolean(table[columnName]);
};

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      if (!(await hasColumn(queryInterface, "observacao"))) {
        await queryInterface.addColumn(
          TABLE_NAME,
          "observacao",
          {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          { transaction },
        );
      }

      if (!(await hasColumn(queryInterface, "validade_exame"))) {
        await queryInterface.addColumn(
          TABLE_NAME,
          "validade_exame",
          {
            type: DataTypes.DATE,
            allowNull: true,
          },
          { transaction },
        );
      }
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      if (await hasColumn(queryInterface, "validade_exame")) {
        await queryInterface.removeColumn(TABLE_NAME, "validade_exame", {
          transaction,
        });
      }
      if (await hasColumn(queryInterface, "observacao")) {
        await queryInterface.removeColumn(TABLE_NAME, "observacao", {
          transaction,
        });
      }
    });
  },
};
