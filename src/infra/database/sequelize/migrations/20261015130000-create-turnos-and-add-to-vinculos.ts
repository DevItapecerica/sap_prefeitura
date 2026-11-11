import { DataTypes, QueryInterface } from "sequelize";

const UUID_BIN_TYPE = "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin";

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const tables = await queryInterface.showAllTables();
      if (!tables.includes("turnos")) {
        await queryInterface.createTable("turnos", {
          uuid: { type: UUID_BIN_TYPE, primaryKey: true, allowNull: false },
          nome: { type: DataTypes.STRING(120), allowNull: false, unique: true },
          hora_inicio: { type: DataTypes.TIME, allowNull: false },
          hora_fim: { type: DataTypes.TIME, allowNull: false },
          createdAt: { type: DataTypes.DATE, allowNull: false },
          updatedAt: { type: DataTypes.DATE, allowNull: false },
          deletedAt: { type: DataTypes.DATE, allowNull: true },
        }, { transaction });
      }

      const columns = await queryInterface.describeTable("bolsistas_edital");
      if (!columns.turno_id) {
        await queryInterface.addColumn("bolsistas_edital", "turno_id", {
          type: UUID_BIN_TYPE,
          allowNull: true,
        }, { transaction });
      }
      const constraints = await (queryInterface as any).showConstraint("bolsistas_edital") as any[];
      if (!constraints.some((constraint: any) => constraint.constraintName === "fk_bolsistas_edital_turno_id")) {
        await queryInterface.addConstraint("bolsistas_edital", {
          fields: ["turno_id"],
          type: "foreign key",
          name: "fk_bolsistas_edital_turno_id",
          references: { table: "turnos", field: "uuid" },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
          transaction,
        });
      }
      const indexes = await queryInterface.showIndex("bolsistas_edital") as any[];
      if (!indexes.some((index: any) => index.name === "idx_bolsistas_edital_turno")) {
        await queryInterface.addIndex("bolsistas_edital", ["turno_id"], {
          name: "idx_bolsistas_edital_turno",
          transaction,
        });
      }
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const columns = await queryInterface.describeTable("bolsistas_edital");
      if (columns.turno_id) {
        try {
          await queryInterface.removeIndex("bolsistas_edital", "idx_bolsistas_edital_turno", { transaction });
        } catch { /* index may not exist after a partial migration */ }
        try {
          await queryInterface.removeConstraint("bolsistas_edital", "fk_bolsistas_edital_turno_id", { transaction });
        } catch { /* constraint may not exist after a partial migration */ }
        await queryInterface.removeColumn("bolsistas_edital", "turno_id", { transaction });
      }
      const tables = await queryInterface.showAllTables();
      if (tables.includes("turnos")) await queryInterface.dropTable("turnos", { transaction });
    });
  },
};
