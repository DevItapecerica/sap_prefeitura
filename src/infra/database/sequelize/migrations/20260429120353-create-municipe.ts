import { QueryInterface, DataTypes } from "sequelize";

/** @type {import("sequelize-cli").Migration} */
export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable("municipes", {
        uuid: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
        },
        nome: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        cpf: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        nascimento: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        telefone: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        rua: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        bairro: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        cidade: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        uf: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        cep: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        numero: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        complemento: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        author: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        cpfHash: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        nomeHash: {
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
      await queryInterface.dropTable("municipes");
    });
  },
};
