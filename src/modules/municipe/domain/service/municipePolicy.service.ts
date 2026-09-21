import { isValidCpf } from "../../../../core/validators/cpf.validator.js";

export default class MunicipePolicy {
  static cpfIsValid(cpf: string) {
    return isValidCpf(cpf);
  }
}
