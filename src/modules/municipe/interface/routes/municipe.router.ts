import { FastifyPluginAsync } from "fastify";
import municipeController from "../controller/municipe.controller.js";

const MunicipeRouter: FastifyPluginAsync = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/",
    schema: {},
    handler: municipeController.getMunicipe,
  });
};

export default MunicipeRouter;
