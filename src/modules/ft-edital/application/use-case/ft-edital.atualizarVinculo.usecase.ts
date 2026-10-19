import { ftError } from "../../../ft-bolsista/application/utils/ft-error.js";
import { FtAtualizarVinculoDto } from "../dto/ft-edital.dto.js";
import { FtEditalRepository } from "../../domain/repositories/ft-edital.repository.js";
import { FtVinculoPolicyService } from "../../domain/services/ft-vinculo-policy.service.js";

export default class FtEditalAtualizarVinculoUseCase {
  constructor(
    private readonly repository: FtEditalRepository,
    private readonly vinculoPolicy = new FtVinculoPolicyService(),
  ) {}

  async execute(editalId: string, bolsistaId: string, data: FtAtualizarVinculoDto) {
    const local = data?.local?.trim();
    const pagadorId = data?.pagador_id;
    const turnoId = data?.turno_id;
    if (!editalId || !bolsistaId || !local || !pagadorId || !turnoId) {
      throw ftError(400, "Edital, bolsista, local, pagador e turno sao obrigatorios");
    }

    const edital = await this.repository.findById(editalId);
    if (!edital) throw ftError(404, "Edital not found");
    this.vinculoPolicy.ensureEditalAtivo(edital);

    const bolsista = await this.repository.findBolsistaById(bolsistaId);
    if (!bolsista) throw ftError(404, "Bolsista not found");

    const result = await this.repository.updateActiveVinculo(editalId, bolsistaId, {
      local,
      pagador_id: pagadorId,
      turno_id: turnoId,
    });
    if (!result) throw ftError(404, "Vinculo ativo nao encontrado");
    return result;
  }
}
