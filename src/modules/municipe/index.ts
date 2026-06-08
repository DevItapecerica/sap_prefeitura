import { FastifyPluginAsync } from "fastify";
import MunicipeRouter from "./interface/routes/municipe.router.js";

const MunicipeModule: FastifyPluginAsync = async (fastify) => {

    fastify.register(MunicipeRouter, { prefix: "/municipes" });
};

export default MunicipeModule;