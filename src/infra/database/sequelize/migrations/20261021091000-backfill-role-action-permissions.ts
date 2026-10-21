import { QueryInterface } from 'sequelize';
import { snapshot, rollbackSnapshot } from './helpers/action-permissions.js';
export default {
  async up(qi: QueryInterface) { await snapshot(qi); },
  async down(qi: QueryInterface) { await rollbackSnapshot(qi); },
};
