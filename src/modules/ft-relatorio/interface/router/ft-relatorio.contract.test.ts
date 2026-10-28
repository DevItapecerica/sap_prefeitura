import assert from 'node:assert/strict';
import test from 'node:test';
import Fastify from 'fastify';
import AuthMiddleware from '../../../auth/auth.middleware.js';
import { FtRelatorioRouter } from './ft-relatorio.router.js';
test('preview HTTP reuses export permission, paginated contract and does not disclose unlisted data', async () => {
  const original = AuthMiddleware.verifyJWT;
  AuthMiddleware.verifyJWT = async (r: any) => { r.user = { id: 123 }; };
  let allowed = false;
  const actions: string[] = [];
  const app = Fastify();
  app.decorate('permissionAuthorizer', { authorize: async (_id: number, _module: string, action: string) => {
    actions.push(action);
    if (!allowed) throw Object.assign(new Error('Denied'), { statusCode: 403 });
  } });
  const controller = new Proxy({}, { get: () => async (_r: any, reply: any) => reply.send({
    fechamento: { situacao: 'aberta' }, pode_fechar: true, periodo: { data_inicio: '2026-10-01', data_fim: '2026-10-31' },
    rows: [{ nome: 'Pessoa', cpf: '01234567890', conta: '0001', valor_liquido: 900, alertas: [], private_field: 'hidden' }],
    count: 40, resumo: { participantes: 39, pagamentos: 40, valor_liquido: 36000, com_alertas: 0 }, versao: 'a'.repeat(64),
  }) }) as any;
  await app.register(FtRelatorioRouter, { prefix: '/relatorio', controller });
  const path = '/relatorio/edital/3739d774-6de0-4f48-8dda-1b43414b70ef/previa';
  try {
    assert.equal((await app.inject(path)).statusCode, 403);
    assert.equal(actions.at(-1), 'gerar_relatorio_edital');
    allowed = true;
    const response = await app.inject(path + '?page=1&limit=20&data_inicio=2026-10-01&data_fim=2026-10-31');
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json().rows[0].conta, '0001');
    assert.equal(response.json().count, 40);
    assert.equal(response.json().rows[0].private_field, undefined);
    assert.equal((await app.inject(path + '?limit=51')).statusCode, 400);
    assert.equal((await app.inject(path + '?page=-1')).statusCode, 400);
  } finally { await app.close(); AuthMiddleware.verifyJWT = original; }
});

test('monthly close requires both permissions and a verified month/version', async () => {
  const original = AuthMiddleware.verifyJWT;
  AuthMiddleware.verifyJWT = async (r: any) => { r.user = { id: 123 }; };
  const grants = new Set<string>(); let called = 0;
  const app = Fastify();
  app.decorate('permissionAuthorizer', { authorize: async (_id: number, _module: string, action: string) => {
    if (!grants.has(action)) throw Object.assign(new Error('Denied'), { statusCode: 403 });
  } });
  const controller = new Proxy({}, { get: () => async (_request: any, reply: any) => { called++; return reply.send({ situacao: 'fechada', private_field: 'hidden' }); } }) as any;
  await app.register(FtRelatorioRouter, { prefix: '/relatorio', controller });
  const url = '/relatorio/edital/3739d774-6de0-4f48-8dda-1b43414b70ef/fechamento';
  const payload = { mes: '2026-10', versao: 'a'.repeat(64) };
  try {
    for (const action of ['gerar_relatorio_edital', 'fechar_folha_pagamento']) {
      grants.clear(); grants.add(action);
      assert.equal((await app.inject({ method: 'POST', url, payload })).statusCode, 403);
    }
    assert.equal(called, 0);
    grants.add('gerar_relatorio_edital'); grants.add('fechar_folha_pagamento');
    assert.equal((await app.inject({ method: 'POST', url, payload: { mes: '2026-10' } })).statusCode, 400);
    assert.equal((await app.inject({ method: 'POST', url, payload: { ...payload, mes: '2026-13' } })).statusCode, 400);
    const response = await app.inject({ method: 'POST', url, payload });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json().situacao, 'fechada'); assert.equal(response.json().private_field, undefined);
    assert.equal((await app.inject(url + '?mes=2026-10')).statusCode, 200);
    assert.equal((await app.inject(url)).statusCode, 400);
  } finally { await app.close(); AuthMiddleware.verifyJWT = original; }
});
