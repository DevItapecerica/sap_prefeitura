import Atleta from "../../domain/entity/Atleta.js";
import MunicipePresentation from "../../../municipe/interface/presentation/municipe.masked.presentation.js";

export default class AtletaPresentation {
  static Masked(atleta: Atleta | null) {
    if (!atleta) return null;

    return {
      uuid: atleta.uuid,
      municipe_uuid: atleta.municipe_uuid,
      ativo: atleta.ativo,
      author: atleta.author,
      createdAt: atleta.createdAt,
      updatedAt: atleta.updatedAt,
      deletedAt: atleta.deletedAt,
      municipe: atleta.municipe
        ? MunicipePresentation.Masked(atleta.municipe)
        : null,
      modalidades: atleta.modalidades || [],
    };
  }

  static MaskedList(atletas: Atleta[]) {
    return atletas.map((atleta) => AtletaPresentation.Masked(atleta));
  }
}
