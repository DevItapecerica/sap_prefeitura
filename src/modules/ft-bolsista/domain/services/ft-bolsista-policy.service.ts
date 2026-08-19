import AppError from "../../../../core/appError.js";

const ftError = (statusCode: number, message: string) =>
  new AppError(message, statusCode, "FT_MS");

export class FtBolsistaPolicyService {
  validateBolsistaPayload(data: any) {
    if (!data) {
      throw ftError(400, "Bolsista e obrigatorio");
    }

    const requiredFields = [
      ["nome", "Nome"],
      ["cpf", "CPF"],
      ["local", "Local"],
      ["cep", "CEP"],
      ["numero", "Numero"],
      ["logradouro", "Logradouro"],
      ["bairro", "Bairro"],
      ["cidade", "Cidade"],
      ["uf", "UF"],
    ];

    const missingFields = requiredFields
      .filter(([field]) => !String(data[field] ?? "").trim())
      .map(([, label]) => label);

    if (missingFields.length > 0) {
      throw ftError(
        400,
        `Dados do bolsista incompletos: ${missingFields.join(", ")}`,
      );
    }
  }

  validatePaymentInfo(paymentInfo: any) {
    if (!paymentInfo) {
      throw ftError(400, "Dados bancarios sao obrigatorios");
    }

    const requiredFields = [
      ["pagador_id", "Pagador"],
      ["bco", "Banco"],
      ["ag", "Agencia"],
      ["dig_ag", "Digito da agencia"],
      ["conta", "Conta"],
      ["dig_conta", "Digito da conta"],
    ];

    const missingFields = requiredFields
      .filter(([field]) => !String(paymentInfo[field] ?? "").trim())
      .map(([, label]) => label);

    if (missingFields.length > 0) {
      throw ftError(
        400,
        `Dados bancarios incompletos: ${missingFields.join(", ")}`,
      );
    }
  }

  ensureCanCreateFalta(edital: any, vinculo: any) {
    if (edital.get("status") !== "ativo") {
      throw ftError(400, "Edital inativo");
    }

    if (vinculo.get("status") !== "ativo") {
      throw ftError(400, "Bolsista inativo neste edital");
    }
  }
}
