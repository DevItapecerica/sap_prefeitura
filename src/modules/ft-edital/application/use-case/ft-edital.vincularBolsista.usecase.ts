import { ftError } from "../../../ft-bolsista/application/utils/ft-error.js";
// mockado - divida técnica;
import {
  pagador,
  verifyQuantityPagador,
} from "../../../ft-bolsista/application/utils/pagador.js";
import { FtEditalRepository } from "../../domain/repositories/ft-edital.repository.js";
import { FtVinculoPolicyService } from "../../domain/services/ft-vinculo-policy.service.js";

export default class FtEditalVincularBolsistaUseCase {
  private readonly VALIDADE_ANOS = 0;
  private readonly VALIDADE_MESES = 6;
  private readonly VALIDADE_DIAS = 0;

  private readonly calcularVencimento = (data_vinculo: Date) => {
    const dataVencimento = new Date(data_vinculo);
    dataVencimento.setFullYear(
      dataVencimento.getFullYear() + this.VALIDADE_ANOS,
    );
    dataVencimento.setMonth(dataVencimento.getMonth() + this.VALIDADE_MESES);
    dataVencimento.setDate(dataVencimento.getDate() + this.VALIDADE_DIAS);
    return dataVencimento;
  };

  constructor(
    private readonly repository: FtEditalRepository,
    private readonly vinculoPolicy = new FtVinculoPolicyService(),
  ) {}

  async execute(id: string, bolsistas: string[], dataVinculo: any) {
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

    // recebe o id do bolsista
    for (const bolsistaId of bolsistas) {
      if (!bolsistaId) {
        throw ftError(400, "Bolsista e obrigatorio");
      }

      const bolsista = await this.repository.findBolsistaById(bolsistaId);

      if (!bolsista) {
        throw ftError(404, "Bolsista not found");
      }

      // pega os vinculos no edital
      const vinculosDoPar = await this.repository.findVinculosByBolsistaEdital(
        bolsistaId,
        id,
      );

      // se tiver algo diferente de cancelado, n deixa vincular
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

      // edital e bolsistas tudo okay, vamos verificar pagamento
      const paymentInfo = bolsista.get("payment_info");
      const pagadorTarget = pagador.find(
        (item) => item.id === paymentInfo?.pagador_id,
      );

      if (!pagadorTarget) {
        throw ftError(403, "Pagador nao encontrado");
      }

      // verifica a quantidade de pagadores naquele edital deveria verificar por edital, mas acho que está geral
      const quantity = await this.repository.countActiveByPagador(
        paymentInfo.pagador_id,
      );

      verifyQuantityPagador(pagadorTarget.max_bolsista, quantity);

      const vencimento = this.calcularVencimento(dataVinculo);

      vinculos.push({
        bolsista,
        data_vinculo: dataVinculo,
        expire_at: vencimento,
      });
    }

    return this.repository.vincularBolsistas(edital, vinculos);
  }
}
