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
      description: "Verificação bem sucedido",
      type: "object",
      properties: {
        message: { type: "string", example: "Usuário authenticado" },
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
      description: "Erro no 401",
      type: "object",
      properties: {
        statusCode: { type: "integer", example: 400 },
        error: { type: "string", example: "Unauthorized" },
        message: {
          type: "string",
          example: "Você não está autorizado a acessar este serviço.",
        },
      },
    },
    404: {
      description: "Erro no 404",
      type: "object",
      properties: {
        statusCode: { type: "integer", example: 400 },
        error: { type: "string", example: "Not Found" },
        message: {
          type: "string",
          example: "A serviço solicitada não foi encontrada.",
        },
      },
    },
    500: {
      description: "Erro interno",
      type: "object",
      properties: {
        statusCode: { type: "integer", example: 400 },
        error: { type: "string", example: "Server Error" },
        message: { type: "string", example: "Erro interno no Servidor" },
      },
    },
  },
};

module.exports = authSchema;
