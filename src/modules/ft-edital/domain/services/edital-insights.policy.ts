import { addMonths, businessDate, dateOnly } from './edital-workflow.policy.js';
import { ftError } from '../../../ft-bolsista/application/utils/ft-error.js';

export const paymentPatterns: Record<string, RegExp> = { bco: /^\d{1,3}$/, ag: /^\d{1,4}$/, dig_ag: /^[0-9Xx]$/, conta: /^\d{1,11}$/, dig_conta: /^[0-9Xx]$/ };
export const paymentIssues = (payment: any) => Object.entries(paymentPatterns).filter(([field, pattern]) => !pattern.test(String(payment?.[field] ?? ''))).map(([field]) => ({ codigo: 'PAGAMENTO_' + field.toUpperCase(), campo: 'payment_info.' + field, mensagem: 'Confirme ' + ({ bco: 'o banco', ag: 'a agência', dig_ag: 'o dígito da agência', conta: 'a conta', dig_conta: 'o dígito da conta' } as Record<string, string>)[field] + ': valor ausente ou inválido.' }));
export function extensionEnd(e: any, row: any, now: Date): string {
  if (e.fase !== 'aberto' || businessDate(now) > dateOnly(e.data_vencimento)) throw ftError(409, 'Edital nao esta vigente e aberto');
  const months = Number(e.prorrogacao_meses);
  if (row.status !== 'ativo') throw ftError(409, 'Somente participacao ativa pode ser prorrogada');
  if (row.prorrogated) throw ftError(409, 'Prorrogacao ja utilizada');
  if (!Number.isInteger(months) || months < 1) throw ftError(409, 'Prorrogacao desabilitada no edital');
  const currentEnd = dateOnly(row.expire_at);
  if (currentEnd < businessDate(now)) throw ftError(409, 'Vinculo ja expirou');
  const end = [addMonths(currentEnd, months), dateOnly(e.data_vencimento)].sort()[0]!;
  if (end <= currentEnd) throw ftError(409, 'Participacao ja alcanca o termino do edital');
  return end;
}
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000);
export function participationSignals(e: any, row: any, now: Date) {
  const today = businessDate(now);
  const dias_restantes = row.expire_at ? daysBetween(today, dateOnly(row.expire_at)) : null;
  const dias_reservada = row.status === 'convocado' && row.createdAt ? Math.max(0, daysBetween(businessDate(new Date(row.createdAt)), today)) : null;
  let prorrogacao_fim: string | null = null, prorrogacao_motivo: string | null = null;
  try { prorrogacao_fim = extensionEnd(e, row, now); } catch (error: any) { prorrogacao_motivo = error.message; }
  return { data_referencia: today, dias_restantes, dias_reservada,
    vencimento_alerta: row.status === 'ativo' && dias_restantes != null && dias_restantes <= 30 ? (dias_restantes < 0 ? 'vencido' : 'proximo') : null,
    reserva_antiga: dias_reservada != null && dias_reservada >= 7, prorrogacao_fim, prorrogacao_motivo };
}
