import { type FastifyServerOptions } from "fastify";
import { TRUSTED_PROXIES } from "../env.js";

const logg = { translateTime: "HH:MM:ss", ignore: "hostname" };

const logConfig: FastifyServerOptions = {
  disableRequestLogging: true,
  trustProxy: TRUSTED_PROXIES.length > 0 ? TRUSTED_PROXIES : false,
  logger: {
    level: "info",
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "req.body.password",
        "req.body.old_password",
        "req.body.new_password",
        "req.body.token",
        "req.body.refresh_token",
        "req.body.cpf",
        "req.body.foto",
        "req.body.payment_info",
        "password",
        "token",
        "refreshToken",
        "cpf",
        "foto",
        "payment_info",
      ],
      censor: "[REDACTED]",
    },
    transport: {
      target: "pino-pretty",
      options: logg,
    },
  },
};

export default logConfig;
