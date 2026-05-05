import { FastifyPluginAsync } from "fastify";
import { CarterinhasController } from "../controller/carterinhas.controller.js";
import errorResponseSchema from "../../../../core/schema/errorSchema.js";

export const CarterinhasRouter: FastifyPluginAsync = async (fastify) => {
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
    required: ["emissao", "setor_uuid", "municipe_uuid"],
    properties: {
      emissao: { type: "string", format: "date" },
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
          numeroCarterinha: { type: "string" },
          setor: { type: "string" },
          servico: { type: "string" },
          limit: { type: "number" },
          page: { type: "number" },
        },
      },
      description:
        "Pegue todas as carterinhas, os dados estarão mascarados e poderão ser consultados por id, nome, numero da carterinha ou cpf",
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
    method: "POST",
    url: "/",
    schema: {
      tags: ["Carterinhas"],
      security: [{ JWTToken: [] }],
      description: "Crie uma nova carterinhas",
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
