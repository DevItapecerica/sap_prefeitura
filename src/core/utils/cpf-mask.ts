/** Presentation only: never use masked values for storage, hashes or validation. */
export class CpfMask {
  static middleDigits(value: string | null | undefined): string {
    const cpf = this.digits(value);
    return cpf.length === 11
      ? `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**`
      : "***.***.***-**";
  }

  static lastThreeDigits(value: string | null | undefined): string {
    const cpf = this.digits(value);
    return cpf.length === 11 ? `********${cpf.slice(-3)}` : "***********";
  }

  private static digits(value: string | null | undefined): string {
    return (value ?? "").replace(/\D/g, "");
  }
}
