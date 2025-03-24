const middlewareError = (error, request, reply) => {
  console.log(error.status)
  const statusCode = error.status || 500;
  let messageError =
    error.response?.data.message || error.message || "Erro desconhecido";
  // Verifica o tipo de erro e responde com o status adequado
  switch (statusCode) {
    case 400:
      reply.status(statusCode).send({
        statusCode: statusCode,
        error: "Server Error",
        message: "Bad Request " + messageError,
      });
      break;
    case 401:
      reply.status(statusCode).send({
        statusCode: statusCode,
        error: "Server Error",
        message: "Unauthorized " + messageError,
      });
      break;
    case 403:
      reply.status(statusCode).send({
        statusCode: statusCode,
        error: "Server Error",
        message: "Forbidden " + messageError,
      });
      break;
    case 404:
      reply.status(statusCode).send({
        statusCode: statusCode,
        error: "Server Error",
        message: "Not found " + messageError,
      });
      break;
    case 500:
      reply.status(statusCode).send({
        statusCode: statusCode,
        error: "Server Error",
        message: "Internal server error " + messageError,
      });
      break;
    default:
      reply.status(statusCode).send({
        statusCode: statusCode,
        error: "Server Error",
        message: "Internal server error " + messageError,
      });
  }
};
