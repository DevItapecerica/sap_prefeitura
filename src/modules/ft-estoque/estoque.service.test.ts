import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Op } from 'sequelize';
import { EstoqueService, cents, reason } from './estoque.service.js';

function fixture() {
  let tables: any = {};
  const matches = (r: any, where: any = {}) => Object.entries(where).every(([key, condition]: any) => {
    if (condition && typeof condition === 'object') {
      if (Op.ne in condition) return r[key] !== condition[Op.ne];
      if (Op.in in condition) return condition[Op.in].includes(r[key]);
    }
    return r[key] === condition;
  });
  const tx = { LOCK: { UPDATE: 'UPDATE' } };
  const db: any = { sequelize: { transaction: async (fn: any) => { const backup = structuredClone(tables); try { return await fn(tx); } catch (e) { tables = backup; throw e; } } } };
  for (const name of ['FtEstoqueControle', 'FtEstoqueItem', 'FtEstoqueVariacao', 'FtEstoqueEntrega', 'FtEstoqueEntregaItem', 'FtEstoqueMovimento', 'FtEstoqueOperacao', 'BolsistasEdital', 'Edital', 'Bolsistas', 'MunicipeModel', 'UserModel']) {
    tables[name] = [];
    const wrap = (r: any): any => r && new Proxy(r, { get(target, key) {
      if (key === 'toJSON') return () => ({ ...target });
      if (key === 'update') return async (data: any) => { Object.assign(target, data); return wrap(target); };
      if (key === 'increment') return async (field: string) => { target[field]++; };
      return target[key];
    } });
    const all = (q: any = {}) => tables[name].filter((r: any) => matches(r, q.where));
    db[name] = { create: async (data: any) => { const r = { id: randomUUID(), ativo: true, ...data }; tables[name].push(r); return wrap(r); },
      findByPk: async (id: any, options: any = {}) => { if (name === 'FtEstoqueControle' && options.transaction) assert.equal(options.lock, 'UPDATE'); return wrap(tables[name].find((r: any) => r.id === id)); },
      findOne: async (q: any) => wrap(all(q)[0]), findAll: async (q: any = {}) => all(q).map(wrap),
      findAndCountAll: async (q: any = {}) => ({ rows: all(q).slice(q.offset || 0, (q.offset || 0) + (q.limit || 20)).map(wrap), count: all(q).length }) };
  }
  tables.FtEstoqueControle.push({ id: 1, versao: 0 });
  tables.Edital.push({ id: 'edital', name: 'Edital', fase: 'aberto', vigencia_inicio: '2026-01-01', data_publicacao: '2026-01-01', data_vencimento: '2026-12-31' });
  tables.BolsistasEdital.push({ id: 'participacao', edital_id: 'edital', bolsista_id: 'bolsista', status: 'convocado', expire_at: '2026-12-31' });
  tables.Bolsistas.push({ id: 'bolsista', municipe_uuid: 'person' }); tables.MunicipeModel.push({ id: 'person', nome: 'Pessoa' }); tables.UserModel.push({ id: '1', name: 'Operador' });
  const auditRows: any[] = [];
  let auditFailure = false;
  const service = new EstoqueService(db, { record: async (data: any, transaction: any) => { assert.equal(transaction, tx); if (auditFailure) throw new Error('audit unavailable'); auditRows.push(data); } }, () => new Date('2026-11-03T15:00:00Z'));
  return { db, service, table: (name: string) => tables[name], auditRows, failAudit: () => { auditFailure = true; } };
}
const actor = { id: 1, requestId: 'test' }, op = () => ({ operacao_id: randomUUID() });
async function stocked(f: ReturnType<typeof fixture>, nome: string, epi = true, tamanho = 'Único', saldo = 5) {
  const item = await f.service.saveItem(undefined, { ...op(), nome, epi }, actor);
  const variation = await f.service.saveVariation(item.id, undefined, { ...op(), tamanho, custo_unitario: 80.01 }, actor);
  if (saldo) await f.service.stock(variation.id, { ...op(), quantidade: saldo }, actor, false);
  return { item, variation };
}
async function payload(f: ReturnType<typeof fixture>, ids: string[]) {
  return { ...op(), participacao_id: 'participacao', versao: (await f.service.preview('participacao')).versao, itens: ids.map(variacao_id => ({ variacao_id, quantidade: 1 })) };
}

test('complete registration creates sizes and opening entries once, with accurate list summaries', async () => {
  const f = fixture(), data = { ...op(), nome: 'Bota', epi: true, tamanhos: [{ tamanho: '38', custo_unitario: 90.01, quantidade_inicial: 3 }, { tamanho: '42', custo_unitario: 100, quantidade_inicial: 0 }] };
  const result = await f.service.createComplete(data, actor);
  assert.equal(result.variacoes.length, 2); assert.equal(result.variacoes[0].saldo, 3); assert.equal(result.variacoes[1].saldo, 0);
  assert.equal(f.table('FtEstoqueMovimento').length, 1); assert.equal(f.table('FtEstoqueMovimento')[0].tipo, 'entrada');
  assert.equal((await f.service.createComplete(data, actor)).id, result.id);
  assert.equal(f.table('FtEstoqueItem').length, 1); assert.equal(f.table('FtEstoqueMovimento').length, 1);
  const list = await f.service.items({}); assert.equal(list.rows[0].tamanhos_ativos, 2); assert.equal(list.rows[0].saldo_total, 3);
  await f.service.saveVariation(result.id, result.variacoes[0].id, { ...op() }, actor, true);
  const after = await f.service.items({}); assert.equal(after.rows[0].tamanhos_ativos, 1); assert.equal(after.rows[0].saldo_total, 0);
});

test('complete registration rejects empty or duplicate sizes and rolls back all rows on audit failure', async () => {
  const f = fixture(), base = { nome: 'Bota', epi: true, tamanhos: [{ tamanho: '38', custo_unitario: 90.01, quantidade_inicial: 3 }] };
  for (const tamanhos of [[], [...base.tamanhos, { tamanho: ' 38 ', custo_unitario: 10 }], [{ tamanho: '38', custo_unitario: 10, quantidade_inicial: -1 }]]) {
    await assert.rejects(f.service.createComplete({ ...base, ...op(), tamanhos }, actor));
    assert.equal(f.table('FtEstoqueItem').length, 0);
  }
  f.failAudit();
  await assert.rejects(f.service.createComplete({ ...base, ...op() }, actor), /audit unavailable/);
  for (const table of ['FtEstoqueItem', 'FtEstoqueVariacao', 'FtEstoqueMovimento', 'FtEstoqueOperacao']) assert.equal(f.table(table).length, 0);
});

test('costs, reasons and normalized size uniqueness are enforced without rewriting balances', async () => {
  assert.equal(cents(900.01), 90001); assert.equal(cents(0), 0);
  for (const value of [-1, NaN, 1.001, 10000000]) assert.throws(() => cents(value));
  assert.throws(() => reason('  ')); assert.equal(reason(' motivo '), 'motivo');
  const f = fixture(), { item, variation } = await stocked(f, 'Bota', true, '38');
  await assert.rejects(f.service.saveVariation(item.id, undefined, { ...op(), tamanho: ' 38 ', custo_unitario: 1 }, actor), /cadastrado/);
  await f.service.saveVariation(item.id, variation.id, { ...op(), tamanho: '38', custo_unitario: 99.99, ativo: false }, actor);
  assert.equal((await f.service.variation(variation.id)).saldo, 5);
  await assert.rejects(f.service.saveVariation(item.id, undefined, { ...op(), tamanho: '38', custo_unitario: 1 }, actor));
  await f.service.saveItem(item.id, { ...op() }, actor, true);
  assert.equal((await f.service.variation(variation.id)).saldo, 5);
});

test('entries and signed justified adjustments are idempotent and cannot make stock negative', async () => {
  const f = fixture(), { variation } = await stocked(f, 'Bota');
  const data = { ...op(), quantidade: 2 }, first = await f.service.stock(variation.id, data, actor, false);
  const again = await f.service.stock(variation.id, { quantidade: 2, operacao_id: data.operacao_id }, actor, false);
  assert.equal(first.id, again.id); assert.equal((await f.service.variation(variation.id)).saldo, 7);
  await assert.rejects(f.service.stock(variation.id, { ...data, quantidade: 3 }, actor, false), /outros dados/);
  for (const data of [{ quantidade: -8, justificativa: 'Contagem' }, { quantidade: 0, justificativa: 'Contagem' }, { quantidade: -1 }, { quantidade: 0.5, justificativa: 'Contagem' }]) await assert.rejects(f.service.stock(variation.id, { ...op(), ...data }, actor, true));
  assert.equal((await f.service.variation(variation.id)).saldo, 7);
  await f.service.stock(variation.id, { ...op(), quantidade: -2, justificativa: 'Contagem física' }, actor, true);
  assert.equal((await f.service.variation(variation.id)).saldo, 5);
});

test('kit delivers one selected size per EPI, excludes non-EPI, preserves snapshots and is unique', async () => {
  const f = fixture(), boot = await stocked(f, 'Bota', true, '38'), glove = await stocked(f, 'Luva'), other = await stocked(f, 'Caderno', false);
  const alternate = await f.service.saveVariation(boot.item.id, undefined, { ...op(), tamanho: '42', custo_unitario: 100 }, actor);
  const data = await payload(f, [boot.variation.id, glove.variation.id]);
  const delivery = await f.service.deliver('kit', data, actor);
  assert.equal((await f.service.deliver('kit', data, actor)).id, delivery.id);
  assert.equal((await f.service.variation(boot.variation.id)).saldo, 4);
  assert.equal((await f.service.variation(alternate.id)).saldo, 0);
  assert.equal((await f.service.variation(other.variation.id)).saldo, 5);
  await assert.rejects(f.service.deliver('kit', { ...data, ...op() }, actor), /já recebeu/);
  await f.service.saveItem(boot.item.id, { ...op(), nome: 'Bota alterada', epi: true }, actor);
  await f.service.saveVariation(boot.item.id, boot.variation.id, { ...op(), tamanho: '38', custo_unitario: 999 }, actor);
  const detail = await f.service.delivery(delivery.id);
  assert.equal(detail.itens.find((i: any) => i.variacao_id === boot.variation.id).nome, 'Bota');
  assert.equal(detail.itens.find((i: any) => i.variacao_id === boot.variation.id).custo_centavos, 8001);
  assert.equal(detail.total_centavos, 16002);
});

test('incomplete, duplicate, empty and insufficient kits roll back every line and the delivery', async () => {
  const f = fixture(), boot = await stocked(f, 'Bota'), glove = await stocked(f, 'Luva', true, 'Único', 0);
  const data = await payload(f, [boot.variation.id, glove.variation.id]);
  await assert.rejects(f.service.deliver('kit', data, actor), /Saldo insuficiente/);
  assert.equal((await f.service.variation(boot.variation.id)).saldo, 5); assert.equal(f.table('FtEstoqueEntrega').length, 0);
  await assert.rejects(f.service.deliver('kit', await payload(f, [boot.variation.id]), actor), /cada tipo/);
  await assert.rejects(f.service.deliver('kit', await payload(f, [boot.variation.id, boot.variation.id]), actor), /inválida/);
  await assert.rejects(f.service.deliver('kit', { ...await payload(f, []), itens: [] }, actor));
});

test('individual deliveries require justification, allow non-EPI, and reject changed costs', async () => {
  const f = fixture(), book = await stocked(f, 'Caderno', false), data = await payload(f, [book.variation.id]);
  await assert.rejects(f.service.deliver('individual', data, actor), /justificativa/);
  assert.equal(f.table('FtEstoqueEntrega').length, 0);
  const first = await f.service.deliver('individual', { ...data, justificativa: 'Reposição autorizada' }, actor);
  assert.equal(first.tipo, 'individual'); assert.equal((await f.service.variation(book.variation.id)).saldo, 4);
  await f.service.saveVariation(book.item.id, book.variation.id, { ...op(), tamanho: 'Único', custo_unitario: 100 }, actor);
  await assert.rejects(f.service.deliver('individual', { ...data, ...op(), justificativa: 'Reposição' }, actor), /custos mudaram/);
});

test('estorno returns all stock after closure, preserves originals, and releases a new eligible kit', async () => {
  const f = fixture(), boot = await stocked(f, 'Bota'), data = await payload(f, [boot.variation.id]);
  const d = await f.service.deliver('kit', data, actor);
  f.table('Edital')[0].fase = 'encerrado'; f.table('BolsistasEdital')[0].status = 'concluido';
  const reversal = { ...op(), justificativa: 'Registro equivocado' };
  await f.service.reverse(d.id, reversal, actor); await f.service.reverse(d.id, reversal, actor);
  assert.equal((await f.service.variation(boot.variation.id)).saldo, 5);
  await assert.rejects(f.service.reverse(d.id, { ...op(), justificativa: 'Nova tentativa' }, actor), /já estornada/);
  assert.equal(f.table('FtEstoqueEntregaItem').length, 1);
  await assert.rejects(f.service.preview('participacao'), /vigente/);
  f.table('Edital')[0].fase = 'aberto'; f.table('BolsistasEdital')[0].status = 'ativo';
  const second = await f.service.deliver('kit', await payload(f, [boot.variation.id]), actor);
  assert.notEqual(d.id, second.id);
});

test('ineligible recipients and audit failure cannot consume stock or persist deliveries', async () => {
  const f = fixture(), boot = await stocked(f, 'Bota'), data = await payload(f, [boot.variation.id]);
  for (const status of ['cancelado', 'concluido', 'expirado']) { f.table('BolsistasEdital')[0].status = status; await assert.rejects(f.service.deliver('kit', { ...data, ...op() }, actor)); }
  f.table('BolsistasEdital')[0].status = 'ativo'; f.table('BolsistasEdital')[0].expire_at = '2026-11-02';
  await assert.rejects(f.service.preview('participacao'), /vencidos/);
  f.table('BolsistasEdital')[0].expire_at = '2026-12-31'; f.failAudit();
  await assert.rejects(f.service.deliver('kit', data, actor), /audit unavailable/);
  assert.equal((await f.service.variation(boot.variation.id)).saldo, 5); assert.equal(f.table('FtEstoqueEntrega').length, 0);
});
