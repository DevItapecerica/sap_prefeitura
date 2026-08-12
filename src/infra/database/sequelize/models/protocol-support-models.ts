import { DataTypes, Model, ModelStatic, Sequelize } from "sequelize";

export type ProtocolSupportModels = {
  Movement: ModelStatic<Model>;
  Requirement: ModelStatic<Model>;
  Attachment: ModelStatic<Model>;
  AccessCode: ModelStatic<Model>;
  Counter: ModelStatic<Model>;
  Notification: ModelStatic<Model>;
  PrivacyRequest: ModelStatic<Model>;
};

export function defineProtocolSupportModels(sequelize: Sequelize): ProtocolSupportModels {
  const Movement = sequelize.define("ProtocolMovementModel", {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true }, protocolId: { type: DataTypes.UUID, allowNull: false, field: "protocol_id" },
    fromSectorId: { type: DataTypes.INTEGER, allowNull: true, field: "from_sector_id" }, toSectorId: { type: DataTypes.INTEGER, allowNull: true, field: "to_sector_id" },
    actorId: { type: DataTypes.INTEGER, allowNull: true, field: "actor_id" }, actorType: { type: DataTypes.ENUM("CITIZEN", "USER", "SYSTEM"), allowNull: false },
    fromState: { type: DataTypes.STRING(30), allowNull: true, field: "from_state" }, toState: { type: DataTypes.STRING(30), allowNull: false, field: "to_state" },
    publicMessage: { type: DataTypes.TEXT, allowNull: true, field: "public_message" }, internalMessage: { type: DataTypes.TEXT, allowNull: true, field: "internal_message" },
  }, { tableName: "protocol_movements", underscored: true, updatedAt: false });

  const Requirement = sequelize.define("ProtocolRequirementModel", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true }, protocolId: { type: DataTypes.UUID, allowNull: false, field: "protocol_id" },
    description: { type: DataTypes.TEXT, allowNull: false }, dueAt: { type: DataTypes.DATE, allowNull: false, field: "due_at" }, response: { type: DataTypes.TEXT, allowNull: true }, resolvedAt: { type: DataTypes.DATE, allowNull: true, field: "resolved_at" },
  }, { tableName: "protocol_requirements", underscored: true });

  const Attachment = sequelize.define("ProtocolAttachmentModel", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true }, protocolId: { type: DataTypes.UUID, allowNull: false, field: "protocol_id" }, requirementId: { type: DataTypes.UUID, allowNull: true, field: "requirement_id" },
    originalName: { type: DataTypes.STRING(255), allowNull: false, field: "original_name" }, storageKey: { type: DataTypes.STRING(255), allowNull: false, unique: true, field: "storage_key" },
    mimeType: { type: DataTypes.STRING(80), allowNull: false, field: "mime_type" }, size: { type: DataTypes.INTEGER, allowNull: false }, sha256: { type: DataTypes.STRING(64), allowNull: false },
    status: { type: DataTypes.ENUM("QUARANTINED", "AVAILABLE", "REJECTED"), allowNull: false }, ownerType: { type: DataTypes.ENUM("CITIZEN", "USER"), allowNull: false, field: "owner_type" },
  }, { tableName: "protocol_attachments", underscored: true, updatedAt: false });

  const AccessCode = sequelize.define("ProtocolAccessCodeModel", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true }, cpfHash: { type: DataTypes.STRING(64), allowNull: false, field: "cpf_hash" }, emailHash: { type: DataTypes.STRING(64), allowNull: false, field: "email_hash" },
    encryptedEmail: { type: DataTypes.TEXT, allowNull: false, field: "encrypted_email" }, codeHash: { type: DataTypes.STRING(64), allowNull: false, field: "code_hash" }, requestIp: { type: DataTypes.STRING(64), allowNull: false, field: "request_ip" },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }, expiresAt: { type: DataTypes.DATE, allowNull: false, field: "expires_at" }, usedAt: { type: DataTypes.DATE, allowNull: true, field: "used_at" },
  }, { tableName: "protocol_access_codes", underscored: true, updatedAt: false });

  const Counter = sequelize.define("ProtocolCounterModel", { year: { type: DataTypes.INTEGER, primaryKey: true }, value: { type: DataTypes.INTEGER, allowNull: false } }, { tableName: "protocol_counters", timestamps: false });

  const Notification = sequelize.define("ProtocolNotificationModel", {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true }, protocolId: { type: DataTypes.UUID, allowNull: false, field: "protocol_id" }, idempotencyKey: { type: DataTypes.STRING(180), allowNull: false, unique: true, field: "idempotency_key" },
    encryptedRecipient: { type: DataTypes.TEXT, allowNull: false, field: "encrypted_recipient" }, subject: { type: DataTypes.STRING(255), allowNull: false }, payload: { type: DataTypes.JSON, allowNull: false },
    status: { type: DataTypes.ENUM("PENDING", "PROCESSING", "PROCESSED", "FAILED"), allowNull: false, defaultValue: "PENDING" }, attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    nextAttemptAt: { type: DataTypes.DATE, allowNull: false, field: "next_attempt_at" }, lastError: { type: DataTypes.TEXT, allowNull: true, field: "last_error" }, processedAt: { type: DataTypes.DATE, allowNull: true, field: "processed_at" },
  }, { tableName: "protocol_notifications", underscored: true });

  const PrivacyRequest = sequelize.define("ProtocolPrivacyRequestModel", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true }, citizenId: { type: DataTypes.UUID, allowNull: false, field: "citizen_id" }, protocolId: { type: DataTypes.UUID, allowNull: true, field: "protocol_id" },
    requestType: { type: DataTypes.ENUM("CONFIRMATION", "ACCESS", "CORRECTION", "ANONYMIZATION", "BLOCKING", "ERASURE", "SHARING_INFORMATION", "OPPOSITION"), allowNull: false, field: "request_type" },
    encryptedDetails: { type: DataTypes.TEXT, allowNull: false, field: "encrypted_details" }, status: { type: DataTypes.ENUM("RECEIVED", "IN_REVIEW", "FULFILLED", "DENIED"), allowNull: false, defaultValue: "RECEIVED" },
    encryptedResponse: { type: DataTypes.TEXT, allowNull: true, field: "encrypted_response" }, handledBy: { type: DataTypes.INTEGER, allowNull: true, field: "handled_by" }, completedAt: { type: DataTypes.DATE, allowNull: true, field: "completed_at" },
  }, { tableName: "protocol_privacy_requests", underscored: true });

  return { Movement, Requirement, Attachment, AccessCode, Counter, Notification, PrivacyRequest };
}
