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

  async createWithPaymentInfo(bolsistaData: any, paymentInfoData: any) {
    return db.sequelize.transaction(async (transaction: any) => {
      const bolsista = await db.Bolsistas.create(bolsistaData, {
        transaction,
      });

      const paymentInfo = await db.PaymentInfo.create(
        {
          ...paymentInfoData,
          bolsista_id: bolsista.get("id"),
        },
        { transaction },
      );

      return { bolsista, paymentInfo };
    });
  }

  async updateWithPaymentInfo(
    bolsista: any,
    bolsistaData: any,
    paymentInfo: any,
    paymentInfoData: any,
  ) {
    return db.sequelize.transaction(async (transaction: any) => {
      bolsista.set(bolsistaData);
      paymentInfo.set(paymentInfoData);

      await bolsista.save({ transaction });
      await paymentInfo.save({ transaction });

      return bolsista;
    });
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
        {
          model: db.Edital,
          as: "edital",
          attributes: ["id", "name"],
          through: {
            attributes: ["status", "data_vinculo", "expire_at"],
          },
          required: false,
        },
      ],
      distinct: true,
    });
  }

  findAndCountVinculoCandidates(query: FtBolsistaQueryDto = {}) {
    const { page = "0", limit = "10", search = "" } = query;
    const offset = Number(page) * Number(limit);
    const where: any = {
      status: { [Op.notIn]: ["ativo", "pendente"] },
    };

    if (search) {
      where[Op.or] = [
        { nome: { [Op.like]: `%${search}%` } },
        { cpf: { [Op.like]: `%${search}%` } },
      ];
    }

    return db.Bolsistas.findAndCountAll({
      where,
      offset,
      limit: Number(limit),
      order: [["nome", "ASC"]],
      include: [
        {
          model: db.PaymentInfo,
          as: "payment_info",
          required: true,
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

  findFaltaByBolsistaEditalData(
    bolsistaId: string,
    editalId: string,
    dataFalta: string | Date,
  ) {
    return db.BolsistaFalta.findOne({
      where: {
        bolsista_id: bolsistaId,
        edital_id: editalId,
        data_falta: dataFalta,
      },
    });
  }

  async destroyBolsista(bolsista: any) {
    await bolsista.destroy();
  }

  async cancelVinculo(bolsista: any, vinculo: any) {
    await db.sequelize.transaction(async (transaction: any) => {
      bolsista.set("status", "inativo");
      vinculo.set("status", "cancelado");

      await bolsista.save({ transaction });
      await vinculo.save({ transaction });
      await vinculo.destroy({ transaction });
    });
  }

  async prorrogateVinculos(vinculos: any[]) {
    await db.sequelize.transaction(async (transaction: any) => {
      for (const vinculo of vinculos) {
        const expireAt = new Date(vinculo.get("expire_at") as string);
        expireAt.setFullYear(expireAt.getFullYear() + 1);

        vinculo.set({
          expire_at: expireAt,
          prorrogated: true,
        });

        await vinculo.save({ transaction });
      }
    });
  }

  createFalta(data: any) {
    return db.BolsistaFalta.create(data);
  }

  findFaltaById(id: string) {
    return db.BolsistaFalta.findByPk(id);
  }

  async destroyFalta(falta: any) {
    await falta.destroy();
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
