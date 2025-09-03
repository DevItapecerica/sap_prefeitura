const errorType = {
  ok: { type: "boolean", example: false },
  api: { type: "string", example: "auth" },
  validation: { type: "boolean", example: false },
};

const errorResponseSchema = {
  400: {
    description: "Erro no 400: Requisição inválida",
    type: "object",
    properties: {
      ...errorType,
      message: { type: "string", example: "Requisição inválida" },
    },
  },
  401: {
    description: "Token de autenticação inválido",
    type: "object",
    properties: {
      ...errorType,
      message: { type: "string", example: "Token Inválido" },
    },
  },
  403: {
    description: "Ação não permitida",
    type: "object",
    properties: {
      ...errorType,
      message: { type: "string", example: "Ação não permitida" },
    },
  },
  500: {
    description: "Erro interno no servidor",
    type: "object",
    properties: {
      ...errorType,
      message: { type: "string", example: "Erro interno no servidor" },
    },
  },
};

export default errorResponseSchema;
