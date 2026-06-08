import { Op } from "sequelize";
import db from "../index.js";
import { QueryAtletaDto, UpdateAtletaDto } from "../../../../modules/esporte/application/dto/atleta.dto.js";
import AtletaRepository from "../../../../modules/esporte/domain/repository/atleta.repository.js";
import Atleta from "../../../../modules/esporte/domain/entity/Atleta.js";
import Municipe from "../../../../modules/municipe/domain/entity/Municipe.js";

export class SequelizeAtletaRepository implements AtletaRepository {
  private model = db.AtletaModel;
  private municipeModel = db.MunicipeModel;

  async createAtleta(atleta: Atleta): Promise<Atleta> {
    const created = await this.model.create(atleta);
    return this.toEntity(created);
  }

  async findAllAtletas(query?: QueryAtletaDto): Promise<{ atletas: Atleta[]; count: number }> {
    const q = query || {};
    const where: any = {};
    const municipeWhere: any = {};

    if (q.municipe_uuid) where.municipe_uuid = q.municipe_uuid;

    if (q.ativo !== undefined) {
      where.ativo = q.ativo === true || q.ativo === "true";
    }

    if (q.search) {
      municipeWhere[Op.or] = [
        { nome: { [Op.like]: `%${q.search}%` } },
        { cpfHash: { [Op.like]: `%${q.search}%` } },
        { cepHash: { [Op.like]: `%${q.search}%` } },
      ];
    }

    const queryOrder = q.order ? q.order.split(":") : ["createdAt", "desc"];
    const limit = q.limit ? Number(q.limit) : undefined;
    const offset = q.limit ? Number(q.page || 0) * Number(q.limit) : undefined;
    const include = [{
      model: this.municipeModel,
      as: "municipe",
      required: Boolean(q.search),
      where: Object.keys(municipeWhere).length ? municipeWhere : undefined,
    }];

    const atletas = await this.model.findAll({
      where,
      include,
      order: [[queryOrder[0], queryOrder[1]]],
      limit,
      offset,
    });

    const count = await this.model.count({
      where,
      include,
      distinct: true,
    });

    return {
      atletas: atletas.map((atleta: any) => this.toEntity(atleta)),
      count,
    };
  }

  async findOneAtleta(uuid: string): Promise<Atleta | null> {
    const atleta = await this.model.findByPk(uuid, {
      include: [{
        model: this.municipeModel,
        as: "municipe",
      }],
    });

    return atleta ? this.toEntity(atleta) : null;
  }

  async findActiveByMunicipe(municipe_uuid: string): Promise<Atleta | null> {
    const atleta = await this.model.findOne({
      where: { municipe_uuid, ativo: true },
    });

    return atleta ? this.toEntity(atleta) : null;
  }

  async updateAtleta(uuid: string, data: UpdateAtletaDto): Promise<Atleta | null> {
    const atleta = await this.model.findByPk(uuid);

    if (!atleta) return null;

    await atleta.update(data);

    return this.findOneAtleta(uuid);
  }

  async deleteAtleta(uuid: string): Promise<boolean> {
    const deleted = await this.model.destroy({ where: { uuid } });
    return deleted > 0;
  }

  private toEntity(data: any): Atleta {
    const municipe = data.municipe
      ? new Municipe(
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
        )
      : null;

    return new Atleta(
      data.municipe_uuid,
      data.ativo,
      data.author,
      data.uuid,
      data.createdAt,
      data.updatedAt,
      data.deletedAt,
      municipe,
    );
  }
}
