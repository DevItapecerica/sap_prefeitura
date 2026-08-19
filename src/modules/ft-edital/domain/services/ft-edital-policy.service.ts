import AppError from "../../../../core/appError.js";
import { FtEditalDto } from "../../application/dto/ft-edital.dto.js";

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

}
