import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import { userResourceSchema } from "./user-resource.schema.js";

export const getUserByIdSchema = {
  tags: ["Users"],
  security: [{ JWTToken: [] }],
  description:
    "Pegue todos os usuários com base em seus parâmetros passados via queryString. \n Parâmetros: limit, page, search e order. \n Order segue o seguinte formato: coluna:asc ou coluna:desc. (Colunas aceitas: id, name, email, ramal, createdAt)",
  summary: "Pegue todos os usuários",
  querystring: {
    type: "object",
    properties: {
      limit: { type: "integer", default: 10 },
      page: { type: "integer", default: 1 },
      search: { type: "string" },
      order: { type: "string", default: "createdAt:desc" },
    },
  },
  response: {
    200: {
      description: "Requisição bem sucedida",
      type: "object",
      properties: {
        message: { type: "string", example: "Usuário selecionado com sucesso" },
        user: userResourceSchema,
        ok: { type: "boolean", example: true },
      },
    },
    ...errorResponseSchema,
  },
};
