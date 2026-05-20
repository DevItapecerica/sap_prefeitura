import { QueryParams } from "../../../../core/types/genericTypes.js";
import { Op } from "sequelize";
import {
  Chamado,
  ChamadoStatus,
  ChamadoTipo,
  ChamadoPrioridade,
} from "../../../../modules/chamados/domain/entity/Chamado.js";
import { ChamadoRepository } from "../../../../modules/chamados/domain/repository/chamado.repository.js";
import db from "../index.js";

export class SequelizeChamadoRepository implements ChamadoRepository {
  private model = db.ChamadoModel;

  async findOneChamado(id: string): Promise<Chamado | null> {
    const data = await this.model.findByPk(id);

    if (!data) return null;

    return this.toEntity(data);
  }

  async findAllChamado(query?: QueryParams): Promise<Chamado[]> {
    // Suporta filtros adicionais enviados via query (status, setorId, solicitanteId, responsavelId, tipo, prioridade, dateFrom, dateTo)
    const where: any = {};

    const q: any = query || {};

    if (q.status) where.status = q.status;
    if (q.setorId) where.setorId = Number(q.setorId);
    if (q.solicitanteId) where.solicitanteId = Number(q.solicitanteId);
    if (q.responsavelId) where.responsavelId = Number(q.responsavelId);
    if (q.tipo) where.tipo = q.tipo;
    if (q.prioridade) where.prioridade = q.prioridade;

    if (q.dateFrom || q.dateTo) {
      where.dataEntrada = {};
      if (q.dateFrom) where.dataEntrada[Op.gte] = new Date(q.dateFrom);
      if (q.dateTo) where.dataEntrada[Op.lte] = new Date(q.dateTo);
    }

    if (q.search) {
      where[Op.or] = [
        { patrimonio: { [Op.like]: `%${q.search}%` } },
        { descricao: { [Op.like]: `%${q.search}%` } },
      ];
    }

    const limit = q.limit ? Number(q.limit) : undefined;
    const offset = q.limit && q.page ? Number(q.page) * Number(q.limit) : undefined;

    const data = await this.model.findAll({
      where,
      order: [["dataEntrada", "DESC"]],
      limit,
      offset,
    });

    return data.map((item: any) => this.toEntity(item));
  }

  async createChamado(chamado: Chamado): Promise<Chamado> {
    const created = await this.model.create({
      id: chamado.id,
      patrimonio: chamado.patrimonio,
      status: chamado.status,
      tipo: chamado.tipo,
      dataEntrada: chamado.dataEntrada,
      setorId: chamado.setorId,
      solicitanteId: chamado.solicitanteId,
      descricao: chamado.descricao,
      prioridade: chamado.prioridade,
      responsavelId: chamado.responsavelId || null,
      observacoes: chamado.observacoes || null,
      dataResolucao: chamado.dataResolucao || null,
    });

    return this.toEntity(created);
  }

  async updateChamado(id: string, chamado: Partial<Chamado>): Promise<Chamado | null> {
    const isChamado = await this.model.findByPk(id);

    if (!isChamado) return null;

    await isChamado.update(chamado);

    return this.toEntity(isChamado);
  }

  async deleteChamado(id: string): Promise<boolean> {
    const deleted = await this.model.destroy({
      where: { id },
    });

    return deleted > 0;
  }

  // 🔥 mapper (ESSENCIAL)
  private toEntity(data: any): Chamado {
    return new Chamado(
      data.id,
      data.patrimonio,
      data.status as ChamadoStatus,
      data.tipo as ChamadoTipo,
      data.dataEntrada,
      data.setorId,
      data.solicitanteId,
      data.descricao,
      data.prioridade as ChamadoPrioridade,
      data.responsavelId || null,
      data.observacoes || null,
      data.dataResolucao || null,
      data.createdAt,
      data.updatedAt,
      data.deletedAt || null,
    );
  }
}
