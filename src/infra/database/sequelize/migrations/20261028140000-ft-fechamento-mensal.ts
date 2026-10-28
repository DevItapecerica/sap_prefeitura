import { QueryInterface, QueryTypes } from 'sequelize';
import { folhaColumns } from '../models/ft-folha-fechamento.schema.js';

export default {
  async up(q: QueryInterface) {
    // Match the existing UUID foreign key collation used by edital.
    await q.createTable('ft_folhas_fechadas', { ...folhaColumns,
      edital_id: { type: 'CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin', allowNull: false,
        references: { model: 'edital', key: 'id' }, onDelete: 'RESTRICT', onUpdate: 'RESTRICT' },
    });
    await q.addIndex('ft_folhas_fechadas', ['edital_id', 'mes'], { name: 'uq_ft_folha_edital_mes', unique: true });
  },
  async down(q: QueryInterface) {
    const [row] = await q.sequelize.query<{ total: number }>('SELECT COUNT(*) total FROM ft_folhas_fechadas', { type: QueryTypes.SELECT });
    if (Number(row.total)) throw new Error('Rollback refused: preserve closed payrolls; use a forward fix.');
    await q.dropTable('ft_folhas_fechadas');
  },
};
