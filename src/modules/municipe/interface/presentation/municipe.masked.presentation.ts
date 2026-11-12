import Municipe from "../../domain/entity/Municipe.js";
import { CpfMask } from "../../../../core/utils/cpf-mask.js";

export default class MunicipePresentation {
  static Masked(mData: Municipe) {
    const nascimento = mData.nascimento
      ? new Date(mData.nascimento).getFullYear()
      : null;

    return {
      uuid: mData.uuid,
      nome: mData.nome.split(" ")[0] + " ***",
      cpf: CpfMask.lastThreeDigits(mData.cpf),
      nascimento: Number.isNaN(nascimento) ? null : nascimento,
      cidade: mData.cidade,
      uf: mData.uf,
      createdAt: mData.createdAt,
      updatedAt: mData.updatedAt,
      author: mData.author,
    };
  }
}
