import { Sequelize } from 'sequelize';
import { estoqueTables } from './ft-estoque.schema.js';
export default (sequelize: Sequelize) => {
  const { table, columns } = estoqueTables.FtEstoqueEntregaItem;
  return sequelize.define('FtEstoqueEntregaItem', columns, { tableName: table, timestamps: true, indexes: [] });
};
