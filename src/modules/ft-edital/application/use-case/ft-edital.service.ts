import { ftError } from "../../../ft-bolsista/application/utils/ft-error.js";
import {
  FtEditalBolsistaQueryDto,
  FtEditalDto,
  FtEditalQueryDto,
} from "../dto/ft-edital.dto.js";

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
      throw ftError(404, "Edital not found");
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
