import AppError from "../../../../core/appError.js";
import Municipe from "../../domain/entity/Municipe.js";
import MunicipeRepository from "../../domain/repositories/Municipe.repository.js";
import { MunicipeDto } from "../dto/municipe.dto.js";

export default class updateMunicipeUseCase {
  constructor(private municipeRepository: MunicipeRepository) {}

  async execute(
    uuid: string,
    municipe: MunicipeDto,
    author: string | number,
  ): Promise<Municipe> {
    
    const alreadyExists = municipe.cpf ? await this.municipeRepository.getMunicipeByCpf(
      municipe.cpf,
    ) : false;

    if (alreadyExists) {
      throw new AppError(
        "Municipe already exists",
        409,
        "MUNICIPE_ALREADY_EXISTS",
      );
    }

    const updated = {
      nascimento: municipe.nascimento,
      telefone: municipe.telefone,
      rua: municipe.rua,
      bairro: municipe.bairro,
      cidade: municipe.cidade,
      uf: municipe.uf,
      cep: municipe.cep,
      numero: municipe.numero,
      complemento: municipe.complemento,
      author,
  };

    const response = await this.municipeRepository.updateMunicipe(
      uuid,
      updated,
    );

    if (!response)
      throw new AppError("Municipe not found", 404, "MUNICIPE_NOT_FOUND");

    return response;
  }
}
