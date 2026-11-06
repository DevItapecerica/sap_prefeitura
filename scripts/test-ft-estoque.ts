import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { EstoqueService } from '../src/modules/ft-estoque/estoque.service.js';
import { makeAuditService } from '../src/modules/audit/factories/makeAuditService.js';

/** Only invoked by the empty-schema, local-only guarded workflow harness. */
export async function testEstoque({ db, crypto, service: workflow, actor, answers, makeEdital }: any) {
  const service = new EstoqueService(db, makeAuditService(), () => new Date('2026-11-03T15:00:00Z'));
  const op = () => ({ operacao_id: randomUUID() });
  const e = await makeEdital({ name: 'Estoque SQL', vagas: 10 });
  async function participant() {
    const key = randomUUID();
    const person = await db.MunicipeModel.create({ nome: 'Pessoa estoque ' + key, cpf: await crypto.encrypt('01234567890'), nascimento: await crypto.encrypt('1990-01-01'),
      telefone: await crypto.encrypt('11999990000'), rua: await crypto.encrypt('Rua Teste'), bairro: await crypto.encrypt('Centro'), cidade: await crypto.encrypt('Itapecerica da Serra'),
      uf: await crypto.encrypt('SP'), cep: await crypto.encrypt('06850000'), numero: await crypto.encrypt('1'), cpfHash: createHash('sha256').update(key).digest('hex'), cepHash: key, author: '1' });
    const registration = await workflow.register(e.id, { municipe_uuid: person.uuid, respostas: answers }, actor, false);
    return workflow.call(e.id, registration.id, e.allocation, actor);
  }
  async function product(nome: string, epi: boolean, tamanho: string, saldo: number) {
    const item = await service.saveItem(undefined, { ...op(), nome, epi }, actor);
    const variation = await service.saveVariation(item.id, undefined, { ...op(), tamanho, custo_unitario: 80.01 }, actor);
    if (saldo) await service.stock(variation.id, { ...op(), quantidade: saldo }, actor, false);
    return { item, variation };
  }
  const boot = await product('Bota', true, '38', 10), glove = await product('Luva', true, 'Único', 10), book = await product('Caderno', false, 'Único', 10);
  const size42 = await service.saveVariation(boot.item.id, undefined, { ...op(), tamanho: '42', custo_unitario: 100 }, actor);
  await service.stock(size42.id, { ...op(), quantidade: 1 }, actor, false);
  await assert.rejects(service.saveVariation(boot.item.id, undefined, { ...op(), tamanho: ' 38 ', custo_unitario: 0 }, actor), /cadastrado/);
  const p1 = await participant(), p2 = await participant();
  assert.ok((await service.recipients({})).rows.some((p: any) => p.id === p1.id));
  const identity = await db.Bolsistas.findByPk(p1.bolsista_id);
  await db.MunicipeModel.update({ cpfHash: createHash('sha256').update('98765432100').digest('hex') }, { where: { uuid: identity.municipe_uuid } });
  assert.equal((await service.recipients({ search: '987.654.321-00' })).rows[0].id, p1.id);
  assert.equal((await service.items({ tamanho: '38' })).rows[0].id, boot.item.id);
  assert.equal((await service.items({ epi: false })).count, 1);
  const preview = await service.preview(p1.id);
  const body = { ...op(), participacao_id: p1.id, versao: preview.versao, itens: [{ variacao_id: boot.variation.id, quantidade: 1 }, { variacao_id: glove.variation.id, quantidade: 1 }] };
  const repeated = await Promise.all([service.deliver('kit', body, actor), service.deliver('kit', body, actor)]);
  assert.equal(repeated[0].id, repeated[1].id);
  assert.equal((await service.variation(boot.variation.id)).saldo, 9);
  assert.equal((await service.variation(size42.id)).saldo, 1);
  await assert.rejects(service.deliver('kit', { ...body, ...op() }, actor), /já recebeu/);
  // Database uniqueness protects a second active kit even outside the service.
  await assert.rejects(db.FtEstoqueEntrega.create({ ...repeated[0], id: randomUUID() }));
  const lastPairBody = (p: any) => ({ ...op(), participacao_id: p.id, versao: preview.versao, itens: [{ variacao_id: size42.id, quantidade: 1 }, { variacao_id: glove.variation.id, quantidade: 1 }] });
  const p3 = await participant();
  const race = await Promise.allSettled([service.deliver('kit', lastPairBody(p2), actor), service.deliver('kit', lastPairBody(p3), actor)]);
  assert.equal(race.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal((await service.variation(size42.id)).saldo, 0);
  assert.equal((await service.variation(glove.variation.id)).saldo, 8, 'failed kit must not consume any line');
  const entry = { ...op(), quantidade: 2 };
  const stock = await Promise.all([service.stock(book.variation.id, entry, actor, false), service.stock(book.variation.id, entry, actor, false)]);
  assert.equal(stock[0].id, stock[1].id); assert.equal((await service.variation(book.variation.id)).saldo, 12);
  await assert.rejects(service.stock(book.variation.id, { ...op(), quantidade: -13, justificativa: 'Contagem física' }, actor, true));
  assert.equal((await service.variation(book.variation.id)).saldo, 12);
  const indiv = { ...op(), participacao_id: p1.id, versao: preview.versao, itens: [{ variacao_id: book.variation.id, quantidade: 2 }], justificativa: 'Entrega individual autorizada' };
  await assert.rejects(service.deliver('individual', { ...indiv, justificativa: '' }, actor), /justificativa/);
  const deliveredBook = await service.deliver('individual', indiv, actor);
  await service.saveItem(book.item.id, { ...op(), nome: 'Caderno alterado', epi: false }, actor);
  await service.saveVariation(book.item.id, book.variation.id, { ...op(), tamanho: 'Único', custo_unitario: 999.99 }, actor);
  const detail = await service.delivery(deliveredBook.id);
  assert.equal(detail.itens[0].nome, 'Caderno'); assert.equal(detail.itens[0].custo_centavos, 8001); assert.equal(detail.total_centavos, 16002);
  await assert.rejects(service.deliver('individual', { ...indiv, ...op() }, actor), /custos mudaram/);
  const before = await db.FtEstoqueMovimento.count();
  const fail = new EstoqueService(db, { record: async () => { throw new Error('Synthetic audit failure'); } });
  await assert.rejects(fail.stock(book.variation.id, { ...op(), quantidade: 1 }, actor, false), /audit failure/);
  assert.equal(await db.FtEstoqueMovimento.count(), before); assert.equal((await service.variation(book.variation.id)).saldo, 10);
  await service.reverse(repeated[0].id, { ...op(), justificativa: 'Kit registrado por engano' }, actor);
  const newKit = await service.deliver('kit', { ...body, ...op(), versao: (await service.preview(p1.id)).versao }, actor);
  assert.notEqual(newKit.id, repeated[0].id, 'estorno must release a new eligible kit');
  const reversal = { ...op(), justificativa: 'Entrega registrada por engano' };
  const last = await participant();
  const closingBody = { ...body, ...op(), participacao_id: last.id, versao: (await service.preview(last.id)).versao };
  const closingRace = await Promise.allSettled([workflow.phase(e.id, 'encerrado', actor), service.deliver('kit', closingBody, actor)]);
  assert.equal(closingRace[0].status, 'fulfilled');
  if (closingRace[1].status === 'rejected') assert.match(closingRace[1].reason.message, /vigente|convocados/);
  assert.equal((await db.BolsistasEdital.findByPk(last.id)).status, 'cancelado');
  await Promise.all([service.reverse(deliveredBook.id, reversal, actor), service.reverse(deliveredBook.id, reversal, actor)]);
  assert.equal((await service.variation(book.variation.id)).saldo, 12);
  await assert.rejects(service.reverse(deliveredBook.id, { ...op(), justificativa: 'Outra tentativa' }, actor), /já estornada/);
  await service.reverse(newKit.id, { ...op(), justificativa: 'Estorno de kit' }, actor);
  assert.equal((await db.FtEstoqueEntrega.findByPk(newKit.id)).kit_ativo_participacao_id, null);
  await assert.rejects(service.deliver('kit', { ...body, ...op() }, actor), /vigente/);
  await service.saveVariation(book.item.id, book.variation.id, { ...op() }, actor, true);
  assert.equal((await service.variation(book.variation.id)).saldo, 12);
  assert.ok((await service.movements({})).rows.every((r: any) => r.nome && r.tamanho && r.responsavel));
  assert.equal((await service.deliveries({ participacao_id: p1.id })).count, 3);
  const history = await service.deliveries({ search: '987.654.321-00', limit: 1 });
  assert.equal(history.count, 3); assert.equal(history.rows.length, 1);
  assert.equal((await service.deliveries({ search: "Pessoa' OR 1=1 --" })).count, 0);
  const complete = { ...op(), nome: 'Cadastro conjunto', epi: false, tamanhos: [{ tamanho: 'M', custo_unitario: 12.34, quantidade_inicial: 2 }, { tamanho: 'G', custo_unitario: 13.45, quantidade_inicial: 0 }] };
  const initialMovements = await db.FtEstoqueMovimento.count();
  const created = await Promise.all([service.createComplete(complete, actor), service.createComplete(complete, actor)]);
  assert.equal(created[0].id, created[1].id); assert.equal(created[0].variacoes[0].saldo, 2);
  assert.equal(await db.FtEstoqueMovimento.count(), initialMovements + 1);
  const summary = (await service.items({ search: 'Cadastro conjunto' })).rows[0];
  assert.equal(summary.saldo_total, 2); assert.equal(summary.tamanhos_ativos, 2);
  const itemsBefore = await db.FtEstoqueItem.count();
  await assert.rejects(fail.createComplete({ ...complete, ...op(), nome: 'Rollback conjunto' }, actor), /audit failure/);
  assert.equal(await db.FtEstoqueItem.count(), itemsBefore);
  assert.equal(await db.FtEstoqueMovimento.count(), initialMovements + 1);
  console.log('PASS UX stock: complete atomic registration, concurrent retries, initial entries, summary totals, SQL history filters and audit rollback');
  const migration = (await import('../src/infra/database/sequelize/migrations/20261103120000-ft-estoque-epi.js')).default;
  await assert.rejects(migration.down(db.sequelize.getQueryInterface()), /Rollback refused/);
  console.log('PASS stock SQL: normalized sizes, filters, zero opening balance, idempotent/concurrent entries and kits, last stock race, SQL uniqueness, full rollback, costs/snapshots, closed-edital reversal, audit rollback and history');
}
