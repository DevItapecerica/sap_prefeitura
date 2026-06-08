import { DataTypes, Sequelize } from "sequelize";

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const Edital = sequelize.define(
    "Edital",
    {
      id: {
        type: dataTypes.UUID,
        defaultValue: dataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: dataTypes.STRING,
        allowNull: false,
      },
      data_publicacao: {
        type: dataTypes.DATE,
        allowNull: false,
      },
      data_vencimento: {
        type: dataTypes.DATE,
        allowNull: false,
      },
      dia_pagamento: {
        type: dataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 31,
        },
      },
      valor_bolsa: {
        type: dataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: dataTypes.ENUM("ativo", "inativo"),
        defaultValue: "ativo",
      },
    },
    {
      tableName: "edital",
      timestamps: true,
      paranoid: true,
    },
  );

  (Edital as any).associate = (models: any) => {
    Edital.belongsToMany(models.Bolsistas, {
      through: models.BolsistasEdital,
      foreignKey: "edital_id",
      otherKey: "bolsista_id",
      as: "bolsistas",
    });

    Edital.hasMany(models.BolsistaFalta, {
      foreignKey: "edital_id",
      as: "faltas",
      onDelete: "CASCADE",
    });
  };

  return Edital;
};
