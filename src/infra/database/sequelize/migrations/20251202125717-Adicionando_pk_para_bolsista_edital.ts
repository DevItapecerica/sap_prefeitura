import { DataTypes, QueryInterface, literal } from "sequelize";

/** @type {import("sequelize-cli").Migration} */
export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn("bolsistas_edital", "id", {
      type: DataTypes.CHAR(36),
      allowNull: false,
      defaultValue: literal("UUID()"),
    });

    await queryInterface.removeConstraint(
      "bolsistas_edital",
      "bolsistas_edital_ibfk_1",
    );
    await queryInterface.removeConstraint(
      "bolsistas_edital",
      "bolsistas_edital_ibfk_2",
    );
    await queryInterface.removeConstraint("bolsistas_edital", "PRIMARY");

    await queryInterface.addConstraint("bolsistas_edital", {
      fields: ["id"],
      type: "primary key",
      name: "PK_bolsistas_edital_id",
    });

    await queryInterface.addConstraint("bolsistas_edital", {
      fields: ["bolsista_id"],
      type: "foreign key",
      name: "bolsistas_edital_ibfk_1",
      references: {
        table: "bolsistas",
        field: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    await queryInterface.addConstraint("bolsistas_edital", {
      fields: ["edital_id"],
      type: "foreign key",
      name: "bolsistas_edital_ibfk_2",
      references: {
        table: "edital",
        field: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeConstraint(
      "bolsistas_edital",
      "bolsistas_edital_ibfk_1",
    );
    await queryInterface.removeConstraint(
      "bolsistas_edital",
      "bolsistas_edital_ibfk_2",
    );
    await queryInterface.removeConstraint(
      "bolsistas_edital",
      "PK_bolsistas_edital_id",
    );

    await queryInterface.removeColumn("bolsistas_edital", "id");

    await queryInterface.addConstraint("bolsistas_edital", {
      fields: ["bolsista_id", "edital_id"],
      type: "primary key",
      name: "PRIMARY",
    });

    await queryInterface.addConstraint("bolsistas_edital", {
      fields: ["bolsista_id"],
      type: "foreign key",
      name: "bolsistas_edital_ibfk_1",
      references: {
        table: "bolsistas",
        field: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    await queryInterface.addConstraint("bolsistas_edital", {
      fields: ["edital_id"],
      type: "foreign key",
      name: "bolsistas_edital_ibfk_2",
      references: {
        table: "edital",
        field: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  },
};
