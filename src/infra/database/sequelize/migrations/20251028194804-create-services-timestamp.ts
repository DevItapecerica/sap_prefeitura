import { QueryInterface, DataTypes } from "sequelize";

const TABLE_NAME = "services";

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
    if (!(await hasColumn(queryInterface, "createdAt"))) {
      await queryInterface.addColumn(TABLE_NAME, "createdAt", {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      });
    }
    if (!(await hasColumn(queryInterface, "updatedAt"))) {
      await queryInterface.addColumn(TABLE_NAME, "updatedAt", {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      });
    }
    if (!(await hasColumn(queryInterface, "deletedAt"))) {
      await queryInterface.addColumn(TABLE_NAME, "deletedAt", {
        type: DataTypes.DATE,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    if (await hasColumn(queryInterface, "createdAt")) {
      await queryInterface.removeColumn(TABLE_NAME, "createdAt");
    }
    if (await hasColumn(queryInterface, "updatedAt")) {
      await queryInterface.removeColumn(TABLE_NAME, "updatedAt");
    }
    if (await hasColumn(queryInterface, "deletedAt")) {
      await queryInterface.removeColumn(TABLE_NAME, "deletedAt");
    }
  },
};
