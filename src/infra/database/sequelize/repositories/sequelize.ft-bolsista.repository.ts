import { Op } from "sequelize";
import db from "../index.js";
import { FtBolsistaRepository } from "../../../../modules/ft-bolsista/domain/repositories/ft-bolsista.repository.js";
import {
  FtBolsistaFaltaQueryDto,
  FtBolsistaQueryDto,
  FtBolsistaVinculoCandidatesQueryDto,
} from "../../../../modules/ft-bolsista/application/dto/ft-bolsista.dto.js";
import { CANT_DUPLICATE } from "../../../../modules/ft-edital/domain/constants/ft-vinculo.constants.js";
import AesCryptService from "../../../../core/security/aes/AesCrypt.service.js";
import Sha256CryptService from "../../../../core/security/sha256/sha256.service.js";
import { MunicipeMapper } from "../../../../modules/municipe/application/mapper/municipe.mapper.js";

export class SequelizeFtBolsistaRepository implements FtBolsistaRepository {
  private readonly municipeMapper = new MunicipeMapper(
    new AesCryptService(),
    new Sha256CryptService(),
  );

  private get municipeInclude() {
    return { model: db.MunicipeModel, as: "municipe" };
  }

  private async hydrate<T>(bolsista: T): Promise<T> {
    const row = bolsista as any;
    const municipe = row?.get?.("municipe");
    if (municipe) {
      const decrypted = await this.municipeMapper.toDomain(municipe.toJSON());
      row.setDataValue("municipe", decrypted);
    }
    return bolsista;
  }

  private async hydrateMany(rows: any[]) {
    return Promise.all(rows.map((row) => this.hydrate(row)));
  }

  async findById(id: string) {
    const row = await db.Bolsistas.findByPk(id, {
      include: [
        this.municipeInclude,
        {
          model: db.PaymentInfo,
          as: "payment_info",
          attributes: { exclude: ["bolsista_id"] },
        },
      ],
    });
    return row ? this.hydrate(row) : null;
  }

  findByMunicipeUuid(municipeUuid: string) {
    return db.Bolsistas.findOne({ where: { municipe_uuid: municipeUuid } });
  }

  findMunicipeById(municipeUuid: string) {
    return db.MunicipeModel.findByPk(municipeUuid);
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
    paymentInfo: any,
    paymentInfoData: any,
  ) {
    return db.sequelize.transaction(async (transaction: any) => {
      paymentInfo.set(paymentInfoData);

      await paymentInfo.save({ transaction });

      return bolsista;
    });
  }

  async findAndCount(query: FtBolsistaQueryDto = {}) {
    const { page = "0", limit = "10", search: rawSearch = "" } = query;
    const search = String(rawSearch).trim();
    const offset = Number(page) * Number(limit);
    const cpf = String(search).replace(/\D/g, "");
    const cpfHash =
      cpf.length === 11 ? await new Sha256CryptService().encrypt(cpf) : null;
    const municipeWhere = search
      ? {
          [Op.or]: [
            { nome: { [Op.like]: `%${search}%` } },
            ...(cpfHash ? [{ cpfHash }] : []),
          ],
        }
      : undefined;

    const result = await db.Bolsistas.findAndCountAll({
      offset,
      limit: Number(limit),
      order: [[{ model: db.MunicipeModel, as: "municipe" }, "nome", "ASC"]],
      include: [
        { ...this.municipeInclude, where: municipeWhere },
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
            attributes: [
              "status",
              "local",
              "pagador_id",
              "data_vinculo",
              "expire_at",
            ],
          },
          required: false,
        },
      ],
      subQuery: false,
      distinct: true,
    });
    result.rows = await this.hydrateMany(result.rows);
    return result;
  }

  async findAndCountVinculoCandidates(
    query: FtBolsistaVinculoCandidatesQueryDto,
  ) {
    const {
      page = "0",
      limit = "10",
      search: rawSearch = "",
      edital_id: editalId,
    } = query;
    const search = String(rawSearch).trim();
    const offset = Number(page) * Number(limit);
    const result = await db.Bolsistas.findAndCountAll({
      where: { "$bolsistas_edital.id$": null },
      offset,
      limit: Number(limit),
      order: [[{ model: db.MunicipeModel, as: "municipe" }, "nome", "ASC"]],
      include: [
        {
          ...this.municipeInclude,
          where: search ? { nome: { [Op.like]: `%${search}%` } } : undefined,
        },
        {
          model: db.PaymentInfo,
          as: "payment_info",
          required: true,
          attributes: { exclude: ["bolsista_id"] },
        },
        {
          model: db.BolsistasEdital,
          as: "bolsistas_edital",
          required: false,
          paranoid: false,
          where: CANT_DUPLICATE
            ? {
                [Op.or]: [{ status: "ativo" }, { edital_id: editalId }],
              }
            : { status: "ativo" },
          attributes: ["id"],
        },
      ],
      subQuery: false,
      distinct: true,
    });
    result.rows = await this.hydrateMany(result.rows);
    return result;
  }

  async findToExpire(limitDate: Date) {
    const result = await db.Bolsistas.findAndCountAll({
      attributes: ["id", "municipe_uuid"],
      include: [
        this.municipeInclude,
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
          include: [{ model: db.Pagador, as: "pagador", paranoid: false }],
        },
      ],
    });
    result.rows = await this.hydrateMany(result.rows);
    return result;
  }

  async findByEditalId(editalId: string) {
    const rows = await db.Bolsistas.findAll({
      include: [
        this.municipeInclude,
        {
          model: db.Edital,
          as: "edital",
          where: { id: editalId },
          through: {
            attributes: [
              "status",
              "local",
              "pagador_id",
              "data_vinculo",
              "expire_at",
            ],
          },
        },
      ],
    });
    return this.hydrateMany(rows);
  }

  findHistoricoByBolsistaId(bolsistaId: string) {
    return db.BolsistasEdital.findAll({
      where: { bolsista_id: bolsistaId },
      paranoid: false,
      attributes: [
        "id",
        "bolsista_id",
        "edital_id",
        "status",
        "data_vinculo",
        "expire_at",
        "canceled_at",
        "observacao",
        "concluded_at",
        "expired_at",
        "prorrogated",
        "local",
        "pagador_id",
        "createdAt",
        "updatedAt",
        "deletedAt",
      ],
      include: [
        {
          model: db.Edital,
          as: "edital",
          attributes: [
            "id",
            "name",
            "status",
            "data_publicacao",
            "data_vencimento",
          ],
        },
        {
          model: db.Pagador,
          as: "pagador",
          paranoid: false,
          attributes: ["uuid", "nome", "quantidade", "deletedAt"],
        },
      ],
      order: [
        ["data_vinculo", "DESC"],
        ["createdAt", "DESC"],
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

  async cancelVinculo(bolsista: any, vinculo: any, observacao: string) {
    await db.sequelize.transaction(async (transaction: any) => {
      vinculo.set({
        status: "cancelado",
        canceled_at: new Date(),
        observacao,
      });

      await vinculo.save({ transaction });
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

  findFaltasByBolsistaPeriodo(
    bolsistaId: string,
    editalId: string,
    dataInicio: string,
    dataFim: string,
  ) {
    return db.BolsistaFalta.findAll({
      where: {
        bolsista_id: bolsistaId,
        edital_id: editalId,
        data_falta: { [Op.between]: [dataInicio, dataFim] },
      },
      order: [["data_falta", "ASC"]],
    });
  }
}
