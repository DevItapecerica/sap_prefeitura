import { DataTypes, Sequelize } from "sequelize";

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const Bolsistas = sequelize.define(
    "Bolsistas",
    {
      id: {
        type: dataTypes.UUID,
        defaultValue: dataTypes.UUIDV4,
        primaryKey: true,
      },
      nome: {
        type: dataTypes.STRING,
        allowNull: false,
      },
      cpf: {
        type: dataTypes.STRING(11),
        allowNull: false,
        unique: true,
      },
      local: {
        type: dataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: dataTypes.ENUM("ativo", "inativo", "pendente"),
        allowNull: false,
        defaultValue: "inativo",
      },
      cep: {
        type: dataTypes.STRING(8),
        allowNull: false,
        defaultValue: "NA",
      },
      numero: {
        type: dataTypes.STRING,
        allowNull: false,
        defaultValue: "NA",
      },
      logradouro: {
        type: dataTypes.STRING,
        allowNull: false,
        defaultValue: "NA",
      },
      bairro: {
        type: dataTypes.STRING,
        allowNull: false,
        defaultValue: "NA",
      },
      cidade: {
        type: dataTypes.STRING,
        allowNull: false,
        defaultValue: "NA",
      },
      uf: {
        type: dataTypes.STRING(2),
        allowNull: false,
        defaultValue: "NA",
      },
      telefone: {
        type: dataTypes.STRING(11),
        allowNull: true,
      },
    },
    {
      tableName: "bolsistas",
      timestamps: true,
      paranoid: true,
    },
  );

  (Bolsistas as any).associate = (models: any) => {
    Bolsistas.belongsToMany(models.Edital, {
      through: models.BolsistasEdital,
      foreignKey: "bolsista_id",
      otherKey: "edital_id",
      as: "edital",
    });

    Bolsistas.hasMany(models.BolsistasEdital, {
      foreignKey: "bolsista_id",
      as: "bolsistas_edital",
      onDelete: "CASCADE",
    });

    Bolsistas.hasMany(models.Image, {
      foreignKey: "bolsista_id",
      as: "images",
      onDelete: "CASCADE",
    });

    Bolsistas.hasOne(models.PaymentInfo, {
      foreignKey: "bolsista_id",
      as: "payment_info",
      onDelete: "CASCADE",
    });

    Bolsistas.hasMany(models.BolsistaFalta, {
      foreignKey: "bolsista_id",
      as: "faltas",
      onDelete: "CASCADE",
    });
  };

  return Bolsistas;
};
