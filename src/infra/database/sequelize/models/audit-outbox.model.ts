import { DataTypes, Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => sequelize.define<Model>("AuditOutboxModel", {
  id: { type: dataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  eventId: { type: dataTypes.STRING(36), allowNull: false, unique: true, field: "event_id" },
  payload: { type: dataTypes.TEXT("long"), allowNull: false },
  status: { type: dataTypes.ENUM("PENDING", "PROCESSING", "PROCESSED", "FAILED"), allowNull: false, defaultValue: "PENDING" },
  attempts: { type: dataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  nextAttemptAt: { type: dataTypes.DATE, allowNull: false, field: "next_attempt_at" },
  lastError: { type: dataTypes.TEXT, allowNull: true, field: "last_error" },
  processedAt: { type: dataTypes.DATE, allowNull: true, field: "processed_at" },
  createdAt: { type: dataTypes.DATE, allowNull: false, field: "created_at" },
  updatedAt: { type: dataTypes.DATE, allowNull: false, field: "updated_at" },
}, { tableName: "audit_outbox", timestamps: true });
