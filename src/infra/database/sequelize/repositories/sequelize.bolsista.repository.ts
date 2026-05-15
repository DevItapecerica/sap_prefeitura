import { Op } from "sequelize";
import { IBolsistaRepository } from "../../../../modules/ft-bolsista/domain/repository/IBolsistaRepository.js";
import db from "../index.js";
import { Bolsista } from "../../../../modules/ft-bolsista/domain/entity/Bolsista.js";
import { BolsistaQueryDto } from "../../../../modules/ft-bolsista/application/dto/bolsista-query.dto.js";
import bolsistaDto from "../../../../modules/ft-bolsista/application/dto/bolsista.dto.js";
import Municipe from "../../../../modules/municipe/domain/entity/Municipe.js";

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
      [Op.and]: [{ local: { [Op.like]: `%${local ? local : ""}%` } }],
    };

    const queryData = {
      offset,
      where,
      limit: limit,
      order: [[queryOrder[0], queryOrder[1]]],
      include: {
        model: db.MunicipeModel,
        as: "municipe",
        where: {
          [Op.or]: [
            { nome: { [Op.like]: `%${name ? name : ""}%` } },
            { cpfHash: { [Op.like]: `%${name ? name : ""}%` } },
          ],
        },
      },
    };

    const bolsista = await this.model.findAll(queryData);

    const quantity = await this.model.count({
      where,
      include: {
        model: db.MunicipeModel,
        as: "municipe",
        where: {
          [Op.or]: [
            { nome: { [Op.like]: `%${name ? name : ""}%` } },
            { cpfHash: { [Op.like]: `%${name ? name : ""}%` } },
          ],
        },
      },
    });

    return {
      bolsistas: bolsista.map((b: any) => this.toEntity(b)),
      count: quantity,
    };
  }

  async save(bolsista: bolsistaDto): Promise<Bolsista> {
    const newBolsista = await this.model.create(bolsista);

    return this.toEntity(newBolsista);
  }

  async findById(id: number | string): Promise<Bolsista | null> {
    const bolsista = await this.model.findByPk(id, {
      include: {
        model: db.MunicipeModel,
        as: "municipe",
      },
    });
    return bolsista ? this.toEntity(bolsista) : null;
  }

  async update(
    id: number | string,
    bolsista: bolsistaDto,
  ): Promise<Bolsista | null> {
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
    data.municipe = new Municipe(
      data.municipe.nome,
      data.municipe.cpf,
      data.municipe.nascimento,
      data.municipe.telefone,
      data.municipe.rua,
      data.municipe.bairro,
      data.municipe.cidade,
      data.municipe.uf,
      data.municipe.cep,
      data.municipe.numero,
      data.municipe.complemento,
      data.municipe.author,

      data.municipe.uuid,
      data.municipe.createdAt,
      data.municipe.updatedAt,
      data.municipe.deletedAt,
    );

    return new Bolsista(
      data.municipe_uuid,
      data.local,
      data.status,

      data.uuid,
      data.createdAt,
      data.updatedAt,
      data.municipe,
    );
  }
}
