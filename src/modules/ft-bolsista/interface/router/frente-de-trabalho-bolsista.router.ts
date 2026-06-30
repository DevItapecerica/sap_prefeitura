import { FastifyPluginAsync, FastifyRequest } from "fastify";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { authorizationFactory } from "../../../acess-controll/factory/makeAuthorization.js";
import { FrenteTrabalhoBolsistaController } from "../controller/frente-de-trabalho-bolsista.controller.js";
import errorResponseSchema from "../../../../core/schema/errorSchema.js";

export const FrenteTrabalhoBolsistaRouter: FastifyPluginAsync = async (
  fastify,
) => {
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  fastify.addHook("preHandler", async (request: FastifyRequest) => {
    const verifyAuthorization = authorizationFactory(request.log);
    await verifyAuthorization.authorize(
      Number(request.user.id),
      6,
      request.method,
    );
  });

  const tag = ["Frente de Trabalho - Bolsista"];
  const security = [{ JWTToken: [] }];
  const uuidParam = {
    type: "object",
    required: ["id"],
    properties: { id: { type: "string", format: "uuid" } },
  };
  const paymentInfoSchema = {
    type: "object",
    additionalProperties: true,
    required: ["bco", "pagador_id", "ag", "dig_ag", "conta", "dig_conta"],
    properties: {
      id: { type: "string", format: "uuid" },
      bco: { type: "string" },
      pagador_id: { type: "string", format: "uuid" },
      ag: { type: "string" },
      dig_ag: { type: "string" },
      conta: { type: "string" },
      dig_conta: { type: "string" },
    },
  };
  const bolsistaSchema = {
    type: "object",
    additionalProperties: true,
    properties: {
      id: { type: "string", format: "uuid" },
      nome: { type: "string" },
      cpf: { type: "string" },
      telefone: { type: "string" },
      local: { type: "string" },
      status: { type: "string", enum: ["ativo", "inativo", "pendente"] },
      cep: { type: "string" },
      numero: { type: "string" },
      logradouro: { type: "string" },
      bairro: { type: "string" },
      cidade: { type: "string" },
      uf: { type: "string" },
      payment_info: paymentInfoSchema,
      createdAt: { type: "string" },
      updatedAt: { type: "string" },
    },
  };
  const bolsistaBodySchema = {
    type: "object",
    required: ["bolsista"],
    properties: {
      bolsista: {
        type: "object",
        additionalProperties: true,
        required: [
          "nome",
          "cpf",
          "local",
          "cep",
          "numero",
          "logradouro",
          "bairro",
          "cidade",
          "uf",
          "payment_info",
        ],
        properties: {
          nome: { type: "string" },
          cpf: { type: "string" },
          telefone: { type: "string" },
          local: { type: "string" },
          cep: { type: "string" },
          numero: { type: "string" },
          logradouro: { type: "string" },
          bairro: { type: "string" },
          cidade: { type: "string" },
          uf: { type: "string" },
          payment_info: paymentInfoSchema,
        },
      },
    },
  };
  const faltaSchema = {
    type: "object",
    additionalProperties: true,
    properties: {
      id: { type: "string", format: "uuid" },
      bolsista_id: { type: "string", format: "uuid" },
      edital_id: { type: "string", format: "uuid" },
      data_falta: { type: "string", format: "date" },
      observacao: { type: "string" },
      edital: {
        type: "object",
        additionalProperties: true,
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
        },
      },
    },
  };

  fastify.route({
    method: "GET",
    url: "/",
    schema: {
      tags: tag,
      security,
      summary: "Listar bolsistas",
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
            ok: { type: "boolean" },
            count: { type: "number" },
            bolsista: { type: "array", items: bolsistaSchema },
            pagador: {
              type: "array",
              items: { type: "object", additionalProperties: true },
            },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: FrenteTrabalhoBolsistaController.getBolsistas,
  });

  fastify.route({
    method: "POST",
    url: "/",
    schema: {
      tags: tag,
      security,
      summary: "Criar bolsista",
      body: bolsistaBodySchema,
      response: {
        200: {
          type: "object",
          additionalProperties: true,
          properties: {
            ...bolsistaSchema.properties,
            ok: { type: "boolean" },
            message: { type: "string" },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: FrenteTrabalhoBolsistaController.createBolsista,
  });

  fastify.route({
    method: "GET",
    url: "/vinculo-candidates",
    schema: {
      tags: tag,
      security,
      summary: "Listar bolsistas elegiveis para vinculo",
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
            ok: { type: "boolean" },
            count: { type: "number" },
            bolsistas: { type: "array", items: bolsistaSchema },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: FrenteTrabalhoBolsistaController.getBolsistasParaVinculo,
  });

  fastify.route({
    method: "GET",
    url: "/toexpire",
    schema: {
      tags: tag,
      security,
      summary: "Listar vínculos de bolsistas a vencer",
      response: {
        200: {
          type: "object",
          properties: {
            mesasge: { type: "string" },
            count: { type: "number" },
            bolsistas: {
              type: "array",
              items: { type: "object", additionalProperties: true },
            },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: FrenteTrabalhoBolsistaController.getToExpire,
  });

  fastify.route({
    method: "GET",
    url: "/toExpire",
    schema: { hide: true },
    handler: FrenteTrabalhoBolsistaController.getToExpire,
  });

  fastify.route({
    method: "PUT",
    url: "/prorrogate",
    schema: {
      tags: tag,
      security,
      summary: "Prorrogar vínculos de bolsistas",
      body: {
        type: "object",
        required: ["bolsistas"],
        properties: {
          bolsistas: {
            type: "array",
            items: {
              type: "object",
              required: ["bolsista_id", "edital_id"],
              properties: {
                bolsista_id: { type: "string", format: "uuid" },
                edital_id: { type: "string", format: "uuid" },
              },
            },
          },
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
    handler: FrenteTrabalhoBolsistaController.prorrogate,
  });

  fastify.route({
    method: "GET",
    url: "/edital/:id",
    schema: {
      tags: tag,
      security,
      summary: "Listar bolsistas de um edital",
      params: uuidParam,
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            bolsista: { type: "array", items: bolsistaSchema },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: FrenteTrabalhoBolsistaController.getBolsistaEdital,
  });

  fastify.route({
    method: "GET",
    url: "/:id/historico",
    schema: {
      tags: tag,
      security,
      summary: "Listar historico de vinculos do bolsista",
      params: uuidParam,
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            ok: { type: "boolean" },
            historico: {
              type: "array",
              items: { type: "object", additionalProperties: true },
            },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: FrenteTrabalhoBolsistaController.getHistoricoBolsista,
  });

  fastify.route({
    method: "GET",
    url: "/:id",
    schema: {
      tags: tag,
      security,
      summary: "Buscar bolsista por id",
      params: uuidParam,
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            bolsista: bolsistaSchema,
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: FrenteTrabalhoBolsistaController.getOneBolsista,
  });

  fastify.route({
    method: "PUT",
    url: "/:id",
    schema: {
      tags: tag,
      security,
      summary: "Atualizar bolsista",
      params: uuidParam,
      body: bolsistaBodySchema,
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            bolsista: bolsistaSchema,
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: FrenteTrabalhoBolsistaController.updateBolsista,
  });

  fastify.route({
    method: "DELETE",
    url: "/:id",
    schema: {
      tags: tag,
      security,
      summary: "Remover bolsista",
      params: uuidParam,
      response: {
        200: {
          type: "object",
          properties: { message: { type: "string" } },
        },
        ...errorResponseSchema,
      },
    },
    handler: FrenteTrabalhoBolsistaController.deleteBolsista,
  });

  fastify.route({
    method: "PUT",
    url: "/:bolsista/edital/:edital",
    schema: {
      tags: tag,
      security,
      summary: "Cancelar vínculo do bolsista com edital",
      params: {
        type: "object",
        required: ["bolsista", "edital"],
        properties: {
          bolsista: { type: "string", format: "uuid" },
          edital: { type: "string", format: "uuid" },
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
    handler: FrenteTrabalhoBolsistaController.cancelBolsistaEdital,
  });

  fastify.route({
    method: "POST",
    url: "/:id/faltas",
    schema: {
      tags: tag,
      security,
      summary: "Lançar falta para bolsista",
      params: uuidParam,
      body: {
        type: "object",
        required: ["edital_id", "data_falta"],
        properties: {
          edital_id: { type: "string", format: "uuid" },
          data_falta: { type: "string", format: "date" },
          observacao: { type: "string" },
        },
      },
      response: {
        201: {
          type: "object",
          properties: {
            message: { type: "string" },
            falta: faltaSchema,
            ok: { type: "boolean" },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: FrenteTrabalhoBolsistaController.createFalta,
  });

  fastify.route({
    method: "GET",
    url: "/:id/faltas",
    schema: {
      tags: tag,
      security,
      summary: "Listar faltas do bolsista",
      params: uuidParam,
      querystring: {
        type: "object",
        properties: {
          edital_id: { type: "string", format: "uuid" },
          data_inicio: { type: "string", format: "date" },
          data_fim: { type: "string", format: "date" },
          page: { type: "string" },
          limit: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            faltas: { type: "array", items: faltaSchema },
            count: { type: "number" },
            ok: { type: "boolean" },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: FrenteTrabalhoBolsistaController.listFaltas,
  });

  fastify.route({
    method: "DELETE",
    url: "/:id/faltas/:faltaId",
    schema: {
      tags: tag,
      security,
      summary: "Remover falta do bolsista",
      params: {
        type: "object",
        required: ["id", "faltaId"],
        properties: {
          id: { type: "string", format: "uuid" },
          faltaId: { type: "string", format: "uuid" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            ok: { type: "boolean" },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: FrenteTrabalhoBolsistaController.deleteFalta,
  });
};
