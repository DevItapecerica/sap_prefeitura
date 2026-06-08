import { FastifyPluginAsync, FastifyRequest } from "fastify";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import RolesController from "../controller/roles.controller.js";
import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import { authorizationFactory } from "../../../acess-controll/factory/makeAuthorization.js";

const rolesRouter: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  fastify.addHook("preHandler", async (request: FastifyRequest) => {
    const verifyAuthorization = authorizationFactory(request.log);
    await verifyAuthorization.authorize(
      Number(request.user.id),
      4,
      request.method,
    );
  });

  const roleResponse = {
    type: "object",
    properties: {
      id: { type: "integer", example: 1 },
      name: { type: "string", example: "kadoia" },
    },
  };

  const roleRequired = {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string" },
    },
  };

  fastify.route({
    method: "POST",
    url: "/",
    schema: {
      security: [{ JWTToken: [] }],
      tags: ["Roles"],
      description:
        "Crie uma nova role, mesmo que já exista com o mesmo nome, ele não irá retornar um erro.",
      summary: "crie uma nova role",
      body: {
        type: "object",
        required: ["role"],
        properties: {
          role: roleRequired,
        },
      },
      response: {
        201: {
          type: "object",
          properties: {
            message: { type: "string" },
            ok: { type: "boolean" },
            role: roleResponse,
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: RolesController.createRole,
  });

  fastify.route({
    method: "GET",
    url: "/",
    schema: {
      security: [{ JWTToken: [] }],
      tags: ["Roles"],
      description:
        "Pegue todas as Roles com base em seus parâmetros passados via queryString. \n Parâmetros: limit, page, search e order. \n Order segue o seguinte formato: coluna:asc ou coluna:desc. (Colunas aceitas: id, name)",
      summary: "Pegue todas as roles",
      querystring: {
        type: "object",
        properties: {
          limit: { type: "integer", default: 10 },
          page: { type: "integer", default: 0 },
          search: { type: "string" },
          order: { type: "string", default: "id:desc" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            ok: { type: "boolean" },
            roles: {
              type: "array",
              items: roleResponse,
            },
            count: { type: "integer" },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: RolesController.getRoles,
  });

  fastify.route({
    method: "GET",
    url: "/:id",
    schema: {
      security: [{ JWTToken: [] }],
      tags: ["Roles"],
      description:
        "Pegue uma Role com base no id passado via Parâmetro. \n Retornará erro se não for encontrado a role",
      summary: "Pegue uma role",
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "integer" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            ok: { type: "boolean" },
            role: roleResponse,
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: RolesController.getRoleById,
  });

  fastify.route({
    method: "PUT",
    url: "/:id",
    schema: {
      security: [{ JWTToken: [] }],
      tags: ["Roles"],
      description:
        "Atualize uma nova role, mesmo que já exista com o mesmo nome, ele não irá retornar um erro.",
      summary: "crie uma nova role",
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "integer" },
        },
      },
      body: {
        type: "object",
        required: ["role"],
        properties: {
          role: roleRequired,
        },
      },
      response: {
        201: {
          type: "object",
          properties: {
            message: { type: "string" },
            ok: { type: "boolean" },
            role: roleResponse,
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: RolesController.updateRole,
  });

  fastify.route({
    method: "DELETE",
    url: "/:id",
    schema: {
      security: [{ JWTToken: [] }],
      tags: ["Roles"],
      description: "Delete uma role, por não ser critico, não tem soft delete.",
      summary: "Delete uma role",
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "integer" },
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
    handler: RolesController.deleteRole,
  });
};

export default rolesRouter;
