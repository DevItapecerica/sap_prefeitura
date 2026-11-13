import axios, { type AxiosInstance } from "axios";
import AppError from "../../core/appError.js";
import type { PdfRenderer } from "../../core/contracts/pdf-renderer.js";
import type { Holerite } from "../../modules/ft-relatorio/domain/entities/holerite.js";
import { recordDependency } from "../../core/observability/metrics.js";

export class AxiosHoleriteGateway implements PdfRenderer<Holerite> {
  constructor(
    private readonly url: string,
    private readonly client: Pick<AxiosInstance, "post"> = axios,
  ) {}
  async execute(data: Holerite, requestId?: string) {
    const started = performance.now();
    try {
      const response = await this.client.post(
        `${this.url.replace(/\/$/, "")}/holerites/render`,
        data,
        {
          responseType: "arraybuffer",
          timeout: 15_000,
          headers: requestId ? { "X-Request-Id": requestId } : undefined,
        },
      );
      const file = Buffer.from(response.data);
      if (
        file.subarray(0, 5).toString() !== "%PDF-" ||
        !String(response.headers["content-type"])
          .toLowerCase()
          .startsWith("application/pdf")
      )
        throw new Error("Invalid PDF response");
      recordDependency("pdf", "success", (performance.now() - started) / 1000);
      return {
        file,
        contentType: "application/pdf",
        contentDisposition: `attachment; filename="holerite-${data.competencia}-${data.pessoa.id.replace(/[^a-zA-Z0-9-]/g, "")}.pdf"`,
      };
    } catch {
      recordDependency("pdf", "error", (performance.now() - started) / 1000);
      throw new AppError(
        "Não foi possível gerar o holerite. Tente novamente.",
        502,
        "PDF_SERVICE_UNAVAILABLE",
      );
    }
  }
}
