import { FastifyPluginAsync, FastifyRequest } from "fastify";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { authorizationFactory } from "../../../acess-controll/factory/makeAuthorization.js";
import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import { FtRelatorioController } from "../controller/ft-relatorio.controller.js";

export const FtRelatorioRouter: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  fastify.addHook("preHandler", async (request: FastifyRequest) => {
    const verifyAuthorization = authorizationFactory(request.log);
    await verifyAuthorization.authorize(
      Number(request.user.id),
      6,
      request.method,
    );
  });

  fastify.route({
    method: "GET",
    url: "/edital/:id",
    schema: {
      tags: ["Frente de Trabalho - Relatorio"],
      security: [{ JWTToken: [] }],
      summary: "Gerar relatorio CSV do edital",
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      querystring: {
        type: "object",
        properties: {
          data_inicio: { type: "string", format: "date" },
          data_fim: { type: "string", format: "date" },
        },
      },
      response: {
        200: {
          type: "string",
          description: "Arquivo CSV",
        },
        ...errorResponseSchema,
      },
    },
    handler: FtRelatorioController.gerarRelatorioEdital,
  });

  fastify.route({
    method: "GET",
    url: "/edital/:id/faltas",
    schema: {
      tags: ["Frente de Trabalho - Relatorio"],
      security: [{ JWTToken: [] }],
      summary: "Gerar relatorio mensal de faltas do edital",
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      querystring: {
        type: "object",
        properties: {
          mes: { type: "string", pattern: "^\\d{4}-(0[1-9]|1[0-2])$" },
        },
      },
      response: {
        200: {
          type: "string",
          description: "Arquivo CSV",
        },
        ...errorResponseSchema,
      },
    },
    handler: FtRelatorioController.gerarRelatorioFaltasEdital,
  });

  fastify.route({
    method: "GET",
    url: "/edital/:id/presenca",
    schema: {
      tags: ["Frente de Trabalho - Relatorio"],
      security: [{ JWTToken: [] }],
      summary: "Gerar lista mensal de presenca do edital",
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      querystring: {
        type: "object",
        properties: {
          mes: { type: "string", pattern: "^\\d{4}-(0[1-9]|1[0-2])$" },
        },
      },
      response: {
        200: {
          type: "string",
          description: "Arquivo CSV",
        },
        ...errorResponseSchema,
      },
    },
    handler: FtRelatorioController.gerarListaPresencaEdital,
  });
};
