import { FastifyPluginAsync, FastifyRequest } from "fastify";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { authorizationFactory } from "../../../acess-controll/factory/makeAuthorization.js";
import atletaFactory from "../../factories/atleta.factory.js";
import AtletaController from "../controller/atleta.controller.js";
import errorResponseSchema from "../../../../core/schema/errorSchema.js";

const ESPORTE_SERVICE_ID = 10;

const atletaSchema = {
  type: "object",
  properties: {
    uuid: { type: "string", example: "uuid" },
    municipe_uuid: { type: "string", example: "uuid" },
    ativo: { type: "boolean", example: true },
    author: { type: "string", example: "1" },
    createdAt: { type: "string", example: "2026-06-02T00:00:00.000Z" },
    updatedAt: { type: "string", example: "2026-06-02T00:00:00.000Z" },
    deletedAt: { anyOf: [{ type: "string" }, { type: "null" }] },
    municipe: { type: "object", additionalProperties: true },
  },
};

const carterinhaSchema = {
  type: "object",
  properties: {
    uuid: { type: "string", example: "uuid" },
    emissao: { type: "string", format: "date" },
    validade: { anyOf: [{ type: "string", format: "date" }, { type: "null" }] },
    origem: { type: "string", example: "esporte" },
    atividade_uuid: {
      anyOf: [{ type: "string" }, { type: "number" }, { type: "null" }],
      example: null,
    },
    municipe_uuid: { type: "string", example: "uuid" },
    author: { type: "string", example: "1" },
    createdAt: { type: "string", example: "2026-06-02T00:00:00.000Z" },
    updatedAt: { type: "string", example: "2026-06-02T00:00:00.000Z" },
    deletedAt: { anyOf: [{ type: "string" }, { type: "null" }] },
  },
};

export const AtletaRouter: FastifyPluginAsync = async (fastify) => {
  const atletaService = atletaFactory(fastify.log);
  const atletaController = new AtletaController(atletaService);

  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  fastify.addHook("preHandler", async (request: FastifyRequest) => {
    const verifyAuthorization = authorizationFactory(request.log);
    await verifyAuthorization.authorize(
      Number(request.user.id),
      ESPORTE_SERVICE_ID,
      request.method,
    );
  });

  fastify.route({
    method: "GET",
    url: "/atletas",
    schema: {
      tags: ["Esporte"],
      security: [{ JWTToken: [] }],
      querystring: {
        type: "object",
        properties: {
          search: { type: "string" },
          ativo: { anyOf: [{ type: "boolean" }, { type: "string" }] },
          municipe_uuid: { type: "string" },
          limit: { type: "number" },
          page: { type: "number" },
          order: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            data: { type: "array", items: atletaSchema },
            count: { type: "number" },
            ok: { type: "boolean" },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: atletaController.findAll,
  });

  fastify.route({
    method: "GET",
    url: "/carteirinhas",
    schema: {
      tags: ["Esporte"],
      security: [{ JWTToken: [] }],
      querystring: {
        type: "object",
        properties: {
          servico: { type: "string" },
          limit: { type: "number" },
          page: { type: "number" },
          order: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            data: { type: "array", items: carterinhaSchema },
            count: { type: "number" },
            ok: { type: "boolean" },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: atletaController.findCarteirinhas,
  });

  fastify.route({
    method: "GET",
    url: "/atletas/:uuid",
    schema: {
      tags: ["Esporte"],
      security: [{ JWTToken: [] }],
      params: {
        type: "object",
        required: ["uuid"],
        properties: { uuid: { type: "string" } },
      },
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            data: atletaSchema,
            ok: { type: "boolean" },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: atletaController.findOne,
  });

  fastify.route({
    method: "GET",
    url: "/atletas/:uuid/carteirinhas",
    schema: {
      tags: ["Esporte"],
      security: [{ JWTToken: [] }],
      params: {
        type: "object",
        required: ["uuid"],
        properties: { uuid: { type: "string" } },
      },
      querystring: {
        type: "object",
        properties: {
          servico: { type: "string" },
          limit: { type: "number" },
          page: { type: "number" },
          order: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            data: { type: "array", items: carterinhaSchema },
            count: { type: "number" },
            ok: { type: "boolean" },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: atletaController.findCarteirinhasByAtleta,
  });

  fastify.route({
    method: "POST",
    url: "/atletas",
    schema: {
      tags: ["Esporte"],
      security: [{ JWTToken: [] }],
      body: {
        type: "object",
        required: ["municipe_uuid"],
        properties: {
          municipe_uuid: { type: "string" },
          ativo: { type: "boolean", default: true },
        },
      },
      response: {
        201: {
          type: "object",
          properties: {
            message: { type: "string" },
            data: atletaSchema,
            ok: { type: "boolean" },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: atletaController.create,
  });

  fastify.route({
    method: "PUT",
    url: "/atletas/:uuid",
    schema: {
      tags: ["Esporte"],
      security: [{ JWTToken: [] }],
      params: {
        type: "object",
        required: ["uuid"],
        properties: { uuid: { type: "string" } },
      },
      body: {
        type: "object",
        properties: {
          ativo: { type: "boolean" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            data: atletaSchema,
            ok: { type: "boolean" },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: atletaController.update,
  });

  fastify.route({
    method: "DELETE",
    url: "/atletas/:uuid",
    schema: {
      tags: ["Esporte"],
      security: [{ JWTToken: [] }],
      params: {
        type: "object",
        required: ["uuid"],
        properties: { uuid: { type: "string" } },
      },
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            data: {
              type: "object",
              properties: { deleted: { type: "boolean" } },
            },
            ok: { type: "boolean" },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: atletaController.delete,
  });

  fastify.route({
    method: "POST",
    url: "/atletas/:uuid/carteirinha",
    schema: {
      tags: ["Esporte"],
      security: [{ JWTToken: [] }],
      params: {
        type: "object",
        required: ["uuid"],
        properties: { uuid: { type: "string" } },
      },
      response: {
        201: {
          type: "object",
          properties: {
            message: { type: "string" },
            data: { type: "object", additionalProperties: true },
            ok: { type: "boolean" },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: atletaController.createCarteirinha,
  });
};
