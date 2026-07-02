import { Op } from "sequelize";
import db from "../index.js";
import { FtRelatorioRepository } from "../../../../modules/ft-relatorio/domain/repositories/ft-relatorio.repository.js";
import { FtRelatorioPeriodo } from "../../../../modules/ft-relatorio/application/dto/ft-relatorio.dto.js";
import { FtEdital } from "../../../../modules/ft-edital/domain/entity/FtEdital.js";
import { FtBolsista } from "../../../../modules/ft-bolsista/domain/entity/FtBolsista.js";
import { FtPaymentInfo } from "../../../../modules/ft-bolsista/domain/entity/FtPaymentInfo.js";
import { FtBolsistaFalta } from "../../../../modules/ft-bolsista/domain/entity/FtBolsistaFalta.js";
import {
  FtRelatorioBolsista,
  FtRelatorioVinculo,
} from "../../../../modules/ft-relatorio/domain/entities/ft-relatorio.entity.js";

export class SequelizeFtRelatorioRepository implements FtRelatorioRepository {
  async findEditalById(id: string) {
    const edital = await db.Edital.findByPk(id);

    return edital ? this.toFtEdital(edital) : null;
  }

  async findBolsistasByEditalPeriodo(id: string, periodo: FtRelatorioPeriodo) {
    return this.findBolsistasComFaltasNoPeriodo(id, periodo);
  }

  async findBolsistasFaltasByEditalMes(
    id: string,
    periodo: FtRelatorioPeriodo,
  ) {
    return this.findBolsistasComFaltasNoPeriodo(id, periodo);
  }

  private async findBolsistasComFaltasNoPeriodo(
    id: string,
    periodo: FtRelatorioPeriodo,
  ) {
    const bolsistas = await db.Bolsistas.findAll({
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
          required: true,
          where: {
            edital_id: id,
            data_vinculo: { [Op.lte]: periodo.data_fim },
          },
          attributes: [
            "id",
            "bolsista_id",
            "edital_id",
            "status",
            "data_vinculo",
            "expire_at",
            "canceled_at",
            "concluded_at",
            "expired_at",
          ],
        },
        {
          model: db.BolsistaFalta,
          as: "faltas",
          required: false,
          where: {
            edital_id: id,
            data_falta: {
              [Op.gte]: periodo.data_inicio,
              [Op.lte]: periodo.data_fim,
            },
          },
        },
      ],
      distinct: true,
    });

    return bolsistas
      .map((bolsista: any) => this.toFtRelatorioBolsista(bolsista, periodo))
      .filter(
        (bolsista: FtRelatorioBolsista | null): bolsista is FtRelatorioBolsista =>
          Boolean(bolsista),
      );
  }

  private toFtEdital(model: any): FtEdital {
    const edital = this.toPlain(model);

    return new FtEdital(
      edital.name,
      edital.data_publicacao,
      edital.data_vencimento,
      Number(edital.dia_pagamento),
      edital.valor_bolsa,
      edital.status,
      edital.id,
      edital.createdAt,
      edital.updatedAt,
      edital.deletedAt,
    );
  }

  private toFtRelatorioBolsista(
    model: any,
    periodo: FtRelatorioPeriodo,
  ): FtRelatorioBolsista | null {
    const bolsista = this.toPlain(model);
    const paymentInfo = bolsista.payment_info
      ? this.toFtPaymentInfo(bolsista.payment_info)
      : undefined;
    const vinculos = (bolsista.bolsistas_edital || [])
      .filter((vinculo: any) => this.vinculoIntersectsPeriod(vinculo, periodo))
      .map((vinculo: any) => this.toFtRelatorioVinculo(vinculo));

    if (vinculos.length === 0) {
      return null;
    }

    return new FtRelatorioBolsista(
      new FtBolsista(
        bolsista.nome,
        `${bolsista.cpf}`,
        bolsista.local,
        bolsista.cep,
        bolsista.numero,
        bolsista.logradouro,
        bolsista.bairro,
        bolsista.cidade,
        bolsista.uf,
        bolsista.telefone,
        bolsista.status,
        paymentInfo,
        bolsista.id,
        bolsista.createdAt,
        bolsista.updatedAt,
        bolsista.deletedAt,
      ),
      (bolsista.faltas || []).map((falta: any) => this.toFtBolsistaFalta(falta)),
      vinculos,
    );
  }

  private toFtRelatorioVinculo(model: any): FtRelatorioVinculo {
    const vinculo = this.toPlain(model);

    return new FtRelatorioVinculo(
      vinculo.status,
      vinculo.data_vinculo,
      vinculo.expire_at,
      vinculo.canceled_at,
      vinculo.concluded_at,
      vinculo.expired_at,
      vinculo.id,
    );
  }

  private vinculoIntersectsPeriod(
    vinculo: any,
    periodo: FtRelatorioPeriodo,
  ): boolean {
    const dataVinculo = this.toDateOnly(vinculo.data_vinculo);
    const fimOperacional = this.getOperationalEndDate(vinculo);

    if (dataVinculo > periodo.data_fim) {
      return false;
    }

    return !fimOperacional || fimOperacional >= periodo.data_inicio;
  }

  private getOperationalEndDate(vinculo: any): string | null {
    const value =
      vinculo.canceled_at ||
      vinculo.concluded_at ||
      vinculo.expired_at ||
      vinculo.expire_at;

    return value ? this.toDateOnly(value) : null;
  }

  private toFtPaymentInfo(model: any): FtPaymentInfo {
    const paymentInfo = this.toPlain(model);

    return new FtPaymentInfo(
      paymentInfo.bco,
      paymentInfo.pagador_id,
      paymentInfo.ag,
      paymentInfo.dig_ag,
      paymentInfo.conta,
      paymentInfo.dig_conta,
      paymentInfo.id,
      paymentInfo.bolsista_id,
      paymentInfo.createdAt,
      paymentInfo.updatedAt,
      paymentInfo.deletedAt,
    );
  }

  private toFtBolsistaFalta(model: any): FtBolsistaFalta {
    const falta = this.toPlain(model);

    return new FtBolsistaFalta(
      falta.bolsista_id,
      falta.edital_id,
      falta.data_falta,
      falta.observacao,
      falta.id,
      falta.createdAt,
      falta.updatedAt,
      falta.deletedAt,
    );
  }

  private toPlain(model: any) {
    return model?.toJSON ? model.toJSON() : model;
  }

  private toDateOnly(value: string | Date): string {
    return value instanceof Date
      ? value.toISOString().slice(0, 10)
      : String(value).slice(0, 10);
  }
}
