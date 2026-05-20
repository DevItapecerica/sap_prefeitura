import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Sequelize,
  DataTypes,
} from "sequelize";

export interface ChamadoDBAttributes {
  id: string;
  patrimonio: string;
  status: string;
  tipo: string;
  dataEntrada: Date;
  setorId: number;
  solicitanteId: string;
  descricao: string;
  prioridade: string;
  responsavelId?: string | null;
  observacoes?: string | null;
  dataResolucao?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface ChamadoDB extends Model<
  InferAttributes<ChamadoDB>,
  InferCreationAttributes<ChamadoDB>
> {
  id: string;
  patrimonio: string;
  status: string;
  tipo: string;
  dataEntrada: Date;
  setorId: number;
  solicitanteId: string;
  descricao: string;
  prioridade: string;
  responsavelId?: string | null;
  observacoes?: string | null;
  dataResolucao?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const ChamadoModel = sequelize.define<ChamadoDB>(
    "ChamadoModel",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      patrimonio: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("aberto", "em_progresso", "resolvido", "fechado", "cancelado"),
        defaultValue: "aberto",
        allowNull: false,
      },
      tipo: {
        type: DataTypes.ENUM("manutencao", "reparo", "instalacao", "suporte", "outros"),
        allowNull: false,
      },
      dataEntrada: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      setorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      solicitanteId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      descricao: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      prioridade: {
        type: DataTypes.ENUM("baixa", "media", "alta", "critica"),
        defaultValue: "media",
        allowNull: false,
      },
      responsavelId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      observacoes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      dataResolucao: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "chamados",
      timestamps: true,
      paranoid: false,
    },
  );

  return ChamadoModel;
};
