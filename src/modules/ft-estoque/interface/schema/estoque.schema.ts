const uuid = { type: "string", format: "uuid" },
  string = { type: "string" },
  boolean = { type: "boolean" },
  integer = { type: "integer" },
  number = { type: "number" };
const object = (
  properties: Record<string, unknown>,
  required = Object.keys(properties),
) => ({
  type: "object",
  additionalProperties: false,
  properties,
  required,
});
const op = { operacao_id: uuid },
  reason = {
    justificativa: {
      type: "string",
      minLength: 3,
      maxLength: 1000,
      pattern: "\\S",
    },
  };
const itemBody = object(
  {
    ...op,
    nome: { ...string, minLength: 1, maxLength: 120 },
    epi: boolean,
    ativo: boolean,
  },
  ["operacao_id", "nome", "epi"],
);
const variationBody = object(
  {
    ...op,
    tamanho: { ...string, minLength: 1, maxLength: 40 },
    custo_unitario: { ...number, minimum: 0, maximum: 9999999.99 },
    ativo: boolean,
  },
  ["operacao_id", "tamanho", "custo_unitario"],
);
const line = object({
  variacao_id: uuid,
  quantidade: { ...integer, minimum: 1, maximum: 1000000 },
});
const delivery = (individual: boolean) =>
  object({
    ...op,
    participacao_id: uuid,
    versao: { ...string, pattern: "^[a-f0-9]{64}$" },
    itens: { type: "array", minItems: 1, maxItems: 1000, items: line },
    ...(individual ? reason : {}),
  });
const nullableString = { type: ["string", "null"] };
const itemSchema = {
  type: "object",
  properties: {
    id: string,
    nome: string,
    epi: boolean,
    ativo: boolean,
    createdAt: string,
    updatedAt: string,
    tamanhos_ativos: integer,
    saldo_total: number,
  },
};
const variationSchema = {
  type: "object",
  properties: {
    id: string,
    item_id: string,
    tamanho: string,
    tamanho_chave: string,
    custo_centavos: integer,
    custo_unitario: number,
    saldo: integer,
    ativo: boolean,
    createdAt: string,
    updatedAt: string,
  },
};
const movementSchema = {
  type: "object",
  properties: {
    id: string,
    variacao_id: string,
    entrega_id: nullableString,
    tipo: string,
    delta: integer,
    saldo_apos: integer,
    autor_id: string,
    data: string,
    motivo: nullableString,
    tamanho: string,
    nome: string,
    responsavel: string,
    createdAt: string,
    updatedAt: string,
  },
};
const deliverySchema = {
  type: "object",
  properties: {
    id: string,
    participacao_id: string,
    edital_id: string,
    bolsista_id: string,
    kit_ativo_participacao_id: nullableString,
    tipo: string,
    autor_id: string,
    entregue_em: string,
    justificativa: nullableString,
    total_centavos: number,
    estornado_em: nullableString,
    estornado_por: nullableString,
    motivo_estorno: nullableString,
    nome: string,
    edital_nome: string,
    responsavel: string,
    responsavel_estorno: nullableString,
    createdAt: string,
    updatedAt: string,
  },
};
const deliveredItemSchema = {
  type: "object",
  properties: {
    id: string,
    entrega_id: nullableString,
    variacao_id: string,
    nome: string,
    tamanho: string,
    quantidade: integer,
    custo_centavos: integer,
    createdAt: string,
    updatedAt: string,
  },
};
const recipientSchema = {
  type: "object",
  properties: {
    id: string,
    nome: string,
    edital_id: string,
    edital_nome: string,
  },
};
const pageOf = (row: object) => ({
  type: "object",
  properties: { rows: { type: "array", items: row }, count: integer },
});
const itemCollection = pageOf(itemSchema);
const variationCollection = {
  ...pageOf(variationSchema),
  properties: {
    ...pageOf(variationSchema).properties,
    item: { anyOf: [itemSchema, { type: "null" }] },
  },
};
const movementCollection = pageOf(movementSchema);
const deliveryCollection = pageOf(deliverySchema);
const recipientCollection = pageOf(recipientSchema);
const previewSchema = {
  type: "object",
  properties: {
    versao: string,
    kit_entregue: boolean,
    kit_entrega_id: nullableString,
    participante: object({ id: string, nome: string, edital_nome: string }),
    rows: {
      type: "array",
      items: {
        ...itemSchema,
        properties: {
          ...itemSchema.properties,
          variacoes: { type: "array", items: variationSchema },
        },
      },
    },
  },
};
const detailSchema = {
  ...deliverySchema,
  properties: {
    ...deliverySchema.properties,
    itens: { type: "array", items: deliveredItemSchema },
  },
};
const completeSchema = {
  ...itemSchema,
  properties: {
    ...itemSchema.properties,
    variacoes: { type: "array", items: variationSchema },
  },
};
const completeBody = object({
  ...op,
  nome: { ...string, minLength: 1, maxLength: 120 },
  epi: boolean,
  tamanhos: {
    type: "array",
    minItems: 1,
    maxItems: 100,
    items: object(
      {
        tamanho: { ...string, minLength: 1, maxLength: 40 },
        custo_unitario: { ...number, minimum: 0, maximum: 9999999.99 },
        quantidade_inicial: { ...integer, minimum: 0, maximum: 1000000 },
      },
      ["tamanho", "custo_unitario"],
    ),
  },
});
const query = {
  type: "object",
  additionalProperties: false,
  properties: {
    page: { ...integer, minimum: 0 },
    limit: { ...integer, minimum: 1, maximum: 50 },
    search: { ...string, maxLength: 120 },
    tamanho: { ...string, maxLength: 40 },
    epi: boolean,
    situacao: {
      ...string,
      enum: ["ativos", "inativos", "todos", "vigentes", "estornadas"],
    },
    item_id: uuid,
    variacao_id: uuid,
    participacao_id: uuid,
    tipo: { ...string, enum: ["kit", "individual"] },
  },
};

export {
  uuid,
  object,
  op,
  reason,
  itemBody,
  variationBody,
  completeBody,
  delivery,
  query,
  previewSchema,
  detailSchema,
  completeSchema,
  itemSchema,
  variationSchema,
  movementSchema,
  deliverySchema,
  itemCollection,
  variationCollection,
  movementCollection,
  deliveryCollection,
  recipientCollection,
};
