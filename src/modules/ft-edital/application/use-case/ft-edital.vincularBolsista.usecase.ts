import { ftError } from "../../../ft-bolsista/application/utils/ft-error.js";
import { FtEditalRepository } from "../../domain/repositories/ft-edital.repository.js";
import { FtVinculoPolicyService } from "../../domain/services/ft-vinculo-policy.service.js";
import { ensureBolsistaElegivelPorIdade } from "../../domain/services/ft-idade-policy.service.js";

export default class FtEditalVincularBolsistaUseCase {
  private readonly calcularVencimento = (dataVinculo: Date) => {
    const vencimento = new Date(dataVinculo);
    vencimento.setMonth(vencimento.getMonth() + 6);
    return vencimento;
  };

  constructor(
    private readonly repository: FtEditalRepository,
    private readonly vinculoPolicy = new FtVinculoPolicyService(),
  ) {}

  async execute(
    id: string,
    bolsistas: Array<{
      bolsista_id: string;
      local: string;
      pagador_id: string;
      turno_id: string;
    }>,
    dataVinculo: any,
  ) {
    if (!id) throw ftError(400, "Edital e obrigatorio");
    if (!Array.isArray(bolsistas) || bolsistas.length === 0)
      throw ftError(400, "Lista de bolsistas e obrigatoria");
    if (!dataVinculo || Number.isNaN(Date.parse(String(dataVinculo))))
      throw ftError(400, "Data de vinculo invalida");

    const edital = await this.repository.findById(id);
    if (!edital) throw ftError(404, "Edital not found");
    this.vinculoPolicy.ensureEditalAtivo(edital);

    const vinculos = [];
    const ids = new Set<string>();
    for (const item of bolsistas) {
      const bolsistaId = item?.bolsista_id;
      const local = item?.local?.trim();
      const pagadorId = item?.pagador_id;
      const turnoId = item?.turno_id;
      if (!bolsistaId || !local || !pagadorId || !turnoId)
        throw ftError(400, "Bolsista, local, pagador e turno sao obrigatorios");
      if (ids.has(bolsistaId)) throw ftError(400, "Bolsista duplicado no lote");
      ids.add(bolsistaId);

      const bolsista = await this.repository.findBolsistaById(bolsistaId);
      if (!bolsista) throw ftError(404, "Bolsista not found");
      ensureBolsistaElegivelPorIdade(bolsista, dataVinculo, edital);
      const vinculosDoPar = await this.repository.findVinculosByBolsistaEdital(
        bolsistaId,
        id,
      );
      this.vinculoPolicy.ensureCanCreateVinculo(vinculosDoPar, dataVinculo, edital);
      if (await this.repository.findActiveVinculoByBolsista(bolsistaId))
        throw ftError(403, "Bolsista ja ativo em outro edital");

      vinculos.push({
        bolsista,
        local,
        pagador_id: pagadorId,
        turno_id: turnoId,
        data_vinculo: dataVinculo,
        expire_at: this.calcularVencimento(new Date(dataVinculo)),
      });
    }
    return this.repository.vincularBolsistas(edital, vinculos);
  }
}
