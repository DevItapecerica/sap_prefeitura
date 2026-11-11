import { QueryInterface, DataTypes } from "sequelize";

const TABLE_NAME = "users";

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
      if (!(await hasColumn(queryInterface, "createdAt"))) {
        await queryInterface.addColumn(
          TABLE_NAME,
          "createdAt",
          {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: queryInterface.sequelize.literal("CURRENT_TIMESTAMP"),
          },
          { transaction },
        );
      }
      if (!(await hasColumn(queryInterface, "updatedAt"))) {
        await queryInterface.addColumn(
          TABLE_NAME,
          "updatedAt",
          {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: queryInterface.sequelize.literal("CURRENT_TIMESTAMP"),
          },
          { transaction },
        );
      }
      if (!(await hasColumn(queryInterface, "deletedAt"))) {
        await queryInterface.addColumn(
          TABLE_NAME,
          "deletedAt",
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
      if (await hasColumn(queryInterface, "createdAt")) {
        await queryInterface.removeColumn(TABLE_NAME, "createdAt", {
          transaction,
        });
      }
      if (await hasColumn(queryInterface, "updatedAt")) {
        await queryInterface.removeColumn(TABLE_NAME, "updatedAt", {
          transaction,
        });
      }
      if (await hasColumn(queryInterface, "deletedAt")) {
        await queryInterface.removeColumn(TABLE_NAME, "deletedAt", {
          transaction,
        });
      }
    });
  },
};
