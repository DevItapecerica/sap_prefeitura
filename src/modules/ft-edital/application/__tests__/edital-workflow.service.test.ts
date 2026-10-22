import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { Op } from 'sequelize';
import { EditalWorkflowService } from '../use-case/edital-workflow.service.js';
import type { DbObject } from '../../../../core/types/DbTypes.js';
import type AesCryptService from '../../../../core/security/aes/AesCrypt.service.js';

// An in-memory persistence adapter tests business transitions and rollback. Real SQL locking
// and constraints are independently exercised by scripts/test-ft-workflow.ts.
function database() {
  let tables: Record<string, any[]> = {};
  const matches = (row: any, where: any = {}) => Object.entries(where).every(([key, condition]: [string, any]) => {
    if (Array.isArray(condition)) return condition.includes(row[key]);
    if (condition && typeof condition === 'object') {
      if (Op.ne in condition) return row[key] !== condition[Op.ne];
      if (Op.like in condition) return String(row[key]).includes(condition[Op.like].replaceAll('%', ''));
    }
    return row[key] === condition;
  });
  const db: any = { sequelize: { transaction: async (fn: any) => {
    const before = structuredClone(tables);
    try { return await fn({ LOCK: { UPDATE: 'UPDATE' } }); } catch (e) { tables = before; throw e; }
  } } };
  for (const name of ['Edital', 'MunicipeModel', 'Bolsistas', 'Pagador', 'Turno', 'FtEditalLocal', 'FtEditalBeneficio', 'FtInscricao', 'BolsistasEdital', 'PaymentInfo', 'BolsistaFalta', 'BolsistaOcorrencia', 'FtWorkflowEvento']) {
    const pk = ['MunicipeModel', 'Pagador', 'Turno'].includes(name) ? 'uuid' : 'id';
    tables[name] = [];
    const wrap = (row: any) => row ? new Proxy(row, { get(target, key) {
      if (key === 'toJSON') return () => ({ ...target });
      if (key === 'update') return async (data: any) => { Object.assign(target, data); return wrap(target); };
      if (key === 'destroy') return async () => { target.deletedAt = new Date(); };
      if (key === 'setDataValue') return (field: string, value: any) => { target[field] = value; };
      return target[key];
    } }) : null;
    const all = (options: any = {}) => tables[name].filter(r => (options.paranoid === false || !r.deletedAt) && matches(r, options.where));
    db[name] = {
      create: async (data: any) => { const row = { [pk]: randomUUID(), createdAt: new Date(), status: name === 'FtInscricao' ? 'inscrito' : undefined, ...data }; tables[name].push(row); return wrap(row); },
      findByPk: async (id: string, options: any = {}) => wrap(all(options).find(r => r[pk] === id)),
      findOne: async (options: any) => wrap(all(options)[0]),
      findAll: async (options: any = {}) => all(options).map(wrap),
      count: async (options: any = {}) => all(options).length,
      findAndCountAll: async (options: any = {}) => ({ count: all(options).length, rows: all(options).slice(options.offset || 0, (options.offset || 0) + (options.limit || 20)).map(wrap) }),
      findOrCreate: async (options: any) => { const found = await db[name].findOne(options); return found ? [found, false] : [await db[name].create(options.defaults), true]; },
      update: async (data: any, options: any) => { const rows = all(options); rows.forEach(r => Object.assign(r, data)); return [rows.length]; },
    };
  }
  return db as DbObject;
}
const actor = { id: 1, requestId: randomUUID() };
const base = { idade_maxima: 65, name: 'Teste', data_publicacao: '2026-01-01', vigencia_inicio: '2026-01-01', data_vencimento: '2028-12-31', inscricoes_inicio: '2026-10-01T09:00:00-03:00', inscricoes_fim: '2026-10-30T17:00:00-03:00', vagas: 2, dia_pagamento: 5, valor_bolsa: 900, carga_semanal: 30, carga_mensal: 180, duracao_meses: 6, prorrogacao_meses: 3, permitir_participacao_anterior: true, permitir_retorno: true };
const answers = { desempregado: true, possui_renda: false, recebe_previdencia: false, inicio_residencia: '2020-01-01', vulnerabilidade_atestada: true, beneficiario_familiar: false, aceite: true };
async function fixture() {
  const db = database();
  const crypto = { encrypt: async (v: string) => v, decrypt: async (v: string) => v } as unknown as AesCryptService;
  const service = new EditalWorkflowService(db, crypto, () => new Date('2026-10-22T12:00:00-03:00'));
  const e = await service.create(base, actor);
  const person = await db.MunicipeModel.create({ nome: 'Pessoa', nascimento: '1990-01-01', cidade: 'Itapecerica da Serra' });
  const pay = await service.config(e.id, 'pagadores', undefined, { nome: 'Pagador', quantidade: 2 }, actor);
  const shift = await service.config(e.id, 'turnos', undefined, { nome: 'Manhã', hora_inicio: '08:00', hora_fim: '14:00' }, actor);
  const local = await service.config(e.id, 'locais', undefined, { nome: 'Local', descricao: 'Teste' }, actor);
  const allocation = { pagador_id: pay.uuid, turno_id: shift.uuid, local: 'Local informado', data_inicio: '2026-10-22' };
  return { db, service, e, person, pay, shift, local, allocation };
}
test('workflow preserves reservation on activation rollback and keeps history when cancelling', async () => {
  const { db, service, e, person, allocation } = await fixture();
  await service.phase(e.id, 'aberto', actor);
  const inscription = await service.register(e.id, { municipe_uuid: person.uuid, respostas: answers }, actor, false);
  assert.equal((await service.inscriptions(e.id, {})).rows[0].nome, 'Pessoa');
  assert.equal(await db.PaymentInfo.count(), 0);
  const called = await service.call(e.id, inscription.id, allocation, actor);
  assert.equal((await service.inscriptions(e.id, {})).rows[0].situacao, 'convocado');
  assert.equal((await service.detail(e.id)).reservadas, 1);
  assert.equal((await service.participations(e.id, { status: 'convocado' })).count, 1);
  await assert.rejects(service.transition(e.id, called.id, 'ativar', { data_inicio: '2026-10-22', payment_info: {} }, actor));
  assert.equal((await service.detail(e.id)).reservadas, 1);
  assert.equal(await db.PaymentInfo.count(), 0);
  await service.transition(e.id, called.id, 'alocar', allocation, actor);
  await service.transition(e.id, called.id, 'ativar', { data_inicio: '2026-10-22', payment_info: { bco: '001', ag: '1234', dig_ag: '0', conta: '1234', dig_conta: '1' } }, actor);
  assert.equal(await service.pdfParticipant(e.id, called.id, '2026-10'), inscription.bolsista_id);
  await assert.rejects(service.pdfParticipant(e.id, called.id, '2025-01'));
  await assert.rejects(service.pdfParticipant(e.id, randomUUID(), '2026-10'));
  assert.equal((await service.detail(e.id)).ocupadas, 1);
  await service.record(e.id, called.id, 'faltas', { data_falta: '2026-10-22', observacao: 'Teste' }, actor);
  const record = (await service.records(e.id, called.id, 'faltas', {})).rows[0];
  await service.record(e.id, called.id, 'faltas', {}, actor, record.id);
  assert.equal((await service.records(e.id, called.id, 'faltas', {})).count, 0);
  await service.transition(e.id, called.id, 'prorrogar', { meses: 1 }, actor);
  await assert.rejects(service.transition(e.id, called.id, 'prorrogar', { meses: 1 }, actor));
  await service.transition(e.id, called.id, 'cancelar', { motivo: 'Encerrado' }, actor);
  assert.equal((await service.detail(e.id)).disponiveis, 2);
  assert.equal((await service.participations(e.id, {})).count, 1);
});
test('configuration scopes, mutations, capacity floor, locks and opening requirements', async () => {
  const { service, e, person, pay, local, allocation } = await fixture();
  await service.update(e.id, { ...base, name: 'Atualizado' }, actor);
  assert.equal((await service.list({ search: 'Atualizado' })).count, 1);
  assert.equal((await service.configs(e.id, 'pagadores', {})).rows[0].ocupacao, 0);
  await service.config(e.id, 'locais', local.id, { nome: 'Local atualizado', descricao: 'Texto' }, actor);
  const benefit = await service.config(e.id, 'beneficios', undefined, { nome: 'Cesta', descricao: 'Mensal' }, actor);
  await service.config(e.id, 'beneficios', benefit.id, null, actor);
  await assert.rejects(service.config(e.id, 'turnos', undefined, { nome: 'Ruim', hora_inicio: '14:00', hora_fim: '08:00' }, actor));
  await service.phase(e.id, 'aberto', actor);
  await service.window(e.id, { inscricoes_inicio: base.inscricoes_inicio, inscricoes_fim: '2026-10-31T17:00:00-03:00', motivo: 'Novo prazo' }, actor);
  const inscription = await service.register(e.id, { municipe_uuid: person.uuid, respostas: answers }, actor, false);
  await assert.rejects(service.register(e.id, { municipe_uuid: person.uuid, respostas: answers }, actor, false));
  const called = await service.call(e.id, inscription.id, allocation, actor);
  await assert.rejects(service.config(e.id, 'pagadores', pay.uuid, { nome: 'Pagador', quantidade: 0 }, actor));
  await assert.rejects(service.config(e.id, 'pagadores', pay.uuid, null, actor));
  await assert.rejects(service.config(e.id, 'beneficios', undefined, { nome: 'Outro', descricao: 'Teste' }, actor));
  await service.phase(e.id, 'encerrado', actor);
  assert.equal((await service.participations(e.id, {})).rows.find((r: any) => r.id === called.id).status, 'cancelado');
  await assert.rejects(service.transition(e.id, called.id, 'ativar', {}, actor));
  await assert.rejects(service.detail(randomUUID()));
});

test('invalid scopes and incomplete lifecycle actions cannot create or mutate participation', async () => {
  const { service, e, allocation } = await fixture();
  assert.equal((await service.list({})).count, 1);
  assert.equal((await service.configs(e.id, 'locais', { page: 0, limit: 10 })).count, 1);
  await assert.rejects(service.call(e.id, randomUUID(), allocation, actor));
  await assert.rejects(service.transition(e.id, randomUUID(), 'cancelar', { motivo: 'Teste' }, actor));
  await assert.rejects(service.records(e.id, randomUUID(), 'faltas', {}));
  await assert.rejects(service.record(e.id, randomUUID(), 'ocorrencias', { descricao: 'Teste' }, actor));
  await assert.rejects(service.register(e.id, { municipe_uuid: randomUUID(), respostas: answers }, actor, false));
  await assert.rejects(service.config(e.id, 'locais', randomUUID(), { nome: 'Local', descricao: '' }, actor));
  await assert.rejects(service.config(e.id, 'locais', undefined, { nome: '  ', descricao: '' }, actor));
  const incomplete = await service.create({ ...base, name: 'Sem configurações' }, actor);
  assert.equal((await service.phase(incomplete.id, 'aberto', actor)).fase, 'aberto');
  await assert.rejects(service.update(e.id, { ...base, inscricoes_fim: '2026-10-31T17:00:00-03:00' }, actor));
  await service.phase(e.id, 'aberto', actor);
  await assert.rejects(service.phase(e.id, 'aberto', actor));
});

test('registration and convocation exceptions are separate and activation preserves only convocation authority', async () => {
  const { db, service, e, person, allocation } = await fixture();
  await person.update({ nascimento: '1950-01-01' });
  await service.phase(e.id, 'aberto', actor);
  const data = { municipe_uuid: person.uuid, respostas: answers, motivo: 'Atendimento excepcional autorizado' };
  await assert.rejects(service.register(e.id, data, actor, false), /Idade permitida/);
  await assert.rejects(service.register(e.id, { ...data, motivo: ' ' }, actor, false, true), /justificativa/);
  const inscription = await service.register(e.id, data, actor, false, true);
  const recorded = (await service.inscriptions(e.id, {})).rows[0];
  assert.equal(recorded.excecao_autor_id, '1');
  assert.equal(recorded.excecao_motivo, data.motivo);
  await assert.rejects(service.register(e.id, data, actor, false, true), /ja inscrita/);
  await assert.rejects(service.call(e.id, inscription.id, allocation, actor), /Idade permitida/);
  await assert.rejects(service.call(e.id, inscription.id, allocation, actor, true), /justificativa/);
  const called = await service.call(e.id, inscription.id, { ...allocation, motivo: 'Convocacao excepcional autorizada' }, actor, true);
  assert.equal(called.excecao_autor_id, '1');
  await assert.rejects(service.transition(e.id, called.id, 'ativar', { data_inicio: allocation.data_inicio, payment_info: {} }, actor), /pagamento/);
  assert.equal((await service.detail(e.id)).reservadas, 1);
  await service.transition(e.id, called.id, 'ativar', { data_inicio: allocation.data_inicio, payment_info: { bco: '001', ag: '1234', dig_ag: '0', conta: '1234', dig_conta: '1' } }, actor);
  assert.equal((await service.detail(e.id)).ocupadas, 1);
  const actions = (await db.FtWorkflowEvento.findAll()).map((row: any) => row.acao);
  assert.ok(actions.includes('inscrever_excecao') && actions.includes('convocar_excecao'));
});

test('exceptions bypass closed registration window and history but preserve concurrency and same-edital uniqueness', async () => {
  const { db, service, e, person, allocation } = await fixture();
  await service.phase(e.id, 'aberto', actor);
  await service.update(e.id, { ...base, permitir_participacao_anterior: false, permitir_retorno: false }, actor);
  await service.window(e.id, { inscricoes_inicio: base.inscricoes_inicio, inscricoes_fim: '2026-10-21T17:00:00-03:00', motivo: 'Prazo reduzido' }, actor);
  const [identity] = await db.Bolsistas.findOrCreate({ where: { municipe_uuid: person.uuid }, defaults: { municipe_uuid: person.uuid } });
  const past = await db.BolsistasEdital.create({ edital_id: randomUUID(), bolsista_id: identity.id, status: 'concluido', ativado_em: '2026-10-01', concluded_at: '2026-10-21' });
  const data = { municipe_uuid: person.uuid, respostas: answers, motivo: 'Excecao autorizada' };
  await assert.rejects(service.register(e.id, data, actor, false), /fora do prazo/);
  await assert.rejects(service.register(e.id, data, actor, true), /anteriormente/);
  const inscription = await service.register(e.id, data, actor, false, true);
  await assert.rejects(service.call(e.id, inscription.id, allocation, actor), /anteriormente/);
  await db.BolsistasEdital.update({ edital_id: e.id }, { where: { id: past.id } });
  await assert.rejects(service.call(e.id, inscription.id, allocation, actor), /retorno/);
  const called = await service.call(e.id, inscription.id, { ...allocation, motivo: data.motivo }, actor, true);
  await assert.rejects(service.call(e.id, inscription.id, { ...allocation, motivo: data.motivo }, actor, true), /ja convocada/);
  await service.transition(e.id, called.id, 'cancelar', { motivo: 'Encerrado' }, actor);
  await service.call(e.id, inscription.id, { ...allocation, motivo: data.motivo }, actor, true);
});

test('missing age blocks all new operations and initial filling remains possible after first convocation', async () => {
  const { db, service, e, person, allocation } = await fixture();
  await service.phase(e.id, 'aberto', actor);
  const inscription = await service.register(e.id, { municipe_uuid: person.uuid, respostas: answers }, actor, false);
  const called = await service.call(e.id, inscription.id, allocation, actor);
  await db.Edital.update({ idade_maxima: null }, { where: { id: e.id } });
  await assert.rejects(service.transition(e.id, called.id, 'ativar', { data_inicio: allocation.data_inicio }, actor), /idade maxima/);
  await assert.rejects(service.call(e.id, inscription.id, { ...allocation, motivo: 'Autorizado' }, actor, true), /idade maxima/);
  await assert.rejects(service.register(e.id, { municipe_uuid: person.uuid, respostas: answers, motivo: 'Autorizado' }, actor, false, true), /idade maxima/);
  await service.update(e.id, { ...base, idade_maxima: 70 }, actor);
  assert.equal((await service.detail(e.id)).idade_maxima, 70);
  await assert.rejects(service.update(e.id, { ...base, idade_maxima: 71 }, actor), /Idade maxima bloqueada/);
  await assert.rejects(service.create({ ...base, idade_maxima: undefined }, actor), /idade maxima/);
});

test('exception never authorizes before opening, minors, missing birth, invalid declarations or allocations', async () => {
  const { db, service, e, person, allocation } = await fixture();
  await service.phase(e.id, 'aberto', actor);
  const data = { municipe_uuid: person.uuid, respostas: answers, motivo: 'Autorizado' };
  await service.window(e.id, { inscricoes_inicio: '2026-10-23T09:00:00-03:00', inscricoes_fim: base.inscricoes_fim, motivo: 'Abertura adiada' }, actor);
  await assert.rejects(service.register(e.id, data, actor, false, true), /nao iniciadas/);
  await service.window(e.id, { inscricoes_inicio: base.inscricoes_inicio, inscricoes_fim: base.inscricoes_fim, motivo: 'Abertura restaurada' }, actor);
  for (const nascimento of [null, '2009-01-01', '2026-02-30']) {
    await db.MunicipeModel.update({ nascimento }, { where: { uuid: person.uuid } });
    await assert.rejects(service.register(e.id, data, actor, false, true));
  }
  await db.MunicipeModel.update({ nascimento: '1950-01-01' }, { where: { uuid: person.uuid } });
  await assert.rejects(service.register(e.id, { ...data, respostas: { ...answers, aceite: false } }, actor, false, true), /Declaracoes/);
  const inscription = await service.register(e.id, data, actor, false, true);
  await assert.rejects(service.call(e.id, inscription.id, { ...allocation, pagador_id: randomUUID(), motivo: 'Autorizado' }, actor, true), /neste edital/);
  assert.equal((await service.detail(e.id)).reservadas, 0);
});

test('opens without configuration and accepts free-text location when reserving and activating', async () => {
  const { db, service, person } = await fixture();
  const e = await service.create({ ...base, name: 'Sem configuração prévia' }, actor);
  assert.equal((await service.phase(e.id, 'aberto', actor)).fase, 'aberto');
  const registration = await service.register(e.id, { municipe_uuid: person.uuid, respostas: answers }, actor, false);
  await assert.rejects(service.call(e.id, registration.id, { pagador_id: randomUUID(), turno_id: randomUUID(), local: 'Secretaria', data_inicio: '2026-10-22' }, actor), /neste edital/);
  const payer = await service.config(e.id, 'pagadores', undefined, { nome: 'Pagador', quantidade: 1 }, actor);
  const shift = await service.config(e.id, 'turnos', undefined, { nome: 'Manhã', hora_inicio: '08:00', hora_fim: '14:00' }, actor);
  const data = { pagador_id: payer.uuid, turno_id: shift.uuid, local: '  Secretaria de Obras  ', data_inicio: '2026-10-22' };
  for (const local of [undefined, '', '   ', 'x'.repeat(256)]) await assert.rejects(service.call(e.id, registration.id, { ...data, local }, actor), /local de trabalho/);
  const called = await service.call(e.id, registration.id, data, actor);
  assert.equal(called.local, 'Secretaria de Obras');
  assert.equal(called.local_id, null);
  assert.equal(await db.FtEditalLocal.count({ where: { edital_id: e.id } }), 0);
  await service.transition(e.id, called.id, 'alocar', { ...data, local: 'Biblioteca' }, actor);
  await service.transition(e.id, called.id, 'ativar', { data_inicio: data.data_inicio, payment_info: { bco: '001', ag: '1234', dig_ag: '0', conta: '1234', dig_conta: '1' } }, actor);
  assert.equal((await service.participations(e.id, {})).rows[0].local, 'Biblioteca');
  assert.equal((await service.detail(e.id)).ocupadas, 1);
});
