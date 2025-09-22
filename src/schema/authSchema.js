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
        user: {
          type: "object",
          properties: {
            id: { type: "number", example: 1 },
            name: { type: "string", example: "admin" },
            mail: { type: "string", example: "admin" },
            ramal: { type: "string", example: "admin" },
            setor: { type: "string", example: "admin" },
            role: { type: "string", example: "admin" },
            ip: { type: "string", example: "192.168.1.1" },
          },
        },
      },
    },
    ...errorSchema,
  },
};

export default authSchema;
