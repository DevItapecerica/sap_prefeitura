import { DataTypes, QueryInterface, literal } from "sequelize";

/** @type {import("sequelize-cli").Migration} */
export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.createTable("bolsista_faltas", {
      id: {
        type: DataTypes.CHAR(36),
        defaultValue: literal("UUID()"),
        primaryKey: true,
        allowNull: false,
      },
      bolsista_id: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        references: {
          model: "bolsistas",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      edital_id: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        references: {
          model: "edital",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      data_falta: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      observacao: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: literal("CURRENT_TIMESTAMP"),
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex("bolsista_faltas", ["bolsista_id"], {
      name: "idx_bolsista_faltas_bolsista_id",
    });

    await queryInterface.addIndex("bolsista_faltas", ["edital_id"], {
      name: "idx_bolsista_faltas_edital_id",
    });

    await queryInterface.addIndex("bolsista_faltas", ["data_falta"], {
      name: "idx_bolsista_faltas_data_falta",
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable("bolsista_faltas");
  },
};
