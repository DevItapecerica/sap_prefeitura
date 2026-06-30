import { FtBolsista } from "../../../ft-bolsista/domain/entity/FtBolsista.js";
import { FtBolsistaFalta } from "../../../ft-bolsista/domain/entity/FtBolsistaFalta.js";

export class FtRelatorioVinculo {
  constructor(
    public readonly status: string,
    public readonly data_vinculo: string | Date,
    public readonly expire_at: string | Date | null = null,
    public readonly canceled_at: string | Date | null = null,
    public readonly concluded_at: string | Date | null = null,
    public readonly expired_at: string | Date | null = null,
    public readonly id?: string,
  ) {}
}

export class FtRelatorioBolsista {
  constructor(
    public readonly bolsista: FtBolsista,
    public readonly faltas: FtBolsistaFalta[] = [],
    public readonly vinculos: FtRelatorioVinculo[] = [],
  ) {}
}
