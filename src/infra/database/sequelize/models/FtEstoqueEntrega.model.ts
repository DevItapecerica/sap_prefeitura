import { Sequelize } from "sequelize";
import { estoqueTables } from "./ft-estoque.schema.js";
export default (sequelize: Sequelize) => {
  const { table, columns } = estoqueTables.FtEstoqueEntrega;
  return sequelize.define("FtEstoqueEntrega", columns, {
    tableName: table,
    timestamps: true,
    indexes: [
      {
        name: "uq_ft_estoque_kit_ativo",
        unique: true,
        fields: ["kit_ativo_participacao_id"],
      },
    ],
  });
};
