import { DataTypes as D, Sequelize } from 'sequelize';
import { exceptionColumns } from './ft-excecao.schema.js';
export default (sequelize: Sequelize) => {
  const model = sequelize.define('FtInscricao', {
    ...exceptionColumns,
    id: { type: D.UUID, defaultValue: D.UUIDV4, primaryKey: true },
    edital_id: { type: D.UUID, allowNull: false }, bolsista_id: { type: D.UUID, allowNull: false }, respostas: { type: D.TEXT, allowNull: false }, snapshot: { type: D.TEXT, allowNull: false }, encaixe_motivo: D.TEXT, criado_por: { type: D.INTEGER, allowNull: false }, status: { type: D.STRING(16), defaultValue: 'inscrito' },
  }, { tableName: 'ft_inscricoes', timestamps: true, paranoid: true });
  (model as any).associate = (models: any) => { model.hasMany(models.BolsistasEdital, { foreignKey: 'inscricao_id', as: 'participacoes' }); model.belongsTo(models.Bolsistas, { foreignKey: 'bolsista_id', as: 'bolsista' }); };
  return model;
};
