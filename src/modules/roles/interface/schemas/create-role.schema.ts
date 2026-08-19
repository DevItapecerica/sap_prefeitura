import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import { roleInputSchema, roleResourceSchema } from "./role-resource.schema.js";

export const createRoleSchema = {
  security: [{ JWTToken: [] }],
  tags: ["Roles"],
  summary: "Crie uma nova role",
  body: {
    type: "object",
    required: ["role"],
    properties: { role: roleInputSchema },
  },
  response: {
    201: {
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
