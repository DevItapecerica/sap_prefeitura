import { QueryInterface, DataTypes } from "sequelize";

const TABLE_NAME = "carterinhas_esporte";
const COLUMN_NAME = "foto";

const hasColumn = async (
  queryInterface: QueryInterface,
  columnName: string,
): Promise<boolean> => {
  const table = await queryInterface.describeTable(TABLE_NAME);
  return Boolean(table[columnName]);
};

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await hasColumn(queryInterface, COLUMN_NAME))) {
      await queryInterface.addColumn(TABLE_NAME, COLUMN_NAME, {
        type: DataTypes.TEXT("long"),
        allowNull: true,
      });
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    if (await hasColumn(queryInterface, COLUMN_NAME)) {
      await queryInterface.removeColumn(TABLE_NAME, COLUMN_NAME);
    }
  },
};
