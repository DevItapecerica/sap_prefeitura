import Municipe from "../../../municipe/domain/entity/Municipe.js";
import Modalidade from "./Modalidade.js";

export default class Atleta {
  constructor(
    public municipe_uuid: string,
    public ativo: boolean,
    public author: string | number,
    public uuid?: string,
    public createdAt?: Date,
    public updatedAt?: Date,
    public deletedAt?: Date | null,
    public municipe?: Municipe | null,
    public modalidades?: Modalidade[],
  ) {}
}
