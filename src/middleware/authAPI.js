import { API_KEY } from "../config/env.js";

const auth = (request, reply, next) => {
  const apiKey = request.headers["x-api-key"];

  if (apiKey !== API_KEY) {
    const error = new Error("not authorized");
    error.status = 401;
    throw error;
  }

  next();
};

export default auth;
