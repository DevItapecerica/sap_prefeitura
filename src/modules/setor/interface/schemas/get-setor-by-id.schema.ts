import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import { setorResourceSchema } from "./setor-resource.schema.js";

export const getSetorByIdSchema = {
  tags: ["Setores"],
  security: [{ JWTToken: [] }],
  response: {
    200: {
      description: "Setor específico",
      type: "object",
      properties: { setor: setorResourceSchema },
    },
    ...errorResponseSchema,
  },
};
