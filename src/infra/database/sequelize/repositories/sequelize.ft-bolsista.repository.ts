import { Op } from "sequelize";
import db from "../index.js";
import { FtBolsistaRepository } from "../../../../modules/ft-bolsista/domain/repositories/ft-bolsista.repository.js";
import {
  FtBolsistaFaltaQueryDto,
  FtBolsistaOcorrenciaQueryDto,
  FtBolsistaQueryDto,
  FtBolsistaVinculoCandidatesQueryDto,
} from "../../../../modules/ft-bolsista/application/dto/ft-bolsista.dto.js";
import { CANT_DUPLICATE, MAX_IDADE_VINCULO } from "../../../../modules/ft-edital/domain/constants/ft-vinculo.constants.js";
import AesCryptService from "../../../../core/security/aes/AesCrypt.service.js";
import Sha256CryptService from "../../../../core/security/sha256/sha256.service.js";
import { MunicipeMapper } from "../../../../modules/municipe/application/mapper/municipe.mapper.js";
import { calcularIdadeNaData } from "../../../../modules/ft-edital/domain/services/ft-idade-policy.service.js";
import { ftError } from "../../../../modules/ft-bolsista/application/utils/ft-error.js";
import { todayInSaoPaulo } from "../../../../core/utils/sao-paulo-date.js";
import { resolveTurnoSnapshot } from "../../../../modules/ft-edital/domain/services/ft-vinculo-period.service.js";

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
              "turno_id",
              "turno_nome_snapshot",
              "turno_hora_inicio_snapshot",
              "turno_hora_fim_snapshot",
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
      limit: rawLimit = "25",
      search: rawSearch = "",
      edital_id: editalId,
    } = query;
    const limit = Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      throw ftError(400, "Limite deve ser um inteiro entre 1 e 50");
    }
    const search = String(rawSearch).trim();
    const referenceDate = query.data_vinculo || todayInSaoPaulo();
    let scanCursor = this.decodeCandidateCursor(query.cursor);
    const eligible: any[] = [];
    const batchSize = Math.max(50, Math.min(200, limit * 4));

    while (eligible.length <= limit) {
      const cursorWhere = scanCursor
        ? {
            [Op.or]: [
              { "$municipe.nome$": { [Op.gt]: scanCursor.nome } },
              {
                [Op.and]: [
                  { "$municipe.nome$": scanCursor.nome },
                  { id: { [Op.gt]: scanCursor.id } },
                ],
              },
            ],
          }
        : {};
      const rows = await db.Bolsistas.findAll({
        where: { "$bolsistas_edital.id$": null, ...cursorWhere },
        limit: batchSize,
        order: [
          [{ model: db.MunicipeModel, as: "municipe" }, "nome", "ASC"],
          ["id", "ASC"],
        ],
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
              ? { [Op.or]: [{ status: "ativo" }, { edital_id: editalId }] }
              : { status: "ativo" },
            attributes: ["id"],
          },
        ],
        subQuery: false,
      });
      if (!rows.length) break;
      const hydrated = await this.hydrateMany(rows);
      for (const row of hydrated) {
        const municipe = row.get?.("municipe") ?? row.municipe;
        const nome = String(municipe?.nome ?? municipe?.get?.("nome") ?? "");
        scanCursor = { nome, id: String(row.get?.("id") ?? row.id) };
        const nascimento = municipe?.nascimento ?? municipe?.get?.("nascimento");
        if (!nascimento) continue;
        try {
          if (calcularIdadeNaData(nascimento, referenceDate) <= MAX_IDADE_VINCULO) {
            eligible.push(row);
            if (eligible.length > limit) break;
          }
        } catch { /* dado legado inválido não é elegível */ }
      }
      if (eligible.length > limit || rows.length < batchSize) break;
    }
    const selected = eligible.slice(0, limit);
    const last = selected.at(-1);
    const lastMunicipe = last?.get?.("municipe") ?? last?.municipe;
    const hasMore = eligible.length > limit;
    return {
      rows: selected,
      hasMore,
      nextCursor: hasMore && last
        ? this.encodeCandidateCursor({
            nome: String(lastMunicipe?.nome ?? lastMunicipe?.get?.("nome") ?? ""),
            id: String(last.get?.("id") ?? last.id),
          })
        : null,
    };
  }

  private encodeCandidateCursor(value: { nome: string; id: string }) {
    return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
  }

  private decodeCandidateCursor(value?: string) {
    if (!value) return null;
    try {
      const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
      if (typeof parsed?.nome !== "string" || typeof parsed?.id !== "string") throw new Error();
      return { nome: parsed.nome, id: parsed.id };
    } catch {
      throw ftError(400, "Cursor de candidatos invalido");
    }
  }

  async findAniversariantesAtivos() {
    const rows = await db.Bolsistas.findAll({
      include: [
        this.municipeInclude,
        {
          model: db.BolsistasEdital,
          as: "bolsistas_edital",
          required: true,
          where: { status: "ativo" },
          include: [
            { model: db.Edital, as: "edital", attributes: ["id", "name"] },
            { model: db.Turno, as: "turno", paranoid: false },
          ],
        },
      ],
      order: [[{ model: db.MunicipeModel, as: "municipe" }, "nome", "ASC"]],
    });
    return this.hydrateMany(rows);
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
          include: [
            { model: db.Pagador, as: "pagador", paranoid: false },
            { model: db.Turno, as: "turno", paranoid: false },
          ],
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
              "turno_id",
              "turno_nome_snapshot",
              "turno_hora_inicio_snapshot",
              "turno_hora_fim_snapshot",
              "data_vinculo",
              "expire_at",
            ],
          },
        },
      ],
    });
    return this.hydrateMany(rows);
  }

  async findHistoricoByBolsistaId(bolsistaId: string) {
    const rows = await db.BolsistasEdital.findAll({
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
        "turno_id",
        "turno_nome_snapshot",
        "turno_hora_inicio_snapshot",
        "turno_hora_fim_snapshot",
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
        {
          model: db.Turno,
          as: "turno",
          paranoid: false,
          attributes: ["uuid", "nome", "hora_inicio", "hora_fim", "deletedAt"],
        },
      ],
      order: [
        ["data_vinculo", "DESC"],
        ["createdAt", "DESC"],
      ],
    });
    for (const row of rows) {
      const turno = resolveTurnoSnapshot(row.toJSON());
      if (turno.hora_inicio && turno.hora_fim) row.setDataValue("turno", {
        ...(row.get("turno") as any)?.toJSON?.(),
        ...turno,
      });
    }
    return rows;
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
      include: [{ model: db.Turno, as: "turno", paranoid: false }],
      order: [
        ["data_vinculo", "DESC"],
        ["createdAt", "DESC"],
      ],
    });
  }

  findVinculoById(id: string) {
    return db.BolsistasEdital.findByPk(id, { paranoid: false });
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

  createOcorrencia(data: any) {
    return db.BolsistaOcorrencia.create(data);
  }

  findOcorrenciaById(id: string) {
    return db.BolsistaOcorrencia.findByPk(id, {
      include: [{ model: db.BolsistasEdital, as: "vinculo", paranoid: false }],
    });
  }

  async destroyOcorrencia(ocorrencia: any) {
    await ocorrencia.destroy();
  }

  findAndCountOcorrenciasByBolsista(
    bolsistaId: string,
    query: FtBolsistaOcorrenciaQueryDto = {},
  ) {
    const { edital_id, bolsista_edital_id, page = "0", limit = "10" } = query;
    return db.BolsistaOcorrencia.findAndCountAll({
      offset: Number(page) * Number(limit),
      limit: Number(limit),
      order: [
        ["data_ocorrencia", "DESC"],
        ["createdAt", "DESC"],
      ],
      include: [
        {
          model: db.BolsistasEdital,
          as: "vinculo",
          paranoid: false,
          required: true,
          where: {
            bolsista_id: bolsistaId,
            ...(bolsista_edital_id ? { id: bolsista_edital_id } : {}),
            ...(edital_id ? { edital_id } : {}),
          },
          include: [
            { model: db.Edital, as: "edital", attributes: ["id", "name"] },
            {
              model: db.Pagador,
              as: "pagador",
              paranoid: false,
              attributes: ["uuid", "nome"],
            },
            {
              model: db.Turno,
              as: "turno",
              paranoid: false,
              attributes: ["uuid", "nome", "hora_inicio", "hora_fim"],
            },
          ],
        },
        { model: db.UserModel, as: "author", attributes: ["id", "name"] },
      ],
      distinct: true,
    });
  }
}
