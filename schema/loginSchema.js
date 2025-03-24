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
        // format: "email",
      },
      password: {
        type: "string",
        minLength: 6,
        maxLength: 255,
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
    400: {
      description: "Erro no login",
      type: "object",
      properties: {
        statusCode: { type: "integer", example: 400 },
        error: { type: "string", example: "Bad Request" },
        message: { type: "string", example: "Bad Request" },
      },
    },
    401: {
      description: "Erro no login",
      type: "object",
      properties: {
        statusCode: { type: "integer", example: 400 },
        error: { type: "string", example: "Unauthorized" },
        message: { type: "string", example: "Você não está autorizado a acessar este serviço." },
      },
    },
    404: {
      description: "Erro no login",
      type: "object",
      properties: {
        statusCode: { type: "integer", example: 400 },
        error: { type: "string", example: "Not Found" },
        message: { type: "string", example: "A serviço solicitada não foi encontrada." },
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
module.exports = loginSchema;
