import { DataTypes, Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const model = sequelize.define<Model>("FtRelatorioArquivo", {
    id: { type: dataTypes.UUID, primaryKey: true, allowNull: false },
    nome_arquivo: { type: dataTypes.STRING(255), allowNull: false },
    status: { type: dataTypes.ENUM("aguardando", "processando", "concluido", "erro", "excluido"), allowNull: false, defaultValue: "aguardando" },
    edital_id: { type: dataTypes.UUID, allowNull: false },
    mes: { type: dataTypes.STRING(7), allowNull: false },
    solicitado_por: { type: dataTypes.INTEGER, allowNull: false },
    caminho_arquivo: { type: dataTypes.STRING(1024), allowNull: true },
    tamanho_bytes: { type: dataTypes.BIGINT, allowNull: true },
    total_bolsistas: { type: dataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    total_gerados: { type: dataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    total_falhas: { type: dataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    tentativas: { type: dataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    mensagem_erro: { type: dataTypes.TEXT, allowNull: true },
    iniciado_em: { type: dataTypes.DATE, allowNull: true },
    concluido_em: { type: dataTypes.DATE, allowNull: true },
    download_iniciado_em: { type: dataTypes.DATE, allowNull: true },
    baixado_em: { type: dataTypes.DATE, allowNull: true },
    excluido_em: { type: dataTypes.DATE, allowNull: true },
    createdAt: { type: dataTypes.DATE, allowNull: false, field: "created_at" },
    updatedAt: { type: dataTypes.DATE, allowNull: false, field: "updated_at" },
  }, { tableName: "ft_relatorio_arquivos", timestamps: true });

  (model as any).associate = (models: any) => {
    model.belongsTo(models.Edital, { foreignKey: "edital_id", as: "edital" });
    model.belongsTo(models.UserModel, { foreignKey: "solicitado_por", as: "solicitante" });
  };
  return model;
};
