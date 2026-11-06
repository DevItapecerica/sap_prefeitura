import { Sequelize } from 'sequelize';
import { estoqueTables } from './ft-estoque.schema.js';
export default (sequelize: Sequelize) => {
  const { table, columns } = estoqueTables.FtEstoqueMovimento;
  return sequelize.define('FtEstoqueMovimento', columns, { tableName: table, timestamps: true, indexes: [] });
};
