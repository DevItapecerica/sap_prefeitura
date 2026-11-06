import { QueryInterface } from "sequelize";
import { assertEmptyTables } from "./helpers/fresh-schema.js";

export const tables = ["ft_folhas_fechadas"];

export default {
  async up(query: QueryInterface): Promise<void> {
    await query.createTable(
      "ft_folhas_fechadas",
      {
        id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
          primaryKey: true,
        },
        edital_id: {
          type: "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
          allowNull: false,
        },
        mes: { type: "VARCHAR(7)", allowNull: false },
        fechado_por: { type: "VARCHAR(64)", allowNull: false },
        fechado_em: { type: "DATETIME", allowNull: false },
        versao: { type: "VARCHAR(64)", allowNull: false },
        snapshot: { type: "LONGTEXT", allowNull: false },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex("ft_folhas_fechadas", ["edital_id", "mes"], {
      name: "uq_ft_folha_edital_mes",
      unique: true,
    });
    await query.addConstraint("ft_folhas_fechadas", {
      fields: ["edital_id"],
      type: "foreign key",
      name: "ft_folhas_fechadas_ibfk_1",
      references: { table: "edital", field: "id" },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
  },
  async down(query: QueryInterface): Promise<void> {
    await assertEmptyTables(query, ["ft_folhas_fechadas"]);
    await query.dropTable("ft_folhas_fechadas");
  },
};
