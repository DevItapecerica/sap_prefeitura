import type { FastifyReply, FastifyRequest } from "fastify";
import type { GerarComprovanteUseCase } from "../application/gerar-comprovante.use-case.js";

export class ComprovantesController {
  constructor(
    private readonly useCase: Pick<
      GerarComprovanteUseCase,
      "material" | "benefit"
    >,
  ) {}
  material = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const file = await this.useCase.material(request.params.id, request.id);
    return reply
      .type(file.contentType)
      .header("Content-Disposition", file.contentDisposition)
      .header("Cache-Control", "no-store")
      .send(file.file);
  };
  benefit = async (
    request: FastifyRequest<{ Params: { id: string; entregaId: string } }>,
    reply: FastifyReply,
  ) => {
    const file = await this.useCase.benefit(
      request.params.id,
      request.params.entregaId,
      request.id,
    );
    return reply
      .type(file.contentType)
      .header("Content-Disposition", file.contentDisposition)
      .header("Cache-Control", "no-store")
      .send(file.file);
  };
}
