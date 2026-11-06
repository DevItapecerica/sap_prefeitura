import type { PdfRenderer } from "../../../../core/contracts/pdf-renderer.js";
import type {
  FolhaPresencaRequestDto,
  FolhaPresencaPdfDto,
} from "../dto/folha-presenca.dto.js";

export default class RenderFolhaPresencaPdfUseCase {
  constructor(private renderer: PdfRenderer<FolhaPresencaRequestDto>) {}
  execute(
    input: FolhaPresencaRequestDto,
    requestId?: string,
  ): Promise<FolhaPresencaPdfDto> {
    return this.renderer.execute(input, requestId);
  }
}
