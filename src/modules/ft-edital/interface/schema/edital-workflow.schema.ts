const uuid = { type: "string", format: "uuid" };
const text = { type: "string", minLength: 1, maxLength: 120 };
const date = { type: "string", format: "date" };
const instant = { type: "string", format: "date-time" };
const integer = (min = 0, max = 1000000) => ({
  type: "integer",
  minimum: min,
  maximum: max,
});
const object = (
  properties: Record<string, unknown>,
  required = Object.keys(properties),
) => ({ type: "object", additionalProperties: false, properties, required });
const motivo = {
  type: "string",
  minLength: 3,
  maxLength: 1000,
  pattern: "\\S",
};
const configuration = {
  idade_maxima: integer(18),
  name: text,
  data_publicacao: date,
  vigencia_inicio: date,
  data_vencimento: date,
  inscricoes_inicio: instant,
  inscricoes_fim: instant,
  vagas: integer(1),
  dia_pagamento: integer(1, 31),
  valor_bolsa: { type: "number", minimum: 0, maximum: 99999999.99 },
  carga_semanal: { type: "number", exclusiveMinimum: 0, maximum: 168 },
  carga_mensal: { type: "number", exclusiveMinimum: 0, maximum: 744 },
  duracao_meses: integer(1, 120),
  prorrogacao_meses: integer(0, 120),
  permitir_participacao_anterior: { type: "boolean" },
  permitir_retorno: { type: "boolean" },
};
const answers = object({
  desempregado: { type: "boolean" },
  possui_renda: { type: "boolean" },
  recebe_previdencia: { type: "boolean" },
  inicio_residencia: date,
  vulnerabilidade_atestada: { type: "boolean" },
  beneficiario_familiar: { type: "boolean" },
  aceite: { type: "boolean" },
});
const allocation = {
  pagador_id: uuid,
  turno_id: uuid,
  local: { type: "string", minLength: 1, maxLength: 255, pattern: "\\S" },
};
const payment = object({
  bco: { type: "string", pattern: "^\\d{1,3}$" },
  ag: { type: "string", pattern: "^\\d{1,4}$" },
  dig_ag: { type: "string", pattern: "^[0-9Xx]$" },
  conta: { type: "string", pattern: "^\\d{1,11}$" },
  dig_conta: { type: "string", pattern: "^[0-9Xx]$" },
});
const nullableText = { type: ["string", "null"] };
const issue = object({
  codigo: text,
  mensagem: { type: "string" },
  campo: nullableText,
});
const itemProperties = {
  beneficios_permitir_encerrados: { type: "boolean" },
  edicao: object({
    campos_bloqueados: {
      type: "object",
      additionalProperties: { type: "string" },
    },
    vagas_minimas: integer(1),
    vigencia_minima: { type: ["string", "null"], format: "date" },
  }),
  permitido: { type: "boolean" },
  pendencias: { type: "array", items: issue },
  novo_termino: date,
  termino_previsto: date,
  nome_inscricao: nullableText,
  inscricao_excepcional: { type: "boolean" },
  convocacao_excepcional: { type: "boolean" },
  createdAt: instant,
  data_referencia: date,
  dias_restantes: { type: ["integer", "null"] },
  dias_reservada: { type: ["integer", "null"] },
  vencimento_alerta: nullableText,
  reserva_antiga: { type: "boolean" },
  prorrogacao_fim: { type: ["string", "null"] },
  prorrogacao_motivo: nullableText,
  pagamento_pendente: { type: "boolean" },
  acao: { type: "string" },
  data: { type: ["string", "null"], format: "date-time" },
  responsavel: { type: "string" },
  motivo: nullableText,
  origem: { type: "string" },
  recurso_id: uuid,
  recurso_nome: { type: "string" },
  ...configuration,
  id: uuid,
  uuid,
  edital_id: uuid,
  inscricao_id: uuid,
  bolsista_id: uuid,
  idade_maxima: { type: ["integer", "null"], minimum: 18 },
  nome: { type: "string" },
  status: { type: "string" },
  fase: { type: "string" },
  situacao: { type: "string" },
  pagador_nome: { type: "string" },
  quantidade: integer(),
  ocupacao: integer(),
  reservadas: integer(),
  ocupadas: integer(),
  disponiveis: integer(),
  respostas: answers,
  ...allocation,
  excecao_motivo: { type: ["string", "null"] },
  excecao_autor_id: { type: ["string", "null"] },
  excecao_em: { anyOf: [instant, { type: "null" }] },
  data_vinculo: instant,
  expire_at: instant,
  ativado_em: { anyOf: [instant, { type: "null" }] },
  turno_nome_snapshot: { type: "string" },
  prorrogated: { type: "boolean" },
  descricao: { anyOf: [{ type: "string" }, { type: "null" }] },
  data_falta: date,
  observacao: { anyOf: [{ type: "string" }, { type: "null" }] },
  data_ocorrencia: date,
  hora_inicio: { type: "string" },
  hora_fim: { type: "string" },
};
const item = {
  type: "object",
  additionalProperties: true,
  properties: itemProperties,
};
const itemRef = { $ref: "FtWorkflowItem#" };
const collection = {
  type: "object",
  required: ["rows", "count"],
  properties: { rows: { type: "array", items: itemRef }, count: integer() },
};
const query = object(
  {
    fase: { type: "string", enum: ["rascunho", "aberto", "encerrado"] },
    inscricoes_abertas: { type: "boolean" },
    grupo_status: { type: "string", enum: ["encerrados"] },
    pagador_id: uuid,
    turno_id: uuid,
    excecao: {
      type: "string",
      enum: ["inscricao", "convocacao", "qualquer", "nenhuma"],
    },
    page: integer(),
    limit: integer(1, 50),
    search: { type: "string", maxLength: 120 },
    status: {
      type: "string",
      enum: [
        "inscrito",
        "convocado",
        "ativo",
        "cancelado",
        "concluido",
        "expirado",
        "inativo",
      ],
    },
  },
  [],
);

const time = {
  type: "string",
  pattern: "^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$",
};
const payerBody = object({ nome: text, quantidade: integer() });
const shiftBody = object({ nome: text, hora_inicio: time, hora_fim: time });
const configBody = object({
  nome: text,
  descricao: { type: "string", maxLength: 2000 },
});
const registrationBody = object(
  { municipe_uuid: uuid, respostas: answers, motivo },
  ["municipe_uuid", "respostas"],
);
const exceptionBody = object({
  municipe_uuid: uuid,
  respostas: answers,
  motivo,
});
const callBody = object({ ...allocation, data_inicio: date });
const callExceptionBody = object({ ...allocation, data_inicio: date, motivo });
const activationBody = object({ data_inicio: date, payment_info: payment });
const reasonBody = object({ motivo });
const allocationBody = object(allocation);
const emptyBody = object({});
const editalBody = object(configuration);
const windowBody = object({
  inscricoes_inicio: instant,
  inscricoes_fim: instant,
  motivo,
});
const absenceBody = object(
  { data_falta: date, observacao: { type: "string", maxLength: 2000 } },
  ["data_falta"],
);
const occurrenceBody = object({
  data_ocorrencia: date,
  descricao: { type: "string", minLength: 1, maxLength: 2000 },
});
const prevalidationBody = object(
  {
    municipe_uuid: uuid,
    inscricao_id: uuid,
    participacao_id: uuid,
    data_inicio: date,
    pagador_id: uuid,
    turno_id: uuid,
    local: { type: "string", maxLength: 255 },
    motivo: { type: "string", maxLength: 1000 },
    respostas: object(answers.properties, []),
    payment_info: object(
      Object.fromEntries(
        Object.keys(payment.properties).map((key) => [
          key,
          { type: "string", maxLength: 16 },
        ]),
      ),
      [],
    ),
  },
  [],
);
const pdfQuery = object({
  mes: { type: "string", pattern: "^\\d{4}-(0[1-9]|1[0-2])$" },
});
const pdfResponse = {
  description: "PDF da participacao",
  content: {
    "application/pdf": { schema: { type: "string", format: "binary" } },
  },
};
export {
  uuid,
  object,
  item,
  itemRef,
  collection,
  query,
  payerBody,
  shiftBody,
  configBody,
  registrationBody,
  exceptionBody,
  callBody,
  callExceptionBody,
  activationBody,
  reasonBody,
  allocationBody,
  emptyBody,
  editalBody,
  windowBody,
  absenceBody,
  occurrenceBody,
  prevalidationBody,
  pdfQuery,
  pdfResponse,
};
