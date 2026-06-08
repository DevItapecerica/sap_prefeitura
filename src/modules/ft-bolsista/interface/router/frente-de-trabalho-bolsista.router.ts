import { FastifyPluginAsync, FastifyRequest } from "fastify";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { authorizationFactory } from "../../../acess-controll/factory/makeAuthorization.js";
import { FrenteTrabalhoBolsistaController } from "../controller/frente-de-trabalho-bolsista.controller.js";

export const FrenteTrabalhoBolsistaRouter: FastifyPluginAsync = async (
  fastify,
) => {
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  fastify.addHook("preHandler", async (request: FastifyRequest) => {
    const verifyAuthorization = authorizationFactory(request.log);
    await verifyAuthorization.authorize(
      Number(request.user.id),
      6,
      request.method,
    );
  });

  fastify.get("/", FrenteTrabalhoBolsistaController.getBolsistas);
  fastify.post("/", FrenteTrabalhoBolsistaController.createBolsista);
  fastify.get("/toexpire", FrenteTrabalhoBolsistaController.getToExpire);
  fastify.get("/toExpire", FrenteTrabalhoBolsistaController.getToExpire);
  fastify.put("/prorrogate", FrenteTrabalhoBolsistaController.prorrogate);
  fastify.get("/edital/:id", FrenteTrabalhoBolsistaController.getBolsistaEdital);
  fastify.get("/:id", FrenteTrabalhoBolsistaController.getOneBolsista);
  fastify.put("/:id", FrenteTrabalhoBolsistaController.updateBolsista);
  fastify.delete("/:id", FrenteTrabalhoBolsistaController.deleteBolsista);
  fastify.put(
    "/:bolsista/edital/:edital",
    FrenteTrabalhoBolsistaController.cancelBolsistaEdital,
  );
  fastify.post("/:id/faltas", FrenteTrabalhoBolsistaController.createFalta);
  fastify.get("/:id/faltas", FrenteTrabalhoBolsistaController.listFaltas);
  fastify.delete(
    "/:id/faltas/:faltaId",
    FrenteTrabalhoBolsistaController.deleteFalta,
  );
};
