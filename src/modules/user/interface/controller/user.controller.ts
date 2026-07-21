import { FastifyReply, FastifyRequest } from "fastify";
import { makeApplicationEventContext } from "../../../../infra/http/fastify/application-event-context.js";
import { ChangeUserPasswordDto } from "../../application/dto/change-user-password.dto.js";
import { CreateUserDto } from "../../application/dto/create-user.dto.js";
import { ListUsersDto } from "../../application/dto/list-users.dto.js";
import { UpdateUserDto } from "../../application/dto/update-user.dto.js";
import {
  makeChangeUserPasswordUseCase,
  makeCreateUserUseCase,
  makeDeleteUserUseCase,
  makeGetUserByIdUseCase,
  makeListUsersUseCase,
  makeUpdateUserUseCase,
  makeUserEventPublisher,
} from "../../factories/user.factories.js";

const userEventPublisher = makeUserEventPublisher();

export default class UserController {
  static cadastrar = async (
    request: FastifyRequest<{ Body: { user: CreateUserDto } }>,
    repply: FastifyReply,
  ) => {
    const { user } = request.body;
    const newUser = await makeCreateUserUseCase().execute(user);

    await userEventPublisher.publishCreated({
      context: makeApplicationEventContext(request),
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
      context: makeApplicationEventContext(request),
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
      context: makeApplicationEventContext(request),
      before,
    });

    repply.status(200).send({
      message: "Usuário deletado com sucesso",
      id: id,
      ok: true,
    });
  };

  static readonly alterPassword = async (
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
      context: makeApplicationEventContext(request),
      userId: user.id,
    });
    reply.status(200).send({
      message: "Senha alterada com sucesso",
      ok: true,
    });
  };
}
