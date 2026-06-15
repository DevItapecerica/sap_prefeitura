import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Sequelize,
  DataTypes,
} from "sequelize";

interface ModalidadeDB extends Model<
  InferAttributes<ModalidadeDB>,
  InferCreationAttributes<ModalidadeDB>
> {
  uuid: CreationOptional<string>;
  nome: string;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
  deletedAt?: CreationOptional<Date>;
}

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const ModalidadeModel = sequelize.define<ModalidadeDB>(
    "ModalidadeModel",
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
        unique: true,
      },
      createdAt: { type: dataTypes.DATE, allowNull: false },
      updatedAt: { type: dataTypes.DATE, allowNull: false },
      deletedAt: { type: dataTypes.DATE, allowNull: true },
    },
    {
      tableName: "esporte_modalidades",
      timestamps: true,
      paranoid: true,
    },
  );

  return ModalidadeModel;
};
