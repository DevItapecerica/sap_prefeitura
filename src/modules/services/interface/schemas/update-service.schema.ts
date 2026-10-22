import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import { visibilityArraySchema } from "./visibility-resource.schema.js";

export const updateServiceSchema = {
  description: "Atualiza um serviço",
  tags: ["Services"],
  security: [{ JWTToken: [] }],
  body: {
    type: "object",
    additionalProperties: false,
    required: ["service"],
    properties: {
      service: {
        type: "object",
        additionalProperties: false,
        required: ["name", "description", "url"],
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          tag: { type: "string" },
          url: { type: "string" },
        },
      },
      visibility: visibilityArraySchema,
    },
  },
  response: {
    204: { description: "Serviço atualizado com sucesso" },
    ...errorResponseSchema,
  },
};
