const fatify = require("fastify");
const cors = require("@fastify/cors");
const fastifySwagger = require("@fastify/swagger");
const fastifySwaggerUi = require("@fastify/swagger-ui");
require('dotenv').config({path: `${__dirname}/config/.env`});

const {swaggerConfig, swaggerUiConfig} = require('./config/swaggerConfig');
const { corsConfig } = require("./config/corsConfig");

const routes = require("./router/routes");

const port = process.env.APPLICATION_PORT || 8001;
const app = fatify();

app.register(cors, corsConfig);

app.register(fastifySwagger, swaggerConfig(port));
app.register(fastifySwaggerUi, swaggerUiConfig);

// Usando o hook onError para tratamento global de erros
app.setErrorHandler((error, request, reply) => {

  console.log(error, request.body)
  const statusCode = error.status || error.statusCode|| 500
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
