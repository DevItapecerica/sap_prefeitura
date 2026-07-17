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
  emissao: Date;
  validade: CreationOptional<Date | null>;
  municipe_uuid: string;
  origem: string;
  atividade: string | null;

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
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      emissao: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      validade: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },

      municipe_uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "municipes",
          key: "uuid",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      origem: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      atividade: {
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

  (Carterinhas as any).associate = (models: any) => {
    Carterinhas.belongsTo(models.MunicipeModel, {
      foreignKey: "municipe_uuid",
      as: "municipe",
    });
  };

  return Carterinhas;
};
