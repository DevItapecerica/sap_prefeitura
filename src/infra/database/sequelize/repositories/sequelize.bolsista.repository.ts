import { Op } from "sequelize";
import { IBolsistaRepository } from "../../../../modules/ft-bolsista/domain/repository/IBolsistaRepository.js";
import db from "../index.js";
import { Bolsista } from "../../../../modules/ft-bolsista/domain/entity/Bolsista.js";
import { BolsistaQueryDto } from "../../../../modules/ft-bolsista/application/dto/bolsista-query.dto.js";
import bolsistaDto from "../../../../modules/ft-bolsista/application/dto/bolsista.dto.js";

export class SequelizeBolsistaRepository implements IBolsistaRepository {
  private model = db.BolsistaModel;

  async findAll(query: BolsistaQueryDto): Promise<{
    bolsistas: Bolsista[];
    count: number;
  }> {
    const { page, limit, name, local, cpf, order } = query;
    const queryOrder = order ? order.split(":") : ["id", "desc"];

    const offset = limit ? Number(page) * Number(limit) : undefined;

    const where = {
      [Op.and]: [
        { nome: { [Op.like]: `%${name ? name : ""}%` } },
        { local: { [Op.like]: `%${local ? local : ""}%` } },
        { cpf: { [Op.like]: `%${cpf ? cpf : ""}%` } },
      ],
    };

    const queryData = {
      offset,
      where,
      limit: limit,
      order: [[queryOrder[0], queryOrder[1]]],
    };

    const bolsista = await this.model.findAll(queryData);
    return {
      bolsistas: bolsista.map((b: any) => this.toEntity(b)),
      count: bolsista.length,
    };
  }

  async save(bolsista: bolsistaDto): Promise<Bolsista> {
    const newBolsista = await this.model.create(bolsista);

    return this.toEntity(newBolsista);
  }

  async findById(id: number | string): Promise<Bolsista | null> {
    const bolsista = await this.model.findByPk(id);
    return bolsista ? this.toEntity(bolsista) : null;
  }

  async update(id: number | string, bolsista: bolsistaDto): Promise<Bolsista | null> {
    const isBolsista = await this.model.findByPk(id);

    if (!isBolsista) return null;

    isBolsista.update(bolsista);
    return this.toEntity(isBolsista);
  }

  async delete(id: number | string): Promise<boolean> {
    const isBolsista = await this.model.findByPk(id);
    if (!isBolsista) return false;
    await isBolsista.destroy();
    return true;
  }

  private toEntity(data: any): Bolsista {
    return new Bolsista(
      data.nome,
      data.cpf,
      data.local,
      data.status,

      data.id,
      data.createdAt,
      data.updatedAt,
    );
  }
}
