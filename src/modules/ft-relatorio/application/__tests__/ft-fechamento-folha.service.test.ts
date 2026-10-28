import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { FtFechamentoFolhaService, monthPeriod, queryMonth } from '../use-case/ft-fechamento-folha.service.js';
import AesCryptService from '../../../../core/security/aes/AesCrypt.service.js';
import type { DbObject } from '../../../../core/types/DbTypes.js';
import { GerarRelatorioFtUseCase } from '../use-case/gerar-relatorio-ft.use-case.js';

function fixture() {
  let rows: any[] = [], locked = false, calls = 0, failAudit = false;
  const events: any[] = [], crypto = new AesCryptService();
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  const edital = { data_publicacao: '2026-01-12', vigencia_inicio: '2026-01-15', data_vencimento: '2026-10-25' };
  let bank = '001;0012;X;000123;0;"Maria; Silva";90001;25102026;01234567890';
  const db = {
    sequelize: { transaction: async (fn: any) => { const before = [...rows]; try { return await fn(transaction); } catch (e) { rows = before; throw e; } } },
    Edital: { findByPk: async (id: string, options: any) => { if (options.lock) { assert.equal(options.transaction, transaction); locked = true; } return id === 'missing' ? null : edital; } },
    UserModel: { findByPk: async () => ({ name: 'Operador' }) },
    FtFolhaFechamento: {
      findOne: async ({ where }: any) => rows.find(r => r.edital_id === where.edital_id && r.mes === where.mes),
      create: async (data: any, options: any) => { assert.equal(locked, true); assert.equal(options.transaction, transaction); const row = { id: 'folha', ...data }; rows.push(row); return row; },
    },
  } as unknown as DbObject;
  const calculate = async (_id: string, periodo: any, tx?: any) => {
    calls++; if (tx) { assert.equal(locked, true); assert.equal(tx, transaction); }
    return { rows: bank ? [{ nome: 'Maria', cpf: '01234567890', conta: '000123', valor_liquido: 900.01 }] : [],
      count: bank ? 1 : 0, resumo: { participantes: bank ? 1 : 0, pagamentos: bank ? 1 : 0, valor_liquido: bank ? 900.01 : 0, com_alertas: 0 },
      periodo, csv: bank, data_pagamento: '25102026', versao: createHash('sha256').update(bank + JSON.stringify(periodo)).digest('hex'),
      type: 'text/csv; charset=utf-8', returnedCount: bank ? 1 : 0 };
  };
  const audit = { record: async (data: any, tx: any) => { assert.equal(tx, transaction); if (failAudit) throw new Error('audit failed'); events.push(data); } };
  const service = new FtFechamentoFolhaService(db, calculate, audit, crypto, () => new Date('2026-11-01T01:00:00Z')); // Still October in Brasilia.
  return { service, db, edital, rows: () => rows, events, calls: () => calls, setBank: (value: string) => { bank = value; }, failAudit: () => { failAudit = true; } };
}
const actor = { id: 7, requestId: 'request' }, query = monthPeriod('2026-10');

test('open month has preview only; closing stores encrypted bytes and re-emission never recalculates', async () => {
  const f = fixture();
  assert.deepEqual(await f.service.state('edital', '2026-10'), { situacao: 'aberta' });
  await assert.rejects(f.service.download('edital', query), (e: any) => e.statusCode === 409);
  const preview = await f.service.preview('edital', query);
  assert.deepEqual(preview.periodo, { data_inicio: '2026-10-01', data_fim: '2026-10-25' });
  assert.equal(preview.pode_fechar, true);
  const closed = await f.service.close('edital', '2026-10', preview.versao, actor);
  assert.equal(closed.responsavel, 'Operador');
  assert.equal(f.rows().length, 1);
  assert.ok(!f.rows()[0].snapshot.includes('01234567890'));
  assert.ok(!JSON.stringify(f.events).includes('000123'));
  assert.equal(f.events.length, 1);
  const csv = (await f.service.download('edital', query)).csv;
  const calls = f.calls(); f.setBank('changed'); f.edital.data_vencimento = '2026-10-31';
  assert.equal((await f.service.download('edital', query)).csv, csv);
  assert.equal((await f.service.preview('edital', query)).rows[0].conta, '000123');
  assert.equal(f.calls(), calls);
  await f.service.close('edital', '2026-10', preview.versao, actor);
  assert.equal(f.rows().length, 1); assert.equal(f.events.length, 1);
  await assert.rejects(f.service.close('edital', '2026-10', 'f'.repeat(64), actor), (e: any) => e.statusCode === 409);
});

test('stale preview conflicts and audit failure rolls back closing', async () => {
  const f = fixture(), preview = await f.service.preview('edital', query);
  f.setBank('changed');
  await assert.rejects(f.service.close('edital', '2026-10', preview.versao, actor), (e: any) => e.statusCode === 409);
  assert.equal(f.rows().length, 0);
  const updated = await f.service.preview('edital', query); f.failAudit();
  await assert.rejects(f.service.close('edital', '2026-10', updated.versao, actor), /audit failed/);
  assert.equal(f.rows().length, 0);
});

test('empty payroll is explicitly closable with empty immutable CSV', async () => {
  const f = fixture(); f.setBank('');
  const p = await f.service.preview('edital', query);
  assert.equal(p.count, 0);
  await f.service.close('edital', '2026-10', p.versao, actor);
  f.setBank('new participant');
  assert.equal((await f.service.download('edital', query)).csv, '');
});

test('civil months cover leap years, require complete month and clip initial vigency', async () => {
  assert.equal(monthPeriod('2028-02').data_fim, '2028-02-29');
  assert.equal(monthPeriod('2027-02').data_fim, '2027-02-28');
  assert.throws(() => monthPeriod('2026-13'));
  assert.throws(() => queryMonth({ data_inicio: '2026-10-02', data_fim: '2026-10-31' }));
  assert.throws(() => queryMonth({ data_inicio: '2026-10-01', data_fim: '2026-11-30' }));
  const f = fixture(), p = await f.service.preview('edital', monthPeriod('2026-01'));
  assert.equal(p.periodo.data_inicio, '2026-01-15');
  await assert.rejects(f.service.preview('edital', monthPeriod('2025-12')));
  await assert.rejects(f.service.close('edital', '2026-11', 'a'.repeat(64), actor), (e: any) => e.statusCode === 422);
  await assert.rejects(f.service.close('edital', '2026-10', '', actor));
  await assert.rejects(f.service.state('missing', '2026-10'), (e: any) => e.statusCode === 404);
});

test('legacy export use case cannot calculate an open payroll', async () => {
  const repository = { findEditalById: async () => { throw new Error('must not calculate'); } };
  const useCase = new GerarRelatorioFtUseCase(repository as any);
  await assert.rejects(useCase.execute('edital', query), (e: any) => e.statusCode === 409);
});
