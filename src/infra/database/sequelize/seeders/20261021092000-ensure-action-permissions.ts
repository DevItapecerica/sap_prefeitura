import { QueryInterface } from 'sequelize';
import { ASCII64, ensureForeignKeys, snapshot, rollbackSnapshot } from '../migrations/helpers/action-permissions.js';
export default {
  async up(qi: QueryInterface) {
    await snapshot(qi, true);
    // Historical seeds run after migrations and do not supply module_key.
    // Only the final seed closes this bootstrap-only nullable window.
    const columns = await qi.describeTable('services');
    // Do not ALTER an already referenced parent column on seed reruns.
    if (columns.module_key.allowNull) await qi.changeColumn('services', 'module_key', { type: ASCII64, allowNull: false });
    await ensureForeignKeys(qi);
  },
  async down(qi: QueryInterface) { await rollbackSnapshot(qi); },
};
