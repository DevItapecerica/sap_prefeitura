import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Sequelize,
  DataTypes,
} from "sequelize";

// ─── Classe do modelo ────────────────────────────────────────────

interface EditalDB extends Model<
  InferAttributes<EditalDB>,
  InferCreationAttributes<EditalDB>
> {
  id: CreationOptional<string>;
  name: string;
  data_publicacao: Date;
  data_vencimento: Date;
  dia_pagamento: number;
  valor_bolsa: number;
  status: string;
}

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const Edital = sequelize.define<EditalDB>(
    "EditalModel",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      data_publicacao: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      data_vencimento: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      dia_pagamento: {
        type: DataTypes.INTEGER, // para armazenar apenas o dia do mês (1-31)
        allowNull: false,
        validate: {
          min: 1,
          max: 31,
        },
      },
      valor_bolsa: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("ativo", "inativo"),
        defaultValue: "ativo",
      },
    },
    {
      tableName: "edital", // Nome da tabela no banco (pode personalizar)
      timestamps: true, // Desativa createdAt/updatedAt se não forem usados
      paranoid: true,
    },
  );

  // (Edital as any).associate = (models: any) => {
  //   Edital.belongsToMany(models.Bolsistas, {
  //     through: models.BolsistasEdital,
  //     foreignKey: "edital_id",
  //     otherKey: "bolsista_id",
  //     as: "bolsistas",
  //   });
  // };

  return Edital;
};
