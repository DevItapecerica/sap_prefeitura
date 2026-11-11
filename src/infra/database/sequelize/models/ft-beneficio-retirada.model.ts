import { DataTypes as D, type Sequelize } from "sequelize";
import type { DbObject } from "../../../../core/types/DbTypes.js";
import type { BenefitCoverageModel } from "./ft-beneficios.types.js";

export default (sequelize: Sequelize) => {
  const model = sequelize.define<BenefitCoverageModel>(
    "FtBeneficioRetirada",
    {
      edital_id: { type: D.UUID, allowNull: false, primaryKey: true },
      pessoa_id: { type: D.UUID, allowNull: false, primaryKey: true },
      beneficio_id: { type: D.UUID, allowNull: false, primaryKey: true },
      mes: { type: D.STRING(7), allowNull: false, primaryKey: true },
      entrega_id: { type: D.UUID, allowNull: false },
    },
    { tableName: "ft_beneficio_retiradas", timestamps: false, paranoid: false },
  );
  return Object.assign(model, {
    associate(models: DbObject) {
      model.belongsTo(models.FtBeneficioEntrega, {
        foreignKey: "entrega_id",
        as: "entrega",
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
      });
      model.belongsTo(models.Edital, {
        foreignKey: "edital_id",
        as: "edital",
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
      });
      model.belongsTo(models.MunicipeModel, {
        foreignKey: "pessoa_id",
        as: "pessoa",
        targetKey: "uuid",
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
