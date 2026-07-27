import { FastifyReply, FastifyRequest } from "fastify";
import { makeApplicationEventContext } from "../../../../infra/http/fastify/application-event-context.js";
import { makeResourceReadEventPublisher } from "../../../../factories/resource-read-events.factory.js";
import { RESOURCE_READ_EVENTS } from "../../../../core/event/resource-read.events.js";
import { SETOR_EVENTS } from "../../application/events/setor.events.js";
import { CreateSetorDto } from "../../application/dto/create-setor.dto.js";
import { UpdateSetorDto } from "../../application/dto/update-setor.dto.js";
import {
  makeCreateSetorUseCase,
  makeDeleteSetorUseCase,
  makeGetSetorByIdUseCase,
  makeListSetoresUseCase,
  makeSetorEventPublisher,
  makeUpdateSetorUseCase,
} from "../../factories/setor.factories.js";

const setorEventPublisher = makeSetorEventPublisher();
const resourceReadEventPublisher = makeResourceReadEventPublisher();

export default class SetorController {
  static getSetores = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const setores = await makeListSetoresUseCase().execute();
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.listed, {
      context: makeApplicationEventContext(request),
      module: "setor",
      resourceType: "setor",
      returnedCount: setores.length,
    });
    reply.status(200).send({ setores });
  };

  static getOneSetor = async (
    request: FastifyRequest<{ Params: { id: number } }>,
    reply: FastifyReply,
  ) => {
    const setor = await makeGetSetorByIdUseCase().execute(
      Number(request.params.id),
    );
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.viewed, {
      context: makeApplicationEventContext(request),
      module: "setor",
      resourceType: "setor",
      resourceId: String(request.params.id),
    });
    reply.status(200).send({ setor });
  };

  static postSetor = async (
    request: FastifyRequest<{ Body: { setor: CreateSetorDto } }>,
    reply: FastifyReply,
  ) => {
    const setor = await makeCreateSetorUseCase().execute(request.body.setor);

    await setorEventPublisher.publish(SETOR_EVENTS.created, {
      context: makeApplicationEventContext(request),
      setor,
    });

    reply.status(201).send({ setor });
  };

  static updateSetor = async (
    request: FastifyRequest<{
      Params: { id: number };
      Body: { setor: UpdateSetorDto };
    }>,
    reply: FastifyReply,
  ) => {
    const { before, after } = await makeUpdateSetorUseCase().execute(
      Number(request.params.id),
      request.body.setor,
    );

    await setorEventPublisher.publish(SETOR_EVENTS.updated, {
      context: makeApplicationEventContext(request),
      before,
      after,
    });

    reply.status(200).send({
      message: "Setor atualizado com sucesso",
      setor: after,
      ok: true,
    });
  };

  static deleteSetor = async (
    request: FastifyRequest<{ Params: { id: number } }>,
    reply: FastifyReply,
  ) => {
    const { before } = await makeDeleteSetorUseCase().execute(
      Number(request.params.id),
    );

    await setorEventPublisher.publish(SETOR_EVENTS.deleted, {
      context: makeApplicationEventContext(request),
      before,
    });

    reply.status(204).send();
  };
}
