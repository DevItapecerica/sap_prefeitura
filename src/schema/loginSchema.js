const LoginSchema = {
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
        firstLogin: { type: "boolean", example: true },
        name: { type: "string", example: "João" },
        token: { type: "string", example: "token" },
        ip: { type: "string", example: "192.168.1.1" },
        scopo: { type: "string", example: "admin" },
      },
    },
    500: {
      description: "Erro interno do servidor",
      type: "object",
      properties: {
        message: { type: "string", example: "Erro interno do servidor" },
      },
    },
    401: {
      description: "Erro de validação",
      type: "object",
      properties: {
        ok: { type: "boolean", example: false },
        api: { type: "string", example: "auth" },
        validation: { type: "boolean", example: false },
        message: { type: "string", example: "Bad Request" },
      },
    },
    400: {
      description: "Erro de validação",
      type: "object",
      properties: {
        ok: { type: "boolean", example: false },
        api: { type: "string", example: "auth" },
        validation: { type: "boolean", example: true },
        message: { type: "string", example: "Bad Request" },
      },
    },
  },
};

export default LoginSchema;
