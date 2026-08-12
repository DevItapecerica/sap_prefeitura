import { DataTypes, QueryInterface, QueryTypes } from "sequelize";

const TABLE = "protocol_notifications";
const tableExists = async (queryInterface: QueryInterface): Promise<boolean> => {
  const rows = await queryInterface.sequelize.query<{ present: number }>(
    "SELECT COUNT(*) AS present FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table",
    { replacements: { table: TABLE }, type: QueryTypes.SELECT },
  );
  return Number(rows[0]?.present || 0) > 0;
};

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (await tableExists(queryInterface)) return;
    await queryInterface.createTable(TABLE, {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      protocol_id: { type: DataTypes.UUID, allowNull: false, references: { model: "protocols", key: "id" }, onDelete: "CASCADE" },
      idempotency_key: { type: DataTypes.STRING(180), allowNull: false, unique: true },
      encrypted_recipient: { type: DataTypes.TEXT, allowNull: false },
      subject: { type: DataTypes.STRING(255), allowNull: false },
      payload: { type: DataTypes.JSON, allowNull: false },
      status: { type: DataTypes.ENUM("PENDING", "PROCESSING", "PROCESSED", "FAILED"), allowNull: false, defaultValue: "PENDING" },
      attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      next_attempt_at: { type: DataTypes.DATE, allowNull: false },
      last_error: { type: DataTypes.TEXT, allowNull: true },
      processed_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex(TABLE, ["status", "next_attempt_at"], { name: "protocol_notifications_status_next_attempt_at" });
  },
  down: async (queryInterface: QueryInterface): Promise<void> => {
    if (await tableExists(queryInterface)) await queryInterface.dropTable(TABLE);
  },
};
