import { FastifyReply, FastifyRequest } from "fastify";
import AtletaService from "../../application/use-case/atleta.service.js";
import {
  AddModalidadeAtletaDto,
  CreateCarteirinhaAtletaDto,
  CreateAtletaDto,
  QueryAtletaDto,
  UpdateAtletaDto,
} from "../../application/dto/atleta.dto.js";
import { QueryCarterinhaEsporteDto } from "../../../carterinha-esporte/application/dto/queryCarterinhaEsporte.dto.js";
import AtletaPresentation from "../presentation/atleta.presentation.js";
import { makeResourceReadEventPublisher } from "../../../../factories/resource-read-events.factory.js";
import { makeApplicationEventContext } from "../../../../infra/http/fastify/application-event-context.js";
import { makeEsporteEventPublisher } from "../../factories/esporte-events.factory.js";
import { RESOURCE_READ_EVENTS } from "../../../../core/event/resource-read.events.js";
import { ESPORTE_EVENTS } from "../../application/events/esporte.events.js";
import {
  atletaAuditSnapshot,
  carterinhaAuditSnapshot,
} from "../../application/utils/esporte-audit-snapshot.js";

const resourceReadEventPublisher = makeResourceReadEventPublisher();
const esporteEventPublisher = makeEsporteEventPublisher();

export default class AtletaController {
  constructor(private atletaService: AtletaService) {}

  create = async (
    request: FastifyRequest<{ Body: CreateAtletaDto }>,
    reply: FastifyReply,
  ) => {
    const response = await this.atletaService.createAtleta(
      request.body,
      request.user.id,
    );
    await esporteEventPublisher.publish(ESPORTE_EVENTS.atletaCreated, {
      context: makeApplicationEventContext(request),
      resourceType: "atleta",
      after: atletaAuditSnapshot(response),
    });

    return reply
      .status(201)
      .send({
        message: "Created successfully",
        data: AtletaPresentation.Masked(response),
        ok: true,
      });
  };

  findAll = async (
    request: FastifyRequest<{ Querystring: QueryAtletaDto }>,
    reply: FastifyReply,
  ) => {
    const response = await this.atletaService.findAllAtletas(request.query);
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.listed, {
      context: makeApplicationEventContext(request),
      module: "esporte",
      resourceType: "atleta",
      filters: request.query,
      returnedCount: response.atletas.length,
    });

    return reply
      .status(200)
      .send({
        message: "Retrieved successfully",
        data: AtletaPresentation.MaskedList(response.atletas),
        count: response.count,
        ok: true,
      });
  };

  findCarteirinhas = async (
    request: FastifyRequest<{
      Querystring: QueryCarterinhaEsporteDto;
    }>,
    reply: FastifyReply,
  ) => {
    const response = await this.atletaService.findCarteirinhasEsporte(
      request.query,
    );
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.listed, {
      context: makeApplicationEventContext(request),
      module: "esporte",
      resourceType: "carterinha_esporte",
      filters: request.query,
      returnedCount: response.carterinhas.length,
    });

    return reply
      .status(200)
      .send({
        message: "Retrieved successfully",
        data: response.carterinhas,
        count: response.count,
        ok: true,
      });
  };

  findCarteirinhasByAtleta = async (
    request: FastifyRequest<{
      Params: { uuid: string };
      Querystring: QueryCarterinhaEsporteDto;
    }>,
    reply: FastifyReply,
  ) => {
    const response = await this.atletaService.findCarteirinhasByAtleta(
      request.params.uuid,
      request.query,
    );
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.listed, {
      context: makeApplicationEventContext(request),
      module: "esporte",
      resourceType: "carterinha_esporte",
      filters: { ...request.query, atletaUuid: request.params.uuid },
      returnedCount: response.carterinhas.length,
    });

    return reply
      .status(200)
      .send({
        message: "Retrieved successfully",
        data: response.carterinhas,
        count: response.count,
        ok: true,
      });
  };

  findOne = async (
    request: FastifyRequest<{ Params: { uuid: string } }>,
    reply: FastifyReply,
  ) => {
    const response = await this.atletaService.findOneAtleta(
      request.params.uuid,
    );
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.viewed, {
      context: makeApplicationEventContext(request),
      module: "esporte",
      resourceType: "atleta",
      resourceId: request.params.uuid,
    });

    return reply
      .status(200)
      .send({
        message: "Retrieved successfully",
        data: AtletaPresentation.Masked(response),
        ok: true,
      });
  };

  update = async (
    request: FastifyRequest<{
      Params: { uuid: string };
      Body: UpdateAtletaDto;
    }>,
    reply: FastifyReply,
  ) => {
    const before = await this.atletaService.findOneAtleta(request.params.uuid);
    const response = await this.atletaService.updateAtleta(
      request.params.uuid,
      request.body,
    );
    await esporteEventPublisher.publish(ESPORTE_EVENTS.atletaUpdated, {
      context: makeApplicationEventContext(request),
      resourceType: "atleta",
      before: atletaAuditSnapshot(before),
      after: atletaAuditSnapshot(response),
    });

    return reply
      .status(200)
      .send({
        message: "Updated successfully",
        data: AtletaPresentation.Masked(response),
        ok: true,
      });
  };

  addModalidade = async (
    request: FastifyRequest<{
      Params: { uuid: string };
      Body: AddModalidadeAtletaDto;
    }>,
    reply: FastifyReply,
  ) => {
    const before = await this.atletaService.findOneAtleta(request.params.uuid);
    const response = await this.atletaService.addModalidadeToAtleta(
      request.params.uuid,
      request.body,
    );
    await esporteEventPublisher.publish(ESPORTE_EVENTS.atletaModalidadesUpdated, {
      context: makeApplicationEventContext(request),
      before: atletaAuditSnapshot(before),
      after: atletaAuditSnapshot(response),
    });

    return reply
      .status(201)
      .send({
        message: "Modalidade linked successfully",
        data: AtletaPresentation.Masked(response),
        ok: true,
      });
  };

  removeModalidade = async (
    request: FastifyRequest<{
      Params: { uuid: string; modalidade_uuid: string };
    }>,
    reply: FastifyReply,
  ) => {
    const before = await this.atletaService.findOneAtleta(request.params.uuid);
    const deleted = await this.atletaService.removeModalidadeFromAtleta(
      request.params.uuid,
      request.params.modalidade_uuid,
    );
    const after = await this.atletaService.findOneAtleta(request.params.uuid);
    await esporteEventPublisher.publish(ESPORTE_EVENTS.atletaModalidadesUpdated, {
      context: makeApplicationEventContext(request),
      before: atletaAuditSnapshot(before),
      after: atletaAuditSnapshot(after),
    });

    return reply
      .status(200)
      .send({ message: "Modalidade unlinked successfully", data: { deleted }, ok: true });
  };

  delete = async (
    request: FastifyRequest<{ Params: { uuid: string } }>,
    reply: FastifyReply,
  ) => {
    const before = await this.atletaService.findOneAtleta(request.params.uuid);
    const deleted = await this.atletaService.deleteAtleta(request.params.uuid);
    await esporteEventPublisher.publish(ESPORTE_EVENTS.atletaDeleted, {
      context: makeApplicationEventContext(request),
      resourceType: "atleta",
      before: atletaAuditSnapshot(before),
    });

    return reply
      .status(200)
      .send({ message: "Deleted successfully", data: { deleted }, ok: true });
  };

  createCarteirinha = async (
    request: FastifyRequest<{
      Params: { uuid: string };
      Body: CreateCarteirinhaAtletaDto;
    }>,
    reply: FastifyReply,
  ) => {
    const response = await this.atletaService.createCarteirinha(
      request.params.uuid,
      request.user.id,
      request.body || {},
    );
    await esporteEventPublisher.publish(ESPORTE_EVENTS.carterinhaCreated, {
      context: makeApplicationEventContext(request),
      resourceType: "carterinha_esporte",
      after: carterinhaAuditSnapshot(response),
    });

    return reply
      .status(201)
      .send({
        message: "Carteirinha created successfully",
        data: response,
        ok: true,
      });
  };

  getCarteirinhaPdf = async (
    request: FastifyRequest<{ Params: { uuid: string } }>,
    reply: FastifyReply,
  ) => {
    const response = await this.atletaService.renderCarteirinhaPdf(
      request.params.uuid,
    );
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.exported, {
      context: makeApplicationEventContext(request),
      module: "esporte",
      resourceType: "carterinha_esporte",
      resourceId: request.params.uuid,
      returnedCount: 1,
    });

    reply.header("Content-Type", response.contentType);
    reply.header("Content-Disposition", response.contentDisposition);
    if (response.contentLength) {
      reply.header("Content-Length", response.contentLength);
    }

    return reply.status(200).send(response.file);
  };
}
