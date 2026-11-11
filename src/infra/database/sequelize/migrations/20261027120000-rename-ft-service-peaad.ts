import { QueryInterface } from 'sequelize';

const name = 'PEAAD - PROGRAMA EMERGENCIAL E ASSISTENCIAL DE AUXÍLIO DESEMPREGO';
const previousName = 'PEEAD - PROGRAMA EMERGENCIAL E ASSISTENCIAL DE AUXÍLIO DESEMPREGO';

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
