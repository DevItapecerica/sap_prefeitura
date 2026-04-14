import { FastifyPluginAsync } from "fastify";
import userRouter from "./user.routes.js";

const userModule: FastifyPluginAsync = async (fastify) => {

    await fastify.register(userRouter, { prefix: "/user" });
    fastify.log.info("User Routes Registrado");
};

export default userModule;