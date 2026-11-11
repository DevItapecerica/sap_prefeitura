import type { QueryInterface } from 'sequelize';
const name = 'idx_ft_eventos_timeline';
export default {
  async up(q: QueryInterface) { const indexes = await q.showIndex('ft_workflow_eventos') as Array<{ name: string }>; if (!indexes.some(index => index.name === name)) await q.addIndex('ft_workflow_eventos', ['edital_id', 'recurso_id', 'createdAt', 'id'], { name }); },
  async down(q: QueryInterface) { const indexes = await q.showIndex('ft_workflow_eventos') as Array<{ name: string }>; if (indexes.some(index => index.name === name)) await q.removeIndex('ft_workflow_eventos', name); },
};
