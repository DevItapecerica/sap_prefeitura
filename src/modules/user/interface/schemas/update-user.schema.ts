import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import { userResourceSchema } from "./user-resource.schema.js";

export const updateUserSchema = {
  tags: ["Users"],
  security: [{ JWTToken: [] }],
  description: "Atualize um usuário",
  summary: "Crie um usuário com base nos parâmetros passados via body.user",
  body: {
    type: "object",
    required: ["user"],
    properties: {
      user: {
        type: "object",
        required: ["name", "email", "ramal", "setor_id", "role_id"],
        properties: {
          name: { type: "string" },
          email: { type: "string" },
          ramal: { type: "string" },
          setor_id: { type: "integer" },
          role_id: { type: "integer" },
        },
      },
    },
  },
  response: {
    200: {
      description: "Requisição bem sucedida",
      type: "object",
      properties: {
        message: { type: "string", example: "Usuário atualizado com sucesso" },
        user: userResourceSchema,
        ok: { type: "boolean", example: true },
      },
    },
    ...errorResponseSchema,
  },
};
