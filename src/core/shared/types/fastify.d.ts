import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    user: {
      id: number | string;
      name: string;
      role_id: number | string;
      setor_id: number | string;
    };
  }
}
