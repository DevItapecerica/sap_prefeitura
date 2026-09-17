import { DataTypes, QueryInterface } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable("ft_relatorio_arquivos", {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      nome_arquivo: { type: DataTypes.STRING(255), allowNull: false },
      status: { type: DataTypes.ENUM("aguardando", "processando", "concluido", "erro", "excluido"), allowNull: false, defaultValue: "aguardando" },
      edital_id: { type: DataTypes.UUID, allowNull: false, references: { model: "edital", key: "id" }, onUpdate: "CASCADE", onDelete: "RESTRICT" },
      mes: { type: DataTypes.STRING(7), allowNull: false },
      solicitado_por: { type: DataTypes.INTEGER, allowNull: false, references: { model: "users", key: "id" }, onUpdate: "CASCADE", onDelete: "RESTRICT" },
      caminho_arquivo: { type: DataTypes.STRING(1024), allowNull: true },
      tamanho_bytes: { type: DataTypes.BIGINT, allowNull: true },
      total_bolsistas: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      total_gerados: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      total_falhas: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      tentativas: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      mensagem_erro: { type: DataTypes.TEXT, allowNull: true },
      iniciado_em: { type: DataTypes.DATE, allowNull: true },
      concluido_em: { type: DataTypes.DATE, allowNull: true },
      download_iniciado_em: { type: DataTypes.DATE, allowNull: true },
      baixado_em: { type: DataTypes.DATE, allowNull: true },
      excluido_em: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex("ft_relatorio_arquivos", ["status"]);
    await queryInterface.addIndex("ft_relatorio_arquivos", ["solicitado_por"]);
    await queryInterface.addIndex("ft_relatorio_arquivos", ["created_at"]);
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable("ft_relatorio_arquivos");
  },
};
