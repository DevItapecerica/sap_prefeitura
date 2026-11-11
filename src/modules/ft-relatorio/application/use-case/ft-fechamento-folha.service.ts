import { mapPeaadRuleError } from "../../../ft-bolsista/application/utils/map-peaad-rule-error.js";
import type {
  PayrollUnitOfWork,
  PayrollReader,
  PayrollProgram,
  PayrollClosure,
} from "../../domain/repositories/payroll-unit-of-work.js";
import { ftError } from "../../../ft-bolsista/application/utils/ft-error.js";
import {
  businessDate,
  dateOnly,
} from "../../../ft-edital/domain/services/edital-workflow.policy.js";
import type { FtRelatorioQueryDto } from "../dto/ft-relatorio.dto.js";

export function monthPeriod(mes: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes))
    throw ftError(422, "Informe o mês no formato AAAA-MM.");
  return {
    data_inicio: mes + "-01",
    data_fim: new Date(
      Date.UTC(Number(mes.slice(0, 4)), Number(mes.slice(5)), 0, 12),
    )
      .toISOString()
      .slice(0, 10),
  };
}

export function queryMonth(query: FtRelatorioQueryDto) {
  const mes = query.data_inicio?.slice(0, 7) || "";
  const period = monthPeriod(mes);
  if (
    query.data_inicio !== period.data_inicio ||
    query.data_fim !== period.data_fim
  )
    throw ftError(
      422,
      "Selecione um mês completo. Recortes e intervalos entre meses não são permitidos.",
    );
  return mes;
}

export class FtFechamentoFolhaService {
  constructor(
    private unit: PayrollUnitOfWork,
    private clock = () => new Date(),
  ) {}
  private async edital(id: string, repository: PayrollReader = this.unit.read) {
    const row = await repository.program(id);
    if (!row) throw ftError(404, "Edital não encontrado.");
    return row;
  }
  private stored(
    id: string,
    month: string,
    repository: PayrollReader = this.unit.read,
  ) {
    return repository.closure(id, month);
  }
  private async metadata(
    row: PayrollClosure | null,
    repository: PayrollReader = this.unit.read,
  ) {
    if (!row) return { situacao: "aberta" };
    const name = await repository.actorName(row.fechado_por);
    return {
      situacao: "fechada",
      id: row.id,
      mes: row.mes,
      fechado_em: new Date(row.fechado_em).toISOString(),
      fechado_por: String(row.fechado_por),
      responsavel: name || "Usuário " + row.fechado_por,
    };
  }
  async state(id: string, mes: string) {
    try {
      monthPeriod(mes);
      await this.edital(id);
      return await this.metadata(await this.stored(id, mes));
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
  private period(mes: string, edital: PayrollProgram) {
    const month = monthPeriod(mes);
    const data_inicio = [
      month.data_inicio,
      dateOnly(edital.data_publicacao),
      dateOnly(edital.vigencia_inicio || edital.data_publicacao),
    ]
      .sort((left, right) => left.localeCompare(right))
      .pop()!;
    const data_fim = [month.data_fim, dateOnly(edital.data_vencimento)].sort(
      (left, right) => left.localeCompare(right),
    )[0];
    if (data_inicio > data_fim)
      throw ftError(422, "Mês fora da vigência do edital.");
    return { data_inicio, data_fim };
  }
  async preview(id: string, query: FtRelatorioQueryDto) {
    try {
      const mes = queryMonth(query),
        edital = await this.edital(id);
      const stored = await this.stored(id, mes);
      const result = stored
        ? stored.snapshot
        : await this.unit.read.calculate(id, this.period(mes, edital));
      const limit = Math.min(50, Math.max(1, Number(query.limit) || 20)),
        offset = Math.max(0, Number(query.page) || 0) * limit;
      return {
        rows: result.rows.slice(offset, offset + limit),
        count: result.count,
        resumo: result.resumo,
        versao: result.versao,
        periodo: result.periodo,
        data_pagamento: result.data_pagamento,
        fechamento: await this.metadata(stored),
        pode_fechar: !stored && mes <= businessDate(this.clock()).slice(0, 7),
      };
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
  async close(
    id: string,
    mes: string,
    versao: string,
    actor: { id: string | number; requestId: string },
  ) {
    try {
      monthPeriod(mes);
      if (mes > businessDate(this.clock()).slice(0, 7))
        throw ftError(422, "Não é permitido fechar meses futuros.");
      if (!/^[a-f0-9]{64}$/.test(versao || ""))
        throw ftError(422, "Confira a prévia antes de fechar a folha.");
      return await this.unit.run(async (transaction) => {
        const edital = await this.edital(id, transaction);
        const existing = await this.stored(id, mes, transaction);
        // A repeated confirmation returns the same close; a different preview is a conflict.
        if (existing) {
          if (existing.versao !== versao)
            throw ftError(
              409,
              "A folha deste mês já foi fechada. Consulte a folha preservada.",
            );
          return this.metadata(existing, transaction);
        }
        const result = await transaction.calculate(
          id,
          this.period(mes, edital),
        );
        if (result.versao !== versao)
          throw ftError(
            409,
            "Pagamento alterado. Confira novamente a prévia antes de fechar.",
          );
        const row = await transaction.createClosure({
          edital_id: id,
          mes,
          versao,
          fechado_por: String(actor.id),
          fechado_em: this.clock(),
          snapshot: result,
        });
        await transaction.recordAudit({
          actor: { userId: actor.id },
          action: "CREATE",
          module: "ft-relatorio",
          resourceType: "fechamento_folha",
          resourceId: row.id,
          result: "SUCCESS",
          requestId: actor.requestId,
          metadata: { editalId: id, mes },
        });
        return this.metadata(row, transaction);
      });
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
  async download(id: string, query: FtRelatorioQueryDto) {
    try {
      const mes = queryMonth(query);
      await this.edital(id);
      const row = await this.stored(id, mes);
      if (!row)
        throw ftError(
          409,
          "Feche a folha deste mês antes de emitir o CSV de pagamento.",
        );
      const result = row.snapshot;
      return {
        fileName: "pagamento-" + mes + ".csv",
        csv: result.csv,
        type: result.type,
        returnedCount: result.returnedCount,
      };
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
}
