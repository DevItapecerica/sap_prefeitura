import errorResponseSchema from "../../../../core/schema/errorSchema.js";

export const changeUserPasswordSchema = {
  tags: ["Users"],
  security: [{ JWTToken: [] }],
  description: "Atualize uma senha do usuário",
  summary: "Atualize uma senha do usuário",
  body: {
    type: "object",
    required: ["old_password", "new_password"],
    properties: {
      old_password: { type: "string" },
      new_password: { type: "string" },
    },
  },
  response: {
    200: {
      description: "Requisição bem sucedida",
      type: "object",
      properties: {
        message: { type: "string", example: "Senha atualizada com sucesso" },
        ok: { type: "boolean", example: true },
      },
    },
    ...errorResponseSchema,
  },
};
