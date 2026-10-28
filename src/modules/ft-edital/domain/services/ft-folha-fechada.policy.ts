import { Op, Transaction } from 'sequelize';
import type { DbObject } from '../../../../core/types/DbTypes.js';
import { ftError } from '../../../ft-bolsista/application/utils/ft-error.js';

/** Call inside the edital transaction; the caller must hold its row lock. */
export async function assertCompetenciasAbertas(db: DbObject, editalId: string, inicio: string, fim: string, transaction?: Transaction) {
  if (!inicio || !fim || inicio > fim) return;
  const closed = await db.FtFolhaFechamento.findOne({
    where: { edital_id: editalId, mes: { [Op.between]: [inicio.slice(0, 7), fim.slice(0, 7)] } },
    attributes: ['mes'], order: [['mes', 'ASC']], transaction,
  });
  if (closed) throw ftError(409, 'A folha de ' + closed.mes + ' está fechada. Não é possível alterar esta competência.');
}

export function nextCivilDay(date: string) {
  const day = new Date(date + 'T12:00:00Z'); day.setUTCDate(day.getUTCDate() + 1);
  return day.toISOString().slice(0, 10);
}
