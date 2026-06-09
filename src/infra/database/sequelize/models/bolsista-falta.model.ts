import { DataTypes, Sequelize } from "sequelize";

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const BolsistaFalta = sequelize.define(
    "BolsistaFalta",
    {
      id: {
        type: dataTypes.UUID,
        defaultValue: dataTypes.UUIDV4,
        primaryKey: true,
      },
      bolsista_id: {
        type: dataTypes.UUID,
        allowNull: false,
        references: {
          model: "bolsistas",
          key: "id",
        },
      },
      edital_id: {
        type: dataTypes.UUID,
        allowNull: false,
        references: {
          model: "edital",
          key: "id",
        },
      },
      data_falta: {
        type: dataTypes.DATEONLY,
        allowNull: false,
      },
      observacao: {
        type: dataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "bolsista_faltas",
      timestamps: true,
      paranoid: true,
    },
  );

  (BolsistaFalta as any).associate = (models: any) => {
    BolsistaFalta.belongsTo(models.Bolsistas, {
      foreignKey: "bolsista_id",
      as: "bolsista",
      onDelete: "CASCADE",
    });

    BolsistaFalta.belongsTo(models.Edital, {
      foreignKey: "edital_id",
      as: "edital",
      onDelete: "CASCADE",
    });
  };

  return BolsistaFalta;
};
