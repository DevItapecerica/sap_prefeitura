import AppError from "../../../../core/appError.js";
import { FtEditalDto, FtEditalRelatoryQueryDto } from "../../application/dto/ft-edital.dto.js";
import { FtRelatorioPeriodo } from "./ft-relatorio-pagamento.service.js";

const ftError = (statusCode: number, message: string) =>
  new AppError(message, statusCode, "FT_MS");

export class FtEditalPolicyService {
  validateEditalPayload(data: FtEditalDto) {
    if (!data) {
      throw ftError(400, "Edital e obrigatorio");
    }

    const requiredFields = [
      ["name", "Nome"],
      ["data_publicacao", "Data de publicacao"],
      ["data_vencimento", "Data de vencimento"],
      ["dia_pagamento", "Dia de pagamento"],
      ["valor_bolsa", "Valor da bolsa"],
    ];

    const missingFields = requiredFields
      .filter(([field]) => !String((data as any)[field] ?? "").trim())
      .map(([, label]) => label);

    if (missingFields.length > 0) {
      throw ftError(400, `Dados do edital incompletos: ${missingFields.join(", ")}`);
    }

    if (
      Number.isNaN(Date.parse(String(data.data_publicacao))) ||
      Number.isNaN(Date.parse(String(data.data_vencimento)))
    ) {
      throw ftError(400, "Datas do edital invalidas");
    }

    const diaPagamento = Number(data.dia_pagamento);
    if (!Number.isInteger(diaPagamento) || diaPagamento < 1 || diaPagamento > 31) {
      throw ftError(400, "Dia de pagamento deve estar entre 1 e 31");
    }

    if (Number(data.valor_bolsa) <= 0) {
      throw ftError(400, "Valor da bolsa deve ser maior que zero");
    }
  }

  resolveRelatoryPeriod(query: FtEditalRelatoryQueryDto): FtRelatorioPeriodo {
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
