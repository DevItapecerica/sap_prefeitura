import { Op } from "sequelize";
import db from "../index.js";
import { FtEditalRepository } from "../../../../modules/ft-edital/domain/repositories/ft-edital.repository.js";
import {
  FtEditalBolsistaQueryDto,
  FtEditalQueryDto,
} from "../../../../modules/ft-edital/application/dto/ft-edital.dto.js";

export class SequelizeFtEditalRepository implements FtEditalRepository {
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
      include: [{ model: db.PaymentInfo, as: "payment_info" }],
    });
  }

  countActiveByPagador(pagadorId: string) {
    return db.Bolsistas.count({
      where: { status: "ativo" },
      include: [
        {
          model: db.PaymentInfo,
          as: "payment_info",
          where: { pagador_id: pagadorId },
        },
      ],
    });
  }

  findAllWithBolsista() {
    return db.Edital.findAll({
      attributes: ["name", "id"],
      include: [
        {
          model: db.Bolsistas,
          as: "bolsistas",
          through: {
            attributes: [],
            where: { [Op.or]: [{ status: "ativo" }, { status: "concluido" }] },
          },
        },
      ],
    });
  }

  findBolsistasByEdital(
    id: string,
    query: FtEditalBolsistaQueryDto = {},
    optionWhere: any = {},
  ) {
    const { page = "0", limit = "10", search = "" } = query;
    const offset = Number(page) * Number(limit);
    const where = search
      ? {
          ...optionWhere,
          [Op.or]: [
            { nome: { [Op.like]: `%${search}%` } },
            { cpf: { [Op.like]: `%${search}%` } },
          ],
        }
      : { ...optionWhere };

    return db.Bolsistas.findAll({
      where,
      offset,
      limit: Number(limit),
      order: [["nome", "ASC"]],
      include: [
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
  }

  countBolsistasByEdital(
    id: string,
    query: FtEditalBolsistaQueryDto = {},
    optionWhere: any = {},
  ) {
    const { search = "" } = query;
    const where = search
      ? {
          ...optionWhere,
          [Op.or]: [
            { nome: { [Op.like]: `%${search}%` } },
            { cpf: { [Op.like]: `%${search}%` } },
          ],
        }
      : { ...optionWhere };

    return db.Bolsistas.count({
      where,
      include: [
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

  async vincularBolsistas(
    edital: any,
    bolsistas: Array<{ bolsista: any; data_vinculo?: string | Date }>,
  ) {
    return db.sequelize.transaction(async (transaction: any) => {
      const created = [];
      for (const item of bolsistas) {
        const vinculo = await db.BolsistasEdital.create({
          edital_id: edital.get("id"),
          bolsista_id: item.bolsista.get("id"),
          data_vinculo: item.data_vinculo,
        }, {
          transaction,
        });

        item.bolsista.set("status", "ativo");
        await item.bolsista.save({ transaction });
        created.push(vinculo);
      }
      return created;
    });
  }
}
