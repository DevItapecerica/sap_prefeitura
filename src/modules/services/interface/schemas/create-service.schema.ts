import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import { serviceResourceSchema } from "./service-resource.schema.js";

export const createServiceSchema = {
  description: "Cria um serviço",
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
    },
  },
  response: {
    201: {
      description: "Post bem sucedido",
      type: "object",
      properties: {
        service: serviceResourceSchema,
        ok: { type: "boolean", example: true },
      },
    },
    ...errorResponseSchema,
  },
};
