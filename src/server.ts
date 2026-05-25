import { PORT } from "./core/env.js";

// fastify
import Fastify from "fastify";
import logConfig from "./core/config/logConfig.js";

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

const fastify = Fastify(logConfig);

const port: number = Number(PORT);

// Registrando Plugins
fastify.log.info("Registrando plugins");
await fastify.register(corsConfig);
fastify.log.info("Cors Registrado");

await fastify.register(fastifySwagger, swaggerConfig(port));
fastify.log.info("Swagger Registrado");

await fastify.register(fastifySwaggerUi, swaggerUiConfig);
fastify.log.info("SwaggerUi Registrado");

await fastify.register(rateLimit);
fastify.log.info("RateLimit Registrado");

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
    console.error("❌ Erro ao iniciar o servidor:", error);
    process.exit(1);
  }
};

await start();
