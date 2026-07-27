import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import { roleResourceSchema } from "./role-resource.schema.js";

export const listRolesSchema = {
  security: [{ JWTToken: [] }],
  tags: ["Roles"],
  summary: "Pegue todas as roles",
  querystring: {
    type: "object",
    properties: {
      limit: { type: "integer", default: 10 },
      page: { type: "integer", default: 0 },
      search: { type: "string" },
      order: { type: "string", default: "id:desc" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        message: { type: "string" },
        roles: { type: "array", items: roleResourceSchema },
        count: { type: "integer" },
        ok: { type: "boolean" },
      },
    },
    ...errorResponseSchema,
  },
};
