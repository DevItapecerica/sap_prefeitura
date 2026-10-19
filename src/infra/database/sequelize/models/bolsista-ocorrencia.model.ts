import { DataTypes, Sequelize } from "sequelize";

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const BolsistaOcorrencia = sequelize.define(
    "BolsistaOcorrencia",
    {
      id: {
        type: dataTypes.UUID,
        defaultValue: dataTypes.UUIDV4,
        primaryKey: true,
      },
      bolsista_edital_id: {
        type: dataTypes.UUID,
        allowNull: false,
        references: { model: "bolsistas_edital", key: "id" },
      },
      data_ocorrencia: { type: dataTypes.DATEONLY, allowNull: false },
      descricao: { type: dataTypes.TEXT, allowNull: false },
      author_id: {
        type: dataTypes.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
    },
    { tableName: "bolsista_ocorrencias", timestamps: true, paranoid: true },
  );

  (BolsistaOcorrencia as any).associate = (models: any) => {
    BolsistaOcorrencia.belongsTo(models.BolsistasEdital, {
      foreignKey: "bolsista_edital_id",
      as: "vinculo",
      onDelete: "RESTRICT",
    });
    BolsistaOcorrencia.belongsTo(models.UserModel, {
      foreignKey: "author_id",
      as: "author",
      onDelete: "RESTRICT",
    });
  };
  return BolsistaOcorrencia;
};
