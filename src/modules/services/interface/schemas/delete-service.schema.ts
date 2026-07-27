import errorResponseSchema from "../../../../core/schema/errorSchema.js";

export const deleteServiceSchema = {
  description: "Exclui um serviço",
  tags: ["Services"],
  security: [{ JWTToken: [] }],
  response: {
    204: { description: "Serviço excluído com sucesso" },
    ...errorResponseSchema,
  },
};
