import { FastifyReply, FastifyRequest } from "fastify";
import { userParams, userRequired } from "../../types/userType.js";
import { sendPass } from "../../utils/sendPass.js";
import { generateRandomPassword } from "../../utils/generateRandomPassword.js";
import UserRepository from "./repository.js";
import AppError from "../../core/appError.js";
import { QueryParams } from "../../types/genericTypes.js";
import ValidateQueryOrder from "../../utils/ValidateQueryOrder.js";
import { ok } from "assert";
export default class UserService {
  private static valuesOrder = ["id", "name", "email", "createdAt"];

  static cadastrar = async (
    request: FastifyRequest<{ Body: { user: userRequired } }>,
    repply: FastifyReply,
  ) => {
    const { user } = request.body;

    request.log.info("Validando duplicidade de email");
    const userExists = await UserRepository.getByEmail(user.email);

    console.log(userExists);

    if (userExists) {
      request.log.info("Usuário com email ja cadastrado");
      const error = new AppError(
        "Usuário com email ja cadastrado",
        403,
        "USER_EMAIL_EXISTS",
      );
      throw error;
    }
    request.log.info("Usuário com email nao cadastrado");

    request.log.info("Gerando senha");
    const password = generateRandomPassword();

    request.log.info("Enviando senha");
    const hashedPassword = await sendPass(user.email, password);

    request.log.info("Criando usuário");
    const newUser = await UserRepository.create(user, hashedPassword);

    console.log(newUser.id);

    request.log.info(
      "Usuário criado com sucesso: " +
        newUser.id +
        " - " +
        newUser.name +
        " - por: " +
        request.user?.id,
    );
    repply
      .status(201)
      .send({ message: "Usuário criado com sucesso", id: newUser.id, ok: true });
  };

  static update = async (
    request: FastifyRequest<{
      Body: { user: userRequired };
      Params: { id: userParams };
    }>,
    repply: FastifyReply,
  ) => {
    const { id } = request.params;
    const { user } = request.body;

    request.log.info("Buscando usuário");
    const userExists = await UserRepository.getById(id);

    if (!userExists) {
      request.log.info("Usuário nao encontrado");

      const error = new AppError(
        "Usuário nao encontrado",
        404,
        "USER_NOT_FOUND",
      );

      throw error;
    }

    request.log.info("Usuário encontrado");

    request.log.info("Atualizando usuário");
    const updatedUser = await UserRepository.update(id, user);

    repply.status(200).send({
      message: "Usuário atualizado com sucesso",
      id: id,
      user: updatedUser,
    });
  };

  static getOne = async (
    request: FastifyRequest<{ Params: { id: userParams } }>,
    repply: FastifyReply,
  ) => {
    const { id } = request.params;

    request.log.info("Buscando usuário");
    const user = await UserRepository.getById(id);

    if (!user) {
      request.log.info("Usuário nao encontrado");

      const error = new AppError(
        "Usuário nao encontrado",
        404,
        "USER_NOT_FOUND",
      );

      throw error;
    }

    request.log.info("Usuário encontrado");
    repply.status(200).send({ user, message: "Usuário encontrado", ok: true });
  };

  static getAllByQuery = async (
    request: FastifyRequest<{ Querystring: QueryParams }>,
    repply: FastifyReply,
  ) => {
    const {
      search,
      page = 1,
      limit = 10,
      order = "createdAt:desc",
    } = request.query;

    if (page < 1) {
      request.log.info("Pagina invalida");
      const error = new AppError("Pagina invalida", 400, "INVALID_PAGE");
      throw error;
    }

    const isValidQuery = await ValidateQueryOrder(order, this.valuesOrder);

    if (!isValidQuery) {
      request.log.info("Ordem de busca invalida");
      const error = new AppError(
        "Ordem de busca invalida",
        400,
        "INVALID_QUERY_ORDER",
      );
      throw error;
    }

    const q = {
      search,
      page: Number(page) - 1,
      limit,
      order,
    };

    request.log.info("Buscando usuários");
    const response = await UserRepository.getAll(q);

    request.log.info("Usuários encontrados");
    repply
      .status(200)
      .send({ message: "Usuários encontrados", ...response, ok: true });
  };

  static delete = async (
    request: FastifyRequest<{ Params: { id: userParams } }>,
    repply: FastifyReply,
  ) => {
    const { id } = request.params;

    const user = await UserRepository.getById(id);

    if (!user) {
      request.log.info("Usuário nao encontrado");
      const error = new AppError(
        "Usuário nao encontrado",
        404,
        "USER_NOT_FOUND",
      );
      throw error;
    }

    request.log.info("Deletando usuário");
    await UserRepository.delete(id);

    request.log.info("Usuário deletado com sucesso");
    repply.status(200).send({
      message: "Usuário deletado com sucesso",
      ok: true,
    });
  };
}
