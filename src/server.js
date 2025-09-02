import { PORT } from "./config/env.js";

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

// instância do fastify
const fastify = Fastify({
  logger: {
    level: "info",
    file: "./logs/server.log",
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
  },
});

// plugins
await fastify.register(cors, corsConfig);
await fastify.register(fastifySwagger, swaggerConfig(PORT));
await fastify.register(fastifySwaggerUi, swaggerUiConfig);

// hooks
fastify.setErrorHandler((error, request, reply) => {
  // Obtém o código de status ou define como 500 por padrão
  const { code, message, ok, api, validation } = error;

  // Constrói uma mensagem de erro apropriada
  let messageError = message || "Erro interno no servidor";

  // Loga o erro em ambiente de desenvolvimento
  if (
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "dev"
  ) {
    console.error("Error details:", error);
  }

  // Formata resposta de erro de forma padronizada
  var errorResponse = {};

  // Se for erro de validação, adiciona detalhes
  if (validation) {
    errorResponse = {
      ok: ok,
      validation: validation,
      message: messageError,
      api: api || "login",
    };
  } else {
    fastify.log.error(error);
    errorResponse = {
      ok: ok,
      validation: validation,
      message: messageError,
      api: api,
    };
  }

  // Envia resposta com o código de status apropriado
  reply
    .code(code)
    .header("Content-Type", "application/json; charset=utf-8")
    .send(errorResponse);
});

// rotas
fastify.register(routes);

// inicialização
const start = () => {
  try {
    fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`🚀 Server is running on port ${PORT}`);
  } catch (error) {
    console.error("❌ Erro ao iniciar o servidor:", error);
    process.exit(1);
  }
};

start();
