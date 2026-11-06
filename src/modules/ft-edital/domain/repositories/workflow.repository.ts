import type {
  Actor,
  Instant,
  Page,
  UnitOfWork,
} from "../../../../core/contracts/unit-of-work.js";
import type { IAesCrypt } from "../../../../core/security/aes/AesCrypt.interface.js";
import type { Answers } from "../services/edital-workflow.policy.js";
import type { AuditCommand } from "../../../audit/domain/entity/audit-command.js";

export type ConfigKind = "pagadores" | "turnos" | "locais" | "beneficios";
export type RecordKind = "faltas" | "ocorrencias";
export interface EditalInput {
  name: string;
  idade_maxima: number;
  data_publicacao: Instant;
  vigencia_inicio: string;
  data_vencimento: Instant;
  inscricoes_inicio: string;
  inscricoes_fim: string;
  vagas: number;
  dia_pagamento: number;
  valor_bolsa: number | string;
  carga_semanal: number;
  carga_mensal: number;
  duracao_meses: number;
  prorrogacao_meses: number;
  permitir_participacao_anterior: boolean;
  permitir_retorno: boolean;
}
export interface Program extends Omit<EditalInput, "idade_maxima"> {
  id: string;
  fase: string;
  status: string;
  idade_maxima: number | null;
  primeira_convocacao_em?: Instant | null;
}
export interface Allocation {
  pagador_id: string;
  turno_id: string;
  local: string;
  data_inicio: string;
}
export interface BankData {
  bco: string;
  ag: string;
  dig_ag: string;
  conta: string;
  dig_conta: string;
}
export interface ExceptionData {
  excecao_motivo?: string | null;
  excecao_autor_id?: string | null;
  excecao_em?: Instant | null;
}
export interface Participation extends ExceptionData {
  id: string;
  edital_id: string;
  bolsista_id: string;
  inscricao_id?: string | null;
  status: string;
  data_vinculo: Instant;
  expire_at: Instant;
  pagador_id: string;
  turno_id: string;
  local: string;
  local_id?: string | null;
  turno_nome_snapshot?: string;
  turno_hora_inicio_snapshot?: string;
  turno_hora_fim_snapshot?: string;
  ativado_em?: Instant | null;
  canceled_at?: Instant | null;
  concluded_at?: Instant | null;
  expired_at?: Instant | null;
  prorrogated?: boolean;
  observacao?: string | null;
  createdAt?: Instant;
  updatedAt?: Instant;
}
export interface Registration extends ExceptionData {
  id: string;
  edital_id: string;
  bolsista_id: string;
  status: string;
  respostas: string;
  snapshot: string;
  criado_por?: number;
  encaixe_motivo?: string | null;
  createdAt?: Instant;
}
export interface Person {
  uuid: string;
  nome?: string;
  nascimento?: string | null;
  cidade?: string | null;
  [field: string]: unknown;
}
export interface ParticipantIdentity {
  id: string;
  municipe_uuid: string;
}
export interface Config {
  id?: string;
  uuid?: string;
  edital_id: string;
  nome: string;
  quantidade: number;
  hora_inicio: string;
  hora_fim: string;
  descricao?: string | null;
  ocupacao?: number;
}
export interface ConfigInput {
  nome: string;
  quantidade?: number;
  hora_inicio?: string;
  hora_fim?: string;
  descricao?: string | null;
}
export interface DatedRecord {
  id: string;
  bolsista_edital_id: string;
  bolsista_id: string;
  edital_id: string;
  author_id: number;
  data_falta?: string;
  data_ocorrencia?: string;
  observacao?: string;
  descricao?: string;
}
export interface DatedInput {
  data_falta?: string;
  data_ocorrencia?: string;
  observacao?: string;
  descricao?: string;
}
export interface WorkflowQuery {
  page?: number;
  limit?: number;
  search?: string;
  fase?: string;
  inscricoes_abertas?: boolean | "true" | "false";
  status?: string;
  grupo_status?: "encerrados";
  pagador_id?: string;
  turno_id?: string;
  excecao?: string;
}
export type WorkflowInput = Partial<Allocation> & {
  motivo?: string;
  municipe_uuid?: string;
  inscricao_id?: string;
  participacao_id?: string;
  respostas?: Answers;
  payment_info?: Partial<BankData>;
};
export interface OccupationFilter {
  editalId: string;
  status?: string | string[];
  pagadorId?: string;
  turnoId?: string;
  localId?: string;
  excludeId?: string;
}
export interface WorkflowEvent {
  id: string;
  edital_id: string;
  recurso_id: string;
  acao: string;
  ator_id: string;
  request_id?: string;
  motivo?: string | null;
  createdAt?: Instant;
}
export interface PeopleSource
  extends Partial<Participation>, Partial<Registration> {
  id: string;
  bolsista_id: string;
  status: string;
  bolsista?: { municipe?: { nome: string }; payment_info?: BankData };
  inscricao?: Registration | null;
  participacoes?: Participation[];
  pagador?: { nome: string };
}
export interface HistorySource {
  registration: Registration | null;
  participations: Participation[];
  events: WorkflowEvent[];
  actors: Array<{ id: string | number; name: string }>;
}

export interface WorkflowReader {
  edital(id: string): Promise<Program | null>;
  listEditais(query: WorkflowQuery, now: Date): Promise<Page<Program>>;
  countOccupations(filter: OccupationFilter): Promise<number>;
  hasClosedPayroll(editalId: string): Promise<boolean>;
  firstClosedMonth(
    editalId: string,
    start: string,
    end: string,
  ): Promise<string | null>;
  configs(
    editalId: string,
    kind: ConfigKind,
    query: WorkflowQuery,
  ): Promise<Page<Config>>;
  config(
    editalId: string,
    kind: ConfigKind,
    id: string,
  ): Promise<Config | null>;
  person(id: string): Promise<Person | null>;
  identity(id: string): Promise<ParticipantIdentity | null>;
  identityForPerson(personId: string): Promise<ParticipantIdentity | null>;
  registration(editalId: string, id: string): Promise<Registration | null>;
  registrationForIdentity(
    editalId: string,
    identityId: string,
  ): Promise<Registration | null>;
  participation(editalId: string, id: string): Promise<Participation | null>;
  identityHistory(id: string, excludeId?: string): Promise<Participation[]>;
  occupations(editalId: string): Promise<Participation[]>;
  records(
    editalId: string,
    participationId: string,
    kind: RecordKind,
    query: WorkflowQuery,
  ): Promise<Page<DatedRecord>>;
  datedRecord(
    participationId: string,
    kind: RecordKind,
    id: string,
  ): Promise<DatedRecord | null>;
  hasAbsence(participationId: string, date: string): Promise<boolean>;
  people(
    editalId: string,
    query: WorkflowQuery,
    inscriptions: boolean,
  ): Promise<Page<PeopleSource>>;
  historySource(
    editalId: string,
    resource: string,
    inscriptions: boolean,
  ): Promise<HistorySource | null>;
}
export interface WorkflowTransaction extends WorkflowReader {
  recordAudit(input: AuditCommand): Promise<void>;
  lockPerson(id: string): Promise<Person | null>;
  lockRegistration(id: string): Promise<Registration>;
  lockParticipation(id: string): Promise<Participation>;
  createEdital(input: Omit<Program, "id">): Promise<Program>;
  updateEdital(id: string, input: Partial<Program>): Promise<Program>;
  updateParticipation(
    id: string,
    input: Partial<Participation>,
  ): Promise<Participation>;
  closeOccupations(editalId: string, now: Date): Promise<void>;
  saveConfig(
    editalId: string,
    kind: ConfigKind,
    id: string | undefined,
    input: ConfigInput | null,
  ): Promise<Config>;
  ensureIdentity(personId: string): Promise<ParticipantIdentity>;
  createRegistration(
    input: Omit<Registration, "id" | "status">,
  ): Promise<Registration>;
  createParticipation(input: Omit<Participation, "id">): Promise<Participation>;
  saveBankData(identityId: string, input: BankData): Promise<void>;
  addEvent(input: Omit<WorkflowEvent, "id" | "createdAt">): Promise<void>;
  createDatedRecord(
    kind: RecordKind,
    input: Omit<DatedRecord, "id">,
  ): Promise<void>;
  deleteDatedRecord(kind: RecordKind, id: string): Promise<void>;
}
export type WorkflowUnitOfWork = UnitOfWork<
  WorkflowReader,
  WorkflowTransaction
>;
export type { Actor, IAesCrypt, Page };
