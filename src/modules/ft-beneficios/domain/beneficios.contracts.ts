import type {
  Actor,
  Page,
  UnitOfWork,
} from "../../../core/contracts/unit-of-work.js";
import type { AuditCommand } from "../../audit/domain/entity/audit-command.js";
import type {
  Program,
  Participation,
} from "../../ft-edital/domain/repositories/workflow.repository.js";
export interface Benefit {
  id: string;
  nome: string;
  descricao: string | null;
}
export interface BenefitPerson {
  id: string;
  nome: string;
  cpf: string;
}
export interface BenefitDelivery {
  id: string;
  edital_id: string;
  participacao_id: string;
  pessoa_id: string;
  mes: string;
  entregue_em: string;
  autor_id: string;
  responsavel: string;
  estornado_em: string | null;
  estornado_por: string | null;
  responsavel_estorno: string | null;
  motivo_estorno: string | null;
  itens: Benefit[];
}
export type BenefitParticipation = Participation & { pessoa_id: string };
/** CPF is encrypted until the application mapper produces the public DTO. */
export interface BenefitParticipationContext {
  participacao: BenefitParticipation;
  pessoa: BenefitPerson;
}
export interface BenefitReportSource {
  edital: Program;
  beneficios: Benefit[];
  pessoas: BenefitPerson[];
  participacoes: BenefitParticipation[];
  entregas: BenefitDelivery[];
}
export interface BenefitQuery {
  mes?: string;
  page?: number;
  limit?: number;
  search?: string;
  beneficio_id?: string;
  participacao_id?: string;
  situacao?: "todos" | "retirados" | "pendentes" | "estornadas";
}
export interface BenefitReader {
  edital(id: string): Promise<Program | null>;
  participation(
    editalId: string,
    participationId: string,
  ): Promise<BenefitParticipationContext | null>;
  benefits(editalId: string): Promise<Benefit[]>;
  currentDeliveries(
    editalId: string,
    personId: string,
    month: string,
  ): Promise<BenefitDelivery[]>;
  history(
    editalId: string,
    query: BenefitQuery,
  ): Promise<Page<BenefitDelivery & { nome: string }>>;
  reportSource(
    edital: Program,
    month: string,
    today: string,
  ): Promise<BenefitReportSource>;
}
export interface BenefitTransaction extends BenefitReader {
  lockEdital(id: string): Promise<Program | null>;
  lockParticipation(
    editalId: string,
    participationId: string,
  ): Promise<BenefitParticipationContext | null>;
  delivery(
    editalId: string,
    deliveryId: string,
  ): Promise<BenefitDelivery | null>;
  newId(): string;
  actorName(id: string | number): Promise<string>;
  operation(
    id: string,
  ): Promise<{ assinatura: string; resultado: string } | null>;
  remember(
    id: string,
    editalId: string,
    signature: string,
    encryptedResult: string,
  ): Promise<void>;
  create(delivery: BenefitDelivery): Promise<void>;
  reverse(delivery: BenefitDelivery): Promise<void>;
  audit(command: AuditCommand): Promise<void>;
}
export type BenefitUnitOfWork = UnitOfWork<BenefitReader, BenefitTransaction>;
export type BenefitActor = Actor;
export class BenefitRuleError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
