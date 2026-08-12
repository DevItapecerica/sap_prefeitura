import AppError from "../../../core/appError.js";

export const PROTOCOL_STATES = [
  "EM_TRIAGEM", "EM_ANALISE", "AGUARDANDO_COMPLEMENTO",
  "CONCLUIDO", "INDEFERIDO", "CANCELADO",
] as const;
export type ProtocolState = (typeof PROTOCOL_STATES)[number];

const transitions: Record<ProtocolState, ProtocolState[]> = {
  EM_TRIAGEM: ["EM_ANALISE", "CANCELADO"],
  EM_ANALISE: ["EM_TRIAGEM", "AGUARDANDO_COMPLEMENTO", "CONCLUIDO", "INDEFERIDO", "CANCELADO"],
  AGUARDANDO_COMPLEMENTO: ["EM_ANALISE", "CANCELADO"],
  CONCLUIDO: [], INDEFERIDO: [], CANCELADO: [],
};

export function assertProtocolTransition(from: ProtocolState, to: ProtocolState): void {
  if (!transitions[from]?.includes(to)) {
    throw new AppError(`Transicao de ${from} para ${to} nao permitida`, 422, "INVALID_PROTOCOL_TRANSITION");
  }
}

export const FORM_FIELD_TYPES = [
  "text", "textarea", "number", "date", "select", "multiselect",
  "checkbox", "cpf", "phone", "email", "address",
] as const;
export type FormField = {
  key: string; label: string; type: (typeof FORM_FIELD_TYPES)[number];
  required?: boolean; options?: string[]; helpText?: string;
};

export function validateFormAnswers(fields: FormField[], answers: Record<string, unknown>): void {
  const allowed = new Set(fields.map((field) => field.key));
  if (Object.keys(answers).some((key) => !allowed.has(key))) throw new AppError("Formulario contem campo desconhecido", 400, "INVALID_PROTOCOL_FORM");
  for (const field of fields) {
    const value = answers[field.key];
    if (field.required && (value === undefined || value === null || value === "" || (Array.isArray(value) && !value.length))) {
      throw new AppError(`Campo obrigatorio: ${field.label}`, 400, "INVALID_PROTOCOL_FORM");
    }
    if (value == null || value === "") continue;
    if (field.type === "number" && typeof value !== "number") throw new AppError(`Campo numerico invalido: ${field.label}`, 400, "INVALID_PROTOCOL_FORM");
    if (field.type === "checkbox" && typeof value !== "boolean") throw new AppError(`Campo booleano invalido: ${field.label}`, 400, "INVALID_PROTOCOL_FORM");
    if (field.type === "select" && !field.options?.includes(String(value))) throw new AppError(`Opcao invalida: ${field.label}`, 400, "INVALID_PROTOCOL_FORM");
    if (field.type === "multiselect" && (!Array.isArray(value) || value.some((v) => !field.options?.includes(String(v))))) throw new AppError(`Opcoes invalidas: ${field.label}`, 400, "INVALID_PROTOCOL_FORM");
    if (field.type === "email" && !/^\S+@\S+\.\S+$/.test(String(value))) throw new AppError(`E-mail invalido: ${field.label}`, 400, "INVALID_PROTOCOL_FORM");
    if (field.type === "cpf" && String(value).replace(/\D/g, "").length !== 11) throw new AppError(`CPF invalido: ${field.label}`, 400, "INVALID_PROTOCOL_FORM");
    if (field.type === "date" && Number.isNaN(Date.parse(String(value)))) throw new AppError(`Data invalida: ${field.label}`, 400, "INVALID_PROTOCOL_FORM");
  }
}

export function validateFormDefinition(fields: FormField[]): void {
  if (!Array.isArray(fields) || !fields.length) throw new AppError("Formulario deve possuir campos", 400, "INVALID_FORM_DEFINITION");
  const keys = new Set<string>();
  for (const field of fields) {
    if (!/^[a-z][a-z0-9_]{1,49}$/.test(field.key) || !field.label?.trim() || !(FORM_FIELD_TYPES as readonly string[]).includes(field.type)) throw new AppError("Definicao de campo invalida", 400, "INVALID_FORM_DEFINITION");
    if (keys.has(field.key)) throw new AppError("Chave de campo duplicada", 400, "INVALID_FORM_DEFINITION"); keys.add(field.key);
    if (["select", "multiselect"].includes(field.type) && (!field.options?.length || new Set(field.options).size !== field.options.length)) throw new AppError("Opcoes do campo invalidas", 400, "INVALID_FORM_DEFINITION");
  }
}
