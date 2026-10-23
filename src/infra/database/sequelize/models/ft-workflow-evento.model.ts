import { DataTypes as D, Sequelize } from 'sequelize';
export default (sequelize: Sequelize) => {
  const model = sequelize.define('FtWorkflowEvento', {
    id: { type: D.UUID, defaultValue: D.UUIDV4, primaryKey: true },
    edital_id: { type: D.UUID, allowNull: false }, recurso_id: { type: D.UUID, allowNull: false }, acao: { type: D.STRING(48), allowNull: false }, ator_id: { type: D.STRING(64), allowNull: false }, request_id: { type: D.STRING(64), allowNull: false }, motivo: D.TEXT,
  }, { tableName: 'ft_workflow_eventos', timestamps: true, paranoid: true });
  (model as any).associate = (models: any) => { void models; };
  return model;
};
