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
import { ftError } from "../../../../modules/ft-bolsista/application/utils/ft-error.js";
import { hasBlockingVinculo } from "../../../../modules/ft-edital/domain/services/ft-vinculo-policy.service.js";

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
        {
          model: db.BolsistasEdital,
          as: "bolsistas_edital",
          where: { [Op.or]: [{ status: "ativo" }, { status: "concluido" }] },
          required: false,
          include: [{ model: db.Pagador, as: "pagador", paranoid: false }],
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
          include: [{ model: db.Pagador, as: "pagador", paranoid: false }],
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
    bolsistas: Array<{ bolsista: any; local: string; pagador_id: string; data_vinculo?: string | Date, expire_at?: string | Date }>,
  ) {
    return db.sequelize.transaction(async (transaction: any) => {
      const editalId = edital.get("id");
      const bolsistasOrdenados = [...bolsistas].sort((left, right) =>
        String(left.bolsista.get("id")).localeCompare(String(right.bolsista.get("id"))),
      );

      for (const item of bolsistasOrdenados) {
        const bolsistaId = item.bolsista.get("id");
        await db.Bolsistas.findByPk(bolsistaId, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        const vinculosDoPar = await db.BolsistasEdital.findAll({
          where: { bolsista_id: bolsistaId, edital_id: editalId },
          paranoid: false,
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (hasBlockingVinculo(vinculosDoPar)) {
          throw ftError(409, "Bolsista ja vinculado a este edital");
        }

        const vinculoAtivo = await db.BolsistasEdital.findOne({
          where: { bolsista_id: bolsistaId, status: "ativo" },
          paranoid: false,
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (vinculoAtivo) {
          throw ftError(409, "Bolsista ja ativo em outro edital");
        }
      }

      const porPagador = new Map<string, number>();
      for (const item of bolsistas) {
        porPagador.set(item.pagador_id, (porPagador.get(item.pagador_id) ?? 0) + 1);
      }
      for (const [pagadorId, novos] of [...porPagador.entries()].sort(([left], [right]) => left.localeCompare(right))) {
        const pagador = await db.Pagador.findByPk(pagadorId, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (!pagador) throw ftError(400, "Pagador inexistente ou excluido");
        const ocupacao = await db.BolsistasEdital.count({
          where: { edital_id: editalId, pagador_id: pagadorId, status: "ativo" },
          transaction,
        });
        if (ocupacao + novos > Number(pagador.get("quantidade"))) {
          throw ftError(409, `Capacidade do pagador excedida neste edital (${ocupacao + novos}/${pagador.get("quantidade")})`);
        }
      }
      const created = [];
      for (const item of bolsistas) {
        const vinculo = await db.BolsistasEdital.create({
          edital_id: editalId,
          bolsista_id: item.bolsista.get("id"),
          local: item.local,
          pagador_id: item.pagador_id,
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

  async updateActiveVinculo(
    editalId: string,
    bolsistaId: string,
    data: { local: string; pagador_id: string },
  ) {
    return db.sequelize.transaction(async (transaction: any) => {
      const vinculo = await db.BolsistasEdital.findOne({
        where: { edital_id: editalId, bolsista_id: bolsistaId, status: "ativo" },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!vinculo) return null;

      const pagador = await db.Pagador.findByPk(data.pagador_id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!pagador) throw ftError(400, "Pagador inexistente ou excluido");

      const ocupacaoDestino = await db.BolsistasEdital.count({
        where: {
          edital_id: editalId,
          pagador_id: data.pagador_id,
          status: "ativo",
          id: { [Op.ne]: vinculo.get("id") },
        },
        transaction,
      });
      if (ocupacaoDestino + 1 > Number(pagador.get("quantidade"))) {
        throw ftError(409, `Capacidade do pagador excedida neste edital (${ocupacaoDestino + 1}/${pagador.get("quantidade")})`);
      }

      const before = vinculo.toJSON();
      await vinculo.update(data, { transaction });
      return { before, after: vinculo.toJSON() };
    });
  }
}
