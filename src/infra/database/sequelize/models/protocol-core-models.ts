import { DataTypes, Model, ModelStatic, Sequelize } from "sequelize";

export type ProtocolCoreModels = {
  Service: ModelStatic<Model>;
  Form: ModelStatic<Model>;
  Protocol: ModelStatic<Model>;
};

const PROTOCOL_STATES = ["EM_TRIAGEM", "EM_ANALISE", "AGUARDANDO_COMPLEMENTO", "CONCLUIDO", "INDEFERIDO", "CANCELADO"];

export function defineProtocolCoreModels(sequelize: Sequelize): ProtocolCoreModels {
  const Service = sequelize.define("ProtocolServiceModel", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    defaultSectorId: { type: DataTypes.INTEGER, allowNull: true, field: "default_sector_id" },
    deadlineDays: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 15, field: "deadline_days" },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    protocolType: { type: DataTypes.ENUM("REQUERIMENTO", "DENUNCIA", "RECURSO", "SOLICITACAO_SERVICO"), allowNull: false, defaultValue: "REQUERIMENTO", field: "protocol_type" },
    publishedFormId: { type: DataTypes.INTEGER, allowNull: true, field: "published_form_id" },
  }, { tableName: "protocol_services", underscored: true });

  const Form = sequelize.define("ProtocolFormModel", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    serviceId: { type: DataTypes.INTEGER, allowNull: false, field: "service_id" },
    version: { type: DataTypes.INTEGER, allowNull: false },
    fields: { type: DataTypes.JSON, allowNull: false },
    publishedAt: { type: DataTypes.DATE, allowNull: true, field: "published_at" },
  }, { tableName: "protocol_forms", underscored: true });

  const Protocol = sequelize.define("ProtocolModel", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    publicNumber: { type: DataTypes.STRING(20), unique: true, allowNull: false, field: "public_number" },
    authenticityCode: { type: DataTypes.STRING(64), unique: true, allowNull: false, field: "authenticity_code" },
    citizenId: { type: DataTypes.UUID, allowNull: false, field: "citizen_id" },
    contactEmail: { type: DataTypes.TEXT, allowNull: false, field: "contact_email" },
    contactEmailHash: { type: DataTypes.STRING(64), allowNull: false, field: "contact_email_hash" },
    serviceId: { type: DataTypes.INTEGER, allowNull: false, field: "service_id" },
    formId: { type: DataTypes.INTEGER, allowNull: false, field: "form_id" },
    protocolType: { type: DataTypes.ENUM("REQUERIMENTO", "DENUNCIA", "RECURSO", "SOLICITACAO_SERVICO"), allowNull: false, defaultValue: "REQUERIMENTO", field: "protocol_type" },
    confidentiality: { type: DataTypes.ENUM("NORMAL", "RESTRICTED"), allowNull: false, defaultValue: "NORMAL" },
    relatedProtocolId: { type: DataTypes.UUID, allowNull: true, field: "related_protocol_id" },
    typePolicyVersion: { type: DataTypes.STRING(32), allowNull: true, field: "type_policy_version" },
    subject: { type: DataTypes.STRING(180), allowNull: false },
    answers: { type: DataTypes.JSON, allowNull: false },
    currentSectorId: { type: DataTypes.INTEGER, allowNull: true, field: "current_sector_id" },
    assigneeId: { type: DataTypes.INTEGER, allowNull: true, field: "assignee_id" },
    state: { type: DataTypes.ENUM(...PROTOCOL_STATES), allowNull: false, defaultValue: "EM_TRIAGEM" },
    dueAt: { type: DataTypes.DATE, allowNull: false, field: "due_at" },
    privacyNoticeVersion: { type: DataTypes.STRING(32), allowNull: true, field: "privacy_notice_version" },
    retentionReviewAt: { type: DataTypes.DATE, allowNull: true, field: "retention_review_at" },
    legalHoldAt: { type: DataTypes.DATE, allowNull: true, field: "legal_hold_at" },
    encryptedLegalHoldReason: { type: DataTypes.TEXT, allowNull: true, field: "encrypted_legal_hold_reason" },
  }, { tableName: "protocols", underscored: true });

  return { Service, Form, Protocol };
}
