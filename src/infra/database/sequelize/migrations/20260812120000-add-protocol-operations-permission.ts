import { DataTypes, QueryInterface, QueryTypes } from "sequelize";

async function columnExists(queryInterface: QueryInterface): Promise<boolean> {
  const rows = await queryInterface.sequelize.query<{ present: number }>(
    "SELECT COUNT(*) AS present FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'protocol_role_permissions' AND COLUMN_NAME = 'view_operations'",
    { type: QueryTypes.SELECT },
  );
  return Number(rows[0]?.present || 0) > 0;
}

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (await columnExists(queryInterface)) return;
    await queryInterface.addColumn("protocol_role_permissions", "view_operations", { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
    await queryInterface.sequelize.query("UPDATE protocol_role_permissions SET view_operations = TRUE WHERE role_id = 1");
  },
  down: async (queryInterface: QueryInterface): Promise<void> => {
    if (await columnExists(queryInterface)) await queryInterface.sequelize.query("ALTER TABLE `protocol_role_permissions` DROP COLUMN `view_operations`");
  },
};
