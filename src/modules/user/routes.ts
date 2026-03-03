import { FastifyPluginAsync } from "fastify";
import UserService from "./service.js";
// import auth from "../middleware/authKey.js";
// import * as schema from "../schema/userSchema.js";

const userRouter: FastifyPluginAsync = async (fastify, options) => {
  // fastify.route({
  //   method: "GET",
  //   url: "/user",
  //   preHandler: [auth],
  //   schema: schema.getUserSchema,
  //   handler: User.getAllUser,
  // });

  fastify.route({
    method: "GET",
    url: "/user/:id",
    // preHandler: [auth],
    // schema: schema.getOneUserSchema,
    handler: UserService.getOne,
  });

  // fastify.route({
  //   method: "POST",
  //   url: "/user",
  //   preHandler: [auth],
  //   schema: schema.postUserSchema,
  //   handler: User.cadastrarUser,
  // });

  // fastify.route({
  //   method: "DELETE",
  //   url: "/user/:id",
  //   preHandler: [auth],
  //   schema: schema.deleteUserSchema,
  //   handler: User.deletarUser,
  // });

  // fastify.route({
  //   method: "PUT",
  //   url: "/user/:id",
  //   preHandler: [auth],
  //   schema: schema.updateUserSchema,
  //   handler: User.atualizarUser,
  // });

  // fastify.route({
  //   method: "DELETE",
  //   url: "/user/setor/:id",
  //   preHandler: [auth],
  //   schema: schema.deleteUserSchema,
  //   handler: User.deletarUserSetor,
  // });
};

export default userRouter;
