import { FastifyReply, FastifyRequest } from "fastify";
import { PDF_API_URL } from "../../../../core/env.js";
import GetCarterinhaPdfUseCase from "../../application/use-case/getCarterinhaPdf.use-case.js";

export default class CarterinhaPdfController {
  getPdf = async (
    request: FastifyRequest<{ Params: { uuid: string } }>,
    reply: FastifyReply,
  ) => {
    const useCase = new GetCarterinhaPdfUseCase(PDF_API_URL);
    const response = await useCase.execute(request.params.uuid);

    reply
      .status(200)
      .header("Content-Type", response.contentType)
      .header("Content-Disposition", response.contentDisposition);

    if (response.contentLength) {
      reply.header("Content-Length", response.contentLength);
    }

    return reply.send(response.file);
  };
}
