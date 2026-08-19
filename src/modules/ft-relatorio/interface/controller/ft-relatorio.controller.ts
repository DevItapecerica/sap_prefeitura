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

const gerarRelatorioFtUseCase = makeGerarRelatorioFtUseCase();
const gerarRelatorioFaltasFtUseCase = makeGerarRelatorioFaltasFtUseCase();
const gerarListaPresencaFtUseCase = makeGerarListaPresencaFtUseCase();
const resourceReadEventPublisher = makeResourceReadEventPublisher();

export class FtRelatorioController {
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
