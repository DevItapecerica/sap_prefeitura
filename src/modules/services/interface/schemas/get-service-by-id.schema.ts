import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import { permissionsArraySchema } from "./permission-resource.schema.js";
import { serviceResourceSchema } from "./service-resource.schema.js";
import { visibilityArraySchema } from "./visibility-resource.schema.js";

export const getServiceByIdSchema = {
  description: "Retorna o serviço pelo ID",
  tags: ["Services"],
  security: [{ JWTToken: [] }],
  params: {
    type: "object",
    required: ["id"],
    properties: { id: { type: "integer" } },
  },
  response: {
    200: {
      description: "Verificação bem sucedida",
      type: "object",
      properties: {
        message: { type: "string" },
        services: serviceResourceSchema,
        visibility: visibilityArraySchema,
        permissions: permissionsArraySchema,
        ok: { type: "boolean", example: true },
      },
    },
    ...errorResponseSchema,
  },
};
