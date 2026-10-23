import { ftError } from "../../../ft-bolsista/application/utils/ft-error.js";

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
    throw ftError(422, "Data invalida");
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
  answers: Answers,
  reference: string,
  edital: { idade_maxima?: number | null },
  exception = false,
) {
  requireAgeLimit(edital);
  const birth = dateOnly(nascimento);
  const today = dateOnly(reference);
  // Compare birthday components, including leap-day births, without timezone shifts.
  const age = Number(today.slice(0, 4)) - Number(birth.slice(0, 4)) - Number(today.slice(5) < birth.slice(5));
  if (age < 18 || (!exception && age > edital.idade_maxima!))
    throw ftError(422, `Idade permitida: 18 a ${edital.idade_maxima} anos`);
  if (
    !answers.desempregado ||
    answers.possui_renda ||
    answers.recebe_previdencia ||
    !answers.vulnerabilidade_atestada ||
    !answers.aceite
  )
    throw ftError(422, "Declaracoes nao atendem aos requisitos do edital");
  if (addMonths(dateOnly(answers.inicio_residencia), 12) > today)
    throw ftError(422, "Residencia minima no municipio: um ano");
}

export function requireAgeLimit(edital: { idade_maxima?: number | null }) {
  if (!Number.isInteger(edital.idade_maxima) || edital.idade_maxima! < 18)
    throw ftError(422, 'Informe a idade maxima do edital antes de continuar');
}

export function requireExceptionReason(motivo?: string) {
  if (typeof motivo !== 'string' || motivo.trim().length < 3 || motivo.length > 1000)
    throw ftError(422, 'Excecao exige justificativa de 3 a 1000 caracteres');
}

export function registrationWindow(
  edital: any,
  now: Date,
  encaixe: boolean,
  motivo?: string,
) {
  if (
    edital.fase !== "aberto" ||
    businessDate(now) > dateOnly(edital.data_vencimento)
  )
    throw ftError(409, "Edital nao esta aberto ou sua vigencia terminou");
  if (now < new Date(edital.inscricoes_inicio))
    throw ftError(409, "Inscricoes ainda nao iniciadas");
  if (now > new Date(edital.inscricoes_fim) && (!encaixe || !motivo?.trim()))
    throw ftError(
      403,
      "Inscricao fora do prazo exige permissao de encaixe e justificativa",
    );
}

export function participationEnd(edital: any, inicio: string) {
  if (
    inicio < dateOnly(edital.vigencia_inicio) ||
    inicio > dateOnly(edital.data_vencimento)
  )
    throw ftError(422, "Inicio fora da vigencia do edital");
  return [
    addMonths(inicio, Number(edital.duracao_meses)),
    dateOnly(edital.data_vencimento),
  ].sort()[0];
}

export function validateConfiguration(data: any) {
  requireAgeLimit(data);
  if (dateOnly(data.vigencia_inicio) > dateOnly(data.data_vencimento))
    throw ftError(422, "Vigencia invalida");
  if (
    new Date(data.inscricoes_inicio) >= new Date(data.inscricoes_fim) ||
    dateOnly(new Date(data.inscricoes_fim)) > dateOnly(data.data_vencimento)
  )
    throw ftError(422, "Janela de inscricao invalida");
  if (Number(data.duracao_meses) < 1 || Number(data.prorrogacao_meses) < 0)
    throw ftError(422, "Duracao invalida");
}

export function validateHistory(edital: any, history: any[], inicio: string, exception = false) {
  if (history.some((v) => ["convocado", "ativo"].includes(v.status)))
    throw ftError(409, "Pessoa ja convocada ou ativa");
  if (exception) return;
  const previous = history.filter((v) => v.ativado_em);
  if (
    !edital.permitir_participacao_anterior &&
    previous.some((v) => v.edital_id !== edital.id)
  )
    throw ftError(
      409,
      "Edital nao permite participante anteriormente ativado em outro edital",
    );
  for (const old of previous.filter((v) => v.edital_id === edital.id)) {
    if (!edital.permitir_retorno)
      throw ftError(409, "Edital nao permite retorno");
    const end = dateOnly(
      old.canceled_at || old.concluded_at || old.expired_at || old.expire_at,
    );
    if (inicio.slice(0, 7) <= end.slice(0, 7))
      throw ftError(
        409,
        "Retorno permitido somente no mes seguinte ao encerramento",
      );
  }
}
