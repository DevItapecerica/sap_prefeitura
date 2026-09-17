import { NODE_ENV, PORT } from "./core/env.js";

// fastify
import Fastify from "fastify";
import logConfig from "./core/config/logConfig.js";
import fastifyCookie from "@fastify/cookie";

// Cors
import corsConfig from "./core/plugin/Cors.js";

// Swagger
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { swaggerConfig, swaggerUiConfig } from "./core/config/swaggerConfig.js";

// Hooks
import LoggerResponse from "./core/hooks/LoggerResponse.js";
import ErrorHook from "./core/hooks/ErrorHook.js";

// App
import App from "./app.js";
import rateLimit from "./core/plugin/rateLimit.js";
import notFoundHook from "./core/hooks/notFoundHook.js";
import healthRoutes from "./core/plugin/health.js";
import db from "./infra/database/sequelize/index.js";
import { PDF_API_URL } from "./core/env.js";

const fastify = Fastify(logConfig);

const port: number = Number(PORT);

// Registrando Plugins
fastify.log.info("Registrando plugins");

await fastify.register(corsConfig);
fastify.log.info("Cors Registrado");

await fastify.register(fastifyCookie);
fastify.log.info("Cookie Registrado");

if (NODE_ENV !== "production") {
  await fastify.register(fastifySwagger, swaggerConfig(port));
  fastify.log.info("Swagger Registrado");

  await fastify.register(fastifySwaggerUi, swaggerUiConfig);
  fastify.log.info("SwaggerUi Registrado");
}

await fastify.register(rateLimit);
fastify.log.info("RateLimit Registrado");

await fastify.register(healthRoutes, {
  checks: [
    { name: "database", check: () => db.sequelize.authenticate() },
    {
      name: "pdf",
      check: async () => {
        const response = await fetch(new URL("/health", PDF_API_URL), {
          signal: AbortSignal.timeout(2_000),
        });
        if (!response.ok) throw new Error("PDF API unavailable");
      },
    },
  ],
});

// Registrando hooks
await fastify.register(LoggerResponse)
fastify.log.info("Logger Registrado");

await fastify.register(ErrorHook);
fastify.log.info("Error Registrado");

await fastify.register(notFoundHook);
fastify.log.info("NotFound Registrado");

//Inicialização de APP
fastify.register(App, { prefix: "/api/v2" });
fastify.log.info("App Registrado");

// inicialização
const start = async () => {
  try {
    await fastify.listen({ port, host: "0.0.0.0" });
  } catch (error) {
    fastify.log.error({ err: error }, "Erro ao iniciar o servidor");
    process.exit(1);
  }
};

await start();
