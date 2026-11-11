import { DataTypes, QueryInterface } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    const columns = await queryInterface.describeTable("ft_relatorio_arquivos");
    if (!columns.tipo) {
      await queryInterface.addColumn("ft_relatorio_arquivos", "tipo", {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: "espelhos_ponto",
      });
    }
  },

  async down(queryInterface: QueryInterface) {
    const columns = await queryInterface.describeTable("ft_relatorio_arquivos");
    if (columns.tipo) {
      await queryInterface.removeColumn("ft_relatorio_arquivos", "tipo");
    }
  },
};
