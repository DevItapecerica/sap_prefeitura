const fatify = require("fastify");
const cors = require("@fastify/cors");
const fastifySwagger = require("@fastify/swagger");
const fastifySwaggerUi = require("@fastify/swagger-ui");

const routes = require("./router/routes");

const port = 8001;
const app = fatify();

app.register(cors, {
  allowOrigin: "*",
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  withCredentials: true,
});

app.register(fastifySwagger, {
  openapi: {
    openapi: "3.0.0",
    components: {
      securitySchemes: {
        APIKey: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
          description: "Use a chave de API no cabeçalho como 'x-api-key'",
        },
      },
    },
    info: {
      title: "Test swagger",
      description: "API principal de consumo de microserviços",
      version: "2.0.0",
    },
    servers: [
      {
        url: `http://192.168.16.13:${port}`,
        description: "Development server",
      },
      {
        url: `http://192.168.16.80:${port}`,
        description: "prodution server",
      },
    ],
  },
});

app.register(fastifySwaggerUi, {
  routePrefix: "/docs",
  exposeRoute: true,
});

// Usando o hook onError para tratamento global de erros
app.setErrorHandler((error, request, reply) => {
  const statusCode = error.statusCode || error.status || 500;
  let messageError =
    error.response?.data.message || error.message || "Erro desconhecido";
  // Verifica o tipo de erro e responde com o status adequado
  if (statusCode === 400) {
    reply.status(400).send({
      statusCode: 400,
      error: "Bad Request",
      message: "Bad Request " + messageError,
    });
  } else if (statusCode === 404) {
    reply.status(404).send({
      statusCode: 404,
      error: "Not Found",
      message: "O serviço solicitado não foi encontrada. " + messageError,
    });
  } else if (statusCode === 401) {
    reply.status(401).send({
      statusCode: 401,
      error: "Unauthorized",
      message: "Não está autorizado. " + messageError,
    });
  } else {
    reply.status(500).send({
      statusCode: 500,
      error: "Server Error",
      message: "Erro interno no servidor. " + messageError,
    });
  }
});

app.register(routes);

const start = () => {
  try {
    app.listen({ port, host: "0.0.0.0" });
    console.log(`Server is running on port ${port}`);
  } catch (error) {}
};

start();
