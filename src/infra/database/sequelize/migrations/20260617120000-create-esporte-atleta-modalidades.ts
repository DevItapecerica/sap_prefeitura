import { QueryInterface, DataTypes } from "sequelize";

/** @type {import("sequelize-cli").Migration} */
export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "esporte_atleta_modalidades",
        {
          uuid: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
          },
          atleta_uuid: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: "esporte_atletas",
              key: "uuid",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          modalidade_uuid: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: "esporte_modalidades",
              key: "uuid",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
          },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        "esporte_atleta_modalidades",
        ["atleta_uuid", "modalidade_uuid"],
        {
          unique: true,
          name: "esporte_atleta_modalidades_unique",
          transaction,
        },
      );
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("esporte_atleta_modalidades", {
        transaction,
      });
    });
  },
};
