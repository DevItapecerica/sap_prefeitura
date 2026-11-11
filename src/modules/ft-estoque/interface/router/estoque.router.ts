import {
  estoqueViewConfig,
  estoqueMetadata,
  estoqueItemCollectionResponse,
  estoqueCreateConfig,
  estoqueCompleteResponse,
  estoqueItemResponse,
  estoqueUpdateConfig,
  estoqueVariationCollectionResponse,
  estoqueVariationResponse,
  estoqueMovementResponse,
  estoqueMovementCollectionResponse,
  estoqueRecipientCollectionResponse,
  estoquePreviewResponse,
  estoqueDeliveryResponse,
  estoqueDeliveryCollectionResponse,
  estoqueDetailResponse,
} from "../schema/estoque.http.js";
import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { requirePermission } from "../../../acess-controll/interface/require-permission.js";
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

  fastify.route<{
    Querystring: StockQuery;
    Params: Record<string, never>;
    Body: never;
  }>({
    method: "GET",
    url: "/itens",
    config: estoqueViewConfig,
    schema: {
      ...estoqueMetadata,
      summary: "listItems",
      querystring: query,
      response: estoqueItemCollectionResponse,
    },
    preHandler: allow("consultar_estoque"),
    handler: controller.listItems,
  });

  fastify.route<{
    Querystring: StockQuery;
    Params: Record<string, never>;
    Body: CompleteInput;
  }>({
    method: "POST",
    url: "/itens/cadastro-completo",
    config: estoqueCreateConfig,
    schema: {
      ...estoqueMetadata,
      summary: "createComplete",
      body: completeBody,
      response: estoqueCompleteResponse,
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
    config: estoqueViewConfig,
    schema: {
      ...estoqueMetadata,
      summary: "getItem",
      params: object({ id: uuid }),
      querystring: query,
      response: estoqueItemResponse,
    },
    preHandler: allow("consultar_estoque"),
    handler: controller.getItem,
  });

  fastify.route<{
    Querystring: StockQuery;
    Params: Record<string, never>;
    Body: ItemInput;
  }>({
    method: "POST",
    url: "/itens",
    config: estoqueCreateConfig,
    schema: {
      ...estoqueMetadata,
      summary: "createItem",
      body: itemBody,
      response: estoqueItemResponse,
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
    config: estoqueUpdateConfig,
    schema: {
      ...estoqueMetadata,
      summary: "updateItem",
      params: object({ id: uuid }),
      body: itemBody,
      response: estoqueItemResponse,
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
    config: estoqueUpdateConfig,
    schema: {
      ...estoqueMetadata,
      summary: "removeItem",
      params: object({ id: uuid }),
      body: object(op),
      response: estoqueItemResponse,
    },
    preHandler: allow("excluir_item_estoque"),
    handler: controller.removeItem,
  });

  fastify.route<{
    Querystring: StockQuery;
    Params: Record<string, never>;
    Body: never;
  }>({
    method: "GET",
    url: "/variacoes",
    config: estoqueViewConfig,
    schema: {
      ...estoqueMetadata,
      summary: "listVariations",
      querystring: query,
      response: estoqueVariationCollectionResponse,
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
    config: estoqueViewConfig,
    schema: {
      ...estoqueMetadata,
      summary: "listItemVariations",
      params: object({ id: uuid }),
      querystring: query,
      response: estoqueVariationCollectionResponse,
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
    config: estoqueViewConfig,
    schema: {
      ...estoqueMetadata,
      summary: "getVariation",
      params: object({ id: uuid }),
      querystring: query,
      response: estoqueVariationResponse,
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
    config: estoqueCreateConfig,
    schema: {
      ...estoqueMetadata,
      summary: "createVariation",
      params: object({ id: uuid }),
      body: variationBody,
      response: estoqueVariationResponse,
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
    config: estoqueUpdateConfig,
    schema: {
      ...estoqueMetadata,
      summary: "updateVariation",
      params: object({ itemId: uuid, id: uuid }),
      body: variationBody,
      response: estoqueVariationResponse,
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
    config: estoqueUpdateConfig,
    schema: {
      ...estoqueMetadata,
      summary: "removeVariation",
      params: object({ itemId: uuid, id: uuid }),
      body: object(op),
      response: estoqueVariationResponse,
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
    config: estoqueCreateConfig,
    schema: {
      ...estoqueMetadata,
      summary: "registerEntry",
      params: object({ id: uuid }),
      body: object({
        ...op,
        quantidade: { ...integer, minimum: 1, maximum: 1000000 },
      }),
      response: estoqueMovementResponse,
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
    config: estoqueCreateConfig,
    schema: {
      ...estoqueMetadata,
      summary: "adjustStock",
      params: object({ id: uuid }),
      body: object({
        ...op,
        quantidade: { ...integer, minimum: -1000000, maximum: 1000000 },
        ...reason,
      }),
      response: estoqueMovementResponse,
    },
    preHandler: allow("ajustar_estoque"),
    handler: controller.adjustStock,
  });

  fastify.route<{
    Querystring: StockQuery;
    Params: Record<string, never>;
    Body: never;
  }>({
    method: "GET",
    url: "/movimentacoes",
    config: estoqueViewConfig,
    schema: {
      ...estoqueMetadata,
      summary: "listMovements",
      querystring: query,
      response: estoqueMovementCollectionResponse,
    },
    preHandler: allow("consultar_estoque"),
    handler: controller.listMovements,
  });

  fastify.route<{
    Querystring: StockQuery;
    Params: Record<string, never>;
    Body: never;
  }>({
    method: "GET",
    url: "/destinatarios",
    config: estoqueViewConfig,
    schema: {
      ...estoqueMetadata,
      summary: "listRecipients",
      querystring: query,
      response: estoqueRecipientCollectionResponse,
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
    config: estoqueViewConfig,
    schema: {
      ...estoqueMetadata,
      summary: "previewDelivery",
      params: object({ id: uuid }),
      querystring: query,
      response: estoquePreviewResponse,
    },
    preHandler: [allow("consultar_estoque"), allow("consultar_vinculos")],
    handler: controller.previewDelivery,
  });

  fastify.route<{
    Querystring: StockQuery;
    Params: Record<string, never>;
    Body: DeliveryInput;
  }>({
    method: "POST",
    url: "/entregas/kit",
    config: estoqueCreateConfig,
    schema: {
      ...estoqueMetadata,
      summary: "deliverKit",
      body: delivery(false),
      response: estoqueDeliveryResponse,
    },
    preHandler: [allow("entregar_kit_epi"), allow("consultar_vinculos")],
    handler: controller.deliverKit,
  });

  fastify.route<{
    Querystring: StockQuery;
    Params: Record<string, never>;
    Body: DeliveryInput;
  }>({
    method: "POST",
    url: "/entregas/individual",
    config: estoqueCreateConfig,
    schema: {
      ...estoqueMetadata,
      summary: "deliverIndividual",
      body: delivery(true),
      response: estoqueDeliveryResponse,
    },
    preHandler: [allow("entregar_item_estoque"), allow("consultar_vinculos")],
    handler: controller.deliverIndividual,
  });

  fastify.route<{
    Querystring: StockQuery;
    Params: Record<string, never>;
    Body: never;
  }>({
    method: "GET",
    url: "/entregas",
    config: estoqueViewConfig,
    schema: {
      ...estoqueMetadata,
      summary: "listDeliveries",
      querystring: query,
      response: estoqueDeliveryCollectionResponse,
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
    config: estoqueViewConfig,
    schema: {
      ...estoqueMetadata,
      summary: "getDelivery",
      params: object({ id: uuid }),
      querystring: query,
      response: estoqueDetailResponse,
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
    config: estoqueCreateConfig,
    schema: {
      ...estoqueMetadata,
      summary: "reverseDelivery",
      params: object({ id: uuid }),
      body: object({ ...op, ...reason }),
      response: estoqueDeliveryResponse,
    },
    preHandler: allow("estornar_entrega_estoque"),
    handler: controller.reverseDelivery,
  });
};
