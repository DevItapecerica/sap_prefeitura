import { dateOnly } from './edital-workflow.policy.js';
import { ftError } from '../../../ft-bolsista/application/utils/ft-error.js';

const financialFields = ['data_publicacao', 'vigencia_inicio', 'valor_bolsa', 'dia_pagamento', 'carga_semanal', 'carga_mensal', 'duracao_meses', 'prorrogacao_meses', 'permitir_participacao_anterior', 'permitir_retorno'];

/** Shared by the read contract and the transactional update. Never grants write access. */
export function editingPolicy(edital: any, hasClosedPayroll: boolean, used: number) {
  const locked: Record<string, string> = {};
  const restricted = Boolean(edital.primeira_convocacao_em || hasClosedPayroll);
  if (restricted) for (const field of financialFields) locked[field] = 'Condições bloqueadas após convocação ou fechamento de folha.';
  if (edital.primeira_convocacao_em && edital.idade_maxima != null) locked.idade_maxima = 'Idade maxima bloqueada apos a primeira convocacao';
  locked.inscricoes_inicio = locked.inscricoes_fim = 'Use a operação Alterar prazo de inscrição.';
  if (edital.fase === 'encerrado') for (const field of ['name', 'vagas', 'data_vencimento', 'idade_maxima', ...financialFields]) locked[field] = 'Edital encerrado.';
  return { campos_bloqueados: locked, vagas_minimas: Math.max(1, used), vigencia_minima: restricted ? dateOnly(edital.data_vencimento) : null };
}

function sameLockedValue(field: string, proposed: any, current: any): boolean {
  if (field.startsWith('inscricoes_')) return new Date(proposed).getTime() === new Date(current).getTime();
  if (['data_publicacao', 'vigencia_inicio'].includes(field)) return dateOnly(proposed) === dateOnly(current);
  if (typeof proposed === 'number') return Number(proposed) === Number(current);
  return String(proposed) === String(current);
}

export function assertEditable(edital: any, data: any, policy: ReturnType<typeof editingPolicy>) {
  if (edital.fase === 'encerrado') throw ftError(409, 'Edital encerrado');
  for (const field of Object.keys(policy.campos_bloqueados)) {
    if (!sameLockedValue(field, data[field], edital[field])) throw ftError(409, policy.campos_bloqueados[field] + ' Campo: ' + field);
  }
  if (policy.vigencia_minima && dateOnly(data.data_vencimento) < policy.vigencia_minima) throw ftError(409, 'Vigencia somente pode ser ampliada');
  if (data.vagas < policy.vagas_minimas) throw ftError(409, 'Vagas abaixo da ocupacao e reservas');
}
