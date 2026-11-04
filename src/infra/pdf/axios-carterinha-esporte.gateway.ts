import axios, { type AxiosInstance } from "axios";
import AppError from "../../core/appError.js";
import { recordDependency } from "../../core/observability/metrics.js";
import type {
  CarterinhaPdfGateway,
  CarterinhaRenderInput,
} from "../../modules/carterinha-esporte/application/ports/carterinha-pdf.gateway.js";

export default class AxiosCarterinhaEsporteGateway implements CarterinhaPdfGateway {
  constructor(
    private pdfApiUrl: string,
    private httpClient: Pick<AxiosInstance, "post"> = axios,
  ) {}
  async execute(input: CarterinhaRenderInput, requestId?: string) {
    const startedAt = performance.now();
    try {
      const response = await this.httpClient.post<ArrayBuffer>(
        `${this.pdfApiUrl.replace(/\/$/, "")}/carterinhas/esporte/render`,
        input,
        {
          responseType: "arraybuffer",
          headers: requestId ? { "X-Request-Id": requestId } : undefined,
        },
      );
      recordDependency(
        "pdf",
        "success",
        (performance.now() - startedAt) / 1_000,
      );
      return {
        file: Buffer.from(response.data),
        contentType:
          this.header(response.headers["content-type"]) || "application/pdf",
        contentDisposition:
          this.header(response.headers["content-disposition"]) ||
          `inline; filename="${input.name}.pdf"`,
        contentLength: this.header(response.headers["content-length"]),
      };
    } catch {
      recordDependency("pdf", "error", (performance.now() - startedAt) / 1_000);
      throw new AppError(
        "PDF service unavailable",
        502,
        "PDF_SERVICE_UNAVAILABLE",
      );
    }
  }
  private header(value: unknown): string | undefined {
    return value == null
      ? undefined
      : Array.isArray(value)
        ? value.join(", ")
        : String(value);
  }
}
