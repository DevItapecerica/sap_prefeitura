import { Op } from "sequelize";
import { QueryParams } from "../../../../core/shared/types/genericTypes.js";
import db from "../index.js";
import { ServicesRepository } from "../../../../modules/services/domain/repository/services.repository.js";
import { Services } from "../../../../modules/services/domain/entity/Services.js";
import { CreateServicesDto, UpdateServicesDto } from "../../../../modules/services/application/dto/services.dto.js";

export class SequelizeServicesRepository implements ServicesRepository {
  private model = db.ServiceModel;

  async getAllServices(
    query: QueryParams,
  ): Promise<{ services: Services[]; count: number }> {

    const { page = "0", limit, search = null, order = "id:desc" } = query;
    
    const queryOrder = order ? order.split(":") : ["id", "desc"];

    const offset = limit ? Number(page) * Number(limit) : undefined;

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
      limit: limit,
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
  async createServices(service: CreateServicesDto): Promise<Services> {
    const created = await this.model.create(service);
    return this.toEntity(created);
  }

  async updateServices(id: number, service: UpdateServicesDto): Promise<Services> {
    const updated = await this.model.update(service, {
      where: { id },
    });
    return this.toEntity(updated);
  }
  async deleteOneServices(id: number): Promise<boolean> {
    const deleted = await this.model.destroy({
      where: { id },
    });

    return deleted > 0;
  }

  // 🔥 mapper (ESSENCIAL)
  private toEntity(data: Services): Services {
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
