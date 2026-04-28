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
  numero_carterinha: string;
  nome: string;
  cpf: string;
  nascimento: string;
  telefone: CreationOptional<string>;
  emissao: string;
  validade: CreationOptional<string>;
  rua: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  numero: string;
  complemento: CreationOptional<string>;
  setor: string;
  servico: string;

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

      numero_carterinha: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      nome: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      cpf: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      nascimento: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      telefone: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
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

      rua: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      bairro: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      cidade: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      uf: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      cep: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      numero: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      complemento: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },

      setor: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      servico: {
        type: DataTypes.STRING,
        allowNull: false,
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
