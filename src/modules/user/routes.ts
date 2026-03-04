import { FastifyPluginAsync } from "fastify";
import UserService from "./service.js";
import errorResponseSchema from "../../core/shared/schema/errorSchema.js";
// import auth from "../middleware/authKey.js";
// import * as schema from "../schema/userSchema.js";

const userRouter: FastifyPluginAsync = async (fastify, options) => {
  const userResponse = {
    type: "object",
    properties: {
      id: { type: "integer", example: 1 },
      name: { type: "string", example: "kadoia" },
      email: { type: "string", example: "email@dominio.com.br" },
      ramal: { type: "string", example: "1234" },
      setor_id: { type: "integer", example: 1 },
      role_id: { type: "integer", example: 1 },
      firstLogin: { type: "boolean", example: true },
      createdAt: { type: "string", example: "2023-01-01T00:00:00.000Z" },
      updatedAt: { type: "string", example: "2023-01-01T00:00:00.000Z" },
    },
  };

  const userRequired = {
    type: "object",
    required: ["name", "email", "ramal", "setor_id", "role_id"],
    properties: {
      name: { type: "string" },
      email: { type: "string" },
      ramal: { type: "string" },
      setor_id: { type: "integer" },
      role_id: { type: "integer" },
    },
  };

  fastify.route({
    method: "GET",
    url: "/user",
    // preHandler: [auth],
    schema: {
      tags: ["Users"],
      description:
        "Pegue todos os usuários com base em seus parâmetros passados via queryString. \n Parâmetros: limit, page, search e order. \n Order segue o seguinte formato: coluna:asc ou coluna:desc. (Colunas aceitas: id, name, email, ramal, createdAt)",
      summary: "Pegue todos os usuários",
      querystring: {
        type: "object",
        properties: {
          limit: { type: "integer", default: 10 },
          page: { type: "integer", default: 1 },
          search: { type: "string" },
          order: { type: "string", default: "createdAt:desc" },
        },
      },
      response: {
        200: {
          description: "Requisição bem sucedida",
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Usuários selecionados com sucesso",
            },
            user: {
              type: "array",
              items: userResponse,
            },
            count: { type: "integer", example: 1 },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: UserService.getAllByQuery,
  });

  fastify.route({
    method: "GET",
    url: "/user/:id",
    // preHandler: [auth],
    // schema: schema.getOneUserSchema,
    handler: UserService.getOne,
  });

  fastify.route({
    method: "POST",
    url: "/user",
    // preHandler: [auth],
    schema: {
      tags: ["Users"],
      description: "Crie um usuário",
      summary: "Crie um usuário com base nos parâmetros passados via body.user",
      body: {
        type: "object",
        required: ["user"],
        properties: {
          user: userRequired,
        },
      },
    },
    handler: UserService.cadastrar,
  });

  fastify.route({
    method: "DELETE",
    url: "/user/:id",
    // preHandler: [auth],
    // schema: schema.deleteUserSchema,
    handler: UserService.delete,
  });

  fastify.route({
    method: "PUT",
    url: "/user/:id",
    // preHandler: [auth],
    schema: {
      tags: ["Users"],
      description: "Atualize um usuário",
      summary: "Crie um usuário com base nos parâmetros passados via body.user",
      body: {
        type: "object",
        required: ["user"],
        properties: {
          user: userRequired,
        },
      },
    },
    handler: UserService.update,
  });
};

export default userRouter;
