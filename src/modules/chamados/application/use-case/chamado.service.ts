import { QueryParams } from "../../../../core/types/genericTypes.js";
import { CreateChamadoDto, UpdateChamadoDto } from "../dto/chamado.dto.js";
import { Chamado, ChamadoStatus } from "../../domain/entity/Chamado.js";
import { ChamadoRepository } from "../../domain/repository/chamado.repository.js";
import UserRepository from "../../../user/domain/repository/user.repository.js";
import { SetorRepository } from "../../../setor/domain/repository/setor.repository.js";
import { eventBus } from "../../../../core/event/index.js";
import { AppError } from "../../../../core/appError.js";
import { v4 as uuid } from "uuid";

export class ChamadoService {
  constructor(
    private repo: ChamadoRepository,
    private userRepository: UserRepository,
    private setorRepository: SetorRepository,
    private logger: any,
  ) {}

  async createChamado(chamado: CreateChamadoDto) {
    this.logger.info("Criando novo chamado");

    const setor = await this.setorRepository.findOneSetor(chamado.setorId);
    if (!setor) {
      throw new AppError("Setor não encontrado", 404, "SETOR_NOT_FOUND");
    }

    const solicitanteId = typeof chamado.solicitanteId === "string"
      ? Number(chamado.solicitanteId)
      : chamado.solicitanteId;

    if (!solicitanteId || Number.isNaN(Number(solicitanteId))) {
      throw new AppError("Solicitante inválido", 400, "SOLICITANTE_INVALIDO");
    }

    const solicitante = await this.userRepository.getUserById(solicitanteId);
    if (!solicitante) {
      throw new AppError("Solicitante não encontrado", 404, "SOLICITANTE_NOT_FOUND");
    }

    if (chamado.responsavelId) {
      const responsavelId = typeof chamado.responsavelId === "string"
        ? Number(chamado.responsavelId)
        : chamado.responsavelId;

      if (!responsavelId || Number.isNaN(Number(responsavelId))) {
        throw new AppError("Responsável inválido", 400, "RESPONSAVEL_INVALIDO");
      }

      const responsavel = await this.userRepository.getUserById(responsavelId);
      if (!responsavel) {
        throw new AppError("Responsável não encontrado", 404, "RESPONSAVEL_NOT_FOUND");
      }
    }

    const newChamado = new Chamado(
      uuid(),
      chamado.patrimonio,
      ChamadoStatus.ABERTO,
      chamado.tipo,
      new Date(),
      chamado.setorId,
      chamado.solicitanteId,
      chamado.descricao,
      chamado.prioridade,
      chamado.responsavelId || null,
      chamado.observacoes || null,
      null,
    );

    const data = await this.repo.createChamado(newChamado);

    await eventBus.emit("CHAMADO_CREATED", data);

    return data;
  }

  async findAllChamado(query?: QueryParams): Promise<Chamado[]> {
    this.logger.info("Buscando todos os chamados");

    const data = await this.repo.findAllChamado(query);
    return data;
  }

  async findOneChamado(id: string): Promise<Chamado> {
    this.logger.info("Buscando chamado por ID");

    const data = await this.repo.findOneChamado(id);
    
    if (!data) {
      throw new AppError("Chamado não encontrado", 404, "CHAMADO_NOT_FOUND");
    }

    return data;
  }

  async updateChamado(id: string, chamado: UpdateChamadoDto): Promise<Chamado> {
    this.logger.info("Atualizando chamado");

    const existingChamado = await this.repo.findOneChamado(id);
    
    if (!existingChamado) {
      throw new AppError("Chamado não encontrado", 404, "CHAMADO_NOT_FOUND");
    }

    if (chamado.responsavelId) {
      const responsavelId = typeof chamado.responsavelId === "string"
        ? Number(chamado.responsavelId)
        : chamado.responsavelId;

      const responsavel = await this.userRepository.getUserById(responsavelId);
      if (!responsavel) {
        throw new AppError("Responsável não encontrado", 404, "RESPONSAVEL_NOT_FOUND");
      }
    }

    if (chamado.status === ChamadoStatus.RESOLVIDO && !chamado.dataResolucao) {
      chamado.dataResolucao = new Date();
    }

    const data = await this.repo.updateChamado(id, chamado);
    
    if (!data) {
      throw new AppError("Erro ao atualizar chamado", 500, "UPDATE_ERROR");
    }

    await eventBus.emit("CHAMADO_UPDATED", data);

    return data;
  }

  async deleteChamado(id: string): Promise<boolean> {
    this.logger.info("Deletando chamado");

    const exists = await this.repo.findOneChamado(id);
    
    if (!exists) {
      throw new AppError("Chamado não encontrado", 404, "CHAMADO_NOT_FOUND");
    }

    const deleted = await this.repo.deleteChamado(id);

    if (deleted) {
      await eventBus.emit("CHAMADO_DELETED", { id });
    }

    return deleted;
  }

  async getReport(query?: QueryParams): Promise<Chamado[]> {
    this.logger.info("Gerando relatório de chamados");
    const data = await this.repo.findAllChamado(query);
    return data;
  }

  async assignResponsavel(chamadoId: string, responsavelId: number): Promise<Chamado> {
    this.logger.info("Atribuindo responsável ao chamado");

    const chamado = await this.repo.findOneChamado(chamadoId);
    
    if (!chamado) {
      throw new AppError("Chamado não encontrado", 404, "CHAMADO_NOT_FOUND");
    }

    const responsavel = await this.userRepository.getUserById(responsavelId);
    if (!responsavel) {
      throw new AppError("Responsável não encontrado", 404, "RESPONSAVEL_NOT_FOUND");
    }

    const updated = await this.repo.updateChamado(chamadoId, {
      responsavelId: String(responsavelId),
      status: ChamadoStatus.EM_PROGRESSO,
    });

    if (!updated) {
      throw new AppError("Erro ao atualizar chamado", 500, "UPDATE_ERROR");
    }

    await eventBus.emit("CHAMADO_ASSIGNED", updated);

    return updated;
  }
}
