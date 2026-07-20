import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import {
  permissionInputSchema,
  permissionResourceSchema,
} from "./permission-resource.schema.js";

export const updatePermissionSchema = {
  security: [{ JWTToken: [] }],
  tags: ["Permission"],
  summary: "Atualizar uma permissão",
  params: {
    type: "object",
    required: ["id"],
    properties: { id: { type: "integer" } },
  },
  body: {
    type: "object",
    required: ["permission"],
    properties: { permission: permissionInputSchema },
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
