import { FastifyPluginAsync } from "fastify";
import userRouter from "./routes.js";

const userModule: FastifyPluginAsync = async (fastify, opts) => {

    await fastify.register(userRouter, opts);
    fastify.log.info("User Routes Registrado");
};

export default userModule;