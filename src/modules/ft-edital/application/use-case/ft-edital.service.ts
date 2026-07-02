import { ftError } from "../../../ft-bolsista/application/utils/ft-error.js";
import {
  FtEditalBolsistaQueryDto,
  FtEditalDto,
  FtEditalQueryDto,
} from "../dto/ft-edital.dto.js";
import {
  pagador,
  verifyQuantityPagador,
} from "../../../ft-bolsista/application/utils/pagador.js";
import { FtEditalRepository } from "../../domain/repositories/ft-edital.repository.js";
import { FtEditalPolicyService } from "../../domain/services/ft-edital-policy.service.js";
import { FtVinculoPolicyService } from "../../domain/services/ft-vinculo-policy.service.js";

export class FtEditalService {
  constructor(
    private readonly repository: FtEditalRepository,
    private readonly policy = new FtEditalPolicyService(),
    private readonly vinculoPolicy = new FtVinculoPolicyService(),
  ) {}

  async allEdital(query: FtEditalQueryDto = {}) {
    const { count, rows } = await this.repository.findAndCount(query);

    return { edital: rows, count };
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
    this.policy.validateEditalPayload(data);

    return this.repository.create({
      name: data.name,
      data_publicacao: data.data_publicacao,
      data_vencimento: data.data_vencimento,
      dia_pagamento: data.dia_pagamento,
      valor_bolsa: data.valor_bolsa,
    });
  }

  async updateEdital(id: string, data: FtEditalDto) {
    this.policy.validateEditalPayload(data);

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

    this.vinculoPolicy.ensureEditalAtivo(edital);

    const vinculos = [];

    for (const bolsistaId of bolsistas) {
      if (!bolsistaId) {
        throw ftError(400, "Bolsista e obrigatorio");
      }

      const bolsista = await this.repository.findBolsistaById(bolsistaId);

      if (!bolsista) {
        throw ftError(404, "Bolsista not found");
      }

      const vinculosDoPar =
        await this.repository.findVinculosByBolsistaEdital(bolsistaId, id);
      this.vinculoPolicy.ensureCanCreateVinculo(vinculosDoPar);

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

}
