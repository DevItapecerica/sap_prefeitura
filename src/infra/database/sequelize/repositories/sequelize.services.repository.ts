import { Op } from "sequelize";
import db from "../index.js";
import { ServiceListResult } from "../../../../modules/services/domain/repository/service-list-result.js";
import { ServiceQuery } from "../../../../modules/services/domain/repository/service-query.js";
import {
  ServicesRepository,
  ServiceWriteData,
} from "../../../../modules/services/domain/repository/services.repository.js";
import { Services } from "../../../../modules/services/domain/entity/Services.js";

export class SequelizeServicesRepository implements ServicesRepository {
  private model = db.ServiceModel;

  async getAllServices(
    query: ServiceQuery,
  ): Promise<ServiceListResult> {

    const { page = 0, limit, search, order = "id:desc" } = query;
    
    const queryOrder = order ? order.split(":") : ["id", "desc"];
    const queryLimit = limit ? Number(limit) : undefined;

    const offset = queryLimit ? Number(page) * queryLimit : undefined;

    const where = search
      ? {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { tag: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};
    const services = await this.model.findAll({
      offset,
      where,
      limit: queryLimit,
      order: [[queryOrder[0], queryOrder[1]]],
    });

    return {
      services: services.map((service: any) => this.toEntity(service)),
      count: await this.model.count({ where }),
    };
}

  async getOneServices(id: number): Promise<Services | null> {
    const data = await this.model.findByPk(id);

    if (!data) return null;

    return this.toEntity(data);
  }
  async createServices(service: ServiceWriteData): Promise<Services> {
    const created = await this.model.create(service);
    return this.toEntity(created);
  }

  async updateServices(
    id: number,
    service: ServiceWriteData,
  ): Promise<Services | null> {
    const current = await this.model.findByPk(id);
    if (!current) return null;
    await current.update(service);
    return this.toEntity(current);
  }
  async deleteOneServices(id: number): Promise<boolean> {
    const deleted = await this.model.destroy({
      where: { id },
    });

    return deleted > 0;
  }

  // 🔥 mapper (ESSENCIAL)
  private toEntity(data: any): Services {
    return new Services(
      data.id,
      data.name,
      data.description,
      data.tag,
      data.url,
      data.createdAt,
      data.updatedAt,
      data.deletedAt,
    );
  }
}
