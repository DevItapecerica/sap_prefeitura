import AppError from "../../../../core/appError.js";
import {
  FtRelatorioPeriodo,
  FtRelatorioQueryDto,
} from "../../application/dto/ft-relatorio.dto.js";

const ftError = (statusCode: number, message: string) =>
  new AppError(message, statusCode, "FT_MS");

export class FtRelatorioPeriodoService {
  resolve(query: FtRelatorioQueryDto = {}): FtRelatorioPeriodo {
    const hasInicio = Boolean(String(query.data_inicio || "").trim());
    const hasFim = Boolean(String(query.data_fim || "").trim());

    if (hasInicio !== hasFim) {
      throw ftError(400, "data_inicio e data_fim devem ser informadas juntas");
    }

    if (!hasInicio && !hasFim) {
      const now = new Date();
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

  private toDateOnly(value: any): string {
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }

    return String(value).slice(0, 10);
  }
}
