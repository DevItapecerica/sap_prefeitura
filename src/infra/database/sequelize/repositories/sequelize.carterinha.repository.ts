import db from "../index.js";
import CarterinhaRepository from "../../../../modules/carterinhas/domain/repositories/carterinha.repository.js";
import Carterinha from "../../../../modules/carterinhas/domain/entity/Carteirinha.js";
import { QueryCarterinhasDto } from "../../../../modules/carterinhas/application/dto/queryCarterinhas.dto.js";
import { Op } from "sequelize";

export class SequelizeCarterinhaRepository implements CarterinhaRepository {
  private model = db.CarteirinhaModel;

  async getCarterinhas(query: QueryCarterinhasDto): Promise<{
    carterinhas: Carterinha[];
    count: number;
  }> {
    const { page, limit,  origem, servico, order } = query;
    const queryOrder = order ? order.split(":") : ["uuid", "desc"];
    const queryLimit = limit ? Number(limit) : undefined;
    const queryPage = page ? Number(page) : 0;

    const offset = queryLimit ? queryPage * queryLimit : undefined;

    const where = {
      [Op.or]: [
        { origem: { [Op.like]: `%${origem ? origem : ""}%` } },
        { atividade_uuid: { [Op.like]: `%${servico ? servico: ""}%` } },
      ],
    };

    const queryData = {
      offset,
      where,
      limit: queryLimit,
      order: [[queryOrder[0], queryOrder[1]]],
    };

    const carterinhas = await this.model.findAll(queryData);
    return {
      carterinhas: carterinhas.map((carterinha: Carterinha) =>
        this.toEntity(carterinha),
      ),
      count: carterinhas.length,
    };
  }

  async postCarterinhas(carterinha: Carterinha): Promise<Carterinha> {
    const newCarterinha = await this.model.create(carterinha);
    return this.toEntity(newCarterinha);
  }

  async getCarterinhaById(id: number | string): Promise<Carterinha | null> {
    const carterinha = await this.model.findByPk(id);
    return carterinha ? this.toEntity(carterinha) : null;
  }

  async updateCarterinha(
    id: number,
    carterinha: Carterinha,
  ): Promise<Carterinha | null> {
    const isCarterinha = await this.model.findByPk(id);

    if (!isCarterinha) return null;

    isCarterinha.update(carterinha);
    return this.toEntity(isCarterinha);
  }

  async deleteCarterinha(id: number): Promise<boolean> {
    const isCarterinha = await this.model.findByPk(id);
    if (!isCarterinha) return false;
    await isCarterinha.destroy();
    return true;
  }

  // 🔥 mapper (ESSENCIAL)
  private toEntity(data: any): Carterinha {
    return new Carterinha(
      data.emissao,
      data.validade,
      data.origem,
      data.atividade_uuid,
      data.municipe_uuid,
      data.author,

      data.uuid,
      data.createdAt,
      data.updatedAt,
      data.deletedAt,
    );
  }
}
