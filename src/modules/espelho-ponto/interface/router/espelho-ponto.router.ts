import { requirePermission } from "../../../acess-controll/interface/require-permission.js";
import { FastifyPluginAsync } from "fastify";
import { PDF_API_URL } from "../../../../core/env.js";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import type EspelhoPontoControllerType from "../controller/espelho-ponto.controller.js";
import { renderEspelhoPontoPdfSchema } from "../schema/espelho-ponto.schema.js";

export const EspelhoPontoRouter: FastifyPluginAsync<{controller?: EspelhoPontoControllerType}> = async (fastify, options) => {
  const controller = options.controller ?? new (await import("../controller/espelho-ponto.controller.js")).default(new (await import("../../application/use-case/render-espelho-ponto-pdf.use-case.js")).default(PDF_API_URL));
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  fastify.post("/pdf", {
    preHandler: requirePermission("ft")("gerar_espelho_ponto"),
    schema: renderEspelhoPontoPdfSchema,
    config: { audit: { failureAction: "EXPORT", module: "espelho-ponto", resourceType: "espelho_ponto" } },
  }, controller.render);
};
