import { QueryInterface, DataTypes } from "sequelize";

/** @type {import("sequelize-cli").Migration} */
export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable("bolsistas_ft", {
        uuid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        municipe_uuid: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "municipes", // nome da tabela no banco
            key: "uuid",
          },
        },
        local: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM("ativo", "inativo", "pendente"),
          allowNull: false,
          defaultValue: "inativo",
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.DATE,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.DATE,
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
      //your code here
    });
  },
};
