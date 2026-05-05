import { Op } from "sequelize";
import { QueryParams } from "../../../../core/types/genericTypes.js";
import db from "../index.js";
import CarterinhaRepository from "../../../../modules/carterinhas/domain/repositories/carterinha.repository.js";
import Carterinha from "../../../../modules/carterinhas/domain/entity/Carteirinha.js";

export class SequelizeCarterinhaRepository implements CarterinhaRepository {
  private model = db.CarteirinhaModel;

  async getCarterinhas(): Promise<{
    carterinhas: Carterinha[];
    count: number;
  }> {
    const carterinhas = await this.model.findAll();
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

  async getCarterinhaById(id: number): Promise<Carterinha | null> {
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
      data.setor_uuid,
      data.atividade_uuid,
      data.municipe_uuid,
      data.author,

      data.uuid,
      data.numero_carterinha,
      data.createdAt,
      data.updatedAt,
      data.deletedAt,
    );
  }
}
