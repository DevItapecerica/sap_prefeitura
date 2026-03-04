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
      name: { type: "string", example: "kadoia" },
      email: { type: "string", example: "email@dominio.com.br" },
      ramal: { type: "string", example: "1234" },
      setor_id: { type: "integer", example: 1 },
      role_id: { type: "integer", example: 1 },
    },
  };

  fastify.route({
    method: "GET",
    url: "/user",
    // preHandler: [auth],
    schema: {
      tags: ["Users"],
      security: [{ APIKey: [] }],
      description: "Pegue todos os usuários com base em seus parâmetros passados via queryString. \n Parâmetros: limit, page, search e order. \n Order segue o seguinte formato: coluna:asc ou coluna:desc. (Colunas aceitas: id, name, email, ramal, createdAt)",
      summary: "Pegue todos os usuários",
      response: {
        200: {
          description: "Requisição bem sucedida",
          type: "object",
          properties: {
            users: {
              type: "array",
              items: userResponse,
            },
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

  // fastify.route({
  //   method: "POST",
  //   url: "/user",
  //   preHandler: [auth],
  //   schema: schema.postUserSchema,
  //   handler: User.cadastrarUser,
  // });

  fastify.route({
    method: "DELETE",
    url: "/user/:id",
    // preHandler: [auth],
    // schema: schema.deleteUserSchema,
    handler: UserService.delete,
  });

  // fastify.route({
  //   method: "PUT",
  //   url: "/user/:id",
  //   preHandler: [auth],
  //   schema: schema.updateUserSchema,
  //   handler: User.atualizarUser,
  // });

  // fastify.route({
  //   method: "DELETE",
  //   url: "/user/setor/:id",
  //   preHandler: [auth],
  //   schema: schema.deleteUserSchema,
  //   handler: User.deletarUserSetor,
  // });
};

export default userRouter;
