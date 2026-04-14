import { FastifyReply, FastifyRequest } from "fastify";
import { userParams, userRequired } from "./types.js";
import UserService from "./user.service.js";
import { QueryParams } from "../../core/shared/types/genericTypes.js";
import { SequelizeUserRepository } from "../../infra/database/sequelize/repositories/sequelize.user.repository.js";

export default class UserController {

  static cadastrar = async (
    request: FastifyRequest<{ Body: { user: userRequired } }>,
    repply: FastifyReply,
  ) => {
    const service = new UserService(new SequelizeUserRepository(), request.log);
    const { user } = request.body;

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
      id: newUser.id,
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
    const service = new UserService(new SequelizeUserRepository(), request.log);

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
    const service = new UserService(new SequelizeUserRepository(), request.log);
    const { id } = request.params;

    const user = await service.getOne(id);

    repply.status(200).send({ user, message: "Usuário encontrado", ok: true });
  };

  static getAllByQuery = async (
    request: FastifyRequest<{ Querystring: QueryParams }>,
    repply: FastifyReply,
  ) => {
    const service = new UserService(new SequelizeUserRepository(), request.log);

    const query = request.query;

    const response = await service.getAllByQuery(query);

    repply
      .status(200)
      .send({ message: "Usuários encontrados", count: response.count, user: response.user, ok: true });
  };

  static delete = async (
    request: FastifyRequest<{ Params: { id: userParams } }>,
    repply: FastifyReply,
  ) => {
    const service = new UserService(new SequelizeUserRepository(), request.log);
    const { id } = request.params;

    await service.delete(id);

    repply.status(200).send({
      message: "Usuário deletado com sucesso",
      id: id,
      ok: true,
    });
  };
}
