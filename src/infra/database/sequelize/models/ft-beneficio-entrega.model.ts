import { DataTypes as D, type Sequelize } from "sequelize";
import type { DbObject } from "../../../../core/types/DbTypes.js";
import type { BenefitDeliveryModel } from "./ft-beneficios.types.js";

export default (sequelize: Sequelize) => {
  const model = sequelize.define<BenefitDeliveryModel>(
    "FtBeneficioEntrega",
    {
      id: { type: D.UUID, primaryKey: true, allowNull: false },
      edital_id: { type: D.UUID, allowNull: false },
      participacao_id: { type: D.UUID, allowNull: false },
      pessoa_id: { type: D.UUID, allowNull: false },
      mes: { type: D.STRING(7), allowNull: false },
      entregue_em: { type: D.DATE, allowNull: false },
      autor_id: { type: D.STRING(64), allowNull: false },
      responsavel: { type: D.TEXT, allowNull: false },
      estornado_em: { type: D.DATE, allowNull: true },
      estornado_por: { type: D.STRING(64), allowNull: true },
      responsavel_estorno: { type: D.TEXT, allowNull: true },
      motivo_estorno: { type: D.TEXT, allowNull: true },
    },
    {
      tableName: "ft_beneficio_entregas",
      timestamps: false,
      paranoid: false,
      indexes: [
        {
          name: "idx_ft_beneficios_mes",
          fields: ["edital_id", "mes", "entregue_em"],
        },
        {
          name: "idx_ft_beneficios_participacao",
          fields: ["participacao_id", "entregue_em"],
        },
      ],
    },
  );
  return Object.assign(model, {
    associate(models: DbObject) {
      model.belongsTo(models.Edital, {
        foreignKey: "edital_id",
        as: "edital",
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
      });
      model.belongsTo(models.BolsistasEdital, {
        foreignKey: "participacao_id",
        as: "participacao",
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
      model.hasMany(models.FtBeneficioEntregaItem, {
        foreignKey: "entrega_id",
        as: "itens",
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
      });
    },
  });
};
