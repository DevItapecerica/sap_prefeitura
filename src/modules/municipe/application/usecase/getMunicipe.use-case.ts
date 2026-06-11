import { IAesCrypt } from "../../../../core/security/aes/AesCrypt.interface.js";
import { ISha256Crypt } from "../../../../core/security/sha256/sha256.interface.js";
import { QueryParams } from "../../../../core/types/genericTypes.js";
import Municipe from "../../domain/entity/Municipe.js";
import IMunicipeRepository from "../../domain/repositories/Municipe.repository.js";
import { MunicipeMapper } from "../mapper/municipe.mapper.js";

export default class getMunicipeUseCase {
  constructor(
    private municipeRepository: IMunicipeRepository,
    private aesCrypt: IAesCrypt,
    private sha256Crypt: ISha256Crypt
  ) {}
  async execute(
    query: QueryParams,
  ): Promise<{ municipe: Municipe[]; count: number }> {
    const municipeMapper = new MunicipeMapper(this.aesCrypt, this.sha256Crypt);
    const searchDigits = String(query.search || "").replace(/\D/g, "");
    const searchHash =
      searchDigits.length === 8 || searchDigits.length === 11
        ? await this.sha256Crypt.encrypt(searchDigits)
        : undefined;

    let response = await this.municipeRepository.getMunicipe({
      ...query,
      searchHash,
    });

    response.municipe = await Promise.all(response.municipe.map((m) => municipeMapper.toDomain(m)));

    return response;
  }
}
