import { QueryInterface } from "sequelize";
import { assertEmptyTables } from "./helpers/fresh-schema.js";

export const tables = [
  "esporte_modalidades",
  "esporte_atletas",
  "esporte_atleta_modalidades",
  "carterinhas_esporte",
];

export default {
  async up(query: QueryInterface): Promise<void> {
    await query.createTable(
      "esporte_modalidades",
      {
        uuid: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
          primaryKey: true,
        },
        nome: { type: "VARCHAR(255)", allowNull: false },
        createdAt: { type: "DATETIME", allowNull: false },
        updatedAt: { type: "DATETIME", allowNull: false },
        deletedAt: { type: "DATETIME", allowNull: true },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex("esporte_modalidades", ["nome"], {
      name: "nome",
      unique: true,
    });
    await query.createTable(
      "esporte_atletas",
      {
        uuid: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
          primaryKey: true,
        },
        municipe_uuid: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
        },
        ativo: { type: "TINYINT(1)", allowNull: false, defaultValue: 1 },
        author: { type: "VARCHAR(255)", allowNull: false },
        createdAt: { type: "DATETIME", allowNull: false },
        updatedAt: { type: "DATETIME", allowNull: false },
        deletedAt: { type: "DATETIME", allowNull: true },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex("esporte_atletas", ["municipe_uuid"], {
      name: "fk_esporte_atletas_municipe_uuid",
      unique: false,
    });
    await query.createTable(
      "esporte_atleta_modalidades",
      {
        uuid: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
          primaryKey: true,
        },
        atleta_uuid: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
        },
        modalidade_uuid: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
        },
        createdAt: { type: "DATETIME", allowNull: false },
        updatedAt: { type: "DATETIME", allowNull: false },
        deletedAt: { type: "DATETIME", allowNull: true },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex(
      "esporte_atleta_modalidades",
      ["atleta_uuid", "modalidade_uuid"],
      { name: "esporte_atleta_modalidades_unique", unique: true },
    );
    await query.addIndex("esporte_atleta_modalidades", ["modalidade_uuid"], {
      name: "modalidade_uuid",
      unique: false,
    });
    await query.createTable(
      "carterinhas_esporte",
      {
        uuid: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
          primaryKey: true,
        },
        emissao: { type: "DATETIME", allowNull: false },
        validade: { type: "DATETIME", allowNull: true },
        municipe_uuid: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
        },
        modalidade: { type: "VARCHAR(255)", allowNull: false },
        author: { type: "VARCHAR(255)", allowNull: false },
        createdAt: { type: "DATETIME", allowNull: false },
        updatedAt: { type: "DATETIME", allowNull: false },
        deletedAt: { type: "DATETIME", allowNull: true },
        observacao: { type: "TEXT", allowNull: true },
        validade_exame: { type: "DATETIME", allowNull: true },
        foto: { type: "LONGTEXT", allowNull: true },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex("carterinhas_esporte", ["municipe_uuid"], {
      name: "fk_carterinhas_esporte_municipe_uuid",
      unique: false,
    });
    await query.addConstraint("esporte_atletas", {
      fields: ["municipe_uuid"],
      type: "foreign key",
      name: "fk_esporte_atletas_municipe_uuid",
      references: { table: "municipes", field: "uuid" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
    await query.addConstraint("esporte_atleta_modalidades", {
      fields: ["atleta_uuid"],
      type: "foreign key",
      name: "esporte_atleta_modalidades_ibfk_1",
      references: { table: "esporte_atletas", field: "uuid" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await query.addConstraint("esporte_atleta_modalidades", {
      fields: ["modalidade_uuid"],
      type: "foreign key",
      name: "esporte_atleta_modalidades_ibfk_2",
      references: { table: "esporte_modalidades", field: "uuid" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await query.addConstraint("carterinhas_esporte", {
      fields: ["municipe_uuid"],
      type: "foreign key",
      name: "fk_carterinhas_esporte_municipe_uuid",
      references: { table: "municipes", field: "uuid" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
  },
  async down(query: QueryInterface): Promise<void> {
    await assertEmptyTables(query, [
      "esporte_modalidades",
      "esporte_atletas",
      "esporte_atleta_modalidades",
      "carterinhas_esporte",
    ]);
    await query.dropTable("carterinhas_esporte");
    await query.dropTable("esporte_atleta_modalidades");
    await query.dropTable("esporte_atletas");
    await query.dropTable("esporte_modalidades");
  },
};
