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
