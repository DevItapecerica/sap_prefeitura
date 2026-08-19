import { FastifyReply, FastifyRequest } from "fastify";
import {
  FtEditalBolsistaQueryDto,
  FtEditalDto,
  FtEditalQueryDto,
  FtVincularBolsistaDto,
} from "../../application/dto/ft-edital.dto.js";
import { makeFtEditalService } from "../../factories/makeFtEditalService.js";
import { FtRelatorioQueryDto } from "../../../ft-relatorio/application/dto/ft-relatorio.dto.js";
import { makeGerarRelatorioFtUseCase } from "../../../ft-relatorio/factories/makeGerarRelatorioFtUseCase.js";
import { makeResourceReadEventPublisher } from "../../../../factories/resource-read-events.factory.js";
import { makeApplicationEventContext } from "../../../../infra/http/fastify/application-event-context.js";
import { makeFtEditalEventPublisher } from "../../factories/ft-edital-events.factory.js";
import { RESOURCE_READ_EVENTS } from "../../../../core/event/resource-read.events.js";
import { FT_EDITAL_EVENTS } from "../../application/events/ft-edital.events.js";

const service = makeFtEditalService();
const gerarRelatorioFtUseCase = makeGerarRelatorioFtUseCase();
const resourceReadEventPublisher = makeResourceReadEventPublisher();
const ftEditalEvents = makeFtEditalEventPublisher();
const plain = (value: any) =>
  typeof value?.toJSON === "function" ? value.toJSON() : value;

export class FtEditalController {
  static getEdital = async (
    request: FastifyRequest<{ Querystring: FtEditalQueryDto }>,
    reply: FastifyReply,
  ) => {
    const { edital, count } = await service.allEdital(request.query);
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.listed, {
      context: makeApplicationEventContext(request),
      module: "ft-edital",
      resourceType: "edital",
      filters: request.query,
      returnedCount: edital.length,
    });

    return reply
      .status(200)
      .send({ message: "Edital selecionados com sucesso", edital, count });
  };

  static getEditalById = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const edital = await service.editalById(request.params.id);
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.viewed, {
      context: makeApplicationEventContext(request),
      module: "ft-edital",
      resourceType: "edital",
      resourceId: request.params.id,
    });

    return reply
      .status(200)
      .send({ message: "Edital selecionados com sucesso", edital });
  };

  static postEdital = async (
    request: FastifyRequest<{ Body: { edital: FtEditalDto } }>,
    reply: FastifyReply,
  ) => {
    const { edital } = request.body;
    const newEdital = await service.createEdital(edital);
    await ftEditalEvents.publish(FT_EDITAL_EVENTS.created, {
      context: makeApplicationEventContext(request),
      after: plain(newEdital),
    });

    return reply
      .status(201)
      .send({ message: "Edital criado com sucesso", newEdital });
  };

  static updateEdital = async (
    request: FastifyRequest<{
      Params: { id: string };
      Body: { edital: FtEditalDto };
    }>,
    reply: FastifyReply,
  ) => {
    const { edital } = request.body;
    const before = await service.editalById(request.params.id);
    const newEdital = await service.updateEdital(request.params.id, edital);
    await ftEditalEvents.publish(FT_EDITAL_EVENTS.updated, {
      context: makeApplicationEventContext(request),
      before: plain(before),
      after: plain(newEdital),
    });

    return reply
      .status(200)
      .send({ message: "Edital criado com sucesso", edital: newEdital });
  };

  static deleteEdital = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const before = await service.editalById(request.params.id);
    await service.deleteEdital(request.params.id);
    await ftEditalEvents.publish(FT_EDITAL_EVENTS.deleted, {
      context: makeApplicationEventContext(request),
      before: plain(before),
      resourceId: request.params.id,
    });

    return reply.status(201).send({ message: "Edital deletado com sucesso" });
  };

  static vincularBolsista = async (
    request: FastifyRequest<{
      Params: { id: string };
      Body: FtVincularBolsistaDto;
    }>,
    reply: FastifyReply,
  ) => {
    const { bolsista, data_vinculo } = request.body;

    const vinculos = await service.vincularBolsista(
      request.params.id,
      bolsista,
      data_vinculo,
    );
    await ftEditalEvents.publish(FT_EDITAL_EVENTS.bolsistasLinked, {
      context: makeApplicationEventContext(request),
      editalId: request.params.id,
      after: vinculos.map(plain),
    });

    return reply.status(201).send({ message: "Bolsista vinculado com sucesso" });
  };

  static getAllEditalWithBolsista = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const bolsista_edital = await service.getAllWithBolsista();
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.listed, {
      context: makeApplicationEventContext(request),
      module: "ft-edital",
      resourceType: "edital_bolsista",
      returnedCount: bolsista_edital.length,
    });

    return reply
      .status(200)
      .send({ message: "Todos os editais com bolsistas", bolsista_edital });
  };

  static getEditalWithBolsista = async (
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: FtEditalBolsistaQueryDto;
    }>,
    reply: FastifyReply,
  ) => {
    const { bolsistas, count } = await service.getWithBolsista(
      request.params.id,
      request.query,
    );
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.listed, {
      context: makeApplicationEventContext(request),
      module: "ft-edital",
      resourceType: "edital_bolsista",
      filters: { ...request.query, editalId: request.params.id },
      returnedCount: bolsistas.length,
    });

    return reply
      .status(200)
      .send({ message: "Edital com bolsistas", bolsistas, count });
  };

  static getRelatory = async (
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: FtRelatorioQueryDto;
    }>,
    reply: FastifyReply,
  ) => {
    const relatory = await gerarRelatorioFtUseCase.execute(
      request.params.id,
      request.query,
    );
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.exported, {
      context: makeApplicationEventContext(request),
      module: "ft-edital",
      resourceType: "relatorio_pagamento",
      resourceId: request.params.id,
      filters: { ...request.query, editalId: request.params.id },
      returnedCount: relatory.returnedCount,
    });

    return reply
      .status(200)
      .header("Content-Type", relatory.type)
      .header("Content-Disposition", `attachment; filename="${relatory.fileName}"`)
      .send(relatory.csv);
  };
}
