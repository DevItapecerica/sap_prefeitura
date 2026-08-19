import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Sequelize,
  DataTypes,
} from "sequelize";

interface AtletaDB extends Model<
  InferAttributes<AtletaDB>,
  InferCreationAttributes<AtletaDB>
> {
  uuid: CreationOptional<string>;
  municipe_uuid: string;
  ativo: boolean;
  author: string | number;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
  deletedAt?: CreationOptional<Date>;
}

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const AtletaModel = sequelize.define<AtletaDB>(
    "AtletaModel",
    {
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
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
      ativo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
      tableName: "esporte_atletas",
      timestamps: true,
      paranoid: true,
    },
  );

  (AtletaModel as any).associate = (models: any) => {
    AtletaModel.belongsTo(models.MunicipeModel, {
      foreignKey: "municipe_uuid",
      as: "municipe",
    });
    AtletaModel.belongsToMany(models.ModalidadeModel, {
      through: models.AtletaModalidadeModel,
      foreignKey: "atleta_uuid",
      otherKey: "modalidade_uuid",
      as: "modalidades",
    });
  };

  return AtletaModel;
};
