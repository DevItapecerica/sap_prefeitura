require('dotenv').config({path: `${__dirname}/.env`})

const swaggerConfig = {
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
        url: `http://192.168.16.13:${process.env.APPLICATION_PORT || 8001}`,
        description: "Development server",
      },
      {
        url: `http://192.168.16.80:${process.env.APPLICATION_PORT || 8001}`,
        description: "prodution server",
      },
    ],
  },
}

module.exports = swaggerConfig;