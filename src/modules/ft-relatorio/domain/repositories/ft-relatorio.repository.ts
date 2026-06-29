import { FtRelatorioPeriodo } from "../../application/dto/ft-relatorio.dto.js";
import { FtEdital } from "../../../ft-edital/domain/entity/FtEdital.js";
import { FtRelatorioBolsista } from "../entities/ft-relatorio.entity.js";

export interface FtRelatorioRepository {
  findEditalById(id: string): Promise<FtEdital | null>;
  findBolsistasByEditalPeriodo(
    id: string,
    periodo: FtRelatorioPeriodo,
  ): Promise<FtRelatorioBolsista[]>;
  findBolsistasFaltasByEditalMes(
    id: string,
    periodo: FtRelatorioPeriodo,
  ): Promise<FtRelatorioBolsista[]>;
}
