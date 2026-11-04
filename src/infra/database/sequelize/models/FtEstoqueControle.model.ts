import { Sequelize } from 'sequelize';
import { estoqueTables } from './ft-estoque.schema.js';
export default (sequelize: Sequelize) => {
  const { table, columns } = estoqueTables.FtEstoqueControle;
  return sequelize.define('FtEstoqueControle', columns, { tableName: table, timestamps: true, indexes: [] });
};
