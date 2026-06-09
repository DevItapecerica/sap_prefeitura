// import { authUser, login } from "../../controller/authUser.js";
// import LoginSchema from "../../schema/loginSchema.js";

import { FastifyPluginAsync } from "fastify";
import authController from "./auth.controller.js";
import errorResponseSchema from "../../core/schema/errorSchema.js";
import AuthMiddleware from "./auth.middleware.js";

const routes: FastifyPluginAsync = async (fastify) => {
  // Login route
  fastify.route({
    method: "POST",
    url: "/login",
    schema: {
      description: "Verificação de usuário",
      tags: ["Auth"],
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
          },
          password: {
            type: "string",
          },
        },
      },
      response: {
        200: {
          description: "Verificação bem sucedida",
          type: "object",
          properties: {
            message: { type: "string", example: "Login bem sucedido" },
            token: { type: "string", example: "token" },
            ok: { type: "boolean", example: true },
            user: { type: "object", properties: {
              id: { type: "number", example: 1 },
              name: { type: "string", example: "admin" },
              setor_id: { type: "string", example: "admin" },
              role_id: { type: "string", example: "admin" },
            } },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: authController.login,
  });

  fastify.route({
    method: "GET",
    url: "/auth",
    preHandler: AuthMiddleware.verifyJWT,
    schema: {
      description: "Verificação de usuário",
      tags: ["Auth"],
      response: {
        200: {
          description: "Verificação bem sucedida",
          type: "object",
          properties: {
            message: { type: "string", example: "Login bem sucedido" },
            user: { type: "object", properties: {
              id: { type: "number", example: 1 },
              name: { type: "string", example: "admin" },
              setor_id: { type: "string", example: "admin" },
              role_id: { type: "string", example: "admin" },
            } },
            ok: { type: "boolean", example: true },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: authController.authUser,
  });

  fastify.route({
    method: "POST",
    url: "/refresh",
    schema: {
      description: "Renova a sessão usando refresh token HttpOnly",
      tags: ["Auth"],
      response: {
        200: {
          description: "Sessão renovada",
          type: "object",
          properties: {
            message: { type: "string", example: "Sessão renovada" },
            token: { type: "string", example: "token" },
            ok: { type: "boolean", example: true },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: authController.refresh,
  });

  fastify.route({
    method: "POST",
    url: "/logout",
    schema: {
      description: "Revoga a sessão atual",
      tags: ["Auth"],
      response: {
        200: {
          description: "Logout realizado",
          type: "object",
          properties: {
            ok: { type: "boolean", example: true },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: authController.logout,
  });
};

export default routes;
