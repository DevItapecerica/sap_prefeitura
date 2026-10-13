import { Op } from "sequelize";
import db from "../index.js";
import { FtEditalRepository } from "../../../../modules/ft-edital/domain/repositories/ft-edital.repository.js";
import {
  FtEditalBolsistaQueryDto,
  FtEditalQueryDto,
} from "../../../../modules/ft-edital/application/dto/ft-edital.dto.js";
import AesCryptService from "../../../../core/security/aes/AesCrypt.service.js";
import Sha256CryptService from "../../../../core/security/sha256/sha256.service.js";
import { MunicipeMapper } from "../../../../modules/municipe/application/mapper/municipe.mapper.js";

export class SequelizeFtEditalRepository implements FtEditalRepository {
  private readonly municipeMapper = new MunicipeMapper(new AesCryptService(), new Sha256CryptService());

  private async hydrateBolsistas(rows: any[]) {
    return Promise.all(rows.map(async (row) => {
      const municipe = row.get?.("municipe");
      if (municipe) row.setDataValue("municipe", await this.municipeMapper.toDomain(municipe.toJSON()));
      return row;
    }));
  }
  findAll() {
    return db.Edital.findAll();
  }

  findAndCount(query: FtEditalQueryDto = {}) {
    const { page = "0", limit = "10", search = "", order = "name:asc" } = query;
    const [orderField = "name", orderDirection = "asc"] = String(order).split(":");
    const allowedOrderFields = ["name", "data_publicacao", "data_vencimento", "createdAt"];
    const normalizedOrderField = allowedOrderFields.includes(orderField)
      ? orderField
      : "name";
    const normalizedOrderDirection =
      String(orderDirection).toUpperCase() === "DESC" ? "DESC" : "ASC";
    const offset = Number(page) * Number(limit);
    const where = search
      ? {
          name: { [Op.like]: `%${search}%` },
        }
      : {};

    return db.Edital.findAndCountAll({
      where,
      offset,
      limit: Number(limit),
      order: [[normalizedOrderField, normalizedOrderDirection]],
      distinct: true,
    });
  }

  findById(id: string) {
    return db.Edital.findByPk(id);
  }

  create(data: any) {
    return db.Edital.create(data);
  }

  async update(edital: any, data: any) {
    edital.set(data);
    await edital.save();
    return edital;
  }

  async destroy(edital: any) {
    await edital.destroy();
  }

  findBolsistaById(id: string) {
    return db.Bolsistas.findByPk(id, {
      include: [
        { model: db.PaymentInfo, as: "payment_info" },
        { model: db.MunicipeModel, as: "municipe" },
      ],
    });
  }

  countActiveByPagador(pagadorId: string) {
    return db.Bolsistas.count({
      include: [
        {
          model: db.PaymentInfo,
          as: "payment_info",
          where: { pagador_id: pagadorId },
        },
        {
          model: db.BolsistasEdital,
          as: "bolsistas_edital",
          required: true,
          where: { status: "ativo" },
        },
      ],
      distinct: true,
    });
  }

  findAllWithBolsista() {
    return db.Edital.findAll({
      attributes: ["name", "id"],
      include: [
        {
          model: db.Bolsistas,
          as: "bolsistas",
          include: [{ model: db.MunicipeModel, as: "municipe", attributes: ["uuid", "nome"] }],
          through: {
            attributes: [],
            where: { [Op.or]: [{ status: "ativo" }, { status: "concluido" }] },
          },
        },
      ],
    });
  }

  async findBolsistasByEdital(
    id: string,
    query: FtEditalBolsistaQueryDto = {},
    optionWhere: any = {},
  ) {
    const { page = "0", limit = "10", search = "" } = query;
    const offset = Number(page) * Number(limit);
    const rows = await db.Bolsistas.findAll({
      where: optionWhere,
      offset,
      limit: Number(limit),
      order: [[{ model: db.MunicipeModel, as: "municipe" }, "nome", "ASC"]],
      include: [
        {
          model: db.MunicipeModel,
          as: "municipe",
          where: search ? { nome: { [Op.like]: `%${search}%` } } : undefined,
        },
        {
          model: db.PaymentInfo,
          as: "payment_info",
          attributes: { exclude: ["id", "createdAt", "updatedAt"] },
        },
        {
          model: db.Edital,
          as: "edital",
          where: { id },
          attributes: [],
        },
        {
          model: db.BolsistasEdital,
          as: "bolsistas_edital",
          where: {
            edital_id: id,
            [Op.or]: [
              { status: "ativo" },
              { status: "concluido" },
              { status: "expirado" },
            ],
          },
        },
      ],
      distinct: true,
    });
    return this.hydrateBolsistas(rows);
  }

  countBolsistasByEdital(
    id: string,
    query: FtEditalBolsistaQueryDto = {},
    optionWhere: any = {},
  ) {
    const { search = "" } = query;
    return db.Bolsistas.count({
      where: optionWhere,
      include: [
        {
          model: db.MunicipeModel,
          as: "municipe",
          where: search ? { nome: { [Op.like]: `%${search}%` } } : undefined,
        },
        {
          model: db.BolsistasEdital,
          as: "bolsistas_edital",
          where: {
            edital_id: id,
            [Op.or]: [
              { status: "ativo" },
              { status: "concluido" },
              { status: "expirado" },
            ],
          },
        },
      ],
      distinct: true,
    });
  }

  findVinculosByBolsistaEdital(bolsistaId: string, editalId: string) {
    return db.BolsistasEdital.findAll({
      where: {
        bolsista_id: bolsistaId,
        edital_id: editalId,
      },
      paranoid: false,
    });
  }

  findActiveVinculoByBolsista(bolsistaId: string) {
    return db.BolsistasEdital.findOne({
      where: { bolsista_id: bolsistaId, status: "ativo" },
    });
  }

  async vincularBolsistas(
    edital: any,
    bolsistas: Array<{ bolsista: any; local: string; data_vinculo?: string | Date, expire_at?: string | Date }>,
  ) {
    return db.sequelize.transaction(async (transaction: any) => {
      const created = [];
      for (const item of bolsistas) {
        const vinculo = await db.BolsistasEdital.create({
          edital_id: edital.get("id"),
          bolsista_id: item.bolsista.get("id"),
          local: item.local,
          data_vinculo: item.data_vinculo,
          expire_at: item.expire_at,
        }, {
          transaction,
        });

        created.push(vinculo);
      }
      return created;
    });
  }
}
