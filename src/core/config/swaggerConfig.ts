import { SwaggerOptions } from "@fastify/swagger";
import { FastifyRegisterOptions } from "fastify";

const swaggerConfig = (
  port: number,
): FastifyRegisterOptions<SwaggerOptions> => {
  return {
    openapi: {
      openapi: "3.0.0",
      components: {
        securitySchemes: {
          JWTToken: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description:
              "Use o JWT no cabeçalho como 'Authorization: Bearer <token>'",
          },
        },
      },
      info: {
        title: "Login Microservice API",
        description: "API principal para o login e autenticação de usuários",
        version: "2.0.0",
      },
      servers: [
        {
          url: `http://localhost:${port}`,
          description: "Development server",
        },
        {
          url: `http://189.20.193.252:${port}`,
          description: "Production server",
        },
      ],
    },
  };
};

const swaggerUiConfig = {
  routePrefix: "/docs",
  exposeRoute: true,
};

export { swaggerConfig, swaggerUiConfig };
