import type { PdfRenderer } from "../../../../core/contracts/pdf-renderer.js";
import type {
  EspelhoPontoRequestDto,
  EspelhoPontoPdfDto,
} from "../dto/espelho-ponto.dto.js";

export default class RenderEspelhoPontoPdfUseCase {
  constructor(private renderer: PdfRenderer<EspelhoPontoRequestDto>) {}
  execute(
    input: EspelhoPontoRequestDto,
    requestId?: string,
  ): Promise<EspelhoPontoPdfDto> {
    return this.renderer.execute(input, requestId);
  }
}
