import errors from "../../../core/schema/errorSchema.js";
export const uuid = { type: "string", format: "uuid" };
const text = { type: "string" };
const nullableText = { type: ["string", "null"] };
export const object = (
  properties: Record<string, unknown>,
  required = Object.keys(properties),
) => ({ type: "object", additionalProperties: false, properties, required });
const benefit = object({ id: uuid, nome: text, descricao: nullableText });
export const delivery = object({
  id: uuid,
  edital_id: uuid,
  participacao_id: uuid,
  pessoa_id: uuid,
  mes: text,
  entregue_em: text,
  autor_id: text,
  responsavel: text,
  estornado_em: nullableText,
  estornado_por: nullableText,
  responsavel_estorno: nullableText,
  motivo_estorno: nullableText,
  itens: { type: "array", items: benefit },
});
const person = object({ id: uuid, nome: text, cpf: text });
export const preview = object({
  mes: text,
  pessoa: person,
  participacao_id: uuid,
  permitir_encerrados: { type: "boolean" },
  impedimento: nullableText,
  beneficios: {
    type: "array",
    items: object({
      id: uuid,
      nome: text,
      descricao: nullableText,
      retirada: { anyOf: [delivery, { type: "null" }] },
    }),
  },
});
const integer = { type: "integer", minimum: 0 };
export const history = object({
  rows: {
    type: "array",
    items: object({ ...delivery.properties, nome: text }),
  },
  count: integer,
});
export const report = object({
  rows: {
    type: "array",
    items: object({
      pessoa_id: uuid,
      nome: text,
      cpf: text,
      beneficio_id: uuid,
      beneficio: text,
      mes: text,
      situacao: { type: "string", enum: ["retirado", "pendente"] },
      entregue_em: nullableText,
      responsavel: nullableText,
    }),
  },
  count: integer,
  mes: text,
  totais: object({
    previstos: integer,
    retirados: integer,
    pendentes: integer,
  }),
  beneficios: { type: "array", items: benefit },
});
export const month = { type: "string", pattern: "^\\d{4}-(0[1-9]|1[0-2])$" };
export const query = object(
  {
    mes: month,
    page: integer,
    limit: { type: "integer", minimum: 1, maximum: 50 },
    search: { type: "string", maxLength: 255 },
    beneficio_id: uuid,
    participacao_id: uuid,
    situacao: { type: "string", enum: ["todos", "retirados", "pendentes"] },
  },
  [],
);
export const deliveryBody = object({
  operacao_id: uuid,
  beneficio_ids: {
    type: "array",
    minItems: 1,
    maxItems: 100,
    uniqueItems: true,
    items: uuid,
  },
});
export const reverseBody = object({
  operacao_id: uuid,
  motivo: { type: "string", minLength: 3, maxLength: 1000, pattern: "\\S" },
});
export const response = (resource: object) => ({
  200: resource,
  ...errors,
  409: errors[400],
  422: errors[400],
});
const audit = {
  module: "ft-beneficios",
  resourceType: "entrega_beneficios",
  resourceIdParam: "id",
  omitRequestedChanges: true,
};
export const viewConfig = {
  audit: { ...audit, failureAction: "VIEW" as const },
};
export const createConfig = {
  audit: { ...audit, failureAction: "CREATE" as const },
};
export const reverseConfig = {
  audit: { ...audit, failureAction: "UPDATE" as const },
};
export const exportConfig = {
  audit: { ...audit, failureAction: "EXPORT" as const },
};
export const metadata = {
  tags: ["PEAAD - Benefícios"],
  security: [{ JWTToken: [] }],
};
