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

    const hasSolicitante = chamado.solicitanteId !== undefined && chamado.solicitanteId !== null;
    let solicitanteId: number | null = null;
    let responsavelId: number | null = null;

    if (hasSolicitante) {
      solicitanteId = chamado.solicitanteId as number;

      if (!solicitanteId || Number.isNaN(Number(solicitanteId))) {
        throw new AppError("Solicitante inválido", 400, "SOLICITANTE_INVALIDO");
      }

      const solicitante = await this.userRepository.getUserById(solicitanteId);
      if (!solicitante) {
        throw new AppError("Solicitante não encontrado", 404, "SOLICITANTE_NOT_FOUND");
      }
    }

    if (chamado.responsavelId) {
      responsavelId = chamado.responsavelId;

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
      solicitanteId,
      chamado.descricao,
      chamado.prioridade,
      responsavelId,
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

    if ([
      ChamadoStatus.RESOLVIDO,
      ChamadoStatus.FECHADO,
      ChamadoStatus.CANCELADO,
    ].includes(existingChamado.status)) {
      throw new AppError(
        "Chamado finalizado não pode ser alterado",
        400,
        "CHAMADO_FINALIZADO",
      );
    }

    if (chamado.responsavelId) {
      const responsavelId = chamado.responsavelId;

      if (!responsavelId || Number.isNaN(Number(responsavelId))) {
        throw new AppError("Responsavel invalido", 400, "RESPONSAVEL_INVALIDO");
      }

      const responsavel = await this.userRepository.getUserById(responsavelId);
      if (!responsavel) {
        throw new AppError("Responsável não encontrado", 404, "RESPONSAVEL_NOT_FOUND");
      }
    }

    // Registra dataResolucao quando o chamado é finalizado (RESOLVIDO, FECHADO ou CANCELADO)
    if ([
      ChamadoStatus.RESOLVIDO,
      ChamadoStatus.FECHADO,
      ChamadoStatus.CANCELADO,
    ].includes(chamado.status as ChamadoStatus) && !chamado.dataResolucao) {
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

    if ([
      ChamadoStatus.RESOLVIDO,
      ChamadoStatus.FECHADO,
      ChamadoStatus.CANCELADO,
    ].includes(chamado.status)) {
      throw new AppError(
        "Chamado finalizado não pode ser atribuído",
        400,
        "CHAMADO_FINALIZADO",
      );
    }

    const responsavel = await this.userRepository.getUserById(responsavelId);
    if (!responsavel) {
      throw new AppError("Responsável não encontrado", 404, "RESPONSAVEL_NOT_FOUND");
    }

    const updated = await this.repo.updateChamado(chamadoId, {
      responsavelId,
      status: ChamadoStatus.EM_PROGRESSO,
    });

    if (!updated) {
      throw new AppError("Erro ao atualizar chamado", 500, "UPDATE_ERROR");
    }

    await eventBus.emit("CHAMADO_ASSIGNED", updated);

    return updated;
  }

  /**
   * Gera relatório com tempo médio de resolução de chamados
   * Agrupa por período (mensal, semestral, anual)
   */
  async getAverageTimeReport(query?: QueryParams): Promise<any> {
    this.logger.info("Gerando relatório de tempo médio de resolução");

    const q: any = query || {};
    const period = q.period || "mensal"; // mensal, semestral, anual
    const year = q.year || new Date().getFullYear();
    const setorId = q.setorId ? Number(q.setorId) : undefined;
    const tipo = q.tipo;

    const chamados = await this.repo.findAllChamado({
      status: [
        ChamadoStatus.RESOLVIDO,
        ChamadoStatus.FECHADO,
        ChamadoStatus.CANCELADO,
      ],
      dateFrom: `${year}-01-01T00:00:00.000Z`,
      dateTo: `${year}-12-31T23:59:59.999Z`,
      setorId,
      tipo,
    } as QueryParams);

    // Filtra chamados com dataResolucao e status finalizados
    let finalizados = chamados.filter(
      (c) =>
        c.dataResolucao &&
        new Date(c.dataResolucao).getFullYear() === Number(year) &&
        [ChamadoStatus.RESOLVIDO, ChamadoStatus.FECHADO, ChamadoStatus.CANCELADO].includes(
          c.status as ChamadoStatus
        ),
    );

    // Aplica filtro por setorId se fornecido
    if (setorId) {
      finalizados = finalizados.filter((c) => c.setorId === setorId);
    }

    // Aplica filtro por tipo se fornecido
    if (tipo) {
      finalizados = finalizados.filter((c) => c.tipo === tipo);
    }

    if (finalizados.length === 0) {
      return {
        period,
        year,
        setorId,
        tipo,
        dados: [],
        totalChamados: 0,
        tempoMedioHoras: 0,
        tempoMedioDias: 0,
      };
    }

    // Agrupa por período
    const grouped: Record<string, any[]> = {};

    finalizados.forEach((chamado) => {
      const dataResolucao = new Date(chamado.dataResolucao as Date);
      let groupKey: string;

      if (period === "mensal") {
        const mes = String(dataResolucao.getMonth() + 1).padStart(2, "0");
        groupKey = `${year}-${mes}`;
      } else if (period === "semestral") {
        const semestre = dataResolucao.getMonth() < 6 ? 1 : 2;
        groupKey = `${year}-S${semestre}`;
      } else {
        // anual
        groupKey = String(year);
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(chamado);
    });

    // Calcula tempo médio por período
    const dados = Object.entries(grouped).map(([periodo, chamadosPeriodo]) => {
      const temposHoras = chamadosPeriodo
        .map((c) => {
          const dataEntrada = new Date(c.dataEntrada);
          const dataResolucao = new Date(c.dataResolucao as Date);
          const diffMs = dataResolucao.getTime() - dataEntrada.getTime();
          const diffHoras = diffMs / (1000 * 60 * 60);
          return diffHoras;
        })
        .filter((h) => h >= 0); // Remove valores negativos

      const tempoMedioHoras =
        temposHoras.length > 0
          ? temposHoras.reduce((a, b) => a + b, 0) / temposHoras.length
          : 0;
      const tempoMedioDias = tempoMedioHoras / 24;

      return {
        periodo,
        totalChamados: chamadosPeriodo.length,
        tempoMedioHoras: Number(tempoMedioHoras.toFixed(2)),
        tempoMedioDias: Number(tempoMedioDias.toFixed(2)),
        tempoMinimoHoras: temposHoras.length > 0 ? Number(Math.min(...temposHoras).toFixed(2)) : 0,
        tempoMaximoHoras: temposHoras.length > 0 ? Number(Math.max(...temposHoras).toFixed(2)) : 0,
      };
    });

    // Calcula tempo médio total
    const totalChamados = finalizados.length;
    const allTemposHoras = finalizados
      .map((c) => {
        const dataEntrada = new Date(c.dataEntrada);
        const dataResolucao = new Date(c.dataResolucao as Date);
        const diffMs = dataResolucao.getTime() - dataEntrada.getTime();
        const diffHoras = diffMs / (1000 * 60 * 60);
        return diffHoras;
      })
      .filter((h) => h >= 0);

    const tempoMedioHorasTotal =
      allTemposHoras.length > 0
        ? allTemposHoras.reduce((a, b) => a + b, 0) / allTemposHoras.length
        : 0;
    const tempoMedioDiasTotal = tempoMedioHorasTotal / 24;

    return {
      period,
      year,
      setorId: setorId || "Todos",
      tipo: tipo || "Todos",
      dados: dados.sort((a, b) => a.periodo.localeCompare(b.periodo)),
      totalChamados,
      tempoMedioHoras: Number(tempoMedioHorasTotal.toFixed(2)),
      tempoMedioDias: Number(tempoMedioDiasTotal.toFixed(2)),
      tempoMinimoHoras: allTemposHoras.length > 0 ? Number(Math.min(...allTemposHoras).toFixed(2)) : 0,
      tempoMaximoHoras: allTemposHoras.length > 0 ? Number(Math.max(...allTemposHoras).toFixed(2)) : 0,
    };
  }
}
