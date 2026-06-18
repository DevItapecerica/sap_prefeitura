import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Sequelize,
  DataTypes,
} from "sequelize";

interface AtletaModalidadeDB extends Model<
  InferAttributes<AtletaModalidadeDB>,
  InferCreationAttributes<AtletaModalidadeDB>
> {
  uuid: CreationOptional<string>;
  atleta_uuid: string;
  modalidade_uuid: string;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
  deletedAt?: CreationOptional<Date>;
}

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const AtletaModalidadeModel = sequelize.define<AtletaModalidadeDB>(
    "AtletaModalidadeModel",
    {
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      atleta_uuid: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      modalidade_uuid: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      createdAt: { type: dataTypes.DATE, allowNull: false },
      updatedAt: { type: dataTypes.DATE, allowNull: false },
      deletedAt: { type: dataTypes.DATE, allowNull: true },
    },
    {
      tableName: "esporte_atleta_modalidades",
      timestamps: true,
      paranoid: true,
    },
  );

  return AtletaModalidadeModel;
};
