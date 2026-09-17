import { FastifyReply, FastifyRequest } from "fastify";
import {
  FtRelatorioFaltasQueryDto,
  FtRelatorioQueryDto,
} from "../../application/dto/ft-relatorio.dto.js";
import { makeGerarRelatorioFtUseCase } from "../../factories/makeGerarRelatorioFtUseCase.js";
import { makeGerarRelatorioFaltasFtUseCase } from "../../factories/makeGerarRelatorioFaltasFtUseCase.js";
import { makeGerarListaPresencaFtUseCase } from "../../factories/makeGerarListaPresencaFtUseCase.js";
import { makeResourceReadEventPublisher } from "../../../../factories/resource-read-events.factory.js";
import { makeApplicationEventContext } from "../../../../infra/http/fastify/application-event-context.js";
import { RESOURCE_READ_EVENTS } from "../../../../core/event/resource-read.events.js";
import { makeFtRelatorioArquivoService } from "../../factories/makeFtRelatorioArquivoService.js";

const gerarRelatorioFtUseCase = makeGerarRelatorioFtUseCase();
const gerarRelatorioFaltasFtUseCase = makeGerarRelatorioFaltasFtUseCase();
const gerarListaPresencaFtUseCase = makeGerarListaPresencaFtUseCase();
const resourceReadEventPublisher = makeResourceReadEventPublisher();
const arquivoService = makeFtRelatorioArquivoService();

export class FtRelatorioController {
  static solicitarEspelhosPonto = async (
    request: FastifyRequest<{ Params: { id: string }; Body: { mes: string } }>,
    reply: FastifyReply,
  ) => {
    const arquivo = await arquivoService.request(request.params.id, request.body.mes, Number(request.user.id));
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.exported, {
      context: makeApplicationEventContext(request), module: "ft-relatorio", resourceType: "lote_espelho_ponto",
      resourceId: arquivo.id, filters: { editalId: request.params.id, mes: request.body.mes }, returnedCount: 1,
    });
    return reply.status(202).send({ arquivo });
  };

  static listarDownloads = async (
    request: FastifyRequest<{ Querystring: { page?: number; limit?: number } }>,
    reply: FastifyReply,
  ) => reply.status(200).send(await arquivoService.list(request.query.page, request.query.limit));

  static retryDownload = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => reply.status(202).send({ arquivo: await arquivoService.retry(request.params.id) });

  static baixarArquivo = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const download = await arquivoService.openDownload(request.params.id);
    let sent = false;
    reply.raw.once("finish", () => {
      sent = true;
      void arquivoService.finishDownload(request.params.id, download.path).catch((error) => request.log.error({ err: error }, "Falha ao excluir relatorio baixado"));
    });
    reply.raw.once("close", () => {
      if (!sent) void arquivoService.releaseDownload(request.params.id).catch((error) => request.log.error({ err: error }, "Falha ao liberar download"));
    });
    download.stream.once("error", () => void arquivoService.releaseDownload(request.params.id).catch((error) => request.log.error({ err: error }, "Falha ao liberar download")));
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.exported, {
      context: makeApplicationEventContext(request), module: "ft-relatorio", resourceType: "arquivo_espelhos_ponto",
      resourceId: request.params.id, returnedCount: 1,
    });
    return reply.type("application/zip").header("Content-Disposition", `attachment; filename="${download.record.nome_arquivo}"`).header("Content-Length", download.size).send(download.stream);
  };
  static gerarRelatorioEdital = async (
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: FtRelatorioQueryDto;
    }>,
    reply: FastifyReply,
  ) => {
    const relatorio = await gerarRelatorioFtUseCase.execute(
      request.params.id,
      request.query,
    );
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.exported, {
      context: makeApplicationEventContext(request),
      module: "ft-relatorio",
      resourceType: "relatorio_pagamento",
      resourceId: request.params.id,
      filters: { ...request.query, editalId: request.params.id },
      returnedCount: relatorio.returnedCount,
    });

    return reply
      .status(200)
      .header("Content-Type", relatorio.type)
      .header("Content-Disposition", `attachment; filename="${relatorio.fileName}"`)
      .send(relatorio.csv);
  };

  static gerarRelatorioFaltasEdital = async (
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: FtRelatorioFaltasQueryDto;
    }>,
    reply: FastifyReply,
  ) => {
    const relatorio = await gerarRelatorioFaltasFtUseCase.execute(
      request.params.id,
      request.query,
    );
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.exported, {
      context: makeApplicationEventContext(request),
      module: "ft-relatorio",
      resourceType: "relatorio_faltas",
      resourceId: request.params.id,
      filters: { ...request.query, editalId: request.params.id },
      returnedCount: relatorio.returnedCount,
    });

    return reply
      .status(200)
      .header("Content-Type", relatorio.type)
      .header("Content-Disposition", `attachment; filename="${relatorio.fileName}"`)
      .send(relatorio.csv);
  };

  static gerarListaPresencaEdital = async (
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: FtRelatorioFaltasQueryDto;
    }>,
    reply: FastifyReply,
  ) => {
    const relatorio = await gerarListaPresencaFtUseCase.execute(
      request.params.id,
      request.query,
    );
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.exported, {
      context: makeApplicationEventContext(request),
      module: "ft-relatorio",
      resourceType: "lista_presenca",
      resourceId: request.params.id,
      filters: { ...request.query, editalId: request.params.id },
      returnedCount: relatorio.returnedCount,
    });

    return reply
      .status(200)
      .header("Content-Type", relatorio.type)
      .header("Content-Disposition", `attachment; filename="${relatorio.fileName}"`)
      .send(relatorio.csv);
  };
}
