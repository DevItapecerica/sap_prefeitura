import { FastifyPluginAsync } from "fastify";

export const CarterinhasRouter: FastifyPluginAsync = async (fastify) => {
  const publicCarterihaSchema = {
    type: "object",
    properties: {
      uuid: { type: "number" },
      numero_carterinha: { type: "string" },
      name: { type: "string" },
      cpf: { type: "string" },
      nascimento: { type: "string" },
      cidade: { type: "string" },
      uf: { type: "string" },
      setor: { type: "string" },
      servico: { type: "string" },
      createdAt: { type: "string" },
      updatedAt: { type: "string" },
      author: { type: "string" },
    },
  };

  fastify.route({
    method: "GET",
    url: "/carterinhas",
    schema: {
      tags: ["Carterinhas"],
      security: [{ JWTToken: [] }],
      description:
        "Pegue todas as carterinhas, os dados estarão mascarados e poderão ser consultados por id, nome, numero da carterinha ou cpf",
      summary: "Get all carterinhas",
      response: {
        200: {
          type: "array",
          items: publicCarterihaSchema,
        },
      },
    },
    handler: async (request, reply) => {},
  });
};
