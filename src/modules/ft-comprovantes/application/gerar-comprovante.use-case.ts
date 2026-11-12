import AppError from "../../../core/appError.js";
import { CpfMask } from "../../../core/utils/cpf-mask.js";
import type { PdfRenderer } from "../../../core/contracts/pdf-renderer.js";
import type { IAesCrypt } from "../../../core/security/aes/AesCrypt.interface.js";
import type {
  DeliveryReceipt,
  DeliveryReceiptRepository,
} from "../domain/comprovante.js";

export class GerarComprovanteUseCase {
  constructor(
    private readonly repository: DeliveryReceiptRepository,
    private readonly crypt: Pick<IAesCrypt, "decrypt">,
    private readonly renderer: PdfRenderer<DeliveryReceipt>,
  ) {}

  async material(id: string, requestId?: string) {
    return this.render(await this.repository.material(id), requestId);
  }

  async benefit(editalId: string, id: string, requestId?: string) {
    return this.render(await this.repository.benefit(editalId, id), requestId);
  }

  private async render(data: DeliveryReceipt | null, requestId?: string) {
    if (!data)
      throw new AppError("Entrega não encontrada.", 404, "DELIVERY_NOT_FOUND");
    const masked = CpfMask.middleDigits(
      await this.crypt.decrypt(data.pessoa.cpf),
    );
    return this.renderer.execute(
      {
        ...data,
        pessoa: { nome: data.pessoa.nome, cpf: masked },
      },
      requestId,
    );
  }
}
