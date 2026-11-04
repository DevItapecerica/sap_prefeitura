import { PeaadRuleError } from "../errors/peaad-rule.error.js";

export class FtBolsistaPolicyService {
  validateBolsistaPayload(data: any) {
    if (!data) {
      throw new PeaadRuleError(
        "PARTICIPANT_REQUIRED",
        "Bolsista e obrigatorio",
      );
    }

    const requiredFields = [["municipe_uuid", "Municipe"]];

    const missingFields = requiredFields
      .filter(([field]) => !String(data[field] ?? "").trim())
      .map(([, label]) => label);

    if (missingFields.length > 0) {
      throw new PeaadRuleError(
        "PARTICIPANT_DATA_INCOMPLETE",
        `Dados do bolsista incompletos: ${missingFields.join(", ")}`,
      );
    }
  }

  validatePaymentInfo(paymentInfo: any) {
    if (!paymentInfo) {
      throw new PeaadRuleError(
        "BANK_DATA_REQUIRED",
        "Dados bancarios sao obrigatorios",
      );
    }

    const requiredFields = [
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
      throw new PeaadRuleError(
        "BANK_DATA_INCOMPLETE",
        `Dados bancarios incompletos: ${missingFields.join(", ")}`,
      );
    }
  }

  ensureCanCreateFalta(edital: any, vinculo: any) {
    if (edital.get("status") !== "ativo") {
      throw new PeaadRuleError("PROGRAM_INACTIVE", "Edital inativo");
    }

    if (vinculo.get("status") !== "ativo") {
      throw new PeaadRuleError(
        "PARTICIPATION_INACTIVE",
        "Bolsista inativo neste edital",
      );
    }
  }
}
