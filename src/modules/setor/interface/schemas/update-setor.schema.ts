import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import { setorResourceSchema } from "./setor-resource.schema.js";

export const updateSetorSchema = {
  tags: ["Setores"],
  description: "Atualiza um setor existente",
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
    200: {
      description: "Setor atualizado com sucesso",
      type: "object",
      properties: {
        message: { type: "string" },
        setor: setorResourceSchema,
        ok: { type: "boolean" },
      },
    },
    ...errorResponseSchema,
  },
};
