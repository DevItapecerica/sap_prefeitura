import CarterinhaEsporte from "../../domain/entity/CarterinhaEsporte.js";
import CarterinhaEsporteRepository from "../../domain/repositories/carterinha-esporte.repository.js";
import { CarterinhaEsportePolicy } from "../../domain/service/carterinhaEsportePolicy.js";

type CreateCarterinhaEsporteInput = {
  municipe_uuid: string;
  modalidade: string;
};

export default class CreateCarterinhaEsporteUseCase {
  constructor(
    private carterinhaRepository: CarterinhaEsporteRepository,
    private policy = new CarterinhaEsportePolicy(),
  ) {}

  async execute(
    data: CreateCarterinhaEsporteInput,
    author: string | number,
  ): Promise<CarterinhaEsporte> {
    const emissao = new Date();
    const validade = this.policy.calcularValidade(emissao);
    const carterinha = new CarterinhaEsporte(
      emissao,
      validade,
      data.municipe_uuid,
      data.modalidade,
      author,
    );

    return this.carterinhaRepository.create(carterinha);
  }
}
