import { QueryInterface, DataTypes } from "sequelize";

/** @type {import("sequelize-cli").Migration} */
export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "chamados",
        {
          id: {
            type: DataTypes.STRING(36),
            allowNull: false,
            primaryKey: true,
          },
          patrimonio: {
            type: DataTypes.STRING(255),
            allowNull: false,
          },
          status: {
            type: DataTypes.ENUM(
              "aberto",
              "em_progresso",
              "resolvido",
              "fechado",
              "cancelado",
            ),
            allowNull: false,
            defaultValue: "aberto",
          },
          tipo: {
            type: DataTypes.ENUM(
              "manutencao",
              "reparo",
              "instalacao",
              "suporte",
              "outros",
            ),
            allowNull: false,
          },
          dataEntrada: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
          },
          setorId: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
          solicitanteId: {
            type: DataTypes.STRING(36),
            allowNull: true,
            defaultValue: null,
          },
          descricao: {
            type: DataTypes.TEXT("long"),
            allowNull: false,
          },
          prioridade: {
            type: DataTypes.ENUM("baixa", "media", "alta", "critica"),
            allowNull: false,
            defaultValue: "media",
          },
          responsavelId: {
            type: DataTypes.STRING(36),
            allowNull: true,
            defaultValue: null,
          },
          observacoes: {
            type: DataTypes.TEXT("long"),
            allowNull: true,
            defaultValue: null,
          },
          dataResolucao: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
          },
          updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
          },
          deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
          },
        },
        {
          engine: "InnoDB",
          charset: "utf8mb4",
          collate: "utf8mb4_unicode_ci",
          transaction,
        },
      );

      await queryInterface.addIndex("chamados", ["status"], {
        name: "idx_status",
        transaction,
      });
      await queryInterface.addIndex("chamados", ["setorId"], {
        name: "idx_setorId",
        transaction,
      });
      await queryInterface.addIndex("chamados", ["solicitanteId"], {
        name: "idx_solicitanteId",
        transaction,
      });
      await queryInterface.addIndex("chamados", ["responsavelId"], {
        name: "idx_responsavelId",
        transaction,
      });
      await queryInterface.addIndex("chamados", ["dataEntrada"], {
        name: "idx_dataEntrada",
        transaction,
      });
      await queryInterface.addIndex("chamados", ["tipo"], {
        name: "idx_tipo",
        transaction,
      });
      await queryInterface.addIndex("chamados", ["prioridade"], {
        name: "idx_prioridade",
        transaction,
      });
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("chamados", { transaction });
    });
  },
};
