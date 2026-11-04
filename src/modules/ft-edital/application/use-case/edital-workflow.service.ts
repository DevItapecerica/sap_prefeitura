import {
  enrollmentSnapshot,
  enrollmentAnswers,
} from "../utils/enrollment-content.js";
import { mapPeaadRuleError } from "../../../ft-bolsista/application/utils/map-peaad-rule-error.js";
import {
  editingPolicy,
  assertEditable,
} from "../../domain/services/edital-editing.policy.js";
import {
  assertCompetenciasAbertas,
  nextCivilDay,
} from "../../domain/services/ft-folha-fechada.policy.js";
import { getVinculoOperationalEnd } from "../../domain/services/ft-vinculo-period.service.js";
import type {
  WorkflowUnitOfWork,
  WorkflowReader,
  WorkflowTransaction,
  Program,
  EditalInput,
  ConfigInput,
  WorkflowQuery,
  WorkflowInput,
  Registration,
  Person,
  Participation,
  ParticipantIdentity,
  DatedInput,
  IAesCrypt,
  ConfigKind,
} from "../../domain/repositories/workflow.repository.js";
import { EditalInsightsService } from "./edital-insights.service.js";
import {
  extensionEnd,
  paymentIssues,
} from "../../domain/services/edital-insights.policy.js";
import AppError from "../../../../core/appError.js";
import { ftError } from "../../../ft-bolsista/application/utils/ft-error.js";
import {
  Answers,
  businessDate,
  dateOnly,
  eligible,
  participationEnd,
  registrationWindow,
  validateConfiguration,
  validateHistory,
  requireExceptionReason,
} from "../../domain/services/edital-workflow.policy.js";

const occupied = ["convocado", "ativo"];
const plain = <T>(row: T): T => row;
const editalOutput = (row: Program) => {
  const e = plain(row);
  return {
    ...e,
    data_publicacao: dateOnly(e.data_publicacao),
    data_vencimento: dateOnly(e.data_vencimento),
  };
};
const editalPersistence = (data: EditalInput) => ({
  ...data,
  data_publicacao: dateOnly(data.data_publicacao) + "T12:00:00-03:00",
  data_vencimento: dateOnly(data.data_vencimento) + "T23:59:59-03:00",
});
export type { ConfigKind } from "../../domain/repositories/workflow.repository.js";
export type WorkflowActor = { id: number | string; requestId: string };
export const pageOptions = (query: WorkflowQuery = {}) => ({
  limit: Math.min(50, Math.max(1, Number(query.limit) || 20)),
  offset:
    Math.max(0, Number(query.page) || 0) *
    Math.min(50, Math.max(1, Number(query.limit) || 20)),
});

export class EditalWorkflowService {
  constructor(
    private readonly unit: WorkflowUnitOfWork,
    private readonly crypto: IAesCrypt,
    private readonly clock = () => new Date(),
  ) {}

  private async event(
    t: WorkflowTransaction,
    actor: WorkflowActor,
    editalId: string,
    resource: string,
    action: string,
    motivo?: string | null,
  ) {
    await t.addEvent({
      edital_id: editalId,
      recurso_id: resource,
      acao: action,
      ator_id: String(actor.id),
      request_id: actor.requestId,
      motivo: motivo || null,
    });
    await t.recordAudit({
      actor: { userId: actor.id },
      action:
        action.startsWith("editar") ||
        action.startsWith("alterar") ||
        action.startsWith("inativar") ||
        action.startsWith("excluir")
          ? "UPDATE"
          : "CREATE",
      module: "ft-edital",
      resourceType: "edital_workflow",
      resourceId: editalId,
      result: "SUCCESS",
      requestId: actor.requestId,
      metadata: { operation: action, resourceId: resource },
    });
  }
  private async edital(
    id: string,
    repository: WorkflowReader = this.unit.read,
  ) {
    const row = await repository.edital(id);
    if (!row) throw ftError(404, "Edital nao encontrado");
    return row;
  }
  private async assertOpenPeriod(
    repository: WorkflowReader,
    id: string,
    start: string,
    end: string,
  ) {
    assertCompetenciasAbertas(
      await repository.firstClosedMonth(id, start, end),
    );
  }
  private opened(e: Program) {
    if (
      e.fase !== "aberto" ||
      businessDate(this.clock()) > dateOnly(e.data_vencimento)
    )
      throw ftError(409, "Edital nao esta vigente e aberto");
  }
  async list(query: WorkflowQuery) {
    try {
      const result = await this.unit.read.listEditais(query, this.clock());
      return await { rows: result.rows.map(editalOutput), count: result.count };
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
  async detail(id: string) {
    try {
      const edital = editalOutput(await this.edital(id));
      const [reservadas, ocupadas] = await Promise.all(
        ["convocado", "ativo"].map((status) =>
          this.unit.read.countOccupations({ editalId: id, status }),
        ),
      );
      const closed = await this.unit.read.hasClosedPayroll(id);
      return await {
        ...edital,
        edicao: editingPolicy(edital, Boolean(closed), reservadas + ocupadas),
        reservadas,
        ocupadas,
        disponiveis: Math.max(0, edital.vagas - reservadas - ocupadas),
      };
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
  async create(data: EditalInput, actor: WorkflowActor) {
    try {
      validateConfiguration(data);
      return await this.unit.run(async (t) => {
        const row = await t.createEdital({
          ...editalPersistence(data),
          fase: "rascunho",
          status: "ativo",
        });
        await this.event(
          t,
          actor,
          String(row.id),
          String(row.id),
          "criar_edital",
        );
        return editalOutput(row);
      });
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
  async update(id: string, data: EditalInput, actor: WorkflowActor) {
    try {
      return await this.unit.run(async (t) => {
        const row = await this.edital(id, t),
          e = plain(row);
        if (e.fase === "encerrado") throw ftError(409, "Edital encerrado");
        validateConfiguration(data);
        const used = await t.countOccupations({
          editalId: id,
          status: occupied,
        });
        const closed = await t.hasClosedPayroll(id);
        assertEditable(e, data, editingPolicy(e, Boolean(closed), used));
        Object.assign(row, await t.updateEdital(id, editalPersistence(data)));
        await this.event(t, actor, id, id, "editar_edital");
        return editalOutput(row);
      });
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
  async window(
    id: string,
    data: {
      inscricoes_inicio: string;
      inscricoes_fim: string;
      motivo?: string;
    },
    actor: WorkflowActor,
  ) {
    try {
      return await this.unit.run(async (t) => {
        const row = await this.edital(id, t);
        if (row.fase === "encerrado") throw ftError(409, "Edital encerrado");
        validateConfiguration({ ...plain(row), ...data });
        Object.assign(
          row,
          await t.updateEdital(id, {
            inscricoes_inicio: data.inscricoes_inicio,
            inscricoes_fim: data.inscricoes_fim,
          }),
        );
        await this.event(t, actor, id, id, "alterar_janela", data.motivo);
        return editalOutput(row);
      });
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
  async phase(id: string, phase: "aberto" | "encerrado", actor: WorkflowActor) {
    try {
      return await this.unit.run(async (t) => {
        const row = await this.edital(id, t),
          e = plain(row);
        if (e.fase === "encerrado" || e.fase === phase)
          throw ftError(409, "Transicao de edital invalida");
        if (phase === "aberto") {
          if (
            e.fase !== "rascunho" ||
            e.vagas < 1 ||
            Number(e.carga_semanal) <= 0 ||
            Number(e.carga_mensal) <= 0 ||
            businessDate(this.clock()) > dateOnly(e.data_vencimento)
          )
            throw ftError(
              422,
              "Configure vagas, cargas e vigencia antes de abrir",
            );
        } else {
          const affected = await t.occupations(id);
          for (const participation of affected)
            if (participation.ativado_em)
              await this.assertEndChange(id, participation, t);
          for (const participation of affected)
            await this.event(
              t,
              actor,
              id,
              participation.id,
              participation.status === "convocado" ? "cancelar" : "concluir",
              "Edital encerrado",
            );
          await t.closeOccupations(id, this.clock());
        }
        Object.assign(
          row,
          await t.updateEdital(id, {
            fase: phase,
            status: phase === "encerrado" ? "inativo" : "ativo",
          }),
        );
        await this.event(
          t,
          actor,
          id,
          id,
          phase === "aberto" ? "abrir_edital" : "encerrar_edital",
        );
        return editalOutput(row);
      });
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
  async configs(id: string, kind: ConfigKind, query: WorkflowQuery) {
    try {
      await this.edital(id);
      const result = await this.unit.read.configs(id, kind, query);
      if (kind === "pagadores")
        for (const row of result.rows)
          row.ocupacao = await this.unit.read.countOccupations({
            editalId: id,
            pagadorId: row.uuid,
            status: occupied,
          });
      return await result;
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
  async config(
    id: string,
    kind: ConfigKind,
    itemId: string | undefined,
    data: ConfigInput | null,
    actor: WorkflowActor,
  ) {
    try {
      if (data) {
        data = { ...data, nome: data.nome.trim() };
        if (!data.nome) throw ftError(422, "Nome obrigatorio");
        if (kind === "turnos" && data.hora_inicio! >= data.hora_fim!)
          throw ftError(422, "Turno deve terminar depois do inicio");
      }
      return await this.unit.run(async (t) => {
        const edital = await this.edital(id, t);
        if (edital.fase === "encerrado") throw ftError(409, "Edital encerrado");
        const row = itemId ? await t.config(id, kind, itemId) : null;
        if (itemId && !row)
          throw ftError(404, "Configuracao nao encontrada neste edital");
        if (
          edital.primeira_convocacao_em &&
          (kind === "beneficios" || (kind === "turnos" && data))
        )
          throw ftError(409, "Condicoes bloqueadas apos a primeira convocacao");
        if (
          edital.primeira_convocacao_em &&
          row &&
          data &&
          data.nome !== row.nome
        )
          throw ftError(409, "Nome bloqueado para preservar o historico");
        if (row && kind === "pagadores" && data) {
          const used = await t.countOccupations({
            editalId: id,
            pagadorId: itemId,
            status: occupied,
          });
          if (data.quantidade! < used)
            throw ftError(409, "Capacidade abaixo da ocupacao e reservas");
        }
        if (row && !data) {
          const fk =
            kind === "pagadores"
              ? "pagador_id"
              : kind === "turnos"
                ? "turno_id"
                : "local_id";
          if (
            kind !== "beneficios" &&
            (await t.countOccupations({
              editalId: id,
              status: occupied,
              ...(fk === "pagador_id"
                ? { pagadorId: itemId }
                : fk === "turno_id"
                  ? { turnoId: itemId }
                  : { localId: itemId }),
            }))
          )
            throw ftError(409, "Configuracao possui convocados ou ativos");
        }
        const saved = await t.saveConfig(id, kind, itemId, data);
        await this.event(
          t,
          actor,
          id,
          String(saved.uuid || saved.id),
          (data ? "salvar_" : "inativar_") + kind,
        );
        return plain(saved);
      });
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
  async register(
    id: string,
    data: { municipe_uuid: string; respostas: Answers; motivo?: string },
    actor: WorkflowActor,
    encaixe: boolean,
    exception = false,
  ) {
    try {
      return await this.unit.run(async (t) => {
        // Same identity lock is acquired by registration, convocation and activation.
        const person = await t.lockPerson(data.municipe_uuid);
        if (!person) throw ftError(404, "Municipe nao encontrado");
        const e = plain(await this.edital(id, t));
        if (exception) requireExceptionReason(data.motivo);
        registrationWindow(e, this.clock(), encaixe || exception, data.motivo);
        if (!person.nascimento)
          throw ftError(
            422,
            "Cadastre o nascimento do municipe antes da inscricao",
          );
        const nascimento = await this.crypto.decrypt(person.nascimento);
        eligible(
          nascimento,
          data.respostas,
          businessDate(this.clock()),
          e,
          exception,
        );
        if (
          (await this.crypto.decrypt(person.cidade || ""))
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toLowerCase() !== "itapecerica da serra"
        )
          throw ftError(422, "Municipe deve residir em Itapecerica da Serra");
        const bolsista = await t.ensureIdentity(data.municipe_uuid);
        const history = await t.identityHistory(bolsista.id);
        validateHistory(
          e,
          history.map(plain),
          businessDate(this.clock()),
          exception,
        );
        if (await t.registrationForIdentity(id, bolsista.id))
          throw ftError(409, "Pessoa ja inscrita neste edital");
        const row = await t.createRegistration({
          edital_id: id,
          bolsista_id: bolsista.id,
          respostas: await this.crypto.encrypt(JSON.stringify(data.respostas)),
          snapshot: await this.crypto.encrypt(JSON.stringify(plain(person))),
          criado_por: Number(actor.id),
          ...(exception
            ? {
                excecao_motivo: data.motivo!.trim(),
                excecao_autor_id: String(actor.id),
                excecao_em: this.clock(),
              }
            : {}),
          encaixe_motivo:
            this.clock() > new Date(e.inscricoes_fim) ? data.motivo : null,
        });
        await this.event(
          t,
          actor,
          id,
          row.id,
          exception ? "inscrever_excecao" : "inscrever",
          exception ? data.motivo!.trim() : row.encaixe_motivo,
        );
        return { id: row.id, bolsista_id: bolsista.id, status: row.status };
      });
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
  async inscriptions(id: string, query: WorkflowQuery) {
    try {
      return await new EditalInsightsService(
        this.unit.read,
        this.crypto,
        this.clock,
      ).people(id, query, true);
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
      return await new EditalInsightsService(
        this.unit.read,
        this.crypto,
        this.clock,
      ).history(id, resource, inscriptions, query);
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
  async call(
    id: string,
    inscriptionId: string,
    data: WorkflowInput,
    actor: WorkflowActor,
    exception = false,
  ) {
    try {
      if (exception) requireExceptionReason(data.motivo);
      const seed = await this.unit.read.registration(id, inscriptionId);
      if (!seed) throw ftError(404, "Inscricao nao encontrada");
      return await this.withPerson(seed.bolsista_id, id, async (t, e) => {
        this.opened(e);
        const registration = await t.lockRegistration(inscriptionId);
        if (registration.status !== "inscrito")
          throw ftError(409, "Inscricao cancelada");
        const inicio = dateOnly(data.data_inicio);
        await this.assertOpenPeriod(t, id, inicio, participationEnd(e, inicio));
        const snapshot = enrollmentSnapshot(
          await this.crypto.decrypt(registration.snapshot),
        );
        eligible(
          await this.crypto.decrypt(snapshot.nascimento || ""),
          enrollmentAnswers(await this.crypto.decrypt(registration.respostas!)),
          inicio,
          e,
          exception,
        );
        const history = await t.identityHistory(seed.bolsista_id);
        validateHistory(e, history.map(plain), inicio, exception);
        const allocations = await this.allocation(t, e, data);
        const row = await t.createParticipation({
          ...allocations,
          inscricao_id: inscriptionId,
          edital_id: id,
          bolsista_id: seed.bolsista_id,
          data_vinculo: inicio + "T12:00:00-03:00",
          expire_at: participationEnd(e, inicio) + "T23:59:59-03:00",
          status: "convocado",
          ...(exception
            ? {
                excecao_motivo: data.motivo!.trim(),
                excecao_autor_id: String(actor.id),
                excecao_em: this.clock(),
              }
            : {}),
        });
        await t.updateEdital(id, {
          primeira_convocacao_em: e.primeira_convocacao_em || this.clock(),
        });
        await this.event(
          t,
          actor,
          id,
          row.id,
          exception ? "convocar_excecao" : "convocar",
          exception ? data.motivo!.trim() : undefined,
        );
        return plain(row);
      });
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
  private async withPerson<T>(
    bolsistaId: string,
    editalId: string,
    action: (t: WorkflowTransaction, e: Program) => Promise<T>,
  ) {
    const identity = await this.unit.read.identity(bolsistaId);
    if (!identity) throw ftError(404, "Bolsista nao encontrado");
    return this.unit.run(async (t) => {
      await t.lockPerson(identity.municipe_uuid);
      const e = plain(await this.edital(editalId, t));
      return action(t, e);
    });
  }
  private async allocation(
    repository: WorkflowReader,
    e: Program,
    data: Partial<Pick<Participation, "pagador_id" | "turno_id" | "local">>,
    excludeId?: string,
  ) {
    const pagador = data.pagador_id
      ? await repository.config(e.id, "pagadores", data.pagador_id)
      : null;
    const turno = data.turno_id
      ? await repository.config(e.id, "turnos", data.turno_id)
      : null;
    const local = typeof data.local === "string" ? data.local.trim() : "";
    if (!local || local.length > 255)
      throw ftError(422, "Informe um local de trabalho com ate 255 caracteres");
    if (!pagador || !turno)
      throw ftError(422, "Pagador e turno devem estar ativos neste edital");
    const filter = { editalId: e.id, status: occupied, excludeId };
    if ((await repository.countOccupations(filter)) >= e.vagas)
      throw ftError(409, "Edital sem vagas disponiveis");
    if (
      (await repository.countOccupations({
        ...filter,
        pagadorId: pagador.uuid,
      })) >= pagador.quantidade
    )
      throw ftError(409, "Pagador sem capacidade disponivel");
    return {
      pagador_id: pagador.uuid!,
      turno_id: turno.uuid!,
      local_id: null,
      local,
      turno_nome_snapshot: turno.nome,
      turno_hora_inicio_snapshot: turno.hora_inicio,
      turno_hora_fim_snapshot: turno.hora_fim,
    };
  }
  async participations(id: string, query: WorkflowQuery) {
    try {
      return await new EditalInsightsService(
        this.unit.read,
        this.crypto,
        this.clock,
      ).people(id, query, false);
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
  async transition(
    id: string,
    participationId: string,
    operation: "ativar" | "cancelar" | "concluir" | "prorrogar" | "alocar",
    data: WorkflowInput,
    actor: WorkflowActor,
  ) {
    try {
      const seed = await this.unit.read.participation(id, participationId);
      if (!seed) throw ftError(404, "Participacao nao encontrada");
      return await this.withPerson(seed.bolsista_id, id, async (t, e) => {
        this.opened(e);
        const row = await t.lockParticipation(participationId);
        if (operation === "ativar") {
          if (row.status !== "convocado")
            throw ftError(409, "Somente convocado pode ser ativado");
          const inicio = dateOnly(data.data_inicio);
          await this.assertOpenPeriod(
            t,
            id,
            inicio,
            participationEnd(e, inicio),
          );
          const exception = Boolean(
            row.excecao_em && row.excecao_autor_id && row.excecao_motivo,
          );
          const registration = await t.registration(id, row.inscricao_id!);
          if (!registration)
            throw ftError(
              409,
              "Inscricao indisponivel para validar a ativacao",
            );
          const snapshot = enrollmentSnapshot(
            await this.crypto.decrypt(registration.snapshot),
          );
          eligible(
            await this.crypto.decrypt(snapshot.nascimento || ""),
            enrollmentAnswers(
              await this.crypto.decrypt(registration.respostas!),
            ),
            inicio,
            e,
            exception,
          );
          const history = await t.identityHistory(row.bolsista_id, row.id);
          validateHistory(e, history.map(plain), inicio, exception);
          await this.allocation(t, e, plain(row), row.id);
          const p = data.payment_info;
          if (paymentIssues(p).length)
            throw ftError(422, "Dados de pagamento incompletos ou invalidos");
          await t.saveBankData(
            row.bolsista_id,
            p as import("../../domain/repositories/workflow.repository.js").BankData,
          );
          Object.assign(
            row,
            await t.updateParticipation(row.id, {
              status: "ativo",
              ativado_em: this.clock(),
              data_vinculo: inicio + "T12:00:00-03:00",
              expire_at: participationEnd(e, inicio) + "T23:59:59-03:00",
            }),
          );
        } else if (operation === "prorrogar") {
          const end = extensionEnd(e, row!, this.clock());
          await this.assertOpenPeriod(
            t,
            id,
            nextCivilDay(dateOnly(row.expire_at)),
            end,
          );
          Object.assign(
            row,
            await t.updateParticipation(row.id, {
              expire_at: end + "T23:59:59-03:00",
              prorrogated: true,
            }),
          );
        } else if (operation === "alocar") {
          if (!occupied.includes(row.status))
            throw ftError(409, "Participacao encerrada");
          // Once active, changing allocation would rewrite past reports; reserve edits are safe.
          if (row.status !== "convocado")
            throw ftError(409, "Alocacao bloqueada apos ativacao");
          Object.assign(
            row,
            await t.updateParticipation(
              row.id,
              await this.allocation(t, e, data, row.id),
            ),
          );
        } else {
          if (
            !data.motivo?.trim() ||
            !occupied.includes(row.status) ||
            (operation === "concluir" && row.status !== "ativo")
          )
            throw ftError(409, "Transicao invalida ou motivo ausente");
          if (row.ativado_em) await this.assertEndChange(id, row, t);
          Object.assign(
            row,
            await t.updateParticipation(row.id, {
              status: operation === "concluir" ? "concluido" : "cancelado",
              [operation === "concluir" ? "concluded_at" : "canceled_at"]:
                this.clock(),
              observacao: data.motivo,
            }),
          );
        }
        await this.event(t, actor, id, row.id, operation, data.motivo);
        return plain(row);
      });
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
  private async assertEndChange(
    id: string,
    row: Participation,
    repository: WorkflowReader,
  ) {
    const today = businessDate(this.clock()),
      end = getVinculoOperationalEnd(row);
    const start = [nextCivilDay(today), dateOnly(row.data_vinculo)]
      .sort()
      .pop()!;
    await this.assertOpenPeriod(repository, id, start, end);
  }
  async prevalidate(
    id: string,
    operation: "inscricao" | "convocacao" | "ativacao" | "prorrogacao",
    data: WorkflowInput,
    mode: "normal" | "encaixe" | "excecao" = "normal",
  ) {
    try {
      const e = plain(await this.edital(id));
      const pendencias: Array<{
        codigo: string;
        mensagem: string;
        campo: string | null;
      }> = [];
      const check = async (
        codigo: string,
        campo: string | null,
        validate: () => unknown,
      ) => {
        try {
          await validate();
        } catch (error) {
          const failure = mapPeaadRuleError(error);
          if (!(failure instanceof AppError)) throw failure;
          pendencias.push({ codigo, campo, mensagem: failure.message });
        }
      };
      const required = (field: keyof WorkflowInput) => {
        if (!data[field]) {
          pendencias.push({
            codigo: "OBRIGATORIO",
            campo: field,
            mensagem: "Preencha " + field + ".",
          });
          return false;
        }
        return true;
      };
      const output: {
        permitido: boolean;
        pendencias: typeof pendencias;
        data_referencia: string;
        novo_termino?: string;
        termino_previsto?: string;
      } = {
        permitido: false,
        pendencias,
        data_referencia: businessDate(this.clock()),
      };
      let registration: Registration | null = null,
        person: Person | null = null,
        row: Participation | null = null,
        bolsista: ParticipantIdentity | null = null;
      if (operation === "inscricao") {
        await check("JANELA", null, () =>
          registrationWindow(e, this.clock(), mode !== "normal", data.motivo),
        );
        if (mode === "excecao")
          await check("JUSTIFICATIVA", "motivo", () =>
            requireExceptionReason(data.motivo),
          );
        if (required("municipe_uuid")) {
          person = await this.unit.read.person(data.municipe_uuid!);
          if (!person) throw ftError(404, "Municipe nao encontrado");
          bolsista = await this.unit.read.identityForPerson(
            data.municipe_uuid!,
          );
          if (
            bolsista &&
            (await this.unit.read.registrationForIdentity(id, bolsista.id))
          )
            pendencias.push({
              codigo: "INSCRICAO_DUPLICADA",
              campo: "municipe_uuid",
              mensagem: "Pessoa ja inscrita neste edital",
            });
          await check("RESIDENCIA", null, async () => {
            if (
              (await this.crypto.decrypt(person!.cidade || ""))
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .trim()
                .toLowerCase() !== "itapecerica da serra"
            )
              throw ftError(
                422,
                "Municipe deve residir em Itapecerica da Serra",
              );
          });
        }
      } else {
        await check("VIGENCIA", null, () => this.opened(e));
        if (operation === "convocacao") {
          if (required("inscricao_id"))
            registration = await this.unit.read.registration(
              id,
              data.inscricao_id!,
            );
          if (data.inscricao_id && !registration)
            throw ftError(404, "Inscricao nao encontrada neste edital");
          if (registration && registration.status !== "inscrito")
            pendencias.push({
              codigo: "STATUS",
              campo: null,
              mensagem: "Inscricao cancelada",
            });
          if (mode === "excecao")
            await check("JUSTIFICATIVA", "motivo", () =>
              requireExceptionReason(data.motivo),
            );
        } else {
          if (required("participacao_id"))
            row = await this.unit.read.participation(id, data.participacao_id!);
          if (data.participacao_id && !row)
            throw ftError(404, "Participacao nao encontrada neste edital");
          if (row && operation === "prorrogacao")
            await check("PRORROGACAO", null, async () => {
              output.novo_termino = extensionEnd(e, row!, this.clock());
              await this.assertOpenPeriod(
                this.unit.read,
                id,
                nextCivilDay(dateOnly(row!.expire_at)),
                output.novo_termino!,
              );
            });
          if (row && operation === "ativacao") {
            if (row.status !== "convocado")
              pendencias.push({
                codigo: "STATUS",
                campo: null,
                mensagem: "Somente convocado pode ser ativado",
              });
            registration = row.inscricao_id
              ? await this.unit.read.registration(id, row.inscricao_id)
              : null;
            if (!registration)
              pendencias.push({
                codigo: "INSCRICAO",
                campo: null,
                mensagem: "Inscricao indisponivel para validar a ativacao",
              });
            pendencias.push(
              ...paymentIssues(data.payment_info).map((issue) => ({
                ...issue,
                campo: issue.campo,
              })),
            );
          }
        }
        if (registration)
          bolsista = await this.unit.read.identity(registration.bolsista_id);
      }
      if (operation !== "prorrogacao") {
        const exception =
          operation === "ativacao"
            ? Boolean(
                row?.excecao_em && row.excecao_autor_id && row.excecao_motivo,
              )
            : mode === "excecao";
        const snapshot = registration
          ? enrollmentSnapshot(await this.crypto.decrypt(registration.snapshot))
          : null;
        const birth = person?.nascimento || snapshot?.nascimento;
        const answers =
          operation === "inscricao"
            ? data.respostas
            : registration
              ? enrollmentAnswers(
                  await this.crypto.decrypt(registration.respostas!),
                )
              : null;
        const reference =
          operation === "inscricao"
            ? businessDate(this.clock())
            : data.data_inicio;
        if (operation !== "inscricao") {
          required("data_inicio");
          if (data.data_inicio)
            await check("FOLHA_FECHADA", "data_inicio", () =>
              this.assertOpenPeriod(
                this.unit.read,
                id,
                dateOnly(data.data_inicio),
                participationEnd(e, dateOnly(data.data_inicio)),
              ),
            );
        }
        if (person || registration)
          await check("REQUISITOS", null, async () => {
            if (!birth) throw ftError(422, "Cadastre o nascimento do municipe");
            if (!answers?.inicio_residencia || !reference)
              throw ftError(
                422,
                "Preencha as declaracoes e a data de referencia",
              );
            eligible(
              await this.crypto.decrypt(birth),
              answers,
              reference,
              e,
              exception,
            );
          });
        if (bolsista && reference) {
          const history = await this.unit.read.identityHistory(
            bolsista.id,
            row?.id,
          );
          await check("HISTORICO", null, () =>
            validateHistory(e, history.map(plain), reference, exception),
          );
        }
        if (operation !== "inscricao") {
          const allocation = row ? { ...plain(row), ...data } : data;
          for (const field of ["pagador_id", "turno_id", "local"] as const)
            if (!allocation[field])
              pendencias.push({
                codigo: "OBRIGATORIO",
                campo: field,
                mensagem: "Preencha " + field + ".",
              });
          if (allocation.pagador_id && allocation.turno_id && allocation.local)
            await check("ALOCACAO", null, () =>
              this.allocation(this.unit.read, e, allocation, row?.id),
            );
          // Show the edital capacity before all allocation fields have been filled.
          if (
            !allocation.pagador_id ||
            !allocation.turno_id ||
            !allocation.local
          ) {
            const filter = {
              editalId: id,
              status: occupied,
              excludeId: row?.id,
            };
            if ((await this.unit.read.countOccupations(filter)) >= e.vagas)
              pendencias.push({
                codigo: "VAGAS",
                campo: null,
                mensagem: "Edital sem vagas disponiveis",
              });
            if (allocation.pagador_id) {
              const payer = await this.unit.read.config(
                id,
                "pagadores",
                allocation.pagador_id,
              );
              if (
                !payer ||
                (await this.unit.read.countOccupations({
                  ...filter,
                  pagadorId: allocation.pagador_id,
                })) >= payer.quantidade
              )
                pendencias.push({
                  codigo: "CAPACIDADE",
                  campo: "pagador_id",
                  mensagem: "Pagador sem capacidade disponivel",
                });
            }
          }
          if (reference)
            await check("INICIO", "data_inicio", () => {
              output.termino_previsto = participationEnd(e, reference);
            });
        }
      }
      output.permitido = pendencias.length === 0;
      return await output;
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
  async records(
    id: string,
    pid: string,
    kind: "faltas" | "ocorrencias",
    query: WorkflowQuery,
  ) {
    try {
      const row = await this.unit.read.participation(id, pid);
      if (!row) throw ftError(404, "Participacao nao encontrada");
      return await this.unit.read.records(id, pid, kind, query);
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
  async pdfParticipant(id: string, pid: string, mes: string) {
    try {
      const row = await this.unit.read.participation(id, pid);
      if (!row || !row.ativado_em)
        throw ftError(409, "PDF exige participacao ativada neste edital");
      const end = dateOnly(
        row.canceled_at || row.concluded_at || row.expired_at || row.expire_at,
      );
      if (dateOnly(row.data_vinculo).slice(0, 7) > mes || end.slice(0, 7) < mes)
        throw ftError(409, "Participacao fora do mes solicitado");
      return await String(row.bolsista_id);
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
  async record(
    id: string,
    pid: string,
    kind: "faltas" | "ocorrencias",
    data: DatedInput,
    actor: WorkflowActor,
    deleteId?: string,
  ) {
    try {
      const seed = await this.unit.read.participation(id, pid);
      if (!seed) throw ftError(404, "Participacao nao encontrada");
      return await this.withPerson(seed.bolsista_id, id, async (t, e) => {
        const row = await t.lockParticipation(pid);
        if (deleteId) {
          const item = await t.datedRecord(pid, kind, deleteId);
          if (!item) throw ftError(404, "Registro nao encontrado");
          const date = dateOnly(
            item[kind === "faltas" ? "data_falta" : "data_ocorrencia"],
          );
          await this.assertOpenPeriod(t, id, date, date);
          await t.deleteDatedRecord(kind, deleteId);
        } else {
          this.opened(e);
          if (!row.ativado_em || (kind === "faltas" && row.status !== "ativo"))
            throw ftError(
              409,
              "Registro exige participacao ativada; faltas exigem vinculo ativo",
            );
          const date = dateOnly(
            data[kind === "faltas" ? "data_falta" : "data_ocorrencia"],
          );
          await this.assertOpenPeriod(t, id, date, date);
          const end = dateOnly(
            row.canceled_at ||
              row.concluded_at ||
              row.expired_at ||
              row.expire_at,
          );
          if (
            date < dateOnly(row.data_vinculo) ||
            date > end ||
            date > businessDate(this.clock())
          )
            throw ftError(422, "Data fora da participacao ou no futuro");
          if (kind === "faltas" && (await t.hasAbsence(pid, date)))
            throw ftError(409, "Falta ja registrada nesta data");
          await t.createDatedRecord(kind, {
            ...data,
            bolsista_edital_id: pid,
            bolsista_id: row.bolsista_id,
            edital_id: id,
            author_id: Number(actor.id),
          });
        }
        await this.event(
          t,
          actor,
          id,
          pid,
          (deleteId ? "excluir_" : "registrar_") + kind,
        );
        return { ok: true };
      });
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
}
