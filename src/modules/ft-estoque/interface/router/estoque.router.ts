import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { requirePermission } from "../../../acess-controll/interface/require-permission.js";
import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import { configureBodyValidation } from "../../../../infra/http/fastify/body-validation.js";
import type {
  StockQuery,
  CompleteInput,
  ItemInput,
  VariationInput,
  Operation,
  StockInput,
  DeliveryInput,
  ReversalInput,
} from "../../domain/estoque.contracts.js";
import type { EstoqueController } from "../controller/estoque.controller.js";
import {
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
} from "../schema/estoque.schema.js";
const integer = { type: "integer" };
export const EstoqueRouter: FastifyPluginAsync<{
  controller?: EstoqueController;
}> = async (fastify, options) => {
  const controller =
    options.controller ??
    (
      await import("../../factories/makeEstoqueController.js")
    ).makeEstoqueController();
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  configureBodyValidation(fastify, {
    extraField: () => "Campos inválidos na operação de estoque.",
    invalidType: "Tipo de campo inválido.",
  });
  const allow = requirePermission("ft");
  const requireInitialEntryPermission = async (
    request: FastifyRequest<{ Body: CompleteInput }>,
  ) => {
    if (
      request.body.tamanhos.some((size) => (size.quantidade_inicial ?? 0) > 0)
    )
      await allow("registrar_entrada_estoque")(request);
  };

  fastify.route<{ Querystring: StockQuery; Params: {}; Body: never }>({
    method: "GET",
    url: "/itens",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-estoque",
        resourceType: "estoque",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Estoque"],
      summary: "listItems",
      security: [{ JWTToken: [] }],
      querystring: query,
      response: {
        200: itemCollection,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        422: errorResponseSchema[400],
        503: errorResponseSchema[400],
      },
    },
    preHandler: allow("consultar_estoque"),
    handler: controller.listItems,
  });

  fastify.route<{ Querystring: StockQuery; Params: {}; Body: CompleteInput }>({
    method: "POST",
    url: "/itens/cadastro-completo",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-estoque",
        resourceType: "estoque",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Estoque"],
      summary: "createComplete",
      security: [{ JWTToken: [] }],
      body: completeBody,
      response: {
        200: completeSchema,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        422: errorResponseSchema[400],
        503: errorResponseSchema[400],
      },
    },
    preHandler: [
      allow("cadastrar_item_estoque"),
      requireInitialEntryPermission,
    ],
    handler: controller.createComplete,
  });

  fastify.route<{
    Querystring: StockQuery;
    Params: { id: string };
    Body: never;
  }>({
    method: "GET",
    url: "/itens/:id",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-estoque",
        resourceType: "estoque",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Estoque"],
      summary: "getItem",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      querystring: query,
      response: {
        200: itemSchema,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        422: errorResponseSchema[400],
        503: errorResponseSchema[400],
      },
    },
    preHandler: allow("consultar_estoque"),
    handler: controller.getItem,
  });

  fastify.route<{ Querystring: StockQuery; Params: {}; Body: ItemInput }>({
    method: "POST",
    url: "/itens",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-estoque",
        resourceType: "estoque",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Estoque"],
      summary: "createItem",
      security: [{ JWTToken: [] }],
      body: itemBody,
      response: {
        200: itemSchema,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        422: errorResponseSchema[400],
        503: errorResponseSchema[400],
      },
    },
    preHandler: allow("cadastrar_item_estoque"),
    handler: controller.createItem,
  });

  fastify.route<{
    Querystring: StockQuery;
    Params: { id: string };
    Body: ItemInput;
  }>({
    method: "PUT",
    url: "/itens/:id",
    config: {
      audit: {
        failureAction: "UPDATE",
        module: "ft-estoque",
        resourceType: "estoque",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Estoque"],
      summary: "updateItem",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      body: itemBody,
      response: {
        200: itemSchema,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        422: errorResponseSchema[400],
        503: errorResponseSchema[400],
      },
    },
    preHandler: allow("editar_item_estoque"),
    handler: controller.updateItem,
  });

  fastify.route<{
    Querystring: StockQuery;
    Params: { id: string };
    Body: Operation;
  }>({
    method: "DELETE",
    url: "/itens/:id",
    config: {
      audit: {
        failureAction: "UPDATE",
        module: "ft-estoque",
        resourceType: "estoque",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Estoque"],
      summary: "removeItem",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      body: object(op),
      response: {
        200: itemSchema,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        422: errorResponseSchema[400],
        503: errorResponseSchema[400],
      },
    },
    preHandler: allow("excluir_item_estoque"),
    handler: controller.removeItem,
  });

  fastify.route<{ Querystring: StockQuery; Params: {}; Body: never }>({
    method: "GET",
    url: "/variacoes",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-estoque",
        resourceType: "estoque",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Estoque"],
      summary: "listVariations",
      security: [{ JWTToken: [] }],
      querystring: query,
      response: {
        200: variationCollection,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        422: errorResponseSchema[400],
        503: errorResponseSchema[400],
      },
    },
    preHandler: allow("consultar_estoque"),
    handler: controller.listVariations,
  });

  fastify.route<{
    Querystring: StockQuery;
    Params: { id: string };
    Body: never;
  }>({
    method: "GET",
    url: "/itens/:id/variacoes",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-estoque",
        resourceType: "estoque",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Estoque"],
      summary: "listItemVariations",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      querystring: query,
      response: {
        200: variationCollection,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        422: errorResponseSchema[400],
        503: errorResponseSchema[400],
      },
    },
    preHandler: allow("consultar_estoque"),
    handler: controller.listItemVariations,
  });

  fastify.route<{
    Querystring: StockQuery;
    Params: { id: string };
    Body: never;
  }>({
    method: "GET",
    url: "/variacoes/:id",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-estoque",
        resourceType: "estoque",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Estoque"],
      summary: "getVariation",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      querystring: query,
      response: {
        200: variationSchema,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        422: errorResponseSchema[400],
        503: errorResponseSchema[400],
      },
    },
    preHandler: allow("consultar_estoque"),
    handler: controller.getVariation,
  });

  fastify.route<{
    Querystring: StockQuery;
    Params: { id: string };
    Body: VariationInput;
  }>({
    method: "POST",
    url: "/itens/:id/variacoes",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-estoque",
        resourceType: "estoque",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Estoque"],
      summary: "createVariation",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      body: variationBody,
      response: {
        200: variationSchema,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        422: errorResponseSchema[400],
        503: errorResponseSchema[400],
      },
    },
    preHandler: allow("cadastrar_item_estoque"),
    handler: controller.createVariation,
  });

  fastify.route<{
    Querystring: StockQuery;
    Params: { itemId: string; id: string };
    Body: VariationInput;
  }>({
    method: "PUT",
    url: "/itens/:itemId/variacoes/:id",
    config: {
      audit: {
        failureAction: "UPDATE",
        module: "ft-estoque",
        resourceType: "estoque",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Estoque"],
      summary: "updateVariation",
      security: [{ JWTToken: [] }],
      params: object({ itemId: uuid, id: uuid }),
      body: variationBody,
      response: {
        200: variationSchema,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        422: errorResponseSchema[400],
        503: errorResponseSchema[400],
      },
    },
    preHandler: allow("editar_item_estoque"),
    handler: controller.updateVariation,
  });

  fastify.route<{
    Querystring: StockQuery;
    Params: { itemId: string; id: string };
    Body: Operation;
  }>({
    method: "DELETE",
    url: "/itens/:itemId/variacoes/:id",
    config: {
      audit: {
        failureAction: "UPDATE",
        module: "ft-estoque",
        resourceType: "estoque",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Estoque"],
      summary: "removeVariation",
      security: [{ JWTToken: [] }],
      params: object({ itemId: uuid, id: uuid }),
      body: object(op),
      response: {
        200: variationSchema,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        422: errorResponseSchema[400],
        503: errorResponseSchema[400],
      },
    },
    preHandler: allow("excluir_item_estoque"),
    handler: controller.removeVariation,
  });

  fastify.route<{
    Querystring: StockQuery;
    Params: { id: string };
    Body: StockInput;
  }>({
    method: "POST",
    url: "/variacoes/:id/entradas",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-estoque",
        resourceType: "estoque",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Estoque"],
      summary: "registerEntry",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      body: object({
        ...op,
        quantidade: { ...integer, minimum: 1, maximum: 1000000 },
      }),
      response: {
        200: movementSchema,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        422: errorResponseSchema[400],
        503: errorResponseSchema[400],
      },
    },
    preHandler: allow("registrar_entrada_estoque"),
    handler: controller.registerEntry,
  });

  fastify.route<{
    Querystring: StockQuery;
    Params: { id: string };
    Body: StockInput;
  }>({
    method: "POST",
    url: "/variacoes/:id/ajustes",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-estoque",
        resourceType: "estoque",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Estoque"],
      summary: "adjustStock",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      body: object({
        ...op,
        quantidade: { ...integer, minimum: -1000000, maximum: 1000000 },
        ...reason,
      }),
      response: {
        200: movementSchema,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        422: errorResponseSchema[400],
        503: errorResponseSchema[400],
      },
    },
    preHandler: allow("ajustar_estoque"),
    handler: controller.adjustStock,
  });

  fastify.route<{ Querystring: StockQuery; Params: {}; Body: never }>({
    method: "GET",
    url: "/movimentacoes",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-estoque",
        resourceType: "estoque",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Estoque"],
      summary: "listMovements",
      security: [{ JWTToken: [] }],
      querystring: query,
      response: {
        200: movementCollection,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        422: errorResponseSchema[400],
        503: errorResponseSchema[400],
      },
    },
    preHandler: allow("consultar_estoque"),
    handler: controller.listMovements,
  });

  fastify.route<{ Querystring: StockQuery; Params: {}; Body: never }>({
    method: "GET",
    url: "/destinatarios",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-estoque",
        resourceType: "estoque",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Estoque"],
      summary: "listRecipients",
      security: [{ JWTToken: [] }],
      querystring: query,
      response: {
        200: recipientCollection,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        422: errorResponseSchema[400],
        503: errorResponseSchema[400],
      },
    },
    preHandler: [allow("consultar_estoque"), allow("consultar_vinculos")],
    handler: controller.listRecipients,
  });

  fastify.route<{
    Querystring: StockQuery;
    Params: { id: string };
    Body: never;
  }>({
    method: "GET",
    url: "/previa/:id",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-estoque",
        resourceType: "estoque",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Estoque"],
      summary: "previewDelivery",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      querystring: query,
      response: {
        200: previewSchema,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        422: errorResponseSchema[400],
        503: errorResponseSchema[400],
      },
    },
    preHandler: [allow("consultar_estoque"), allow("consultar_vinculos")],
    handler: controller.previewDelivery,
  });

  fastify.route<{ Querystring: StockQuery; Params: {}; Body: DeliveryInput }>({
    method: "POST",
    url: "/entregas/kit",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-estoque",
        resourceType: "estoque",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Estoque"],
      summary: "deliverKit",
      security: [{ JWTToken: [] }],
      body: delivery(false),
      response: {
        200: deliverySchema,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        422: errorResponseSchema[400],
        503: errorResponseSchema[400],
      },
    },
    preHandler: [allow("entregar_kit_epi"), allow("consultar_vinculos")],
    handler: controller.deliverKit,
  });

  fastify.route<{ Querystring: StockQuery; Params: {}; Body: DeliveryInput }>({
    method: "POST",
    url: "/entregas/individual",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-estoque",
        resourceType: "estoque",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Estoque"],
      summary: "deliverIndividual",
      security: [{ JWTToken: [] }],
      body: delivery(true),
      response: {
        200: deliverySchema,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        422: errorResponseSchema[400],
        503: errorResponseSchema[400],
      },
    },
    preHandler: [allow("entregar_item_estoque"), allow("consultar_vinculos")],
    handler: controller.deliverIndividual,
  });

  fastify.route<{ Querystring: StockQuery; Params: {}; Body: never }>({
    method: "GET",
    url: "/entregas",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-estoque",
        resourceType: "estoque",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Estoque"],
      summary: "listDeliveries",
      security: [{ JWTToken: [] }],
      querystring: query,
      response: {
        200: deliveryCollection,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        422: errorResponseSchema[400],
        503: errorResponseSchema[400],
      },
    },
    preHandler: allow("consultar_entregas_estoque"),
    handler: controller.listDeliveries,
  });

  fastify.route<{
    Querystring: StockQuery;
    Params: { id: string };
    Body: never;
  }>({
    method: "GET",
    url: "/entregas/:id",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-estoque",
        resourceType: "estoque",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Estoque"],
      summary: "getDelivery",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      querystring: query,
      response: {
        200: detailSchema,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        422: errorResponseSchema[400],
        503: errorResponseSchema[400],
      },
    },
    preHandler: allow("consultar_entregas_estoque"),
    handler: controller.getDelivery,
  });

  fastify.route<{
    Querystring: StockQuery;
    Params: { id: string };
    Body: ReversalInput;
  }>({
    method: "POST",
    url: "/entregas/:id/estornar",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-estoque",
        resourceType: "estoque",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Estoque"],
      summary: "reverseDelivery",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      body: object({ ...op, ...reason }),
      response: {
        200: deliverySchema,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        422: errorResponseSchema[400],
        503: errorResponseSchema[400],
      },
    },
    preHandler: allow("estornar_entrega_estoque"),
    handler: controller.reverseDelivery,
  });
};
