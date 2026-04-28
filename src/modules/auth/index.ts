import { FastifyPluginAsync } from "fastify";
import routes from "./auth.routes.js";

const authModule: FastifyPluginAsync = async (fastify) => {

    fastify.register(routes);
}

export default authModule