import assert from 'node:assert/strict';
import test from 'node:test';
import { Op } from 'sequelize';
import { EditalWorkflowService } from '../use-case/edital-workflow.service.js';
import { EditalInsightsService } from '../use-case/edital-insights.service.js';

test('edital phase, literal name and open registration filters reach SQL before count and pagination', async () => {
  let query: any;
  const now = new Date('2026-11-03T01:00:00Z'); // Still November 2 in Brasília.
  const db: any = { Edital: { findAndCountAll: async (q: any) => { query = q; return { rows: [], count: 41 }; } } };
  const result = await new EditalWorkflowService(db, undefined, () => now).list({ search: 'Teste_%', fase: 'rascunho', inscricoes_abertas: true, page: 2, limit: 20 });
  assert.equal(result.count, 41);
  assert.equal(query.offset, 40);
  assert.equal(query.limit, 20);
  assert.equal(query.where.name[Op.like], '%Teste\\_\\%%');
  assert.equal(query.where.fase, 'rascunho');
  assert.equal(query.where[Op.and].fase, 'aberto'); // Intersection, never silently overrides phase.
  assert.equal(query.where[Op.and].inscricoes_inicio[Op.lte], now);
  assert.equal(query.where[Op.and].inscricoes_fim[Op.gte], now);
  assert.equal(query.where[Op.and].data_vencimento[Op.gte], '2026-11-02T00:00:00-03:00');
});

test('ended statuses are grouped in SQL and never contaminate the inscription registry', async () => {
  const queries: any[] = [];
  const findAndCountAll = async (q: any) => { queries.push(q); return { rows: [], count: 30 }; };
  const db: any = { Edital: { findByPk: async () => ({}) }, BolsistasEdital: { findAndCountAll }, FtInscricao: { findAndCountAll } };
  const service = new EditalInsightsService(db);
  const result = await service.people('edital', { grupo_status: 'encerrados', page: 1, limit: 20 }, false);
  assert.equal(result.count, 30);
  assert.deepEqual(queries[0].where[Op.and][0].status[Op.in], ['concluido', 'cancelado', 'expirado', 'inativo']);
  assert.equal(queries[0].offset, 20);
  await service.people('edital', { grupo_status: 'encerrados' }, true);
  assert.equal(queries[1].where[Op.and], undefined);
  assert.equal(queries[0].distinct, true);
});
