import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { CarterinhasController } from "../controller/carterinhas.controller.js";
import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { authorizationFactory } from "../../../acess-controll/factory/makeAuthorization.js";

export const CarterinhasRouter: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  fastify.addHook("preHandler", async (request: FastifyRequest) => {
    const verifyAuthorization = authorizationFactory(request.log);
    await verifyAuthorization.authorize(
      Number(request.user.id),
      12,
      request.method,
    );
  });

  const publicCarterihaSchema = {
    type: "object",
    properties: {
      uuid: { type: "string", example: "uuid" },
      emissao: { type: "string", format: "date" },
      validade: { type: "string", format: "date" },
      setor_uuid: {
        anyOf: [{ type: "string" }, { type: "number" }],
        example: "uuid",
      },
      atividade_uuid: {
        anyOf: [{ type: "string" }, { type: "number" }, { type: "null" }],
        example: "uuid",
      },
      municipe_uuid: {
        anyOf: [{ type: "string" }, { type: "number" }],
        example: "uuid",
      },
      createdAt: { type: "string", example: "2023-01-01T00:00:00.000Z" },
      updatedAt: { type: "string", example: "2023-01-01T00:00:00.000Z" },
      author: { type: "string", example: "uuid" },
    },
  };

  const requiredCarterihaSchema = {
    type: "object",
    required: ["setor_uuid", "municipe_uuid"],
    properties: {
      setor_uuid: { anyOf: [{ type: "string" }, { type: "number" }] },
      atividade_uuid: {
        anyOf: [{ type: "string" }, { type: "number" }, { type: "null" }],
      },
      municipe_uuid: { anyOf: [{ type: "string" }, { type: "number" }] },
    },
  };

  fastify.route({
    method: "GET",
    url: "/",
    schema: {
      tags: ["Carterinhas"],
      security: [{ JWTToken: [] }],
      querystring: {
        type: "object",
        properties: {
          setor: { type: "string" },
          servico: { type: "string" },
          limit: { type: "number" },
          page: { type: "number" },
          order: { type: "string" },
        },
      },
      description:
        "Pegue todas as carterinhas, os dados estarão mascarados e poderão ser consultados por uuid, setor servico",
      summary: "Get all carterinhas",
      response: {
        200: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Carterinhas geted successfully",
            },
            data: {
              type: "array",
              items: publicCarterihaSchema,
            },
            okay: { type: "boolean", example: true },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: CarterinhasController.getCarterinhas,
  });

  fastify.route({
    method: "GET",
    url: "/:uuid",
    schema: {
      tags: ["Carterinhas"],
      security: [{ JWTToken: [] }],
      params: {
        type: "object",
        properties: {
          uuid: { type: "string" },
        },
      },
      description: "Pegue uma carterinha pelo uuid",
      summary: "Get all carterinhas",
      response: {
        200: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Carterinha geted successfully",
            },
            data: publicCarterihaSchema,
            okay: { type: "boolean", example: true },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: CarterinhasController.getOneCarterinha,
  });

  fastify.route({
    method: "POST",
    url: "/",
    schema: {
      tags: ["Carterinhas"],
      security: [{ JWTToken: [] }],
      description:
        "Crie uma nova carterinhas, o uuid será gerado automaticamente, assim como a validade (estipulada para dois anos), e a emissão (data atual)",
      summary: "Post new carterinha",
      body: requiredCarterihaSchema,
      response: {
        201: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Carterinhas posted successfully",
            },
            data: publicCarterihaSchema,
            okay: { type: "boolean", example: true },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: CarterinhasController.postCarterinha,
  });
};
