import { FastifyReply, FastifyRequest } from "fastify";
import {
  userParams,
  userRequired,
  userResponse,
  userResponseAll,
} from "./types.js";
import { sendPass } from "../../core/utils/sendPass.js";
import { generateRandomPassword } from "../../core/utils/generateRandomPassword.js";
import UserRepository from "./repository.js";
import AppError from "../../core/appError.js";
import { QueryParams } from "../../types/genericTypes.js";
import ValidateQueryOrder from "../../core/utils/ValidateQueryOrder.js";
export default class UserService {
  constructor(
    private userRepository: UserRepository,
    private logger: any,
  ) {}

  private valuesOrder = ["id", "name", "email", "createdAt"];

  cadastrar = async (user: userRequired): Promise<userResponse> => {
    this.logger.info("Validando duplicidade de email");
    const userEmailExists = await this.userRepository.getByEmail(user.email);

    if (userEmailExists) {
      this.logger.info("Usuário com email ja cadastrado");
      const error = new AppError(
        "Usuário com email ja cadastrado",
        403,
        "USER_EMAIL_EXISTS",
      );
      throw error;
    }

    this.logger.info("Usuário com email nao cadastrado");

    this.logger.info("Gerando senha");
    const password = generateRandomPassword();

    this.logger.info("Enviando senha");
    const hashedPassword = await sendPass(user.email, password);

    this.logger.info("Criando usuário");
    const newUser = await this.userRepository.create(user, hashedPassword);

    return newUser;
  };

  update = async (
    user: userRequired,
    id: userParams,
  ): Promise<userResponse> => {
    this.logger.info("Validando duplicidade de email");
    const userEmailExists = await this.userRepository.getByEmail(user.email, id);

    if (userEmailExists) {
      this.logger.info("Usuário com email ja cadastrado");
      const error = new AppError(
        "Usuário com email ja cadastrado",
        403,
        "USER_EMAIL_EXISTS",
      );
      throw error;
    }

    this.logger.info("Buscando usuário");
    const userExists = await this.userRepository.getById(id);

    if (!userExists) {
      this.logger.info("Usuário nao encontrado");

      const error = new AppError(
        "Usuário nao encontrado",
        404,
        "USER_NOT_FOUND",
      );

      throw error;
    }

    this.logger.info("Usuário encontrado");

    this.logger.info("Atualizando usuário");
    const updatedUser = await this.userRepository.update(id, user);

    return updatedUser;
  };

  getOne = async (id: userParams): Promise<userResponse> => {
    this.logger.info("Buscando usuário");
    const user = await this.userRepository.getById(id);

    if (!user) {
      this.logger.info("Usuário nao encontrado");

      const error = new AppError(
        "Usuário nao encontrado",
        404,
        "USER_NOT_FOUND",
      );

      throw error;
    }

    this.logger.info("Usuário encontrado");

    return user;
  };

  getAllByQuery = async (query: QueryParams): Promise<userResponseAll> => {
    const { search, page = 1, limit = 10, order = "createdAt:desc" } = query;

    if (page < 1) {
      this.logger.info("Pagina invalida");
      const error = new AppError("Pagina invalida", 400, "INVALID_PAGE");
      throw error;
    }

    const isValidQuery = await ValidateQueryOrder(order, this.valuesOrder);

    if (!isValidQuery) {
      this.logger.info("Ordem de busca invalida");
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

    this.logger.info("Buscando usuários");
    const response = await this.userRepository.getAll(q);

    this.logger.info("Usuários encontrados");
    return response;
  };

  delete = async (id: userParams): Promise<boolean> => {
    const user = await this.userRepository.getById(id);

    if (!user) {
      this.logger.info("Usuário nao encontrado");
      const error = new AppError(
        "Usuário nao encontrado",
        404,
        "USER_NOT_FOUND",
      );
      throw error;
    }

    this.logger.info("Deletando usuário");
    await this.userRepository.delete(id);

    this.logger.info("Usuário deletado com sucesso");
    return true;
  };
}
