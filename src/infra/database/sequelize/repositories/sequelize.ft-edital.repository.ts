import { Op } from "sequelize";
import db from "../index.js";
import { FtEditalRepository } from "../../../../modules/ft-edital/domain/repositories/ft-edital.repository.js";
import { FtEditalBolsistaQueryDto } from "../../../../modules/ft-edital/application/dto/ft-edital.dto.js";

export class SequelizeFtEditalRepository implements FtEditalRepository {
  findAll() {
    return db.Edital.findAll();
  }

  findById(id: string) {
    return db.Edital.findByPk(id);
  }

  create(data: any) {
    return db.Edital.create(data);
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

  findToRelatory(id: string) {
    return db.Bolsistas.findAll({
      where: { status: "ativo" },
      order: [["nome", "ASC"]],
      include: [
        {
          model: db.PaymentInfo,
          as: "payment_info",
          attributes: { exclude: ["id", "createdAt", "updatedAt"] },
        },
        {
          model: db.BolsistasEdital,
          as: "bolsistas_edital",
          where: { edital_id: id, status: "ativo" },
        },
      ],
      distinct: true,
    });
  }
}
