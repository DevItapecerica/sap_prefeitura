const errorType = {
	statusCode: { type: "number", example: 400 },
	message: { type: "string", example: "Requisição inválida" },
	code: { type: "string", example: "auth" },
	ok: { type: "boolean", example: false },
};

const errorResponseSchema = {
  400: {
    description: "Erro no 400: Requisição inválida",
    type: "object",
    properties: errorType
  },
  401: {
    description: "Token de autenticação inválido",
    type: "object",
    properties: errorType
  },
  403: {
    description: "Ação não permitida",
    type: "object",
    properties: errorType
  },
  404: {
    description: "Recurso não encontrado",
    type: "object",
    properties: errorType
  },
  500: {
    description: "Erro interno no servidor",
    type: "object",
    properties: errorType
  },
};

export default errorResponseSchema;
