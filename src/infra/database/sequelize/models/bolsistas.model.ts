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
      municipe_uuid: {
        type: dataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: "municipes",
          key: "uuid",
        },
      },
    },
    {
      tableName: "bolsistas",
      timestamps: true,
      paranoid: true,
    },
  );

  (Bolsistas as any).associate = (models: any) => {
    Bolsistas.belongsTo(models.MunicipeModel, {
      foreignKey: "municipe_uuid",
      as: "municipe",
      onDelete: "RESTRICT",
    });
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
