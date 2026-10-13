import { randomUUID } from "node:crypto";
import { DataTypes, QueryInterface, QueryTypes, Transaction } from "sequelize";
import AesCryptService from "../../../../core/security/aes/AesCrypt.service.js";
import Sha256CryptService from "../../../../core/security/sha256/sha256.service.js";

const UUID_BIN_TYPE = "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin";
const LEGACY_FIELDS = [
  "nome", "cpf", "local", "status", "cep", "numero", "logradouro",
  "bairro", "cidade", "uf", "telefone",
];

type LegacyBolsista = {
  id: string; nome: string; cpf: string; local: string; status: string;
  cep: string; numero: string; logradouro: string; bairro: string;
  cidade: string; uf: string; telefone: string | null;
  createdAt: Date; updatedAt: Date; deletedAt: Date | null;
};

type ExistingMunicipe = {
  uuid: string; nome: string; telefone: string | null; rua: string;
  bairro: string; cidade: string; uf: string; cep: string; numero: string;
};

const hasTable = async (queryInterface: QueryInterface, tableName: string): Promise<boolean> =>
  typeof queryInterface.tableExists === "function"
    ? queryInterface.tableExists(tableName)
    : false;

const hasColumn = async (
  queryInterface: QueryInterface,
  tableName: string,
  columnName: string,
): Promise<boolean> => {
  if (typeof queryInterface.describeTable !== "function") return false;
  const table = await queryInterface.describeTable(tableName);
  return columnName in table;
};

const hasConstraint = async (
  queryInterface: QueryInterface,
  tableName: string,
  constraintName: string,
  transaction: Transaction,
): Promise<boolean> => {
  const constraints = await queryInterface.sequelize.query<{ constraint_name: string }>(
    "SELECT constraint_name FROM information_schema.table_constraints " +
    "WHERE table_schema = DATABASE() AND table_name = :tableName AND constraint_name = :constraintName",
    {
      replacements: { tableName, constraintName },
      type: QueryTypes.SELECT,
      transaction,
    },
  );
  return constraints.length > 0;
};

const hasIndex = async (
  queryInterface: QueryInterface,
  tableName: string,
  indexName: string,
  transaction: Transaction,
): Promise<boolean> => {
  const indexes = await queryInterface.sequelize.query<{ index_name: string }>(
    "SELECT index_name FROM information_schema.statistics " +
    "WHERE table_schema = DATABASE() AND table_name = :tableName AND index_name = :indexName",
    {
      replacements: { tableName, indexName },
      type: QueryTypes.SELECT,
      transaction,
    },
  );
  return indexes.length > 0;
};

export const normalizeDigits = (value: unknown) => String(value ?? "").replace(/\D/g, "");

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const archiveExists = await hasTable(queryInterface, "bolsistas_legacy_archive");
      const sourceRows = archiveExists
        ? await queryInterface.sequelize.query<LegacyBolsista>(
          "SELECT id, nome, cpf, local, status, cep, numero, logradouro, bairro, cidade, uf, telefone, createdAt, updatedAt, deletedAt FROM bolsistas_legacy_archive",
          { type: QueryTypes.SELECT, transaction },
        )
        : [];
      const rows = sourceRows.length > 0
        ? sourceRows
        : await queryInterface.sequelize.query<LegacyBolsista>(
          "SELECT id, nome, cpf, local, status, cep, numero, logradouro, bairro, cidade, uf, telefone, createdAt, updatedAt, deletedAt FROM bolsistas",
          { type: QueryTypes.SELECT, transaction },
        );
      const normalizedCpfs = new Set<string>();
      for (const row of rows) {
        const cpf = normalizeDigits(row.cpf);
        if (normalizedCpfs.has(cpf)) {
          throw new Error(`Duplicate legacy bolsista CPF for id ${row.id}`);
        }
        normalizedCpfs.add(cpf);
      }

      if (!archiveExists) await queryInterface.createTable("bolsistas_legacy_archive", {
        id: { type: UUID_BIN_TYPE, primaryKey: true, allowNull: false },
        nome: { type: DataTypes.STRING, allowNull: false },
        cpf: { type: DataTypes.STRING(11), allowNull: false },
        local: { type: DataTypes.STRING, allowNull: false },
        status: { type: DataTypes.STRING(20), allowNull: false },
        cep: { type: DataTypes.STRING(8), allowNull: false },
        numero: { type: DataTypes.STRING, allowNull: false },
        logradouro: { type: DataTypes.STRING, allowNull: false },
        bairro: { type: DataTypes.STRING, allowNull: false },
        cidade: { type: DataTypes.STRING, allowNull: false },
        uf: { type: DataTypes.STRING(2), allowNull: false },
        telefone: { type: DataTypes.STRING(11), allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
        deletedAt: { type: DataTypes.DATE, allowNull: true },
        archivedAt: { type: DataTypes.DATE, allowNull: false },
      }, { transaction });
      if (!await hasTable(queryInterface, "bolsistas_migration_divergences")) await queryInterface.createTable("bolsistas_migration_divergences", {
        id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
        bolsista_id: { type: UUID_BIN_TYPE, allowNull: false },
        municipe_uuid: { type: UUID_BIN_TYPE, allowNull: false },
        divergent_fields: { type: DataTypes.JSON, allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
      }, { transaction });

      if (!await hasColumn(queryInterface, "bolsistas", "municipe_uuid")) {
        await queryInterface.addColumn("bolsistas", "municipe_uuid", {
          type: UUID_BIN_TYPE,
          allowNull: true,
        }, { transaction });
      }
      if (!await hasColumn(queryInterface, "bolsistas_edital", "local")) {
        await queryInterface.addColumn("bolsistas_edital", "local", {
          type: DataTypes.STRING,
          allowNull: true,
        }, { transaction });
      }
      await queryInterface.changeColumn("municipes", "nascimento", {
        type: DataTypes.STRING,
        allowNull: true,
      }, { transaction });

      const aes = new AesCryptService();
      const sha = new Sha256CryptService();
      for (const row of rows) {
        const [archived] = await queryInterface.sequelize.query<{ id: string }>(
          "SELECT id FROM bolsistas_legacy_archive WHERE id = :id LIMIT 1",
          { replacements: { id: row.id }, type: QueryTypes.SELECT, transaction },
        );
        if (!archived) {
          await queryInterface.bulkInsert("bolsistas_legacy_archive", [{
            ...row,
            archivedAt: new Date(),
          }], { transaction });
        }

        const cpf = normalizeDigits(row.cpf);
        const cep = normalizeDigits(row.cep);
        const cpfHash = await sha.encrypt(cpf);
        const [existing] = await queryInterface.sequelize.query<ExistingMunicipe>(
          "SELECT uuid, nome, telefone, rua, bairro, cidade, uf, cep, numero FROM municipes WHERE cpfHash = :cpfHash LIMIT 1",
          { replacements: { cpfHash }, type: QueryTypes.SELECT, transaction },
        );
        const municipeUuid = existing?.uuid ?? randomUUID();
        if (existing) {
          const encryptedComparisons: Array<[string, unknown, string | null]> = [
            ["telefone", row.telefone ? normalizeDigits(row.telefone) : null, existing.telefone],
            ["rua", row.logradouro, existing.rua],
            ["bairro", row.bairro, existing.bairro],
            ["cidade", row.cidade, existing.cidade],
            ["uf", row.uf, existing.uf],
            ["cep", cep, existing.cep],
            ["numero", row.numero, existing.numero],
          ];
          const divergentFields = existing.nome.trim() === row.nome.trim()
            ? []
            : ["nome"];
          for (const [field, legacyValue, encryptedValue] of encryptedComparisons) {
            const currentValue = encryptedValue === null
              ? null
              : await aes.decrypt(encryptedValue);
            if (String(currentValue ?? "").trim() !== String(legacyValue ?? "").trim()) {
              divergentFields.push(field);
            }
          }
          if (divergentFields.length > 0) {
            await queryInterface.bulkInsert("bolsistas_migration_divergences", [{
              id: randomUUID(),
              bolsista_id: row.id,
              municipe_uuid: existing.uuid,
              divergent_fields: JSON.stringify(divergentFields),
              createdAt: new Date(),
            }], { transaction });
          }
        } else {
          const encrypt = (value: unknown) => aes.encrypt(String(value ?? ""));
          await queryInterface.bulkInsert("municipes", [{
            uuid: municipeUuid,
            nome: row.nome,
            cpf: await encrypt(cpf),
            nascimento: null,
            telefone: row.telefone ? await encrypt(normalizeDigits(row.telefone)) : null,
            rua: await encrypt(row.logradouro),
            bairro: await encrypt(row.bairro),
            cidade: await encrypt(row.cidade),
            uf: await encrypt(row.uf),
            cep: await encrypt(cep),
            numero: await encrypt(row.numero),
            complemento: null,
            author: "migration:issue-37",
            cpfHash,
            cepHash: await sha.encrypt(cep),
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            deletedAt: null,
          }], { transaction });
        }

        await queryInterface.bulkUpdate("bolsistas", {
          municipe_uuid: municipeUuid,
        }, { id: row.id }, { transaction });
        await queryInterface.bulkUpdate("bolsistas_edital", {
          local: row.local,
        }, { bolsista_id: row.id }, { transaction });
      }

      const [missing] = await queryInterface.sequelize.query<{ count: number }>(
        "SELECT COUNT(*) AS count FROM bolsistas WHERE municipe_uuid IS NULL",
        { type: QueryTypes.SELECT, transaction },
      );
      if (Number(missing?.count ?? 0) > 0) {
        throw new Error("Bolsista migration left records without municipe_uuid");
      }
      const [archiveCount] = await queryInterface.sequelize.query<{ count: number }>(
        "SELECT COUNT(*) AS count FROM bolsistas_legacy_archive",
        { type: QueryTypes.SELECT, transaction },
      );
      if (Number(archiveCount?.count ?? 0) !== rows.length) {
        throw new Error("Bolsista legacy archive count mismatch");
      }
      const duplicateLinks = await queryInterface.sequelize.query(
        "SELECT municipe_uuid FROM bolsistas GROUP BY municipe_uuid HAVING COUNT(*) > 1 LIMIT 1",
        { type: QueryTypes.SELECT, transaction },
      );
      if (duplicateLinks.length > 0) {
        throw new Error("Duplicate municipe linkage detected during bolsista migration");
      }
      const missingLocals = await queryInterface.sequelize.query(
        "SELECT be.id FROM bolsistas_edital be JOIN bolsistas b ON b.id = be.bolsista_id WHERE be.local IS NULL LIMIT 1",
        { type: QueryTypes.SELECT, transaction },
      );
      if (missingLocals.length > 0) {
        throw new Error("Bolsista edital migration left records without local");
      }

      await queryInterface.changeColumn("bolsistas", "municipe_uuid", {
        type: UUID_BIN_TYPE,
        allowNull: false,
      }, { transaction });
      if (!await hasConstraint(queryInterface, "bolsistas", "fk_bolsistas_municipe_uuid", transaction)) {
        await queryInterface.addConstraint("bolsistas", {
          fields: ["municipe_uuid"], type: "foreign key",
          name: "fk_bolsistas_municipe_uuid", references: { table: "municipes", field: "uuid" },
          onDelete: "RESTRICT", onUpdate: "CASCADE", transaction,
        });
      }
      if (!await hasIndex(queryInterface, "bolsistas", "uq_bolsistas_municipe_uuid", transaction)) {
        await queryInterface.addIndex("bolsistas", ["municipe_uuid"], {
          name: "uq_bolsistas_municipe_uuid", unique: true, transaction,
        });
      }
      await queryInterface.changeColumn("bolsistas_edital", "local", {
        type: DataTypes.STRING, allowNull: false,
      }, { transaction });
      for (const field of LEGACY_FIELDS) {
        if (await hasColumn(queryInterface, "bolsistas", field)) {
          await queryInterface.removeColumn("bolsistas", field, { transaction });
        }
      }
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const definitions: Record<string, object> = {
        nome: { type: DataTypes.STRING, allowNull: true },
        cpf: { type: DataTypes.STRING(11), allowNull: true },
        local: { type: DataTypes.STRING, allowNull: true },
        status: { type: DataTypes.STRING(20), allowNull: true },
        cep: { type: DataTypes.STRING(8), allowNull: true },
        numero: { type: DataTypes.STRING, allowNull: true },
        logradouro: { type: DataTypes.STRING, allowNull: true },
        bairro: { type: DataTypes.STRING, allowNull: true },
        cidade: { type: DataTypes.STRING, allowNull: true },
        uf: { type: DataTypes.STRING(2), allowNull: true },
        telefone: { type: DataTypes.STRING(11), allowNull: true },
      };
      for (const field of LEGACY_FIELDS) {
        await queryInterface.addColumn("bolsistas", field, definitions[field]! as any, { transaction });
      }
      await queryInterface.sequelize.query(
        `UPDATE bolsistas b JOIN bolsistas_legacy_archive a ON a.id = b.id SET ${LEGACY_FIELDS.map((field) => `b.${field} = a.${field}`).join(", ")}`,
        { transaction },
      );
      await queryInterface.removeIndex("bolsistas", "uq_bolsistas_municipe_uuid", { transaction });
      await queryInterface.removeConstraint("bolsistas", "fk_bolsistas_municipe_uuid", { transaction });
      await queryInterface.removeColumn("bolsistas", "municipe_uuid", { transaction });
      await queryInterface.removeColumn("bolsistas_edital", "local", { transaction });
      await queryInterface.sequelize.query(
        "DELETE FROM municipes WHERE author = 'migration:issue-37' AND nascimento IS NULL",
        { transaction },
      );
      await queryInterface.changeColumn("municipes", "nascimento", {
        type: DataTypes.STRING, allowNull: false,
      }, { transaction });
      await queryInterface.dropTable("bolsistas_migration_divergences", { transaction });
      await queryInterface.dropTable("bolsistas_legacy_archive", { transaction });
    });
  },
};
