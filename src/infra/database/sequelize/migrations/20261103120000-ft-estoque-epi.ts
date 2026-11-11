import { DataTypes as D, QueryInterface, QueryTypes } from "sequelize";
import { estoqueTables } from "../models/ft-estoque.schema.js";

export default {
  async up(q: QueryInterface) {
    const relations: Record<string, Record<string, [string, string]>> = {
      ft_estoque_variacoes: { item_id: ["ft_estoque_itens", "id"] },
      ft_estoque_entregas: {
        participacao_id: ["bolsistas_edital", "id"],
        edital_id: ["edital", "id"],
        bolsista_id: ["bolsistas", "id"],
        kit_ativo_participacao_id: ["bolsistas_edital", "id"],
      },
      ft_estoque_entrega_itens: {
        entrega_id: ["ft_estoque_entregas", "id"],
        variacao_id: ["ft_estoque_variacoes", "id"],
      },
      ft_estoque_movimentos: {
        variacao_id: ["ft_estoque_variacoes", "id"],
        entrega_id: ["ft_estoque_entregas", "id"],
      },
    };
    for (const { table, columns } of Object.values(estoqueTables)) {
      const definitions: any = {
        ...columns,
        createdAt: { type: D.DATE, allowNull: false },
        updatedAt: { type: D.DATE, allowNull: false },
      };
      for (const [field, [model, key]] of Object.entries(
        relations[table] || {},
      ))
        definitions[field] = {
          ...definitions[field],
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          references: { model, key },
          onDelete: "RESTRICT",
          onUpdate: "RESTRICT",
        };
      await q.createTable(table, definitions);
    }
    await q.addIndex("ft_estoque_variacoes", ["item_id", "tamanho_chave"], {
      name: "uq_ft_estoque_tamanho",
      unique: true,
    });
    await q.addIndex("ft_estoque_entregas", ["kit_ativo_participacao_id"], {
      name: "uq_ft_estoque_kit_ativo",
      unique: true,
    });
    await q.addIndex(
      "ft_estoque_entregas",
      ["participacao_id", "entregue_em"],
      { name: "idx_ft_estoque_destinatario" },
    );
    await q.addIndex("ft_estoque_movimentos", ["variacao_id", "data"], {
      name: "idx_ft_estoque_movimentos",
    });
    await q.bulkInsert("ft_estoque_controle", [
      { id: 1, versao: 0, createdAt: new Date(), updatedAt: new Date() },
    ]);
  },
  async down(q: QueryInterface) {
    const [row] = await q.sequelize.query<{ total: number }>(
      "SELECT (SELECT COUNT(*) FROM ft_estoque_itens) + (SELECT COUNT(*) FROM ft_estoque_movimentos) + (SELECT COUNT(*) FROM ft_estoque_entregas) AS total",
      { type: QueryTypes.SELECT },
    );
    if (Number(row.total))
      throw new Error(
        "Rollback refused: preserve inventory and deliveries; use a forward fix.",
      );
    for (const { table } of Object.values(estoqueTables).reverse())
      await q.dropTable(table);
  },
};
