import { ftError } from "../utils/ft-error.js";
import { isValidCpf } from "../utils/cpf.js";
import {
  FtBolsistaDto,
  FtBolsistaFaltaDto,
  FtBolsistaFaltaQueryDto,
  FtBolsistaProrrogacaoDto,
  FtBolsistaQueryDto,
} from "../dto/ft-bolsista.dto.js";
import {
  pagador,
  verifyPagador,
  verifyQuantityPagador,
} from "../utils/pagador.js";
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

    const pagadorWithQuantity = await Promise.all(
      pagador.map(async (item) => ({
        ...item,
        quantity: await this.repository.countActiveByPagador(item.id),
      })),
    );

    return {
      code: 200,
      bolsista: rows,
      count,
      pagador: pagadorWithQuantity,
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
    this.policy.validateBolsistaPayload(data);

    if (!isValidCpf(data?.cpf)) {
      throw ftError(400, "CPF invalido");
    }

    if (id) {
      return await this.updateBolsista(data, id);
    }

    return await this.createBolsista(data);
  }

  async createBolsista(data: FtBolsistaDto) {
    const paymentInfo = data?.payment_info;

    this.policy.validatePaymentInfo(paymentInfo);

    verifyPagador(paymentInfo.pagador_id);

    const repeated = await this.repository.findByCpf(data.cpf);
    if (repeated) {
      throw ftError(403, "Bolsista already exists");
    }

    const { bolsista: newBolsista, paymentInfo: newPaymentInfo } =
      await this.repository.createWithPaymentInfo(
        {
          nome: data.nome,
          cpf: data.cpf,
          telefone: data.telefone,
          local: data.local,
          cep: data.cep,
          numero: data.numero,
          logradouro: data.logradouro,
          bairro: data.bairro,
          cidade: data.cidade,
          uf: data.uf,
        },
        {
          bco: paymentInfo.bco,
          ag: paymentInfo.ag,
          dig_ag: paymentInfo.dig_ag,
          conta: paymentInfo.conta,
          dig_conta: paymentInfo.dig_conta,
          pagador_id: paymentInfo.pagador_id,
        },
      );

    return {
      ...newBolsista.toJSON(),
      payment_info: newPaymentInfo.toJSON(),
      ok: true,
      message: "Bolsista created successfully",
    };
  }

  async updateBolsista(data: FtBolsistaDto, id: string) {
    const { bolsista } = await this.getBolsistaById(id);
    const paymentInfo = data?.payment_info;

    this.policy.validatePaymentInfo(paymentInfo);

    const selectedPagador = verifyPagador(paymentInfo.pagador_id);

    if (
      bolsista.get("status") === "ativo" &&
      bolsista.get("payment_info")?.pagador_id !== paymentInfo.pagador_id
    ) {
      const quantity = await this.repository.countActiveByPagador(
        paymentInfo.pagador_id,
      );
      verifyQuantityPagador(selectedPagador.max_bolsista, quantity);
    }

    const currentPaymentInfo = bolsista.get("payment_info");

    if (!currentPaymentInfo) {
      throw ftError(400, "Dados bancarios nao encontrados para o bolsista");
    }

    return this.repository.updateWithPaymentInfo(
      bolsista,
      {
        nome: data.nome,
        cpf: data.cpf,
        telefone: data.telefone,
        local: data.local,
        cep: data.cep,
        numero: data.numero,
        logradouro: data.logradouro,
        bairro: data.bairro,
        cidade: data.cidade,
        uf: data.uf,
      },
      currentPaymentInfo,
      {
        bco: paymentInfo.bco,
        ag: paymentInfo.ag,
        dig_ag: paymentInfo.dig_ag,
        conta: paymentInfo.conta,
        dig_conta: paymentInfo.dig_conta,
        pagador_id: paymentInfo.pagador_id,
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

      if (!bolsista || bolsista.get("status") !== "ativo") {
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

    await this.repository.prorrogateVinculos(vinculos);

    return {
      message: "Vinculos prorrogados com sucesso",
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

  async cancelBolsistaEdital(bolsistaId: string, editalId: string) {
    if (!bolsistaId || !editalId) {
      throw ftError(400, "Bolsista e edital sao obrigatorios");
    }

    const bolsista = await this.repository.findById(bolsistaId);
    const edital = await this.repository.findEditalById(editalId);
    const vinculo = await this.repository.findVinculo(bolsistaId, editalId);

    if (!bolsista || !edital || !vinculo) {
      throw ftError(404, "Bolsista ou Edital nao encontrados");
    }

    this.vinculoPolicy.ensureCanChangeVinculo(edital, vinculo);

    await this.repository.cancelVinculo(bolsista, vinculo);
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

    if (!falta || falta.get("bolsista_id") !== bolsistaId) {
      throw ftError(404, "Falta not found");
    }

    await this.repository.destroyFalta(falta);

    return {
      message: "Falta deletada com sucesso",
      ok: true,
    };
  }
}
