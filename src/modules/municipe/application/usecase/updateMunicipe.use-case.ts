import AppError from "../../../../core/appError.js";
import { IAesCrypt } from "../../../../core/security/aes/AesCrypt.interface.js";
import { ISha256Crypt } from "../../../../core/security/sha256/sha256.interface.js";
import Municipe from "../../domain/entity/Municipe.js";
import { updateMunicipeDto } from "../dto/municipe.dto.js";
import { MunicipeMapper } from "../mapper/municipe.mapper.js";
import IMunicipeRepository from "../../domain/repositories/Municipe.repository.js";

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
  ): Promise<Municipe> {
    const municipeMapper = new MunicipeMapper(this.aesCrypt, this.sha256Crypt);
    const current = await this.municipeRepository.getMunicipeById(uuid);

    if (!current)
      throw new AppError("Municipe not found", 404, "MUNICIPE_NOT_FOUND");

    const currentDomain = await municipeMapper.toDomain(current);
    const hashCpf = municipe.cpf
      ? await this.sha256Crypt.encrypt(municipe.cpf)
      : undefined;

    const alreadyExists = hashCpf
      ? await this.municipeRepository.getMunicipeByCpf(hashCpf)
      : null;

    if (alreadyExists && alreadyExists.uuid !== uuid) {
      throw new AppError(
        "Municipe already exists",
        409,
        "MUNICIPE_ALREADY_EXISTS",
      );
    }

    const merged = new Municipe(
      currentDomain.nome,
      municipe.cpf ?? currentDomain.cpf,
      municipe.nascimento ?? currentDomain.nascimento,
      municipe.telefone ?? currentDomain.telefone,
      municipe.rua ?? currentDomain.rua,
      municipe.bairro ?? currentDomain.bairro,
      municipe.cidade ?? currentDomain.cidade,
      municipe.uf ?? currentDomain.uf,
      municipe.cep ?? currentDomain.cep,
      municipe.numero ?? currentDomain.numero,
      municipe.complemento ?? currentDomain.complemento,
      author,
    );

    const updatedToPersistence = await municipeMapper.toPersistence(merged);

    const response = await this.municipeRepository.updateMunicipe(
      uuid,
      updatedToPersistence.municipe,
      municipe.cpf ? updatedToPersistence.cpfHash : undefined,
      municipe.cep ? updatedToPersistence.cepHash : undefined,
    );

    if (!response)
      throw new AppError("Municipe not found", 404, "MUNICIPE_NOT_FOUND");

    const municipeUpdated = await municipeMapper.toDomain(response);

    return municipeUpdated;
  }
}
