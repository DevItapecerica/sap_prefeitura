const logg = { translateTime: "HH:MM:ss", ignore: "hostname" };

const logConfig = {
  disableRequestLogging: true,
  logger: {
    level: "info",
    transport: {
      target: "pino-pretty",
      options: logg,
    },
  },
};

export default logConfig;
