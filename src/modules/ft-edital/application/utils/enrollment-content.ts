import type { Answers } from "../../domain/services/edital-workflow.policy.js";

function record(json: string): Record<string, unknown> {
  const value: unknown = JSON.parse(json);
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid stored enrollment content");
  return value as Record<string, unknown>;
}

export function enrollmentSnapshot(json: string): {
  nome?: string;
  nascimento?: string | null;
} {
  const value = record(json);
  return {
    ...(typeof value.nome === "string" ? { nome: value.nome } : {}),
    ...(typeof value.nascimento === "string" || value.nascimento === null
      ? { nascimento: value.nascimento }
      : {}),
  };
}

/** Missing declarations stay missing when displaying historical registrations. */
export function enrollmentAnswers(json: string): Partial<Answers> {
  const value = record(json),
    answers: Partial<Answers> = {};
  for (const key of [
    "desempregado",
    "possui_renda",
    "recebe_previdencia",
    "vulnerabilidade_atestada",
    "beneficiario_familiar",
    "aceite",
  ] as const) {
    const field = value[key];
    if (typeof field === "boolean") answers[key] = field;
    else if (field !== undefined)
      throw new Error("Invalid stored enrollment declaration");
  }
  if (typeof value.inicio_residencia === "string")
    answers.inicio_residencia = value.inicio_residencia;
  return answers;
}
