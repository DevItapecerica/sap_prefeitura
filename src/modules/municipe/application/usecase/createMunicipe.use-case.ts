import AppError from "../../../../core/appError.js";
import { IAesCrypt } from "../../../../core/security/aes/AesCrypt.interface.js";
import { ISha256Crypt } from "../../../../core/security/sha256/sha256.interface.js";
import Municipe from "../../domain/entity/Municipe.js";
import IMunicipeRepository from "../../domain/repositories/Municipe.repository.js";
import { MunicipeDto } from "../dto/municipe.dto.js";
import { MunicipeMapper } from "../mapper/municipe.mapper.js";

export default class createMunicipeUseCase {
  constructor(
    private municipeRepository: IMunicipeRepository,
    private aesCrypt: IAesCrypt,
    private sha256Crypt: ISha256Crypt,
  ) {}

  async execute(municipe: MunicipeDto, author: string): Promise<Municipe> {
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

    const newMunicipe = new Municipe(
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

    const municipeToPersist = await municipeMapper.toPersistence(newMunicipe);

    const response = await this.municipeRepository.createMunicipe(
      municipeToPersist.municipe,
      municipeToPersist.cpfHash,
      municipeToPersist.cepHash,
    );

    const municipeDecrypted = await municipeMapper.toDomain(response);

    return municipeDecrypted;
  }
}
