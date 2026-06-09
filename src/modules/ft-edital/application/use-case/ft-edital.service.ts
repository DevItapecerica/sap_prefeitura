import { ftError } from "../../../ft-bolsista/application/utils/ft-error.js";
import {
  FtEditalBolsistaQueryDto,
  FtEditalDto,
} from "../dto/ft-edital.dto.js";
import {
  pagador,
  verifyQuantityPagador,
} from "../../../ft-bolsista/application/utils/pagador.js";
import { FtEditalRepository } from "../../domain/repositories/ft-edital.repository.js";

export class FtEditalService {
  constructor(private readonly repository: FtEditalRepository) {}

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

  async getRelatory(id: string) {
    const edital = await this.repository.findById(id);

    if (!edital) {
      throw ftError(404, "Edital not found");
    }

    const bolsistas = await this.repository.findToRelatory(id);
    const csv = this.formatRelatory(bolsistas, edital);

    return {
      fileName: "relatorio.csv",
      csv,
      type: "text/csv; charset=utf-8",
    };
  }

  private formatRelatory(bolsistas: any[], edital: any) {
    const toDate = (value: any) => new Date(value).toISOString().split("T")[0];
    const editalData = edital.toJSON ? edital.toJSON() : edital;
    const rows: any[][] = [
      ["Edital"],
      ["Id:", editalData.id],
      ["Nome:", editalData.name],
      ["Publicacao:", toDate(editalData.data_publicacao)],
      ["Vencimento:", toDate(editalData.data_vencimento)],
      ["Pagamento:", editalData.dia_pagamento],
      ["Valor:", editalData.valor_bolsa],
      ["Status:", editalData.status],
      [],
      ["Bolsistas agrupados por local de pagamento"],
    ];

    const header = [
      "bco",
      "ag",
      "dig_ag",
      "conta",
      "dig_conta",
      "nome",
      "valor",
      "vencimento",
      "cpf",
      "local",
    ];
    const grouped: Record<string, any[][]> = {};

    for (const bolsistaModel of bolsistas) {
      const bolsista = bolsistaModel.toJSON
        ? bolsistaModel.toJSON()
        : bolsistaModel;

      if (bolsista.status !== "ativo") continue;

      const local =
        pagador.find((item) => item.id === bolsista.payment_info?.pagador_id)
          ?.name || "SEM LOCAL";

      if (!grouped[local]) {
        grouped[local] = [];
      }

      grouped[local].push([
        bolsista.payment_info?.bco,
        bolsista.payment_info?.ag,
        bolsista.payment_info?.dig_ag,
        bolsista.payment_info?.conta,
        bolsista.payment_info?.dig_conta,
        bolsista.nome,
        editalData.valor_bolsa,
        toDate(editalData.data_vencimento),
        `${bolsista.cpf}`,
        local,
      ]);
    }

    let totalGeral = 0;
    let contagemGeral = 0;

    for (const local of Object.keys(grouped)) {
      const localRows = grouped[local];
      rows.push([]);
      rows.push([`Local de pagamento: ${local}`]);
      rows.push(header);
      rows.push(...localRows);

      const totalValor = localRows.length * Number(editalData.valor_bolsa);
      rows.push([
        "Total de bolsistas local:",
        localRows.length,
        "Total do local:",
        totalValor,
      ]);
      totalGeral += totalValor;
      contagemGeral += localRows.length;
    }

    rows.push([
      "Total de bolsistas geral:",
      contagemGeral,
      "Total do valor geral:",
      totalGeral,
    ]);

    return rows
      .map((row) =>
        row
          .map((cell) => (cell === undefined || cell === null ? "" : String(cell)))
          .join(";"),
      )
      .join("\n");
  }
}
