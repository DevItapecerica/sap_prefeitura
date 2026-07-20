import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import { setorResourceSchema } from "./setor-resource.schema.js";

export const createSetorSchema = {
  tags: ["Setores"],
  description: "Cria um novo setor",
  security: [{ JWTToken: [] }],
  body: {
    type: "object",
    required: ["setor"],
    properties: {
      setor: {
        type: "object",
        required: ["name", "description"],
        properties: {
          name: { type: "string" },
          description: { type: "string" },
        },
      },
    },
  },
  response: {
    201: {
      description: "Setor criado com sucesso",
      type: "object",
      properties: { setor: setorResourceSchema },
    },
    ...errorResponseSchema,
  },
};
