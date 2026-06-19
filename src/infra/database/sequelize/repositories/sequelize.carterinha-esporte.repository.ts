import { Op } from "sequelize";
import db from "../index.js";
import {
  QueryCarterinhaEsporteByMunicipeDto,
  QueryCarterinhaEsporteDto,
} from "../../../../modules/carterinha-esporte/application/dto/queryCarterinhaEsporte.dto.js";
import CarterinhaEsporte from "../../../../modules/carterinha-esporte/domain/entity/CarterinhaEsporte.js";
import CarterinhaEsporteRepository from "../../../../modules/carterinha-esporte/domain/repositories/carterinha-esporte.repository.js";

export class SequelizeCarterinhaEsporteRepository
  implements CarterinhaEsporteRepository
{
  private model = db.CarteirinhaEsporteModel;

  async list(query: QueryCarterinhaEsporteDto): Promise<{
    carterinhas: CarterinhaEsporte[];
    count: number;
  }> {
    const queryData = this.buildQueryData(query);
    const carterinhas = await this.model.findAll(queryData);
    const count = await this.model.count({ where: queryData.where });

    return {
      carterinhas: carterinhas.map((carterinha: any) =>
        this.toEntity(carterinha),
      ),
      count,
    };
  }

  async listByMunicipe(
    query: QueryCarterinhaEsporteByMunicipeDto,
  ): Promise<{ carterinhas: CarterinhaEsporte[]; count: number }> {
    const queryData = this.buildQueryData(query, {
      municipe_uuid: query.municipe_uuid,
    });
    const carterinhas = await this.model.findAll(queryData);
    const count = await this.model.count({ where: queryData.where });

    return {
      carterinhas: carterinhas.map((carterinha: any) =>
        this.toEntity(carterinha),
      ),
      count,
    };
  }

  async create(carterinha: CarterinhaEsporte): Promise<CarterinhaEsporte> {
    const newCarterinha = await this.model.create(carterinha);
    return this.toEntity(newCarterinha);
  }

  async findById(id: string): Promise<CarterinhaEsporte | null> {
    const carterinha = await this.model.findByPk(id);
    return carterinha ? this.toEntity(carterinha) : null;
  }

  private buildQueryData(
    query: QueryCarterinhaEsporteDto,
    extraWhere: Record<string, unknown> = {},
  ) {
    const { page, limit, modalidade, order } = query;
    const queryOrder = order ? order.split(":") : ["uuid", "desc"];
    const queryLimit = limit ? Number(limit) : undefined;
    const queryPage = page ? Number(page) : 0;
    const offset = queryLimit ? queryPage * queryLimit : undefined;
    const where: Record<string, unknown> = { ...extraWhere };

    if (modalidade) {
      where.modalidade = { [Op.like]: `%${modalidade}%` };
    }

    return {
      offset,
      where,
      limit: queryLimit,
      order: [[queryOrder[0], queryOrder[1]]],
    };
  }

  private toEntity(data: any): CarterinhaEsporte {
    return new CarterinhaEsporte(
      data.emissao,
      data.validade,
      data.municipe_uuid,
      data.modalidade,
      data.author,
      data.uuid,
      data.createdAt,
      data.updatedAt,
      data.deletedAt,
    );
  }
}
