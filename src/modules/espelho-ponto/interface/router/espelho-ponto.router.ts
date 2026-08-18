import { FastifyPluginAsync } from "fastify";
import { PDF_API_URL } from "../../../../core/env.js";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import RenderEspelhoPontoPdfUseCase from "../../application/use-case/render-espelho-ponto-pdf.use-case.js";
import EspelhoPontoController from "../controller/espelho-ponto.controller.js";
import { renderEspelhoPontoPdfSchema } from "../schema/espelho-ponto.schema.js";

export const EspelhoPontoRouter: FastifyPluginAsync = async (fastify) => {
  const controller = new EspelhoPontoController(new RenderEspelhoPontoPdfUseCase(PDF_API_URL));
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  fastify.post("/pdf", {
    schema: renderEspelhoPontoPdfSchema,
    config: { audit: { failureAction: "EXPORT", module: "espelho-ponto", resourceType: "espelho_ponto" } },
  }, controller.render);
};
