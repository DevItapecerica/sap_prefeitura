import CarterinhaEsporte from "../../domain/entity/CarterinhaEsporte.js";
import CarterinhaEsporteRepository from "../../domain/repositories/carterinha-esporte.repository.js";
import { CarterinhaEsportePolicy } from "../../domain/service/carterinhaEsportePolicy.js";

type CreateCarterinhaEsporteInput = {
  municipe_uuid: string;
  modalidade: string;
  observacao?: string | null;
  validade_exame?: string | Date | null;
  foto?: string | null;
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
    const foto = this.policy.validateFoto(data.foto);
    const carterinha = new CarterinhaEsporte(
      emissao,
      validade,
      data.municipe_uuid,
      data.modalidade,
      author,
      data.observacao || null,
      data.validade_exame ? new Date(data.validade_exame) : null,
      foto,
    );

    return this.carterinhaRepository.create(carterinha);
  }
}
