import type { FastifyPluginAsync } from "fastify";
import AuthMiddleware from "../auth/auth.middleware.js";
import { requirePermission } from "../acess-controll/interface/require-permission.js";
import errorResponseSchema from "../../core/schema/errorSchema.js";
import AppError from "../../core/appError.js";
import type { EstoqueService } from "./estoque.service.js";

const uuid = { type: "string", format: "uuid" },
  string = { type: "string" },
  boolean = { type: "boolean" },
  integer = { type: "integer" },
  number = { type: "number" };
const object = (properties: any, required = Object.keys(properties)) => ({
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
const properties: any = {
  id: string,
  nome: string,
  epi: boolean,
  ativo: boolean,
  tamanhos_ativos: integer,
  saldo_total: number,
  item_id: string,
  tamanho: string,
  tamanho_chave: string,
  custo_centavos: integer,
  custo_unitario: number,
  saldo: integer,
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
  edital_nome: string,
  responsavel: string,
  responsavel_estorno: nullableString,
  variacao_id: string,
  entrega_id: nullableString,
  delta: integer,
  saldo_apos: integer,
  data: string,
  motivo: nullableString,
  quantidade: integer,
  createdAt: string,
  updatedAt: string,
};
const result: any = { type: "object", properties };
const collection = {
  type: "object",
  properties: {
    rows: { type: "array", items: result },
    count: integer,
    item: { anyOf: [result, { type: "null" }] },
  },
};
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
        ...result,
        properties: {
          ...properties,
          variacoes: { type: "array", items: result },
        },
      },
    },
  },
};
const detailSchema = {
  ...result,
  properties: { ...properties, itens: { type: "array", items: result } },
};
const completeSchema = {
  ...result,
  properties: { ...properties, variacoes: { type: "array", items: result } },
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
function strict(schema: any, value: any) {
  if (schema.type === "object") {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      Object.keys(value).some((key) => !schema.properties[key])
    )
      throw new AppError("Campos inválidos na operação de estoque.", 400);
    for (const [key, child] of Object.entries(schema.properties))
      if (key in value) strict(child, value[key]);
  } else if (schema.type === "array") {
    if (!Array.isArray(value))
      throw new AppError("Lista de itens inválida.", 400);
    value.forEach((row) => strict(schema.items, row));
  } else if (
    typeof value !== (schema.type === "integer" ? "number" : schema.type)
  )
    throw new AppError("Tipo de campo inválido.", 400);
}

export const EstoqueRouter: FastifyPluginAsync<{
  service?: EstoqueService;
}> = async (fastify, options) => {
  const service =
    options.service ??
    new (await import("./estoque.service.js")).EstoqueService(
      (await import("../../infra/database/sequelize/index.js")).default,
      (
        await import("../audit/factories/makeAuditService.js")
      ).makeAuditService(),
    );
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  const allow = requirePermission("ft"),
    actor = (r: any) => ({ id: r.user.id, requestId: r.id });
  const route = (
    method: "GET" | "POST" | "PUT" | "DELETE",
    url: string,
    action: string,
    body: any,
    handler: (r: any) => Promise<any>,
    response: any = result,
    alsoReadParticipants = false,
    initialEntry = false,
  ) => {
    const params = Object.fromEntries(
      [...url.matchAll(/:([A-Za-z]+)/g)].map((m) => [m[1], uuid]),
    );
    fastify.route({
      method,
      url,
      config: {
        audit: {
          failureAction:
            method === "GET" ? "VIEW" : method === "POST" ? "CREATE" : "UPDATE",
          module: "ft-estoque",
          resourceType: "estoque",
          resourceIdParam: "id",
          omitRequestedChanges: true,
        },
      },
      schema: {
        tags: ["PEAAD - Estoque"],
        summary: action.replaceAll("_", " "),
        security: [{ JWTToken: [] }],
        ...(Object.keys(params).length ? { params: object(params) } : {}),
        ...(body ? { body } : {}),
        ...(method === "GET" ? { querystring: query } : {}),
        response: {
          200: response,
          ...errorResponseSchema,
          409: errorResponseSchema[400],
          422: errorResponseSchema[400],
          503: errorResponseSchema[400],
        },
      },
      preValidation: async (r) => {
        if (body) strict(body, r.body);
      },
      preHandler: initialEntry
        ? [
            allow(action),
            async (r) => {
              if (
                (r.body as any)?.tamanhos?.some(
                  (size: any) => size.quantidade_inicial > 0,
                )
              )
                await allow("registrar_entrada_estoque")(r);
            },
          ]
        : alsoReadParticipants
          ? [allow(action), allow("consultar_vinculos")]
          : allow(action),
      handler,
    });
  };
  route(
    "GET",
    "/itens",
    "consultar_estoque",
    null,
    (r) => service.items(r.query),
    collection,
  );
  route(
    "POST",
    "/itens/cadastro-completo",
    "cadastrar_item_estoque",
    completeBody,
    (r) => service.createComplete(r.body, actor(r)),
    completeSchema,
    false,
    true,
  );
  route("GET", "/itens/:id", "consultar_estoque", null, (r) =>
    service.item(r.params.id),
  );
  route("POST", "/itens", "cadastrar_item_estoque", itemBody, (r) =>
    service.saveItem(undefined, r.body, actor(r)),
  );
  route("PUT", "/itens/:id", "editar_item_estoque", itemBody, (r) =>
    service.saveItem(r.params.id, r.body, actor(r)),
  );
  route("DELETE", "/itens/:id", "excluir_item_estoque", object(op), (r) =>
    service.saveItem(r.params.id, r.body, actor(r), true),
  );
  route(
    "GET",
    "/variacoes",
    "consultar_estoque",
    null,
    (r) => service.variations(r.query),
    collection,
  );
  route(
    "GET",
    "/itens/:id/variacoes",
    "consultar_estoque",
    null,
    (r) => service.variations({ ...r.query, item_id: r.params.id }),
    collection,
  );
  route("GET", "/variacoes/:id", "consultar_estoque", null, (r) =>
    service.variation(r.params.id),
  );
  route(
    "POST",
    "/itens/:id/variacoes",
    "cadastrar_item_estoque",
    variationBody,
    (r) => service.saveVariation(r.params.id, undefined, r.body, actor(r)),
  );
  route(
    "PUT",
    "/itens/:itemId/variacoes/:id",
    "editar_item_estoque",
    variationBody,
    (r) =>
      service.saveVariation(r.params.itemId, r.params.id, r.body, actor(r)),
  );
  route(
    "DELETE",
    "/itens/:itemId/variacoes/:id",
    "excluir_item_estoque",
    object(op),
    (r) =>
      service.saveVariation(
        r.params.itemId,
        r.params.id,
        r.body,
        actor(r),
        true,
      ),
  );
  route(
    "POST",
    "/variacoes/:id/entradas",
    "registrar_entrada_estoque",
    object({ ...op, quantidade: { ...integer, minimum: 1, maximum: 1000000 } }),
    (r) => service.stock(r.params.id, r.body, actor(r), false),
  );
  route(
    "POST",
    "/variacoes/:id/ajustes",
    "ajustar_estoque",
    object({
      ...op,
      quantidade: { ...integer, minimum: -1000000, maximum: 1000000 },
      ...reason,
    }),
    (r) => service.stock(r.params.id, r.body, actor(r), true),
  );
  route(
    "GET",
    "/movimentacoes",
    "consultar_estoque",
    null,
    (r) => service.movements(r.query),
    collection,
  );
  route(
    "GET",
    "/destinatarios",
    "consultar_estoque",
    null,
    (r) => service.recipients(r.query),
    collection,
    true,
  );
  route(
    "GET",
    "/previa/:id",
    "consultar_estoque",
    null,
    (r) => service.preview(r.params.id),
    previewSchema,
    true,
  );
  route(
    "POST",
    "/entregas/kit",
    "entregar_kit_epi",
    delivery(false),
    (r) => service.deliver("kit", r.body, actor(r)),
    result,
    true,
  );
  route(
    "POST",
    "/entregas/individual",
    "entregar_item_estoque",
    delivery(true),
    (r) => service.deliver("individual", r.body, actor(r)),
    result,
    true,
  );
  route(
    "GET",
    "/entregas",
    "consultar_entregas_estoque",
    null,
    (r) => service.deliveries(r.query),
    collection,
  );
  route(
    "GET",
    "/entregas/:id",
    "consultar_entregas_estoque",
    null,
    (r) => service.delivery(r.params.id),
    detailSchema,
  );
  route(
    "POST",
    "/entregas/:id/estornar",
    "estornar_entrega_estoque",
    object({ ...op, ...reason }),
    (r) => service.reverse(r.params.id, r.body, actor(r)),
  );
};
