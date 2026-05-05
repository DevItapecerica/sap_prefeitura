import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Sequelize,
  DataTypes,
} from "sequelize";

// ─── Classe do modelo ────────────────────────────────────────────

interface CarterinhaDB extends Model<
  InferAttributes<CarterinhaDB>,
  InferCreationAttributes<CarterinhaDB>
> {
  uuid: CreationOptional<string>;
  emissao: string;
  validade: CreationOptional<string>;
  municipe_uuid: string;
  setor: string;
  atividade_uuid: string;

  author: string | number;

  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
  deletedAt?: CreationOptional<Date>;
}

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const Carterinhas = sequelize.define<CarterinhaDB>(
    "CarteirinhaModel",
    {
      uuid: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },

      emissao: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      validade: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },

      municipe_uuid: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      setor: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      atividade_uuid: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      author: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      createdAt: { type: dataTypes.DATE, allowNull: false },
      updatedAt: { type: dataTypes.DATE, allowNull: false },
      deletedAt: { type: dataTypes.DATE, allowNull: true },
    },
    {
      tableName: "carterinhas",
      timestamps: true, // Adiciona createdAt e updatedAt
      paranoid: true, // Habilita soft delete
    },
  );

  return Carterinhas;
};
