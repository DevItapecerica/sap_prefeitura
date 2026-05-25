import { type FastifyServerOptions } from "fastify";

const logg = { translateTime: "HH:MM:ss", ignore: "hostname" };

const logConfig: FastifyServerOptions = {
  disableRequestLogging: true,
  trustProxy: true,
  logger: {
    level: "info",
    transport: {
      target: "pino-pretty",
      options: logg,
    },
  },
};

export default logConfig;
