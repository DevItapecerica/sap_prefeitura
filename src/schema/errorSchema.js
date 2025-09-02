const errorResponseSchema = {
  400: {
    description: "Erro no 400",
    type: "object",
    properties: {
      ok: { type: "boolean", example: false },
      api: { type: "string", example: "auth" },
      validation: { type: "boolean", example: false },
      message: { type: "string", example: "Bad Request" },
    },
  },
  401: {
    description: "Token de autenticação inválido",
    type: "object",
    properties: {
      message: { type: "string", example: "Token de autenticação inválido" },
      ok: { type: "boolean", example: false },
      api: { type: "string", example: "auth" },
      validation: { type: "boolean", example: false },
    },
  },
  403: {
    description: "Ação não permitida",
    type: "object",
    properties: {
      message: { type: "string", example: "Ação não permitida" },
      ok: { type: "boolean", example: false },
      api: { type: "string", example: "auth" },
      validation: { type: "boolean", example: false },
    },
  },
  500: {
    description: "Erro interno no servidor",
    type: "object",
    properties: {
      message: { type: "string", example: "Erro interno no servidor" },
      ok: { type: "boolean", example: false },
      api: { type: "string", example: "auth" },
      validation: { type: "boolean", example: false },
    },
  },
};

export default errorResponseSchema;
