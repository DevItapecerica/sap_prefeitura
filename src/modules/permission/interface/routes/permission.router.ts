import { FastifyPluginAsync, FastifyRequest } from "fastify";
import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import PermissionController from "../controller/permission.controller.js";
import { authorizationFactory } from "../../../acess-controll/factory/makeAuthorization.js";

const permissionRouter: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  fastify.addHook("preHandler", async (request: FastifyRequest) => {const verifyAuthorization = authorizationFactory(request.log);
    await verifyAuthorization.authorize(Number(request.user.id), 3, request.method);
   });

  const PermissionSchema = {
    type: "object",
    required: ["read", "write", "edit", "del"],
    properties: {
      read: { type: "boolean" },
      write: { type: "boolean" },
      edit: { type: "boolean" },
      del: { type: "boolean" },
    },
  };

  const permissionResponseSchema = {
    type: "object",
    properties: {
      id: { type: "integer", example: 1 },
      service_id: { type: "integer", example: 1 },
      role_id: { type: "integer", example: 1 },
      read: { type: "boolean", example: true },
      write: { type: "boolean", example: true },
      edit: { type: "boolean", example: true },
      del: { type: "boolean", example: true },
    },
  };

  fastify.route({
    method: "GET",
    url: "/",
    schema: {
      summary: "Retorna todas as Permissões",
      description:
        "Retorna todas as Permissões com base na query de busca, order, limit, page e search, caso nao seja passado retorna 10 e page 0, sem search e com order by id desc, a query de order deve ser passado da seguinte forma: id:desc ou id:asc (campo:ordem)",
      type: "object",
      tags: ["Permission"],
      security: [{ JWTToken: [] }],
      querystring: {
        type: "object",
        properties: {
          page: { type: "number", default: 0 },
          limit: { type: "number", default: 10 },
          search: { type: "string", default: "" },
          order: { type: "string", default: "id:desc" },
        },
      },
      response: {
        200: {
          description: "Verificação bem sucedido",
          type: "object",
          properties: {
            message: { type: "string", example: "Permissões recuperadas com sucesso" },
            permission: {
              type: "array",
              items: permissionResponseSchema,
            },
            count: { type: "number", example: 1 },
            ok: { type: "boolean", example: true },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: PermissionController.getPermissions,
  });

  fastify.route({
    method: "GET",
    url: "/:id",
    schema: {
      summary: "Retorna permission pelo ID",
      description:
        "Retorna uma permissão com base no Id da permissão, caso não seja encontrado retorna um erro 404",
      type: "object",
      tags: ["Permission"],
      security: [{ JWTToken: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "number" },
        },
      },
      response: {
        200: {
          description: "Get bem sucedido",
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Permissão recuperada com sucesso",
            },
            permission: permissionResponseSchema,
            ok: { type: "boolean", example: true },
          },
        },

        ...errorResponseSchema,
      },
    },
    handler: PermissionController.getOnePermission,
  });

  fastify.route({
    method: "PUT",
    url: "/:id",
    schema: {
      summary: "Atualizar uma permissão",
      description:
        "Atualiza uma permissão com base no Id da permissão, caso não seja encontrado retorna um erro 404",
      type: "object",
      tags: ["Permission"],
      security: [{ JWTToken: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "number" },
        },
      },
      body: {
        type: "object",
        required: ["permission"],
        properties: {
          permission: PermissionSchema,
        },
      },
      response: {
        201: {
          description: "Update bem sucedido",
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Serviço atualizado com sucesso",
            },
            permission: permissionResponseSchema,
            ok: { type: "boolean", example: true },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: PermissionController.updatePermission,
  });
};

export default permissionRouter;
