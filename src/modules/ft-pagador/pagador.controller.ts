import { FastifyReply, FastifyRequest } from "fastify";
import { makeApplicationEventContext } from "../../infra/http/fastify/application-event-context.js";
import { makeResourceReadEventPublisher } from "../../factories/resource-read-events.factory.js";
import { RESOURCE_READ_EVENTS } from "../../core/event/resource-read.events.js";
import { PagadorInput, PagadorQuery } from "./domain/pagador.js";
import { PAGADOR_EVENTS } from "./application/pagador.events.js";
import {
  makePagadorEventPublisher,
  makePagadorService,
} from "./pagador.factory.js";

const service = makePagadorService();
const events = makePagadorEventPublisher();
const reads = makeResourceReadEventPublisher();
const plain = (value: any) => value?.toJSON?.() ?? value;

export class PagadorController {
  static list = async (
    request: FastifyRequest<{ Querystring: PagadorQuery }>,
    reply: FastifyReply,
  ) => {
    const { rows, count } = await service.list(request.query);
    await reads.publish(RESOURCE_READ_EVENTS.listed, {
      context: makeApplicationEventContext(request),
      module: "ft-pagador",
      resourceType: "pagador",
      filters: request.query,
      returnedCount: rows.length,
    });
    return reply.send({ pagadores: rows, count });
  };
  static capacity = async (
    request: FastifyRequest<{ Params: { editalId: string } }>,
    reply: FastifyReply,
  ) => {
    const pagadores = await service.listCapacityByEdital(
      request.params.editalId,
    );
    await reads.publish(RESOURCE_READ_EVENTS.listed, {
      context: makeApplicationEventContext(request),
      module: "ft-pagador",
      resourceType: "pagador_capacidade",
      filters: { editalId: request.params.editalId },
      returnedCount: pagadores.length,
    });
    return reply.send({ pagadores });
  };
  static get = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const pagador = await service.get(request.params.id);
    await reads.publish(RESOURCE_READ_EVENTS.viewed, {
      context: makeApplicationEventContext(request),
      module: "ft-pagador",
      resourceType: "pagador",
      resourceId: request.params.id,
    });
    return reply.send({ pagador });
  };
  static create = async (
    request: FastifyRequest<{ Body: { pagador: PagadorInput } }>,
    reply: FastifyReply,
  ) => {
    const pagador = await service.create(request.body.pagador);
    await events.publish(PAGADOR_EVENTS.created, {
      context: makeApplicationEventContext(request),
      after: plain(pagador),
    });
    return reply.status(201).send({ pagador });
  };
  static update = async (
    request: FastifyRequest<{
      Params: { id: string };
      Body: { pagador: PagadorInput };
    }>,
    reply: FastifyReply,
  ) => {
    const { before, after } = await service.update(
      request.params.id,
      request.body.pagador,
    );
    await events.publish(PAGADOR_EVENTS.updated, {
      context: makeApplicationEventContext(request),
      before,
      after: plain(after),
    });
    return reply.send({ pagador: after });
  };
  static delete = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const before = await service.delete(request.params.id);
    await events.publish(PAGADOR_EVENTS.deleted, {
      context: makeApplicationEventContext(request),
      before,
      resourceId: request.params.id,
    });
    return reply.status(204).send();
  };
}
