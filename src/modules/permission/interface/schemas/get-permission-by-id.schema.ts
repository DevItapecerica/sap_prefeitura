import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import { permissionResourceSchema } from "./permission-resource.schema.js";

export const getPermissionByIdSchema = {
  security: [{ JWTToken: [] }],
  tags: ["Permission"],
  summary: "Retorna permission pelo ID",
  params: {
    type: "object",
    required: ["id"],
    properties: { id: { type: "integer" } },
  },
  response: {
    200: {
      type: "object",
      properties: {
        message: { type: "string" },
        permission: permissionResourceSchema,
        ok: { type: "boolean" },
      },
    },
    ...errorResponseSchema,
  },
};
