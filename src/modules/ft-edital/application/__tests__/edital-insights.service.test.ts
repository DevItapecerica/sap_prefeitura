import assert from 'node:assert/strict';
import test from 'node:test';
import { EditalInsightsService } from '../use-case/edital-insights.service.js';
test('history joins all same-edital attempts, batches actors and marks missing legacy data', async () => {
  const queries: any[] = [];
  const db: any = {
    FtInscricao: { findOne: async (q: any) => { queries.push(q); return q.where.edital_id === 'edital' ? { id: 'registration', createdAt: '2026-01-01' } : null; } },
    BolsistasEdital: { findAll: async (q: any) => { queries.push(q); return [ { id: 'attempt1', inscricao_id: 'registration', status: 'ativo', prorrogated: true }, { id: 'attempt2', inscricao_id: 'registration', status: 'convocado', createdAt: '2026-01-03' } ]; } },
    FtWorkflowEvento: { findAll: async (q: any) => { queries.push(q); return [{ id: 'event', recurso_id: 'attempt2', acao: 'convocar_excecao', createdAt: '2026-01-03', ator_id: '1', motivo: 'Authorized', payment_info: 'secret', respostas: 'secret' }]; } },
    UserModel: { findAll: async () => [{ id: 1, name: 'Operator' }] },
  };
  const service = new EditalInsightsService(db);
  const result = await service.history('edital', 'registration', true, { limit: 50 });
  assert.ok(queries.every(q => q.where.edital_id === 'edital'));
  assert.equal(result.rows.find(row => row.id === 'event').responsavel, 'Operator');
  assert.equal(result.rows.find(row => row.id === 'event').recurso_nome, 'Participação 1');
  assert.equal(result.rows.find(row => row.recurso_id === 'registration').recurso_nome, 'Inscrição');
  const secondPage = await service.history('edital', 'registration', true, { page: 1, limit: 1 });
  assert.equal(secondPage.rows[0].recurso_nome, result.rows[1].recurso_nome);
  assert.equal(result.rows.filter(row => row.recurso_id === 'attempt2' && row.acao === 'convocar').length, 0);
  assert.ok(result.rows.some(row => row.acao === 'prorrogar' && row.data === null && row.responsavel === 'N\u00e3o registrado'));
  assert.ok(result.rows.some(row => row.acao === 'ativar' && row.data === null));
  assert.ok(!JSON.stringify(result).includes('secret'));
  assert.equal((await service.history('edital', 'registration', true, { page: 1, limit: 1 })).count, result.count);
  await assert.rejects(service.history('other', 'registration', true, {}), (e: any) => e.statusCode === 404);
});
