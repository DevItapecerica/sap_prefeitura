import { IAesCrypt } from "../../../../core/security/aes/AesCrypt.interface.js";
import { ISha256Crypt } from "../../../../core/security/sha256/sha256.interface.js";
import { MunicipeMapper } from "../../../municipe/application/mapper/municipe.mapper.js";
import { Bolsista } from "../../domain/entity/Bolsista.js";
import { IBolsistaRepository } from "../../domain/repository/IBolsistaRepository.js";

export default class getOneBolsistaUseCase {
  constructor(
    private bolsistaRepository: IBolsistaRepository,
    private aesCrypt: IAesCrypt,
    private sha256Crypt: ISha256Crypt,
  ) {}

  async execute(uuid: string | number): Promise<Bolsista | null> {
    const municipeMapper = new MunicipeMapper(this.aesCrypt, this.sha256Crypt);
    const response = await this.bolsistaRepository.findById(uuid);

    if (response?.municipe) {
      response.municipe = await municipeMapper.toDomain(response.municipe);
    }

    return response;
  }
}
