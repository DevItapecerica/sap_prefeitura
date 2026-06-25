import { FastifyPluginAsync, FastifyRequest } from "fastify";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { authorizationFactory } from "../../../acess-controll/factory/makeAuthorization.js";
import { FtEditalController } from "../controller/ft-edital.controller.js";
import errorResponseSchema from "../../../../core/schema/errorSchema.js";

export const FtEditalRouter: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  fastify.addHook("preHandler", async (request: FastifyRequest) => {
    const verifyAuthorization = authorizationFactory(request.log);
    await verifyAuthorization.authorize(
      Number(request.user.id),
      6,
      request.method,
    );
  });

  const tag = ["Frente de Trabalho - Edital"];
  const security = [{ JWTToken: [] }];
  const uuidParam = {
    type: "object",
    required: ["id"],
    properties: { id: { type: "string", format: "uuid" } },
  };
  const editalSchema = {
    type: "object",
    additionalProperties: true,
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string" },
      data_publicacao: { type: "string", format: "date-time" },
      data_vencimento: { type: "string", format: "date-time" },
      dia_pagamento: { type: "number" },
      valor_bolsa: { anyOf: [{ type: "number" }, { type: "string" }] },
      status: { type: "string", enum: ["ativo", "inativo"] },
      createdAt: { type: "string" },
      updatedAt: { type: "string" },
    },
  };
  const editalBodySchema = {
    type: "object",
    required: ["edital"],
    properties: {
      edital: {
        type: "object",
        additionalProperties: true,
        required: [
          "name",
          "data_publicacao",
          "data_vencimento",
          "dia_pagamento",
          "valor_bolsa",
        ],
        properties: {
          name: { type: "string" },
          data_publicacao: { type: "string" },
          data_vencimento: { type: "string" },
          dia_pagamento: {
            anyOf: [
              { type: "number", minimum: 1, maximum: 31 },
              { type: "string" },
            ],
          },
          valor_bolsa: {
            anyOf: [{ type: "number", minimum: 0 }, { type: "string" }],
          },
        },
      },
    },
  };
  const bolsistaResumoSchema = {
    type: "object",
    additionalProperties: true,
    properties: {
      id: { type: "string", format: "uuid" },
      nome: { type: "string" },
      cpf: { type: "string" },
      local: { type: "string" },
      status: { type: "string" },
      payment_info: { type: "object", additionalProperties: true },
      bolsistas_edital: {
        type: "array",
        items: { type: "object", additionalProperties: true },
      },
    },
  };

  fastify.route({
    method: "GET",
    url: "/",
    schema: {
      tags: tag,
      security,
      summary: "Listar editais",
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            edital: { type: "array", items: editalSchema },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: FtEditalController.getEdital,
  });

  fastify.route({
    method: "POST",
    url: "/",
    schema: {
      tags: tag,
      security,
      summary: "Criar edital",
      body: editalBodySchema,
      response: {
        201: {
          type: "object",
          properties: {
            message: { type: "string" },
            newEdital: editalSchema,
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: FtEditalController.postEdital,
  });

  fastify.route({
    method: "GET",
    url: "/bolsista",
    schema: {
      tags: tag,
      security,
      summary: "Listar editais com bolsistas",
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            bolsista_edital: {
              type: "array",
              items: { type: "object", additionalProperties: true },
            },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: FtEditalController.getAllEditalWithBolsista,
  });

  fastify.route({
    method: "POST",
    url: "/vincularbolsista/:id",
    schema: {
      tags: tag,
      security,
      summary: "Vincular bolsistas a um edital",
      params: uuidParam,
      body: {
        type: "object",
        required: ["bolsista"],
        properties: {
          bolsista: {
            type: "array",
            items: { type: "string", format: "uuid" },
          },
          data_vinculo: { type: "string" },
        },
      },
      response: {
        201: {
          type: "object",
          properties: { message: { type: "string" } },
        },
        ...errorResponseSchema,
      },
    },
    handler: FtEditalController.vincularBolsista,
  });

  fastify.route({
    method: "GET",
    url: "/:id/bolsista",
    schema: {
      tags: tag,
      security,
      summary: "Listar bolsistas de um edital",
      params: uuidParam,
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
            message: { type: "string" },
            bolsistas: { type: "array", items: bolsistaResumoSchema },
            count: { type: "number" },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: FtEditalController.getEditalWithBolsista,
  });

  fastify.route({
    method: "GET",
    url: "/:id/relatory",
    schema: {
      tags: tag,
      security,
      summary: "Gerar relatório CSV do edital",
      params: uuidParam,
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
    handler: FtEditalController.getRelatory,
  });

  fastify.route({
    method: "GET",
    url: "/:id",
    schema: {
      tags: tag,
      security,
      summary: "Buscar edital por id",
      params: uuidParam,
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            edital: editalSchema,
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: FtEditalController.getEditalById,
  });

  fastify.route({
    method: "PUT",
    url: "/:id",
    schema: {
      tags: tag,
      security,
      summary: "Atualizar edital",
      params: uuidParam,
      body: editalBodySchema,
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            edital: editalSchema,
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: FtEditalController.updateEdital,
  });

  fastify.route({
    method: "DELETE",
    url: "/:id",
    schema: {
      tags: tag,
      security,
      summary: "Remover edital",
      params: uuidParam,
      response: {
        201: {
          type: "object",
          properties: { message: { type: "string" } },
        },
        ...errorResponseSchema,
      },
    },
    handler: FtEditalController.deleteEdital,
  });
};
