import { DataTypes, QueryInterface, literal } from "sequelize";

const UUID_BIN_TYPE = "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin";

/** @type {import("sequelize-cli").Migration} */
export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.createTable("bolsistas", {
      id: {
        type: UUID_BIN_TYPE,
        defaultValue: literal("UUID()"),
        primaryKey: true,
        allowNull: false,
      },
      nome: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cpf: {
        type: DataTypes.STRING(11),
        allowNull: false,
      },
      local: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("ativo", "inativo", "pendente"),
        allowNull: false,
        defaultValue: "inativo",
      },
      cep: {
        type: DataTypes.STRING(8),
        allowNull: false,
        defaultValue: "NA",
      },
      numero: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "NA",
      },
      logradouro: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "NA",
      },
      bairro: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "NA",
      },
      cidade: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "NA",
      },
      uf: {
        type: DataTypes.STRING(2),
        allowNull: false,
        defaultValue: "NA",
      },
      telefone: {
        type: DataTypes.STRING(11),
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("edital", {
      id: {
        type: UUID_BIN_TYPE,
        defaultValue: literal("UUID()"),
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      data_publicacao: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      data_vencimento: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      dia_pagamento: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      valor_bolsa: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("ativo", "inativo"),
        defaultValue: "ativo",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: literal("CURRENT_TIMESTAMP"),
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });

    await queryInterface.createTable("bolsista_image", {
      id: {
        type: UUID_BIN_TYPE,
        defaultValue: literal("UUID()"),
        primaryKey: true,
        allowNull: false,
      },
      bolsista_id: {
        type: UUID_BIN_TYPE,
        allowNull: false,
        references: {
          model: "bolsistas",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      path: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      mime: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: literal("CURRENT_TIMESTAMP"),
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });

    await queryInterface.createTable("payment_info", {
      id: {
        type: UUID_BIN_TYPE,
        defaultValue: literal("UUID()"),
        primaryKey: true,
        allowNull: false,
      },
      bolsista_id: {
        type: UUID_BIN_TYPE,
        allowNull: false,
        references: {
          model: "bolsistas",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      bco: {
        type: DataTypes.STRING(3),
        allowNull: false,
      },
      pagador_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "pendente",
      },
      ag: {
        type: DataTypes.STRING(4),
        allowNull: false,
      },
      dig_ag: {
        type: DataTypes.STRING(1),
        allowNull: false,
      },
      conta: {
        type: DataTypes.STRING(11),
        allowNull: false,
      },
      dig_conta: {
        type: DataTypes.STRING(1),
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: literal("CURRENT_TIMESTAMP"),
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });

    await queryInterface.createTable("bolsistas_edital", {
      bolsista_id: {
        type: UUID_BIN_TYPE,
        allowNull: false,
        primaryKey: true,
        references: {
          model: "bolsistas",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      edital_id: {
        type: UUID_BIN_TYPE,
        allowNull: false,
        primaryKey: true,
        references: {
          model: "edital",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      data_vinculo: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: literal("CURRENT_TIMESTAMP"),
      },
      status: {
        type: DataTypes.ENUM("ativo", "inativo", "concluido", "cancelado"),
        allowNull: false,
        defaultValue: "ativo",
      },
      expire_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      prorrogated: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: literal("CURRENT_TIMESTAMP"),
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable("bolsistas_edital");
    await queryInterface.dropTable("payment_info");
    await queryInterface.dropTable("bolsista_image");
    await queryInterface.dropTable("edital");
    await queryInterface.dropTable("bolsistas");
  },
};
