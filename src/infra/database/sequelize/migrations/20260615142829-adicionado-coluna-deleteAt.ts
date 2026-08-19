import { QueryInterface, DataTypes } from "sequelize";

const TABLE_NAME = "bolsistas";
const COLUMN_NAME = "deletedAt";

const hasColumn = async (
  queryInterface: QueryInterface,
  columnName: string,
): Promise<boolean> => {
  const table = await queryInterface.describeTable(TABLE_NAME);
  return Boolean(table[columnName]);
};

/** @type {import("sequelize-cli").Migration} */
export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      if (!(await hasColumn(queryInterface, COLUMN_NAME))) {
        await queryInterface.addColumn(
          TABLE_NAME,
          COLUMN_NAME,
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
      if (await hasColumn(queryInterface, COLUMN_NAME)) {
        await queryInterface.removeColumn(TABLE_NAME, COLUMN_NAME, {
          transaction,
        });
      }
    });
  },
};
