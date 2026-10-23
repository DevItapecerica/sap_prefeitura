import { DataTypes as D, Sequelize } from 'sequelize';
export default (sequelize: Sequelize) => {
  const model = sequelize.define('FtEditalLocal', {
    id: { type: D.UUID, defaultValue: D.UUIDV4, primaryKey: true },
    edital_id: { type: D.UUID, allowNull: false }, nome: { type: D.STRING(120), allowNull: false }, descricao: D.TEXT,
  }, { tableName: 'ft_edital_locais', timestamps: true, paranoid: true });
  (model as any).associate = (models: any) => { void models; };
  return model;
};
