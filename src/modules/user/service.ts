import { FastifyReply, FastifyRequest } from "fastify";
import { userParams, userRequired } from "../../types/userType.js";
import { GenAndSendPass } from "../../utils/GenAndSendPass.js";
import { generateRandomPassword } from "../../utils/generateRandomPassword.js";
import UserRepository from "./repository.js";
import AppError from "../../core/appError.js";

export default class UserService {
  static cadastrar = async (request: FastifyRequest<{ Body: {user: userRequired} }>, repply: FastifyReply) => {
    const { user } = request.body;

    request.log.info("Gerando senha");
    const password = generateRandomPassword() 
    
    request.log.info("Enviando senha");
    const hashedPassword = await GenAndSendPass(user.email, password);

    request.log.info("Criando usuário");
    const newUser = await UserRepository.create(user, hashedPassword);

    request.log.info("Usuário criado com sucesso");
    repply.status(201).send({ message: "Usuário criado com sucesso", id: newUser.id });
  };

  static getOne = async (request: FastifyRequest<{ Params: { id: userParams } }>, repply: FastifyReply) => {
    const { id } = request.params;

    request.log.info("Buscando usuário");
    const user = await UserRepository.getById(id);

    if (!user) {
      request.log.info("Usuário nao encontrado");

      const error = new AppError("Usuário nao encontrado", 404, "USER_NOT_FOUND"); 

      throw error;
    }

    request.log.info("Usuário encontrado");
    repply.status(200).send({ user });
  };
}
