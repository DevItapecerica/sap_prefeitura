import { authUser, login, alterPassword } from "../controller/authUser.js";
import auth from "../middleware/authAPI.js";
import alterPassSchema from "../schema/alterPassSchema.js";
import authSchema from "../schema/authSchema.js";
import LoginSchema from "../schema/loginSchema.js";

const routes = async (fastify, options) => {
  fastify.addHook("preHandler", auth);

  // Login route
  fastify.route({
    method: "POST",
    url: "/login",
    schema: LoginSchema,
    handler: login,
  });

  // Auth route
  fastify.route({
    method: "POST",
    url: "/authUser",
    schema: authSchema,
    handler: authUser,
  });

  fastify.route({
    method: "PUT",
    url: "/user/:id/password",
    schema: alterPassSchema,
    handler: alterPassword,
  });
};

export default routes;
