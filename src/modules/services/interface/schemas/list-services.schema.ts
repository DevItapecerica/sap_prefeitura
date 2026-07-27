import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import { serviceResourceSchema } from "./service-resource.schema.js";

export const listServicesSchema = {
  description: "Retorna todos os serviços",
  tags: ["Services"],
  security: [{ JWTToken: [] }],
  querystring: {
    type: "object",
    properties: {
      search: { type: "string" },
      page: { type: "integer", minimum: 0, default: 0 },
      limit: { type: "integer", minimum: 1 },
      order: { type: "string", default: "id:desc" },
    },
  },
  response: {
    200: {
      description: "Verificação bem sucedida",
      type: "object",
      properties: {
        message: { type: "string" },
        services: { type: "array", items: serviceResourceSchema },
        count: { type: "number", example: 1 },
        ok: { type: "boolean", example: true },
      },
    },
    ...errorResponseSchema,
  },
};
