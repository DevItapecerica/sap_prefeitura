const instantTime = (value: unknown) =>
  value instanceof Date ? value.getTime() : new Date(String(value)).getTime();
import type {
  Program,
  EditalInput,
} from "../repositories/workflow.repository.js";
import { PeaadRuleError } from "../../../ft-bolsista/domain/errors/peaad-rule.error.js";
import { dateOnly } from "./edital-workflow.policy.js";

const financialFields = [
  "data_publicacao",
  "vigencia_inicio",
  "valor_bolsa",
  "dia_pagamento",
  "carga_semanal",
  "carga_mensal",
  "duracao_meses",
  "prorrogacao_meses",
  "permitir_participacao_anterior",
  "permitir_retorno",
];

/** Shared by the read contract and the transactional update. Never grants write access. */
export function editingPolicy(
  edital: Partial<Program>,
  hasClosedPayroll: boolean,
  used: number,
) {
  const locked: Record<string, string> = {};
  const restricted = Boolean(edital.primeira_convocacao_em || hasClosedPayroll);
  if (restricted)
    for (const field of financialFields)
      locked[field] =
        "Condições bloqueadas após convocação ou fechamento de folha.";
  if (edital.primeira_convocacao_em && edital.idade_maxima != null)
    locked.idade_maxima = "Idade maxima bloqueada apos a primeira convocacao";
  locked.inscricoes_inicio = locked.inscricoes_fim =
    "Use a operação Alterar prazo de inscrição.";
  if (edital.fase === "encerrado")
    for (const field of [
      "name",
      "vagas",
      "data_vencimento",
      "idade_maxima",
      ...financialFields,
    ])
      locked[field] = "Edital encerrado.";
  return {
    campos_bloqueados: locked,
    vagas_minimas: Math.max(1, used),
    vigencia_minima: restricted ? dateOnly(edital.data_vencimento) : null,
  };
}

function sameLockedValue(
  field: string,
  proposed: unknown,
  current: unknown,
): boolean {
  if (field.startsWith("inscricoes_"))
    return instantTime(proposed) === instantTime(current);
  if (["data_publicacao", "vigencia_inicio"].includes(field))
    return dateOnly(proposed) === dateOnly(current);
  if (typeof proposed === "number") return Number(proposed) === Number(current);
  return String(proposed) === String(current);
}

export function assertEditable(
  edital: Partial<Program>,
  data: EditalInput,
  policy: ReturnType<typeof editingPolicy>,
) {
  if (edital.fase === "encerrado")
    throw new PeaadRuleError("PROGRAM_CLOSED", "Edital encerrado");
  for (const field of Object.keys(policy.campos_bloqueados) as Array<
    keyof EditalInput
  >) {
    if (!sameLockedValue(field, data[field], edital[field]))
      throw new PeaadRuleError(
        "PROGRAM_FIELD_LOCKED",
        policy.campos_bloqueados[field] + " Campo: " + field,
      );
  }
  if (
    policy.vigencia_minima &&
    dateOnly(data.data_vencimento) < policy.vigencia_minima
  )
    throw new PeaadRuleError(
      "PROGRAM_VALIDITY_REDUCTION",
      "Vigencia somente pode ser ampliada",
    );
  if (data.vagas < policy.vagas_minimas)
    throw new PeaadRuleError(
      "VACANCIES_BELOW_OCCUPATION",
      "Vagas abaixo da ocupacao e reservas",
    );
}
