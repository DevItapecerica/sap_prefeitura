import AppError from "../../../../core/appError.js";
import { IAesCrypt } from "../../../../core/security/aes/AesCrypt.interface.js";
import { ISha256Crypt } from "../../../../core/security/sha256/sha256.interface.js";
import Municipe from "../../domain/entity/Municipe.js";
import { updateMunicipeDto } from "../dto/municipe.dto.js";
import { MunicipeMapper } from "../mapper/municipe.mapper.js";
import IMunicipeRepository from "../../domain/repositories/Municipe.repository.js";
import MunicipePolicy from "../../domain/service/municipePolicy.service.js";

export default class updateMunicipeUseCase {
  constructor(
    private municipeRepository: IMunicipeRepository,
    private aesCrypt: IAesCrypt,
    private sha256Crypt: ISha256Crypt,
  ) {}

  async execute(
    uuid: string,
    municipe: updateMunicipeDto,
    author: string | number,
  ) {
    if ("cpf" in municipe || "nome" in municipe) {
      throw new AppError("Nome e CPF nao podem ser alterados", 422, "IMMUTABLE_IDENTITY");
    }
    const municipeMapper = new MunicipeMapper(this.aesCrypt, this.sha256Crypt);
    const current = await this.municipeRepository.getMunicipeById(uuid);

    if (!current)
      throw new AppError("Municipe not found", 404, "MUNICIPE_NOT_FOUND");

    const currentDomain = await municipeMapper.toDomain(current);
    const before = { ...current };
    const cep = municipe.cep === undefined ? undefined : MunicipePolicy.normalizeCep(municipe.cep);
    if (cep !== undefined && !MunicipePolicy.cepIsValid(cep)) {
      throw new AppError("CEP invalido", 422, "INVALID_CEP");
    }
    if (municipe.nascimento !== undefined && !MunicipePolicy.birthDateIsValid(municipe.nascimento)) {
      throw new AppError("Data de nascimento invalida", 422, "INVALID_BIRTH_DATE");
    }
    if (municipe.uf !== undefined && !MunicipePolicy.ufIsValid(municipe.uf)) {
      throw new AppError("UF invalida", 422, "INVALID_UF");
    }
    const merged = new Municipe(
      currentDomain.nome,
      currentDomain.cpf,
      municipe.nascimento ?? currentDomain.nascimento,
      municipe.telefone !== undefined ? municipe.telefone : currentDomain.telefone,
      municipe.rua ?? currentDomain.rua,
      municipe.bairro ?? currentDomain.bairro,
      municipe.cidade ?? currentDomain.cidade,
      municipe.uf === undefined ? currentDomain.uf : municipe.uf.trim().toUpperCase(),
      cep ?? currentDomain.cep,
      municipe.numero ?? currentDomain.numero,
      municipe.complemento !== undefined ? municipe.complemento : currentDomain.complemento,
      author,
    );

    const updatedToPersistence = await municipeMapper.toPersistence(merged);

    const response = await this.municipeRepository.updateMunicipe(
      uuid,
      updatedToPersistence.municipe,
      cep !== undefined ? updatedToPersistence.cepHash : undefined,
    );

    if (!response)
      throw new AppError("Municipe not found", 404, "MUNICIPE_NOT_FOUND");

    const municipeUpdated = await municipeMapper.toDomain(response);

    return {
      ...municipeUpdated,
      municipe: municipeUpdated,
      before,
      after: { ...response },
    };
  }
}
