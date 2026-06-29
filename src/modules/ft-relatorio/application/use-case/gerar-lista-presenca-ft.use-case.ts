import { ftError } from "../../../ft-bolsista/application/utils/ft-error.js";
import {
  FtRelatorioFaltasQueryDto,
  FtRelatorioPeriodo,
} from "../dto/ft-relatorio.dto.js";
import { FtListaPresencaCsvFormatter } from "../formatter/ft-lista-presenca-csv.formatter.js";
import { FtRelatorioRepository } from "../../domain/repositories/ft-relatorio.repository.js";
import { FtRelatorioPeriodoService } from "../../domain/services/ft-relatorio-periodo.service.js";

export class GerarListaPresencaFtUseCase {
  constructor(
    private readonly repository: FtRelatorioRepository,
    private readonly periodoService = new FtRelatorioPeriodoService(),
    private readonly csvFormatter = new FtListaPresencaCsvFormatter(),
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
    const mes = this.periodToMonth(periodo);
    const csv = this.csvFormatter.format({ edital, periodo, mes, bolsistas });

    return {
      fileName: `lista-presenca-${mes}.csv`,
      csv,
      type: "text/csv; charset=utf-8",
    };
  }

  private periodToMonth(periodo: FtRelatorioPeriodo): string {
    return periodo.data_inicio.slice(0, 7);
  }
}
