// import { authUser, login } from "../../controller/authUser.js";
// import LoginSchema from "../../schema/loginSchema.js";

import { FastifyPluginAsync } from "fastify";
import authController from "./controller.js";
import errorResponseSchema from "../../core/shared/schema/errorSchema.js";

const routes: FastifyPluginAsync = async (fastify, options) => {
  // Login route
  fastify.route({
    method: "POST",
    url: "/login",
    schema: {
      description: "Verificação de usuário",
      tags: ["Auth"],
      security: [{ APIKey: [] }],
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
};

export default routes;
