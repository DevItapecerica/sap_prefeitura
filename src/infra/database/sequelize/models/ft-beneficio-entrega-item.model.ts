import { DataTypes as D, type Sequelize } from "sequelize";
import type { DbObject } from "../../../../core/types/DbTypes.js";
import type { BenefitItemModel } from "./ft-beneficios.types.js";

export default (sequelize: Sequelize) => {
  const model = sequelize.define<BenefitItemModel>(
    "FtBeneficioEntregaItem",
    {
      entrega_id: { type: D.UUID, allowNull: false, primaryKey: true },
      beneficio_id: { type: D.UUID, allowNull: false, primaryKey: true },
      nome: { type: D.STRING(120), allowNull: false },
      descricao: { type: D.TEXT, allowNull: true },
    },
    {
      tableName: "ft_beneficio_entrega_itens",
      timestamps: false,
      paranoid: false,
    },
  );
  return Object.assign(model, {
    associate(models: DbObject) {
      model.belongsTo(models.FtBeneficioEntrega, {
        foreignKey: "entrega_id",
        as: "entrega",
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
      });
      model.belongsTo(models.FtEditalBeneficio, {
        foreignKey: "beneficio_id",
        as: "beneficio",
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
      });
    },
  });
};
