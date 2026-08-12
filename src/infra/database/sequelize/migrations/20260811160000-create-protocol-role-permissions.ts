import { DataTypes, QueryInterface, QueryTypes } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const rows = await queryInterface.sequelize.query<{ present: number }>(
      "SELECT COUNT(*) AS present FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'protocol_role_permissions'",
      { type: QueryTypes.SELECT },
    );
    if (Number(rows[0]?.present || 0) > 0) return;
    await queryInterface.createTable("protocol_role_permissions", {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      role_id: { type: DataTypes.INTEGER, allowNull: false, unique: true, references: { model: "roles", key: "id" }, onUpdate: "CASCADE", onDelete: "CASCADE" },
      manage_catalog: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      triage: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      route: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      decide: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      view_sector: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      export: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    });
  },
  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable("protocol_role_permissions");
  },
};
