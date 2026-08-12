export default class MunicipePolicy {
  static normalizeCpf(cpf: string): string {
    return String(cpf ?? "").replace(/\D/g, "");
  }

  static cpfIsValid(cpf: string): boolean {
    const digits = this.normalizeCpf(cpf);
    if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;

    const calculateDigit = (length: number) => {
      const sum = digits
        .slice(0, length)
        .split("")
        .reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0);
      const remainder = (sum * 10) % 11;
      return remainder === 10 ? 0 : remainder;
    };

    return calculateDigit(9) === Number(digits[9]) && calculateDigit(10) === Number(digits[10]);
  }

  static normalizeCep(cep: string): string {
    return String(cep ?? "").replace(/\D/g, "");
  }

  static cepIsValid(cep: string): boolean {
    return /^\d{8}$/.test(this.normalizeCep(cep));
  }

  static birthDateIsValid(value: string, today = new Date()): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return false;
    return parsed.getTime() <= Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  }

  static ufIsValid(value: string): boolean {
    return /^[A-Za-z]{2}$/.test(String(value ?? "").trim());
  }
}
