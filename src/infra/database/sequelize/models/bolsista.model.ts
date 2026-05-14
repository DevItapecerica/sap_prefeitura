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
  id: CreationOptional<string>;
  nome: string;
  cpf: string;
  local: string;
  status: string;
  cep: string;
  numero: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  telefone: string;
  email: string;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
  // deletedAt?: CreationOptional<Date>;
}


export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const Bolsistas = sequelize.define<BolsistaDB>(
    "BolsistaModel",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      nome: {
        type: DataTypes.STRING, // VARCHAR (sem limite explícito, padrão do Sequelize)
        allowNull: false,
      },
      cpf: {
        type: DataTypes.STRING(11), // até 11 caracteres
        allowNull: false,
        unique: true,
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
      cep: {
        type: DataTypes.STRING(8), // até 8 caracteres
        allowNull: false,
        defaultValue: "NA",
      },
      numero: {
        type: DataTypes.STRING, // VARCHAR
        allowNull: false,
        defaultValue: "NA",
      },
      logradouro: {
        type: DataTypes.STRING, // VARCHAR
        allowNull: false,
        defaultValue: "NA",
      },
      bairro: {
        type: DataTypes.STRING, // VARCHAR
        allowNull: false,
        defaultValue: "NA",
      },
      cidade: {
        type: DataTypes.STRING, // VARCHAR
        allowNull: false,
        defaultValue: "NA",
      },
      uf: {
        type: DataTypes.STRING(2), // até 2 caracteres
        allowNull: false,
        defaultValue: "NA",
      },
      telefone: {
        type: DataTypes.STRING(11), // até 11 caracteres
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING, // VARCHAR
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      // deletedAt: {
      //   type: DataTypes.DATE,
      //   allowNull: true
      // }
    },
    {
      tableName: "bolsistas", // Nome da tabela no banco
      timestamps: true,
    }
  );

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

  return Bolsistas;
};
