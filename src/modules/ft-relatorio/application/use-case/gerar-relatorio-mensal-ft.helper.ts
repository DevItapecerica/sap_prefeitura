import { ftError } from "../../../ft-bolsista/application/utils/ft-error.js";
import { FtRelatorioFaltasQueryDto } from "../dto/ft-relatorio.dto.js";
import { FtRelatorioRepository } from "../../domain/repositories/ft-relatorio.repository.js";
import { FtRelatorioPeriodoService } from "../../domain/services/ft-relatorio-periodo.service.js";

export class GerarRelatorioMensalFtHelper {
  constructor(
    private readonly repository: FtRelatorioRepository,
    private readonly periodoService = new FtRelatorioPeriodoService(),
  ) {}

  async execute(id: string, query: FtRelatorioFaltasQueryDto = {}) {
    const edital = await this.repository.findEditalById(id);

    if (!edital) {
      throw ftError(404, "Edital not found");
    }

    const periodo = this.periodoService.resolveMonth(query);
    const bolsistas = await this.repository.findBolsistasFaltasByEditalMes(
      id,
      periodo,
    );

    return {
      edital,
      periodo,
      bolsistas,
      mes: periodo.data_inicio.slice(0, 7),
    };
  }
}
