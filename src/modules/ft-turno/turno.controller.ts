import { FastifyReply, FastifyRequest } from "fastify";
import { RESOURCE_READ_EVENTS } from "../../core/event/resource-read.events.js";
import { makeResourceReadEventPublisher } from "../../factories/resource-read-events.factory.js";
import { makeApplicationEventContext } from "../../infra/http/fastify/application-event-context.js";
import { TURNO_EVENTS } from "./application/turno.events.js";
import { TurnoInput, TurnoQuery } from "./domain/turno.js";
import { makeTurnoEventPublisher, makeTurnoService } from "./turno.factory.js";

const service = makeTurnoService();
const events = makeTurnoEventPublisher();
const reads = makeResourceReadEventPublisher();
const plain = (value: any) => value?.toJSON?.() ?? value;

export class TurnoController {
  static list = async (request: FastifyRequest<{ Querystring: TurnoQuery }>, reply: FastifyReply) => {
    const { rows, count } = await service.list(request.query);
    await reads.publish(RESOURCE_READ_EVENTS.listed, { context: makeApplicationEventContext(request), module: "ft-turno", resourceType: "turno", filters: request.query, returnedCount: rows.length });
    return reply.send({ turnos: rows, count });
  };
  static get = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const turno = await service.get(request.params.id);
    await reads.publish(RESOURCE_READ_EVENTS.viewed, { context: makeApplicationEventContext(request), module: "ft-turno", resourceType: "turno", resourceId: request.params.id });
    return reply.send({ turno });
  };
  static create = async (request: FastifyRequest<{ Body: { turno: TurnoInput } }>, reply: FastifyReply) => {
    const turno = await service.create(request.body.turno);
    await events.publish(TURNO_EVENTS.created, { context: makeApplicationEventContext(request), after: plain(turno) });
    return reply.status(201).send({ turno });
  };
  static update = async (request: FastifyRequest<{ Params: { id: string }; Body: { turno: TurnoInput } }>, reply: FastifyReply) => {
    const { before, after } = await service.update(request.params.id, request.body.turno);
    await events.publish(TURNO_EVENTS.updated, { context: makeApplicationEventContext(request), before, after: plain(after) });
    return reply.send({ turno: after });
  };
  static delete = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const before = await service.delete(request.params.id);
    await events.publish(TURNO_EVENTS.deleted, { context: makeApplicationEventContext(request), before, resourceId: request.params.id });
    return reply.status(204).send();
  };
}
