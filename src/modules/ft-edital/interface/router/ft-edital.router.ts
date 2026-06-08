import { FastifyPluginAsync, FastifyRequest } from "fastify";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { authorizationFactory } from "../../../acess-controll/factory/makeAuthorization.js";
import { FtEditalController } from "../controller/ft-edital.controller.js";

export const FtEditalRouter: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  fastify.addHook("preHandler", async (request: FastifyRequest) => {
    const verifyAuthorization = authorizationFactory(request.log);
    await verifyAuthorization.authorize(
      Number(request.user.id),
      6,
      request.method,
    );
  });

  fastify.get("/", FtEditalController.getEdital);
  fastify.post("/", FtEditalController.postEdital);
  fastify.get("/bolsista", FtEditalController.getAllEditalWithBolsista);
  fastify.post("/vincularbolsista/:id", FtEditalController.vincularBolsista);
  fastify.get("/:id/bolsista", FtEditalController.getEditalWithBolsista);
  fastify.get("/:id/relatory", FtEditalController.getRelatory);
  fastify.get("/:id", FtEditalController.getEditalById);
  fastify.put("/:id", FtEditalController.updateEdital);
  fastify.delete("/:id", FtEditalController.deleteEdital);
};
