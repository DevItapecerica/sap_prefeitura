import { QueryInterface, QueryTypes } from "sequelize";

const indexes = [
  { table: "protocols", name: "idx_protocols_state_due_at", fields: ["state", "due_at"] },
  { table: "protocols", name: "idx_protocols_protocol_type", fields: ["protocol_type"] },
  { table: "protocol_notifications", name: "idx_protocol_notifications_status", fields: ["status"] },
  { table: "protocol_privacy_requests", name: "idx_protocol_privacy_status_created", fields: ["status", "created_at"] },
  { table: "protocol_attachments", name: "idx_protocol_attachments_status", fields: ["status"] },
] as const;

async function indexExists(queryInterface: QueryInterface, name: string): Promise<boolean> {
  const rows = await queryInterface.sequelize.query<{ present: number }>(
    "SELECT COUNT(*) AS present FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND INDEX_NAME = :name",
    { replacements: { name }, type: QueryTypes.SELECT },
  );
  return Number(rows[0]?.present || 0) > 0;
}

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    for (const index of indexes) {
      if (!await indexExists(queryInterface, index.name)) {
        await queryInterface.addIndex(index.table, [...index.fields], { name: index.name });
      }
    }
  },
  down: async (queryInterface: QueryInterface): Promise<void> => {
    for (const index of [...indexes].reverse()) {
      if (await indexExists(queryInterface, index.name)) {
        await queryInterface.sequelize.query(`DROP INDEX \`${index.name}\` ON \`${index.table}\``);
      }
    }
  },
};
