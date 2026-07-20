import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import { roleResourceSchema } from "./role-resource.schema.js";

export const getRoleByIdSchema = {
  security: [{ JWTToken: [] }],
  tags: ["Roles"],
  summary: "Pegue uma role",
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
        role: roleResourceSchema,
        ok: { type: "boolean" },
      },
    },
    ...errorResponseSchema,
  },
};
