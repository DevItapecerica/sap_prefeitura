import { FastifyReply, FastifyRequest } from "fastify";
import { EspelhoPontoRequestDto } from "../../application/dto/espelho-ponto.dto.js";
import RenderEspelhoPontoPdfUseCase from "../../application/use-case/render-espelho-ponto-pdf.use-case.js";
import { makeResourceReadEventPublisher } from "../../../../factories/resource-read-events.factory.js";
import { makeApplicationEventContext } from "../../../../infra/http/fastify/application-event-context.js";
import { RESOURCE_READ_EVENTS } from "../../../../core/event/resource-read.events.js";

const resourceReadEventPublisher = makeResourceReadEventPublisher();

export default class EspelhoPontoController {
  constructor(private readonly renderPdf: RenderEspelhoPontoPdfUseCase) {}
  render = async (request: FastifyRequest<{ Body: EspelhoPontoRequestDto }>, reply: FastifyReply) => {
    const result = await this.renderPdf.execute(request.body);
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.exported, {
      context: makeApplicationEventContext(request),
      module: "espelho-ponto",
      resourceType: "espelho_ponto",
      filters: {
        referencia: request.body.periodo.referencia,
        inicio: request.body.periodo.inicio,
        fim: request.body.periodo.fim,
      },
      returnedCount: 1,
    });
    reply.type(result.contentType).header("Content-Disposition", result.contentDisposition);
    if (result.contentLength) reply.header("Content-Length", result.contentLength);
    return reply.status(200).send(result.file);
  };
}
