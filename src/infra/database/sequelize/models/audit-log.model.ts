import { DataTypes, Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => sequelize.define<Model>("AuditLogModel", {
  id: { type: dataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  eventId: { type: dataTypes.STRING(36), allowNull: false, unique: true, field: "event_id" },
  occurredAt: { type: dataTypes.DATE, allowNull: false, field: "occurred_at" },
  actorUserId: { type: dataTypes.INTEGER, allowNull: true, field: "actor_user_id" },
  actorName: { type: dataTypes.STRING, allowNull: true, field: "actor_name" },
  actorRoleId: { type: dataTypes.INTEGER, allowNull: true, field: "actor_role_id" },
  actorSetorId: { type: dataTypes.INTEGER, allowNull: true, field: "actor_setor_id" },
  action: { type: dataTypes.STRING(32), allowNull: false }, module: { type: dataTypes.STRING(80), allowNull: false },
  resourceType: { type: dataTypes.STRING(80), allowNull: false, field: "resource_type" },
  resourceId: { type: dataTypes.STRING(120), allowNull: true, field: "resource_id" },
  result: { type: dataTypes.STRING(16), allowNull: false }, errorCode: { type: dataTypes.STRING(80), allowNull: true, field: "error_code" },
  requestId: { type: dataTypes.STRING(120), allowNull: true, field: "request_id" }, ip: { type: dataTypes.STRING(64), allowNull: true },
  method: { type: dataTypes.STRING(10), allowNull: true }, route: { type: dataTypes.STRING(500), allowNull: true },
  filtersJson: { type: dataTypes.TEXT("long"), allowNull: true, field: "filters_json" },
  returnedCount: { type: dataTypes.INTEGER, allowNull: true, field: "returned_count" },
  beforeEncrypted: { type: dataTypes.TEXT("long"), allowNull: true, field: "before_encrypted" },
  afterEncrypted: { type: dataTypes.TEXT("long"), allowNull: true, field: "after_encrypted" },
  metadataEncrypted: { type: dataTypes.TEXT("long"), allowNull: true, field: "metadata_encrypted" },
  createdAt: { type: dataTypes.DATE, allowNull: false, field: "created_at" },
}, { tableName: "audit_logs", timestamps: false });
