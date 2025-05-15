const errorHook = (error, reply) => {
  let payload = {};
  const statusCode = error.status || error.statusCode || 500;
  let messageError =
    error.response?.data.message || error.message || "Erro desconhecido";
  // Verifica o tipo de erro e responde com o status adequado
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
      payload.error = "Bad Request";
      payload.message = `${payload.error} ${messageError}`;
      break;
    case 404:
      payload.statusCode = statusCode;
      payload.error = "Not Found";
      payload.message = `${payload.error} ${messageError}`;
      break;
    case 500:
      payload.statusCode = statusCode;
      payload.error = "Bad Request";
      payload.message = `${payload.error} ${messageError}`;
      break;
    default:
      payload.statusCode = 500;
      payload.error = "Bad Request";
      payload.message = `${payload.error} Erro interno no servidor`;
  }

  reply.status(statusCode).send({
    ...payload,
  });
  // Verifica o tipo de erro e responde com o status adequado
};

module.exports = { errorHook };
