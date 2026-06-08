import { FastifyPluginAsync } from "fastify";
import userRouter from "./interface/routes/user.routes.js";

const userModule: FastifyPluginAsync = async (fastify) => {

    await fastify.register(userRouter, { prefix: "/user" });
};

export default userModule;