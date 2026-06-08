import AppError from "../../../../core/appError.js";
import { IAesCrypt } from "../../../../core/security/aes/AesCrypt.interface.js";
import { ISha256Crypt } from "../../../../core/security/sha256/sha256.interface.js";
import Municipe from "../../domain/entity/Municipe.js";
import MunicipeRepository from "../../domain/repositories/Municipe.repository.js";
import { MunicipeMapper } from "../mapper/municipe.mapper.js";

export default class getMunicipeByIdUseCase {
  constructor(
    private municipeRepository: MunicipeRepository,
    private aesCrypt: IAesCrypt,
    private sha256Crypt: ISha256Crypt,
  ) {}

  async execute(uuid: string): Promise<Municipe> {
    const response = await this.municipeRepository.getMunicipeById(uuid);

    if (!response)
      throw new AppError("Municipe not found", 404, "MUNICIPE_NOT_FOUND");

    const municipeMapper = new MunicipeMapper(this.aesCrypt, this.sha256Crypt);
    const municipe = await municipeMapper.toDomain(response);
    
    return municipe;
  }
}
