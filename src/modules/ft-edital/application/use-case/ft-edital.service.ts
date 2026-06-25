import { ftError } from "../../../ft-bolsista/application/utils/ft-error.js";
import {
  FtEditalBolsistaQueryDto,
  FtEditalDto,
  FtEditalRelatoryQueryDto,
} from "../dto/ft-edital.dto.js";
import {
  pagador,
  verifyQuantityPagador,
} from "../../../ft-bolsista/application/utils/pagador.js";
import { FtEditalRepository } from "../../domain/repositories/ft-edital.repository.js";
import {
  FtRelatorioPagamentoService,
  FtRelatorioPeriodo,
} from "../../domain/services/ft-relatorio-pagamento.service.js";
import { FtRelatorioCsvFormatter } from "../formatter/ft-relatorio-csv.formatter.js";

export class FtEditalService {
  constructor(
    private readonly repository: FtEditalRepository,
    private readonly relatorioPagamentoService = new FtRelatorioPagamentoService(),
    private readonly relatorioCsvFormatter = new FtRelatorioCsvFormatter(),
  ) {}

  async allEdital() {
    return this.repository.findAll();
  }

  async editalById(id: string) {
    const edital = await this.repository.findById(id);

    if (!edital) {
      return {
        code: 200,
        ok: true,
        api: "FT_MS",
        message: "Edital not found",
      };
    }

    return edital;
  }

  async createEdital(data: FtEditalDto) {
    this.validateEditalPayload(data);

    return this.repository.create({
      name: data.name,
      data_publicacao: data.data_publicacao,
      data_vencimento: data.data_vencimento,
      dia_pagamento: data.dia_pagamento,
      valor_bolsa: data.valor_bolsa,
    });
  }

  async updateEdital(id: string, data: FtEditalDto) {
    this.validateEditalPayload(data);

    const edital = await this.repository.findById(id);

    if (!edital) {
      throw ftError(404, "Edital not found");
    }

    return this.repository.update(edital, {
      name: data.name,
      data_publicacao: data.data_publicacao,
      data_vencimento: data.data_vencimento,
      dia_pagamento: data.dia_pagamento,
      valor_bolsa: data.valor_bolsa,
    });
  }

  private validateEditalPayload(data: FtEditalDto) {
    if (!data) {
      throw ftError(400, "Edital e obrigatorio");
    }

    const requiredFields = [
      ["name", "Nome"],
      ["data_publicacao", "Data de publicacao"],
      ["data_vencimento", "Data de vencimento"],
      ["dia_pagamento", "Dia de pagamento"],
      ["valor_bolsa", "Valor da bolsa"],
    ];

    const missingFields = requiredFields
      .filter(([field]) => !String((data as any)[field] ?? "").trim())
      .map(([, label]) => label);

    if (missingFields.length > 0) {
      throw ftError(400, `Dados do edital incompletos: ${missingFields.join(", ")}`);
    }

    if (
      Number.isNaN(Date.parse(String(data.data_publicacao))) ||
      Number.isNaN(Date.parse(String(data.data_vencimento)))
    ) {
      throw ftError(400, "Datas do edital invalidas");
    }

    const diaPagamento = Number(data.dia_pagamento);
    if (!Number.isInteger(diaPagamento) || diaPagamento < 1 || diaPagamento > 31) {
      throw ftError(400, "Dia de pagamento deve estar entre 1 e 31");
    }

    if (Number(data.valor_bolsa) <= 0) {
      throw ftError(400, "Valor da bolsa deve ser maior que zero");
    }
  }

  async deleteEdital(id: string) {
    const edital = await this.repository.findById(id);

    if (!edital) {
      throw ftError(404, "Edital not found");
    }

    await this.repository.destroy(edital);
  }

  async vincularBolsista(id: string, bolsistas: string[] = [], dataVinculo: any) {
    if (!id) {
      throw ftError(400, "Edital e obrigatorio");
    }

    if (!Array.isArray(bolsistas) || bolsistas.length === 0) {
      throw ftError(400, "Lista de bolsistas e obrigatoria");
    }

    if (dataVinculo && Number.isNaN(Date.parse(String(dataVinculo)))) {
      throw ftError(400, "Data de vinculo invalida");
    }

    const edital = await this.repository.findById(id);

    if (!edital) {
      throw ftError(404, "Edital not found");
    }

    if (edital.get("status") === "inativo") {
      throw ftError(400, "Edital inativo");
    }

    const vinculos = [];

    for (const bolsistaId of bolsistas) {
      if (!bolsistaId) {
        throw ftError(400, "Bolsista e obrigatorio");
      }

      const bolsista = await this.repository.findBolsistaById(bolsistaId);

      if (!bolsista) {
        throw ftError(404, "Bolsista not found");
      }

      if (
        bolsista.get("status") === "pendente" ||
        bolsista.get("status") === "ativo"
      ) {
        throw ftError(
          403,
          "Bolsista com documentos pendentes ou ja ativo em outro edital",
        );
      }

      const paymentInfo = bolsista.get("payment_info");
      const pagadorTarget = pagador.find(
        (item) => item.id === paymentInfo?.pagador_id,
      );

      if (!pagadorTarget) {
        throw ftError(403, "Pagador nao encontrado");
      }

      const quantity = await this.repository.countActiveByPagador(
        paymentInfo.pagador_id,
      );
      verifyQuantityPagador(pagadorTarget.max_bolsista, quantity);

      vinculos.push({ bolsista, data_vinculo: dataVinculo });
    }

    await this.repository.vincularBolsistas(edital, vinculos);
  }

  async getAllWithBolsista() {
    return this.repository.findAllWithBolsista();
  }

  async getWithBolsista(id: string, query: FtEditalBolsistaQueryDto = {}) {
    const [bolsistas, count] = await Promise.all([
      this.repository.findBolsistasByEdital(id, query),
      this.repository.countBolsistasByEdital(id, query),
    ]);

    return { bolsistas, count };
  }

  async getRelatory(id: string, query: FtEditalRelatoryQueryDto = {}) {
    const edital = await this.repository.findById(id);

    if (!edital) {
      throw ftError(404, "Edital not found");
    }

    const periodo = this.resolveRelatoryPeriod(query);
    const bolsistas = await this.repository.findToRelatory(id, periodo);
    const relatorio = this.relatorioPagamentoService.execute(
      bolsistas,
      edital,
      periodo,
    );
    const csv = this.relatorioCsvFormatter.format(relatorio);

    return {
      fileName: "relatorio.csv",
      csv,
      type: "text/csv; charset=utf-8",
    };
  }

  private resolveRelatoryPeriod(
    query: FtEditalRelatoryQueryDto,
  ): FtRelatorioPeriodo {
    const hasInicio = Boolean(String(query.data_inicio || "").trim());
    const hasFim = Boolean(String(query.data_fim || "").trim());

    if (hasInicio !== hasFim) {
      throw ftError(400, "data_inicio e data_fim devem ser informadas juntas");
    }

    if (!hasInicio && !hasFim) {
      const now = new Date();
      const firstDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
      const lastDay = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0));

      return {
        data_inicio: this.toDateOnly(firstDay),
        data_fim: this.toDateOnly(lastDay),
      };
    }

    if (
      Number.isNaN(Date.parse(String(query.data_inicio))) ||
      Number.isNaN(Date.parse(String(query.data_fim)))
    ) {
      throw ftError(400, "Periodo do relatorio invalido");
    }

    const dataInicio = this.toDateOnly(query.data_inicio);
    const dataFim = this.toDateOnly(query.data_fim);

    if (dataInicio > dataFim) {
      throw ftError(400, "data_inicio deve ser menor ou igual a data_fim");
    }

    return { data_inicio: dataInicio, data_fim: dataFim };
  }

  private toDateOnly(value: any): string {
    return new Date(value).toISOString().split("T")[0];
  }
}
