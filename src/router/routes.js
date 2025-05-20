const { authUser } = require("../controller/authUser");
const { login } = require("../controller/login");
const auth = require("../middleware/authAPI.js");
const loginSchema = require("../schema/loginSchema.js");
const authSchema = require("../schema/authSchema.js");

const routes = async (fastify, options) => {
  //Login route
  fastify.route({
    method: "post",
    url: "/login",
    preHandler: [auth],
    schema: loginSchema,
    handler: login,
  });

  //Auth route
  fastify.route({
    method: "post",
    url: "/authUser",
    preHandler: [auth],
    schema: authSchema,
    handler: authUser,
  });
};

module.exports = routes;
