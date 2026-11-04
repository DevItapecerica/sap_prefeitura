import type { FastifyRequest, FastifyReply } from "fastify";
import type { EditalWorkflowService } from "../../application/use-case/edital-workflow.service.js";
import type {
  WorkflowQuery,
  WorkflowInput,
  EditalInput,
  ConfigInput,
  DatedInput,
} from "../../domain/repositories/workflow.repository.js";
import type { Answers } from "../../domain/services/edital-workflow.policy.js";
import type { GerarEspelhoPontoBolsistaUseCase } from "../../../ft-bolsista/application/use-case/gerar-espelho-ponto-bolsista.use-case.js";
type RegistrationInput = {
  municipe_uuid: string;
  respostas: Answers;
  motivo?: string;
};
type ParticipationPdf = Pick<GerarEspelhoPontoBolsistaUseCase, "execute">;
export type WorkflowUseCases = Pick<
  EditalWorkflowService,
  | "list"
  | "detail"
  | "create"
  | "update"
  | "window"
  | "phase"
  | "configs"
  | "config"
  | "inscriptions"
  | "history"
  | "register"
  | "prevalidate"
  | "call"
  | "participations"
  | "transition"
  | "records"
  | "record"
  | "pdfParticipant"
>;
export class EditalWorkflowController {
  constructor(
    private service: WorkflowUseCases,
    private timeSheetPdf?: ParticipationPdf,
    private attendanceSheetPdf?: ParticipationPdf,
  ) {}
  readonly list = (
    r: FastifyRequest<{ Params: {}; Querystring: WorkflowQuery; Body: never }>,
  ) => this.service.list(r.query);
  readonly create = (
    r: FastifyRequest<{
      Params: {};
      Querystring: WorkflowQuery;
      Body: EditalInput;
    }>,
  ) => this.service.create(r.body, { id: r.user.id, requestId: r.id });
  readonly detail = (
    r: FastifyRequest<{
      Params: { id: string };
      Querystring: WorkflowQuery;
      Body: never;
    }>,
  ) => this.service.detail(r.params.id);
  readonly update = (
    r: FastifyRequest<{
      Params: { id: string };
      Querystring: WorkflowQuery;
      Body: EditalInput;
    }>,
  ) =>
    this.service.update(r.params.id, r.body, {
      id: r.user.id,
      requestId: r.id,
    });
  readonly window = (
    r: FastifyRequest<{
      Params: { id: string };
      Querystring: WorkflowQuery;
      Body: {
        inscricoes_inicio: string;
        inscricoes_fim: string;
        motivo: string;
      };
    }>,
  ) =>
    this.service.window(r.params.id, r.body, {
      id: r.user.id,
      requestId: r.id,
    });
  readonly open = (
    r: FastifyRequest<{
      Params: { id: string };
      Querystring: WorkflowQuery;
      Body: never;
    }>,
  ) =>
    this.service.phase(r.params.id, "aberto", {
      id: r.user.id,
      requestId: r.id,
    });
  readonly close = (
    r: FastifyRequest<{
      Params: { id: string };
      Querystring: WorkflowQuery;
      Body: never;
    }>,
  ) =>
    this.service.phase(r.params.id, "encerrado", {
      id: r.user.id,
      requestId: r.id,
    });
  readonly list_pagadores = (
    r: FastifyRequest<{
      Params: { id: string };
      Querystring: WorkflowQuery;
      Body: never;
    }>,
  ) => this.service.configs(r.params.id, "pagadores", r.query);
  readonly create_pagadores = (
    r: FastifyRequest<{
      Params: { id: string };
      Querystring: WorkflowQuery;
      Body: ConfigInput;
    }>,
  ) =>
    this.service.config(r.params.id, "pagadores", undefined, r.body, {
      id: r.user.id,
      requestId: r.id,
    });
  readonly update_pagadores = (
    r: FastifyRequest<{
      Params: { id: string; itemId: string };
      Querystring: WorkflowQuery;
      Body: ConfigInput;
    }>,
  ) =>
    this.service.config(r.params.id, "pagadores", r.params.itemId, r.body, {
      id: r.user.id,
      requestId: r.id,
    });
  readonly remove_pagadores = (
    r: FastifyRequest<{
      Params: { id: string; itemId: string };
      Querystring: WorkflowQuery;
      Body: never;
    }>,
  ) =>
    this.service.config(r.params.id, "pagadores", r.params.itemId, null, {
      id: r.user.id,
      requestId: r.id,
    });
  readonly list_turnos = (
    r: FastifyRequest<{
      Params: { id: string };
      Querystring: WorkflowQuery;
      Body: never;
    }>,
  ) => this.service.configs(r.params.id, "turnos", r.query);
  readonly create_turnos = (
    r: FastifyRequest<{
      Params: { id: string };
      Querystring: WorkflowQuery;
      Body: ConfigInput;
    }>,
  ) =>
    this.service.config(r.params.id, "turnos", undefined, r.body, {
      id: r.user.id,
      requestId: r.id,
    });
  readonly update_turnos = (
    r: FastifyRequest<{
      Params: { id: string; itemId: string };
      Querystring: WorkflowQuery;
      Body: ConfigInput;
    }>,
  ) =>
    this.service.config(r.params.id, "turnos", r.params.itemId, r.body, {
      id: r.user.id,
      requestId: r.id,
    });
  readonly remove_turnos = (
    r: FastifyRequest<{
      Params: { id: string; itemId: string };
      Querystring: WorkflowQuery;
      Body: never;
    }>,
  ) =>
    this.service.config(r.params.id, "turnos", r.params.itemId, null, {
      id: r.user.id,
      requestId: r.id,
    });
  readonly list_locais = (
    r: FastifyRequest<{
      Params: { id: string };
      Querystring: WorkflowQuery;
      Body: never;
    }>,
  ) => this.service.configs(r.params.id, "locais", r.query);
  readonly create_locais = (
    r: FastifyRequest<{
      Params: { id: string };
      Querystring: WorkflowQuery;
      Body: ConfigInput;
    }>,
  ) =>
    this.service.config(r.params.id, "locais", undefined, r.body, {
      id: r.user.id,
      requestId: r.id,
    });
  readonly update_locais = (
    r: FastifyRequest<{
      Params: { id: string; itemId: string };
      Querystring: WorkflowQuery;
      Body: ConfigInput;
    }>,
  ) =>
    this.service.config(r.params.id, "locais", r.params.itemId, r.body, {
      id: r.user.id,
      requestId: r.id,
    });
  readonly remove_locais = (
    r: FastifyRequest<{
      Params: { id: string; itemId: string };
      Querystring: WorkflowQuery;
      Body: never;
    }>,
  ) =>
    this.service.config(r.params.id, "locais", r.params.itemId, null, {
      id: r.user.id,
      requestId: r.id,
    });
  readonly list_beneficios = (
    r: FastifyRequest<{
      Params: { id: string };
      Querystring: WorkflowQuery;
      Body: never;
    }>,
  ) => this.service.configs(r.params.id, "beneficios", r.query);
  readonly create_beneficios = (
    r: FastifyRequest<{
      Params: { id: string };
      Querystring: WorkflowQuery;
      Body: ConfigInput;
    }>,
  ) =>
    this.service.config(r.params.id, "beneficios", undefined, r.body, {
      id: r.user.id,
      requestId: r.id,
    });
  readonly update_beneficios = (
    r: FastifyRequest<{
      Params: { id: string; itemId: string };
      Querystring: WorkflowQuery;
      Body: ConfigInput;
    }>,
  ) =>
    this.service.config(r.params.id, "beneficios", r.params.itemId, r.body, {
      id: r.user.id,
      requestId: r.id,
    });
  readonly remove_beneficios = (
    r: FastifyRequest<{
      Params: { id: string; itemId: string };
      Querystring: WorkflowQuery;
      Body: never;
    }>,
  ) =>
    this.service.config(r.params.id, "beneficios", r.params.itemId, null, {
      id: r.user.id,
      requestId: r.id,
    });
  readonly inscriptions = (
    r: FastifyRequest<{
      Params: { id: string };
      Querystring: WorkflowQuery;
      Body: never;
    }>,
  ) => this.service.inscriptions(r.params.id, r.query);
  readonly inscriptionHistory = (
    r: FastifyRequest<{
      Params: { id: string; inscricaoId: string };
      Querystring: WorkflowQuery;
      Body: never;
    }>,
  ) => this.service.history(r.params.id, r.params.inscricaoId, true, r.query);
  readonly participationHistory = (
    r: FastifyRequest<{
      Params: { id: string; participacaoId: string };
      Querystring: WorkflowQuery;
      Body: never;
    }>,
  ) =>
    this.service.history(r.params.id, r.params.participacaoId, false, r.query);
  readonly prevalidate_inscricao = (
    r: FastifyRequest<{
      Params: { id: string };
      Querystring: WorkflowQuery;
      Body: WorkflowInput;
    }>,
  ) => this.service.prevalidate(r.params.id, "inscricao", r.body, "normal");
  readonly prevalidate_inscricao_encaixe = (
    r: FastifyRequest<{
      Params: { id: string };
      Querystring: WorkflowQuery;
      Body: WorkflowInput;
    }>,
  ) => this.service.prevalidate(r.params.id, "inscricao", r.body, "encaixe");
  readonly prevalidate_inscricao_excecao = (
    r: FastifyRequest<{
      Params: { id: string };
      Querystring: WorkflowQuery;
      Body: WorkflowInput;
    }>,
  ) => this.service.prevalidate(r.params.id, "inscricao", r.body, "excecao");
  readonly prevalidate_convocacao = (
    r: FastifyRequest<{
      Params: { id: string };
      Querystring: WorkflowQuery;
      Body: WorkflowInput;
    }>,
  ) => this.service.prevalidate(r.params.id, "convocacao", r.body, "normal");
  readonly prevalidate_convocacao_excecao = (
    r: FastifyRequest<{
      Params: { id: string };
      Querystring: WorkflowQuery;
      Body: WorkflowInput;
    }>,
  ) => this.service.prevalidate(r.params.id, "convocacao", r.body, "excecao");
  readonly prevalidate_ativacao = (
    r: FastifyRequest<{
      Params: { id: string };
      Querystring: WorkflowQuery;
      Body: WorkflowInput;
    }>,
  ) => this.service.prevalidate(r.params.id, "ativacao", r.body, "normal");
  readonly prevalidate_prorrogacao = (
    r: FastifyRequest<{
      Params: { id: string };
      Querystring: WorkflowQuery;
      Body: WorkflowInput;
    }>,
  ) => this.service.prevalidate(r.params.id, "prorrogacao", r.body, "normal");
  readonly register = (
    r: FastifyRequest<{
      Params: { id: string };
      Querystring: WorkflowQuery;
      Body: RegistrationInput;
    }>,
  ) =>
    this.service.register(
      r.params.id,
      r.body,
      { id: r.user.id, requestId: r.id },
      false,
    );
  readonly registerEncaixe = (
    r: FastifyRequest<{
      Params: { id: string };
      Querystring: WorkflowQuery;
      Body: RegistrationInput;
    }>,
  ) =>
    this.service.register(
      r.params.id,
      r.body,
      { id: r.user.id, requestId: r.id },
      true,
    );
  readonly registerException = (
    r: FastifyRequest<{
      Params: { id: string };
      Querystring: WorkflowQuery;
      Body: RegistrationInput;
    }>,
  ) =>
    this.service.register(
      r.params.id,
      r.body,
      { id: r.user.id, requestId: r.id },
      false,
      true,
    );
  readonly call = (
    r: FastifyRequest<{
      Params: { id: string; inscricaoId: string };
      Querystring: WorkflowQuery;
      Body: WorkflowInput;
    }>,
  ) =>
    this.service.call(r.params.id, r.params.inscricaoId, r.body, {
      id: r.user.id,
      requestId: r.id,
    });
  readonly callException = (
    r: FastifyRequest<{
      Params: { id: string; inscricaoId: string };
      Querystring: WorkflowQuery;
      Body: WorkflowInput;
    }>,
  ) =>
    this.service.call(
      r.params.id,
      r.params.inscricaoId,
      r.body,
      { id: r.user.id, requestId: r.id },
      true,
    );
  readonly participations = (
    r: FastifyRequest<{
      Params: { id: string };
      Querystring: WorkflowQuery;
      Body: never;
    }>,
  ) => this.service.participations(r.params.id, r.query);
  readonly ativar = (
    r: FastifyRequest<{
      Params: { id: string; participacaoId: string };
      Querystring: WorkflowQuery;
      Body: WorkflowInput;
    }>,
  ) =>
    this.service.transition(
      r.params.id,
      r.params.participacaoId,
      "ativar",
      r.body,
      { id: r.user.id, requestId: r.id },
    );
  readonly cancelar = (
    r: FastifyRequest<{
      Params: { id: string; participacaoId: string };
      Querystring: WorkflowQuery;
      Body: WorkflowInput;
    }>,
  ) =>
    this.service.transition(
      r.params.id,
      r.params.participacaoId,
      "cancelar",
      r.body,
      { id: r.user.id, requestId: r.id },
    );
  readonly concluir = (
    r: FastifyRequest<{
      Params: { id: string; participacaoId: string };
      Querystring: WorkflowQuery;
      Body: WorkflowInput;
    }>,
  ) =>
    this.service.transition(
      r.params.id,
      r.params.participacaoId,
      "concluir",
      r.body,
      { id: r.user.id, requestId: r.id },
    );
  readonly prorrogar = (
    r: FastifyRequest<{
      Params: { id: string; participacaoId: string };
      Querystring: WorkflowQuery;
      Body: WorkflowInput;
    }>,
  ) =>
    this.service.transition(
      r.params.id,
      r.params.participacaoId,
      "prorrogar",
      r.body,
      { id: r.user.id, requestId: r.id },
    );
  readonly alocar = (
    r: FastifyRequest<{
      Params: { id: string; participacaoId: string };
      Querystring: WorkflowQuery;
      Body: WorkflowInput;
    }>,
  ) =>
    this.service.transition(
      r.params.id,
      r.params.participacaoId,
      "alocar",
      r.body,
      { id: r.user.id, requestId: r.id },
    );
  readonly list_faltas = (
    r: FastifyRequest<{
      Params: { id: string; participacaoId: string };
      Querystring: WorkflowQuery;
      Body: never;
    }>,
  ) =>
    this.service.records(
      r.params.id,
      r.params.participacaoId,
      "faltas",
      r.query,
    );
  readonly create_faltas = (
    r: FastifyRequest<{
      Params: { id: string; participacaoId: string };
      Querystring: WorkflowQuery;
      Body: DatedInput;
    }>,
  ) =>
    this.service.record(
      r.params.id,
      r.params.participacaoId,
      "faltas",
      r.body,
      { id: r.user.id, requestId: r.id },
    );
  readonly remove_faltas = (
    r: FastifyRequest<{
      Params: { id: string; participacaoId: string; itemId: string };
      Querystring: WorkflowQuery;
      Body: never;
    }>,
  ) =>
    this.service.record(
      r.params.id,
      r.params.participacaoId,
      "faltas",
      {},
      { id: r.user.id, requestId: r.id },
      r.params.itemId,
    );
  readonly list_ocorrencias = (
    r: FastifyRequest<{
      Params: { id: string; participacaoId: string };
      Querystring: WorkflowQuery;
      Body: never;
    }>,
  ) =>
    this.service.records(
      r.params.id,
      r.params.participacaoId,
      "ocorrencias",
      r.query,
    );
  readonly create_ocorrencias = (
    r: FastifyRequest<{
      Params: { id: string; participacaoId: string };
      Querystring: WorkflowQuery;
      Body: DatedInput;
    }>,
  ) =>
    this.service.record(
      r.params.id,
      r.params.participacaoId,
      "ocorrencias",
      r.body,
      { id: r.user.id, requestId: r.id },
    );
  readonly remove_ocorrencias = (
    r: FastifyRequest<{
      Params: { id: string; participacaoId: string; itemId: string };
      Querystring: WorkflowQuery;
      Body: never;
    }>,
  ) =>
    this.service.record(
      r.params.id,
      r.params.participacaoId,
      "ocorrencias",
      {},
      { id: r.user.id, requestId: r.id },
      r.params.itemId,
    );
  readonly timeSheet = async (
    r: FastifyRequest<{
      Params: { id: string; participacaoId: string };
      Querystring: { mes: string };
      Body: never;
    }>,
    reply: FastifyReply,
  ) => {
    const identity = await this.service.pdfParticipant(
      r.params.id,
      r.params.participacaoId,
      r.query.mes,
    );
    const renderer = this.timeSheetPdf;
    if (!renderer) throw new Error("PDF renderer not configured");
    const pdf = await renderer.execute(
      identity,
      r.params.id,
      r.query.mes,
      r.id,
    );
    return reply
      .type(pdf.contentType)
      .header("Content-Disposition", pdf.contentDisposition)
      .send(pdf.file);
  };
  readonly attendanceSheet = async (
    r: FastifyRequest<{
      Params: { id: string; participacaoId: string };
      Querystring: { mes: string };
      Body: never;
    }>,
    reply: FastifyReply,
  ) => {
    const identity = await this.service.pdfParticipant(
      r.params.id,
      r.params.participacaoId,
      r.query.mes,
    );
    const renderer = this.attendanceSheetPdf;
    if (!renderer) throw new Error("PDF renderer not configured");
    const pdf = await renderer.execute(
      identity,
      r.params.id,
      r.query.mes,
      r.id,
    );
    return reply
      .type(pdf.contentType)
      .header("Content-Disposition", pdf.contentDisposition)
      .send(pdf.file);
  };
}
