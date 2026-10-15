import { DataTypes, QueryInterface, QueryTypes } from "sequelize";

const TABLE = "bolsistas_edital";
const COLUMNS = {
  turno_nome_snapshot: { type: DataTypes.STRING(120), allowNull: true },
  turno_hora_inicio_snapshot: { type: DataTypes.TIME, allowNull: true },
  turno_hora_fim_snapshot: { type: DataTypes.TIME, allowNull: true },
};

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const existing = await queryInterface.describeTable(TABLE);
      for (const [name, definition] of Object.entries(COLUMNS)) {
        if (!existing[name]) await queryInterface.addColumn(TABLE, name, definition, { transaction });
      }
      await queryInterface.sequelize.query(
        `UPDATE ${TABLE} be JOIN turnos t ON t.uuid = be.turno_id
         SET be.turno_nome_snapshot = COALESCE(be.turno_nome_snapshot, t.nome),
             be.turno_hora_inicio_snapshot = COALESCE(be.turno_hora_inicio_snapshot, t.hora_inicio),
             be.turno_hora_fim_snapshot = COALESCE(be.turno_hora_fim_snapshot, t.hora_fim)
         WHERE be.turno_id IS NOT NULL`,
        { type: QueryTypes.UPDATE, transaction },
      );
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const existing = await queryInterface.describeTable(TABLE);
      for (const name of Object.keys(COLUMNS).reverse()) {
        if (existing[name]) await queryInterface.removeColumn(TABLE, name, { transaction });
      }
    });
  },
};
