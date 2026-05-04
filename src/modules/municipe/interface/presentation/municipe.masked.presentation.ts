import Municipe from "../../domain/entity/Municipe.js";

export default class MunicipePresentation {
  static Masked(mData: Municipe) {

    return mData

    return {
      uuid: mData.uuid,
      nome: mData.nome.split(" ")[0] + " ***",
      cpf: mData.cpf.replace(/\d(?=\d{3})/g, "*"),
      nascimento: mData.nascimento
        ? new Date(mData.nascimento).getFullYear()
        : null,
      cidade: mData.cidade,
      uf: mData.uf,
      createdAt: mData.createdAt,
      updatedAt: mData.updatedAt,
      author: mData.author,
    };
  }
}
