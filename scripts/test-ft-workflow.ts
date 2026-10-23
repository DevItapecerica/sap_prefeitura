import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { Sequelize } from 'sequelize';

// Never inherit DATABASE_URL from the application .env and never reset a schema.
const target = process.env.FT_WORKFLOW_TEST_URL;
if (!target || process.env.FT_WORKFLOW_TEST_ALLOW_CREATE !== 'YES') throw new Error('Set FT_WORKFLOW_TEST_URL and FT_WORKFLOW_TEST_ALLOW_CREATE=YES for an EMPTY disposable schema.');
const url = new URL(target);
if (url.protocol !== 'mariadb:' || !['localhost', '127.0.0.1'].includes(url.hostname) || !/^\/[a-z0-9_]+_ft_test$/.test(url.pathname) || decodeURIComponent(url.username).toLowerCase() === 'root' || url.search || url.hash) throw new Error('Refusing unsafe FT test target');
Object.assign(process.env, { DATABASE_URL: target, NODE_ENV: 'test', SECRET_KEY: 'ft-workflow-synthetic-key-for-tests-only', APPLICATION_PORT: '3117', MAIL_ADRESS: 'test@example.invalid', MAIL_PASSWORD: 'synthetic', MAIL_HOST: '127.0.0.1', PDF_API_URL: 'http://127.0.0.1:39999/api/v1', CORS_ORIGINS: 'http://127.0.0.1:4173', BOOTSTRAP_ADMIN_EMAIL: 'ft-e2e@example.invalid', BOOTSTRAP_ADMIN_PASSWORD: 'FtSynthetic123!' });
const sql = new Sequelize(target, { dialect: 'mariadb', logging: false });
try {
  const qi = sql.getQueryInterface();
  assert.equal((await qi.showAllTables()).length, 0, 'Schema must be empty; this harness never drops tables');
  for (const directory of ['migrations', 'seeders']) {
    const root = resolve('src/infra/database/sequelize', directory);
    for (const file of (await readdir(root)).filter(f => /^\d+.*\.ts$/.test(f)).sort()) {
      const migration = (await import(pathToFileURL(resolve(root, file)).href)).default;
      const existingId = '8f214433-9407-479c-ad20-9fe6e40fd4f6';
      if (file === '20261022130000-ft-idade-excecoes.ts') await qi.bulkInsert('edital', [{ id: existingId, name: 'Existing synthetic edital', data_publicacao: new Date(), data_vencimento: new Date('2028-12-31'), dia_pagamento: 5, valor_bolsa: 900, status: 'ativo', createdAt: new Date(), updatedAt: new Date() }]);
      await migration.up(qi);
      if (file === '20261022120000-ft-edital-workflow.ts') { await migration.down(qi); await migration.up(qi); }
      if (file === '20261022130000-ft-idade-excecoes.ts') {
        const [rows] = await sql.query('SELECT idade_maxima FROM edital WHERE id=:id', { replacements: { id: existingId } });
        assert.equal((rows[0] as any).idade_maxima, null);
        await migration.down(qi); await migration.up(qi);
        await qi.bulkDelete('edital', { id: existingId });
      }
      if (file === '20261022131000-ft-exception-permissions.ts') {
        const [before] = await sql.query('SELECT * FROM role_permissions ORDER BY role_id,permission_action_id');
        await migration.up(qi);
        const [after] = await sql.query('SELECT * FROM role_permissions ORDER BY role_id,permission_action_id');
        assert.deepEqual(after, before);
      }
    }
  }
  console.log('PASS migrations and seeds on empty database');
  const db = (await import('../src/infra/database/sequelize/index.js')).default;
  const { EditalWorkflowService } = await import('../src/modules/ft-edital/application/use-case/edital-workflow.service.js');
  const { default: Aes } = await import('../src/core/security/aes/AesCrypt.service.js');
  const { SequelizeFtRelatorioRepository } = await import('../src/infra/database/sequelize/repositories/sequelize.ft-relatorio.repository.js');
  const { authorizationFactory } = await import('../src/modules/acess-controll/factories/makeAuthorization.js');
  await assert.rejects(authorizationFactory().authorize(1, 'ft', 'encaixar_inscricao'), 'new permissions must not inherit legacy admin grants');
  for (const action of ['cadastrar_inscricao_excecao', 'convocar_inscrito_excecao']) await assert.rejects(authorizationFactory().authorize(1, 'ft', action), 'exception grants must be denied by default');
  const crypto = new Aes();
  const fixedNow = new Date('2026-10-22T12:00:00-03:00');
  const service = new EditalWorkflowService(db, crypto, () => fixedNow);
  const actor = { id: 1, requestId: 'cfb52be6-252c-4813-9f23-d4342c974bb4' };
  const base = { idade_maxima: 65, name: 'Edital sintético', data_publicacao: '2026-10-01', vigencia_inicio: '2026-10-01', data_vencimento: '2028-12-31', inscricoes_inicio: '2026-10-01T09:00:00-03:00', inscricoes_fim: '2026-11-01T17:00:00-03:00', vagas: 1, dia_pagamento: 5, valor_bolsa: 900, carga_semanal: 30, carga_mensal: 180, duracao_meses: 6, prorrogacao_meses: 3, permitir_participacao_anterior: false, permitir_retorno: false };
  const answers = { desempregado: true, possui_renda: false, recebe_previdencia: false, inicio_residencia: '2020-01-01', vulnerabilidade_atestada: true, beneficiario_familiar: false, aceite: true };
  const people: any[] = [];
  for (let i = 0; i < 5; i++) {
    people.push(await db.MunicipeModel.create({ nome: 'Pessoa sintetica ' + i, cpf: await crypto.encrypt('0000000000' + i), nascimento: await crypto.encrypt('1990-01-01'), telefone: await crypto.encrypt('11999990000'), rua: await crypto.encrypt('Rua Teste'), bairro: await crypto.encrypt('Centro'), cidade: await crypto.encrypt('Itapecerica da Serra'), uf: await crypto.encrypt('SP'), cep: await crypto.encrypt('06850000'), numero: await crypto.encrypt('1'), cpfHash: 'synthetic-cpf-' + i, cepHash: 'synthetic-cep-' + i, author: '1' }));
  }
  const makeEdital = async (overrides: any = {}) => {
    const e = await service.create({ ...base, ...overrides }, actor);
    const pay = await service.config(e.id, 'pagadores', undefined, { nome: 'Pagador sintético', quantidade: e.vagas }, actor);
    const shift = await service.config(e.id, 'turnos', undefined, { nome: 'Manhã', hora_inicio: '08:00', hora_fim: '14:00' }, actor);
    const local = await service.config(e.id, 'locais', undefined, { nome: 'Local sintético', descricao: 'Teste' }, actor);
    await service.config(e.id, 'beneficios', undefined, { nome: 'Cesta básica', descricao: 'Mensal' }, actor);
    await service.phase(e.id, 'aberto', actor);
    return { ...e, allocation: { pagador_id: pay.uuid, turno_id: shift.uuid, local: 'Local de trabalho informado', data_inicio: '2026-10-22' } };
  };
  try {
    const e = await makeEdital();
    const inscriptions = [];
    for (const person of people) inscriptions.push(await service.register(e.id, { municipe_uuid: person.uuid, respostas: answers }, actor, false));
    assert.equal(await db.PaymentInfo.count(), 0);
    await assert.rejects(service.register(e.id, { municipe_uuid: people[0].uuid, respostas: answers }, actor, false));
    const results = await Promise.allSettled(inscriptions.slice(0, 2).map(r => service.call(e.id, r.id, e.allocation, actor)));
    assert.equal(results.filter(r => r.status === 'fulfilled').length, 1, 'last vacancy must only be reserved once');
    const current = (results.find(r => r.status === 'fulfilled') as PromiseFulfilledResult<any>).value;
    assert.equal((await service.detail(e.id)).disponiveis, 0);
    const reports = new SequelizeFtRelatorioRepository();
    assert.equal((await reports.findBolsistasByEditalPeriodo(e.id, { data_inicio: '2026-10-01', data_fim: '2026-10-31' })).length, 0, 'convocados are not payable');
    await assert.rejects(service.transition(e.id, current.id, 'ativar', { data_inicio: '2026-10-22', payment_info: {} }, actor));
    assert.equal(await db.PaymentInfo.count(), 0, 'failed activation must roll back bank data');
    const bank = { bco: '001', ag: '1234', dig_ag: '0', conta: '123456', dig_conta: '7' };
    await service.transition(e.id, current.id, 'ativar', { data_inicio: '2026-10-22', payment_info: bank }, actor);
    assert.equal((await service.detail(e.id)).ocupadas, 1);
    assert.equal((await reports.findBolsistasByEditalPeriodo(e.id, { data_inicio: '2026-10-01', data_fim: '2026-10-31' })).length, 1);
    await service.record(e.id, current.id, 'faltas', { data_falta: '2026-10-22', observacao: 'Teste' }, actor);
    await service.record(e.id, current.id, 'ocorrencias', { data_ocorrencia: '2026-10-22', descricao: 'Teste sintético' }, actor);
    assert.equal((await service.records(e.id, current.id, 'ocorrencias', {})).count, 1);
    await service.transition(e.id, current.id, 'prorrogar', {}, actor);
    assert.equal(new Date((await db.BolsistasEdital.findByPk(current.id)).expire_at).toISOString(), '2027-07-23T02:59:59.000Z');
    await assert.rejects(service.transition(e.id, current.id, 'prorrogar', {}, actor));
    await assert.rejects(service.update(e.id, { ...base, valor_bolsa: 1000 }, actor));
    await service.transition(e.id, current.id, 'cancelar', { motivo: 'Fim de teste' }, actor);
    assert.equal((await service.detail(e.id)).disponiveis, 1);
    const other = await makeEdital();
    const owner = await db.Bolsistas.findByPk(current.bolsista_id);
    await assert.rejects(service.register(other.id, { municipe_uuid: owner.municipe_uuid, respostas: answers }, actor, false), /anteriormente ativado/);
    const otherRegistration = await service.register(other.id, { municipe_uuid: owner.municipe_uuid, respostas: answers, motivo: 'Registro excepcional sintético' }, actor, false, true);
    await assert.rejects(service.call(other.id, otherRegistration.id, other.allocation, actor), /anteriormente ativado/);
    const available = inscriptions.find(r => r.bolsista_id !== current.bolsista_id)!;
    await assert.rejects(service.call(e.id, available.id, other.allocation, actor), /neste edital/);
    const second = await service.call(e.id, available.id, e.allocation, actor);
    await service.transition(e.id, second.id, 'cancelar', { motivo: 'Cancelada antes da ativação' }, actor);
    const freeIdentity = await db.Bolsistas.findByPk(second.bolsista_id);
    const freeReg = await service.register(other.id, { municipe_uuid: freeIdentity.municipe_uuid, respostas: answers }, actor, false);
    await service.call(other.id, freeReg.id, other.allocation, actor);
    await service.phase(other.id, 'encerrado', actor);
    assert.equal((await service.detail(other.id)).reservadas, 0);
    assert.equal(await db.BolsistasEdital.count({ where: { edital_id: other.id, status: 'convocado' } }), 0);
    const { SequelizeFtSchedulerRepository } = await import('../src/infra/database/sequelize/repositories/sequelize.ft-scheduler.repository.js');
    const scheduler = new SequelizeFtSchedulerRepository();
    const scheduled = await makeEdital({ vagas: 2, permitir_participacao_anterior: true });
    const regExpired = await service.register(scheduled.id, { municipe_uuid: people[2].uuid, respostas: answers }, actor, false);
    const expired = await service.call(scheduled.id, regExpired.id, scheduled.allocation, actor);
    await service.transition(scheduled.id, expired.id, 'ativar', { data_inicio: '2026-10-22', payment_info: bank }, actor);
    await db.BolsistasEdital.update({ expire_at: new Date('2026-10-21T23:59:59-03:00') }, { where: { id: expired.id } });
    await scheduler.expireVinculo(await db.BolsistasEdital.findByPk(expired.id));
    assert.equal((await db.BolsistasEdital.findByPk(expired.id)).status, 'expirado');
    for (let i = 0; i < 2; i++) {
      const reg = await service.register(scheduled.id, { municipe_uuid: people[i].uuid, respostas: answers }, actor, false);
      const called = await service.call(scheduled.id, reg.id, scheduled.allocation, actor);
      if (!i) await service.transition(scheduled.id, called.id, 'ativar', { data_inicio: '2026-10-22', payment_info: bank }, actor);
    }
    await db.Edital.update({ data_vencimento: new Date('2026-10-21T23:59:59-03:00') }, { where: { id: scheduled.id } });
    await scheduler.concludeExpiredEdital(await db.Edital.findByPk(scheduled.id));
    assert.equal((await db.Edital.findByPk(scheduled.id)).fase, 'encerrado');
    assert.equal(await db.BolsistasEdital.count({ where: { edital_id: scheduled.id, status: ['ativo', 'convocado'] } }), 0);
    const exceptional = await makeEdital();
    await db.MunicipeModel.update({ nascimento: await crypto.encrypt('1950-01-01') }, { where: { uuid: people[4].uuid } });
    await service.window(exceptional.id, { inscricoes_inicio: base.inscricoes_inicio, inscricoes_fim: '2026-10-21T17:00:00-03:00', motivo: 'Prazo sintético encerrado' }, actor);
    const exceptionData = { municipe_uuid: people[4].uuid, respostas: answers, motivo: 'Excecao sintetica autorizada' };
    const exceptionReg = await service.register(exceptional.id, exceptionData, actor, false, true);
    await assert.rejects(service.call(exceptional.id, exceptionReg.id, exceptional.allocation, actor), /Idade permitida/);
    const exceptionalCalls = await Promise.allSettled([0, 1].map(() => service.call(exceptional.id, exceptionReg.id, { ...exceptional.allocation, motivo: exceptionData.motivo }, actor, true)));
    assert.equal(exceptionalCalls.filter(r => r.status === 'fulfilled').length, 1);
    const exceptionCall = (exceptionalCalls.find(r => r.status === 'fulfilled') as PromiseFulfilledResult<any>).value;
    const persisted = await db.BolsistasEdital.findByPk(exceptionCall.id);
    assert.equal(persisted.excecao_autor_id, '1');
    assert.equal(persisted.excecao_motivo, exceptionData.motivo);
    assert.ok(persisted.excecao_em);
    await assert.rejects(service.transition(exceptional.id, exceptionCall.id, 'ativar', { data_inicio: '2026-10-22', payment_info: {} }, actor), /pagamento/);
    assert.equal((await service.detail(exceptional.id)).reservadas, 1);
    await service.transition(exceptional.id, exceptionCall.id, 'ativar', { data_inicio: '2026-10-22', payment_info: bank }, actor);
    await service.transition(exceptional.id, exceptionCall.id, 'cancelar', { motivo: 'Fim sintético' }, actor);
    // A second exceptional convocation bypasses return-to-same-edital and same-month restrictions.
    const returnCall = await service.call(exceptional.id, exceptionReg.id, { ...exceptional.allocation, motivo: 'Retorno excepcional no mesmo mes' }, actor, true);
    await service.transition(exceptional.id, returnCall.id, 'ativar', { data_inicio: '2026-10-22', payment_info: bank }, actor);
    await assert.rejects(service.call(e.id, inscriptions[4].id, { ...e.allocation, motivo: 'Tentativa simultanea' }, actor, true), /ja convocada ou ativa/);
    await service.transition(exceptional.id, returnCall.id, 'cancelar', { motivo: 'Fim sintético' }, actor);
    const ageMigration = (await import('../src/infra/database/sequelize/migrations/20261022130000-ft-idade-excecoes.js')).default;
    const extensionEdital = await makeEdital({ name: 'Prorrogacao limitada', duracao_meses: 1, data_vencimento: '2026-12-31', permitir_participacao_anterior: true });
    const extensionReg = await service.register(extensionEdital.id, { municipe_uuid: people[0].uuid, respostas: answers }, actor, false);
    const extensionCall = await service.call(extensionEdital.id, extensionReg.id, extensionEdital.allocation, actor);
    await service.transition(extensionEdital.id, extensionCall.id, 'ativar', { data_inicio: '2026-10-22', payment_info: bank }, actor);
    const extensionResult = await service.transition(extensionEdital.id, extensionCall.id, 'prorrogar', {}, actor);
    assert.equal(new Date(extensionResult.expire_at).toISOString(), '2027-01-01T02:59:59.000Z');
    assert.equal(extensionResult.prorrogated, true);
    await assert.rejects(service.transition(extensionEdital.id, extensionCall.id, 'prorrogar', {}, actor));
    // Even before consuming the single extension, a participation already at the edital limit cannot extend.
    await db.BolsistasEdital.update({ prorrogated: false }, { where: { id: extensionCall.id } });
    const eventsBefore = await db.FtWorkflowEvento.count({ where: { recurso_id: extensionCall.id, acao: 'prorrogar' } });
    await assert.rejects(service.transition(extensionEdital.id, extensionCall.id, 'prorrogar', {}, actor), /alcanca/);
    assert.equal((await db.BolsistasEdital.findByPk(extensionCall.id)).prorrogated, false);
    assert.equal(await db.FtWorkflowEvento.count({ where: { recurso_id: extensionCall.id, acao: 'prorrogar' } }), eventsBefore);
    console.log('PASS configured extension period, edital date cap and unchanged state/audit when already at the limit');
    await assert.rejects(ageMigration.down(qi), /Rollback refused/);
    console.log('PASS age migration preserves existing edital, exception seed is idempotent, authorizations persist, concurrent exception reserves once, activation preserves authority and same-month return is allowed');
    console.log('PASS scheduler expiration and edital closure cancel reservations and conclude active participants');
    const eventText = JSON.stringify((await db.FtWorkflowEvento.findAll()).map((r: any) => r.toJSON()));
    assert.ok(!eventText.includes('123456') && !eventText.includes('desempregado'));
    const migration = (await import('../src/infra/database/sequelize/migrations/20261022120000-ft-edital-workflow.js')).default;
    await assert.rejects(migration.down(qi), /Rollback refused/);
    console.log('PASS reservation concurrency, activation rollback, payment, records, reports, single extension, isolation, history, cancellation and closure');

    if (process.env.FT_WORKFLOW_TEST_SERVE === '1') {
      // Explicit grants for this disposable fixture only; production grants remain denied.
      await db.sequelize.query("INSERT INTO role_permissions (role_id, permission_action_id, allowed, createdAt, updatedAt) SELECT 1,id,1,NOW(),NOW() FROM permission_actions WHERE module_key IN ('ft','municipes') ON DUPLICATE KEY UPDATE allowed=1");
      await db.UserModel.update({ firstLogin: false }, { where: { id: 1 } });
      const Fastify = (await import('fastify')).default;
      const app = Fastify({ logger: false });
      await app.register((await import('@fastify/cookie')).default);
      const App = (await import('../src/app.js')).default;
      const errorHook = (await import('../src/core/hooks/ErrorHook.js')).default;
      await app.register(errorHook);
      await app.register(App, { prefix: '/api/v2', runtimeWorkers: false });
      app.get('/api/v2/__ft_test', async () => ({ database: url.pathname.slice(1), disposable: true }));
      await app.listen({ host: '127.0.0.1', port: 3117 });
      // Browser tests obtain the synthetic identity via login, no token is written to disk.
      console.log('READY FT disposable HTTP server 127.0.0.1:3117');
      await new Promise<void>(done => { process.once('SIGINT', () => done()); process.once('SIGTERM', () => done()); });
      await app.close();
    }
  } finally { await db.sequelize.close(); }
} finally { await sql.close(); }
