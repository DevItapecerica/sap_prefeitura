import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import { permissionResourceSchema } from "./permission-resource.schema.js";

export const listPermissionsSchema = {
  security: [{ JWTToken: [] }],
  tags: ["Permission"],
  summary: "Retorna todas as permissões",
  querystring: {
    type: "object",
    properties: {
      page: { type: "integer", default: 0 },
      limit: { type: "integer", default: 10 },
      search: { type: "string", default: "" },
      order: { type: "string", default: "id:desc" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        message: { type: "string" },
        permission: { type: "array", items: permissionResourceSchema },
        count: { type: "integer" },
        ok: { type: "boolean" },
      },
    },
    ...errorResponseSchema,
  },
};
