"use strict";

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("roles", {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
    });

    await queryInterface.createTable("permissions", {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      role_id: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "roles",
          key: "id",
        },
      },

      service_id: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
      },

      read: {
        type: Sequelize.DataTypes.BOOLEAN,
        defaultValue: true,
      },

      write: {
        type: Sequelize.DataTypes.BOOLEAN,
        defaultValue: false,
      },

      edit: {
        type: Sequelize.DataTypes.BOOLEAN,
        defaultValue: false,
      },

      del: {
        type: Sequelize.DataTypes.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.createTable("service_visibilities", {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      setor_id: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
      },
      service_id: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
      },
      visibility: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("roles");
    await queryInterface.dropTable("permissions");
    await queryInterface.dropTable("service_visibilities");
  },
};