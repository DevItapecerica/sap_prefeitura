import { QueryInterface } from "sequelize";
import { assertEmptyTables } from "./helpers/fresh-schema.js";

export const tables = [
  "ft_estoque_controle",
  "ft_estoque_itens",
  "ft_estoque_variacoes",
  "ft_estoque_entregas",
  "ft_estoque_entrega_itens",
  "ft_estoque_movimentos",
  "ft_estoque_operacoes",
];

export default {
  async up(query: QueryInterface): Promise<void> {
    await query.createTable(
      "ft_estoque_controle",
      {
        id: { type: "INT(11)", allowNull: false, primaryKey: true },
        versao: { type: "INT(10) UNSIGNED", allowNull: false, defaultValue: 0 },
        createdAt: { type: "DATETIME", allowNull: false },
        updatedAt: { type: "DATETIME", allowNull: false },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.createTable(
      "ft_estoque_itens",
      {
        id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
          primaryKey: true,
        },
        nome: { type: "VARCHAR(120)", allowNull: false },
        epi: { type: "TINYINT(1)", allowNull: false },
        ativo: { type: "TINYINT(1)", allowNull: false, defaultValue: 1 },
        createdAt: { type: "DATETIME", allowNull: false },
        updatedAt: { type: "DATETIME", allowNull: false },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.createTable(
      "ft_estoque_variacoes",
      {
        id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
          primaryKey: true,
        },
        item_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
        },
        tamanho: { type: "VARCHAR(40)", allowNull: false },
        tamanho_chave: { type: "VARCHAR(40)", allowNull: false },
        custo_centavos: {
          type: "INT(10) UNSIGNED",
          allowNull: false,
          defaultValue: 0,
        },
        saldo: { type: "INT(10) UNSIGNED", allowNull: false, defaultValue: 0 },
        ativo: { type: "TINYINT(1)", allowNull: false, defaultValue: 1 },
        createdAt: { type: "DATETIME", allowNull: false },
        updatedAt: { type: "DATETIME", allowNull: false },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex("ft_estoque_variacoes", ["item_id", "tamanho_chave"], {
      name: "uq_ft_estoque_tamanho",
      unique: true,
    });
    await query.createTable(
      "ft_estoque_entregas",
      {
        id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
          primaryKey: true,
        },
        participacao_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
        },
        edital_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
        },
        bolsista_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
        },
        kit_ativo_participacao_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: true,
        },
        tipo: { type: "ENUM('kit','individual')", allowNull: false },
        autor_id: { type: "VARCHAR(64)", allowNull: false },
        entregue_em: { type: "DATETIME", allowNull: false },
        justificativa: { type: "TEXT", allowNull: true },
        total_centavos: { type: "BIGINT(20) UNSIGNED", allowNull: false },
        estornado_em: { type: "DATETIME", allowNull: true },
        estornado_por: { type: "VARCHAR(64)", allowNull: true },
        motivo_estorno: { type: "TEXT", allowNull: true },
        createdAt: { type: "DATETIME", allowNull: false },
        updatedAt: { type: "DATETIME", allowNull: false },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex("ft_estoque_entregas", ["kit_ativo_participacao_id"], {
      name: "uq_ft_estoque_kit_ativo",
      unique: true,
    });
    await query.addIndex("ft_estoque_entregas", ["edital_id"], {
      name: "edital_id",
      unique: false,
    });
    await query.addIndex("ft_estoque_entregas", ["bolsista_id"], {
      name: "bolsista_id",
      unique: false,
    });
    await query.addIndex(
      "ft_estoque_entregas",
      ["participacao_id", "entregue_em"],
      { name: "idx_ft_estoque_destinatario", unique: false },
    );
    await query.createTable(
      "ft_estoque_entrega_itens",
      {
        id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
          primaryKey: true,
        },
        entrega_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
        },
        variacao_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
        },
        nome: { type: "VARCHAR(120)", allowNull: false },
        tamanho: { type: "VARCHAR(40)", allowNull: false },
        quantidade: {
          type: "INT(10) UNSIGNED",
          allowNull: false,
          defaultValue: 0,
        },
        custo_centavos: {
          type: "INT(10) UNSIGNED",
          allowNull: false,
          defaultValue: 0,
        },
        createdAt: { type: "DATETIME", allowNull: false },
        updatedAt: { type: "DATETIME", allowNull: false },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex("ft_estoque_entrega_itens", ["entrega_id"], {
      name: "entrega_id",
      unique: false,
    });
    await query.addIndex("ft_estoque_entrega_itens", ["variacao_id"], {
      name: "variacao_id",
      unique: false,
    });
    await query.createTable(
      "ft_estoque_movimentos",
      {
        id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
          primaryKey: true,
        },
        variacao_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
        },
        entrega_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: true,
        },
        tipo: {
          type: "ENUM('entrada','ajuste','entrega','estorno')",
          allowNull: false,
        },
        delta: { type: "INT(11)", allowNull: false },
        saldo_apos: {
          type: "INT(10) UNSIGNED",
          allowNull: false,
          defaultValue: 0,
        },
        autor_id: { type: "VARCHAR(64)", allowNull: false },
        data: { type: "DATETIME", allowNull: false },
        motivo: { type: "TEXT", allowNull: true },
        createdAt: { type: "DATETIME", allowNull: false },
        updatedAt: { type: "DATETIME", allowNull: false },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex("ft_estoque_movimentos", ["entrega_id"], {
      name: "entrega_id",
      unique: false,
    });
    await query.addIndex("ft_estoque_movimentos", ["variacao_id", "data"], {
      name: "idx_ft_estoque_movimentos",
      unique: false,
    });
    await query.createTable(
      "ft_estoque_operacoes",
      {
        id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
          primaryKey: true,
        },
        assinatura: { type: "VARCHAR(64)", allowNull: false },
        resultado: { type: "LONGTEXT", allowNull: false },
        createdAt: { type: "DATETIME", allowNull: false },
        updatedAt: { type: "DATETIME", allowNull: false },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addConstraint("ft_estoque_variacoes", {
      fields: ["item_id"],
      type: "foreign key",
      name: "ft_estoque_variacoes_ibfk_1",
      references: { table: "ft_estoque_itens", field: "id" },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
    await query.addConstraint("ft_estoque_entregas", {
      fields: ["participacao_id"],
      type: "foreign key",
      name: "ft_estoque_entregas_ibfk_1",
      references: { table: "bolsistas_edital", field: "id" },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
    await query.addConstraint("ft_estoque_entregas", {
      fields: ["edital_id"],
      type: "foreign key",
      name: "ft_estoque_entregas_ibfk_2",
      references: { table: "edital", field: "id" },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
    await query.addConstraint("ft_estoque_entregas", {
      fields: ["bolsista_id"],
      type: "foreign key",
      name: "ft_estoque_entregas_ibfk_3",
      references: { table: "bolsistas", field: "id" },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
    await query.addConstraint("ft_estoque_entregas", {
      fields: ["kit_ativo_participacao_id"],
      type: "foreign key",
      name: "ft_estoque_entregas_ibfk_4",
      references: { table: "bolsistas_edital", field: "id" },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
    await query.addConstraint("ft_estoque_entrega_itens", {
      fields: ["entrega_id"],
      type: "foreign key",
      name: "ft_estoque_entrega_itens_ibfk_1",
      references: { table: "ft_estoque_entregas", field: "id" },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
    await query.addConstraint("ft_estoque_entrega_itens", {
      fields: ["variacao_id"],
      type: "foreign key",
      name: "ft_estoque_entrega_itens_ibfk_2",
      references: { table: "ft_estoque_variacoes", field: "id" },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
    await query.addConstraint("ft_estoque_movimentos", {
      fields: ["variacao_id"],
      type: "foreign key",
      name: "ft_estoque_movimentos_ibfk_1",
      references: { table: "ft_estoque_variacoes", field: "id" },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
    await query.addConstraint("ft_estoque_movimentos", {
      fields: ["entrega_id"],
      type: "foreign key",
      name: "ft_estoque_movimentos_ibfk_2",
      references: { table: "ft_estoque_entregas", field: "id" },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
  },
  async down(query: QueryInterface): Promise<void> {
    await assertEmptyTables(query, [
      "ft_estoque_itens",
      "ft_estoque_variacoes",
      "ft_estoque_entregas",
      "ft_estoque_entrega_itens",
      "ft_estoque_movimentos",
      "ft_estoque_operacoes",
    ]);
    await query.dropTable("ft_estoque_operacoes");
    await query.dropTable("ft_estoque_movimentos");
    await query.dropTable("ft_estoque_entrega_itens");
    await query.dropTable("ft_estoque_entregas");
    await query.dropTable("ft_estoque_variacoes");
    await query.dropTable("ft_estoque_itens");
    await query.dropTable("ft_estoque_controle");
  },
};
