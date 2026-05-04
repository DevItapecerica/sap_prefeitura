import { cp } from "fs";
import AppError from "../../../../core/appError.js";
import { IAesCrypt } from "../../../../core/security/aes/AesCrypt.interface.js";
import { ISha256Crypt } from "../../../../core/security/sha256/sha256.interface.js";
import Municipe from "../../domain/entity/Municipe.js";
import MunicipeRepository from "../../domain/repositories/Municipe.repository.js";
import { MunicipeDto } from "../dto/municipe.dto.js";
import { MunicipeMapper } from "../mapper/municipe.mapper.js";

export default class updateMunicipeUseCase {
  constructor(
    private municipeRepository: MunicipeRepository,
    private aesCrypt: IAesCrypt,
    private sha256Crypt: ISha256Crypt,
  ) {}

  async execute(
    uuid: string,
    municipe: MunicipeDto,
    author: string | number,
  ): Promise<Municipe> {
    const hashCpf = await this.sha256Crypt.encrypt(municipe.cpf);

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

    const updated = new Municipe(
      municipe.nome,
      municipe.cpf,
      municipe.nascimento,
      municipe.telefone,
      municipe.rua,
      municipe.bairro,
      municipe.cidade,
      municipe.uf,
      municipe.cep,
      municipe.numero,
      municipe.complemento,
      author,
    );

    const municipeMapper = new MunicipeMapper(this.aesCrypt, this.sha256Crypt);
    const updatedToPersistence = await municipeMapper.toPersistence(updated);

    const response = await this.municipeRepository.updateMunicipe(
      uuid,
      updatedToPersistence.municipe,
      updatedToPersistence.cpfHash,
      updatedToPersistence.cepHash,
    );

    if (!response)
      throw new AppError("Municipe not found", 404, "MUNICIPE_NOT_FOUND");

    const municipeUpdated = await municipeMapper.toDomain(response);

    return municipeUpdated;
  }
}
