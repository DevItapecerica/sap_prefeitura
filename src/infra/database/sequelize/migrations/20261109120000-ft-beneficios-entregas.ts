import { DataTypes as D, QueryInterface, QueryTypes } from "sequelize";
const uuid = () => ({
  type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
  allowNull: false,
});
const reference = (table: string, key = "id") => ({
  ...uuid(),
  references: { model: table, key },
  onDelete: "RESTRICT",
  onUpdate: "RESTRICT",
});
export const benefitTables = [
  "ft_beneficio_entregas",
  "ft_beneficio_entrega_itens",
  "ft_beneficio_retiradas",
  "ft_beneficio_operacoes",
];
export default {
  async up(q: QueryInterface) {
    await q.createTable("ft_beneficio_entregas", {
      id: { ...uuid(), primaryKey: true },
      edital_id: reference("edital"),
      participacao_id: reference("bolsistas_edital"),
      pessoa_id: reference("municipes", "uuid"),
      mes: { type: D.STRING(7), allowNull: false },
      entregue_em: { type: D.DATE, allowNull: false },
      autor_id: { type: D.STRING(64), allowNull: false },
      responsavel: { type: D.TEXT, allowNull: false },
      estornado_em: { type: D.DATE, allowNull: true },
      estornado_por: { type: D.STRING(64), allowNull: true },
      responsavel_estorno: { type: D.TEXT, allowNull: true },
      motivo_estorno: { type: D.TEXT, allowNull: true },
    });
    await q.createTable("ft_beneficio_entrega_itens", {
      entrega_id: { ...reference("ft_beneficio_entregas"), primaryKey: true },
      beneficio_id: { ...reference("ft_edital_beneficios"), primaryKey: true },
      nome: { type: D.STRING(120), allowNull: false },
      descricao: { type: D.TEXT, allowNull: true },
    });
    await q.createTable("ft_beneficio_retiradas", {
      edital_id: { ...reference("edital"), primaryKey: true },
      pessoa_id: { ...reference("municipes", "uuid"), primaryKey: true },
      beneficio_id: { ...reference("ft_edital_beneficios"), primaryKey: true },
      mes: { type: D.STRING(7), allowNull: false, primaryKey: true },
      entrega_id: reference("ft_beneficio_entregas"),
    });
    await q.createTable("ft_beneficio_operacoes", {
      id: { ...uuid(), primaryKey: true },
      edital_id: reference("edital"),
      assinatura: { type: D.TEXT, allowNull: false },
      resultado: { type: D.TEXT("long"), allowNull: false },
    });
    await q.addIndex(
      "ft_beneficio_entregas",
      ["edital_id", "mes", "entregue_em"],
      { name: "idx_ft_beneficios_mes" },
    );
    await q.addIndex(
      "ft_beneficio_entregas",
      ["participacao_id", "entregue_em"],
      { name: "idx_ft_beneficios_participacao" },
    );
  },
  async down(q: QueryInterface) {
    const [row] = await q.sequelize.query<{ total: number }>(
      "SELECT COUNT(*) AS total FROM ft_beneficio_entregas",
      { type: QueryTypes.SELECT },
    );
    if (Number(row.total))
      throw new Error("Rollback refused: preserve benefit delivery history.");
    for (const table of [...benefitTables].reverse()) await q.dropTable(table);
  },
};
