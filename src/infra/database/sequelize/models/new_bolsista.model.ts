import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Sequelize,
  DataTypes,
} from "sequelize";

// ─── Classe do modelo ────────────────────────────────────────────

interface BolsistaDB extends Model<
  InferAttributes<BolsistaDB>,
  InferCreationAttributes<BolsistaDB>
> {
  uuid: CreationOptional<string>;
  municipe_uuid: string;
  local: string;
  status: string;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
  // deletedAt?: CreationOptional<Date>;
}

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const NewBolsistas = sequelize.define<BolsistaDB>(
    "BolsistaModel",
    {
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      municipe_uuid: {
        type: DataTypes.UUID, // VARCHAR (sem limite explícito, padrão do Sequelize)
        allowNull: false,
        references: {
          model: "municipes", // Nome da tabela referenciada
          key: "uuid", // Chave primária da tabela referenciada
        },
      },
      local: {
        type: DataTypes.STRING, // VARCHAR
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("ativo", "inativo", "pendente"), // valores possíveis
        allowNull: false,
        defaultValue: "inativo", // valor padrão
        // defaultValue: "pendente", // valor padrão
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      // deletedAt: {
      //   type: DataTypes.DATE,
      //   allowNull: true
      // }
    },
    {
      tableName: "bolsistas_ft", // Nome da tabela no banco
      timestamps: true,
    },
  );

  (NewBolsistas as any).associate = function (models: any) {
    NewBolsistas.belongsTo(models.MunicipeModel, {
      foreignKey: "municipe_uuid",
      as: "municipe",
    });
  };

  // (Bolsistas as any).associate = function (models: any) {
  //   Bolsistas.belongsToMany(models.Edital, {
  //     through: models.BolsistasEdital,
  //     foreignKey: "bolsista_id",
  //     otherKey: "edital_id",
  //     as: "edital",
  //   });

  //   Bolsistas.hasMany(models.BolsistasEdital, {
  //     foreignKey: "bolsista_id",
  //     as: "bolsistas_edital",
  //     onDelete: "CASCADE",
  //   });

  //   Bolsistas.hasMany(models.Image, {
  //     foreignKey: "bolsista_id",
  //     as: "images",
  //     onDelete: "CASCADE",
  //   });

  //   Bolsistas.hasOne(models.PaymentInfo, {
  //     foreignKey: "bolsista_id",
  //     as: "payment_info",
  //     onDelete: "CASCADE",
  //   });
  // };

  return NewBolsistas;
};
