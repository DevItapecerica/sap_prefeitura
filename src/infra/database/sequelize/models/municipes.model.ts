import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ModelStatic,
  Sequelize,
  DataTypes,
} from "sequelize";

// ─── Classe do modelo ────────────────────────────────────────────

export interface MunicipeDB extends Model<
  InferAttributes<MunicipeDB>,
  InferCreationAttributes<MunicipeDB>
> {
  uuid: CreationOptional<string>;
  nome: string;
  cpf: string;
  nascimento: string;
  telefone: CreationOptional<string | null>;
  rua: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  numero: string;
  complemento: CreationOptional<string | null>;
  cpfHash: string;
  cepHash: string;

  author: string | number;

  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
  deletedAt?: CreationOptional<Date | null>;
}

type MunicipeAssociationModels = {
  AtletaModel: ModelStatic<Model>;
  CarteirinhaModel: ModelStatic<Model>;
  CarteirinhaEsporteModel: ModelStatic<Model>;
};

type AssociableMunicipeModel = ModelStatic<MunicipeDB> & {
  associate?: (models: MunicipeAssociationModels) => void;
};

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const MunicipeModel = sequelize.define<MunicipeDB>(
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
        unique: "uq_municipes_cpf_hash",
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

  const associableModel = MunicipeModel as AssociableMunicipeModel;
  associableModel.associate = (models) => {
    MunicipeModel.hasOne(models.AtletaModel, {
      foreignKey: "municipe_uuid",
      as: "atleta",
    });
    MunicipeModel.hasMany(models.CarteirinhaModel, {
      foreignKey: "municipe_uuid",
      as: "carterinhas",
    });
    MunicipeModel.hasMany(models.CarteirinhaEsporteModel, {
      foreignKey: "municipe_uuid",
      as: "carterinhasEsporte",
    });
  };

  return associableModel;
};
