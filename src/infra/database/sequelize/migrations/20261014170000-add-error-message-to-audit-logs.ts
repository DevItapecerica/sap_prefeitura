import { DataTypes, QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const columns = await queryInterface.describeTable("audit_logs");
    if (!columns.error_message) {
      await queryInterface.addColumn("audit_logs", "error_message", {
        type: DataTypes.TEXT,
        allowNull: true,
      });
    }
  },
  down: async (queryInterface: QueryInterface): Promise<void> => {
    const columns = await queryInterface.describeTable("audit_logs");
    if (columns.error_message) {
      await queryInterface.removeColumn("audit_logs", "error_message");
    }
  },
};
