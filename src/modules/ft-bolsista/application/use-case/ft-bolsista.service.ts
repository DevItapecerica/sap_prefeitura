import { ftError } from "../utils/ft-error.js";
import {
  FtBolsistaDto,
  FtBolsistaCancelamentoDto,
  FtBolsistaFaltaDto,
  FtBolsistaFaltaQueryDto,
  FtBolsistaProrrogacaoDto,
  FtBolsistaQueryDto,
} from "../dto/ft-bolsista.dto.js";
import { FtBolsistaRepository } from "../../domain/repositories/ft-bolsista.repository.js";
import { FtBolsistaPolicyService } from "../../domain/services/ft-bolsista-policy.service.js";
import { FtFaltaPolicyService } from "../../domain/services/ft-falta-policy.service.js";
import { FtVinculoPolicyService } from "../../../ft-edital/domain/services/ft-vinculo-policy.service.js";

export class FtBolsistaService {
  constructor(
    private readonly repository: FtBolsistaRepository,
    private readonly policy = new FtBolsistaPolicyService(),
    private readonly faltaPolicy = new FtFaltaPolicyService(),
    private readonly vinculoPolicy = new FtVinculoPolicyService(),
  ) {}

  async getBolsistaById(id: string) {
    const bolsista = await this.repository.findById(id);

    if (!bolsista) {
      throw ftError(404, "Bolsista not found");
    }

    return {
      bolsista,
      ok: true,
      message: "Bolsista retrieved successfully",
      code: 200,
    };
  }

  async getAllBolsistas(query: FtBolsistaQueryDto = {}) {
    const { count, rows } = await this.repository.findAndCount(query);

    return {
      code: 200,
      bolsista: rows,
      count,
      message: "Bolsistas retrieved successfully",
      ok: true,
    };
  }

  async getBolsistasParaVinculo(query: FtBolsistaQueryDto = {}) {
    const { count, rows } = await this.repository.findAndCountVinculoCandidates(
      query,
    );

    return {
      code: 200,
      bolsistas: rows,
      count,
      message: "Bolsistas para vinculo retrieved successfully",
      ok: true,
    };
  }

  async saveBolsista(data: FtBolsistaDto, id?: string) {
    if (id) {
      return await this.updateBolsista(data, id);
    }

    this.policy.validateBolsistaPayload(data);
    return await this.createBolsista(data);
  }

  async createBolsista(data: FtBolsistaDto) {
    const paymentInfo = data?.payment_info;

    this.policy.validatePaymentInfo(paymentInfo);

    const municipe = await this.repository.findMunicipeById(data.municipe_uuid);
    if (!municipe) {
      throw ftError(404, "Municipe not found");
    }

    const repeated = await this.repository.findByMunicipeUuid(data.municipe_uuid);
    if (repeated) {
      throw ftError(409, "Bolsista already exists");
    }

    const { bolsista: newBolsista, paymentInfo: newPaymentInfo } =
      await this.repository.createWithPaymentInfo(
        {
          municipe_uuid: data.municipe_uuid,
        },
        {
          bco: paymentInfo.bco,
          ag: paymentInfo.ag,
          dig_ag: paymentInfo.dig_ag,
          conta: paymentInfo.conta,
          dig_conta: paymentInfo.dig_conta,
        },
      );

    const created = await this.repository.findById(newBolsista.get("id"));

    return {
      ...(created?.toJSON?.() ?? newBolsista.toJSON()),
      payment_info: newPaymentInfo.toJSON(),
      ok: true,
      message: "Bolsista created successfully",
    };
  }

  async updateBolsista(data: FtBolsistaDto, id: string) {
    const { bolsista } = await this.getBolsistaById(id);
    const paymentInfo = data?.payment_info;

    this.policy.validatePaymentInfo(paymentInfo);

    const currentPaymentInfo = bolsista.get("payment_info");

    if (!currentPaymentInfo) {
      throw ftError(400, "Dados bancarios nao encontrados para o bolsista");
    }

    return this.repository.updateWithPaymentInfo(
      bolsista,
      currentPaymentInfo,
      {
        bco: paymentInfo.bco,
        ag: paymentInfo.ag,
        dig_ag: paymentInfo.dig_ag,
        conta: paymentInfo.conta,
        dig_conta: paymentInfo.dig_conta,
      },
    );
  }

  async deleteBolsista(id: string) {
    const { bolsista } = await this.getBolsistaById(id);
    await this.repository.destroyBolsista(bolsista);

    return {
      message: "Bolsista deletado com sucesso",
    };
  }

  async getAllToExpire() {
    const today = new Date();
    const warningDate = new Date(today.setDate(today.getDate() + 5));

    return this.repository.findToExpire(warningDate);
  }

  // bolsista edital

  async prorrogate(bolsistas: FtBolsistaProrrogacaoDto[] = []) {
    if (!Array.isArray(bolsistas) || bolsistas.length === 0) {
      throw ftError(400, "Lista de bolsistas e obrigatoria");
    }

    const vinculos = [];

    for (const item of bolsistas) {
      if (!item?.bolsista_id || !item?.edital_id) {
        throw ftError(400, "Bolsista e edital sao obrigatorios");
      }

      const { bolsista } = await this.getBolsistaById(item.bolsista_id);

      if (!bolsista) {
        throw ftError(404, "Bolsista not found");
      }

      const edital = await this.repository.findEditalById(item.edital_id);
      if (!edital) {
        throw ftError(404, "Edital not found");
      }

      this.vinculoPolicy.ensureEditalAtivo(edital);

      const vinculo = await this.repository.findVinculo(
        item.bolsista_id,
        item.edital_id,
        "ativo",
      );

      if (!vinculo) {
        throw ftError(404, "Vinculo not found");
      }

      vinculos.push(vinculo);
    }

    const before = vinculos.map((item) => item.toJSON());
    await this.repository.prorrogateVinculos(vinculos);
    const after = vinculos.map((item) => item.toJSON());

    return {
      message: "Vinculos prorrogados com sucesso",
      before,
      after,
    };
  }

  async getBolsistaByEditalId(id: string) {
    const bolsistas = await this.repository.findByEditalId(id);

    if (!bolsistas) {
      throw ftError(404, "Nenhum bolsista encontrado para esse edital");
    }

    return bolsistas;
  }

  async getHistoricoBolsista(id: string) {
    const { bolsista } = await this.getBolsistaById(id);
    const historico = await this.repository.findHistoricoByBolsistaId(
      bolsista.get("id"),
    );

    return {
      message: "Historico do bolsista retrieved successfully",
      historico,
      ok: true,
    };
  }

  async cancelBolsistaEdital(
    bolsistaId: string,
    editalId: string,
    data: FtBolsistaCancelamentoDto,
  ) {
    if (!bolsistaId || !editalId) {
      throw ftError(400, "Bolsista e edital sao obrigatorios");
    }

    const observacao = data?.observacao?.trim();
    if (!observacao) {
      throw ftError(400, "Observacao e obrigatoria");
    }

    const bolsista = await this.repository.findById(bolsistaId);
    const edital = await this.repository.findEditalById(editalId);
    const vinculo = await this.repository.findVinculo(bolsistaId, editalId, "ativo");

    if (!bolsista || !edital || !vinculo) {
      throw ftError(404, "Bolsista ou Edital nao encontrados");
    }

    this.vinculoPolicy.ensureCanChangeVinculo(edital, vinculo);

    const before = {
      bolsista: bolsista.toJSON(),
      vinculo: vinculo.toJSON(),
    };
    await this.repository.cancelVinculo(bolsista, vinculo, observacao);
    return {
      before,
      after: {
        bolsista: bolsista.toJSON(),
        vinculo: vinculo.toJSON(),
      },
    };
  }

  // faltas
  async createFalta(bolsistaId: string, data: FtBolsistaFaltaDto) {
    const { edital_id, data_falta, observacao = null } = data;

    if (!bolsistaId) {
      throw ftError(400, "Bolsista e obrigatorio");
    }

    if (!edital_id) {
      throw ftError(400, "Edital e obrigatorio");
    }

    if (!data_falta) {
      throw ftError(400, "Data da falta e obrigatoria");
    }

    if (Number.isNaN(Date.parse(String(data_falta)))) {
      throw ftError(400, "Data da falta invalida");
    }

    const bolsista = await this.repository.findById(bolsistaId);
    if (!bolsista) {
      throw ftError(404, "Bolsista not found");
    }

    const edital = await this.repository.findEditalById(edital_id);
    if (!edital) {
      throw ftError(404, "Edital not found");
    }

    const vinculo = await this.repository.findVinculo(bolsistaId, edital_id);
    if (!vinculo) {
      throw ftError(404, "Vinculo entre bolsista e edital nao encontrado");
    }

    const faltaExistente =
      await this.repository.findFaltaByBolsistaEditalData(
        bolsistaId,
        edital_id,
        data_falta,
      );

    this.faltaPolicy.ensureCanCreateFalta({
      edital,
      vinculo,
      data_falta,
      faltaExistente,
    });

    const falta = await this.repository.createFalta({
      bolsista_id: bolsistaId,
      edital_id,
      data_falta,
      observacao,
    });

    return {
      message: "Falta lancada com sucesso",
      falta,
      ok: true,
    };
  }

  async listFaltas(bolsistaId: string, query: FtBolsistaFaltaQueryDto = {}) {
    const bolsista = await this.repository.findById(bolsistaId);

    if (!bolsista) {
      throw ftError(404, "Bolsista not found");
    }

    const { count, rows } = await this.repository.findAndCountFaltasByBolsista(
      bolsistaId,
      query,
    );

    return {
      message: "Faltas retrieved successfully",
      faltas: rows,
      count,
      ok: true,
    };
  }

  async deleteFalta(bolsistaId: string, faltaId: string) {
    const falta = await this.repository.findFaltaById(faltaId);

    if (falta?.get("bolsista_id") !== bolsistaId) {
      throw ftError(404, "Falta not found");
    }

    await this.repository.destroyFalta(falta);

    return {
      message: "Falta deletada com sucesso",
      ok: true,
      before: falta.toJSON(),
    };
  }
}
