import { QueryInterface } from "sequelize";
import { assertEmptyTables } from "./helpers/fresh-schema.js";

export const tables = ["audit_logs", "audit_outbox"];

export default {
  async up(query: QueryInterface): Promise<void> {
    await query.createTable(
      "audit_logs",
      {
        id: {
          type: "BIGINT(20)",
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        event_id: { type: "VARCHAR(36)", allowNull: false },
        occurred_at: { type: "DATETIME", allowNull: false },
        actor_user_id: { type: "INT(11)", allowNull: true },
        actor_name: { type: "VARCHAR(255)", allowNull: true },
        actor_role_id: { type: "INT(11)", allowNull: true },
        actor_setor_id: { type: "INT(11)", allowNull: true },
        action: { type: "VARCHAR(32)", allowNull: false },
        module: { type: "VARCHAR(80)", allowNull: false },
        resource_type: { type: "VARCHAR(80)", allowNull: false },
        resource_id: { type: "VARCHAR(120)", allowNull: true },
        result: { type: "VARCHAR(16)", allowNull: false },
        error_code: { type: "VARCHAR(80)", allowNull: true },
        request_id: { type: "VARCHAR(120)", allowNull: true },
        ip: { type: "VARCHAR(64)", allowNull: true },
        method: { type: "VARCHAR(10)", allowNull: true },
        route: { type: "VARCHAR(500)", allowNull: true },
        filters_json: { type: "LONGTEXT", allowNull: true },
        returned_count: { type: "INT(11)", allowNull: true },
        before_encrypted: { type: "LONGTEXT", allowNull: true },
        after_encrypted: { type: "LONGTEXT", allowNull: true },
        metadata_encrypted: { type: "LONGTEXT", allowNull: true },
        created_at: { type: "DATETIME", allowNull: false },
        error_message: { type: "TEXT", allowNull: true },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex("audit_logs", ["event_id"], {
      name: "event_id",
      unique: true,
    });
    await query.addIndex("audit_logs", ["occurred_at"], {
      name: "idx_audit_occurred_at",
      unique: false,
    });
    await query.addIndex("audit_logs", ["actor_user_id"], {
      name: "idx_audit_actor",
      unique: false,
    });
    await query.addIndex("audit_logs", ["action"], {
      name: "idx_audit_action",
      unique: false,
    });
    await query.addIndex("audit_logs", ["module"], {
      name: "idx_audit_module",
      unique: false,
    });
    await query.addIndex("audit_logs", ["resource_type", "resource_id"], {
      name: "idx_audit_resource",
      unique: false,
    });
    await query.addIndex("audit_logs", ["request_id"], {
      name: "idx_audit_request",
      unique: false,
    });
    await query.createTable(
      "audit_outbox",
      {
        id: {
          type: "BIGINT(20)",
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        event_id: { type: "VARCHAR(36)", allowNull: false },
        payload: { type: "LONGTEXT", allowNull: false },
        status: {
          type: "ENUM('PENDING','PROCESSING','PROCESSED','FAILED')",
          allowNull: false,
          defaultValue: "PENDING",
        },
        attempts: { type: "INT(11)", allowNull: false, defaultValue: 0 },
        next_attempt_at: { type: "DATETIME", allowNull: false },
        last_error: { type: "TEXT", allowNull: true },
        processed_at: { type: "DATETIME", allowNull: true },
        created_at: { type: "DATETIME", allowNull: false },
        updated_at: { type: "DATETIME", allowNull: false },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex("audit_outbox", ["event_id"], {
      name: "event_id",
      unique: true,
    });
    await query.addIndex("audit_outbox", ["status", "next_attempt_at"], {
      name: "idx_audit_outbox_pending",
      unique: false,
    });
  },
  async down(query: QueryInterface): Promise<void> {
    await assertEmptyTables(query, ["audit_logs", "audit_outbox"]);
    await query.dropTable("audit_outbox");
    await query.dropTable("audit_logs");
  },
};
