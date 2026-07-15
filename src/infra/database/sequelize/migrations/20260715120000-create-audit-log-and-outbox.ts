import { DataTypes, QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable("audit_outbox", {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, allowNull: false },
        event_id: { type: DataTypes.STRING(36), allowNull: false, unique: true },
        payload: { type: DataTypes.TEXT("long"), allowNull: false },
        status: { type: DataTypes.ENUM("PENDING", "PROCESSING", "PROCESSED", "FAILED"), allowNull: false, defaultValue: "PENDING" },
        attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        next_attempt_at: { type: DataTypes.DATE, allowNull: false },
        last_error: { type: DataTypes.TEXT, allowNull: true },
        processed_at: { type: DataTypes.DATE, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false },
        updated_at: { type: DataTypes.DATE, allowNull: false },
      }, { transaction });
      await queryInterface.addIndex("audit_outbox", ["status", "next_attempt_at"], { name: "idx_audit_outbox_pending", transaction });

      await queryInterface.createTable("audit_logs", {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, allowNull: false },
        event_id: { type: DataTypes.STRING(36), allowNull: false, unique: true },
        occurred_at: { type: DataTypes.DATE, allowNull: false },
        actor_user_id: { type: DataTypes.INTEGER, allowNull: true },
        actor_name: { type: DataTypes.STRING, allowNull: true },
        actor_role_id: { type: DataTypes.INTEGER, allowNull: true },
        actor_setor_id: { type: DataTypes.INTEGER, allowNull: true },
        action: { type: DataTypes.STRING(32), allowNull: false },
        module: { type: DataTypes.STRING(80), allowNull: false },
        resource_type: { type: DataTypes.STRING(80), allowNull: false },
        resource_id: { type: DataTypes.STRING(120), allowNull: true },
        result: { type: DataTypes.STRING(16), allowNull: false },
        error_code: { type: DataTypes.STRING(80), allowNull: true },
        request_id: { type: DataTypes.STRING(120), allowNull: true },
        ip: { type: DataTypes.STRING(64), allowNull: true },
        method: { type: DataTypes.STRING(10), allowNull: true },
        route: { type: DataTypes.STRING(500), allowNull: true },
        filters_json: { type: DataTypes.TEXT("long"), allowNull: true },
        returned_count: { type: DataTypes.INTEGER, allowNull: true },
        before_encrypted: { type: DataTypes.TEXT("long"), allowNull: true },
        after_encrypted: { type: DataTypes.TEXT("long"), allowNull: true },
        metadata_encrypted: { type: DataTypes.TEXT("long"), allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false },
      }, { transaction });
      for (const [columns, name] of [
        [["occurred_at"], "idx_audit_occurred_at"], [["actor_user_id"], "idx_audit_actor"],
        [["action"], "idx_audit_action"], [["module"], "idx_audit_module"],
        [["resource_type", "resource_id"], "idx_audit_resource"], [["request_id"], "idx_audit_request"],
      ] as [string[], string][]) {
        await queryInterface.addIndex("audit_logs", columns, { name, transaction });
      }
    });
  },
  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("audit_logs", { transaction });
      await queryInterface.dropTable("audit_outbox", { transaction });
    });
  },
};
