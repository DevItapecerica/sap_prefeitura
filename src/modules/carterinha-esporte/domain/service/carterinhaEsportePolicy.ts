import { validateImageDataUrl } from "../../../../core/validators/image-data-url.validator.js";

export class CarterinhaEsportePolicy {
  private VALIDADE_PADRAO_ANOS = 2;
  private VALIDADE_PADRAO_MESES = 6;
  private VALIDADE_PADRAO_DIAS = 0;
  private FOTO_MAX_BYTES = 1.5 * 1024 * 1024;
  private FOTO_MIN_BYTES = 32;

  calcularValidade(emissao: Date): Date {
    return new Date(
      emissao.getFullYear() + this.VALIDADE_PADRAO_ANOS,
      emissao.getMonth() + this.VALIDADE_PADRAO_MESES,
      emissao.getDate() + this.VALIDADE_PADRAO_DIAS,
    );
  }

  isValidadeValida(validade: Date): boolean {
    return validade > new Date();
  }

  validateFoto(foto?: string | null): string {
    return validateImageDataUrl(foto, {
      required: true,
      minSizeInBytes: this.FOTO_MIN_BYTES,
      maxSizeInBytes: this.FOTO_MAX_BYTES,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      errorCodePrefix: "CARTERINHA_FOTO",
    }) as string;
  }
}
