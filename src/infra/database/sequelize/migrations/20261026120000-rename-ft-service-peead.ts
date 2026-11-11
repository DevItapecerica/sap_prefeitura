import { QueryInterface } from 'sequelize';

// Freeze the names here so later branding changes do not alter this migration.
const name = 'PEEAD - PROGRAMA EMERGENCIAL E ASSISTENCIAL DE AUXÍLIO DESEMPREGO';
const previousName = 'Frente de Trabalho';

export default {
  async up(q: QueryInterface): Promise<void> {
    await q.sequelize.transaction(async transaction => {
      await q.bulkUpdate('services', { name }, { module_key: 'ft' }, { transaction });
    });
  },
  async down(q: QueryInterface): Promise<void> {
    await q.sequelize.transaction(async transaction => {
      await q.bulkUpdate('services', { name: previousName }, { module_key: 'ft', name }, { transaction });
    });
  },
};
