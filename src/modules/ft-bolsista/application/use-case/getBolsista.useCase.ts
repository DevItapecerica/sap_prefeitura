import { IAesCrypt } from "../../../../core/security/aes/AesCrypt.interface.js";
import { ISha256Crypt } from "../../../../core/security/sha256/sha256.interface.js";
import { MunicipeMapper } from "../../../municipe/application/mapper/municipe.mapper.js";
import { Bolsista } from "../../domain/entity/Bolsista.js";
import { IBolsistaRepository } from "../../domain/repository/IBolsistaRepository.js";
import { BolsistaQueryDto } from "../dto/bolsista-query.dto.js";

export default class GetBolsistaUseCase {
  constructor(
    private bolsistaRepository: IBolsistaRepository,
    private aesCrypt: IAesCrypt,
    private sha256Crypt: ISha256Crypt,
  ) {}

  async execute(
    query: BolsistaQueryDto,
  ): Promise<{ bolsistas: Bolsista[]; count: number }> {
    const municipeMapper = new MunicipeMapper(this.aesCrypt, this.sha256Crypt);

    const response = await this.bolsistaRepository.findAll(query);

    response.bolsistas = await Promise.all(
      response.bolsistas.map(async (bolsista) => {
        if (bolsista.municipe) {
          bolsista.municipe = await municipeMapper.toDomain(bolsista.municipe);
        }

        return bolsista;
      }),
    );

    return response;
  }
}
