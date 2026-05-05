import { QueryInterface, DataTypes } from "sequelize";

/** @type {import("sequelize-cli").Migration} */
export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable("carterinhas", {
        uuid: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
        },
        emissao: {
          type: DataTypes.DATE,
          allowNull: false,
        },

        validade: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: null,
        },

        municipe_uuid: {
          type: DataTypes.UUID,
          allowNull: false,
        },

        setor_uuid: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        atividade_uuid: {
          type: DataTypes.STRING,
          allowNull: true,
        },

        author: {
          type: DataTypes.STRING,
          allowNull: false,
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
      });
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("carterinhas");
    });
  },
};
