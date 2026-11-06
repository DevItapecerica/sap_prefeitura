import { Sequelize } from 'sequelize';
import { estoqueTables } from './ft-estoque.schema.js';
export default (sequelize: Sequelize) => {
  const { table, columns } = estoqueTables.FtEstoqueItem;
  return sequelize.define('FtEstoqueItem', columns, { tableName: table, timestamps: true, indexes: [] });
};
