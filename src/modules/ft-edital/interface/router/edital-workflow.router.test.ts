import assert from 'node:assert/strict';
import test from 'node:test';
import Fastify from 'fastify';
import AuthMiddleware from '../../../auth/auth.middleware.js';
import { EditalWorkflowRouter } from './edital-workflow.router.js';
import type { EditalWorkflowService } from '../../application/use-case/edital-workflow.service.js';

test('workflow HTTP enforces permission per transition, UUID scope, bank fields and strict declarations', async () => {
  const original = AuthMiddleware.verifyJWT;
  AuthMiddleware.verifyJWT = async (r: any) => { r.user = { id: 123 }; };
  const app = Fastify();
  let denied = true;
  let deniedAction = '';
  const calls: any[] = [];
  app.decorate('permissionAuthorizer', { authorize: async (id: number, module: string, action: string) => {
    calls.push([id, module, action]);
    if (denied || deniedAction === action) throw Object.assign(new Error('Denied'), { statusCode: 403 });
  } });
  const service = { detail: async () => ({ idade_maxima: null }), create: async (...args: any[]) => { calls.push(args); return args[0]; }, call: async (...args: any[]) => { calls.push(args); return { status: 'convocado' }; }, pdfParticipant: async () => { throw Object.assign(new Error('Participacao nao ativada'), { statusCode: 409 }); }, transition: async (...args: any[]) => { calls.push(args); return { status: 'ativo' }; }, register: async (...args: any[]) => { calls.push(args); return { status: 'inscrito' }; } } as unknown as EditalWorkflowService;
  await app.register(EditalWorkflowRouter, { prefix: '/edital', service, audit: async () => {} });
  const id = '3739d774-6de0-4f48-8dda-1b43414b70ef';
  const path = '/edital/' + id + '/participacoes/' + id + '/ativar';
  const body = { data_inicio: '2026-10-22', payment_info: { bco: '001', ag: '1234', dig_ag: '0', conta: '12345', dig_conta: '9' } };
  try {
    assert.equal((await app.inject({ method: 'POST', url: path, payload: body })).statusCode, 403);
    assert.deepEqual(calls[0], [123, 'ft', 'ativar_participacao']);
    denied = false;
    for (const payload of [{ data_inicio: '2026-10-22' }, { ...body, payment_info: { ...body.payment_info, conta: 123 } }, { ...body, user_id: 1 }]) assert.equal((await app.inject({ method: 'POST', url: path, payload })).statusCode, 400);
    assert.equal((await app.inject({ method: 'POST', url: path, payload: body })).statusCode, 200);
    assert.equal(calls.at(-1)[4].id, 123);
    const extensionPath = '/edital/' + id + '/participacoes/' + id + '/prorrogar';
    deniedAction = 'prorrogar_vinculo';
    assert.equal((await app.inject({ method: 'POST', url: extensionPath, payload: {} })).statusCode, 403);
    deniedAction = '';
    const beforeExtension = calls.length;
    for (const payload of [{ meses: 1 }, { meses: 3 }, { data_fim: '2026-12-31' }]) assert.equal((await app.inject({ method: 'POST', url: extensionPath, payload })).statusCode, 400);
    assert.equal(calls.length, beforeExtension);
    assert.equal((await app.inject({ method: 'POST', url: extensionPath, payload: {} })).statusCode, 200);
    assert.equal(calls.at(-1)[2], 'prorrogar');
    assert.deepEqual(calls.at(-1)[3], {});
    const respostas = { desempregado: true, possui_renda: false, recebe_previdencia: false, inicio_residencia: '2020-01-01', vulnerabilidade_atestada: true, beneficiario_familiar: false, aceite: true };
    const register = '/edital/' + id + '/inscricoes';
    assert.equal((await app.inject({ method: 'POST', url: register, payload: { municipe_uuid: id, respostas } })).statusCode, 200);
    assert.equal((await app.inject({ method: 'POST', url: register, payload: { municipe_uuid: id, respostas: { ...respostas, desempregado: 'true' } } })).statusCode, 400);
    assert.equal((await app.inject({ method: 'POST', url: register + '/encaixe', payload: { municipe_uuid: id, respostas } })).statusCode, 400);
    const exceptionPayload = { municipe_uuid: id, respostas, motivo: 'Autorizado excepcionalmente' };
    for (const flag of ['exception', 'excecao_em', 'excecao_autor_id']) assert.equal((await app.inject({ method: 'POST', url: register, payload: { ...exceptionPayload, [flag]: true } })).statusCode, 400);
    deniedAction = 'cadastrar_inscricao_excecao';
    assert.equal((await app.inject({ method: 'POST', url: register + '/excecao', payload: exceptionPayload })).statusCode, 403);
    deniedAction = '';
    assert.equal((await app.inject({ method: 'POST', url: register + '/excecao', payload: { municipe_uuid: id, respostas } })).statusCode, 400);
    assert.equal((await app.inject({ method: 'POST', url: register + '/excecao', payload: exceptionPayload })).statusCode, 200);
    assert.equal(calls.at(-1)[4], true);
    assert.equal(calls.at(-1)[2].id, 123);
    const callPath = register + '/' + id + '/convocar-excecao';
    const allocation = { pagador_id: id, turno_id: id, local: 'Secretaria de Obras', data_inicio: '2026-10-22' };
    for (const local of ['', '   ', 'x'.repeat(256)]) assert.equal((await app.inject({ method: 'POST', url: callPath, payload: { ...allocation, local, motivo: 'Autorizado' } })).statusCode, 400);
    assert.equal((await app.inject({ method: 'POST', url: callPath, payload: { ...allocation, local_id: id, motivo: 'Autorizado' } })).statusCode, 400);
    deniedAction = 'convocar_inscrito_excecao';
    assert.equal((await app.inject({ method: 'POST', url: callPath, payload: { ...allocation, motivo: 'Autorizado' } })).statusCode, 403);
    deniedAction = '';
    assert.equal((await app.inject({ method: 'POST', url: callPath, payload: allocation })).statusCode, 400);
    assert.equal((await app.inject({ method: 'POST', url: callPath, payload: { ...allocation, motivo: 'Autorizado' } })).statusCode, 200);
    assert.equal(calls.at(-1)[4], true);
    assert.equal(calls.at(-1)[3].id, 123);
    assert.equal((await app.inject({ method: 'POST', url: register + '/' + id + '/convocar', payload: { ...allocation, exception: true } })).statusCode, 400);
    assert.equal((await app.inject('/edital/' + id)).json().idade_maxima, null);
    assert.equal((await app.inject({ method: 'POST', url: '/edital/not-a-uuid/inscricoes', payload: { municipe_uuid: id, respostas } })).statusCode, 400);
    assert.equal((await app.inject('/edital/' + id + '/participacoes/' + id + '/espelho-ponto?mes=2026-10')).statusCode, 409);
    assert.equal((await app.inject('/edital/' + id + '/participacoes/' + id + '/folha-presenca')).statusCode, 400);
  } finally { await app.close(); AuthMiddleware.verifyJWT = original; }
});


test('prevalidations and history require operation permissions and never write business audit', async () => {
  const original = AuthMiddleware.verifyJWT;
  AuthMiddleware.verifyJWT = async (r: any) => { r.user = { id: 123 }; };
  const app = Fastify();
  let allowed = false, audits = 0;
  const permissions: string[] = [];
  app.decorate('permissionAuthorizer', { authorize: async (_id: number, _module: string, action: string) => {
    permissions.push(action);
    if (!allowed) throw Object.assign(new Error('Denied'), { statusCode: 403 });
  } });
  const calls: any[] = [];
  const service = {
    prevalidate: async (...args: any[]) => { calls.push(args); return { permitido: false, pendencias: [{ codigo: 'VAGAS', campo: null, mensagem: 'Edital sem vagas' }], data_referencia: '2026-10-27' }; },
    history: async () => ({ rows: [], count: 0 }),
  } as unknown as EditalWorkflowService;
  await app.register(EditalWorkflowRouter, { prefix: '/edital', service, audit: async () => { audits++; } });
  const id = '3739d774-6de0-4f48-8dda-1b43414b70ef';
  try {
    for (const [path, action, operation, mode] of [
      ['inscricao', 'cadastrar_inscricao', 'inscricao', 'normal'],
      ['inscricao-encaixe', 'encaixar_inscricao', 'inscricao', 'encaixe'],
      ['inscricao-excecao', 'cadastrar_inscricao_excecao', 'inscricao', 'excecao'],
      ['convocacao', 'convocar_inscrito', 'convocacao', 'normal'],
      ['convocacao-excecao', 'convocar_inscrito_excecao', 'convocacao', 'excecao'],
      ['ativacao', 'ativar_participacao', 'ativacao', 'normal'],
      ['prorrogacao', 'prorrogar_vinculo', 'prorrogacao', 'normal'],
    ]) {
      const url = '/edital/' + id + '/prevalidacoes/' + path;
      allowed = false;
      assert.equal((await app.inject({ method: 'POST', url, payload: {} })).statusCode, 403);
      assert.equal(permissions.at(-1), action);
      allowed = true;
      const response = await app.inject({ method: 'POST', url, payload: {} });
      assert.equal(response.statusCode, 200, response.body);
      assert.equal(response.json().pendencias[0].codigo, 'VAGAS');
      assert.equal(calls.at(-1)[1], operation);
      assert.equal(calls.at(-1)[3], mode);
      assert.equal((await app.inject({ method: 'POST', url, payload: { bypass: true } })).statusCode, 400);
    }
    for (const [kind, action] of [['inscricoes', 'consultar_inscricoes'], ['participacoes', 'consultar_vinculos']]) {
      allowed = false;
      const url = '/edital/' + id + '/' + kind + '/' + id + '/historico';
      assert.equal((await app.inject(url)).statusCode, 403);
      assert.equal(permissions.at(-1), action);
      allowed = true;
      assert.equal((await app.inject(url)).statusCode, 200);
    }
    assert.equal(audits, 0);
  } finally { await app.close(); AuthMiddleware.verifyJWT = original; }
});
