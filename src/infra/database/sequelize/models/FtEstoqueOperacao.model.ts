import { Sequelize } from 'sequelize';
import { estoqueTables } from './ft-estoque.schema.js';
export default (sequelize: Sequelize) => {
  const { table, columns } = estoqueTables.FtEstoqueOperacao;
  return sequelize.define('FtEstoqueOperacao', columns, { tableName: table, timestamps: true, indexes: [] });
};
