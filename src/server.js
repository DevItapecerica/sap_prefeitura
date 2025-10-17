import { NODE_ENV, PORT } from "./config/env.js";

// fastify
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";

// swagger
import { swaggerConfig, swaggerUiConfig } from "./config/swaggerConfig.js";
import { corsConfig } from "./config/corsConfig.js";

// routes
import routes from "./router/routes.js";

const logg =
  NODE_ENV === "prod"
    ? {
        translateTime: "HH:MM:ss",
        ignore: "hostname",
        colorize: false,
        destination: "logs/server.log",
        mkdir: true,
      }
    : { translateTime: "HH:MM:ss", ignore: "hostname" };

const fastify = Fastify({
  logger: {
    level: "info",
    transport: {
      target: "pino-pretty",
      options: logg,
    },
  },
});

// plugins
await fastify.register(cors, corsConfig);
await fastify.register(fastifySwagger, swaggerConfig(PORT));
await fastify.register(fastifySwaggerUi, swaggerUiConfig);

// rotas
fastify.register(routes, { prefix: "/api/v2" });

// hooks

fastify.setErrorHandler((error, request, reply) => {
  // Obtém o código de status ou define como 500 por padrão
  var { code, message, ok, api, validation = false } = error;

  // Loga o erro em ambiente de desenvolvimento
  if (process.env.NODE_ENV === "dev") {
    console.log("Error details:", error);
  } else {
    fastify.log.error("Error details:", error);
  }

  // Formata resposta de erro de forma padronizada
  var errorResponse = {};

  // Se for erro de validação, adiciona detalhes
  if (validation) {
    code = 400;
    errorResponse = {
      ok: false,
      validation: validation,
      message: "Confira o corpo da requisição e tente novamente",
      api: api || "Login",
    };
  } else {
    if (typeof code === "string") code = 500;
    errorResponse = {
      ok: ok || false,
      validation: false,
      message: message || "Internal Server Error",
      api: api || "Login",
    };
  }

  // Envia resposta com o código de status apropriado
  reply
    .code(code || 500)
    .header("Content-Type", "application/json; charset=utf-8")
    .send(errorResponse);
});

// inicialização
const start = () => {
  try {
    fastify.listen({ port: PORT, host: "0.0.0.0" });
  } catch (error) {
    console.error("❌ Erro ao iniciar o servidor:", error);
    process.exit(1);
  }
};

start();
