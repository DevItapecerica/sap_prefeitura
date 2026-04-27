import { FastifyPluginAsync, FastifyRequest } from "fastify";
import errorResponseSchema from "../../../../core/shared/schema/errorSchema.js";
import UserController from "../controller/user.controller.js";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { authorizationFactory } from "../../../acess-controll/factory/makeAuthorization.js";

const userRouter: FastifyPluginAsync = async (fastify, options) => {
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  fastify.addHook("preHandler", async (request: FastifyRequest) => {
    const verifyAuthorization = authorizationFactory(request.log);
    await verifyAuthorization.authorize(
      Number(request.user.id),
      1,
      request.method,
    );
  });

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

  // === GET ===
  fastify.route({
    method: "GET",
    url: "/",
    schema: {
      tags: ["Users"],
      security: [{ JWTToken: [] }],
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
            ok: { type: "boolean", example: true },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: UserController.getAllByQuery,
  });

  fastify.route({
    method: "GET",
    url: "/:id",
    schema: {
      tags: ["Users"],
      security: [{ JWTToken: [] }],
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
              example: "Usuário selecionado com sucesso",
            },
            user: userResponse,
            ok: { type: "boolean", example: true },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: UserController.getOne,
  });

  // === POST ===
  fastify.route({
    method: "POST",
    url: "/",
    schema: {
      tags: ["Users"],
      security: [{ JWTToken: [] }],
      description: "Crie um usuário",
      summary: "Crie um usuário com base nos parâmetros passados via body.user",
      body: {
        type: "object",
        required: ["user"],
        properties: {
          user: userRequired,
        },
      },
      response: {
        201: {
          description: "Requisição bem sucedida",
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Usuário criado com sucesso",
            },
            user: userResponse,
            ok: { type: "boolean", example: true },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: UserController.cadastrar,
  });

  // === DELETE ===
  fastify.route({
    method: "DELETE",
    url: "/:id",
    schema: {
      tags: ["Users"],
      security: [{ JWTToken: [] }],
      description: "Delete um usuário",
      summary: "Delete um usuário",
      response: {
        200: {
          description: "Requisição bem sucedida",
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Usuário deletado com sucesso",
            },
            id: { type: "integer", example: 1 },
            ok: { type: "boolean", example: true },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: UserController.delete,
  });

  // === PUT ===
  fastify.route({
    method: "PUT",
    url: "/:id",
    schema: {
      tags: ["Users"],
      security: [{ JWTToken: [] }],
      description: "Atualize um usuário",
      summary: "Crie um usuário com base nos parâmetros passados via body.user",
      body: {
        type: "object",
        required: ["user"],
        properties: {
          user: userRequired,
        },
      },
      response: {
        200: {
          description: "Requisição bem sucedida",
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Usuário atualizado com sucesso",
            },
            user: userResponse,
            ok: { type: "boolean", example: true },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: UserController.update,
  });

  fastify.route({
    method: "PUT",
    url: "/alter_password",
    schema: {
      tags: ["Users"],
      security: [{ JWTToken: [] }],
      description: "Atualize uma senha do usuário",
      summary: "Atualize uma senha do usuário",
      body: {
        type: "object",
        required: ["old_password", "new_password"],
        properties: {
          old_password: { type: "string" },
          new_password: { type: "string" },
        },
      },
      response: {
        200: {
          description: "Requisição bem sucedida",
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Senha atualizada com sucesso",
            },
            ok: { type: "boolean", example: true },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: UserController.alterPassword,
  });
};

export default userRouter;
