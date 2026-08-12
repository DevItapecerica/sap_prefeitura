import db from "../index.js";
import MunicipeRepository from "../../../../modules/municipe/domain/repositories/Municipe.repository.js";
import Municipe from "../../../../modules/municipe/domain/entity/Municipe.js";
import { QueryParams } from "../../../../core/types/genericTypes.js";
import { ModelStatic, Op, Order, UniqueConstraintError } from "sequelize";
import {
  updateMunicipeDto,
} from "../../../../modules/municipe/application/dto/municipe.dto.js";
import { MunicipeIdentityConflictError } from "../../../../modules/municipe/domain/errors/municipe-identity-conflict.error.js";
import { MunicipeDB } from "../models/municipes.model.js";

export class SequelizeMunicipeRepository implements MunicipeRepository {
  private model = db.MunicipeModel as ModelStatic<MunicipeDB>;

  async createMunicipe(
    municipe: Municipe,
    cpfHash: string,
    cepHash: string,
  ): Promise<Municipe> {
    const payload = {
      nome: municipe.nome,
      cpf: municipe.cpf,
      nascimento: municipe.nascimento,
      telefone: municipe.telefone,
      rua: municipe.rua,
      bairro: municipe.bairro,
      cidade: municipe.cidade,
      uf: municipe.uf,
      cep: municipe.cep,
      numero: municipe.numero,
      complemento: municipe.complemento,
      author: String(municipe.author),
      cpfHash,
      cepHash,
    };

    try {
      const response = await this.model.create(payload);
      return this.toEntity(response);
    } catch (error) {
      if (error instanceof UniqueConstraintError) throw new MunicipeIdentityConflictError();
      throw error;
    }
  }

  async getMunicipe(
    query: QueryParams,
  ): Promise<{ municipe: Municipe[]; count: number }> {
    const { page, limit, search, order, searchHash } = query;
    const allowedOrders = new Set(["uuid:asc", "uuid:desc", "nome:asc", "nome:desc", "createdAt:asc", "createdAt:desc"]);
    const safeOrder = order && allowedOrders.has(order) ? order : "uuid:desc";
    const [orderField, orderDirection] = safeOrder.split(":");
    const queryOrder: Order = [[orderField, orderDirection.toUpperCase()]];
    const queryLimit = limit ? Number(limit) : undefined;
    const queryPage = page ? Number(page) : 0;

    const offset = queryLimit ? queryPage * queryLimit : undefined;

    const where = search
      ? {
          [Op.or]: [
            { nome: { [Op.like]: `%${search}%` } },
            ...(searchHash
              ? [{ cepHash: searchHash }, { cpfHash: searchHash }]
              : []),
          ],
        }
      : {};

    const queryData = {
      offset,
      where,
      limit: queryLimit,
      order: queryOrder,
    };

    const municipe = await this.model.findAll(queryData);
    const municipeEntities = municipe.map((row) => this.toEntity(row));

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
    cepHash?: string,
  ): Promise<Municipe | null> {
    const payload: updateMunicipeDto & {
      cepHash?: string;
    } = {
      ...updated,
    };

    if (cepHash) payload.cepHash = cepHash;

    const response = await this.model.update(payload, { where: { uuid } });

    return response[0] > 0 ? await this.getMunicipeById(uuid) : null;
  }

  async deleteMunicipe(uuid: string): Promise<boolean> {
    const response = await this.model.destroy({ where: { uuid } });
    return response > 0;
  }

  // 🔥 mapper (ESSENCIAL)
  private toEntity(data: MunicipeDB): Municipe {
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
      data.cpfHash,
      data.cepHash,
    );
  }
}
