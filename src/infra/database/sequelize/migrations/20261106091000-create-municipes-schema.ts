import { QueryInterface } from "sequelize";
import { assertEmptyTables } from "./helpers/fresh-schema.js";

export const tables = ["municipes", "carterinhas"];

export default {
  async up(query: QueryInterface): Promise<void> {
    await query.createTable(
      "municipes",
      {
        uuid: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
          primaryKey: true,
        },
        nome: { type: "VARCHAR(255)", allowNull: false },
        cpf: { type: "VARCHAR(255)", allowNull: false },
        nascimento: { type: "VARCHAR(255)", allowNull: true },
        telefone: { type: "VARCHAR(255)", allowNull: true },
        rua: { type: "VARCHAR(255)", allowNull: false },
        bairro: { type: "VARCHAR(255)", allowNull: false },
        cidade: { type: "VARCHAR(255)", allowNull: false },
        uf: { type: "VARCHAR(255)", allowNull: false },
        cep: { type: "VARCHAR(255)", allowNull: false },
        numero: { type: "VARCHAR(255)", allowNull: false },
        complemento: { type: "VARCHAR(255)", allowNull: true },
        author: { type: "VARCHAR(255)", allowNull: false },
        cpfHash: { type: "VARCHAR(255)", allowNull: false },
        cepHash: { type: "VARCHAR(255)", allowNull: false },
        createdAt: { type: "DATETIME", allowNull: false },
        updatedAt: { type: "DATETIME", allowNull: false },
        deletedAt: { type: "DATETIME", allowNull: true },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.createTable(
      "carterinhas",
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
        origem: { type: "VARCHAR(255)", allowNull: false },
        atividade: { type: "VARCHAR(255)", allowNull: true },
        author: { type: "VARCHAR(255)", allowNull: false },
        createdAt: { type: "DATETIME", allowNull: false },
        updatedAt: { type: "DATETIME", allowNull: false },
        deletedAt: { type: "DATETIME", allowNull: true },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex("carterinhas", ["municipe_uuid"], {
      name: "fk_carterinhas_municipe_uuid",
      unique: false,
    });
    await query.addConstraint("carterinhas", {
      fields: ["municipe_uuid"],
      type: "foreign key",
      name: "fk_carterinhas_municipe_uuid",
      references: { table: "municipes", field: "uuid" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
  },
  async down(query: QueryInterface): Promise<void> {
    await assertEmptyTables(query, ["municipes", "carterinhas"]);
    await query.dropTable("carterinhas");
    await query.dropTable("municipes");
  },
};
