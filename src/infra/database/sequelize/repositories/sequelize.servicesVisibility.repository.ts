import db from "../index.js";
import { ServiceVisibilityRepository } from "../../../../modules/services/domain/repository/service-visibility.repository.js";
import { ServiceVisibility } from "../../../../modules/services/domain/entity/ServiceVisibility.js";

export class SequelizeServiceVisibilityRepository
  implements ServiceVisibilityRepository
{
  private model = db.ServiceVisibilities;

  async findOneServiceVisibility(
    service_id: number,
  ): Promise<ServiceVisibility[]> {
    const data = await this.model.findAll({
      where: { service_id: service_id },
    });

    return data.map((item: any) => this.toEntity(item));
  }

  async findVisibilityByServiceAndSetor(setor_id: number, service_id: number) {
    const data = await this.model.findOne({
      where: { setor_id: setor_id, service_id: service_id },
    });

    return data ? this.toEntity(data) : null;
  }

  async createServiceVisibility(
    setor_id: number,
    service_id: number,
    visibility = false,
  ): Promise<ServiceVisibility> {
    const created = await this.model.create({ setor_id, service_id, visibility });
    return this.toEntity(created);
  }

  async findVisibilityBySetor(setor_id: number): Promise<ServiceVisibility[]> {
    const data = await this.model.findAll({ where: { setor_id: setor_id } });
    return data.map((item: any) => this.toEntity(item));
  }

  async updateServiceVisibility(
    id: number,
    visibility: boolean,
  ): Promise<ServiceVisibility | null> {
    const current = await this.model.findByPk(id);
    if (!current) return null;
    await current.update({ visibility });
    return this.toEntity(current);
  }

  // 🔥 mapper (ESSENCIAL)
  private toEntity(data: any): ServiceVisibility {
    return new ServiceVisibility(
      data.setor_id,
      data.service_id,
      data.visibility,
      data.id,
    );
  }
}
