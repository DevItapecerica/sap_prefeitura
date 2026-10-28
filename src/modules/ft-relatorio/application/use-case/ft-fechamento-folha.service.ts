import type { Transaction } from 'sequelize';
import type { DbObject } from '../../../../core/types/DbTypes.js';
import AesCryptService from '../../../../core/security/aes/AesCrypt.service.js';
import { ftError } from '../../../ft-bolsista/application/utils/ft-error.js';
import { businessDate, dateOnly } from '../../../ft-edital/domain/services/edital-workflow.policy.js';
import type { FtRelatorioQueryDto } from '../dto/ft-relatorio.dto.js';
import type { RecordAuditDto } from '../../../audit/application/dto/audit.dto.js';

export function monthPeriod(mes: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) throw ftError(422, 'Informe o mês no formato AAAA-MM.');
  return { data_inicio: mes + '-01', data_fim: new Date(Date.UTC(Number(mes.slice(0, 4)), Number(mes.slice(5)), 0, 12)).toISOString().slice(0, 10) };
}

export function queryMonth(query: FtRelatorioQueryDto) {
  const mes = query.data_inicio?.slice(0, 7) || '';
  const period = monthPeriod(mes);
  if (query.data_inicio !== period.data_inicio || query.data_fim !== period.data_fim)
    throw ftError(422, 'Selecione um mês completo. Recortes e intervalos entre meses não são permitidos.');
  return mes;
}

type Calculator = (id: string, query: FtRelatorioQueryDto, transaction?: Transaction) => Promise<any>;
type Audit = { record(input: RecordAuditDto, transaction?: unknown): Promise<unknown> };

export class FtFechamentoFolhaService {
  constructor(private db: DbObject, private calculate: Calculator, private audit: Audit,
    private crypto = new AesCryptService(), private clock = () => new Date()) {}

  private async edital(id: string, transaction?: Transaction) {
    const row = await this.db.Edital.findByPk(id, { transaction, ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}) });
    if (!row) throw ftError(404, 'Edital não encontrado.');
    return row;
  }
  private async stored(id: string, mes: string, transaction?: Transaction) {
    return this.db.FtFolhaFechamento.findOne({ where: { edital_id: id, mes }, transaction });
  }
  private async metadata(row: any) {
    if (!row) return { situacao: 'aberta' };
    const actor = await this.db.UserModel.findByPk(row.fechado_por, { attributes: ['id', 'name'], paranoid: false });
    return { situacao: 'fechada', id: row.id, mes: row.mes, fechado_em: new Date(row.fechado_em).toISOString(),
      fechado_por: String(row.fechado_por), responsavel: actor?.name || 'Usuário ' + row.fechado_por };
  }
  async state(id: string, mes: string) {
    monthPeriod(mes); await this.edital(id);
    return this.metadata(await this.stored(id, mes));
  }
  private period(mes: string, edital: any) {
    const month = monthPeriod(mes);
    const data_inicio = [month.data_inicio, dateOnly(edital.data_publicacao), dateOnly(edital.vigencia_inicio || edital.data_publicacao)].sort().pop()!;
    const data_fim = [month.data_fim, dateOnly(edital.data_vencimento)].sort()[0];
    if (data_inicio > data_fim) throw ftError(422, 'Mês fora da vigência do edital.');
    return { data_inicio, data_fim };
  }
  async preview(id: string, query: FtRelatorioQueryDto) {
    const mes = queryMonth(query), edital = await this.edital(id);
    const stored = await this.stored(id, mes);
    const result = stored ? JSON.parse(await this.crypto.decrypt(stored.snapshot)) : await this.calculate(id, this.period(mes, edital));
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 20)), offset = Math.max(0, Number(query.page) || 0) * limit;
    return { rows: result.rows.slice(offset, offset + limit), count: result.count, resumo: result.resumo,
      versao: result.versao, periodo: result.periodo, data_pagamento: result.data_pagamento,
      fechamento: await this.metadata(stored), pode_fechar: !stored && mes <= businessDate(this.clock()).slice(0, 7) };
  }
  async close(id: string, mes: string, versao: string, actor: { id: string | number; requestId: string }) {
    monthPeriod(mes);
    if (mes > businessDate(this.clock()).slice(0, 7)) throw ftError(422, 'Não é permitido fechar meses futuros.');
    if (!/^[a-f0-9]{64}$/.test(versao || '')) throw ftError(422, 'Confira a prévia antes de fechar a folha.');
    return this.db.sequelize.transaction(async transaction => {
      const edital = await this.edital(id, transaction);
      const existing = await this.stored(id, mes, transaction);
      // A repeated confirmation returns the same close; a different preview is a conflict.
      if (existing) {
        if (existing.versao !== versao) throw ftError(409, 'A folha deste mês já foi fechada. Consulte a folha preservada.');
        return this.metadata(existing);
      }
      const result = await this.calculate(id, this.period(mes, edital), transaction);
      if (result.versao !== versao) throw ftError(409, 'Pagamento alterado. Confira novamente a prévia antes de fechar.');
      const row = await this.db.FtFolhaFechamento.create({ edital_id: id, mes, versao, fechado_por: String(actor.id),
        fechado_em: this.clock(), snapshot: await this.crypto.encrypt(JSON.stringify(result)) }, { transaction });
      await this.audit.record({ actor: { userId: actor.id }, action: 'CREATE', module: 'ft-relatorio', resourceType: 'fechamento_folha',
        resourceId: row.id, result: 'SUCCESS', requestId: actor.requestId, metadata: { editalId: id, mes } }, transaction);
      return this.metadata(row);
    });
  }
  async download(id: string, query: FtRelatorioQueryDto) {
    const mes = queryMonth(query); await this.edital(id);
    const row = await this.stored(id, mes);
    if (!row) throw ftError(409, 'Feche a folha deste mês antes de emitir o CSV de pagamento.');
    const result = JSON.parse(await this.crypto.decrypt(row.snapshot));
    return { fileName: 'pagamento-' + mes + '.csv', csv: result.csv, type: result.type, returnedCount: result.returnedCount };
  }
}
