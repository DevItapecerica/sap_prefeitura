import { FastifyPluginAsync, FastifyRequest } from "fastify";
import municipeController from "../controller/municipe.controller.js";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { authorizationFactory } from "../../../acess-controll/factory/makeAuthorization.js";

const MUNICIPE_SERVICE_ID = 9;

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
      uuid: { type: "number" },
      nome: { type: "string" },
      cpf: { type: "string" },
      nascimento: { type: "string" },
      cidade: { type: "string" },
      uf: { type: "string" },
      author: { type: "number" },
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
      nome: { type: "string" },
      cpf: { type: "string" },
      nascimento: { type: "string" },
      telefone: { type: "string" },
      rua: { type: "string" },
      bairro: { type: "string" },
      cidade: { type: "string" },
      uf: { type: "string" },
      cep: { type: "string" },
      numero: { type: "string" },
      complemento: { type: "string" },
    },
  };
  
  const municipeUpdateSchema = {
    type: "object",
    properties: {
      nascimento: { type: "string" },
      telefone: { type: "string" },
      rua: { type: "string" },
      bairro: { type: "string" },
      cidade: { type: "string" },
      uf: { type: "string" },
      cep: { type: "string" },
      numero: { type: "string" },
      complemento: { type: "string" },
    },
  }

  fastify.route({
    method: "GET",
    url: "/",
    schema: {
      tags: ["Municipes"],
      security: [{ JWTToken: [] }],
      querystring: {
        type: "object",
        properties: {
          search: { type: "string" },
          order: { type: "string" },
          page: { type: "string" },
          limit: { type: "string" },
        },
      },
      description:
        "Pegue todos os municipes, os dados estarão mascarados e poderão ser consultados por nome (parcial), cpf (exato) e cep (exato), a ordenação pode ser feita por data de cadastro e a paginação pode ser feita de 10 em 10 ou conforme definido em limit",
      summary: "Get all municipes",
      response: {
        200: {
          message: { type: "string", example: "OK" },
          ok: { type: "boolean", example: true },
          municipe: municipeSchema,
        },
      },
    },
    handler: municipeController.getMunicipe,
  });

  fastify.route({
    method: "GET",
    url: "/:uuid",
    schema: {
      tags: ["Municipes"],
      security: [{ JWTToken: [] }],
      params: {
        type: "object",
        required: ["uuid"],
        properties: {
          uuid: { type: "string" },
        },
      },
      description: "Pegue u municipes por id, os dados estarão mascarados",
      summary: "Get one municipes",
      response: {
        200: {
          message: { type: "string", example: "OK" },
          ok: { type: "boolean", example: true },
          data: { type: "array", items: municipeSchema },
        },
      },
    },
    handler: municipeController.getMunicipeById,
  });

  fastify.route({
    method: "POST",
    url: "/",
    schema: {
      tags: ["Municipes"],
      security: [{ JWTToken: [] }],
      description:
        "Crie um municipe, os dados estarão mascarados quando retornados",
      summary: "Post municipes",
      body: municipeRequiredSchema,
      response: {
        201: {
          message: { type: "string", example: "OK" },
          ok: { type: "boolean", example: true },
          data: municipeSchema,
        },
      },
    },
    handler: municipeController.postMunicipe,
  });

  fastify.route({
    method: "PUT",
    url: "/:uuid",
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
          uuid: { type: "string" },
        },
      },
      body: municipeUpdateSchema,
      response: {
        201: {
          message: { type: "string", example: "OK" },
          ok: { type: "boolean", example: true },
          data: municipeSchema,
        },
      },
    },
    handler: municipeController.updateMunicipe,
  });
};

export default MunicipeRouter;
