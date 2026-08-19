import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import { roleInputSchema, roleResourceSchema } from "./role-resource.schema.js";

export const updateRoleSchema = {
  security: [{ JWTToken: [] }],
  tags: ["Roles"],
  summary: "Atualize uma role",
  params: {
    type: "object",
    required: ["id"],
    properties: { id: { type: "integer" } },
  },
  body: {
    type: "object",
    required: ["role"],
    properties: { role: roleInputSchema },
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
