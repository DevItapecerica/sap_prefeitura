import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Sequelize,
  DataTypes,
} from "sequelize";

interface CarterinhaEsporteDB
  extends Model<
    InferAttributes<CarterinhaEsporteDB>,
    InferCreationAttributes<CarterinhaEsporteDB>
  > {
  uuid: CreationOptional<string>;
  emissao: Date;
  validade: CreationOptional<Date | null>;
  municipe_uuid: string;
  modalidade: string;
  author: string | number;
  observacao: CreationOptional<string | null>;
  validade_exame: CreationOptional<Date | null>;
  foto: CreationOptional<string | null>;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
  deletedAt?: CreationOptional<Date | null>;
}

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const CarterinhaEsporte = sequelize.define<CarterinhaEsporteDB>(
    "CarteirinhaEsporteModel",
    {
      uuid: {
        type: dataTypes.UUID,
        defaultValue: dataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      emissao: {
        type: dataTypes.DATE,
        allowNull: false,
      },
      validade: {
        type: dataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      municipe_uuid: {
        type: dataTypes.UUID,
        allowNull: false,
        references: {
          model: "municipes",
          key: "uuid",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      modalidade: {
        type: dataTypes.STRING,
        allowNull: false,
      },
      author: {
        type: dataTypes.STRING,
        allowNull: false,
      },
      observacao: {
        type: dataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      validade_exame: {
        type: dataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      foto: {
        type: dataTypes.TEXT("long"),
        allowNull: true,
        defaultValue: null,
      },
      createdAt: { type: dataTypes.DATE, allowNull: false },
      updatedAt: { type: dataTypes.DATE, allowNull: false },
      deletedAt: { type: dataTypes.DATE, allowNull: true },
    },
    {
      tableName: "carterinhas_esporte",
      timestamps: true,
      paranoid: true,
    },
  );

  (CarterinhaEsporte as any).associate = (models: any) => {
    CarterinhaEsporte.belongsTo(models.MunicipeModel, {
      foreignKey: "municipe_uuid",
      as: "municipe",
    });
  };

  return CarterinhaEsporte;
};
