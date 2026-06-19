import { FastifyPluginAsync, FastifyRequest } from "fastify";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { authorizationFactory } from "../../../acess-controll/factory/makeAuthorization.js";
import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import modalidadeFactory from "../../factories/modalidade.factory.js";
import ModalidadeController from "../controller/modalidade.controller.js";

const ESPORTE_SERVICE_ID = 10;

const modalidadeSchema = {
  type: "object",
  properties: {
    uuid: { type: "string", example: "uuid" },
    nome: { type: "string", example: "Futebol" },
    createdAt: { type: "string", example: "2026-06-15T00:00:00.000Z" },
    updatedAt: { type: "string", example: "2026-06-15T00:00:00.000Z" },
    deletedAt: { anyOf: [{ type: "string" }, { type: "null" }] },
  },
};

export const ModalidadeRouter: FastifyPluginAsync = async (fastify) => {
  const modalidadeService = modalidadeFactory(fastify.log);
  const modalidadeController = new ModalidadeController(modalidadeService);

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
    url: "/modalidades",
    schema: {
      tags: ["Esporte"],
      security: [{ JWTToken: [] }],
      querystring: {
        type: "object",
        properties: {
          search: { type: "string" },
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
            data: { type: "array", items: modalidadeSchema },
            count: { type: "number" },
            ok: { type: "boolean" },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: modalidadeController.findAll,
  });

  fastify.route({
    method: "GET",
    url: "/modalidades/:uuid",
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
            data: modalidadeSchema,
            ok: { type: "boolean" },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: modalidadeController.findOne,
  });

  fastify.route({
    method: "POST",
    url: "/modalidades",
    schema: {
      tags: ["Esporte"],
      security: [{ JWTToken: [] }],
      body: {
        type: "object",
        required: ["nome"],
        properties: {
          nome: { type: "string", minLength: 1 },
        },
      },
      response: {
        201: {
          type: "object",
          properties: {
            message: { type: "string" },
            data: modalidadeSchema,
            ok: { type: "boolean" },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: modalidadeController.create,
  });

  fastify.route({
    method: "PUT",
    url: "/modalidades/:uuid",
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
          nome: { type: "string", minLength: 1 },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            data: modalidadeSchema,
            ok: { type: "boolean" },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: modalidadeController.update,
  });

  fastify.route({
    method: "DELETE",
    url: "/modalidades/:uuid",
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
    handler: modalidadeController.delete,
  });
};
