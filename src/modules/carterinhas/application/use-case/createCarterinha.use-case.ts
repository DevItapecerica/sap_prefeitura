import Carterinha from "../../domain/entity/Carteirinha.js";
import { PostCarterinhaDto } from "../dto/carterinha.dto.js";
import MunicipeRepository from "../../../municipe/domain/repositories/Municipe.repository.js";
import { AppError } from "../../../../core/appError.js";
import { CarterinhaPolicy } from "../../domain/service/carterinhaPolicy.js";
import CarterinhaRepository from "../../domain/repositories/carterinha.repository.js";
import CreateCarterinhaPdfUseCase from "./createCarterinhaPdf.use-case.js";
import { IAesCrypt } from "../../../../core/security/aes/AesCrypt.interface.js";
import { ISha256Crypt } from "../../../../core/security/sha256/sha256.interface.js";
import { MunicipeMapper } from "../../../municipe/application/mapper/municipe.mapper.js";

export default class CreateCarterinhaUseCase {
  constructor(
    private municipeRepository: MunicipeRepository,
    private carterinhaRepository: CarterinhaRepository,
    private carterinhaPDFUseCase?: CreateCarterinhaPdfUseCase,
    private aesCrypt?: IAesCrypt,
    private sha256Crypt?: ISha256Crypt,
  ) {}

  async execute(
    data: PostCarterinhaDto,
    author: string | number,
  ): Promise<Carterinha> {
    const municipeExists = await this.municipeRepository.getMunicipeById(
      data.municipe_uuid,
    );

    if (!municipeExists) {
      throw new AppError("Municipe not found", 404, "MUNICIPE_NOT_FOUND");
    }

    const municipe =
      this.aesCrypt && this.sha256Crypt
        ? await new MunicipeMapper(this.aesCrypt, this.sha256Crypt).toDomain(
            municipeExists,
          )
        : municipeExists;

    const emissao = new Date(Date.now());
    const carterinhaPolicy = new CarterinhaPolicy();
    const validade = carterinhaPolicy.calcularValidade(emissao);

    const newCarterinha = new Carterinha(
      emissao,
      validade,
      data.origem,
      data.atividade || null,
      data.municipe_uuid,
      author,
    );

    const carterinha =
      await this.carterinhaRepository.postCarterinhas(newCarterinha);

    if (this.carterinhaPDFUseCase) {
      await this.carterinhaPDFUseCase.execute({
        name: `carterinha-${municipe.nome}-${data.origem}`,
        modelType: data.origem,
        entityData: {
          name: `${municipe.nome} - ${data.origem}`,
          identidade: municipe.cpf,
          modalidade: data.atividade || "",
          nascimento: municipe.nascimento,
          endereco: municipe.rua,
          numero: municipe.numero,
          bairro: municipe.bairro,
          cep: municipe.cep,
        },
      });
    }

    return carterinha;
  }
}
