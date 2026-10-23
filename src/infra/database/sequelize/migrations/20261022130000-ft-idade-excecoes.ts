import { DataTypes as D, QueryInterface, QueryTypes } from 'sequelize';
import { exceptionColumns } from '../models/ft-excecao.schema.js';

export default {
  async up(q: QueryInterface) {
    // Nullable for existing editais only. All new writes require an explicit limit.
    await q.addColumn('edital', 'idade_maxima', { type: D.INTEGER.UNSIGNED, allowNull: true });
    for (const table of ['ft_inscricoes', 'bolsistas_edital'])
      for (const [name, definition] of Object.entries(exceptionColumns)) await q.addColumn(table, name, definition);
  },
  async down(q: QueryInterface) {
    const [row] = await q.sequelize.query<{ total: number }>(
      'SELECT (SELECT COUNT(*) FROM edital WHERE idade_maxima IS NOT NULL) + (SELECT COUNT(*) FROM ft_inscricoes WHERE excecao_em IS NOT NULL) + (SELECT COUNT(*) FROM bolsistas_edital WHERE excecao_em IS NOT NULL) AS total',
      { type: QueryTypes.SELECT });
    if (Number(row.total)) throw new Error('Rollback refused: preserve age limits and exception authorizations; use a forward fix.');
    for (const table of ['bolsistas_edital', 'ft_inscricoes'])
      for (const name of Object.keys(exceptionColumns).reverse()) await q.removeColumn(table, name);
    await q.removeColumn('edital', 'idade_maxima');
  },
};
