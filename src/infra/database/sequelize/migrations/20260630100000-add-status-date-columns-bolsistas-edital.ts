import { DataTypes, QueryInterface } from "sequelize";

const TABLE_NAME = "bolsistas_edital";
const COLUMNS = ["canceled_at", "concluded_at", "expired_at"];

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
      for (const columnName of COLUMNS) {
        if (!(await hasColumn(queryInterface, columnName))) {
          await queryInterface.addColumn(
            TABLE_NAME,
            columnName,
            {
              type: DataTypes.DATE,
              allowNull: true,
            },
            { transaction },
          );
        }
      }
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const columnName of [...COLUMNS].reverse()) {
        await queryInterface.removeColumn(TABLE_NAME, columnName, {
          transaction,
        });
      }
    });
  },
};
