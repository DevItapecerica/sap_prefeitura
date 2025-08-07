const errorHook = (error, reply) => {
  let payload = {};
  const statusCode = error.status || error.statusCode || 500;
  let messageError =
    error.response?.data.message || error.message || "Erro desconhecido";

  switch (statusCode) {
    case 400:
      payload.statusCode = statusCode;
      payload.error = "Bad Request";
      payload.message = `${payload.error} ${messageError}`;
      break;
    case 401:
      payload.statusCode = statusCode;
      payload.error = "Unauthorized";
      payload.message = `${payload.error} ${messageError}`;
      break;
    case 403:
      payload.statusCode = statusCode;
      payload.error = "Forbidden";
      payload.message = `${payload.error} ${messageError}`;
      break;
    case 404:
      payload.statusCode = statusCode;
      payload.error = "Not Found";
      payload.message = `${payload.error} ${messageError}`;
      break;
    case 500:
      payload.statusCode = statusCode;
      payload.error = "Internal Server Error";
      payload.message = `${payload.error} ${messageError}`;
      break;
    default:
      payload.statusCode = 500;
      payload.error = "Internal Server Error";
      payload.message = `${payload.error} Erro interno no servidor`;
  }

  reply.status(statusCode).send({ ...payload });
};

export { errorHook };
