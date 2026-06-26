import { Op } from "sequelize";
import db from "../index.js";
import { FtRelatorioRepository } from "../../../../modules/ft-relatorio/domain/repositories/ft-relatorio.repository.js";
import { FtRelatorioPeriodo } from "../../../../modules/ft-relatorio/application/dto/ft-relatorio.dto.js";
import { FtEdital } from "../../../../modules/ft-edital/domain/entity/FtEdital.js";
import { FtBolsista } from "../../../../modules/ft-bolsista/domain/entity/FtBolsista.js";
import { FtPaymentInfo } from "../../../../modules/ft-bolsista/domain/entity/FtPaymentInfo.js";
import { FtBolsistaFalta } from "../../../../modules/ft-bolsista/domain/entity/FtBolsistaFalta.js";
import { FtRelatorioBolsista } from "../../../../modules/ft-relatorio/domain/entities/ft-relatorio.entity.js";

export class SequelizeFtRelatorioRepository implements FtRelatorioRepository {
  async findEditalById(id: string) {
    const edital = await db.Edital.findByPk(id);

    return edital ? this.toFtEdital(edital) : null;
  }

  async findBolsistasByEditalPeriodo(id: string, periodo: FtRelatorioPeriodo) {
    const bolsistas = await db.Bolsistas.findAll({
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

    return bolsistas.map((bolsista: any) => this.toFtRelatorioBolsista(bolsista));
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

  private toFtRelatorioBolsista(model: any): FtRelatorioBolsista {
    const bolsista = this.toPlain(model);
    const paymentInfo = bolsista.payment_info
      ? this.toFtPaymentInfo(bolsista.payment_info)
      : undefined;

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
    );
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
}
