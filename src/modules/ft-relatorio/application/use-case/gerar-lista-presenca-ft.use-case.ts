import { FtRelatorioFaltasQueryDto } from "../dto/ft-relatorio.dto.js";
import { FtListaPresencaCsvFormatter } from "../formatter/ft-lista-presenca-csv.formatter.js";
import { FtRelatorioRepository } from "../../domain/repositories/ft-relatorio.repository.js";
import { FtRelatorioPeriodoService } from "../../domain/services/ft-relatorio-periodo.service.js";
import { GerarRelatorioMensalFtHelper } from "./gerar-relatorio-mensal-ft.helper.js";

export class GerarListaPresencaFtUseCase {
  private readonly mensalHelper: GerarRelatorioMensalFtHelper;

  constructor(
    private readonly repository: FtRelatorioRepository,
    private readonly periodoService = new FtRelatorioPeriodoService(),
    private readonly csvFormatter = new FtListaPresencaCsvFormatter(),
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
      fileName: `lista-presenca-${relatorio.mes}.csv`,
      csv,
      type: "text/csv; charset=utf-8",
      returnedCount: relatorio.bolsistas.length,
    };
  }
}
