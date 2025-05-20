const errorSchema = require("./errorSchema");
const loginSchema = {
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
      description: "Verificação bem sucedido",
      type: "object",
      properties: {
        message: { type: "string", example: "Login bem sucedido" },
        firstLogin: { type: "boolean", example: true },
        name: { type: "string", example: "João" },
        token: { type: "string", example: "token" },
        ip: { type: "string", example: "192.168.1.1" },
        scopo: { type: "string", example: "admin" },
      },
    },
    ...errorSchema,
  },
};
module.exports = loginSchema;
