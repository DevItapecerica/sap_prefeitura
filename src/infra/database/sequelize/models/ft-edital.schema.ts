import { DataTypes as D } from 'sequelize';

export const editalColumns = {
  idade_maxima: { type: D.INTEGER.UNSIGNED, allowNull: true },
  fase: { type: D.STRING(16), allowNull: false, defaultValue: 'rascunho' },
  vigencia_inicio: { type: D.DATEONLY, allowNull: true },
  inscricoes_inicio: { type: D.DATE, allowNull: true }, inscricoes_fim: { type: D.DATE, allowNull: true },
  vagas: { type: D.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  carga_semanal: { type: D.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
  carga_mensal: { type: D.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
  duracao_meses: { type: D.INTEGER.UNSIGNED, allowNull: false, defaultValue: 6 },
  prorrogacao_meses: { type: D.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  permitir_participacao_anterior: { type: D.BOOLEAN, allowNull: false, defaultValue: false },
  permitir_retorno: { type: D.BOOLEAN, allowNull: false, defaultValue: false },
  primeira_convocacao_em: { type: D.DATE, allowNull: true },
};
