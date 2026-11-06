import type {
  Actor,
  Instant,
  UnitOfWork,
} from "../../../../core/contracts/unit-of-work.js";
import type { AuditCommand } from "../../../audit/domain/entity/audit-command.js";
import type { FtRelatorioBolsistaRow } from "../services/ft-relatorio-pagamento.service.js";

export interface PayrollPeriod {
  data_inicio: string;
  data_fim: string;
}
export interface PayrollQuery extends Partial<PayrollPeriod> {
  page?: number;
  limit?: number;
  versao?: string;
}
export interface PayrollProgram {
  data_publicacao: Instant;
  data_vencimento: Instant;
  vigencia_inicio?: string | null;
}
export interface PayrollSnapshot {
  rows: Array<
    FtRelatorioBolsistaRow & {
      pagador: string;
      data_pagamento: string;
      alertas: Array<{ codigo: string; campo: string; mensagem: string }>;
    }
  >;
  count: number;
  resumo: {
    participantes: number;
    pagamentos: number;
    valor_liquido: number;
    com_alertas: number;
  };
  versao: string;
  periodo: PayrollPeriod;
  data_pagamento: string;
  fileName: string;
  csv: string;
  type: string;
  returnedCount: number;
}
export interface PayrollClosure {
  id: string;
  edital_id: string;
  mes: string;
  versao: string;
  fechado_por: string;
  fechado_em: Instant;
  snapshot: PayrollSnapshot;
}
export interface PayrollReader {
  program(id: string): Promise<PayrollProgram | null>;
  closure(editalId: string, month: string): Promise<PayrollClosure | null>;
  actorName(id: string): Promise<string | null>;
  calculate(id: string, period: PayrollPeriod): Promise<PayrollSnapshot>;
}
export interface PayrollTransaction extends PayrollReader {
  createClosure(input: Omit<PayrollClosure, "id">): Promise<PayrollClosure>;
  recordAudit(input: AuditCommand): Promise<void>;
}
export type PayrollUnitOfWork = UnitOfWork<PayrollReader, PayrollTransaction>;
export type { Actor };
