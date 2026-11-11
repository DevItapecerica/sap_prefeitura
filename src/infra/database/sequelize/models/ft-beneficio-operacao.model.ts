import { DataTypes as D, type Sequelize } from "sequelize";
import type { DbObject } from "../../../../core/types/DbTypes.js";
import type { BenefitOperationModel } from "./ft-beneficios.types.js";

export default (sequelize: Sequelize) => {
  const model = sequelize.define<BenefitOperationModel>(
    "FtBeneficioOperacao",
    {
      id: { type: D.UUID, allowNull: false, primaryKey: true },
      edital_id: { type: D.UUID, allowNull: false },
      assinatura: { type: D.TEXT, allowNull: false },
      resultado: { type: D.TEXT("long"), allowNull: false },
    },
    { tableName: "ft_beneficio_operacoes", timestamps: false, paranoid: false },
  );
  return Object.assign(model, {
    associate(models: DbObject) {
      model.belongsTo(models.Edital, {
        foreignKey: "edital_id",
        as: "edital",
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
      });
    },
  });
};
