import errorSchema from "./errorSchema.js";

const alterPassSchema = {
  description: "Verificação de usuário",
  tags: ["Auth"],
  security: [{ APIKey: [] }],
  body: {
    type: "object",
    required: ["password", "new_password"],
    properties: {
      password: {
        type: "string",
      },
      new_password: {
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
        ok: { type: "boolean", example: true },
        api: { type: "string", example: "auth" },
        validation: { type: "boolean", example: true },
      },
    },
    ...errorSchema,
  },
};

export default alterPassSchema;
