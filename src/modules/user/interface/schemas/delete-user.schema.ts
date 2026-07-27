import errorResponseSchema from "../../../../core/schema/errorSchema.js";

export const deleteUserSchema = {
  tags: ["Users"],
  security: [{ JWTToken: [] }],
  description: "Delete um usuário",
  summary: "Delete um usuário",
  response: {
    200: {
      description: "Requisição bem sucedida",
      type: "object",
      properties: {
        message: { type: "string", example: "Usuário deletado com sucesso" },
        id: { type: "integer", example: 1 },
        ok: { type: "boolean", example: true },
      },
    },
    ...errorResponseSchema,
  },
};
