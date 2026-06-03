import db from "../index.js";
import MunicipeRepository from "../../../../modules/municipe/domain/repositories/Municipe.repository.js";
import Municipe from "../../../../modules/municipe/domain/entity/Municipe.js";
import { QueryParams } from "../../../../core/types/genericTypes.js";
import { Op } from "sequelize";
import {
  MunicipeDto,
  updateMunicipeDto,
} from "../../../../modules/municipe/application/dto/municipe.dto.js";
import AesCryptService from "../../../../core/security/aes/AesCrypt.service.js";
import Sha256CryptService from "../../../../core/security/sha256/sha256.service.js";

export class SequelizeMunicipeRepository implements MunicipeRepository {
  private model = db.MunicipeModel;

  async createMunicipe(
    municipe: MunicipeDto,
    cpfHash: string,
    cepHash: string,
  ): Promise<Municipe> {
    const payload = {
      ...municipe,
      cpfHash,
      cepHash,
    };

    const response = await this.model.create(payload);

    return this.toEntity(response);
  }

  async getMunicipe(
    query: QueryParams,
  ): Promise<{ municipe: Municipe[]; count: number }> {
    const { page, limit, search, order } = query;
    const queryOrder = order ? order.split(":") : ["uuid", "desc"];
    const queryLimit = limit ? Number(limit) : undefined;
    const queryPage = page ? Number(page) : 0;

    const offset = queryLimit ? queryPage * queryLimit : undefined;

    const where = search
      ? {
          [Op.or]: [
            { nome: { [Op.like]: `%${search}%` } },
            { cepHash: { [Op.like]: `%${search}%` } },
            { cpfHash: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const queryData = {
      offset,
      where,
      limit: queryLimit,
      order: [[queryOrder[0], queryOrder[1]]],
    };

    let municipe = await this.model.findAll(queryData);

    const municipeEntities = await Promise.all(
      municipe.map(async (m: any) => {
        return this.toEntity(m);
      }),
    );

    const count = await this.model.count({ where });
    return {
      municipe: municipeEntities,
      count: count,
    };
  }

  async getMunicipeById(uuid: string): Promise<Municipe | null> {
    const municipe = await this.model.findByPk(uuid);

    return municipe ? this.toEntity(municipe) : null;
  }

  async getMunicipeByCpf(cpf: string): Promise<Municipe | null> {
    const municipe = await this.model.findOne({ where: { cpfHash: cpf } });

    return municipe ? this.toEntity(municipe) : null;
  }

  async updateMunicipe(
    uuid: string,
    updated: updateMunicipeDto,
  ): Promise<Municipe | null> {
    const response = await this.model.update(updated, { where: { uuid } });

    return response[0] > 0 ? await this.getMunicipeById(uuid) : null;
  }

  async deleteMunicipe(uuid: string): Promise<boolean> {
    const response = await this.model.destroy({ where: { uuid } });
    return response > 0;
  }

  // 🔥 mapper (ESSENCIAL)
  private toEntity(data: any): Municipe {
    return new Municipe(
      data.nome,
      data.cpf,
      data.nascimento,
      data.telefone,
      data.rua,
      data.bairro,
      data.cidade,
      data.uf,
      data.cep,
      data.numero,
      data.complemento,
      data.author,

      data.uuid,
      data.createdAt,
      data.updatedAt,
      data.deletedAt,
    );
  }
}
