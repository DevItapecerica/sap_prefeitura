import { FastifyReply, FastifyRequest } from "fastify";
import { userParams, userRequired } from "../../application/dto/user.dto.js";
import { QueryParams } from "../../../../core/types/genericTypes.js";
import { UserServiceFactory } from "../../factories/user-service.factory.js";
import { ApplicationEventContext } from "../../../../core/event/application-event.js";
import { userEventPublisher } from "../../application/events/user.events.js";

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

export default class UserController {
  static cadastrar = async (
    request: FastifyRequest<{ Body: { user: userRequired } }>,
    repply: FastifyReply,
  ) => {
    const { user } = request.body;
    const service = UserServiceFactory(request.log);

    const newUser = await service.cadastrar(user);

    await userEventPublisher.publishCreated({
      context: eventContext(request),
      user: newUser,
    });

    request.log.info(
      "Usuário criado com sucesso: " +
        newUser.id +
        " - " +
        newUser.name +
        " - por: " +
        request.user?.id,
    );

    repply.status(201).send({
      message: "Usuário criado com sucesso",
      user: newUser,
      ok: true,
    });
  };

  static update = async (
    request: FastifyRequest<{
      Body: { user: userRequired };
      Params: { id: userParams };
    }>,
    repply: FastifyReply,
  ) => {
    const service = UserServiceFactory(request.log);

    const { id } = request.params;
    const { user } = request.body;

    const { before, after } = await service.update(user, id);

    await userEventPublisher.publishUpdated({
      context: eventContext(request),
      before,
      after,
    });

    repply.status(200).send({
      message: "Usuário atualizado com sucesso",
      user: after,
      ok: true,
    });
  };

  static getOne = async (
    request: FastifyRequest<{ Params: { id: userParams } }>,
    repply: FastifyReply,
  ) => {
    const service = UserServiceFactory(request.log);

    const { id } = request.params;

    const user = await service.getOne(id);

    repply.status(200).send({ user, message: "Usuário encontrado", ok: true });
  };

  static getAllByQuery = async (
    request: FastifyRequest<{ Querystring: QueryParams }>,
    repply: FastifyReply,
  ) => {
    const service = UserServiceFactory(request.log);

    const query = {
      page: request.query.page,
      limit: request.query.limit,
      search: request.query.search,
      order: request.query.order,
      setorId: request.query.setorId,
    };

    const response = await service.getAllByQuery(query);

    repply
      .status(200)
      .send({
        message: "Usuários encontrados",
        count: response.count,
        user: response.user,
        ok: true,
      });
  };

  static delete = async (
    request: FastifyRequest<{ Params: { id: userParams } }>,
    repply: FastifyReply,
  ) => {
    const service = UserServiceFactory(request.log);

    const { id } = request.params;

    const { before } = await service.delete(id);

    await userEventPublisher.publishDeleted({
      context: eventContext(request),
      before,
    });

    repply.status(200).send({
      message: "Usuário deletado com sucesso",
      id: id,
      ok: true,
    });
  };

  static alterPassword = async (request: FastifyRequest<{Body:{old_password: string; new_password: string}}>, reply: FastifyReply) => {
    const user = request.user
    const service = UserServiceFactory(request.log);
    const { new_password, old_password } = request.body;
    await service.alterPassword(Number(user.id), old_password, new_password);
    await userEventPublisher.publishPasswordChanged({
      context: eventContext(request),
      userId: user.id,
    });
    reply.status(200).send({message: "Senha alterada com sucesso", ok: true});
  };
}
