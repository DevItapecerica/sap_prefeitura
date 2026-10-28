import { QueryInterface, QueryTypes } from 'sequelize';
import { ensureCatalog, select, ServiceRow } from '../migrations/helpers/action-permissions.js';

export default {
  async up(q: QueryInterface) {
    await q.sequelize.transaction(async transaction => {
      const services = await select<ServiceRow>(q, 'SELECT id,module_key FROM services ORDER BY id', transaction);
      const ft = services.filter(s => s.id === 6);
      if (ft.length !== 1 || ft[0].module_key !== 'ft') throw new Error('FT service/module not configured');
      await ensureCatalog(q, ft, transaction);
      // Absence of a grant is denial. Never create or overwrite role grants here.
    });
  },
  async down(q: QueryInterface) {
    await q.sequelize.transaction(async transaction => {
      const [row] = await q.sequelize.query<{ total: number }>("SELECT COUNT(*) total FROM role_permissions rp JOIN permission_actions p ON p.id=rp.permission_action_id WHERE p.module_key='ft' AND p.action IN ('fechar_folha_pagamento')", { type: QueryTypes.SELECT, transaction });
      if (Number(row.total)) throw new Error('Rollback refused: payroll permissions have role grants');
      await q.bulkDelete('permission_actions', { module_key: 'ft', action: ['fechar_folha_pagamento'] }, { transaction });
    });
  },
};
