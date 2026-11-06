import type {
  Program,
  Participation,
} from "../repositories/workflow.repository.js";
import { PeaadRuleError } from "../../../ft-bolsista/domain/errors/peaad-rule.error.js";

export const businessDate = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

export function dateOnly(value: unknown): string {
  const text =
    value instanceof Date
      ? businessDate(value)
      : String(value ?? "").slice(0, 10);
  const parsed = new Date(text + "T12:00:00Z");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(text) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== text
  )
    throw new PeaadRuleError("INVALID_DATE", "Data invalida");
  return text;
}

export function addMonths(value: string, months: number) {
  const [year, month, day] = dateOnly(value).split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1, 12));
  const last = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, last));
  return target.toISOString().slice(0, 10);
}

export interface Answers {
  desempregado: boolean;
  possui_renda: boolean;
  recebe_previdencia: boolean;
  inicio_residencia: string;
  vulnerabilidade_atestada: boolean;
  beneficiario_familiar: boolean;
  aceite: boolean;
}

export function eligible(
  nascimento: unknown,
  answers: Partial<Answers>,
  reference: string,
  edital: { idade_maxima?: number | null },
  exception = false,
) {
  requireAgeLimit(edital);
  const birth = dateOnly(nascimento);
  const today = dateOnly(reference);
  // Compare birthday components, including leap-day births, without timezone shifts.
  const age =
    Number(today.slice(0, 4)) -
    Number(birth.slice(0, 4)) -
    Number(today.slice(5) < birth.slice(5));
  if (age < 18 || (!exception && age > edital.idade_maxima!))
    throw new PeaadRuleError(
      "AGE_OUTSIDE_RANGE",
      `Idade permitida: 18 a ${edital.idade_maxima} anos`,
    );
  if (
    !answers.desempregado ||
    answers.possui_renda ||
    answers.recebe_previdencia ||
    !answers.vulnerabilidade_atestada ||
    !answers.aceite
  )
    throw new PeaadRuleError(
      "DECLARATIONS_INELIGIBLE",
      "Declaracoes nao atendem aos requisitos do edital",
    );
  if (addMonths(dateOnly(answers.inicio_residencia), 12) > today)
    throw new PeaadRuleError(
      "RESIDENCE_TOO_SHORT",
      "Residencia minima no municipio: um ano",
    );
}

export function requireAgeLimit(edital: { idade_maxima?: number | null }) {
  if (!Number.isInteger(edital.idade_maxima) || edital.idade_maxima! < 18)
    throw new PeaadRuleError(
      "AGE_LIMIT_UNCONFIGURED",
      "Informe a idade maxima do edital antes de continuar",
    );
}

export function requireExceptionReason(motivo?: string) {
  if (
    typeof motivo !== "string" ||
    motivo.trim().length < 3 ||
    motivo.length > 1000
  )
    throw new PeaadRuleError(
      "EXCEPTION_REASON_INVALID",
      "Excecao exige justificativa de 3 a 1000 caracteres",
    );
}

export function registrationWindow(
  edital: Pick<
    Program,
    "fase" | "data_vencimento" | "inscricoes_inicio" | "inscricoes_fim"
  >,
  now: Date,
  encaixe: boolean,
  motivo?: string,
) {
  if (
    edital.fase !== "aberto" ||
    businessDate(now) > dateOnly(edital.data_vencimento)
  )
    throw new PeaadRuleError(
      "REGISTRATION_PROGRAM_NOT_OPEN",
      "Edital nao esta aberto ou sua vigencia terminou",
    );
  if (now < new Date(edital.inscricoes_inicio))
    throw new PeaadRuleError(
      "REGISTRATION_NOT_STARTED",
      "Inscricoes ainda nao iniciadas",
    );
  if (now > new Date(edital.inscricoes_fim) && (!encaixe || !motivo?.trim()))
    throw new PeaadRuleError(
      "LATE_REGISTRATION_UNAUTHORIZED",
      "Inscricao fora do prazo exige permissao de encaixe e justificativa",
    );
}

export function participationEnd(
  edital: Pick<
    Program,
    "vigencia_inicio" | "data_vencimento" | "duracao_meses"
  >,
  inicio: string,
) {
  if (
    inicio < dateOnly(edital.vigencia_inicio) ||
    inicio > dateOnly(edital.data_vencimento)
  )
    throw new PeaadRuleError(
      "START_OUTSIDE_PROGRAM",
      "Inicio fora da vigencia do edital",
    );
  return [
    addMonths(inicio, Number(edital.duracao_meses)),
    dateOnly(edital.data_vencimento),
  ].sort((left, right) => left.localeCompare(right))[0];
}

export function validateConfiguration(
  data: Pick<
    Program,
    | "idade_maxima"
    | "vigencia_inicio"
    | "data_vencimento"
    | "inscricoes_inicio"
    | "inscricoes_fim"
    | "duracao_meses"
    | "prorrogacao_meses"
  >,
) {
  requireAgeLimit(data);
  if (dateOnly(data.vigencia_inicio) > dateOnly(data.data_vencimento))
    throw new PeaadRuleError("PROGRAM_VALIDITY_INVALID", "Vigencia invalida");
  if (
    new Date(data.inscricoes_inicio) >= new Date(data.inscricoes_fim) ||
    dateOnly(new Date(data.inscricoes_fim)) > dateOnly(data.data_vencimento)
  )
    throw new PeaadRuleError(
      "REGISTRATION_WINDOW_INVALID",
      "Janela de inscricao invalida",
    );
  if (Number(data.duracao_meses) < 1 || Number(data.prorrogacao_meses) < 0)
    throw new PeaadRuleError("DURATION_INVALID", "Duracao invalida");
}

export function validateHistory(
  edital: Pick<
    Program,
    "permitir_participacao_anterior" | "permitir_retorno"
  > & { id?: string },
  history: ReadonlyArray<Partial<Participation>>,
  inicio: string,
  exception = false,
) {
  if (
    history.some(
      (v) =>
        v.status !== undefined && ["convocado", "ativo"].includes(v.status),
    )
  )
    throw new PeaadRuleError(
      "SIMULTANEOUS_PARTICIPATION",
      "Pessoa ja convocada ou ativa",
    );
  if (exception) return;
  const previous = history.filter((v) => v.ativado_em);
  if (
    !edital.permitir_participacao_anterior &&
    previous.some((v) => v.edital_id !== edital.id)
  )
    throw new PeaadRuleError(
      "PREVIOUS_PROGRAM_PARTICIPATION",
      "Edital nao permite participante anteriormente ativado em outro edital",
    );
  for (const old of previous.filter((v) => v.edital_id === edital.id)) {
    if (!edital.permitir_retorno)
      throw new PeaadRuleError(
        "RETURN_FORBIDDEN",
        "Edital nao permite retorno",
      );
    const end = dateOnly(
      old.canceled_at || old.concluded_at || old.expired_at || old.expire_at,
    );
    if (inicio.slice(0, 7) <= end.slice(0, 7))
      throw new PeaadRuleError(
        "RETURN_TOO_EARLY",
        "Retorno permitido somente no mes seguinte ao encerramento",
      );
  }
}
