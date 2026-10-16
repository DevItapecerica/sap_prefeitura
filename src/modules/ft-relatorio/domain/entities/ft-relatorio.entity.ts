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
    public readonly local?: string,
    public readonly pagador_id?: string | null,
    public readonly pagador?: {
      uuid: string;
      nome: string;
      quantidade: number;
      deletedAt?: Date | null;
    } | null,
    public readonly turno_id?: string | null,
    public readonly turno?: {
      uuid: string;
      nome: string;
      hora_inicio: string;
      hora_fim: string;
      deletedAt?: Date | null;
    } | null,
    public readonly turno_nome_snapshot?: string | null,
    public readonly turno_hora_inicio_snapshot?: string | null,
    public readonly turno_hora_fim_snapshot?: string | null,
  ) {}
}

export class FtRelatorioBolsista {
  constructor(
    public readonly bolsista: FtBolsista,
    public readonly faltas: FtBolsistaFalta[] = [],
    public readonly vinculos: FtRelatorioVinculo[] = [],
  ) {}
}
