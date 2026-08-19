import AppError from "../../../../core/appError.js";
import {
  FtRelatorioFaltasQueryDto,
  FtRelatorioPeriodo,
  FtRelatorioQueryDto,
} from "../../application/dto/ft-relatorio.dto.js";

const ftError = (statusCode: number, message: string) =>
  new AppError(message, statusCode, "FT_MS");

export class FtRelatorioPeriodoService {
  constructor(private readonly nowProvider = () => new Date()) {}

  resolve(query: FtRelatorioQueryDto = {}): FtRelatorioPeriodo {
    const hasInicio = Boolean(String(query.data_inicio || "").trim());
    const hasFim = Boolean(String(query.data_fim || "").trim());

    if (hasInicio !== hasFim) {
      throw ftError(400, "data_inicio e data_fim devem ser informadas juntas");
    }

    if (!hasInicio && !hasFim) {
      const now = this.nowProvider();
      const firstDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
      const lastDay = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0));

      return {
        data_inicio: this.toDateOnly(firstDay),
        data_fim: this.toDateOnly(lastDay),
      };
    }

    if (
      Number.isNaN(Date.parse(String(query.data_inicio))) ||
      Number.isNaN(Date.parse(String(query.data_fim)))
    ) {
      throw ftError(400, "Periodo do relatorio invalido");
    }

    const dataInicio = this.toDateOnly(query.data_inicio);
    const dataFim = this.toDateOnly(query.data_fim);

    if (dataInicio > dataFim) {
      throw ftError(400, "data_inicio deve ser menor ou igual a data_fim");
    }

    return { data_inicio: dataInicio, data_fim: dataFim };
  }

  resolveMonth(query: FtRelatorioFaltasQueryDto = {}): FtRelatorioPeriodo {
    const month = String(query.mes || "").trim();

    if (!month) {
      const now = this.nowProvider();
      return this.monthToPeriod(now.getUTCFullYear(), now.getUTCMonth() + 1);
    }

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw ftError(400, "mes deve estar no formato YYYY-MM");
    }

    const [year, monthNumber] = month.split("-").map(Number);

    if (this.isFutureMonth(year, monthNumber)) {
      throw ftError(400, "Nao e permitido gerar relatorio para mes futuro");
    }

    return this.monthToPeriod(year, monthNumber);
  }

  private isFutureMonth(year: number, month: number): boolean {
    const now = this.nowProvider();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth() + 1;

    return year > currentYear || (year === currentYear && month > currentMonth);
  }

  private toDateOnly(value: any): string {
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }

    return String(value).slice(0, 10);
  }

  private monthToPeriod(year: number, month: number): FtRelatorioPeriodo {
    const firstDay = new Date(Date.UTC(year, month - 1, 1));
    const lastDay = new Date(Date.UTC(year, month, 0));

    return {
      data_inicio: this.toDateOnly(firstDay),
      data_fim: this.toDateOnly(lastDay),
    };
  }
}
