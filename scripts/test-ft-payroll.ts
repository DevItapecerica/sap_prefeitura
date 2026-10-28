import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { GerarRelatorioFtUseCase } from '../src/modules/ft-relatorio/application/use-case/gerar-relatorio-ft.use-case.js';
import { FtFechamentoFolhaService, monthPeriod } from '../src/modules/ft-relatorio/application/use-case/ft-fechamento-folha.service.js';
import { SequelizeFtRelatorioRepository } from '../src/infra/database/sequelize/repositories/sequelize.ft-relatorio.repository.js';
import { makeAuditService } from '../src/modules/audit/factories/makeAuditService.js';
import { EditalWorkflowService } from '../src/modules/ft-edital/application/use-case/edital-workflow.service.js';

/** Called only by the guarded empty-schema workflow harness. Never reads application credentials. */
export async function testPayroll({ db, crypto, service, actor, base, answers, makeEdital }: any) {
  const factory = (calculator?: any) => new FtFechamentoFolhaService(db, calculator || ((id: string, query: any, transaction: any) =>
    new GerarRelatorioFtUseCase(new SequelizeFtRelatorioRepository(transaction)).calculate(id, query)), makeAuditService(), crypto, () => new Date('2026-10-28T15:00:00Z'));
  const sheets = factory(), month = monthPeriod('2026-10');
  const bank = { bco: '001', ag: '0012', dig_ag: 'X', conta: '000123', dig_conta: '0' };
  async function person() {
    const id = randomUUID();
    return db.MunicipeModel.create({ nome: 'Pessoa folha ' + id, cpf: await crypto.encrypt('01234567890'), nascimento: await crypto.encrypt('1990-01-01'),
      telefone: await crypto.encrypt('11999990000'), rua: await crypto.encrypt('Rua Teste'), bairro: await crypto.encrypt('Centro'), cidade: await crypto.encrypt('Itapecerica da Serra'),
      uf: await crypto.encrypt('SP'), cep: await crypto.encrypt('06850000'), numero: await crypto.encrypt('1'), cpfHash: 'payroll-' + id, cepHash: 'payroll-' + id, author: '1' });
  }
  async function register(e: any) {
    const m = await person(), r = await service.register(e.id, { municipe_uuid: m.uuid, respostas: answers }, actor, false);
    return { m, r };
  }
  const e = await makeEdital({ name: 'Fechamento SQL', vagas: 4 });
  const first = await register(e), second = await register(e);
  const active = await service.call(e.id, first.r.id, e.allocation, actor);
  const reserved = await service.call(e.id, second.r.id, e.allocation, actor);
  await service.transition(e.id, active.id, 'ativar', { data_inicio: '2026-10-22', payment_info: bank }, actor);
  await service.record(e.id, active.id, 'faltas', { data_falta: '2026-10-22', observacao: 'Teste folha' }, actor);
  const falta = (await service.records(e.id, active.id, 'faltas', {})).rows[0];
  await assert.rejects(sheets.download(e.id, month), (error: any) => error.statusCode === 409);
  const old = await sheets.preview(e.id, month);
  await first.m.update({ nome: 'Nome conferido' });
  await assert.rejects(sheets.close(e.id, '2026-10', old.versao, actor), (error: any) => error.statusCode === 409);
  assert.equal(await db.FtFolhaFechamento.count({ where: { edital_id: e.id } }), 0);
  const preview = await sheets.preview(e.id, month);
  const closed = await Promise.all([sheets.close(e.id, '2026-10', preview.versao, actor), sheets.close(e.id, '2026-10', preview.versao, actor)]);
  assert.equal(closed[0].id, closed[1].id);
  const csv = (await sheets.download(e.id, month)).csv;
  assert.ok(csv.startsWith('001;0012;X;000123;0;Nome conferido;'));
  assert.equal(csv.split(';').length, 9); assert.ok(csv.endsWith(';01234567890'));
  await first.m.update({ nome: 'Nome posterior', cpf: await crypto.encrypt('11111111111') });
  await db.PaymentInfo.update({ conta: '999999' }, { where: { bolsista_id: first.r.bolsista_id } });
  assert.equal((await sheets.download(e.id, month)).csv, csv);
  assert.equal((await sheets.preview(e.id, month)).rows[0].nome, 'Nome conferido');
  const stored = await db.FtFolhaFechamento.findOne({ where: { edital_id: e.id } });
  assert.ok(!stored.snapshot.includes('01234567890') && !stored.snapshot.includes('000123'));
  assert.equal(await db.FtFolhaFechamento.count({ where: { edital_id: e.id } }), 1);
  await assert.rejects(db.FtFolhaFechamento.create({ ...stored.toJSON(), id: randomUUID() }));
  for (const query of [{ data_inicio: '2026-10-02', data_fim: '2026-10-31' }, { data_inicio: '2026-10-01', data_fim: '2026-11-30' }]) await assert.rejects(sheets.download(e.id, query));
  await assert.rejects(service.transition(e.id, reserved.id, 'ativar', { data_inicio: '2026-10-22', payment_info: bank }, actor), /2026-10/);
  const third = await register(e);
  for (const exception of [false, true]) await assert.rejects(service.call(e.id, third.r.id, { ...e.allocation, motivo: 'Teste exceção' }, actor, exception), /2026-10/);
  await assert.rejects(service.record(e.id, active.id, 'faltas', {}, actor, falta.id), /2026-10/);
  await assert.rejects(service.record(e.id, active.id, 'ocorrencias', { data_ocorrencia: '2026-10-22', descricao: 'Teste' }, actor), /2026-10/);
  await assert.rejects(service.transition(e.id, active.id, 'concluir', { motivo: 'Teste' }, actor), /2026-10/);
  await assert.rejects(service.phase(e.id, 'encerrado', actor), /2026-10/);
  const future = await service.call(e.id, third.r.id, { ...e.allocation, data_inicio: '2026-11-01' }, actor);
  await service.transition(e.id, future.id, 'ativar', { data_inicio: '2026-11-01', payment_info: bank }, actor);
  await service.transition(e.id, active.id, 'prorrogar', {}, actor);
  console.log('PASS payroll immutable encrypted CSV, concurrent/idempotent close, SQL uniqueness, stale preview, closed-month guards and future operations');

  // Closing races with activation: either the preview becomes stale or activation is blocked.
  const race = await makeEdital({ name: 'Concorrência fechamento/ativação' }), pending = await register(race);
  const call = await service.call(race.id, pending.r.id, race.allocation, actor);
  const before = await sheets.preview(race.id, month);
  const outcomes = await Promise.allSettled([
    sheets.close(race.id, '2026-10', before.versao, actor),
    service.transition(race.id, call.id, 'ativar', { data_inicio: '2026-10-22', payment_info: bank }, actor),
  ]);
  assert.equal(outcomes.filter(result => result.status === 'fulfilled').length, 1);
  if (outcomes[0].status === 'fulfilled') assert.equal((await sheets.preview(race.id, month)).count, 0);
  else {
    assert.equal((outcomes[0] as PromiseRejectedResult).reason.statusCode, 409);
    const latest = await sheets.preview(race.id, month); assert.equal(latest.count, 1);
    await sheets.close(race.id, '2026-10', latest.versao, actor);
  }
  const empty = await makeEdital({ name: 'Folha vazia' }), emptyPreview = await sheets.preview(empty.id, month);
  await sheets.close(empty.id, '2026-10', emptyPreview.versao, actor);
  assert.equal((await sheets.download(empty.id, month)).csv, '');
  await assert.rejects(service.update(empty.id, { ...base, name: 'Folha vazia', valor_bolsa: 999 }, actor), /bloqueadas/);
  // Database transaction must roll back the financial row if the audit cannot persist.
  const rollback = await makeEdital({ name: 'Rollback auditoria' }), rp = await sheets.preview(rollback.id, month);
  const broken = new FtFechamentoFolhaService(db, (id, query, tx) => new GerarRelatorioFtUseCase(new SequelizeFtRelatorioRepository(tx)).calculate(id, query),
    { record: async () => { throw new Error('Synthetic audit failure'); } }, crypto, () => new Date('2026-10-28T15:00:00Z'));
  await assert.rejects(broken.close(rollback.id, '2026-10', rp.versao, actor), /Synthetic audit failure/);
  assert.equal(await db.FtFolhaFechamento.count({ where: { edital_id: rollback.id } }), 0);
  const migration = (await import('../src/infra/database/sequelize/migrations/20261028140000-ft-fechamento-mensal.js')).default;
  await assert.rejects(migration.down(db.sequelize.getQueryInterface()), /Rollback refused/);
  const later = new EditalWorkflowService(db, crypto, () => new Date('2026-11-03T15:00:00Z'));
  await later.transition(e.id, active.id, 'concluir', { motivo: 'Mês aberto' }, actor);
  assert.equal((await sheets.download(e.id, month)).csv, csv);
  console.log('PASS close/activation concurrency, empty sheet, audit rollback, migration safeguards and no rewriting after later closure');
}
