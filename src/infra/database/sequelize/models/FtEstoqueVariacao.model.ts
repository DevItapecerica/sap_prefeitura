import { Sequelize } from "sequelize";
import { estoqueTables } from "./ft-estoque.schema.js";
export default (sequelize: Sequelize) => {
  const { table, columns } = estoqueTables.FtEstoqueVariacao;
  return sequelize.define("FtEstoqueVariacao", columns, {
    tableName: table,
    timestamps: true,
    indexes: [
      {
        name: "uq_ft_estoque_tamanho",
        unique: true,
        fields: ["item_id", "tamanho_chave"],
      },
    ],
  });
};
