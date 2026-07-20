import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import { setorResourceSchema } from "./setor-resource.schema.js";

export const listSetoresSchema = {
  tags: ["Setores"],
  security: [{ JWTToken: [] }],
  response: {
    200: {
      description: "Lista de setores",
      type: "object",
      properties: {
        setores: { type: "array", items: setorResourceSchema },
      },
    },
    ...errorResponseSchema,
  },
};
