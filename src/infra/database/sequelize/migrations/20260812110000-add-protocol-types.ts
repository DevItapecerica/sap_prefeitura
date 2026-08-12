import { DataTypes, QueryInterface, QueryTypes } from "sequelize";

async function columnExists(queryInterface: QueryInterface, table: string, column: string): Promise<boolean> {
  const rows = await queryInterface.sequelize.query<{ present: number }>(
    "SELECT COUNT(*) AS present FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column",
    { replacements: { table, column }, type: QueryTypes.SELECT },
  );
  return Number(rows[0]?.present || 0) > 0;
}

async function constraintExists(queryInterface: QueryInterface, table: string, constraint: string): Promise<boolean> {
  const rows = await queryInterface.sequelize.query<{ present: number }>(
    "SELECT COUNT(*) AS present FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND CONSTRAINT_NAME = :constraint",
    { replacements: { table, constraint }, type: QueryTypes.SELECT },
  );
  return Number(rows[0]?.present || 0) > 0;
}

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await columnExists(queryInterface, "protocol_services", "protocol_type"))) {
      await queryInterface.addColumn("protocol_services", "protocol_type", {
        type: DataTypes.ENUM("REQUERIMENTO", "DENUNCIA", "RECURSO", "SOLICITACAO_SERVICO"),
        allowNull: false,
        defaultValue: "REQUERIMENTO",
      });
    }
    if (!(await columnExists(queryInterface, "protocols", "protocol_type"))) {
      await queryInterface.addColumn("protocols", "protocol_type", {
        type: DataTypes.ENUM("REQUERIMENTO", "DENUNCIA", "RECURSO", "SOLICITACAO_SERVICO"),
        allowNull: false,
        defaultValue: "REQUERIMENTO",
      });
    }
    if (!(await columnExists(queryInterface, "protocols", "confidentiality"))) {
      await queryInterface.addColumn("protocols", "confidentiality", {
        type: DataTypes.ENUM("NORMAL", "RESTRICTED"), allowNull: false, defaultValue: "NORMAL",
      });
    }
    if (!(await columnExists(queryInterface, "protocols", "related_protocol_id"))) {
      await queryInterface.addColumn("protocols", "related_protocol_id", { type: DataTypes.UUID, allowNull: true });
    }
    if (!(await constraintExists(queryInterface, "protocols", "protocols_related_protocol_fk"))) {
      await queryInterface.addConstraint("protocols", {
        fields: ["related_protocol_id"], type: "foreign key", name: "protocols_related_protocol_fk",
        references: { table: "protocols", field: "id" }, onUpdate: "CASCADE", onDelete: "RESTRICT",
      });
    }
    if (!(await columnExists(queryInterface, "protocols", "type_policy_version"))) {
      await queryInterface.addColumn("protocols", "type_policy_version", { type: DataTypes.STRING(32), allowNull: true });
    }
    if (!(await columnExists(queryInterface, "protocol_role_permissions", "view_restricted"))) {
      await queryInterface.addColumn("protocol_role_permissions", "view_restricted", { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
      await queryInterface.sequelize.query("UPDATE protocol_role_permissions SET view_restricted = TRUE WHERE role_id = 1");
    }
  },
  down: async (queryInterface: QueryInterface): Promise<void> => {
    if (await columnExists(queryInterface, "protocol_role_permissions", "view_restricted")) await queryInterface.sequelize.query("ALTER TABLE `protocol_role_permissions` DROP COLUMN `view_restricted`");
    if (await columnExists(queryInterface, "protocols", "type_policy_version")) await queryInterface.sequelize.query("ALTER TABLE `protocols` DROP COLUMN `type_policy_version`");
    if (await constraintExists(queryInterface, "protocols", "protocols_related_protocol_fk")) await queryInterface.sequelize.query("ALTER TABLE `protocols` DROP FOREIGN KEY `protocols_related_protocol_fk`");
    for (const [table, column] of [["protocols", "related_protocol_id"], ["protocols", "confidentiality"], ["protocols", "protocol_type"], ["protocol_services", "protocol_type"]]) {
      if (await columnExists(queryInterface, table, column)) await queryInterface.sequelize.query(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``);
    }
  },
};
