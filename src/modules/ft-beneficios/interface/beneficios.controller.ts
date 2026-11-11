import type { FastifyRequest, FastifyReply } from "fastify";
import type { ConsultarBeneficiosParticipacaoUseCase } from "../application/use-case/consultar-beneficios-participacao.use-case.js";
import type { EntregarBeneficiosUseCase } from "../application/use-case/entregar-beneficios.use-case.js";
import type { ConsultarHistoricoBeneficiosUseCase } from "../application/use-case/consultar-historico-beneficios.use-case.js";
import type { EstornarBeneficiosUseCase } from "../application/use-case/estornar-beneficios.use-case.js";
import type { ConsultarRelatorioBeneficiosUseCase } from "../application/use-case/consultar-relatorio-beneficios.use-case.js";
import type { ExportarRelatorioBeneficiosUseCase } from "../application/use-case/exportar-relatorio-beneficios.use-case.js";
import type { BenefitQuery } from "../domain/beneficios.contracts.js";
export type EditalParams = { id: string };
export type ParticipationParams = EditalParams & { participacaoId: string };
export type DeliveryParams = EditalParams & { entregaId: string };
export type DeliveryBody = { operacao_id: string; beneficio_ids: string[] };
export type ReverseBody = { operacao_id: string; motivo: string };
export interface BeneficiosUseCases {
  preview: Pick<ConsultarBeneficiosParticipacaoUseCase, "execute">;
  deliver: Pick<EntregarBeneficiosUseCase, "execute">;
  history: Pick<ConsultarHistoricoBeneficiosUseCase, "execute">;
  reverse: Pick<EstornarBeneficiosUseCase, "execute">;
  report: Pick<ConsultarRelatorioBeneficiosUseCase, "execute">;
  csv: Pick<ExportarRelatorioBeneficiosUseCase, "execute">;
}
export class BeneficiosController {
  constructor(private readonly useCases: BeneficiosUseCases) {}
  preview = (
    r: FastifyRequest<{
      Params: ParticipationParams;
      Querystring: BenefitQuery;
    }>,
  ) =>
    this.useCases.preview.execute(
      r.params.id,
      r.params.participacaoId,
      r.query,
    );
  deliver = (
    r: FastifyRequest<{ Params: ParticipationParams; Body: DeliveryBody }>,
  ) =>
    this.useCases.deliver.execute(
      r.params.id,
      r.params.participacaoId,
      r.body,
      {
        id: r.user.id,
        requestId: r.id,
      },
    );
  history = (
    r: FastifyRequest<{ Params: EditalParams; Querystring: BenefitQuery }>,
  ) => this.useCases.history.execute(r.params.id, r.query);
  reverse = (
    r: FastifyRequest<{ Params: DeliveryParams; Body: ReverseBody }>,
  ) =>
    this.useCases.reverse.execute(r.params.id, r.params.entregaId, r.body, {
      id: r.user.id,
      requestId: r.id,
    });
  report = (
    r: FastifyRequest<{ Params: EditalParams; Querystring: BenefitQuery }>,
  ) => this.useCases.report.execute(r.params.id, r.query);
  csv = async (
    r: FastifyRequest<{ Params: EditalParams; Querystring: BenefitQuery }>,
    reply: FastifyReply,
  ) => {
    const csv = await this.useCases.csv.execute(r.params.id, r.query);
    return reply
      .type("text/csv; charset=utf-8")
      .header("Content-Disposition", "attachment; filename=beneficios.csv")
      .send(csv);
  };
}
