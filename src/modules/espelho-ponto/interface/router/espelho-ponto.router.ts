import { requirePermission } from "../../../acess-controll/interface/require-permission.js";
import { FastifyPluginAsync } from "fastify";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import type EspelhoPontoControllerType from "../controller/espelho-ponto.controller.js";
import { renderEspelhoPontoPdfSchema } from "../schema/espelho-ponto.schema.js";

export const EspelhoPontoRouter: FastifyPluginAsync<{
  controller?: EspelhoPontoControllerType;
}> = async (fastify, options) => {
  const controller =
    options.controller ??
    (
      await import("../../factories/makeEspelhoPontoController.js")
    ).makeEspelhoPontoController();
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  fastify.post(
    "/pdf",
    {
      preHandler: requirePermission("ft")("gerar_espelho_ponto"),
      schema: renderEspelhoPontoPdfSchema,
      config: {
        audit: {
          failureAction: "EXPORT",
          module: "espelho-ponto",
          resourceType: "espelho_ponto",
        },
      },
    },
    controller.render,
  );
};
