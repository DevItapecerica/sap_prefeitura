import { cpf } from "cpf-cnpj-validator";
import CPFResult from "../types/validatorCPFTypes.js";

const validatorCPF = (data: string): CPFResult => {
  if (!cpf.isValid(data)) {
    return { ok: false, message: "Invalid CPF" };
  }

  return { ok: true, message: "Valid CPF" };
};

export default validatorCPF;
