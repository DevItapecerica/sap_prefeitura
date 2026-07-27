import errorResponseSchema from "../../../../core/schema/errorSchema.js";

export const deleteRoleSchema = {
  security: [{ JWTToken: [] }],
  tags: ["Roles"],
  summary: "Delete uma role",
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
        ok: { type: "boolean" },
      },
    },
    ...errorResponseSchema,
  },
};
