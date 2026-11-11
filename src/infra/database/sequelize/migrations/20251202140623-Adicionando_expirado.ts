import { DataTypes, QueryInterface } from "sequelize";

/** @type {import("sequelize-cli").Migration} */
export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.changeColumn("bolsistas_edital", "status", {
      type: DataTypes.ENUM(
        "ativo",
        "inativo",
        "concluido",
        "cancelado",
        "expirado",
      ),
      allowNull: false,
      defaultValue: "ativo",
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.changeColumn("bolsistas_edital", "status", {
      type: DataTypes.ENUM("ativo", "inativo", "concluido", "cancelado"),
      allowNull: false,
      defaultValue: "ativo",
    });
  },
};
