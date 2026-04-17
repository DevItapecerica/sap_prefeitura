import { QueryParams } from "../../../../core/shared/types/genericTypes.js";
import { Setor } from "../../../../modules/setor/setor.entity.js";
import { SetorRepository } from "../../../../modules/setor/setor.repository.js";
import db from "../index.js";

export class SequelizeSetorRepository implements SetorRepository {
  private model = db.SetorModel;

  async findOneSetor(id: number): Promise<Setor | null> {
    const data = await this.model.findByPk(id);

    if (!data) return null;

    return this.toEntity(data);
  }

  async findAllSetor(query?: QueryParams): Promise<Setor[]> {
    const data = await this.model.findAll();

    return data.map((item: any) => this.toEntity(item));
  }

  async createSetor(setor: Setor): Promise<Setor> {
    const created = await this.model.create({
      name: setor.name,
      description: setor.description,
    });

    return this.toEntity(created);
  }

  async updateSetor(id: number, setor: Partial<Setor>): Promise<Setor | null> {
    const isSetor = await this.model.findByPk(id);

    if (!isSetor) return null;

    isSetor.update(setor)

    return this.toEntity(isSetor);
  }

  async deleteSetor(id: number): Promise<boolean> {
    const deleted = await this.model.destroy({
      where: { id },
    });

    return deleted > 0;
  }

  // 🔥 mapper (ESSENCIAL)
  private toEntity(data: any): Setor {
    return new Setor(data.id, data.name, data.description);
  }
}
