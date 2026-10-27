import { createHash } from 'node:crypto';
import { isValidCpf } from '../../../../core/validators/cpf.validator.js';
import { paymentIssues } from '../../../ft-edital/domain/services/edital-insights.policy.js';
import { ftError } from "../../../ft-bolsista/application/utils/ft-error.js";
import { FtRelatorioCsvFormatter } from "../formatter/ft-relatorio-csv.formatter.js";
import { FtRelatorioQueryDto } from "../dto/ft-relatorio.dto.js";
import { FtRelatorioRepository } from "../../domain/repositories/ft-relatorio.repository.js";
import { FtRelatorioPagamentoService } from "../../domain/services/ft-relatorio-pagamento.service.js";
import { FtRelatorioPeriodoService } from "../../domain/services/ft-relatorio-periodo.service.js";

export class GerarRelatorioFtUseCase {
  constructor(
    private readonly repository: FtRelatorioRepository,
    private readonly periodoService = new FtRelatorioPeriodoService(),
    private readonly pagamentoService = new FtRelatorioPagamentoService(),
    private readonly csvFormatter = new FtRelatorioCsvFormatter(),
  ) {}

  private async calculate(id: string, query: FtRelatorioQueryDto = {}) {
    const edital = await this.repository.findEditalById(id);

    if (!edital) {
      throw ftError(404, "Edital not found");
    }

    const periodo = this.periodoService.resolve(query);
    this.validatePeriodoWithinEdital(periodo, edital);

    const bolsistas = await this.repository.findBolsistasByEditalPeriodo(
      id,
      periodo,
    );
    const relatorio = this.pagamentoService.execute(
      bolsistas,
      edital,
      periodo,
    );
    const csv = this.csvFormatter.format(relatorio);

    const data_pagamento = this.csvFormatter.paymentDate(relatorio);
    const rows = relatorio.locais.flatMap(local => local.rows.map(row => ({ ...row, pagador: local.pagador, data_pagamento,
      alertas: [...(!isValidCpf(row.cpf) ? [{ codigo: 'CPF_INVALIDO', campo: 'cpf', mensagem: 'CPF ausente ou inválido.' }] : []), ...paymentIssues(row)] })));
    const resumo = { participantes: new Set(rows.map(row => row.bolsista_id || row.cpf)).size, pagamentos: rows.length,
      valor_liquido: relatorio.total_valor, com_alertas: rows.filter(row => row.alertas.length).length };
    const versao = createHash('sha256').update(JSON.stringify({ periodo, rows, csv })).digest('hex');
    return {
      rows, count: rows.length, resumo, versao, data_pagamento,
      fileName: "relatorio.csv",
      csv,
      type: "text/csv; charset=utf-8",
      returnedCount: relatorio.total_bolsistas,
    };
  }

  async execute(id: string, query: FtRelatorioQueryDto = {}) {
    const result = await this.calculate(id, query);
    if (query.versao && query.versao !== result.versao) throw ftError(409, 'Pagamento alterado. Atualize a previa e confirme novamente.');
    return { fileName: result.fileName, csv: result.csv, type: result.type, returnedCount: result.returnedCount };
  }
  async preview(id: string, query: FtRelatorioQueryDto = {}) {
    const { rows, count, resumo, versao, data_pagamento } = await this.calculate(id, query);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
    const offset = Math.max(0, Number(query.page) || 0) * limit;
    return { rows: rows.slice(offset, offset + limit), count, resumo, versao, data_pagamento };
  }

  private validatePeriodoWithinEdital(periodo: any, edital: any): void {
    const dataPublicacao = this.toDateOnly(edital.data_publicacao);
    const dataVencimento = this.toDateOnly(edital.data_vencimento);

    if (
      periodo.data_inicio < dataPublicacao ||
      periodo.data_fim > dataVencimento
    ) {
      throw ftError(400, "Periodo do relatorio fora do periodo do edital");
    }
  }

  private toDateOnly(value: string | Date): string {
    return value instanceof Date
      ? value.toISOString().slice(0, 10)
      : String(value).slice(0, 10);
  }
}
