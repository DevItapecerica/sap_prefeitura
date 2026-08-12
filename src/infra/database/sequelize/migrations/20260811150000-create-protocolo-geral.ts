import { DataTypes, QueryInterface, QueryTypes, Sequelize } from "sequelize";

const CORE_TABLES = ["protocol_services", "protocol_forms", "protocol_counters", "protocols", "protocol_movements", "protocol_requirements", "protocol_attachments", "protocol_access_codes"];

const coreTablesAlreadyExist = async (queryInterface: QueryInterface): Promise<boolean> => {
  const rows = await queryInterface.sequelize.query<{ TABLE_NAME: string }>(
    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (:tables)",
    { replacements: { tables: CORE_TABLES }, type: QueryTypes.SELECT },
  );
  if (rows.length === 0) return false;
  if (rows.length !== CORE_TABLES.length) throw new Error("Partial Protocolo Geral schema detected; manual reconciliation required");
  return true;
};

const migration = {
up: async (queryInterface: QueryInterface): Promise<void> => {
  if (await coreTablesAlreadyExist(queryInterface)) return;
  await queryInterface.createTable("protocol_services", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true }, name: { type: DataTypes.STRING(120), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false }, default_sector_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: "setors", key: "id" } },
    deadline_days: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 15 }, active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    published_form_id: { type: DataTypes.INTEGER, allowNull: true }, created_at: { type: DataTypes.DATE, allowNull: false }, updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.createTable("protocol_forms", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true }, service_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: "protocol_services", key: "id" }, onDelete: "CASCADE" },
    version: { type: DataTypes.INTEGER, allowNull: false }, fields: { type: DataTypes.JSON, allowNull: false }, published_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false }, updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addConstraint("protocol_forms", { fields: ["service_id", "version"], type: "unique", name: "protocol_forms_service_version_unique" });
  await queryInterface.addConstraint("protocol_services", { fields: ["published_form_id"], type: "foreign key", references: { table: "protocol_forms", field: "id" }, name: "protocol_services_published_form_fk", onDelete: "SET NULL", onUpdate: "CASCADE" });
  await queryInterface.createTable("protocol_counters", { year: { type: DataTypes.INTEGER, primaryKey: true }, value: { type: DataTypes.INTEGER, allowNull: false } });
  await queryInterface.createTable("protocols", {
    id: { type: DataTypes.UUID, defaultValue: Sequelize.literal("UUID()"), primaryKey: true }, public_number: { type: DataTypes.STRING(20), unique: true, allowNull: false }, authenticity_code: { type: DataTypes.STRING(64), unique: true, allowNull: false },
    citizen_id: { type: DataTypes.UUID, allowNull: false, references: { model: "municipes", key: "uuid" } }, contact_email: { type: DataTypes.TEXT, allowNull: false }, contact_email_hash: { type: DataTypes.STRING(64), allowNull: false },
    service_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: "protocol_services", key: "id" } }, form_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: "protocol_forms", key: "id" } },
    subject: { type: DataTypes.STRING(180), allowNull: false }, answers: { type: DataTypes.JSON, allowNull: false }, current_sector_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: "setors", key: "id" } },
    assignee_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: "users", key: "id" } }, state: { type: DataTypes.ENUM("EM_TRIAGEM", "EM_ANALISE", "AGUARDANDO_COMPLEMENTO", "CONCLUIDO", "INDEFERIDO", "CANCELADO"), allowNull: false },
    due_at: { type: DataTypes.DATE, allowNull: false }, created_at: { type: DataTypes.DATE, allowNull: false }, updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.createTable("protocol_movements", {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true }, protocol_id: { type: DataTypes.UUID, allowNull: false, references: { model: "protocols", key: "id" }, onDelete: "CASCADE" },
    from_sector_id: { type: DataTypes.INTEGER, allowNull: true }, to_sector_id: { type: DataTypes.INTEGER, allowNull: true }, actor_id: { type: DataTypes.INTEGER, allowNull: true }, actor_type: { type: DataTypes.ENUM("CITIZEN", "USER", "SYSTEM"), allowNull: false },
    from_state: { type: DataTypes.STRING(30), allowNull: true }, to_state: { type: DataTypes.STRING(30), allowNull: false }, public_message: { type: DataTypes.TEXT, allowNull: true }, internal_message: { type: DataTypes.TEXT, allowNull: true }, created_at: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.createTable("protocol_requirements", {
    id: { type: DataTypes.UUID, defaultValue: Sequelize.literal("UUID()"), primaryKey: true }, protocol_id: { type: DataTypes.UUID, allowNull: false, references: { model: "protocols", key: "id" }, onDelete: "CASCADE" },
    description: { type: DataTypes.TEXT, allowNull: false }, due_at: { type: DataTypes.DATE, allowNull: false }, response: { type: DataTypes.TEXT, allowNull: true }, resolved_at: { type: DataTypes.DATE, allowNull: true }, created_at: { type: DataTypes.DATE, allowNull: false }, updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.createTable("protocol_attachments", {
    id: { type: DataTypes.UUID, defaultValue: Sequelize.literal("UUID()"), primaryKey: true }, protocol_id: { type: DataTypes.UUID, allowNull: false, references: { model: "protocols", key: "id" }, onDelete: "CASCADE" }, requirement_id: { type: DataTypes.UUID, allowNull: true, references: { model: "protocol_requirements", key: "id" } },
    original_name: { type: DataTypes.STRING(255), allowNull: false }, storage_key: { type: DataTypes.STRING(255), allowNull: false, unique: true }, mime_type: { type: DataTypes.STRING(80), allowNull: false }, size: { type: DataTypes.INTEGER, allowNull: false }, sha256: { type: DataTypes.STRING(64), allowNull: false },
    status: { type: DataTypes.ENUM("QUARANTINED", "AVAILABLE", "REJECTED"), allowNull: false }, owner_type: { type: DataTypes.ENUM("CITIZEN", "USER"), allowNull: false }, created_at: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.createTable("protocol_access_codes", {
    id: { type: DataTypes.UUID, defaultValue: Sequelize.literal("UUID()"), primaryKey: true }, cpf_hash: { type: DataTypes.STRING(64), allowNull: false }, email_hash: { type: DataTypes.STRING(64), allowNull: false }, encrypted_email: { type: DataTypes.TEXT, allowNull: false }, code_hash: { type: DataTypes.STRING(64), allowNull: false }, request_ip: { type: DataTypes.STRING(64), allowNull: false },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }, expires_at: { type: DataTypes.DATE, allowNull: false }, used_at: { type: DataTypes.DATE, allowNull: true }, created_at: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex("protocol_access_codes", ["cpf_hash", "email_hash", "created_at"]);
},

down: async (q: QueryInterface): Promise<void> => {
  for (const table of ["protocol_access_codes", "protocol_attachments", "protocol_requirements", "protocol_movements", "protocols", "protocol_counters"]) await q.dropTable(table);
  await q.removeConstraint("protocol_services", "protocol_services_published_form_fk");
  await q.dropTable("protocol_forms"); await q.dropTable("protocol_services");
},
};
export default migration;
