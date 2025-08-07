import errorSchema from "./errorSchema.js";

const authSchema = {
  description: "Verificação de usuário",
  tags: ["Auth"],
  security: [{ APIKey: [] }],
  body: {
    type: "object",
    required: ["token"],
    properties: {
      token: {
        type: "string",
      },
    },
  },

  response: {
    200: {
      description: "Verificação bem sucedida",
      type: "object",
      properties: {
        message: { type: "string", example: "Usuário autenticado" },
        scopo: { type: "string", example: "admin" },
        user: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            role: { type: "string", example: "admin" },
          },
        },
      },
    },
    ...errorSchema,
  },
};

export default authSchema;
