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
      data_vinculo: {
        type: dataTypes.DATE,
        allowNull: false,
        defaultValue: () => new Date(),
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
      hooks: {
        beforeCreate: (bolsistaEdital: any) => {
          if (!bolsistaEdital.expire_at) {
            const vencimento = new Date(bolsistaEdital.data_vinculo);
            vencimento.setFullYear(vencimento.getFullYear() + 1);
            bolsistaEdital.expire_at = vencimento;
          }
        },
      },
    },
  );

  BolsistasEdital.beforeBulkCreate((records: any[]) => {
    records.forEach((record) => {
      if (!record.expire_at) {
        const dataVinculo = record.data_vinculo || new Date();
        const dataVencimento = new Date(dataVinculo);
        dataVencimento.setFullYear(dataVinculo.getFullYear() + 1);
        record.data_vinculo = dataVinculo;
        record.expire_at = dataVencimento;
      }
    });
  });

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
  };

  return BolsistasEdital;
};
