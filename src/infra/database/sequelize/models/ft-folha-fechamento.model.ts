import { Sequelize } from 'sequelize';
import { folhaColumns } from './ft-folha-fechamento.schema.js';

export default (sequelize: Sequelize) => sequelize.define('FtFolhaFechamento', folhaColumns, {
  tableName: 'ft_folhas_fechadas', timestamps: false,
  indexes: [{ name: 'uq_ft_folha_edital_mes', unique: true, fields: ['edital_id', 'mes'] }],
});
