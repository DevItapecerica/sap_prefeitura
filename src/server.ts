import { PORT } from "./core/env.js";

// fastify
import Fastify from "fastify";
import logConfig from "./core/logConfig.js";

// Cors
import corsConfig from "./core/plugin/CorsConfig.js";

// Swagger
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { swaggerConfig, swaggerUiConfig } from "./core/swaggerConfig.js";

// Hooks
import LoggerResponse from "./core/hooks/LoggerResponse.js";
import ErrorHook from "./core/hooks/ErrorHook.js";

// App
import App from "./app.js";

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

// Registrando hooks
await fastify.register(LoggerResponse)
fastify.log.info("Logger Registrado");

await fastify.register(ErrorHook);
fastify.log.info("Error Registrado");

//Inicialização de APP
fastify.register(App);

// inicialização
const start = () => {
  try {
    fastify.listen({ port, host: "0.0.0.0" });
  } catch (error) {
    console.error("❌ Erro ao iniciar o servidor:", error);
    process.exit(1);
  }
};

start();
