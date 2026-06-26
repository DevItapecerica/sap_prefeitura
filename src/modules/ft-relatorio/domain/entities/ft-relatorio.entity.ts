import { FtBolsista } from "../../../ft-bolsista/domain/entity/FtBolsista.js";
import { FtBolsistaFalta } from "../../../ft-bolsista/domain/entity/FtBolsistaFalta.js";

export class FtRelatorioBolsista {
  constructor(
    public readonly bolsista: FtBolsista,
    public readonly faltas: FtBolsistaFalta[] = [],
  ) {}
}
