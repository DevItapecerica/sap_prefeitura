import { FastifyPluginAsync } from "fastify";
import routes from "./routes.js";

const authModule: FastifyPluginAsync = async (fastify, opts) => {

    fastify.register(routes, opts);
    fastify.log.info("Auth Routes Registrado");
}

export default authModule