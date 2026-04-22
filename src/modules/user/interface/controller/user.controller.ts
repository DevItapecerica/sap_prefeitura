import { FastifyReply, FastifyRequest } from "fastify";
import { userParams, userRequired } from "../../application/dto/user.dto.js";
import { QueryParams } from "../../../../core/shared/types/genericTypes.js";
import { UserServiceFactory } from "../../factories/user-service.factory.js";

export default class UserController {
  static cadastrar = async (
    request: FastifyRequest<{ Body: { user: userRequired } }>,
    repply: FastifyReply,
  ) => {
    const { user } = request.body;
    const service = UserServiceFactory(request.log);

    const newUser = await service.cadastrar(user);

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

    const updatedUser = await service.update(user, id);

    repply.status(200).send({
      message: "Usuário atualizado com sucesso",
      user: updatedUser,
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
      order: request.query.order
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

    await service.delete(id);

    repply.status(200).send({
      message: "Usuário deletado com sucesso",
      id: id,
      ok: true,
    });
  };
}
