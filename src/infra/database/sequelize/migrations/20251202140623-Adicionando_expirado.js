"use strict";

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.changeColumn("bolsistas_edital", "status", {
    type: Sequelize.ENUM("ativo", "inativo", "concluido", "cancelado", "expirado"),
    allowNull: false,
    defaultValue: "ativo",
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.changeColumn("bolsistas_edital", "status", {
    type: Sequelize.ENUM("ativo", "inativo", "concluido", "cancelado"),
    allowNull: false,
    defaultValue: "ativo",
  });
}
