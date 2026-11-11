import { randomUUID } from "node:crypto";
import { DataTypes, QueryInterface, QueryTypes } from "sequelize";

const UUID_BIN_TYPE = "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin";

export const PAGADORES_INICIAIS = [
  ["9d0f3aa1-1143-48d2-9cc2-45d38998fe36", "Secretaria de Esporte e Lazer", 12],
  ["e3f162d8-6187-456c-b85d-fc9243dcbce8", "Secretaria de Planejamento e Meio Ambiente", 20],
  ["22bb6f70-e3fe-49ac-bd62-1fb25afe0a4a", "Secretaria de Turismo", 5],
  ["a763d7f0-8d38-45c6-b985-e9143ca7f4d1", "Secretaria do Desenvolvimento Social e Relacoes do Trabalho", 20],
  ["20e5601e-d3e8-4e63-8991-68d03a14ba2f", "Secretaria de Servicos Urbanos", 193],
  ["d5f9db73-ea63-442d-9aec-05dd5edcd990", "Secretaria de Educacao", 100],
  ["290d6314-54d9-4879-8220-0deb321ef892", "Secretaria de Cultura", 5],
  ["46775c76-069f-45f6-b973-dfa485697ad2", "Administracao", 20],
] as const;

const hasTable = async (queryInterface: QueryInterface, table: string) =>
  typeof queryInterface.tableExists === "function" && queryInterface.tableExists(table);

const hasColumn = async (queryInterface: QueryInterface, table: string, column: string) => {
  const definition = await queryInterface.describeTable(table);
  return column in definition;
};

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      if (!await hasTable(queryInterface, "pagadores")) {
        await queryInterface.createTable("pagadores", {
          uuid: { type: UUID_BIN_TYPE, primaryKey: true, allowNull: false },
          nome: { type: DataTypes.STRING, allowNull: false, unique: true },
          quantidade: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
          createdAt: { type: DataTypes.DATE, allowNull: false },
          updatedAt: { type: DataTypes.DATE, allowNull: false },
          deletedAt: { type: DataTypes.DATE, allowNull: true },
        }, { transaction });
      }

      if (!await hasTable(queryInterface, "pagadores_migration_pending")) {
        await queryInterface.createTable("pagadores_migration_pending", {
          uuid: { type: UUID_BIN_TYPE, primaryKey: true, allowNull: false },
          bolsista_edital_id: { type: UUID_BIN_TYPE, allowNull: true, unique: true },
          bolsista_id: { type: UUID_BIN_TYPE, allowNull: false },
          legacy_pagador_id: { type: DataTypes.STRING(50), allowNull: true },
          motivo: { type: DataTypes.STRING(50), allowNull: false },
          createdAt: { type: DataTypes.DATE, allowNull: false },
        }, { transaction });
      }
      if (!await hasTable(queryInterface, "payment_info_pagador_legacy")) {
        await queryInterface.createTable("payment_info_pagador_legacy", {
          payment_info_id: { type: UUID_BIN_TYPE, primaryKey: true, allowNull: false },
          bolsista_id: { type: UUID_BIN_TYPE, allowNull: false },
          pagador_id: { type: DataTypes.STRING(50), allowNull: true },
          archivedAt: { type: DataTypes.DATE, allowNull: false },
        }, { transaction });
      }

      const now = new Date();
      for (const [uuid, nome, quantidade] of PAGADORES_INICIAIS) {
        const [existing] = await queryInterface.sequelize.query<{ uuid: string }>(
          "SELECT uuid FROM pagadores WHERE uuid = :uuid LIMIT 1",
          { replacements: { uuid }, type: QueryTypes.SELECT, transaction },
        );
        if (!existing) {
          await queryInterface.bulkInsert("pagadores", [{ uuid, nome, quantidade, createdAt: now, updatedAt: now, deletedAt: null }], { transaction });
        }
      }

      if (!await hasColumn(queryInterface, "bolsistas_edital", "pagador_id")) {
        await queryInterface.addColumn("bolsistas_edital", "pagador_id", {
          type: UUID_BIN_TYPE,
          allowNull: true,
        }, { transaction });
        await queryInterface.addConstraint("bolsistas_edital", {
          fields: ["pagador_id"],
          type: "foreign key",
          name: "fk_bolsistas_edital_pagador_id",
          references: { table: "pagadores", field: "uuid" },
          onDelete: "RESTRICT",
          onUpdate: "CASCADE",
          transaction,
        });
        await queryInterface.addIndex("bolsistas_edital", ["edital_id", "pagador_id", "status"], {
          name: "idx_bolsistas_edital_pagador_capacidade",
          transaction,
        });
      }

      const paymentInfoHasPagador = await hasColumn(queryInterface, "payment_info", "pagador_id");
      if (paymentInfoHasPagador) {
        const paymentRows = await queryInterface.sequelize.query<{ id: string; bolsista_id: string; pagador_id: string | null }>(
          "SELECT id, bolsista_id, pagador_id FROM payment_info",
          { type: QueryTypes.SELECT, transaction },
        );
        for (const row of paymentRows) {
          const [archived] = await queryInterface.sequelize.query<{ payment_info_id: string }>(
            "SELECT payment_info_id FROM payment_info_pagador_legacy WHERE payment_info_id = :id LIMIT 1",
            { replacements: { id: row.id }, type: QueryTypes.SELECT, transaction },
          );
          if (!archived) {
            await queryInterface.bulkInsert("payment_info_pagador_legacy", [{
              payment_info_id: row.id,
              bolsista_id: row.bolsista_id,
              pagador_id: row.pagador_id,
              archivedAt: now,
            }], { transaction });
          }
        }
        await queryInterface.sequelize.query(
          "UPDATE bolsistas_edital be JOIN payment_info pi ON pi.bolsista_id = be.bolsista_id " +
          "JOIN pagadores p ON p.uuid = pi.pagador_id SET be.pagador_id = p.uuid",
          { transaction },
        );

        const pendencias = await queryInterface.sequelize.query<{ id: string; bolsista_id: string; pagador_id: string | null }>(
          "SELECT be.id, be.bolsista_id, pi.pagador_id FROM bolsistas_edital be " +
          "LEFT JOIN payment_info pi ON pi.bolsista_id = be.bolsista_id " +
          "WHERE be.pagador_id IS NULL",
          { type: QueryTypes.SELECT, transaction },
        );
        for (const item of pendencias) {
          const [existing] = await queryInterface.sequelize.query<{ uuid: string }>(
            "SELECT uuid FROM pagadores_migration_pending WHERE bolsista_edital_id = :id LIMIT 1",
            { replacements: { id: item.id }, type: QueryTypes.SELECT, transaction },
          );
          if (!existing) {
            await queryInterface.bulkInsert("pagadores_migration_pending", [{
              uuid: randomUUID(),
              bolsista_edital_id: item.id,
              bolsista_id: item.bolsista_id,
              legacy_pagador_id: item.pagador_id,
              motivo: !item.pagador_id || item.pagador_id === "pendente" ? "PENDENTE" : "NAO_RECONHECIDO",
              createdAt: now,
            }], { transaction });
          }
        }

        const [expectedLinks] = await queryInterface.sequelize.query<{ total: number }>(
          "SELECT COUNT(*) AS total FROM bolsistas_edital be JOIN payment_info pi ON pi.bolsista_id = be.bolsista_id JOIN pagadores p ON p.uuid = pi.pagador_id",
          { type: QueryTypes.SELECT, transaction },
        );
        const [migratedLinks] = await queryInterface.sequelize.query<{ total: number }>(
          "SELECT COUNT(*) AS total FROM bolsistas_edital WHERE pagador_id IS NOT NULL",
          { type: QueryTypes.SELECT, transaction },
        );
        if (Number(expectedLinks?.total ?? 0) !== Number(migratedLinks?.total ?? 0)) {
          throw new Error("A contagem de pagadores reconhecidos diverge dos vinculos migrados");
        }
      }

      const [invalid] = await queryInterface.sequelize.query<{ total: number }>(
        "SELECT COUNT(*) AS total FROM bolsistas_edital be LEFT JOIN pagadores p ON p.uuid = be.pagador_id " +
        "WHERE be.pagador_id IS NOT NULL AND p.uuid IS NULL",
        { type: QueryTypes.SELECT, transaction },
      );
      if (Number(invalid?.total ?? 0) > 0) throw new Error("A migracao deixou vinculos com pagador invalido");

      if (paymentInfoHasPagador) {
        await queryInterface.removeColumn("payment_info", "pagador_id", { transaction });
      }
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const multiplos = await queryInterface.sequelize.query(
        "SELECT bolsista_id FROM bolsistas_edital WHERE pagador_id IS NOT NULL " +
        "GROUP BY bolsista_id HAVING COUNT(DISTINCT pagador_id) > 1 LIMIT 1",
        { type: QueryTypes.SELECT, transaction },
      );
      if (multiplos.length > 0) {
        throw new Error("Rollback abortado: existe bolsista com multiplos pagadores distintos");
      }
      if (!await hasColumn(queryInterface, "payment_info", "pagador_id")) {
        await queryInterface.addColumn("payment_info", "pagador_id", {
          type: DataTypes.STRING(50), allowNull: false, defaultValue: "pendente",
        }, { transaction });
      }
      await queryInterface.sequelize.query(
        "UPDATE payment_info pi LEFT JOIN payment_info_pagador_legacy a ON a.payment_info_id = pi.id " +
        "SET pi.pagador_id = COALESCE(a.pagador_id, 'pendente')",
        { transaction },
      );
      if (await hasColumn(queryInterface, "bolsistas_edital", "pagador_id")) {
        await queryInterface.removeIndex("bolsistas_edital", "idx_bolsistas_edital_pagador_capacidade", { transaction });
        await queryInterface.removeConstraint("bolsistas_edital", "fk_bolsistas_edital_pagador_id", { transaction });
        await queryInterface.removeColumn("bolsistas_edital", "pagador_id", { transaction });
      }
      if (await hasTable(queryInterface, "pagadores_migration_pending")) await queryInterface.dropTable("pagadores_migration_pending", { transaction });
      if (await hasTable(queryInterface, "payment_info_pagador_legacy")) await queryInterface.dropTable("payment_info_pagador_legacy", { transaction });
      if (await hasTable(queryInterface, "pagadores")) await queryInterface.dropTable("pagadores", { transaction });
    });
  },
};
