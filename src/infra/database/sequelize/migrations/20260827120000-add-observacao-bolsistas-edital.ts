import { DataTypes, QueryInterface } from "sequelize";

const TABLE_NAME = "bolsistas_edital";
const COLUMN_NAME = "observacao";

const hasColumn = async (queryInterface: QueryInterface): Promise<boolean> => {
  const table = await queryInterface.describeTable(TABLE_NAME);
  return Boolean(table[COLUMN_NAME]);
};

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (await hasColumn(queryInterface)) return;

    await queryInterface.addColumn(TABLE_NAME, COLUMN_NAME, {
      type: DataTypes.TEXT,
      allowNull: true,
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await hasColumn(queryInterface))) return;

    await queryInterface.removeColumn(TABLE_NAME, COLUMN_NAME);
  },
};
