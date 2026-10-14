import { DataTypes, Sequelize } from "sequelize";

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const BolsistasEdital = sequelize.define(
    "BolsistasEdital",
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
        onDelete: "CASCADE",
      },
      edital_id: {
        type: dataTypes.UUID,
        allowNull: false,
        references: {
          model: "edital",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      pagador_id: {
        type: dataTypes.UUID,
        allowNull: true,
        references: { model: "pagadores", key: "uuid" },
        onDelete: "RESTRICT",
      },
      data_vinculo: {
        type: dataTypes.DATE,
        allowNull: false,
        defaultValue: () => new Date(),
      },
      local: {
        type: dataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: dataTypes.ENUM(
          "ativo",
          "inativo",
          "concluido",
          "cancelado",
          "expirado",
        ),
        allowNull: false,
        defaultValue: "ativo",
      },
      expire_at: {
        type: dataTypes.DATE,
        allowNull: true,
      },
      canceled_at: {
        type: dataTypes.DATE,
        allowNull: true,
      },
      observacao: {
        type: dataTypes.TEXT,
        allowNull: true,
      },
      concluded_at: {
        type: dataTypes.DATE,
        allowNull: true,
      },
      expired_at: {
        type: dataTypes.DATE,
        allowNull: true,
      },
      prorrogated: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: "bolsistas_edital",
      timestamps: true,
      paranoid: true,
    },
  );

  (BolsistasEdital as any).associate = (models: any) => {
    BolsistasEdital.belongsTo(models.Bolsistas, {
      foreignKey: "bolsista_id",
      as: "bolsista",
      onDelete: "CASCADE",
    });

    BolsistasEdital.belongsTo(models.Edital, {
      foreignKey: "edital_id",
      as: "edital",
      onDelete: "CASCADE",
    });

    BolsistasEdital.belongsTo(models.Pagador, {
      foreignKey: "pagador_id",
      as: "pagador",
      onDelete: "RESTRICT",
    });
  };

  return BolsistasEdital;
};
