import { DataTypes as D } from 'sequelize';

export const folhaColumns = {
  id: { type: D.UUID, defaultValue: D.UUIDV4, primaryKey: true },
  edital_id: { type: D.UUID, allowNull: false },
  mes: { type: D.STRING(7), allowNull: false },
  fechado_por: { type: D.STRING(64), allowNull: false },
  fechado_em: { type: D.DATE, allowNull: false },
  versao: { type: D.STRING(64), allowNull: false },
  // Contains the exact CSV, items, totals and calculation period. Never log it.
  snapshot: { type: D.TEXT('long'), allowNull: false },
};
