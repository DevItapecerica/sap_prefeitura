import { DataTypes, QueryInterface, QueryTypes, Sequelize } from "sequelize";

async function tableExists(queryInterface: QueryInterface, table: string): Promise<boolean> {
  const rows = await queryInterface.sequelize.query<{ present: number }>(
    "SELECT COUNT(*) AS present FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table",
    { replacements: { table }, type: QueryTypes.SELECT },
  );
  return Number(rows[0]?.present || 0) > 0;
}

async function columnExists(queryInterface: QueryInterface, table: string, column: string): Promise<boolean> {
  const rows = await queryInterface.sequelize.query<{ present: number }>(
    "SELECT COUNT(*) AS present FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column",
    { replacements: { table, column }, type: QueryTypes.SELECT },
  );
  return Number(rows[0]?.present || 0) > 0;
}

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await columnExists(queryInterface, "protocols", "privacy_notice_version"))) {
      await queryInterface.addColumn("protocols", "privacy_notice_version", { type: DataTypes.STRING(32), allowNull: true });
    }
    if (!(await columnExists(queryInterface, "protocols", "retention_review_at"))) {
      await queryInterface.addColumn("protocols", "retention_review_at", { type: DataTypes.DATE, allowNull: true });
    }
    if (!(await columnExists(queryInterface, "protocols", "legal_hold_at"))) {
      await queryInterface.addColumn("protocols", "legal_hold_at", { type: DataTypes.DATE, allowNull: true });
    }
    if (!(await columnExists(queryInterface, "protocols", "encrypted_legal_hold_reason"))) {
      await queryInterface.addColumn("protocols", "encrypted_legal_hold_reason", { type: DataTypes.TEXT, allowNull: true });
    }
    if (!(await columnExists(queryInterface, "protocol_role_permissions", "manage_privacy"))) {
      await queryInterface.addColumn("protocol_role_permissions", "manage_privacy", { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
      await queryInterface.sequelize.query("UPDATE protocol_role_permissions SET manage_privacy = TRUE WHERE role_id = 1");
    }
    if (!(await tableExists(queryInterface, "protocol_privacy_requests"))) {
      await queryInterface.createTable("protocol_privacy_requests", {
        id: { type: DataTypes.UUID, defaultValue: Sequelize.literal("UUID()"), primaryKey: true },
        citizen_id: { type: DataTypes.UUID, allowNull: false, references: { model: "municipes", key: "uuid" }, onUpdate: "CASCADE", onDelete: "RESTRICT" },
        protocol_id: { type: DataTypes.UUID, allowNull: true, references: { model: "protocols", key: "id" }, onUpdate: "CASCADE", onDelete: "SET NULL" },
        request_type: { type: DataTypes.ENUM("CONFIRMATION", "ACCESS", "CORRECTION", "ANONYMIZATION", "BLOCKING", "ERASURE", "SHARING_INFORMATION", "OPPOSITION"), allowNull: false },
        encrypted_details: { type: DataTypes.TEXT, allowNull: false },
        status: { type: DataTypes.ENUM("RECEIVED", "IN_REVIEW", "FULFILLED", "DENIED"), allowNull: false, defaultValue: "RECEIVED" },
        encrypted_response: { type: DataTypes.TEXT, allowNull: true },
        handled_by: { type: DataTypes.INTEGER, allowNull: true, references: { model: "users", key: "id" }, onUpdate: "CASCADE", onDelete: "SET NULL" },
        completed_at: { type: DataTypes.DATE, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false },
        updated_at: { type: DataTypes.DATE, allowNull: false },
      });
      await queryInterface.addIndex("protocol_privacy_requests", ["citizen_id", "created_at"], { name: "idx_protocol_privacy_requests_citizen" });
      await queryInterface.addIndex("protocol_privacy_requests", ["status", "created_at"], { name: "idx_protocol_privacy_requests_status" });
    }
  },
  down: async (queryInterface: QueryInterface): Promise<void> => {
    if (await tableExists(queryInterface, "protocol_privacy_requests")) await queryInterface.dropTable("protocol_privacy_requests");
    for (const [table, column] of [
      ["protocol_role_permissions", "manage_privacy"],
      ["protocols", "encrypted_legal_hold_reason"],
      ["protocols", "legal_hold_at"],
      ["protocols", "retention_review_at"],
      ["protocols", "privacy_notice_version"],
    ]) {
      if (await columnExists(queryInterface, table, column)) {
        await queryInterface.sequelize.query(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``);
      }
    }
  },
};
