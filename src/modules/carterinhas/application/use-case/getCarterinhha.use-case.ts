import Carterinha from "../../domain/entity/Carteirinha.js";
import CarterinhaCriptografy from "../../../municipe/CarterinhaCriptografy.service.js";
import { CarterinhaDto } from "../dto/carterinha.dto.js";

export default class CreateCarterinhaUseCase {
  constructor() {}

  async execute(data: CarterinhaDto): Promise<Carterinha> {
    const newCarterinha = new Carterinha(
      data.nome,
      data.cpf,
      data.nascimento,
      data.telefone,
      data.emissao,
      data.validade,
      data.rua,
      data.bairro,
      data.cidade,
      data.uf,
      data.cep,
      data.numero,
      data.complemento,
      data.setor,
      data.servico,
    );

    const newCarterinhaCriptografy = new CarterinhaCriptografy(newCarterinha);

    const carterinhaCriptografedawait = newCarterinhaCriptografy.cript();

    return carterinhaCriptografedawait;
  }
}
