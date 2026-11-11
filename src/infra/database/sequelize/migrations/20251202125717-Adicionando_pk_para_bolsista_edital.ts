import { QueryInterface, literal } from "sequelize";

const UUID_BIN_TYPE = "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin";
const TABLE_NAME = "bolsistas_edital";

const hasColumn = async (
  queryInterface: QueryInterface,
  columnName: string,
): Promise<boolean> => {
  const table = await queryInterface.describeTable(TABLE_NAME);
  return Boolean(table[columnName]);
};

/** @type {import("sequelize-cli").Migration} */
export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await hasColumn(queryInterface, "id"))) {
      await queryInterface.addColumn(TABLE_NAME, "id", {
        type: UUID_BIN_TYPE,
        allowNull: false,
        defaultValue: literal("UUID()"),
      });
    }

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

    if (await hasColumn(queryInterface, "id")) {
      await queryInterface.removeColumn(TABLE_NAME, "id");
    }

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
