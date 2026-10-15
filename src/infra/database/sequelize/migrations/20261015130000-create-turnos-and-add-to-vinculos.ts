import { DataTypes, QueryInterface } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const tables = await queryInterface.showAllTables();
      if (!tables.includes("turnos")) {
        await queryInterface.createTable("turnos", {
          uuid: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
          nome: { type: DataTypes.STRING, allowNull: false, unique: true },
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
          type: DataTypes.UUID,
          allowNull: true,
          references: { model: "turnos", key: "uuid" },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
        }, { transaction });
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
        await queryInterface.removeColumn("bolsistas_edital", "turno_id", { transaction });
      }
      const tables = await queryInterface.showAllTables();
      if (tables.includes("turnos")) await queryInterface.dropTable("turnos", { transaction });
    });
  },
};
