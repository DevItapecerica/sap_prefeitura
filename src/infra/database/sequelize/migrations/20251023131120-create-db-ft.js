"use strict";

/** @type {import('sequelize-cli').Migration} */

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("bolsistas", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal("UUID()"),
      primaryKey: true,
      allowNull: false,
    },
    nome: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    cpf: {
      type: Sequelize.STRING(11),
      allowNull: false,
      unique: true,
    },
    local: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM("ativo", "inativo", "pendente"),
      allowNull: false,
      defaultValue: "inativo",
    },
    cep: {
      type: Sequelize.STRING(8),
      allowNull: false,
      defaultValue: "NA",
    },
    numero: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "NA",
    },
    logradouro: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "NA",
    },
    bairro: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "NA",
    },
    cidade: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "NA",
    },
    uf: {
      type: Sequelize.STRING(2),
      allowNull: false,
      defaultValue: "NA",
    },
    telefone: {
      type: Sequelize.STRING(11),
      allowNull: true,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    deletedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
  });
  await queryInterface.createTable("edital", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal("UUID()"),
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    data_publicacao: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    data_vencimento: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    dia_pagamento: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    valor_bolsa: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM("ativo", "inativo"),
      defaultValue: "ativo",
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    deletedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
  });
  await queryInterface.createTable("bolsista_image", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal("UUID()"),
      primaryKey: true,
      allowNull: false,
    },
    bolsista_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "bolsistas", // nome da tabela no banco
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    type_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    path: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    mime: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    deletedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
  });
  await queryInterface.createTable("payment_info", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal("UUID()"),
      primaryKey: true,
      allowNull: false,
    },
    bolsista_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "bolsistas", // nome da tabela, não do model
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    bco: {
      type: Sequelize.STRING(3),
      allowNull: false,
    },
    pagador_id: {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: "pendente",
    },
    ag: {
      type: Sequelize.STRING(4),
      allowNull: false,
    },
    dig_ag: {
      type: Sequelize.STRING(1),
      allowNull: false,
    },
    conta: {
      type: Sequelize.STRING(11),
      allowNull: false,
    },
    dig_conta: {
      type: Sequelize.STRING(1),
      allowNull: false,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    deletedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
  });
  await queryInterface.createTable("bolsistas_edital", {
    bolsista_id: {
      type: Sequelize.UUID,
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
      type: Sequelize.UUID,
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
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    status: {
      type: Sequelize.ENUM("ativo", "inativo", "concluido", "cancelado"),
      allowNull: false,
      defaultValue: "ativo",
    },
    expire_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    prorrogated: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    deletedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable("bolsistas_edital");
  await queryInterface.dropTable("payment_info");
  await queryInterface.dropTable("bolsista_image");
  await queryInterface.dropTable("edital");
  await queryInterface.dropTable("bolsistas");
}
