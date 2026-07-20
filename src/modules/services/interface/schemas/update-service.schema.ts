import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import { permissionsArraySchema } from "./permission-resource.schema.js";
import { visibilityArraySchema } from "./visibility-resource.schema.js";

export const updateServiceSchema = {
  description: "Atualiza um serviço",
  tags: ["Services"],
  security: [{ JWTToken: [] }],
  body: {
    type: "object",
    required: ["service"],
    properties: {
      service: {
        type: "object",
        required: ["name", "description", "url"],
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          tag: { type: "string" },
          url: { type: "string" },
        },
      },
      permissions: permissionsArraySchema,
      visibility: visibilityArraySchema,
    },
  },
  response: {
    204: { description: "Serviço atualizado com sucesso" },
    ...errorResponseSchema,
  },
};
