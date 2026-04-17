import { userParams, userRequired } from "../dto/user.dto.js";
import { sendPass } from "../../../../core/shared/utils/sendPass.js";
import { generateRandomPassword } from "../../../../core/shared/utils/generateRandomPassword.js";
import UserRepository from "../../domain/repository/user.repository.js";
import AppError from "../../../../core/appError.js";
import ValidateQueryOrder from "../../../../core/shared/utils/ValidateQueryOrder.js";
import { QueryParams } from "../../../../core/shared/types/genericTypes.js";
import { User } from "../../domain/entity/User.js";
import { EmailPolicyService } from "../../domain/services/email-policy.service.js";
export default class UserService {
  constructor(
    private userRepository: UserRepository,
    private emailPolicyService: EmailPolicyService,
    private logger: any,
  ) {}

  private valuesOrder = ["id", "name", "email", "createdAt"];

  cadastrar = async (data: userRequired): Promise<User> => {
    const user = new User(
      data.name,
      data.email,
      data.ramal,
      data.setor_id,
      data.role_id,
    );

    this.logger.info("Validando duplicidade de email");
    const userEmailExists = await this.userRepository.getUserByEmail(
      user.email,
    );

    if (userEmailExists) {
      this.logger.info("Usuário com email ja cadastrado");
      const error = new AppError(
        "Usuário com email ja cadastrado",
        403,
        "USER_EMAIL_EXISTS",
      );
      throw error;
    }

    this.logger.info("Validando email");
    if (!user.IsValidEmail) {
      this.logger.info("Email invalido");
      const error = new AppError("Email invalido", 403, "USER_EMAIL_INVALID");
      throw error;
    }

    this.logger.info("Validando email institucional");
    if (!this.emailPolicyService.isInstitutional(user.email)) {
      this.logger.info("Email nao institucional");
      throw new AppError(
        "Email nao institucional",
        403,
        "USER_EMAIL_INSTITUTIONAL",
      );
    }

    this.logger.info("Usuário com email nao cadastrado");

    this.logger.info("Gerando senha");
    const password = generateRandomPassword();

    this.logger.info("Enviando senha");
    const hashedPassword = await sendPass(user.email, password);

    this.logger.info("Criando usuário");
    const newUser = await this.userRepository.createUser(user, hashedPassword);

    return newUser;
  };

  update = async (data: userRequired, id: userParams): Promise<User> => {
    this.logger.info("Validando duplicidade de email");
    const user = new User(
      data.name,
      data.email,
      data.ramal,
      data.setor_id,
      data.role_id,
    );

    const userEmailExists = await this.userRepository.getUserByEmail(
      user.email,
      id,
    );

    if (userEmailExists) {
      this.logger.info("Usuário com email ja cadastrado");
      const error = new AppError(
        "Usuário com email ja cadastrado",
        403,
        "USER_EMAIL_EXISTS",
      );
      throw error;
    }

    this.logger.info("Validando email");
    if (!user.IsValidEmail) {
      this.logger.info("Email invalido");
      const error = new AppError("Email invalido", 403, "USER_EMAIL_INVALID");
      throw error;
    }

    this.logger.info("Validando email institucional");
    if (!this.emailPolicyService.isInstitutional(user.email)) {
      this.logger.info("Email nao institucional");
      throw new AppError(
        "Email nao institucional",
        403,
        "USER_EMAIL_INSTITUTIONAL",
      );
    }

    this.logger.info("Buscando usuário");
    const userExists = await this.userRepository.getUserById(id);

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
    const updatedUser = await this.userRepository.updateUser(id, user);

    return updatedUser;
  };

  getOne = async (id: userParams): Promise<User> => {
    this.logger.info("Buscando usuário");
    const user = await this.userRepository.getUserById(id);

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

  getAllByQuery = async (
    query: QueryParams,
  ): Promise<{ user: User[]; count: number }> => {
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
    const response = await this.userRepository.getAllUser(q);

    this.logger.info("Usuários encontrados");
    return response;
  };

  delete = async (id: userParams): Promise<boolean> => {
    const user = await this.userRepository.getUserById(id);

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
    await this.userRepository.deleteUser(id);

    this.logger.info("Usuário deletado com sucesso");
    return true;
  };

  getUserByEmail = async (email: string): Promise<User | null> => {
    this.logger.info("Buscando usuário por email");
    const user = await this.userRepository.getUserByEmail(email);
    return user;
  };
}
