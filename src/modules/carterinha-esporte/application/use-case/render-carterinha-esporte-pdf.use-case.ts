import axios, { AxiosInstance } from "axios";
import AppError from "../../../../core/appError.js";
import { IAesCrypt } from "../../../../core/security/aes/AesCrypt.interface.js";
import { ISha256Crypt } from "../../../../core/security/sha256/sha256.interface.js";
import MunicipeRepository from "../../../municipe/domain/repositories/Municipe.repository.js";
import { MunicipeMapper } from "../../../municipe/application/mapper/municipe.mapper.js";
import CarterinhaEsporteRepository from "../../domain/repositories/carterinha-esporte.repository.js";

type HttpClient = Pick<AxiosInstance, "post">;

type PdfGatewayResponse = {
  file: Buffer;
  contentType: string;
  contentDisposition: string;
  contentLength?: string;
};

export default class RenderCarterinhaEsportePdfUseCase {
  constructor(
    private carterinhaRepository: CarterinhaEsporteRepository,
    private municipeRepository: MunicipeRepository,
    private pdfApiUrl: string,
    private aesCrypt?: IAesCrypt,
    private sha256Crypt?: ISha256Crypt,
    private httpClient: HttpClient = axios,
  ) {}

  async execute(uuid: string): Promise<PdfGatewayResponse> {
    if (!uuid) {
      throw new AppError(
        "Carterinha uuid is required",
        400,
        "CARTERINHA_UUID_REQUIRED",
      );
    }

    const carterinha = await this.carterinhaRepository.findById(uuid);

    if (!carterinha) {
      throw new AppError(
        "Carteirinha esporte not found",
        404,
        "CARTERINHA_ESPORTE_NOT_FOUND",
      );
    }

    const municipeData = await this.municipeRepository.getMunicipeById(
      carterinha.municipe_uuid,
    );

    if (!municipeData) {
      throw new AppError("Municipe not found", 404, "MUNICIPE_NOT_FOUND");
    }

    const municipe =
      this.aesCrypt && this.sha256Crypt
        ? await new MunicipeMapper(this.aesCrypt, this.sha256Crypt).toDomain(
            municipeData,
          )
        : municipeData;

    const fileName = `carteirinha-esporte-${this.slugify(municipe.nome)}.pdf`;

    try {
      const response = await this.httpClient.post(
        `${this.pdfApiUrl.replace(/\/$/, "")}/carterinhas/esporte/render`,
        {
          name: fileName.replace(/\.pdf$/, ""),
          entityData: {
            name: municipe.nome,
            identidade: municipe.cpf,
            modalidade: carterinha.modalidade,
            cadastro: this.formatDate(carterinha.emissao),
            nascimento: municipe.nascimento,
            endereco: municipe.rua,
            numero: municipe.numero,
            bairro: municipe.bairro,
            cep: municipe.cep,
            obs: "sem observacoes",
            exame: carterinha.validade
              ? this.formatDate(carterinha.validade)
              : "",
          },
        },
        { responseType: "arraybuffer" },
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
          contentDisposition || `inline; filename="${fileName}"`,
        contentLength,
      };
    } catch {
      throw new AppError(
        "PDF service unavailable",
        502,
        "PDF_SERVICE_UNAVAILABLE",
      );
    }
  }

  private formatDate(value: Date): string {
    return value.toISOString().slice(0, 10);
  }

  private slugify(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  private getHeaderString(value: unknown): string | undefined {
    if (value === undefined || value === null) return undefined;
    if (Array.isArray(value)) return value.join(", ");
    return String(value);
  }
}
