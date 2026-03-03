import "fastify";

declare module "fastify" {
  interface FastifyRequest  {
    user: {
      id: string;
      name: string;
      role_id: number;
    };
  }
}