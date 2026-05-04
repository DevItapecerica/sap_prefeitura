import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Sequelize,
  DataTypes,
} from "sequelize";

// ─── Classe do modelo ────────────────────────────────────────────

interface MunicipeDB extends Model<
  InferAttributes<MunicipeDB>,
  InferCreationAttributes<MunicipeDB>
> {
  uuid: CreationOptional<string>;
  nome: string;
  cpf: string;
  nascimento: string;
  telefone: CreationOptional<string>;
  rua: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  numero: string;
  complemento: CreationOptional<string>;
  cpfHash: string;
  cepHash: string;

  author: string | number;

  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
  deletedAt?: CreationOptional<Date>;
}

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const Carterinhas = sequelize.define<MunicipeDB>(
    "MunicipeModel",
    {
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
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

      author: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      cpfHash: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      cepHash: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      createdAt: { type: dataTypes.DATE, allowNull: false },
      updatedAt: { type: dataTypes.DATE, allowNull: false },
      deletedAt: { type: dataTypes.DATE, allowNull: true },
    },
    {
      tableName: "municipes",
      timestamps: true, // Adiciona createdAt e updatedAt
      paranoid: true, // Habilita soft delete
    },
  );

  return Carterinhas;
};
