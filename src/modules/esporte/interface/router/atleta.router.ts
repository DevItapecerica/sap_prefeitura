import { FastifyPluginAsync, FastifyRequest } from "fastify";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { requirePermission } from "../../../acess-controll/interface/require-permission.js";
import type AtletaControllerType from "../controller/atleta.controller.js";
import errorResponseSchema from "../../../../core/schema/errorSchema.js";

const ESPORTE_SERVICE_ID = 10;

const municipeMaskedSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    uuid: { type: "string", example: "uuid" },
    nome: { type: "string", example: "Maria ***" },
    cpf: { type: "string", example: "********900" },
    nascimento: { type: "number", nullable: true, example: 2000 },
    cidade: { type: "string", example: "Itapecerica da Serra" },
    uf: { type: "string", example: "SP" },
    createdAt: { type: "string", example: "2026-06-02T00:00:00.000Z" },
    updatedAt: { type: "string", example: "2026-06-02T00:00:00.000Z" },
    author: { type: "string", example: "1" },
  },
};

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
    municipe: { ...municipeMaskedSchema, nullable: true },
    modalidades: {
      type: "array",
      items: {
        type: "object",
        properties: {
          uuid: { type: "string", example: "uuid" },
          nome: { type: "string", example: "Futebol" },
          createdAt: { type: "string", example: "2026-06-02T00:00:00.000Z" },
          updatedAt: { type: "string", example: "2026-06-02T00:00:00.000Z" },
          deletedAt: { anyOf: [{ type: "string" }, { type: "null" }] },
        },
      },
    },
  },
};

const carterinhaSchema = {
  type: "object",
  properties: {
    uuid: { type: "string", example: "uuid" },
    emissao: { type: "string", format: "date" },
    validade: { anyOf: [{ type: "string", format: "date" }, { type: "null" }] },
    modalidade: { type: "string", example: "Futebol" },
    observacao: { anyOf: [{ type: "string" }, { type: "null" }] },
    validade_exame: { anyOf: [{ type: "string", format: "date" }, { type: "null" }] },
    municipe_uuid: { type: "string", example: "uuid" },
    author: { type: "string", example: "1" },
    createdAt: { type: "string", example: "2026-06-02T00:00:00.000Z" },
    updatedAt: { type: "string", example: "2026-06-02T00:00:00.000Z" },
    deletedAt: { anyOf: [{ type: "string" }, { type: "null" }] },
  },
};

export const AtletaRouter: FastifyPluginAsync<{controller?: AtletaControllerType}> = async (fastify, options) => {
  const atletaController = options.controller ?? new (await import("../controller/atleta.controller.js")).default((await import("../../factories/atleta.factory.js")).default(fastify.log));

  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  const allow = requirePermission("esporte");


  fastify.route({
    method: "GET",
    url: "/atletas",
    config: { audit: { failureAction: "LIST", module: "esporte", resourceType: "atleta" } },
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
    preHandler: allow("consultar_atleta"),
    handler: atletaController.findAll,
  });

  fastify.route({
    method: "GET",
    url: "/carteirinhas",
    config: { audit: { failureAction: "LIST", module: "esporte", resourceType: "carteirinha_esporte" } },
    schema: {
      tags: ["Esporte"],
      security: [{ JWTToken: [] }],
      querystring: {
        type: "object",
        properties: {
          modalidade: { type: "string" },
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
    preHandler: allow("consultar_carteirinha"),
    handler: atletaController.findCarteirinhas,
  });

  fastify.route({
    method: "GET",
    url: "/atletas/:uuid",
    config: { audit: { failureAction: "VIEW", module: "esporte", resourceType: "atleta", resourceIdParam: "uuid" } },
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
    preHandler: allow("consultar_atleta"),
    handler: atletaController.findOne,
  });

  fastify.route({
    method: "GET",
    url: "/atletas/:uuid/carteirinhas",
    config: { audit: { failureAction: "LIST", module: "esporte", resourceType: "carteirinha_esporte", resourceIdParam: "uuid" } },
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
          modalidade: { type: "string" },
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
    preHandler: allow("consultar_carteirinha"),
    handler: atletaController.findCarteirinhasByAtleta,
  });

  fastify.route({
    method: "GET",
    url: "/carteirinhas/:uuid/pdf",
    config: { audit: { failureAction: "EXPORT", module: "esporte", resourceType: "carteirinha_esporte", resourceIdParam: "uuid" } },
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
          description: "Arquivo PDF da carteirinha esporte",
          content: {
            "application/pdf": {
              schema: {
                type: "string",
                format: "binary",
              },
            },
          },
        },
        ...errorResponseSchema,
      },
    },
    preHandler: allow("gerar_pdf_carteirinha"),
    handler: atletaController.getCarteirinhaPdf,
  });

  fastify.route({
    method: "POST",
    url: "/atletas",
    config: { audit: { failureAction: "CREATE", module: "esporte", resourceType: "atleta" } },
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
    preHandler: allow("cadastrar_atleta"),
    handler: atletaController.create,
  });

  fastify.route({
    method: "PUT",
    url: "/atletas/:uuid",
    config: { audit: { failureAction: "UPDATE", module: "esporte", resourceType: "atleta", resourceIdParam: "uuid" } },
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
    preHandler: allow("editar_atleta"),
    handler: atletaController.update,
  });

  fastify.route({
    method: "DELETE",
    url: "/atletas/:uuid",
    config: { audit: { failureAction: "DELETE", module: "esporte", resourceType: "atleta", resourceIdParam: "uuid" } },
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
    preHandler: allow("excluir_atleta"),
    handler: atletaController.delete,
  });

  fastify.route({
    method: "POST",
    url: "/atletas/:uuid/modalidades",
    config: { audit: { failureAction: "UPDATE", module: "esporte", resourceType: "atleta", resourceIdParam: "uuid" } },
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
        required: ["modalidade_uuid"],
        additionalProperties: false,
        properties: {
          modalidade_uuid: { type: "string" },
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
    preHandler: allow("vincular_modalidade"),
    handler: atletaController.addModalidade,
  });

  fastify.route({
    method: "DELETE",
    url: "/atletas/:uuid/modalidades/:modalidade_uuid",
    config: { audit: { failureAction: "UPDATE", module: "esporte", resourceType: "atleta", resourceIdParam: "uuid" } },
    schema: {
      tags: ["Esporte"],
      security: [{ JWTToken: [] }],
      params: {
        type: "object",
        required: ["uuid", "modalidade_uuid"],
        properties: {
          uuid: { type: "string" },
          modalidade_uuid: { type: "string" },
        },
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
    preHandler: allow("remover_modalidade"),
    handler: atletaController.removeModalidade,
  });

  fastify.route({
    method: "POST",
    url: "/atletas/:uuid/carteirinha",
    config: { audit: { failureAction: "CREATE", module: "esporte", resourceType: "carteirinha_esporte", resourceIdParam: "uuid" } },
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
        required: ["foto"],
        additionalProperties: false,
        properties: {
          observacao: { anyOf: [{ type: "string" }, { type: "null" }] },
          validade_exame: {
            anyOf: [{ type: "string", format: "date" }, { type: "null" }],
          },
          foto: {
            type: "string",
            description: "Data URL base64 da foto da carteirinha",
          },
        },
      },
      response: {
        201: {
          type: "object",
          properties: {
            message: { type: "string" },
            data: carterinhaSchema,
            ok: { type: "boolean" },
          },
        },
        ...errorResponseSchema,
      },
    },
    preHandler: allow("emitir_carteirinha"),
    handler: atletaController.createCarteirinha,
  });
};
