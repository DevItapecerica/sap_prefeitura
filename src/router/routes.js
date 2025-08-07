import { authUser } from "../controller/authUser.js";
import { login } from "../controller/login.js";
import auth from "../middleware/authAPI.js";
import loginSchema from "../schema/loginSchema.js";
import authSchema from "../schema/authSchema.js";

const routes = async (fastify, options) => {
  // Login route
  fastify.route({
    method: "POST",
    url: "/login",
    preHandler: [auth],
    schema: loginSchema,
    handler: login,
  });

  // Auth route
  fastify.route({
    method: "POST",
    url: "/authUser",
    preHandler: [auth],
    schema: authSchema,
    handler: authUser,
  });
};

export default routes;
