import AppError from "../../../../core/appError.js";
import { IAesCrypt } from "../../../../core/security/aes/AesCrypt.interface.js";
import { ISha256Crypt } from "../../../../core/security/sha256/sha256.interface.js";
import Municipe from "../../domain/entity/Municipe.js";
import IMunicipeRepository from "../../domain/repositories/Municipe.repository.js";
import { MunicipeDto } from "../dto/municipe.dto.js";
import { MunicipeMapper } from "../mapper/municipe.mapper.js";
import MunicipePolicy from "../../domain/service/municipePolicy.service.js";
import { MunicipeIdentityConflictError } from "../../domain/errors/municipe-identity-conflict.error.js";

export default class createMunicipeUseCase {
  constructor(
    private municipeRepository: IMunicipeRepository,
    private aesCrypt: IAesCrypt,
    private sha256Crypt: ISha256Crypt,
  ) {}

  async execute(municipe: MunicipeDto, author: string) {
    const cpf = MunicipePolicy.normalizeCpf(municipe.cpf);
    const cep = MunicipePolicy.normalizeCep(municipe.cep);
    if (!MunicipePolicy.cpfIsValid(cpf)) {
      throw new AppError("CPF invalido", 422, "INVALID_CPF");
    }
    if (!MunicipePolicy.cepIsValid(cep)) {
      throw new AppError("CEP invalido", 422, "INVALID_CEP");
    }
    if (!MunicipePolicy.birthDateIsValid(municipe.nascimento)) {
      throw new AppError("Data de nascimento invalida", 422, "INVALID_BIRTH_DATE");
    }
    if (!MunicipePolicy.ufIsValid(municipe.uf)) {
      throw new AppError("UF invalida", 422, "INVALID_UF");
    }

    const hashCpf = await this.sha256Crypt.encrypt(cpf);

    const alreadyExists = municipe.cpf
      ? await this.municipeRepository.getMunicipeByCpf(hashCpf)
      : false;

    if (alreadyExists) {
      throw new AppError(
        "Municipe already exists",
        409,
        "MUNICIPE_ALREADY_EXISTS",
      );
    }

    const newMunicipe = new Municipe(
      municipe.nome.trim(),
      cpf,
      municipe.nascimento,
      municipe.telefone,
      municipe.rua,
      municipe.bairro,
      municipe.cidade,
      municipe.uf.trim().toUpperCase(),
      cep,
      municipe.numero,
      municipe.complemento,
      author,
    );

    const municipeMapper = new MunicipeMapper(this.aesCrypt, this.sha256Crypt);

    const municipeToPersist = await municipeMapper.toPersistence(newMunicipe);

    let response: Municipe;
    try {
      response = await this.municipeRepository.createMunicipe(
        municipeToPersist.municipe,
        municipeToPersist.cpfHash,
        municipeToPersist.cepHash,
      );
    } catch (error) {
      if (error instanceof MunicipeIdentityConflictError) {
        throw new AppError("Municipe already exists", 409, "MUNICIPE_ALREADY_EXISTS");
      }
      throw error;
    }

    const municipeDecrypted = await municipeMapper.toDomain(response);

    return {
      ...municipeDecrypted,
      municipe: municipeDecrypted,
      protected: {
        ...response,
        cpfHash: municipeToPersist.cpfHash,
        cepHash: municipeToPersist.cepHash,
      },
    };
  }
}
