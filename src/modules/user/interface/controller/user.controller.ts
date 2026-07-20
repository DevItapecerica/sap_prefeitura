import { FastifyReply, FastifyRequest } from "fastify";
import { ChangeUserPasswordDto } from "../../application/dto/change-user-password.dto.js";
import { CreateUserDto } from "../../application/dto/create-user.dto.js";
import { ListUsersDto } from "../../application/dto/list-users.dto.js";
import { UpdateUserDto } from "../../application/dto/update-user.dto.js";
import { ApplicationEventContext } from "../../../../core/event/application-event.js";
import { makeChangeUserPasswordUseCase } from "../../factories/make-change-user-password-use-case.factory.js";
import { makeCreateUserUseCase } from "../../factories/make-create-user-use-case.factory.js";
import { makeDeleteUserUseCase } from "../../factories/make-delete-user-use-case.factory.js";
import { makeGetUserByIdUseCase } from "../../factories/make-get-user-by-id-use-case.factory.js";
import { makeListUsersUseCase } from "../../factories/make-list-users-use-case.factory.js";
import { makeUpdateUserUseCase } from "../../factories/make-update-user-use-case.factory.js";
import { makeUserEventPublisher } from "../../factories/make-user-event-publisher.factory.js";

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

const userEventPublisher = makeUserEventPublisher();

export default class UserController {
  static cadastrar = async (
    request: FastifyRequest<{ Body: { user: CreateUserDto } }>,
    repply: FastifyReply,
  ) => {
    const { user } = request.body;
    const newUser = await makeCreateUserUseCase().execute(user);

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
      Body: { user: UpdateUserDto };
      Params: { id: number };
    }>,
    repply: FastifyReply,
  ) => {
    const { id } = request.params;
    const { user } = request.body;

    const { before, after } = await makeUpdateUserUseCase().execute(id, user);

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
    request: FastifyRequest<{ Params: { id: number } }>,
    repply: FastifyReply,
  ) => {
    const { id } = request.params;
    const user = await makeGetUserByIdUseCase().execute(id);

    repply.status(200).send({ user, message: "Usuário encontrado", ok: true });
  };

  static getAllByQuery = async (
    request: FastifyRequest<{ Querystring: ListUsersDto }>,
    repply: FastifyReply,
  ) => {
    const query = {
      page: request.query.page,
      limit: request.query.limit,
      search: request.query.search,
      order: request.query.order,
      setorId: request.query.setorId,
    };

    const response = await makeListUsersUseCase().execute(query);

    repply.status(200).send({
      message: "Usuários encontrados",
      count: response.count,
      user: response.user,
      ok: true,
    });
  };

  static delete = async (
    request: FastifyRequest<{ Params: { id: number } }>,
    repply: FastifyReply,
  ) => {
    const { id } = request.params;

    const { before } = await makeDeleteUserUseCase().execute(id);

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

  static alterPassword = async (
    request: FastifyRequest<{
      Body: ChangeUserPasswordDto;
    }>,
    reply: FastifyReply,
  ) => {
    const user = request.user;
    const { new_password, old_password } = request.body;
    await makeChangeUserPasswordUseCase().execute(
      Number(user.id),
      old_password,
      new_password,
    );
    await userEventPublisher.publishPasswordChanged({
      context: eventContext(request),
      userId: user.id,
    });
    reply.status(200).send({
      message: "Senha alterada com sucesso",
      ok: true,
    });
  };
}
