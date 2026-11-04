import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

/** Called only by the guarded, empty/disposable-schema FT harness. */
export async function testEditaisUX({ db, crypto, service, actor, base, answers, makeEdital }: any) {
  const prefix = 'UX_' + randomUUID().slice(0, 8);
  const draft = await service.create({ ...base, name: prefix + ' rascunho' }, actor);
  const open = await service.create({ ...base, name: prefix + ' aberto' }, actor);
  await service.phase(open.id, 'aberto', actor); // No payers or shifts required for opening.
  const later = await service.create({ ...base, name: prefix + ' futuro', inscricoes_inicio: '2026-10-23T12:00:00Z' }, actor);
  await service.phase(later.id, 'aberto', actor);
  const ended = await service.create({ ...base, name: prefix + ' prazo encerrado', inscricoes_fim: '2026-10-21T20:00:00Z' }, actor);
  await service.phase(ended.id, 'aberto', actor);
  await service.create({ ...base, name: prefix.replace('_', 'X') + ' falso positivo' }, actor);
  assert.equal((await service.list({ search: prefix })).count, 4, 'SQL escapes literal underscore');
  assert.equal((await service.list({ search: prefix, fase: 'rascunho' })).count, 1);
  const filtered = await service.list({ search: prefix, inscricoes_abertas: true, limit: 1 });
  assert.equal(filtered.count, 1);
  assert.equal(filtered.rows[0].id, open.id);
  assert.equal((await service.list({ search: prefix, inscricoes_abertas: true, fase: 'rascunho' })).count, 0);
  assert.equal((await service.list({ search: prefix, page: 1, limit: 2 })).rows.length, 2);
  assert.equal((await service.detail(draft.id)).edicao.campos_bloqueados.valor_bolsa, undefined);

  const e = await makeEdital({ name: prefix + ' pessoas', vagas: 5, permitir_retorno: true });
  const person = await db.MunicipeModel.create({ nome: prefix + ' Pessoa', cpf: await crypto.encrypt('00000000999'), cpfHash: prefix, nascimento: await crypto.encrypt('1990-01-01'), cidade: await crypto.encrypt('Itapecerica da Serra'), telefone: await crypto.encrypt('11999990000'), rua: await crypto.encrypt('Rua Teste'), bairro: await crypto.encrypt('Centro'), uf: await crypto.encrypt('SP'), cep: await crypto.encrypt('06850000'), cepHash: prefix, numero: await crypto.encrypt('1'), author: '1' });
  const r = await service.register(e.id, { municipe_uuid: person.uuid, respostas: answers }, actor, false);
  const ids = [];
  for (const status of ['cancelado', 'concluido', 'expirado', 'inativo']) {
    const p = await service.call(e.id, r.id, e.allocation, actor);
    await service.transition(e.id, p.id, 'cancelar', { motivo: 'Fim de tentativa sintética' }, actor);
    await db.BolsistasEdital.update({ status }, { where: { id: p.id } });
    ids.push(p.id);
  }
  const current = await service.call(e.id, r.id, e.allocation, actor);
  const first = await service.participations(e.id, { grupo_status: 'encerrados', limit: 2 });
  const second = await service.participations(e.id, { grupo_status: 'encerrados', limit: 2, page: 1 });
  assert.equal(first.count, 4);
  assert.equal(second.count, 4);
  assert.deepEqual(new Set([...first.rows, ...second.rows].map((p: any) => p.id)), new Set(ids));
  assert.ok(!first.rows.some((p: any) => p.id === current.id));
  assert.equal((await service.inscriptions(e.id, {})).count, 1, 'Registration remains one record, returns retain participation IDs');
  const metadata = (await service.detail(e.id)).edicao;
  assert.equal(metadata.vagas_minimas, 1);
  assert.ok(metadata.campos_bloqueados.valor_bolsa);
  await assert.rejects(service.update(e.id, { ...base, vagas: 5, name: e.name, valor_bolsa: 901, permitir_retorno: true }, actor), /bloqueadas/);
  console.log('PASS edital SQL filters/counts, phase/window distinction, no opening prerequisites, editing metadata and distinct ended participation pages');
}
