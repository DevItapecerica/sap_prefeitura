import AppError from "../../../../core/appError.js";
import Modalidade from "../../domain/entity/Modalidade.js";
import ModalidadeRepository from "../../domain/repository/modalidade.repository.js";
import {
  CreateModalidadeDto,
  QueryModalidadeDto,
  UpdateModalidadeDto,
} from "../dto/modalidade.dto.js";

export default class ModalidadeService {
  constructor(private modalidadeRepository: ModalidadeRepository) {}

  private normalizeNome(nome?: string): string {
    return String(nome || "").trim();
  }

  private async assertNomeDisponivel(nome: string, uuidToIgnore?: string) {
    const existing = await this.modalidadeRepository.findByNome(nome);

    if (existing && existing.uuid !== uuidToIgnore) {
      throw new AppError(
        "Modalidade already exists",
        409,
        "MODALIDADE_ALREADY_EXISTS",
      );
    }
  }

  async createModalidade(data: CreateModalidadeDto): Promise<Modalidade> {
    const nome = this.normalizeNome(data.nome);

    if (!nome) {
      throw new AppError("Nome is required", 400, "MODALIDADE_NOME_REQUIRED");
    }

    await this.assertNomeDisponivel(nome);

    return this.modalidadeRepository.createModalidade(new Modalidade(nome));
  }

  async findAllModalidades(
    query?: QueryModalidadeDto,
  ): Promise<{ modalidades: Modalidade[]; count: number }> {
    return this.modalidadeRepository.findAllModalidades(query);
  }

  async findOneModalidade(uuid: string): Promise<Modalidade> {
    const modalidade =
      await this.modalidadeRepository.findOneModalidade(uuid);

    if (!modalidade) {
      throw new AppError(
        "Modalidade not found",
        404,
        "MODALIDADE_NOT_FOUND",
      );
    }

    return modalidade;
  }

  async updateModalidade(
    uuid: string,
    data: UpdateModalidadeDto,
  ): Promise<Modalidade> {
    const payload: UpdateModalidadeDto = {};

    if (data.nome !== undefined) {
      const nome = this.normalizeNome(data.nome);

      if (!nome) {
        throw new AppError(
          "Nome cannot be empty",
          400,
          "MODALIDADE_NOME_REQUIRED",
        );
      }

      await this.assertNomeDisponivel(nome, uuid);
      payload.nome = nome;
    }

    const modalidade = await this.modalidadeRepository.updateModalidade(
      uuid,
      payload,
    );

    if (!modalidade) {
      throw new AppError(
        "Modalidade not found",
        404,
        "MODALIDADE_NOT_FOUND",
      );
    }

    return modalidade;
  }

  async deleteModalidade(uuid: string): Promise<boolean> {
    const deleted = await this.modalidadeRepository.deleteModalidade(uuid);

    if (!deleted) {
      throw new AppError(
        "Modalidade not found",
        404,
        "MODALIDADE_NOT_FOUND",
      );
    }

    return deleted;
  }
}
