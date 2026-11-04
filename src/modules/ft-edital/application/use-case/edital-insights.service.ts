import {
  enrollmentSnapshot,
  enrollmentAnswers,
} from "../utils/enrollment-content.js";
import { mapPeaadRuleError } from "../../../ft-bolsista/application/utils/map-peaad-rule-error.js";
import type {
  WorkflowReader,
  WorkflowQuery,
  IAesCrypt,
  Participation,
} from "../../domain/repositories/workflow.repository.js";
import type { Instant, Page } from "../../../../core/contracts/unit-of-work.js";
import type { Answers } from "../../domain/services/edital-workflow.policy.js";
import {
  participationSignals,
  paymentIssues,
} from "../../domain/services/edital-insights.policy.js";
import { ftError } from "../../../ft-bolsista/application/utils/ft-error.js";

const pagination = (q: WorkflowQuery) => {
  const limit = Math.min(50, Math.max(1, Number(q.limit) || 20));
  return { limit, offset: Math.max(0, Number(q.page) || 0) * limit };
};
interface PersonListRow extends Partial<Participation> {
  id: string;
  bolsista_id: string;
  nome: string;
  nome_inscricao: string | null;
  status: string;
  situacao: string;
  inscricao_excepcional: boolean;
  convocacao_excepcional: boolean;
  respostas?: Partial<Answers>;
  pagador_nome?: string;
  pagamento_pendente?: boolean;
}
export class EditalInsightsService {
  constructor(
    private repository: WorkflowReader,
    private crypto: IAesCrypt,
    private clock = () => new Date(),
  ) {}
  async people(
    id: string,
    query: WorkflowQuery,
    inscriptions: boolean,
  ): Promise<Page<PersonListRow>> {
    try {
      const e = await this.repository.edital(id);
      if (!e) throw ftError(404, "Edital nao encontrado");
      const result = await this.repository.people(id, query, inscriptions);
      const rows = await Promise.all(
        result.rows.map(async (row) => {
          const registration = inscriptions ? row : row.inscricao;
          const snapshot = registration?.snapshot
            ? enrollmentSnapshot(
                await this.crypto.decrypt(registration.snapshot),
              )
            : {};
          const current = inscriptions ? row.participacoes?.[0] : row;
          const base = {
            id: row.id,
            bolsista_id: row.bolsista_id,
            nome:
              row.bolsista?.municipe?.nome || snapshot.nome || "Participante",
            nome_inscricao: snapshot.nome || null,
            status: row.status,
            situacao: current?.status || row.status,
            excecao_motivo: row.excecao_motivo,
            excecao_autor_id: row.excecao_autor_id,
            excecao_em: row.excecao_em,
            inscricao_excepcional: Boolean(registration?.excecao_em),
            convocacao_excepcional: Boolean(current?.excecao_em),
            createdAt: row.createdAt,
          };
          if (inscriptions)
            return {
              ...base,
              respostas: enrollmentAnswers(
                await this.crypto.decrypt(row.respostas!),
              ),
              pagador_id: current?.pagador_id,
              turno_id: current?.turno_id,
            };
          const {
            bolsista: _b,
            inscricao: _i,
            pagador: _p,
            respostas: _encryptedAnswers,
            ...participation
          } = row;
          return {
            ...participation,
            ...base,
            pagador_nome: row.pagador?.nome || "Pagador indisponível",
            ...participationSignals(e, row, this.clock()),
            pagamento_pendente:
              paymentIssues(row.bolsista?.payment_info).length > 0,
          };
        }),
      );
      return await { rows, count: result.count };
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
  async history(
    id: string,
    resource: string,
    inscriptions: boolean,
    query: WorkflowQuery,
  ) {
    try {
      const source = await this.repository.historySource(
        id,
        resource,
        inscriptions,
      );
      if (!source) throw ftError(404, "Registro nao encontrado neste edital");
      const { registration, participations, events, actors: users } = source;
      const names = new Map(users.map((user) => [String(user.id), user.name]));
      const rows: Array<{
        id: string;
        recurso_id: string;
        acao: string;
        data: Instant | null | undefined;
        responsavel: string;
        motivo: string | null;
        origem: string;
        recurso_nome?: string;
      }> = events.map((event) => ({
        id: event.id,
        recurso_id: event.recurso_id,
        acao: event.acao,
        data: event.createdAt,
        responsavel:
          event.ator_id === "sistema"
            ? "Sistema"
            : names.get(String(event.ator_id)) ||
              "Usuário " + event.ator_id + " (nome indisponível)",
        motivo: event.motivo || null,
        origem: "evento",
      }));
      const fallback = (
        resourceId: string,
        action: string,
        date: Instant | null | undefined,
        reason?: string | null,
      ) => {
        if (
          !rows.some(
            (event) =>
              event.recurso_id === resourceId &&
              (event.acao === action || event.acao === action + "_excecao"),
          )
        )
          rows.push({
            id: "marco-" + resourceId + "-" + action,
            recurso_id: resourceId,
            acao: action,
            data: date || null,
            responsavel: "Não registrado",
            motivo: reason || null,
            origem: "marco",
          });
      };
      if (registration)
        fallback(registration.id, "inscrever", registration.createdAt);
      for (const p of participations) {
        fallback(p.id, "convocar", p.inscricao_id ? p.createdAt : null);
        if (
          !p.ativado_em &&
          (["ativo", "concluido", "expirado"].includes(p.status) ||
            p.prorrogated)
        )
          fallback(p.id, "ativar", null);
        for (const [field, action] of [
          ["ativado_em", "ativar"],
          ["canceled_at", "cancelar"],
          ["concluded_at", "concluir"],
          ["expired_at", "expirar"],
        ] as const)
          if (p[field]) fallback(p.id, action!, p[field], p.observacao);
        if (p.prorrogated) fallback(p.id, "prorrogar", null);
      }
      rows.sort(
        (a, b) =>
          String(
            a.data ? new Date(a.data).toISOString() : "9999",
          ).localeCompare(
            String(b.data ? new Date(b.data).toISOString() : "9999"),
          ) || String(a.id).localeCompare(String(b.id)),
      );
      const orderedParticipations = [...participations].sort(
        (a, b) =>
          String(
            a.createdAt ? new Date(a.createdAt).toISOString() : "9999",
          ).localeCompare(
            String(b.createdAt ? new Date(b.createdAt).toISOString() : "9999"),
          ) || String(a.id).localeCompare(String(b.id)),
      );
      const resourceNames = new Map<string, string>(
        orderedParticipations.map((p, index) => [
          String(p.id),
          "Participação " + (index + 1),
        ]),
      );
      if (registration) resourceNames.set(String(registration.id), "Inscrição");
      for (const event of rows)
        event.recurso_nome =
          resourceNames.get(String(event.recurso_id)) || "Participação";
      const { offset, limit } = pagination(query);
      return await {
        rows: rows.slice(offset, offset + limit),
        count: rows.length,
      };
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
}
