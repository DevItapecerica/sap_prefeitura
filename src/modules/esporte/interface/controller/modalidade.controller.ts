import { FastifyReply, FastifyRequest } from "fastify";
import ModalidadeService from "../../application/use-case/modalidade.service.js";
import {
  CreateModalidadeDto,
  QueryModalidadeDto,
  UpdateModalidadeDto,
} from "../../application/dto/modalidade.dto.js";
import { makeResourceReadEventPublisher } from "../../../../factories/resource-read-events.factory.js";
import { makeApplicationEventContext } from "../../../../infra/http/fastify/application-event-context.js";
import { makeEsporteEventPublisher } from "../../factories/esporte-events.factory.js";
import { RESOURCE_READ_EVENTS } from "../../../../core/event/resource-read.events.js";
import { ESPORTE_EVENTS } from "../../application/events/esporte.events.js";
import { modalidadeAuditSnapshot } from "../../application/utils/esporte-audit-snapshot.js";

const resourceReadEventPublisher = makeResourceReadEventPublisher();
const esporteEventPublisher = makeEsporteEventPublisher();

export default class ModalidadeController {
  constructor(private modalidadeService: ModalidadeService) {}

  create = async (
    request: FastifyRequest<{ Body: CreateModalidadeDto }>,
    reply: FastifyReply,
  ) => {
    const response = await this.modalidadeService.createModalidade(
      request.body,
    );
    await esporteEventPublisher.publish(ESPORTE_EVENTS.modalidadeCreated, {
      context: makeApplicationEventContext(request),
      resourceType: "modalidade",
      after: modalidadeAuditSnapshot(response),
    });

    return reply.status(201).send({
      message: "Created successfully",
      data: response,
      ok: true,
    });
  };

  findAll = async (
    request: FastifyRequest<{ Querystring: QueryModalidadeDto }>,
    reply: FastifyReply,
  ) => {
    const response = await this.modalidadeService.findAllModalidades(
      request.query,
    );
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.listed, {
      context: makeApplicationEventContext(request),
      module: "esporte",
      resourceType: "modalidade",
      filters: request.query,
      returnedCount: response.modalidades.length,
    });

    return reply.status(200).send({
      message: "Retrieved successfully",
      data: response.modalidades,
      count: response.count,
      ok: true,
    });
  };

  findOne = async (
    request: FastifyRequest<{ Params: { uuid: string } }>,
    reply: FastifyReply,
  ) => {
    const response = await this.modalidadeService.findOneModalidade(
      request.params.uuid,
    );
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.viewed, {
      context: makeApplicationEventContext(request),
      module: "esporte",
      resourceType: "modalidade",
      resourceId: request.params.uuid,
    });

    return reply.status(200).send({
      message: "Retrieved successfully",
      data: response,
      ok: true,
    });
  };

  update = async (
    request: FastifyRequest<{
      Params: { uuid: string };
      Body: UpdateModalidadeDto;
    }>,
    reply: FastifyReply,
  ) => {
    const before = await this.modalidadeService.findOneModalidade(
      request.params.uuid,
    );
    const response = await this.modalidadeService.updateModalidade(
      request.params.uuid,
      request.body,
    );
    await esporteEventPublisher.publish(ESPORTE_EVENTS.modalidadeUpdated, {
      context: makeApplicationEventContext(request),
      resourceType: "modalidade",
      before: modalidadeAuditSnapshot(before),
      after: modalidadeAuditSnapshot(response),
    });

    return reply.status(200).send({
      message: "Updated successfully",
      data: response,
      ok: true,
    });
  };

  delete = async (
    request: FastifyRequest<{ Params: { uuid: string } }>,
    reply: FastifyReply,
  ) => {
    const before = await this.modalidadeService.findOneModalidade(
      request.params.uuid,
    );
    const deleted = await this.modalidadeService.deleteModalidade(
      request.params.uuid,
    );
    await esporteEventPublisher.publish(ESPORTE_EVENTS.modalidadeDeleted, {
      context: makeApplicationEventContext(request),
      resourceType: "modalidade",
      before: modalidadeAuditSnapshot(before),
    });

    return reply
      .status(200)
      .send({ message: "Deleted successfully", data: { deleted }, ok: true });
  };
}
