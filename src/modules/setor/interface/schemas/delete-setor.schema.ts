import errorResponseSchema from "../../../../core/schema/errorSchema.js";

export const deleteSetorSchema = {
  tags: ["Setores"],
  security: [{ JWTToken: [] }],
  response: {
    204: { description: "Setor deletado com sucesso" },
    ...errorResponseSchema,
  },
};
