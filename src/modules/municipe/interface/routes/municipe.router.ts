import { FastifyPluginAsync, FastifyRequest } from "fastify";
import municipeController from "../controller/municipe.controller.js";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { authorizationFactory } from "../../../acess-controll/factories/makeAuthorization.js";
import AppError from "../../../../core/appError.js";

const MUNICIPE_SERVICE_ID = 9;
const createFields = new Set(["nome", "cpf", "nascimento", "telefone", "rua", "bairro", "cidade", "uf", "cep", "numero", "complemento"]);
const updateFields = new Set(["nascimento", "telefone", "rua", "bairro", "cidade", "uf", "cep", "numero", "complemento"]);

const rejectUnknownBodyFields = (allowed: Set<string>) => async (request: FastifyRequest) => {
  const body = request.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) return;
  const unknown = Object.keys(body).find((key) => !allowed.has(key));
  if (unknown) throw new AppError(`Campo nao permitido: ${unknown}`, 400, "UNKNOWN_FIELD");
};

const MunicipeRouter: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  fastify.addHook("preHandler", async (request: FastifyRequest) => {
    const verifyAuthorization = authorizationFactory(request.log);
    await verifyAuthorization.authorize(
      Number(request.user.id),
      MUNICIPE_SERVICE_ID,
      request.method,
    );
  });

  const municipeSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
      uuid: { type: "string", format: "uuid" },
      nome: { type: "string", maxLength: 255 },
      cpf: { type: "string", pattern: "^\\*{8}[0-9]{3}$" },
      nascimento: { type: "number", nullable: true },
      cidade: { type: "string", maxLength: 255 },
      uf: { type: "string", pattern: "^[A-Z]{2}$" },
      author: { type: "string" },
      createdAt: { type: "string" },
      updatedAt: { type: "string" },
    },
  };

  const municipeRequiredSchema = {
    type: "object",
    required: [
      "nome",
      "cpf",
      "nascimento",
      "rua",
      "bairro",
      "cidade",
      "uf",
      "cep",
      "numero",
    ],
    additionalProperties: false,
    properties: {
      nome: { type: "string", minLength: 2, maxLength: 255 },
      cpf: { type: "string", pattern: "^(?:[0-9]{11}|[0-9]{3}\\.[0-9]{3}\\.[0-9]{3}-[0-9]{2})$" },
      nascimento: { type: "string", format: "date" },
      telefone: { type: ["string", "null"], maxLength: 20 },
      rua: { type: "string", minLength: 1, maxLength: 255 },
      bairro: { type: "string", minLength: 1, maxLength: 255 },
      cidade: { type: "string", minLength: 1, maxLength: 255 },
      uf: { type: "string", pattern: "^[A-Za-z]{2}$" },
      cep: { type: "string", pattern: "^(?:[0-9]{8}|[0-9]{5}-[0-9]{3})$" },
      numero: { type: "string", minLength: 1, maxLength: 50 },
      complemento: { type: ["string", "null"], maxLength: 255 },
    },
  };
  
  const municipeUpdateSchema = {
    type: "object",
    additionalProperties: false,
    minProperties: 1,
    properties: {
      nascimento: { type: "string", format: "date" },
      telefone: { type: ["string", "null"], maxLength: 20 },
      rua: { type: "string", minLength: 1, maxLength: 255 },
      bairro: { type: "string", minLength: 1, maxLength: 255 },
      cidade: { type: "string", minLength: 1, maxLength: 255 },
      uf: { type: "string", pattern: "^[A-Za-z]{2}$" },
      cep: { type: "string", pattern: "^(?:[0-9]{8}|[0-9]{5}-[0-9]{3})$" },
      numero: { type: "string", minLength: 1, maxLength: 50 },
      complemento: { type: ["string", "null"], maxLength: 255 },
    },
  }

  fastify.route({
    method: "GET",
    url: "/",
    config: { audit: { failureAction: "LIST", module: "municipe", resourceType: "municipe" } },
    schema: {
      tags: ["Municipes"],
      security: [{ JWTToken: [] }],
      querystring: {
        type: "object",
        additionalProperties: false,
        properties: {
          search: { type: "string", maxLength: 255 },
          order: { type: "string", enum: ["uuid:asc", "uuid:desc", "nome:asc", "nome:desc", "createdAt:asc", "createdAt:desc"] },
          page: { type: "integer", minimum: 0 },
          limit: { type: "integer", minimum: 1, maximum: 100 },
        },
      },
      description:
        "Pegue todos os municipes, os dados estarão mascarados e poderão ser consultados por nome (parcial), cpf (exato) e cep (exato), a ordenação pode ser feita por data de cadastro e a paginação pode ser feita de 10 em 10 ou conforme definido em limit",
      summary: "Get all municipes",
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string", example: "OK" },
            data: { type: "array", items: municipeSchema },
            count: { type: "number" },
            ok: { type: "boolean", example: true },
          },
        },
      },
    },
    handler: municipeController.getMunicipe,
  });

  fastify.route({
    method: "GET",
    url: "/:uuid",
    config: { audit: { failureAction: "VIEW", module: "municipe", resourceType: "municipe", resourceIdParam: "uuid" } },
    schema: {
      tags: ["Municipes"],
      security: [{ JWTToken: [] }],
      params: {
        type: "object",
        required: ["uuid"],
        properties: {
          uuid: { type: "string", format: "uuid" },
        },
      },
      description: "Pegue u municipes por id, os dados estarão mascarados",
      summary: "Get one municipes",
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string", example: "OK" },
            data: municipeSchema,
            ok: { type: "boolean", example: true },
          },
        },
      },
    },
    handler: municipeController.getMunicipeById,
  });

  fastify.route({
    method: "POST",
    url: "/",
    preValidation: rejectUnknownBodyFields(createFields),
    config: { audit: { failureAction: "CREATE", module: "municipe", resourceType: "municipe" } },
    schema: {
      tags: ["Municipes"],
      security: [{ JWTToken: [] }],
      description:
        "Crie um municipe, os dados estarão mascarados quando retornados",
      summary: "Post municipes",
      body: municipeRequiredSchema,
      response: {
        201: {
          type: "object",
          properties: {
            message: { type: "string", example: "OK" },
            data: municipeSchema,
            ok: { type: "boolean", example: true },
          },
        },
      },
    },
    handler: municipeController.postMunicipe,
  });

  fastify.route({
    method: "PUT",
    url: "/:uuid",
    preValidation: rejectUnknownBodyFields(updateFields),
    config: { audit: { failureAction: "UPDATE", module: "municipe", resourceType: "municipe", resourceIdParam: "uuid" } },
    schema: {
      tags: ["Municipes"],
      security: [{ JWTToken: [] }],
      description:
        "atualize um municipe, os dados estarão mascarados quando retornados, cpf e nome não podem ser alterados",
      summary: "Update municipes",
      params: {
        type: "object",
        required: ["uuid"],
        properties: {
          uuid: { type: "string", format: "uuid" },
        },
      },
      body: municipeUpdateSchema,
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string", example: "OK" },
            data: municipeSchema,
            ok: { type: "boolean", example: true },
          },
        },
      },
    },
    handler: municipeController.updateMunicipe,
  });
};

export default MunicipeRouter;
