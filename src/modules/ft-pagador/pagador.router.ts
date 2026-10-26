import { FastifyPluginAsync, FastifyRequest } from "fastify";
import errorResponseSchema from "../../core/schema/errorSchema.js";
import AuthMiddleware from "../auth/auth.middleware.js";
import { requirePermission } from "../acess-controll/interface/require-permission.js";
import type { PagadorController as PagadorControllerType } from "./pagador.controller.js";

const resource = {
  type: "object",
  additionalProperties: false,
  properties: {
    uuid: { type: "string", format: "uuid" },
    nome: { type: "string" },
    quantidade: { type: "integer" },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
    deletedAt: { anyOf: [{ type: "string" }, { type: "null" }] },
  },
};
const id = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "string", format: "uuid" } },
};
const body = {
  type: "object",
  additionalProperties: false,
  required: ["pagador"],
  properties: {
    pagador: {
      type: "object",
      additionalProperties: false,
      required: ["nome", "quantidade"],
      properties: {
        nome: { type: "string", minLength: 1, pattern: "\\S" },
        quantidade: { type: "integer", minimum: 0 },
      },
    },
  },
};
const common = {
  tags: ["PEEAD - Pagadores"],
  security: [{ JWTToken: [] }],
};
const capacityResource = {
  type: "object",
  additionalProperties: false,
  required: ["uuid", "nome", "quantidade", "ativos", "disponiveis"],
  properties: {
    uuid: { type: "string", format: "uuid" },
    nome: { type: "string" },
    quantidade: { type: "integer" },
    ativos: { type: "integer" },
    disponiveis: { type: "integer" },
  },
};

export const PagadorRouter: FastifyPluginAsync<{controller?: typeof PagadorControllerType}> = async (fastify, options) => {
  const PagadorController = options.controller ?? (await import("./pagador.controller.js")).PagadorController;
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  const allow = requirePermission("ft");

  fastify.route({
    method: "GET",
    url: "/",
    config: {
      audit: {
        failureAction: "LIST",
        module: "ft-pagador",
        resourceType: "pagador",
      },
    },
    schema: {
      ...common,
      querystring: {
        type: "object",
        properties: {
          page: { type: "string" },
          limit: { type: "string" },
          search: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            pagadores: { type: "array", items: resource },
            count: { type: "integer" },
          },
        },
        ...errorResponseSchema,
      },
    },
    preHandler: allow("consultar_pagador"),
    handler: PagadorController.list,
  });
  fastify.route({
    method: "GET",
    url: "/capacidade/:editalId",
    config: {
      audit: {
        failureAction: "LIST",
        module: "ft-pagador",
        resourceType: "pagador_capacidade",
        resourceIdParam: "editalId",
      },
    },
    schema: {
      ...common,
      params: {
        type: "object",
        required: ["editalId"],
        properties: { editalId: { type: "string", format: "uuid" } },
      },
      response: {
        200: {
          type: "object",
          required: ["pagadores"],
          properties: { pagadores: { type: "array", items: capacityResource } },
        },
        ...errorResponseSchema,
      },
    },
    preHandler: allow("consultar_pagador"),
    handler: PagadorController.capacity,
  });
  fastify.route({
    method: "GET",
    url: "/:id",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-pagador",
        resourceType: "pagador",
        resourceIdParam: "id",
      },
    },
    schema: {
      ...common,
      params: id,
      response: {
        200: { type: "object", properties: { pagador: resource } },
        ...errorResponseSchema,
      },
    },
    preHandler: allow("consultar_pagador"),
    handler: PagadorController.get,
  });
  fastify.route({
    method: "POST",
    url: "/",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-pagador",
        resourceType: "pagador",
      },
    },
    schema: {
      ...common,
      body,
      response: {
        201: { type: "object", properties: { pagador: resource } },
        ...errorResponseSchema,
      },
    },
    preHandler: allow("cadastrar_pagador"),
    handler: PagadorController.create,
  });
  fastify.route({
    method: "PUT",
    url: "/:id",
    config: {
      audit: {
        failureAction: "UPDATE",
        module: "ft-pagador",
        resourceType: "pagador",
        resourceIdParam: "id",
      },
    },
    schema: {
      ...common,
      params: id,
      body,
      response: {
        200: { type: "object", properties: { pagador: resource } },
        ...errorResponseSchema,
      },
    },
    preHandler: allow("editar_pagador"),
    handler: PagadorController.update,
  });
  fastify.route({
    method: "DELETE",
    url: "/:id",
    config: {
      audit: {
        failureAction: "DELETE",
        module: "ft-pagador",
        resourceType: "pagador",
        resourceIdParam: "id",
      },
    },
    schema: {
      ...common,
      params: id,
      response: { 204: { type: "null" }, ...errorResponseSchema },
    },
    preHandler: allow("excluir_pagador"),
    handler: PagadorController.delete,
  });
};
