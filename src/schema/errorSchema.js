const errorResponseSchema = {
  400: {
    description: "Erro no 400",
    type: "object",
    properties: {
      statusCode: { type: "integer", example: 400 },
      error: { type: "string", example: "Bad Request" },
      message: { type: "string", example: "Bad Request" },
    },
  },
  401: {
    description: "Token de autenticação inválido",
    type: "object",
    properties: {
      message: { type: "string", example: "Token de autenticação inválido" },
    },
  },
  403: {
    description: "Ação Não permitida",
    type: "object",
    properties: {
      message: { type: "string", example: "Ação não permitida" },
    },
  },
  500: {
    description: "Erro interno no servidor",
    type: "object",
    properties: {
      message: { type: "string", example: "Erro interno no servidor" },
    },
  },
};

module.exports = errorResponseSchema