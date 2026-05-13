"use strict";

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  // 1️⃣ Adicionar coluna id
  await queryInterface.addColumn("bolsistas_edital", "id", {
    type: Sequelize.UUID,
    allowNull: false,
    defaultValue: Sequelize.literal("UUID()"),
    first: true,
  });

  // 2️⃣ Remover FKs primeiro (MySQL exige)
  await queryInterface.removeConstraint("bolsistas_edital", "bolsistas_edital_ibfk_1");
  await queryInterface.removeConstraint("bolsistas_edital", "bolsistas_edital_ibfk_2");

  // 3️⃣ Remover a PK composta anterior
  await queryInterface.removeConstraint("bolsistas_edital", "PRIMARY");

  // 4️⃣ Definir nova PK
  await queryInterface.addConstraint("bolsistas_edital", {
    fields: ["id"],
    type: "primary key",
    name: "PK_bolsistas_edital_id",
  });

  // 5️⃣ Recriar FK bolsista_id
  await queryInterface.addConstraint("bolsistas_edital", {
    fields: ["bolsista_id"],
    type: "foreign key",
    name: "bolsistas_edital_ibfk_1",
    references: {
      table: "bolsistas",
      field: "id",
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  // 6️⃣ Recriar FK edital_id
  await queryInterface.addConstraint("bolsistas_edital", {
    fields: ["edital_id"],
    type: "foreign key",
    name: "bolsistas_edital_ibfk_2",
    references: {
      table: "edital",
      field: "id",
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
}

export async function down(queryInterface, Sequelize) {
  // Reverter tudo

  await queryInterface.removeConstraint("bolsistas_edital", "bolsistas_edital_ibfk_1");
  await queryInterface.removeConstraint("bolsistas_edital", "bolsistas_edital_ibfk_2");
  await queryInterface.removeConstraint("bolsistas_edital", "PK_bolsistas_edital_id");

  await queryInterface.removeColumn("bolsistas_edital", "id");

  await queryInterface.addConstraint("bolsistas_edital", {
    fields: ["bolsista_id", "edital_id"],
    type: "primary key",
    name: "PRIMARY",
  });

  await queryInterface.addConstraint("bolsistas_edital", {
    fields: ["bolsista_id"],
    type: "foreign key",
    name: "bolsistas_edital_ibfk_1",
    references: {
      table: "bolsistas",
      field: "id",
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  await queryInterface.addConstraint("bolsistas_edital", {
    fields: ["edital_id"],
    type: "foreign key",
    name: "bolsistas_edital_ibfk_2",
    references: {
      table: "edital",
      field: "id",
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
}
