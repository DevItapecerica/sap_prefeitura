import { Op } from "sequelize";
import db from "../index.js";
import {
  QueryModalidadeDto,
  UpdateModalidadeDto,
} from "../../../../modules/esporte/application/dto/modalidade.dto.js";
import ModalidadeRepository from "../../../../modules/esporte/domain/repository/modalidade.repository.js";
import Modalidade from "../../../../modules/esporte/domain/entity/Modalidade.js";

export class SequelizeModalidadeRepository implements ModalidadeRepository {
  private model = db.ModalidadeModel;

  async createModalidade(modalidade: Modalidade): Promise<Modalidade> {
    const created = await this.model.create(modalidade);
    return this.toEntity(created);
  }

  async findAllModalidades(
    query?: QueryModalidadeDto,
  ): Promise<{ modalidades: Modalidade[]; count: number }> {
    const q = query || {};
    const where: any = {};

    if (q.search) {
      where.nome = { [Op.like]: `%${q.search}%` };
    }

    const queryOrder = q.order ? q.order.split(":") : ["createdAt", "desc"];
    const limit = q.limit ? Number(q.limit) : undefined;
    const offset = q.limit ? Number(q.page || 0) * Number(q.limit) : undefined;

    const modalidades = await this.model.findAll({
      where,
      order: [[queryOrder[0], queryOrder[1]]],
      limit,
      offset,
    });

    const count = await this.model.count({ where });

    return {
      modalidades: modalidades.map((modalidade: any) =>
        this.toEntity(modalidade),
      ),
      count,
    };
  }

  async findOneModalidade(uuid: string): Promise<Modalidade | null> {
    const modalidade = await this.model.findByPk(uuid);
    return modalidade ? this.toEntity(modalidade) : null;
  }

  async findByNome(nome: string): Promise<Modalidade | null> {
    const modalidade = await this.model.findOne({
      where: { nome },
      paranoid: false,
    });
    return modalidade ? this.toEntity(modalidade) : null;
  }

  async updateModalidade(
    uuid: string,
    data: UpdateModalidadeDto,
  ): Promise<Modalidade | null> {
    const modalidade = await this.model.findByPk(uuid);

    if (!modalidade) return null;

    await modalidade.update(data);

    return this.findOneModalidade(uuid);
  }

  async deleteModalidade(uuid: string): Promise<boolean> {
    const deleted = await this.model.destroy({ where: { uuid } });
    return deleted > 0;
  }

  private toEntity(data: any): Modalidade {
    return new Modalidade(
      data.nome,
      data.uuid,
      data.createdAt,
      data.updatedAt,
      data.deletedAt,
    );
  }
}
