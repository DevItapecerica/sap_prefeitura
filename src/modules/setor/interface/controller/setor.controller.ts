import { FastifyReply, FastifyRequest } from "fastify";
import { ApplicationEventContext } from "../../../../core/event/application-event.js";
import { CreateSetorDto } from "../../application/dto/create-setor.dto.js";
import { UpdateSetorDto } from "../../application/dto/update-setor.dto.js";
import { makeCreateSetorUseCase } from "../../factories/make-create-setor-use-case.factory.js";
import { makeDeleteSetorUseCase } from "../../factories/make-delete-setor-use-case.factory.js";
import { makeGetSetorByIdUseCase } from "../../factories/make-get-setor-by-id-use-case.factory.js";
import { makeListSetoresUseCase } from "../../factories/make-list-setores-use-case.factory.js";
import { makeSetorEventPublisher } from "../../factories/make-setor-event-publisher.factory.js";
import { makeUpdateSetorUseCase } from "../../factories/make-update-setor-use-case.factory.js";

const eventContext = (request: FastifyRequest): ApplicationEventContext => ({
  correlationId: request.id,
  actor: {
    id: request.user.id,
    name: request.user.name,
    roleId: request.user.role_id,
    setorId: request.user.setor_id,
  },
  origin: {
    type: "HTTP",
    ip: request.ip,
    method: request.method,
    route: request.routeOptions.url ?? request.url.split("?")[0],
  },
});

const setorEventPublisher = makeSetorEventPublisher();

export default class SetorController {
  static getSetores = async (
    _request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const setores = await makeListSetoresUseCase().execute();
    reply.status(200).send({ setores });
  };

  static getOneSetor = async (
    request: FastifyRequest<{ Params: { id: number } }>,
    reply: FastifyReply,
  ) => {
    const setor = await makeGetSetorByIdUseCase().execute(
      Number(request.params.id),
    );
    reply.status(200).send({ setor });
  };

  static postSetor = async (
    request: FastifyRequest<{ Body: { setor: CreateSetorDto } }>,
    reply: FastifyReply,
  ) => {
    const setor = await makeCreateSetorUseCase().execute(request.body.setor);

    await setorEventPublisher.publishCreated({
      context: eventContext(request),
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

    await setorEventPublisher.publishUpdated({
      context: eventContext(request),
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

    await setorEventPublisher.publishDeleted({
      context: eventContext(request),
      before,
    });

    reply.status(204).send();
  };
}
