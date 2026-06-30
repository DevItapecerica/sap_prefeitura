import { ftError } from "../../../ft-bolsista/application/utils/ft-error.js";
import { FtRelatorioCsvFormatter } from "../formatter/ft-relatorio-csv.formatter.js";
import { FtRelatorioQueryDto } from "../dto/ft-relatorio.dto.js";
import { FtRelatorioRepository } from "../../domain/repositories/ft-relatorio.repository.js";
import { FtRelatorioPagamentoService } from "../../domain/services/ft-relatorio-pagamento.service.js";
import { FtRelatorioPeriodoService } from "../../domain/services/ft-relatorio-periodo.service.js";

export class GerarRelatorioFtUseCase {
  constructor(
    private readonly repository: FtRelatorioRepository,
    private readonly periodoService = new FtRelatorioPeriodoService(),
    private readonly pagamentoService = new FtRelatorioPagamentoService(),
    private readonly csvFormatter = new FtRelatorioCsvFormatter(),
  ) {}

  async execute(id: string, query: FtRelatorioQueryDto = {}) {
    const edital = await this.repository.findEditalById(id);

    if (!edital) {
      throw ftError(404, "Edital not found");
    }

    const periodo = this.periodoService.resolve(query);
    this.validatePeriodoWithinEdital(periodo, edital);

    const bolsistas = await this.repository.findBolsistasByEditalPeriodo(
      id,
      periodo,
    );
    const relatorio = this.pagamentoService.execute(
      bolsistas,
      edital,
      periodo,
    );
    const csv = this.csvFormatter.format(relatorio);

    return {
      fileName: "relatorio.csv",
      csv,
      type: "text/csv; charset=utf-8",
    };
  }

  private validatePeriodoWithinEdital(periodo: any, edital: any): void {
    const dataPublicacao = this.toDateOnly(edital.data_publicacao);
    const dataVencimento = this.toDateOnly(edital.data_vencimento);

    if (
      periodo.data_inicio < dataPublicacao ||
      periodo.data_fim > dataVencimento
    ) {
      throw ftError(400, "Periodo do relatorio fora do periodo do edital");
    }
  }

  private toDateOnly(value: string | Date): string {
    return value instanceof Date
      ? value.toISOString().slice(0, 10)
      : String(value).slice(0, 10);
  }
}
