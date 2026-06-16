import axios, { AxiosInstance } from "axios";
import AppError from "../../../../core/appError.js";

type PdfGatewayResponse = {
  file: Buffer;
  contentType: string;
  contentDisposition: string;
  contentLength?: string;
};

type HttpClient = Pick<AxiosInstance, "get">;

export default class GetCarterinhaPdfUseCase {
  constructor(
    private pdfApiUrl: string,
    private httpClient: HttpClient = axios,
  ) {}

  async execute(uuid: string): Promise<PdfGatewayResponse> {
    if (!uuid) {
      throw new AppError("PDF uuid is required", 400, "PDF_UUID_REQUIRED");
    }

    try {
      const response = await this.httpClient.get(
        `${this.pdfApiUrl.replace(/\/$/, "")}/pdf/${uuid}`,
        {
          responseType: "arraybuffer",
        },
      );
      const contentType = this.getHeaderString(
        response.headers["content-type"],
      );
      const contentDisposition = this.getHeaderString(
        response.headers["content-disposition"],
      );
      const contentLength = this.getHeaderString(
        response.headers["content-length"],
      );

      return {
        file: Buffer.from(response.data),
        contentType: contentType || "application/pdf",
        contentDisposition:
          contentDisposition || `inline; filename="${uuid}.pdf"`,
        contentLength,
      };
    } catch (error: any) {
      if (error?.response?.status === 404) {
        throw new AppError("PDF not found", 404, "PDF_NOT_FOUND");
      }

      throw new AppError(
        "PDF service unavailable",
        502,
        "PDF_SERVICE_UNAVAILABLE",
      );
    }
  }

  private getHeaderString(value: unknown): string | undefined {
    if (value === undefined || value === null) return undefined;
    if (Array.isArray(value)) return value.join(", ");
    return String(value);
  }
}
