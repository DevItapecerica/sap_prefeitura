import { DataTypes, Sequelize } from "sequelize";

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const PaymentInfo = sequelize.define(
    "PaymentInfo",
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
      bco: {
        type: dataTypes.STRING(3),
        allowNull: false,
      },
      pagador_id: {
        type: dataTypes.STRING(50),
        allowNull: false,
        defaultValue: "pendente",
      },
      ag: {
        type: dataTypes.STRING(4),
        allowNull: false,
      },
      dig_ag: {
        type: dataTypes.STRING(1),
        allowNull: false,
      },
      conta: {
        type: dataTypes.STRING(11),
        allowNull: false,
      },
      dig_conta: {
        type: dataTypes.STRING(1),
        allowNull: false,
      },
    },
    {
      tableName: "payment_info",
      timestamps: true,
      paranoid: true,
    },
  );

  (PaymentInfo as any).associate = (models: any) => {
    PaymentInfo.belongsTo(models.Bolsistas, {
      foreignKey: "bolsista_id",
      as: "bolsista",
      onDelete: "CASCADE",
    });
  };

  return PaymentInfo;
};
