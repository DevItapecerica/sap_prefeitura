import axios, { AxiosInstance } from "axios";
import AppError from "../../../../core/appError.js";
import { EspelhoPontoPdfDto, EspelhoPontoRequestDto } from "../dto/espelho-ponto.dto.js";

type HttpClient = Pick<AxiosInstance, "post">;

export default class RenderEspelhoPontoPdfUseCase {
  constructor(private readonly pdfApiUrl: string, private readonly httpClient: HttpClient = axios) {}

  async execute(data: EspelhoPontoRequestDto): Promise<EspelhoPontoPdfDto> {
    try {
      const response = await this.httpClient.post(
        `${this.pdfApiUrl.replace(/\/$/, "")}/espelhos-ponto/render`, data,
        { responseType: "arraybuffer", timeout: 15_000 },
      );
      const file = Buffer.from(response.data);
      const contentType = this.header(response.headers["content-type"]);
      if (file.subarray(0, 4).toString() !== "%PDF" || !contentType?.toLowerCase().startsWith("application/pdf")) {
        throw new Error("Invalid PDF response");
      }
      const fallback = `inline; filename="espelho-ponto-${this.slug(data.servidor.matricula)}-${data.periodo.referencia.replace("/", "-")}.pdf"`;
      return {
        file, contentType, contentDisposition: this.header(response.headers["content-disposition"]) || fallback,
        contentLength: this.header(response.headers["content-length"]),
      };
    } catch {
      throw new AppError("PDF service unavailable", 502, "PDF_SERVICE_UNAVAILABLE");
    }
  }

  private header(value: unknown): string | undefined {
    if (value === undefined || value === null) return undefined;
    return Array.isArray(value) ? value.join(", ") : String(value);
  }

  private slug(value: string): string {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "servidor";
  }
}
