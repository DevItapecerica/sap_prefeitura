import { FtRelatorioFaltasQueryDto } from "../dto/ft-relatorio.dto.js";
import { FtRelatorioFaltasCsvFormatter } from "../formatter/ft-relatorio-faltas-csv.formatter.js";
import { FtRelatorioRepository } from "../../domain/repositories/ft-relatorio.repository.js";
import { FtRelatorioPeriodoService } from "../../domain/services/ft-relatorio-periodo.service.js";
import { GerarRelatorioMensalFtHelper } from "./gerar-relatorio-mensal-ft.helper.js";

export class GerarRelatorioFaltasFtUseCase {
  private readonly mensalHelper: GerarRelatorioMensalFtHelper;

  constructor(
    private readonly repository: FtRelatorioRepository,
    private readonly periodoService = new FtRelatorioPeriodoService(),
    private readonly csvFormatter = new FtRelatorioFaltasCsvFormatter(),
  ) {
    this.mensalHelper = new GerarRelatorioMensalFtHelper(
      this.repository,
      this.periodoService,
    );
  }

  async execute(id: string, query: FtRelatorioFaltasQueryDto = {}) {
    const relatorio = await this.mensalHelper.execute(id, query);
    const csv = this.csvFormatter.format(relatorio);

    return {
      fileName: `relatorio-faltas-${relatorio.mes}.csv`,
      csv,
      type: "text/csv; charset=utf-8",
      returnedCount: relatorio.bolsistas.length,
    };
  }
}
