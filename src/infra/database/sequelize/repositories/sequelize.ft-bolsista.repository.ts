import { Op } from "sequelize";
import db from "../index.js";
import { FtBolsistaRepository } from "../../../../modules/ft-bolsista/domain/repositories/ft-bolsista.repository.js";
import {
  FtBolsistaFaltaQueryDto,
  FtBolsistaQueryDto,
} from "../../../../modules/ft-bolsista/application/dto/ft-bolsista.dto.js";

export class SequelizeFtBolsistaRepository implements FtBolsistaRepository {
  findById(id: string) {
    return db.Bolsistas.findByPk(id, {
      include: [
        {
          model: db.PaymentInfo,
          as: "payment_info",
          attributes: { exclude: ["bolsista_id"] },
        },
      ],
    });
  }

  findByCpf(cpf: string) {
    return db.Bolsistas.findOne({ where: { cpf } });
  }

  create(data: any) {
    return db.Bolsistas.create(data);
  }

  createPaymentInfo(data: any) {
    return db.PaymentInfo.create(data);
  }

  findAndCount(query: FtBolsistaQueryDto = {}) {
    const { page = "0", limit = "10", search = "" } = query;
    const offset = Number(page) * Number(limit);
    const where = search
      ? {
          [Op.or]: [
            { nome: { [Op.like]: `%${search}%` } },
            { cpf: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    return db.Bolsistas.findAndCountAll({
      where,
      offset,
      limit: Number(limit),
      order: [["nome", "ASC"]],
      include: [
        {
          model: db.PaymentInfo,
          as: "payment_info",
          attributes: { exclude: ["bolsista_id"] },
        },
      ],
      distinct: true,
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

  findToExpire(limitDate: Date) {
    return db.Bolsistas.findAndCountAll({
      attributes: ["id", "nome"],
      include: [
        {
          model: db.Edital,
          as: "edital",
          attributes: ["id", "name"],
        },
        {
          model: db.BolsistasEdital,
          as: "bolsistas_edital",
          where: {
            expire_at: { [Op.lt]: limitDate },
            status: "ativo",
            prorrogated: false,
          },
          attributes: ["expire_at"],
        },
      ],
    });
  }

  findByEditalId(editalId: string) {
    return db.Bolsistas.findAll({
      include: [
        {
          model: db.Edital,
          as: "edital",
          where: { id: editalId },
          through: { attributes: ["status"] },
        },
      ],
    });
  }

  findEditalById(editalId: string) {
    return db.Edital.findByPk(editalId);
  }

  findVinculo(bolsistaId: string, editalId: string, status?: string) {
    return db.BolsistasEdital.findOne({
      where: {
        bolsista_id: bolsistaId,
        edital_id: editalId,
        ...(status ? { status } : {}),
      },
    });
  }

  createFalta(data: any) {
    return db.BolsistaFalta.create(data);
  }

  findFaltaById(id: string) {
    return db.BolsistaFalta.findByPk(id);
  }

  findAndCountFaltasByBolsista(
    bolsistaId: string,
    query: FtBolsistaFaltaQueryDto = {},
  ) {
    const {
      edital_id,
      data_inicio,
      data_fim,
      page = "0",
      limit = "10",
    } = query;
    const where: any = { bolsista_id: bolsistaId };

    if (edital_id) {
      where.edital_id = edital_id;
    }

    if (data_inicio || data_fim) {
      where.data_falta = {};

      if (data_inicio) {
        where.data_falta[Op.gte] = data_inicio;
      }

      if (data_fim) {
        where.data_falta[Op.lte] = data_fim;
      }
    }

    return db.BolsistaFalta.findAndCountAll({
      where,
      offset: Number(page) * Number(limit),
      limit: Number(limit),
      order: [
        ["data_falta", "DESC"],
        ["createdAt", "DESC"],
      ],
      include: [
        {
          model: db.Edital,
          as: "edital",
          attributes: ["id", "name"],
        },
      ],
    });
  }
}
