import axios, { AxiosInstance } from "axios";
import AppError from "../../../../core/appError.js";

export type CreateCarterinhaPdfPayload = {
  name: string;
  modelType: string;
  entityData: {
    name: string;
    identidade: string;
    modalidade: string;
    nascimento?: string | null;
    endereco?: string | null;
    numero?: string | null;
    bairro?: string | null;
    cep?: string | null;
  };
};

type HttpClient = Pick<AxiosInstance, "post">;

export default class CreateCarterinhaPdfUseCase {
  constructor(
    private pdfApiUrl: string,
    private httpClient: HttpClient = axios,
  ) {}

  async execute(payload: CreateCarterinhaPdfPayload): Promise<void> {
    try {
      await this.httpClient.post(
        `${this.pdfApiUrl.replace(/\/$/, "")}/pdf`,
        payload,
      );
    } catch {
      throw new AppError(
        "PDF service unavailable",
        502,
        "PDF_SERVICE_UNAVAILABLE",
      );
    }
  }
}
