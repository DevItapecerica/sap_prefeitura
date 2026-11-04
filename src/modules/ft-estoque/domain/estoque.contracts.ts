import type {
  Actor,
  Instant,
  Page,
  UnitOfWork,
} from "../../../core/contracts/unit-of-work.js";
import type { AuditEventBase } from "../../audit/domain/entity/AuditEvent.js";

export interface StockItem {
  id: string;
  nome: string;
  epi: boolean;
  ativo: boolean;
  createdAt?: Instant;
  updatedAt?: Instant;
}
export interface StockVariation {
  id: string;
  item_id: string;
  tamanho: string;
  tamanho_chave: string;
  custo_centavos: number;
  custo_unitario: number;
  saldo: number;
  ativo: boolean;
}
export interface Delivery {
  id: string;
  participacao_id: string;
  edital_id: string;
  bolsista_id: string;
  kit_ativo_participacao_id: string | null;
  tipo: "kit" | "individual";
  autor_id: string;
  entregue_em: Instant;
  justificativa: string | null;
  total_centavos: number;
  estornado_em?: Instant | null;
  estornado_por?: string | null;
  motivo_estorno?: string | null;
}
export interface DeliveryItem {
  id: string;
  entrega_id: string;
  variacao_id: string;
  nome: string;
  tamanho: string;
  quantidade: number;
  custo_centavos: number;
}
export interface Movement {
  id: string;
  variacao_id: string;
  entrega_id: string | null;
  tipo: string;
  delta: number;
  saldo_apos: number;
  autor_id: string;
  data: Instant;
  motivo: string | null;
}
export interface StockParticipant {
  id: string;
  edital_id: string;
  bolsista_id: string;
  status: string;
  expire_at?: Instant | null;
}
export interface StockEdital {
  id: string;
  name: string;
  fase: string;
  vigencia_inicio?: string | null;
  data_publicacao: Instant;
  data_vencimento: Instant;
}
export interface ParticipantContext {
  participation: StockParticipant;
  edital: StockEdital;
}
export interface Recipient {
  id: string;
  status: string;
  nome: string;
  edital_id: string;
  edital_nome: string;
}
export interface StockQuery {
  page?: number;
  limit?: number;
  search?: string;
  tamanho?: string;
  epi?: boolean | "true" | "false";
  situacao?: "ativos" | "inativos" | "todos" | "vigentes" | "estornadas";
  item_id?: string;
  variacao_id?: string;
  participacao_id?: string;
  tipo?: "kit" | "individual";
}
export interface Operation {
  operacao_id: string;
}
export interface ItemInput extends Operation {
  nome: string;
  epi: boolean;
  ativo?: boolean;
}
export interface VariationInput extends Operation {
  tamanho: string;
  custo_unitario: number;
  ativo?: boolean;
}
export interface CompleteInput extends ItemInput {
  tamanhos: Array<
    Omit<VariationInput, "operacao_id"> & { quantidade_inicial?: number }
  >;
}
export interface StockInput extends Operation {
  quantidade: number;
  justificativa?: string;
}
export interface DeliveryInput extends Operation {
  participacao_id: string;
  versao: string;
  itens: Array<{ variacao_id: string; quantidade: number }>;
  justificativa?: string;
}
export interface ReversalInput extends Operation {
  justificativa: string;
}
export interface CatalogItem extends Pick<StockItem, "id" | "nome" | "epi"> {
  variacoes: StockVariation[];
}
export interface Catalog {
  version: number;
  rows: CatalogItem[];
}
export interface DeliverySummary extends Delivery {
  nome: string;
  edital_nome: string;
  responsavel: string;
  responsavel_estorno: string | null;
}
export interface DeliveryDetail extends DeliverySummary {
  itens: DeliveryItem[];
}
export interface AuditCommand extends AuditEventBase {
  metadata?: unknown;
  before?: unknown;
  after?: unknown;
  eventId?: string;
  occurredAt?: string;
}

export interface StockReader {
  item(id: string): Promise<StockItem | null>;
  variation(id: string): Promise<StockVariation | null>;
  deliveryRecord(id: string): Promise<Delivery | null>;
  participant(id: string): Promise<ParticipantContext | null>;
  participantName(
    id: string,
  ): Promise<{ id: string; nome: string; edital_nome: string }>;
  activeKit(participationId: string): Promise<Delivery | null>;
  catalog(): Promise<Catalog | null>;
  items(
    query: StockQuery,
  ): Promise<
    Page<StockItem & { tamanhos_ativos: number; saldo_total: number }>
  >;
  variations(
    query: StockQuery,
  ): Promise<Page<StockVariation> & { item: StockItem | null }>;
  movements(
    query: StockQuery,
  ): Promise<
    Page<Movement & { tamanho?: string; nome?: string; responsavel: string }>
  >;
  recipients(query: StockQuery, reference: string): Promise<Page<Recipient>>;
  deliveries(query: StockQuery): Promise<Page<DeliverySummary>>;
  delivery(id: string): Promise<DeliveryDetail>;
  deliveredItems(id: string): Promise<DeliveryItem[]>;
}
export interface StockTransaction extends StockReader {
  lockParticipant(id: string): Promise<ParticipantContext | null>;
  lockCatalog(): Promise<boolean>;
  previousOperation(
    id: string,
  ): Promise<{ assinatura: string; resultado: string } | null>;
  rememberOperation(
    id: string,
    signature: string,
    result: string,
  ): Promise<void>;
  advanceCatalog(): Promise<void>;
  createItem(input: Omit<StockItem, "id">): Promise<StockItem>;
  updateItem(id: string, input: Partial<StockItem>): Promise<StockItem>;
  duplicateSize(
    itemId: string,
    size: string,
    exceptId?: string,
  ): Promise<boolean>;
  createVariation(
    input: Omit<StockVariation, "id" | "custo_unitario">,
  ): Promise<StockVariation>;
  updateVariation(
    id: string,
    input: Partial<StockVariation>,
  ): Promise<StockVariation>;
  createMovement(input: Omit<Movement, "id">): Promise<Movement>;
  createDelivery(input: Omit<Delivery, "id">): Promise<Delivery>;
  updateDelivery(id: string, input: Partial<Delivery>): Promise<Delivery>;
  createDeliveredItem(input: Omit<DeliveryItem, "id">): Promise<DeliveryItem>;
  recordAudit(command: AuditCommand): Promise<void>;
}
export type EstoqueUnitOfWork = UnitOfWork<StockReader, StockTransaction>;
export type { Actor, Page };
